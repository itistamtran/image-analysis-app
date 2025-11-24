FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
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
COPY . /app

RUN pip install --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt

EXPOSE 8080
ENV PORT=8080

CMD ["gunicorn", "-w", "1", "--threads", "1", "--timeout", "600", "-b", "0.0.0.0:8080", "app:app"]
