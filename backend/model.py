import numpy as np
import tensorflow as tf
from PIL import Image, ImageOps
import io

# Load the trained model
model = tf.keras.models.load_model("model/brain_tumor_cnn_multiclass_model.keras")

# Define class labels in the correct order
CLASS_NAMES = ['No Tumor', 'Glioma', 'Meningioma', 'Pituitary']

# --- MRI Validity Check ---
def is_valid_mri(image: Image.Image) -> bool:
    np_img = np.array(image)

    # Check size
    if np_img.shape[:2] != (240, 240):
        return False

    # Check grayscale similarity if 3 channels
    if len(np_img.shape) == 3 and np_img.shape[2] == 3:
        # Validate approximate grayscale (R ≈ G ≈ B)
        if not (
            np.allclose(np_img[:, :, 0], np_img[:, :, 1], atol=15) and
            np.allclose(np_img[:, :, 1], np_img[:, :, 2], atol=15)
        ):
            return False

    return True

def predict_image(file_bytes, debug=False):
    try:
        # Load and preprocess the image
        image = Image.open(io.BytesIO(file_bytes)).convert('RGB')
        image = ImageOps.autocontrast(image)

        # Simulate grayscale in RGB
        image = image.convert('L').convert('RGB')  # simulate grayscale look
        # Ensure the image is in RGB format
        if image.mode != 'RGB':
            image = image.convert('RGB')
    
        # Center crop to square before resizing
        width, height = image.size
        min_dim = min(width, height)
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        image = image.crop((left, top, right, bottom))

        image = image.resize((240, 240))

        if debug:
            print("Image shape after resize:", image.size)
            
        #if not is_valid_mri(image):
        if not is_valid_mri(image):
            if debug:
                print("Invalid MRI: grayscale similarity or size check failed.")
            return 'Unknown', None, None
    
        print("Original size:", image.size)
        print("After crop and resize:", image.size)
        print("Checking grayscale similarity...")
    
        # Convert to array and normalize
        image_array = tf.keras.utils.img_to_array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        prediction = model.predict(image_array)
        confidence = float(np.max(prediction))
        predicted_class = CLASS_NAMES[np.argmax(prediction)]

        if debug:
            print("Prediction:", predicted_class)
            print("Confidence:", confidence)
    
        # Confidence threshold
        if confidence < 0.7:
            return 'Unknown', confidence, prediction.tolist()[0]  

        return predicted_class, confidence, prediction.tolist()[0]
    
    except Exception as e:
        if debug:
            print("Prediction failed:", e)
        return 'Error', None, None

