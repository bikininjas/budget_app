# Dockerfile optimisé pour Cloud Run
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Cloud Run utilise la variable PORT
ENV PORT=8080
EXPOSE 8080

# Run the application - Cloud Run injecte $PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
