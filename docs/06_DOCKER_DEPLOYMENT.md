# 🐳 Docker Containerization & Deployment Guide
### Production Multi-Stage & Compose Deployment Manual (SIH26161)

---

## 🎯 1. Deployment Topologies

The application is engineered to support two production-ready Docker deployment topologies:

### Topology A: Multi-Service Architecture via Docker Compose (Recommended)
- **Frontend Container (`frontend`)**: High-performance **Nginx 1.27 Alpine** web server listening on port `3000` (or port `80`). Serves optimized production bundles, caches static assets, and automatically reverse-proxies `/api/` traffic to the backend.
- **Backend Container (`backend`)**: Python 3.11-slim application server running **FastAPI** + **Uvicorn** on port `8000`.
- **Bridge Network (`flood-net`)**: Isolated inter-container communication network.
- **Persistent Volume**: Binds `./backend/sim_outputs` to persist simulation exports, shapefile zips, and KML layers across container restarts.

### Topology B: Unified Single-Container (All-in-One)
- A single Docker image built using the root [Dockerfile](file:///c:/Users/asus/Desktop/Dam%20Flood%20Simulation/Dockerfile).
- Stage 1 compiles the Vite + React TypeScript client.
- Stage 2 embeds the compiled assets into the Python FastAPI container.
- Serves both the interactive UI and the scientific API on a single port (`8000`).

---

## ⚙️ 2. Prerequisites

Verify that Docker and Docker Compose are installed on your host machine:

```bash
docker --version
# Expected: Docker version 20.10+ (Verified on Docker 29.6+)

docker compose version
# Expected: Docker Compose version v2+ (Verified on Compose v5.3+)
```

---

## 🚀 3. Quick Start (Docker Compose)

### 1. Build and Start All Services
From the root directory:

```bash
docker compose up --build -d
```

### 2. Verify Container Health
```bash
docker compose ps
```

You should observe both services reporting `healthy`:
```text
NAME                  IMAGE                        COMMAND                  SERVICE             STATUS                    PORTS
dam-flood-backend     dam-flood-backend:latest     "uvicorn backend.mai…"   backend             Up (healthy)              0.0.0.0:8000->8000/tcp
dam-flood-frontend    dam-flood-frontend:latest    "/docker-entrypoint.…"   frontend            Up (healthy)              0.0.0.0:3000->80/tcp
```

### 3. Open the Application
- **Interactive Web Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 📦 4. Single-Container Build & Run

If you prefer deploying a single container image to a cloud host or single VM:

```bash
# 1. Build the unified image
docker build -t dam-flood-unified .

# 2. Run the container
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/backend/sim_outputs:/app/backend/sim_outputs \
  --name dam-flood-app \
  dam-flood-unified

# 3. Access both UI and API
# http://localhost:8000
```

---

## ☁️ 5. Publishing to Docker Hub (Image Distribution)

To push your pre-built image to Docker Hub under your account (e.g., `pradeep26singh08`):

### Step 1: Log in to Docker Hub via CLI
Run Docker login in your terminal. You will be prompted for your Docker Hub password or Personal Access Token (PAT):

```bash
docker login -u pradeep26singh08
```

> [!NOTE]
> If you have Two-Factor Authentication (2FA) enabled on Docker Hub, generate a **Personal Access Token** at [hub.docker.com](https://hub.docker.com) -> Account Settings -> Security -> New Access Token, and use that token as the password.

### Step 2: Tag the Image
```bash
docker tag dam-flood-simulation:latest pradeep26singh08/dam-flood-simulation:latest
docker tag dam-flood-simulation:latest pradeep26singh08/dam-flood-simulation:v1.0
```

### Step 3: Push the Image to Docker Hub
```bash
docker push pradeep26singh08/dam-flood-simulation:latest
docker push pradeep26singh08/dam-flood-simulation:v1.0
```

### Step 4: Pull & Run on Any Machine or Cloud VM
Once published, any server, evaluator, or cluster can run your entire simulation system with a single command without needing Node.js, Python, or local source code:

```bash
docker run -d -p 8000:8000 --name dam-sim pradeep26singh08/dam-flood-simulation:latest
```
Visit `http://localhost:8000` to launch the platform.

---

## 🛠️ 6. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MODE` | `MOCK` | Operating mode (`MOCK` or `REAL`). In `MOCK`, physics-calibrated demo solvers run without external binary dependencies. |
| `HOST` | `0.0.0.0` | Bind IP address for FastAPI server. |
| `PORT` | `8000` | Port for FastAPI backend service. |
| `PYTHONUNBUFFERED` | `1` | Ensures Python logs stream directly to standard output without buffering. |
| `DELFT3D_BIN_PATH` | `dflowfm.exe` | Path to Delft3D-FM / D-Flow FM executable (used when `MODE=REAL`). |
| `DUALSPHYSICS_BIN_PATH` | `DualSPHysics5.2_win64.exe` | Path to DualSPHysics executable (used when `MODE=REAL`). |

---

## 📋 7. Useful Maintenance Commands

```bash
# View live backend logs
docker compose logs -f backend

# View live frontend Nginx access logs
docker compose logs -f frontend

# Execute a shell inside the backend container
docker compose exec backend bash

# Stop all containers
docker compose down

# Stop and remove volumes
docker compose down -v
```
