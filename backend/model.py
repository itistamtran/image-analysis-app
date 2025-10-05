import os
import io
import torch
from PIL import Image
from transformers import ViTForImageClassification, ViTImageProcessor
import zipfile
import gdown
import cv2
import numpy as np

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

# --- Load model and processor ---
try:
    model = ViTForImageClassification.from_pretrained(MODEL_DIR)
    processor = ViTImageProcessor.from_pretrained(MODEL_DIR)
    print("✅ Model loaded successfully.")
except Exception as e:
    raise RuntimeError(f"❌ Failed to load model from {MODEL_DIR}: {e}")

# --- Device setup ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

# --- Class labels ---
CLASS_NAMES = ['glioma', 'meningioma', 'no_tumor', 'pituitary', 'unknown']


# --- Prediction function ---
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


# --- Visualization (ViT attention heatmap) ---
def generate_vit_heatmap(model, image_path, processor, device, save_path=None):
    img = Image.open(image_path).convert("RGB")
    inputs = processor(images=img, return_tensors="pt").to(device)

    outputs = model(**inputs, output_attentions=True)
    attn = outputs.attentions[-1][0].mean(0)

    grid_size = int((attn.shape[0] - 1) ** 0.5)
    attn_map = attn[0, 1:].reshape(grid_size, grid_size).detach().cpu().numpy()
    attn_map = cv2.resize(attn_map, (224, 224))
    attn_map = attn_map / attn_map.max()

    img_np = np.array(img.resize((224, 224)))
    heatmap = cv2.applyColorMap(np.uint8(255 * attn_map), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

    if save_path is None:
        root, ext = os.path.splitext(image_path)
        save_path = f"{root}_vit_heatmap.jpg"

    cv2.imwrite(save_path, overlay)
    print(f"🔥 Heatmap saved at {save_path}")
    return save_path
