import os
import io
import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
import zipfile
import gdown
import cv2
import numpy as np
import gc


# --- Setup paths ---
BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "ml_model", "vit_brain_tumor_best_model")
MODEL_ZIP = os.path.join(BASE_DIR, "ml_model",
                         "vit_brain_tumor_best_model.zip")
MODEL_FOLDER = os.path.join(BASE_DIR, "ml_model")
GDRIVE_URL = "https://drive.google.com/uc?id=1LUyW4-gluhJoMZfHQxep8P-H85DUd7Wt"

# --- Download model if not present ---
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_FOLDER, exist_ok=True)
    print("Model not found, downloading from Google Drive...")

    gdown.download(GDRIVE_URL, MODEL_ZIP, quiet=False)

    print("Extracting model...")
    with zipfile.ZipFile(MODEL_ZIP, "r") as zip_ref:
        zip_ref.extractall(MODEL_FOLDER)

    print("Model downloaded and extracted successfully!")

# --- Check if model files exist ---
config_path = os.path.join(MODEL_DIR, "config.json")

# Sometimes extraction creates an extra nested folder
nested_dir = os.path.join(MODEL_DIR, "vit_brain_tumor_best_model")
if not os.path.exists(config_path) and os.path.exists(os.path.join(nested_dir, "config.json")):
    print("⚙️ Nested model folder detected, switching path...")
    MODEL_DIR = nested_dir

# --- Load model and processor ---
try:
    print(f"Loading model from: {MODEL_DIR}")
    model = ViTForImageClassification.from_pretrained(MODEL_DIR)
    processor = ViTImageProcessor.from_pretrained(MODEL_DIR)
    print("✅ Model loaded successfully.")
except Exception as e:
    print(f"❌ Failed to load model from {MODEL_DIR}: {e}")
    print("📦 Listing contents for debug:")
    for root, _, files in os.walk(MODEL_FOLDER):
        for file in files:
            print("   ", os.path.join(root, file))
    raise

# --- Device setup ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

CLASS_NAMES = ['glioma', 'meningioma', 'no_tumor', 'pituitary', 'unknown']


def predict_image(file_bytes, debug=False):
    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        inputs = processor(images=image, return_tensors="pt").to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(
                outputs.logits, dim=-1).cpu().numpy()[0]

        predicted_idx = probs.argmax()
        confidence = float(probs[predicted_idx])
        predicted_class = CLASS_NAMES[predicted_idx]

        if debug:
            print(f"Prediction: {predicted_class}, Confidence: {confidence}")

        if confidence < 0.7:
            return 'LowConfidence', confidence, probs.tolist()

        return predicted_class, confidence, probs.tolist()

    except Exception as e:
        if debug:
            print("Prediction failed:", e)
        return 'Error', None, None


def generate_vit_heatmap(model, image_path, processor, device, save_path=None):
    try:
        # Load and resize image
        img = Image.open(image_path).convert("RGB").resize((224, 224))
        inputs = processor(images=img, return_tensors="pt").to(device)

        # Forward pass (no attention extraction)
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            _ = torch.softmax(logits, dim=-1)

        # Simple pseudo heatmap (brightness-based)
        img_np = np.array(img)
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
        gray_norm = (gray - gray.min()) / (gray.max() - gray.min() + 1e-8)

        heatmap = cv2.applyColorMap(
            np.uint8(255 * gray_norm), cv2.COLORMAP_JET)
        overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

        # Save the heatmap
        if save_path is None:
            root, _ = os.path.splitext(image_path)
            save_path = f"{root}_vit_heatmap.jpg"

        cv2.imwrite(save_path, overlay)
        print(f"Lightweight heatmap saved at {save_path}")

        # Cleanup
        del img, inputs, outputs, logits, img_np, gray, gray_norm, heatmap, overlay
        gc.collect()
        torch.cuda.empty_cache() if torch.cuda.is_available() else None

        return save_path

    except Exception as e:
        print(f"❌ Heatmap generation failed: {e}")
        return None
