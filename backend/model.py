import io
from PIL import Image
from transformers import AutoModelForImageClassification, AutoImageProcessor
import torch
import cv2
import os
import numpy as np
from pytorch_grad_cam import GradCAM, EigenCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
import firebase_admin
from firebase_admin import storage, credentials
import json
import uuid
import time

MODEL_REPO = "itistamtran/vit_brain_tumor_multiclass_v2"

print(f"🚀 Loading model from Hugging Face: {MODEL_REPO}")

# Load model with optimizations
model = AutoModelForImageClassification.from_pretrained(
    MODEL_REPO,
    torch_dtype=torch.float32,
    low_cpu_mem_usage=True,
)
processor = AutoImageProcessor.from_pretrained(MODEL_REPO)

CLASS_NAMES = model.config.id2label

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)
model.eval()

# Set these at module level for optimization
torch.set_grad_enabled(False)
torch.set_num_threads(2)

print(f"✅ Model ready on device: {device}")


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


# ---------- helpers function to generate grad cam heatmap ----------

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


def _get_vit_target_layers(hf_vit_model):
    """
    Target layer for ViT Grad-CAM:
    use the output of the last encoder block,
    which contains spatial token embeddings.
    """
    last_block = hf_vit_model.vit.encoder.layer[-1]
    return [last_block.output]


def vit_reshape_transform(hidden_states):
    B, N, C = hidden_states.shape
    hidden_states = hidden_states[:, 1:, :]   # remove CLS
    grid_size = int((N - 1) ** 0.5)

    if grid_size * grid_size != (N - 1):
        patch = 16
        img_size = model.config.image_size
        grid_size = img_size // patch

    hidden_states = hidden_states.permute(0, 2, 1)
    hidden_states = hidden_states.reshape(B, C, grid_size, grid_size)
    return hidden_states


# ---------- GRAD-CAM MAIN FUNCTION ----------

def generate_vit_gradcam(model, image_path, processor, device, save_path=None):
    start = time.time()
    model.eval()

    pil_img = Image.open(image_path).convert("RGB")
    print(f"Heatmap: Image loaded in {time.time() - start:.2f}s")

    step = time.time()
    inputs = processor(images=pil_img, return_tensors="pt")
    img_tensor = inputs["pixel_values"].to(device)
    if img_tensor.ndim == 3:
        img_tensor = img_tensor.unsqueeze(0)
    print(f"Heatmap: Preprocessing took {time.time() - step:.2f}s")

    img_tensor.requires_grad_(True)

    step = time.time()
    wrapped = ViTWrapper(model).to(device)
    target_layers = _get_vit_target_layers(model)
    print(">>> Using target layer:", target_layers[0])
    print(f"Heatmap: Model setup took {time.time() - step:.2f}s")

    with torch.enable_grad():
        step = time.time()
        cam = GradCAM(
            model=wrapped,
            target_layers=target_layers,
            reshape_transform=vit_reshape_transform,
        )

        outputs = model(**{k: v.to(device) for k, v in inputs.items()})
        logits = outputs.logits if hasattr(outputs, "logits") else outputs
        pred_class = int(torch.argmax(logits, dim=-1).item())
        targets = [ClassifierOutputTarget(pred_class)]
        print(f"Heatmap: Prediction took {time.time() - step:.2f}s")

        step = time.time()
        try:
            grayscale_cam = cam(input_tensor=img_tensor, targets=targets)[0, :]
            if grayscale_cam.std() < 1e-5:
                raise ValueError("Flat CAM detected.")
        except Exception as e:
            print("[WARN] GradCAM failed, switching to EigenCAM:", e)
            cam = EigenCAM(
                model=wrapped,
                target_layers=target_layers,
                reshape_transform=vit_reshape_transform,
            )
            grayscale_cam = cam(input_tensor=img_tensor, targets=targets)[0, :]

    print(f"Heatmap: CAM computation took {time.time() - step:.2f}s")

    grayscale_cam = grayscale_cam - grayscale_cam.min()
    grayscale_cam = grayscale_cam / (grayscale_cam.max() + 1e-8)

    cam_resized = cv2.resize(grayscale_cam, (224, 224))

    img_224 = pil_img.resize((224, 224))
    img_bgr = cv2.cvtColor(np.array(img_224), cv2.COLOR_RGB2BGR)

    heatmap = np.uint8(255 * cam_resized)
    heatmap_color = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    overlay = cv2.addWeighted(img_bgr, 0.55, heatmap_color, 0.45, 0)

    if save_path is None:
        root, _ = os.path.splitext(image_path)
        save_path = f"{root}_vit_gradcam.jpg"

    step = time.time()
    cv2.imwrite(save_path, overlay)
    print(f"Heatmap: Save to disk took {time.time() - step:.2f}s")
    print(f"CAM generation total: {time.time() - start:.2f}s (class={pred_class})")

    # --- Try Firebase upload ---
    try:
        if not firebase_admin._apps:
            firebase_key_data = os.getenv("FIREBASE_SERVICE_ACCOUNT")
            if firebase_key_data:
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
        print(f"[INFO] Firebase upload skipped: {e}")

    # Return local path if Firebase failed
    print(f"✅ Grad-CAM done => {save_path}")
    return save_path


def predict_image_with_heatmap(file_bytes, debug=False):
    """Optimized prediction with detailed timing"""
    total_start = time.time()
    temp_path = None
    
    try:
        # 1. Load image
        step = time.time()
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        print(f"⏱️ Image loaded in {time.time() - step:.2f}s")

        # 2. Save temporary file for GradCAM
        step = time.time()
        temp_filename = f"{uuid.uuid4().hex}_temp.png"
        temp_path = os.path.join(os.getcwd(), "static", "uploads", "mri", temp_filename)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        image.save(temp_path)
        print(f"⏱️ Temp file saved in {time.time() - step:.2f}s")

        # 3. Run prediction
        step = time.time()
        inputs = processor(images=image, return_tensors="pt").to(device)

        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1).cpu().numpy()[0]

        predicted_idx = probs.argmax()
        confidence = float(probs[predicted_idx])
        predicted_class = CLASS_NAMES[predicted_idx]
        print(f"⏱️ Prediction took {time.time() - step:.2f}s - Result: {predicted_class} ({confidence:.2%})")

        # 4. Generate heatmap only if confidence is high enough
        heatmap_img = None
        if confidence >= 0.6:
            try:
                step = time.time()
                heatmap_path = generate_vit_gradcam(
                    model,
                    temp_path,
                    processor,
                    device
                )
                print(f"⏱️ Total heatmap generation: {time.time() - step:.2f}s")

                # Load heatmap output into PIL object (if it's a local path)
                if heatmap_path and not heatmap_path.startswith("http"):
                    heatmap_img = Image.open(heatmap_path).convert("RGB")
                    print("🔥 Heatmap generated successfully")
                else:
                    # Firebase URL was returned
                    print(f"🔥 Heatmap uploaded to: {heatmap_path}")

            except Exception as e:
                print(f"❌ Heatmap generation failed: {e}")
        else:
            print(f"⚠️ Low confidence ({confidence:.2%}), skipping heatmap")

        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

        print(f"✅ TOTAL prediction time: {time.time() - total_start:.2f}s")
        return predicted_class, confidence, heatmap_img

    except Exception as e:
        print(f"❌ Prediction failed after {time.time() - total_start:.2f}s: {e}")
        
        # Cleanup on error
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        
        raise