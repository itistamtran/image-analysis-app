import os
import io
import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
import zipfile
import gdown


# Model directory and zip path
model_dir = "backend/model/vit_brain_tumor_best_model"
model_zip = "backend/model/vit_brain_tumor_best_model.zip"

# Google Drive direct download link
url = "https://drive.google.com/uc?export=download&id=1LUyW4-gluhJoMZfHQxep8P-H85DUd7Wt"

# Only download if not exist
if not os.path.exists(model_dir):
    os.makedirs("backend/model", exist_ok=True)
    print("Model not found, downloading from Google Drive...")

    file_id = "1LUyW4-gluhJoMZfHQxep8P-H85DUd7Wt"
    gdown.download(f"https://drive.google.com/uc?id={file_id}", model_zip, quiet=False)

    print("Extracting model...")
    with zipfile.ZipFile(model_zip, 'r') as zip_ref:
        zip_ref.extractall("backend/model/")

    print("Model downloaded and extracted successfully!")

# Load model after download
model = ViTForImageClassification.from_pretrained(model_dir)
processor = ViTImageProcessor.from_pretrained(model_dir)
model.eval()

# Move model to device (use CPU on Railway to avoid OOM)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Class names
CLASS_NAMES = ['glioma', 'meningioma', 'no_tumor', 'pituitary', 'unknown']

# Prediction function
def predict_image(file_bytes, debug=False):
    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        inputs = processor(images=image, return_tensors="pt").to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=-1).cpu().numpy()[0]

        predicted_idx = probs.argmax()
        confidence = float(probs[predicted_idx])
        predicted_class = CLASS_NAMES[predicted_idx]

        if debug:
            print("Prediction:", predicted_class)
            print("Confidence:", confidence)
            print("Probabilities:", probs.tolist())

        if confidence < 0.7:
            return 'LowConfidence', confidence, probs.tolist()

        return predicted_class, confidence, probs.tolist()

    except Exception as e:
        if debug:
            print("Prediction failed:", e)
        return 'Error', None, None
