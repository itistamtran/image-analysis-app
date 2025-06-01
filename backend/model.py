import os
import io
import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor

# Load model directly from Hugging Face
model_id = "itistamtran/vit_brain_tumor_best_model"

# Load model + processor
model = ViTForImageClassification.from_pretrained(model_id)
processor = ViTImageProcessor.from_pretrained(model_id)
model.eval()

# Move model to device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Class name
CLASS_NAMES = ['glioma', 'meningioma', 'no_tumor', 'pituitary', 'unknown']

# Prediction function
def predict_image(file_bytes, debug=False):
    try:
        # Load image from bytes
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        
        # ViT processor handle resizing, normalization, etc
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

        # Handle uncertain predictions
        if confidence < 0.7:
            return 'LowConfidence', confidence, probs.tolist()

        return predicted_class, confidence, probs.tolist()

    except Exception as e:
        if debug:
            print("Prediction failed:", e)
        return 'Error', None, None
