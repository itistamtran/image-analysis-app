import os
import io
import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
import zipfile
import gdown
import cv2
import numpy as np
import torch.nn.functional as F
from torchvision import transforms


# Model directory and zip path
model_dir = "backend/ml_model/vit_brain_tumor_best_model"
model_zip = "backend/ml_model/vit_brain_tumor_best_model.zip"

# Google Drive direct download link
url = "https://drive.google.com/uc?export=download&id=1LUyW4-gluhJoMZfHQxep8P-H85DUd7Wt"

# Only download if not exist
if not os.path.exists(model_dir):
    os.makedirs("backend/model", exist_ok=True)
    print("Model not found, downloading from Google Drive...")

    file_id = "1LUyW4-gluhJoMZfHQxep8P-H85DUd7Wt"
    gdown.download(
        f"https://drive.google.com/uc?id={file_id}", model_zip, quiet=False)

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
            probs = torch.nn.functional.softmax(
                logits, dim=-1).cpu().numpy()[0]

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


def generate_vit_heatmap(model, image_path, processor, device, save_path=None):
    # Load image
    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt").to(device)

    # Forward pass with attention
    outputs = model(**inputs, output_attentions=True)
    attentions = outputs.attentions  # (layers, batch, heads, tokens, tokens)

    # Average last layer attention across heads
    attn = attentions[-1][0].mean(0)  # shape: (tokens, tokens)

    # Drop CLS token and reshape to patch grid
    grid_size = int((attn.shape[0] - 1) ** 0.5)
    attn_map = attn[0, 1:].reshape(grid_size, grid_size).detach().cpu().numpy()
    attn_map = cv2.resize(attn_map, (224, 224))
    attn_map = attn_map / attn_map.max()

    # Overlay
    img_np = np.array(img.resize((224, 224)))
    heatmap = cv2.applyColorMap(np.uint8(255 * attn_map), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

    # --- Save ---
    if save_path is None:
        root, ext = os.path.splitext(image_path)
        save_path = f"{root}_vit_heatmap.jpg"

    cv2.imwrite(save_path, overlay)
    print(f" Heatmap saved at {save_path}")
    return save_path
