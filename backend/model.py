import io
from PIL import Image
from transformers import AutoModelForImageClassification, AutoImageProcessor, ViTForImageClassification, ViTImageProcessor
import zipfile
import gdown
import torch
import cv2
import os
import numpy as np
from pytorch_grad_cam import GradCAM, EigenCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.reshape_transforms import vit_reshape_transform
import firebase_admin
from firebase_admin import storage, credentials
import json
from huggingface_hub import login
import uuid

# Login to Hugging Face using token
model_name = "itistamtran/vit_brain_tumor_best_model"
hf_token = os.getenv("HUGGINGFACE_TOKEN")

print(f"Downloading model from Hugging Face: {model_name}")

try:
    print(f"Downloading model from Hugging Face: {model_name}")
    model = AutoModelForImageClassification.from_pretrained(
        model_name, token=hf_token)
    processor = AutoImageProcessor.from_pretrained(
        model_name, token=hf_token)
    print("✅ Model loaded successfully from Hugging Face.")

except Exception as e:
    print(f"❌ Failed to load from Hugging Face: {e}")
    print("Trying fallback to local or Google Drive...")

    BASE_DIR = os.path.dirname(__file__)
    MODEL_FOLDER = os.path.join(BASE_DIR, "ml_model")
    MODEL_ZIP = os.path.join(MODEL_FOLDER, "vit_brain_tumor_best_model.zip")
    MODEL_DIR = os.path.join(MODEL_FOLDER, "vit_brain_tumor_best_model")
    GDRIVE_URL = "https://drive.google.com/uc?id=1LUyW4-gluhJoMZfHQxep8P-H85DUd7Wt"

    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_FOLDER, exist_ok=True)
        print("Downloading model from Google Drive...")
        gdown.download(GDRIVE_URL, MODEL_ZIP, quiet=False)

        print("Extracting model...")
        with zipfile.ZipFile(MODEL_ZIP, "r") as zip_ref:
            zip_ref.extractall(MODEL_FOLDER)
        print("✅ Model downloaded and extracted successfully.")

    model = ViTForImageClassification.from_pretrained(MODEL_DIR)
    processor = ViTImageProcessor.from_pretrained(MODEL_DIR)
    print("✅ Model loaded from local folder.")


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


def predict_image_with_heatmap(file_bytes, debug=False):
    import io
    from PIL import Image
    import torch
    import uuid

    try:
        # Convert bytes to PIL image
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")

        # Save a temporary file because GradCAM expects a file path
        temp_filename = f"{uuid.uuid4().hex}_temp.png"
        temp_path = os.path.join(os.getcwd(), "static", "uploads", "mri", temp_filename)
        image.save(temp_path)

        # Run prediction
        inputs = processor(images=image, return_tensors="pt").to(device)

        with torch.no_grad():
            outputs = model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1).cpu().numpy()[0]

        predicted_idx = probs.argmax()
        confidence = float(probs[predicted_idx])
        predicted_class = CLASS_NAMES[predicted_idx]

        # If model not confident enough return no heatmap
        if confidence < 0.6:
            print("⚠ Low confidence, skipping heatmap")
            return predicted_class, confidence, None

        # ---- Generate Heatmap ----
        heatmap_path = generate_vit_gradcam(
            model,
            temp_path,        # NOTE: using file path, not PIL
            processor,
            device
        )

        # Load heatmap output into PIL object
        heatmap_img = Image.open(heatmap_path).convert("RGB")

        print("🔥 Heatmap generated successfully")

        # Optionally delete temp file
        try:
            os.remove(temp_path)
        except:
            pass

        return predicted_class, confidence, heatmap_img

    except Exception as e:
        print("❌ Heatmap generation failed:", e)
        return predicted_class, confidence, None



# ---------- helpers function to generate grad cam heatmap ----------

def _get_vit_target_layers(hf_vit_model):
    """
    Try several reliable hooks for Hugging Face ViTForImageClassification.
    Returns a list with a single nn.Module to use as target layer.
    """
    last = hf_vit_model.vit.encoder.layer[-1]
    for path in [
        "layernorm_after",
        "layernorm_before",
        "output.LayerNorm",
        "layernorm",  # some variants
    ]:
        try:
            mod = eval(f"last.{path}")
            return [mod]
        except Exception:
            pass
    # safe fallback
    return [last.output.dense]


class ViTWrapper(torch.nn.Module):
    """
    Wraps a HF ViT so forward(x) returns logits tensor.
    Grad-CAM will call this with only the pixel tensor.
    """

    def __init__(self, vit_model):
        super().__init__()
        self.vit_model = vit_model

    def forward(self, x):
        out = self.vit_model(pixel_values=x)
        return out.logits if hasattr(out, "logits") else out

# ---------- main function generate grad cam heatmap ----------


def generate_vit_gradcam(model, image_path, processor, device, save_path=None):
    """Generate and save a Grad-CAM heatmap overlay for ViT models."""
    model.eval()

    # --- Load image (keep original size for visualization) ---
    pil_img = Image.open(image_path).convert("RGB")
    orig_w, orig_h = pil_img.size

    # --- Preprocess for model (resized to 224x224 for consistency) ---
    inputs = processor(images=pil_img, return_tensors="pt")
    img_tensor = inputs["pixel_values"].to(device)
    if img_tensor.ndim == 3:
        img_tensor = img_tensor.unsqueeze(0)

    # --- Model setup ---
    wrapped = ViTWrapper(model).to(device)
    target_layers = _get_vit_target_layers(model)

    # --- GradCAM setup ---
    cam = GradCAM(model=wrapped, target_layers=target_layers,
                  reshape_transform=vit_reshape_transform)

    # --- Predict and select class ---
    outputs = model(**{k: v.to(device) for k, v in inputs.items()})
    logits = outputs.logits if hasattr(outputs, "logits") else outputs
    pred_class = int(torch.argmax(logits, dim=-1).item())
    targets = [ClassifierOutputTarget(pred_class)]

    # --- Compute GradCAM / fallback EigenCAM ---
    try:
        grayscale_cam = cam(input_tensor=img_tensor, targets=targets)[0, :]
        if grayscale_cam.std() < 1e-5:
            raise ValueError("Flat CAM detected.")
    except Exception as e:
        print("[WARN] GradCAM failed, switching to EigenCAM:", e)
        cam = EigenCAM(model=wrapped, target_layers=target_layers,
                       reshape_transform=vit_reshape_transform)
        grayscale_cam = cam(input_tensor=img_tensor, targets=targets)[0, :]

    # --- Normalize ---
    grayscale_cam = (grayscale_cam - grayscale_cam.min()) / \
        (grayscale_cam.max() - grayscale_cam.min() + 1e-8)

    # --- Resize CAM to original aspect ratio (no stretch) ---
    cam_resized = cv2.resize(
        grayscale_cam.astype(np.float32), (orig_w, orig_h))

    # --- Convert images for overlay ---
    img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    heatmap = np.uint8(255 * cam_resized)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    # --- Blend (overlay) ---
    overlay = cv2.addWeighted(img_bgr, 0.65, heatmap_color, 0.35, 0)

    # --- Save results ---
    if save_path is None:
        root, _ = os.path.splitext(image_path)
        save_path = f"{root}_vit_gradcam.jpg"

    cv2.imwrite(save_path, overlay)
    cv2.imwrite(save_path.replace(".jpg", "_heatmap_only.jpg"), heatmap_color)

    print(f"✅ CAM saved at {save_path} (class={pred_class})")

    # --- Upload to Firebase Storage ---
    try:
        # Initialize Firebase only once
        if not firebase_admin._apps:
            firebase_key_data = os.getenv("FIREBASE_SERVICE_ACCOUNT")
            if not firebase_key_data:
                raise ValueError(
                    "FIREBASE_SERVICE_ACCOUNT environment variable not set")

            cred_dict = json.loads(firebase_key_data)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred, {
                "storageBucket": "medscanai-tam.appspot.com"
            })

        bucket = storage.bucket()
        filename = os.path.basename(save_path)
        blob = bucket.blob(f"heatmaps/{filename}")
        blob.upload_from_filename(save_path)
        blob.make_public()
        heatmap_url = blob.public_url

        print(f"✅ Uploaded heatmap to Firebase: {heatmap_url}")

        try:
            os.remove(save_path)
        except Exception:
            pass

        return heatmap_url

    except Exception as e:
        print("[WARN] Firebase upload failed:", e)
        return save_path
