# 🧠 MRI Brain Tumor Detection App

This is a full-stack web application that allows users to upload MRI brain images and receive diagnostic predictions using deep learning. The app supports multiclass classification (glioma, meningioma, pituitary, no tumor) using pretrained CNN models.

---

## 🚀 Features

- 📤 Upload MRI images through a web interface
- 🧠 Predict tumor presence and type using a CNN model
- 📈 Display confidence score with brief diagnostic explanation
- 🖼️ (Coming Soon) Grad-CAM heatmap for interpretability
- 🔐 All processing is done locally; images are not stored

---

## 🧱 Project Structure

- `app/` – Flask or frontend code (React, etc.)
- `model/` – Trained Keras model `.keras`
- `notebooks/` – [Jupyter notebooks](https://github.com/itistamtran/cnn-brain-tumor-detection-binary-multiclass) for training, testing, and analysis
- `static/` – Assets like icons, images
- `templates/` – HTML templates for rendering results

---

## 🧠 Model Overview

This project uses a convolutional neural network (CNN) to classify MRI brain scans into four categories:
- **Glioma**
- **Meningioma**
- **Pituitary Tumor**
- **No Tumor**

Images are preprocessed to grayscale (simulated RGB), center-cropped, resized to 240×240, and normalized to [0, 1].

---

## 🧪 Model Details

- **Architecture**: Custom CNN with Conv2D → BatchNorm → ReLU blocks
- **Input Shape**: `(240, 240, 3)`
- **Loss**: `sparse_categorical_crossentropy`
- **Optimizer**: `Adam`
- **Framework**: TensorFlow / Keras
- **Data Split**:
  - 80% training
  - 20% testing
  - Internal validation from training set

---

## 🔭 Upcoming Improvements

A new version is in development to support an additional **"Unknown"** class for detecting invalid or non-MRI inputs (e.g., screenshots, unrelated photos).

### Planned Features:
- `unknown` class support
- Class balancing and targeted augmentation
- Confusion matrix + precision/recall metrics
- Dual-model setup: `MRI vs. Not` → then tumor type

---

## 📦 Dataset Source

- [Kaggle: Brain MRI Images for Brain Tumor Detection](https://www.kaggle.com/datasets/navoneel/brain-mri-images-for-brain-tumor-detection)

---

## 👤 Author

**Tam Tran**  

