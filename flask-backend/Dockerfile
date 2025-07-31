# Use Python 3.11 Slim (Debian-based) instead of Alpine
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install build tools and dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    gfortran \
    libatlas-base-dev \
    libopenblas-dev \
    liblapack-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code and model files
COPY app.py .
COPY claims_model_clf.pkl .
COPY preprocessor.pkl .

# Expose port
EXPOSE 5001

# Environment variables (optional, can be set via docker-compose)
ENV FLASK_ENV=production
ENV FLASK_APP=app.py

# Run the application
CMD ["flask", "run", "--host=0.0.0.0", "--port=5001"]