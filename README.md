# 🧠 MRI Brain Tumor Detection App

This is a full-stack web application that allows users to upload MRI brain images and receive diagnostic predictions using deep learning. The app supports multiclass classification (glioma, meningioma, pituitary, no_tumor, unknown) using pretrained ViT models.

---

## Project Demo

![MedScanAI Demo](frontend/public/medscanai-demo.gif)

---

## Features

- Upload MRI images through a web interface
- Predict tumor presence and type using a ViT model
- Display confidence score with brief diagnostic explanation
- (Coming Soon) Grad-CAM heatmap for interpretability
- All processing is done locally; images are not stored

---

## Project Structure

- `backend/` – Flask API backend
  - `model/` – Trained Keras model `.keras`
  - `app.py/` - Main Flask application
  - `requirements.txt` - Python dependencies
- `frontend/` - React frontend
  - `public/` - Public assets
  - `src/`
      - `assets/` - Icons, images, and other static assets
      - `components/` - Reusable UI components (Header, Footer, etc.)
      - `pages/` - # Route-level components (Home, Upload, Result, etc.)
- `notebooks/` – [Jupyter notebooks](https://github.com/itistamtran/cnn-brain-tumor-detection-binary-multiclass) for training, testing, and analysis
- Jupyter Notebook (Updated May 31, 2025)

---

## Model Overview

This project uses a convolutional neural network (CNN) to classify MRI brain scans into four categories:
- **Glioma**
- **Meningioma**
- **Pituitary Tumor**
- **No Tumor**

Images are preprocessed to grayscale (simulated RGB), center-cropped, resized to 240×240, and normalized to [0, 1].

## Model Update: Vision Transformer (ViT)

The brain tumor classification model has been upgraded to use Vision Transformer (ViT) architecture for better performance and scalability. This update provides users with more accurate predictions and improved generalization when classifying MRI brain tumor images.

Model Details
- Base Model: google/vit-base-patch16-224-in21k
- Fine-tuned On: Brain MRI dataset
- Supported Classes:

  - glioma
  - meningioma
  - no_tumor
  - pituitary
  - unknown

The updated ViT model allows for more robust tumor type prediction across multiple classes. It can handle both multi-class classification as well as unknown/unlabeled categories, providing better flexibility for real-world clinical or experimental data.

⚠️ A new version is in development to support an enhanced "Unknown" class for detecting invalid or non-MRI inputs (e.g., screenshots, illustrations, unrelated photos).
This feature helps filter out unsupported or irrelevant inputs and improve model safety in real-world deployments.

### Performance

Dataset	Accuracy:
- Training (final epoch)	~98.18%
- Validation/Test	~98.46%
- Validation Loss: 0.0849

The model demonstrates strong generalization without overfitting.

### Planned Features:

- Confusion matrix + precision/recall metrics
- Dual-model setup: `MRI vs. Not` → then tumor type

---

## Dataset Source

- [Kaggle: Brain MRI Images for Brain Tumor Detection](https://www.kaggle.com/datasets/navoneel/brain-mri-images-for-brain-tumor-detection)

---

## Author

**Tam Tran**  
