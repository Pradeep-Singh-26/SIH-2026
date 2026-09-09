# syntax=docker/dockerfile:1
# ==============================================================================
# Dam Break Inundation Modelling - Unified Fullstack Container (SIH 2026 SIH26161)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Vite + React TypeScript Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /build

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Python 3.11 FastAPI Hydrodynamic Backend & Application Server
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    MODE=MOCK \
    HOST=0.0.0.0 \
    PORT=8000

# Install runtime utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python scientific & web dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy backend code
COPY backend /app/backend
RUN mkdir -p /app/backend/sim_outputs

# Copy compiled frontend assets from Stage 1
COPY --from=frontend-builder /build/dist /app/frontend/dist

EXPOSE 8000

HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Launch the unified server
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
