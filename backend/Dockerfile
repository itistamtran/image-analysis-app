# Use Python 3.12 slim image
FROM python:3.12-slim

# Install OpenCV dependencies
RUN apt-get update && apt-get install -y libgl1-mesa-glx libglib2.0-0 && apt-get clean

# Set working directory
WORKDIR /app

# Copy dependency list and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose backend port
EXPOSE 8080

# Run with gunicorn (production server)
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
