# SIH26161: Dam Break Inundation Modelling Prototype

**Smart India Hackathon 2026 Problem Statement SIH26161**  
*"Dam Break Inundation Modelling Using Hydrodynamic Modelling of any River"*

A generalized 2D hydrodynamic simulation and decision-support prototype built for Humanitarian Assistance and Disaster Relief (HADR) planning. The system models dam breach events, executes/processes hydrodynamic flood waves (Delft3D Flexible Mesh and Smoothed Particle Hydrodynamics / SPH), visualizes spatial flood propagation across terrain, evaluates downstream impacts on infrastructure and settlements, compares hydrodynamic solvers, and exports standard GIS layers (.shp, .kml, GeoJSON).

---

## Initial Demonstration Study Area
- **Dam:** Hidkal Dam (Raja Lakhamgouda Reservoir)
- **River / Basin:** Ghataprabha River (Krishna River Basin), Belagavi district, Karnataka, India
- **Coordinates:** Lat 16.1488° N, Lon 74.6366° E
- **Crest Elevation:** 662.94 m MSL | **Height:** 53.34 m | **Storage:** 1.448 Billion Cubic Meters (BCM)
- **Downstream Reach:** 42.5 km through Hidkal Colony, Yadwad, Bellad Bagewadi, Borgal, Gokak Falls & City, and Konnur

---

## System Architecture

```
User / Disaster Responders
        │
        ▼
React + TypeScript + Leaflet Dashboard (Port 5173)
        │
        ▼ REST API
FastAPI Backend (Port 8000)
        │
        ├─► Breach Hydrograph Engine (Froehlich 2008 & MacDonald-Langridge)
        │
        ├─► Hydrodynamic Solvers:
        │     ├─► Delft3D FM (2D Shallow Water Equations, Flexible Mesh)
        │     └─► SPH (Smoothed Particle Hydrodynamics Lagrangian Solver)
        │
        ├─► HADR Impact Engine (Settlements, Bridges, Roads, Farmland, Camps)
        │
        ├─► GIS Exporter (ESRI Shapefile ZIP, Google Earth KML, GeoJSON)
        │
        └─► Open-Source Satellite EO Framework (Sentinel-1 SAR / GEE)
```

---

## Dual Execution Architecture (`MODE = MOCK` vs `MODE = REAL`)

In compliance with prototype guidelines:
- **`MODE = MOCK` (Default when binaries are absent):**
  - Uses calibrated 2D hydrodynamic time-series mesh datasets for the Ghataprabha River reach ($T = 0.5\text{h}$ to $8.0\text{h}$).
  - All outputs and UI views clearly display a **`[DEMO DATA - HYDRODYNAMIC MOCK]`** badge to preserve scientific integrity.
- **`MODE = REAL` (When Delft3D / DualSPHysics binaries are installed):**
  - Generates Delft3D input decks: Master Definition (`.mdu`), boundary discharge time-series (`.bc`), and invoking `dflowfm.exe` / `dimr`.
  - Generates DualSPHysics XML configuration (`CaseDamBreak_Def.xml`).

---

## Key Features

1. **Hydrodynamic Dam Breach Modelling:**
   - Supports **Overtopping (PMF)** and **Internal Piping** failure mechanisms.
   - Calculates time-dependent breach hydrographs $Q(t)$, peak outflow $Q_p$, and breach width evolution using Froehlich (2008) empirical relations.
2. **Interactive 2D Geospatial Flood Visualization:**
   - Depth Heatmap color ramps (0 to 10m+).
   - Velocity vector arrows ($v$ in m/s and direction).
   - Flood wave arrival time isochrones ($t_{arrival}$ in hours).
   - Dynamic timeline playback scrubber with speed multipliers ($1\times, 2\times, 4\times$).
3. **HADR Disaster Impact Assessment:**
   - Population at risk & affected settlements (Hukkeri, Gokak, Konnur).
   - Damaged structures and submerged agricultural land (hectares).
   - Severed critical bridges (SH-31, Yamakanmardi Link, Gokak Suspension Bridge).
   - Verified high-ground relief centers (Hukkeri Polytechnic, Gokak College).
4. **Scenario & Model Comparison:**
   - Side-by-side comparison between **Delft3D FM** (Eulerian 2D Shallow Water) and **SPH** (Lagrangian particle dynamics).
   - Highlights near-field surge pressures vs far-field floodplain diffusion.
5. **GIS Interoperability & Export:**
   - 1-click downloads for **GeoJSON**, **Google Earth KML 2.2**, and **ESRI Shapefile ZIP** (with WGS84 PRJ metadata).
6. **Near Real-Time Earth Observation Framework:**
   - Copernicus Sentinel-1 SAR C-band backscatter differential thresholding workflow and Google Earth Engine (GEE) script for satellite validation.

---

## Project Structure

```
Dam Flood Simulation/
├── backend/
│   ├── main.py                  # FastAPI entry point & REST endpoints
│   ├── config.py                # Environment configuration & engine detection
│   ├── requirements.txt         # Python dependencies
│   ├── models/
│   │   └── schemas.py           # Pydantic data schemas
│   ├── hydro_engine/
│   │   ├── breach_calc.py       # Froehlich empirical breach calculator
│   │   ├── delft3d_runner.py    # Delft3D FM runner & 2D mesh processor
│   │   ├── sph_runner.py        # SPH runner & comparative model
│   │   ├── impact_analyzer.py   # HADR asset impact evaluation
│   │   └── exporter.py          # GeoJSON, KML, and ESRI SHP exporter
│   └── data/
│       └── hidkal_dam/
│           └── data_loader.py   # Ghataprabha reach GIS dataset & assets
├── frontend/
│   ├── index.html               # HTML5 entry point with Outfit font & Leaflet
│   ├── package.json             # Vite, React, Leaflet, Recharts, Lucide
│   ├── src/
│   │   ├── App.tsx              # Root application container
│   │   ├── index.css            # Custom dark hydrodynamic design system
│   │   ├── types.ts             # TypeScript interfaces
│   │   ├── services/
│   │   │   └── api.ts           # REST API client
│   │   └── components/
│   │       ├── Header.tsx       # Brand navbar & engine mode badge
│   │       ├── ScenarioPanel.tsx# Breach & hydrodynamic configuration
│   │       ├── MapViewer.tsx    # Leaflet GIS viewer with layer toggles
│   │       ├── TimelineController.tsx # Playback scrubber & speed control
│   │       ├── ImpactPanel.tsx  # Hydrograph chart & HADR KPI cards
│   │       ├── ComparisonModal.tsx # Delft3D vs SPH side-by-side analysis
│   │       ├── ExportModal.tsx  # GIS download dialog
│   │       └── GeeModal.tsx     # Sentinel-1 SAR GEE EO framework
└── README.md
```

---

---

## 🐳 Docker Deployment (Recommended)

Run the full stack (Frontend on Nginx + FastAPI Backend) in production containers with a single command:

```bash
# 1. Build and run all services
docker compose up --build -d

# 2. Access the platforms:
# Web Dashboard: http://localhost:3000
# FastAPI Docs:  http://localhost:8000/docs
# API Health:    http://localhost:8000/api/health
```

Alternatively, run as a unified single-container image:
```bash
docker build -t dam-flood-unified .
docker run -d -p 8000:8000 --name dam-flood dam-flood-unified
```

---

## 📚 Complete Project Documentary & Documentation Library

## 📚 Comprehensive Documentation Suite

Exhaustive engineering documentation, scientific formulations, and narrative documentary chapters are available in the [`documentation/`](documentation/README.md) directory:

- 📑 [**Master Technical Report**](documentation/PROJECT_DOCUMENTATION.md): Comprehensive 360° technical report, mathematical foundations, HADR architecture, and SIH26161 submission document.
- 🎬 [**01. The Project Documentary**](documentation/01_PROJECT_DOCUMENTARY.md): The narrative documentary, historical Indian dam disasters (Rishi Ganga, Kosi, Phuktal), SIH 2026 mandate, and the human mission.
- 🏗️ [**02. System Architecture**](documentation/02_SYSTEM_ARCHITECTURE.md): Architectural diagrams, data pipelines, module breakdown, and resilient offline fallbacks.
- 🔬 [**03. Hydrodynamic Formulations**](documentation/03_HYDRODYNAMIC_MODELS.md): Mathematical derivations of Froehlich breach equations, St. Venant 2D Shallow Water Equations (SWE), and DualSPHysics SPH Navier-Stokes.
- 🛡️ [**04. HADR & Disaster Management**](documentation/04_HADR_AND_DISASTER_MANAGEMENT.md): Emergency response protocols, USACE/Graham casualty estimation, infrastructure vulnerability, and relief camp allocation.
- 🔌 [**05. API Reference Specification**](documentation/05_API_REFERENCE.md): Complete OpenAPI / REST specification with request/response schemas and curl examples.
- 🐳 [**06. Docker Deployment Guide**](documentation/06_DOCKER_DEPLOYMENT.md): Containerization manual, multi-stage builds, Docker Hub publishing (`docker push`), and troubleshooting.
- 📖 [**07. User Manual & Guide**](documentation/07_USER_MANUAL.md): Operator walkthrough for 2D GIS maps, 3D fluid shock wave viewer, and GIS exports.

---

## Setup & Running Locally (Without Docker)

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js v18+ and npm

### 1. Backend Setup
```bash
# From repository root
pip install -r backend/requirements.txt

# Start FastAPI backend
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
FastAPI Swagger documentation will be available at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup
```bash
# In a separate terminal
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Open your browser and navigate to `http://127.0.0.1:5173`.

---

## Environment Variables
- `MODE`: Set to `MOCK` or `REAL` (defaults to auto-detecting Delft3D executable).
- `DELFT3D_BIN_PATH`: Path to `dflowfm.exe` or `dimr.exe`.
- `DUALSPHYSICS_BIN_PATH`: Path to `DualSPHysics5.2_win64.exe`.
- `PORT`: Backend server port (default `8000`).

---

## License & Attribution
Developed for Smart India Hackathon 2026. Hydrodynamic formulation based on Froehlich (2008), Delft3D Flexible Mesh by Deltares, and DualSPHysics open-source SPH consortium.
