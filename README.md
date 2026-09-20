# 🌊 SIH26161: Dam Break Inundation Modelling Prototype
### Smart India Hackathon 2026 — Problem Statement SIH26161
> **"Dam Break Inundation Modelling Using Hydrodynamic Modelling of any River"**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Language-Python_3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Deploy-Docker_Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade 2D/3D hydrodynamic simulation and decision-support platform built for **Humanitarian Assistance and Disaster Relief (HADR)** planning. The system models catastrophic dam breach events, executes/processes hydrodynamic flood waves (Delft3D Flexible Mesh and Smoothed Particle Hydrodynamics / DualSPHysics), supports custom GeoTIFF DEM raster ingestion, visualizes spatial flood propagation across complex terrain, evaluates downstream impacts on infrastructure and settlements, provides user authentication with MongoDB Atlas, and exports standard GIS layers (`.shp`, `.kml`, GeoJSON).

---

## 📍 Primary Demonstration Study Area
- **Dam:** Hidkal Dam (*Raja Lakhamagouda Dam & Reservoir*)
- **River / Basin:** Ghataprabha River (*Krishna River Basin*), Belagavi District, Karnataka, India
- **Dam Coordinates:** `16.1488° N, 74.6366° E`
- **Reservoir Geometry:** High-resolution 45-node dendritic reservoir morphology at Full Reservoir Level (FRL `662.94 m MSL`), gross storage of **1.448 Billion Cubic Meters (BCM)**
- **Embankment Axis:** 10.18 km composite earth-fill dam crest with a central 10-radial-gate ogee spillway
- **Downstream Corridor:** 44.8 km continuous hydrodynamic reach through Hidkal Colony, Yadwad, Bellad Bagewadi, Yamakanmardi, Borgal, Ankalgi, Gokak Falls gorge, Gokak City, Lolakatte, and Konnur
- **Critical Assets Monitored:** 38 authentic real-world infrastructure points (6 bridges, 5 verified high-ground relief centers, 13 settlements, stream telemetry gauges, canal head regulators, hospitals, power substations, and historical industrial landmarks)

---

## 🏛️ System Architecture

```
                                  USER / DISASTER RESPONDERS
                                               │
                                               ▼
             ┌──────────────────────────────────────────────────────────────────┐
             │       React 19 + TypeScript + Leaflet + Three.js (Port 5173)     │
             │  • 2D Tactical GIS Viewer (Water Depth, Velocities, Isochrones)  │
             │  • 3D SPH Fluid Shock Wave Engine (WebGL Particle Mesh)          │
             │  • Scenario & Breach Controller (Overtopping / Piping)           │
             │  • Custom GeoTIFF DEM Raster Ingest & HADR Parameter Ingestion   │
             │  • Full-Screen Authentication (MongoDB Atlas / Local Fallback)   │
             └─────────────────────────────────┬────────────────────────────────┘
                                               │ REST API / Bearer JWT
                                               ▼
             ┌──────────────────────────────────────────────────────────────────┐
             │                  FastAPI Asynchronous Backend (Port 8000)        │
             ├─────────────────────────────────┬────────────────────────────────┤
             │           Core Routing          │        Security & Storage      │
             │  • /api/simulate                │  • JWT Auth (HS256)            │
             │  • /api/simulate/custom-dem     │  • MongoDB Atlas Connector     │
             │  • /api/simulations/saved       │  • Auto Local JSON Fallback    │
             │  • /api/dams/{id}/terrain       │  • In-Memory GIS Cache         │
             └────────────────┬────────────────┴────────────────┬───────────────┘
                              │                                 │
                 ┌────────────┴────────────┐       ┌────────────┴────────────┐
                 ▼                         ▼       ▼                         ▼
      Breach Hydrograph Engine    Hydrodynamic Solvers    HADR Impact Engine    GIS Exporters
       • Froehlich (2008)         • Delft3D-FM (2D SWE)   • Population at Risk  • ESRI Shapefile ZIP
       • MacDonald-Langridge      • DualSPHysics (3D SPH) • Bridge Submersions  • Google Earth KML
       • Peak Discharge (Qp)      • GeoTIFF DEM Rasterizer• Shelter Allocations • GeoJSON FeatureCol
```

---

## ✨ Key Features & Capabilities

### 1. User Authentication & Cloud Database (MongoDB Atlas)
- **Role-Based Disaster Management Profiles**: Supports Hydrologists, Relief Commanders, Emergency Responders, and Structural Engineers.
- **Dual-Storage Resilience**: Direct connection to **MongoDB Atlas** via `pymongo` with **automatic offline local JSON fallback** (`backend/data/local_db/`). If internet access or database credentials are unavailable, the platform functions seamlessly offline without disruption.
- **Persistent Saved Simulations**: Logged-in users can save, bookmark, and review scenario runs across sessions.

### 2. Custom GeoTIFF (.tif) DEM Upload & Simulation
- **Any River, Any Terrain**: Upload arbitrary GeoTIFF digital elevation models (.tif/.tiff) to simulate flash floods or dam breaks anywhere in India.
- **Dynamic Parameter Ingestion**:
  - Manning's channel roughness coefficient ($n$).
  - Structural dam metrics (crest elevation, height, reservoir capacity).
  - Breach geometry (top/bottom width, side slope $z$, breach formation time).
  - Target evacuation lead times and high-ground safety buffer thresholds.
- **Raster Analytics**: Automatic parsing of bounding boxes, spatial resolution, nodata masks, and min/max ground elevations.

### 3. Dual Hydrodynamic Solvers (`MODE = MOCK` vs `MODE = REAL`)
- **Delft3D Flexible Mesh (2D Shallow Water Equations)**: Solves depth-averaged continuity and momentum equations across curvilinear and unstructured flexible grids.
- **Smoothed Particle Hydrodynamics (SPH Lagrangian Solver)**: Models violent free-surface break shock waves, near-field fluid structure impact, and bore progression.
- **Automatic Fallback Mode**: When heavy simulation binaries are not locally installed, the system automatically uses calibrated high-resolution hydrodynamic mesh datasets (`[DEMO DATA - HYDRODYNAMIC MOCK]`) to ensure 100% demo resilience during presentations.

### 4. Interactive 2D Tactical GIS Map & 3D Fluid View
- **Multi-Layer Tactical HUD**:
  - 🌊 **Water Depth Contours**: Continuous color-ramp heatmap (0m to 10m+).
  - ↗️ **Flow Velocity Vectors**: Scaled and rotated directional arrows representing velocity field ($v$ in m/s).
  - ⏱️ **Arrival Isochrones**: Wave front arrival contours ($T+0.5\text{h}$ to $T+8.0\text{h}$).
  - 🌉 **River Bridges & Crossings**: Real-time submersion status (passable vs severed).
  - 🏕️ **Safe Relief Centers**: High-ground camps with guaranteed positive freeboard buffer (+27m to +48m MSL).
  - 💧 **Hydrometric Telemetry & Canals**: CWC stream gauges and GLBC/GRBC canal head regulators.
  - 🏛️ **Heritage & Industry**: Historical Gokak Mills (1887), Chalukyan temples, rail junctions, and weirs.
  - 🚒 **Emergency Services**: Civil defense and fire/rescue depots.
- **Zero-Crowding Design**: Ultra-compact 22–26px circular badge pins with glassmorphic on-hover tooltips (`.tactical-tooltip`). No overlapping rectangular text badges at any zoom level.
- **Multi-Basemap Support**: Toggle between CARTO Voyager (Light), CARTO Dark Matter (Dark), Esri World Satellite Imagery, and Esri Topographic Relief.
- **3D Particle Shockwave Simulation**: Interactive Three.js/WebGL fluid particle renderer illustrating the 3D fluid surge over terrain.

### 5. HADR Impact Analytics & Decision Support
- **Graham / USACE Empirical Casualty Model**: Estimates population at risk, warning effectiveness, and potential fatality ranges.
- **Lifeline Impact Detection**: Instant detection of inundated roadways, severed bridge crossings, cut-off power substations, and threatened hospitals.
- **Automated Evacuation Routing**: Matches impacted settlements to their nearest verified safe high-ground relief shelter.

### 6. Standardized GIS Exporting
- 1-click generation of **ESRI Shapefile ZIP archives** (complete with `.shp`, `.shx`, `.dbf`, and `.prj` projection files).
- **Google Earth KML 2.2** exports for 3D aerial fly-throughs.
- **GeoJSON FeatureCollections** for immediate consumption in QGIS, ArcGIS, Mapbox, or web GIS clients.

---

## 🚀 Quick Start Guide

### Option A: Running Locally (Fastest for Development)

#### Prerequisites
- **Python 3.10+** (tested up to Python 3.14)
- **Node.js v18+** and **npm**
- (Optional) MongoDB Atlas connection string

#### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/Pradeep-Singh-26/SIH-2026.git
cd "SIH-2026"

# (Optional) Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI backend server
python -m uvicorn backend.main:app --reload --port 8000
```
FastAPI interactive documentation will be live at `http://localhost:8000/docs`.

#### 2. Frontend Setup
```bash
# In a new terminal window, navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

### Option B: Running with Docker (Production Grade)

Run the entire application (React Frontend on Nginx + FastAPI Backend) with a single command:

```bash
# From repository root
docker compose up --build -d
```

- **Frontend Dashboard:** `http://localhost:3000`
- **FastAPI Documentation:** `http://localhost:8000/docs`
- **API Healthcheck:** `http://localhost:8000/api/health`

To stop the containers:
```bash
docker compose down
```

---

## ⚙️ Configuration & Environment Variables

Configure backend environment variables in `backend/.env` or pass them via Docker:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `MODE` | `MOCK` | Execution mode (`MOCK` or `REAL`). Auto-detects binaries if omitted. |
| `DELFT3D_BIN_PATH` | `C:\delft3d\dflowfm.exe` | Path to Delft3D Flexible Mesh executable. |
| `DUALSPHYSICS_BIN_PATH` | `C:\DualSPHysics\DualSPHysics5.2_win64.exe` | Path to DualSPHysics particle solver executable. |
| `PORT` | `8000` | Backend API port. |
| `MONGODB_URI` | *(empty = local JSON fallback)* | MongoDB Atlas connection URI (e.g., `mongodb+srv://<user>:<pass>@cluster.mongodb.net/dam_db`). |
| `JWT_SECRET` | `sih-2026-dam-flood-simulation-secret-key-super-secure` | Secret key for signing JWT authentication tokens. |
| `USERS_COLLECTION` | `users` | MongoDB collection name for registered users. |
| `SIMULATIONS_COLLECTION` | `simulations` | MongoDB collection name for saved simulation runs. |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Frontend API client base URL. |

---

## 📡 Key API Endpoints

### Authentication & Profiles
- `GET /api/auth/db-status` — Get MongoDB Atlas connection status and storage mode.
- `POST /api/auth/signup` — Register a new disaster responder account (returns JWT token).
- `POST /api/auth/login` — Authenticate and receive a JWT token.
- `GET /api/auth/me` — Retrieve the currently logged-in user profile.
- `GET /api/auth/my-simulations` — Retrieve simulations saved by the active user.

### Hydrodynamic Simulation & Inundation
- `POST /api/simulate` — Execute dam breach simulation for Hidkal Dam (Delft3D-FM or SPH).
- `POST /api/simulate/custom-dem` — Ingest custom GeoTIFF raster (.tif) with hydrodynamic & HADR parameters.
- `GET /api/simulations/{sim_id}/results` — Retrieve complete hydrodynamic timeseries, hydrographs, and KPIs.
- `GET /api/simulations/{sim_id}/layers` — Retrieve step-by-step depth polygon and velocity vector GeoJSON.
- `GET /api/simulations/{sim_id}/export/{format}` — Download GIS layers as `shp` (ZIP), `kml`, or `geojson`.
- `GET /api/simulations/compare` — Compare two simulation runs side-by-side.

### Geospatial Layers & Infrastructure
- `GET /api/dams` — List all registered dams in the catalogue.
- `GET /api/dams/{dam_id}` — Get comprehensive structural metadata for a dam.
- `GET /api/dams/{dam_id}/river` — GeoJSON LineString of downstream river reach.
- `GET /api/dams/{dam_id}/infrastructure` — GeoJSON FeatureCollection of 38 downstream critical assets.
- `GET /api/dams/{dam_id}/terrain` — High-resolution reservoir polygon, 10.18km dam axis, spillway, and contours.
- `GET /api/gee/script` — Copernicus Sentinel-1 SAR GEE workflow script for satellite backscatter validation.

---

## 📂 Repository Directory Structure

```
Dam Flood Simulation/
├── backend/
│   ├── main.py                     # FastAPI application & REST endpoint definitions
│   ├── auth.py                     # JWT token generation, verification & password hashing
│   ├── config.py                   # Environment configuration & engine detection
│   ├── requirements.txt            # Python dependencies (FastAPI, rasterio, pymongo, etc.)
│   ├── db/
│   │   └── mongodb.py              # MongoDB Atlas client with graceful local JSON fallback
│   ├── models/
│   │   └── schemas.py              # Pydantic schemas (Breach, Simulation, HADR, Auth)
│   ├── hydro_engine/
│   │   ├── breach_calc.py          # Froehlich (2008) empirical dam breach calculator
│   │   ├── delft3d_runner.py       # Delft3D-FM 2D SWE runner & mesh processor
│   │   ├── sph_runner.py           # DualSPHysics Lagrangian 3D particle runner
│   │   ├── dem_processor.py        # GeoTIFF raster reader, resampler & inundation calculator
│   │   ├── impact_analyzer.py      # HADR asset vulnerability & loss evaluation
│   │   └── exporter.py             # Shapefile (.shp), KML, and GeoJSON exporters
│   └── data/
│       ├── sample_dem.tif          # Sample terrain elevation GeoTIFF raster
│       ├── local_db/               # Offline JSON persistence (users, simulations)
│       └── hidkal_dam/
│           └── data_loader.py      # High-resolution Ghataprabha reach GIS dataset (38 assets)
├── frontend/
│   ├── index.html                  # HTML5 entry point with Outfit font & Leaflet CSS
│   ├── package.json                # React 19, Vite, Leaflet, Three.js, Recharts, Lucide
│   ├── vite.config.ts              # Vite bundler & proxy configuration
│   └── src/
│       ├── App.tsx                 # Root application with route and view state
│       ├── index.css               # Clean hydrodynamic design system (Light/Dark mode)
│       ├── types.ts                # Shared TypeScript type definitions
│       ├── services/
│       │   ├── api.ts              # REST API client with Axios
│       │   ├── authService.ts      # Authentication client & token storage
│       │   ├── mockData.ts         # High-precision offline mock data fallback
│       │   └── soundEffects.ts     # Synthesized tactical audio feedback
│       └── components/
│           ├── Header.tsx          # Navigation bar, auth avatar & engine status
│           ├── AuthModal.tsx       # Modal signup/login dialog
│           ├── AuthPage.tsx        # Full-page dedicated authentication experience
│           ├── ScenarioPanel.tsx   # Breach & hydrodynamic configuration form
│           ├── DemUploadPanel.tsx  # GeoTIFF DEM file upload & parameter ingestion
│           ├── MapViewer.tsx       # Interactive 2D Leaflet map with uncluttered circular pins
│           ├── ThreeSphSimulation.tsx # 3D WebGL fluid shockwave simulation viewer
│           ├── TimelineController.tsx # Simulation playback timeline & speed controller
│           ├── ImpactPanel.tsx     # Hydrograph charts & HADR loss estimation cards
│           ├── ComparisonModal.tsx # Side-by-side Delft3D vs SPH comparison
│           ├── ExportModal.tsx     # GIS layer export dialog (.shp, .kml, .geojson)
│           ├── GeeModal.tsx        # Copernicus Sentinel-1 SAR satellite EO dialog
│           └── SystemGuideModal.tsx# Comprehensive operator manual modal
├── documentation/                  # Exhaustive technical and documentary suite
│   ├── README.md                   # Documentation index & reading guide
│   ├── PROJECT_DOCUMENTATION.md    # Master technical report & SIH submission document
│   ├── 01_PROJECT_DOCUMENTARY.md   # Project documentary narrative & Indian disaster history
│   ├── 02_SYSTEM_ARCHITECTURE.md   # Architectural diagrams & pipeline workflows
│   ├── 03_HYDRODYNAMIC_MODELS.md   # Mathematical derivations (SWE & SPH)
│   ├── 04_HADR_AND_DISASTER_MANAGEMENT.md # Disaster protocols & casualty estimation
│   ├── 05_API_REFERENCE.md         # Full REST API specification with curl examples
│   ├── 06_DOCKER_DEPLOYMENT.md     # Production container deployment guide
│   ├── 07_USER_MANUAL.md           # Step-by-step user and operator guide
│   └── 08_PITCH_DECK_AND_PRESENTATION_GUIDE.md # 13-slide pitch deck & jury presentation script
├── Dockerfile                      # Production multi-stage Docker build
├── docker-compose.yml              # Multi-container orchestration (Frontend + Backend)
└── README.md                       # Repository README
```

---

## 📚 Complete Technical Documentation Suite

For detailed technical derivations, mathematical proofs, operational guides, and jury presentation decks, explore the [`documentation/`](documentation/README.md) suite:

1. 📑 [**Master Technical Report**](documentation/PROJECT_DOCUMENTATION.md) — Comprehensive 360° technical report, architecture, and SIH submission document.
2. 🎬 [**01. Project Documentary**](documentation/01_PROJECT_DOCUMENTARY.md) — Narrative history, Indian dam disasters (Morbi, Rishi Ganga, Kosi), and the national safety imperative.
3. 🏗️ [**02. System Architecture**](documentation/02_SYSTEM_ARCHITECTURE.md) — Deep-dive into data pipelines, offline fallbacks, and backend modules.
4. 🔬 [**03. Hydrodynamic Models**](documentation/03_HYDRODYNAMIC_MODELS.md) — Mathematical formulations of Froehlich breach equations, 2D SWE, and SPH Navier-Stokes.
5. 🛡️ [**04. HADR & Disaster Management**](documentation/04_HADR_AND_DISASTER_MANAGEMENT.md) — Emergency response protocols, USACE casualty formulas, and relief camp allocation.
6. 🔌 [**05. API Reference**](documentation/05_API_REFERENCE.md) — Complete OpenAPI reference with request/response payloads.
7. 🐳 [**06. Docker Deployment Guide**](documentation/06_DOCKER_DEPLOYMENT.md) — Multi-stage container builds, Docker Compose, and Docker Hub distribution.
8. 📖 [**07. User Manual**](documentation/07_USER_MANUAL.md) — Comprehensive user guide for the 2D GIS map, GeoTIFF ingestion, and 3D fluid shockwave viewer.
9. 📊 [**08. Pitch Deck & Presentation Guide**](documentation/08_PITCH_DECK_AND_PRESENTATION_GUIDE.md) — 13-slide pitch deck blueprint, speaking notes, and jury Q&A defense.

---

## 👥 Contributors & Acknowledgements
- **Team**: SIH-2026 Problem Statement SIH26161 Team
- **Hydrodynamic Formulations**: Froehlich (2008), Delft3D Flexible Mesh (Deltares Open-Source), DualSPHysics (Universidade de Vigo / University of Manchester).
- **Geospatial Data**: Central Water Commission (CWC), Survey of India, Karnataka Water Resources Department, OpenStreetMap contributors, and CARTO Basemaps.
