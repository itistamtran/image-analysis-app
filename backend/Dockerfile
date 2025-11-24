FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HOME=/app/.cache/huggingface
ENV TRANSFORMERS_CACHE=/app/.cache/huggingface

RUN apt-get update && apt-get install -y \
    git \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    build-essential \
    python3-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

# Pre-download the model during build (not runtime)
RUN python -c "from transformers import AutoModelForImageClassification, AutoImageProcessor; \
    MODEL_REPO='itistamtran/vit_brain_tumor_multiclass_v2'; \
    AutoModelForImageClassification.from_pretrained(MODEL_REPO); \
    AutoImageProcessor.from_pretrained(MODEL_REPO)"

COPY . /app

EXPOSE 8080
ENV PORT=8080

# Increased timeout and memory optimizations
CMD ["gunicorn", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", \
     "--timeout", "300", "--graceful-timeout", "300", \
     "--worker-tmp-dir", "/dev/shm", \
     "-b", "0.0.0.0:8080", "app:app"]