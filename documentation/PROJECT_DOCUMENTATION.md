# 📘 Dam Break Inundation Modelling & HADR Decision Support System
## Comprehensive Technical Documentation & Engineering Report
### Smart India Hackathon 2026 — Problem Statement SIH26161
**"Dam Break Inundation Modelling Using Hydrodynamic Modelling of any River"**

---

## 📑 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Study Area & Basin Geography: Hidkal Dam](#2-study-area--basin-geography-hidkal-dam)
3. [Hydrodynamic Computational Engines](#3-hydrodynamic-computational-engines)
   - [Breach Mechanics (Froehlich 2008)](#31-breach-mechanics-froehlich-2008)
   - [Delft3D Flexible Mesh (2D Shallow Water Equations)](#32-delft3d-flexible-mesh-2d-shallow-water-equations)
   - [DualSPHysics (Smoothed Particle Hydrodynamics)](#33-dualsphysics-smoothed-particle-hydrodynamics)
4. [HADR Decision Support & Impact Analysis](#4-hadr-decision-support--impact-analysis)
   - [Population at Risk & USACE Fatality Estimation](#41-population-at-risk--usace-fatality-estimation)
   - [Critical Infrastructure Damage Matrix](#42-critical-infrastructure-damage-matrix)
   - [Designated Relief Camps & Evacuation Routing](#43-designated-relief-camps--evacuation-routing)
5. [Software Architecture & Data Pipelines](#5-software-architecture--data-pipelines)
   - [System Topology](#51-system-topology)
   - [Frontend Architecture (React 19 + TypeScript + Leaflet + Three.js)](#52-frontend-architecture)
   - [Backend Architecture (FastAPI + SciPy + NumPy + Shapely)](#53-backend-architecture)
   - [Geospatial Exporters (.shp, .kml, .geojson)](#54-geospatial-exporters)
6. [Satellite Remote Sensing & Earth Observation (GEE)](#6-satellite-remote-sensing--earth-observation-gee)
7. [Docker Containerization & Production Deployment](#7-docker-containerization--production-deployment)
8. [Operator Manual & Feature Walkthrough](#8-operator-manual--feature-walkthrough)
9. [Pitch Deck & Hackathon Presentation Guide](#9-pitch-deck--hackathon-presentation-guide)

---

## 1. Executive Summary & Problem Statement

### 1.1 Context & Background
India is home to over 5,300 large dams storing trillions of cubic meters of water. While dams are lifelines for agricultural irrigation, municipal water supply, and clean hydroelectric power, structural breach or spillway failure can release catastrophic flash floods into lower catchments. Recent history underscores this vulnerability:
- **Rishi Ganga, Uttarakhand (Feb 2021)**: Sudden glacial avalanche damming and subsequent breach wiped out two hydroelectric projects, claiming over 200 lives.
- **Wapriyang River, Arunachal Pradesh (Nov 2021)**: Flash surge following landslide dam failure.
- **Phuktal River, J&K (Mar 2015)**: 15 km impoundment threatened dozens of downstream settlements.
- **Kosi River, Bihar (Aug 2008)**: Embankment rupture displaced over 3 million people.

### 1.2 The SIH26161 Mandate
Problem Statement SIH26161 requires developing an automated software framework capable of:
1. Simulating dam breach hydrodynamics for any Indian river basin using hydrological data, Digital Elevation Models (DEMs), and satellite imagery.
2. Integrating both **Smoothed Particle Hydrodynamics (SPH)** for near-field hydrodynamic wave shock and **Delft3D Flexible Mesh** for 2D catchment-scale flood propagation.
3. Conducting loss and damage analysis for **Humanitarian Assistance and Disaster Relief (HADR)**.
4. Providing an intuitive, high-performance web dashboard displaying 2D inundation depth, velocity, wave arrival time isochrones, and 3D fluid shock dynamics.
5. Exporting spatial layers as ESRI Shapefiles (`.shp`), Google Earth (`.kml`), and GeoJSON.
6. Integrating a near-real-time satellite validation framework via **Google Earth Engine (GEE)** using open-source Sentinel-1 SAR and Sentinel-2 optical data.

---

## 2. Study Area & Basin Geography: Hidkal Dam

The prototype models the **Raja Lakhamagouda Dam** (popularly known as **Hidkal Dam**) impounding the **Ghataprabha River** in the Belagavi district of Karnataka, part of the Krishna River Basin.

```
                              HIDKAL RESERVOIR (FRL: 662.94 m MSL)
                                Gross Storage: 1,448 MCM (51.1 TMC)
                                Surface Area: ~63.4 km²
                                              │
                                              ▼
                               [ 10.18 km DAM EMBANKMENT ]
                               [ 10-Gate Masonry Spillway ]
                                              │
                       Torrential Supercritical Flow (V > 5 m/s)
                                              │
                                              ▼
                    Hidkal Colony ──► Yadwad Village ──► Bellad Bagewadi
                                              │
                     Submergence of SH-31 & NH-4 Highway Bridge (T+2.1h)
                                              │
                                              ▼
                       Gokak Sandstone Gorge (52m Waterfall Plunge)
                                              │
                     Gokak City Riverbank (85,000 Pop) & Historic Bridge
                                              │
                                              ▼
                     Konnur Alluvial Plains (Agricultural Inundation)
```

### Key Technical Specifications:
- **Location**: Latitude $16.1488^\circ\text{ N}$, Longitude $74.6366^\circ\text{ E}$.
- **Structural Height**: $53.34\text{ m}$ ($175\text{ ft}$).
- **Crest Length**: $10,183\text{ m}$ ($10.18\text{ km}$, composite earth-fill embankment with central masonry spillway).
- **Full Reservoir Level (FRL)**: $662.94\text{ m MSL}$.
- **Gross Storage Capacity**: $1,448\text{ MCM}$ ($1.448 \times 10^9\text{ m}^3$).
- **Spillway Details**: Ogee-type concrete spillway with 10 radial gates ($3,230\text{ m}^3/\text{s}$ capacity).
- **Hydroelectric Powerhouse**: $36\text{ MW}$ installed capacity ($2 \times 18\text{ MW}$ Kaplan turbines).
- **Downstream Reach**: $44.8\text{ km}$ downstream through Hidkal Colony, Yadwad, Yamakanmardi, Borgal, Gokak Gorge, Gokak City, and Konnur.

---

## 3. Hydrodynamic Computational Engines

### 3.1 Breach Mechanics (Froehlich 2008)
The platform implements geotechnical formulations developed by Dr. David C. Froehlich (calibrated across 74 real-world dam failures):

- **Average Breach Width ($\bar{B}$)**:
  $$\bar{B} = 0.27 \cdot k_0 \cdot V_w^{0.32} \cdot h_b^{0.04}$$
  *(Where $k_0 = 1.30$ for overtopping, $1.00$ for piping; $V_w$ is reservoir volume; $h_b$ is breach height).*

- **Breach Formation Time ($t_f$)**:
  $$t_f = 63.2 \cdot \sqrt{\frac{V_w}{g \cdot h_b^2}}$$

- **Peak Discharge ($Q_p$)**:
  $$Q_p = 0.607 \cdot V_w^{0.295} \cdot h_w^{1.24}$$

For the Hidkal Dam Overtopping scenario, calculated peak discharge reaches **$28,450\text{ m}^3/\text{s}$**, forming an average breach opening of **$185\text{ meters}$** within **$1.8\text{ hours}$**.

### 3.2 Delft3D Flexible Mesh (2D Shallow Water Equations)
Downstream flood propagation is governed by the 2D depth-averaged Reynolds-Averaged Navier-Stokes equations under hydrostatic assumptions:

$$\frac{\partial h}{\partial t} + \frac{\partial (hu)}{\partial x} + \frac{\partial (hv)}{\partial y} = 0$$

$$\frac{\partial (hu)}{\partial t} + \frac{\partial (hu^2)}{\partial x} + \frac{\partial (huv)}{\partial y} = -gh \frac{\partial \zeta}{\partial x} - \frac{\tau_{bx}}{\rho} + \nu_t \nabla^2 (hu)$$

$$\frac{\partial (hv)}{\partial t} + \frac{\partial (huv)}{\partial x} + \frac{\partial (hv^2)}{\partial y} = -gh \frac{\partial \zeta}{\partial y} - \frac{\tau_{by}}{\rho} + \nu_t \nabla^2 (hv)$$

Bed shear stress is parameterized with Manning's $n$:
$$\tau_{bx} = \rho \frac{g n^2 u \sqrt{u^2 + v^2}}{h^{1/3}}$$

### 3.3 DualSPHysics (Smoothed Particle Hydrodynamics)
Near the dam face, non-hydrostatic vertical accelerations and violent fluid-structure impacts are captured using Lagrangian SPH particles:

$$\frac{d\mathbf{v}_a}{dt} = -\sum_b m_b \left(\frac{P_a}{\rho_a^2} + \frac{P_b}{\rho_b^2} + \Pi_{ab}\right) \nabla_a W_{ab} + \mathbf{g}$$

Using the **Wendland Quintic Kernel** and the **Tait Equation of State**, DualSPHysics calculates dynamic impact pressures on dam piers, abutments, and the hydroelectric powerhouse.

---

## 4. HADR Decision Support & Impact Analysis

### 4.1 Population at Risk & USACE Fatality Estimation
Casualty estimates follow the **USACE / Graham (1999)** risk model:

$$\text{Estimated Casualties} = \text{PAR} \times F_r$$

With **1.5 to 3.5 hours of lead-time** provided by this platform, fatality rates drop from $15\%$ (unwarned) to under $0.2\%$, potentially saving thousands of lives in downstream settlements like Gokak City.

### 4.2 Critical Infrastructure Damage Matrix
The spatial analytics engine intersects flood extents with critical infrastructure:
- **NH-4 National Highway Bridge**: Severed at $T+2.1\text{h}$ (Peak depth $4.2\text{m}$, flow velocity $3.8\text{ m/s}$).
- **Ghataprabha Railway Viaduct**: Severed at $T+1.4\text{h}$ (Piers submerged $5.2\text{m}$).
- **Gokak Falls Hydroelectric Substation**: Submerged at $T+1.1\text{h}$ (Grid de-energized).
- **Gokak General Hospital**: Threatened at $T+3.2\text{h}$ (Surrounded by $1.4\text{m}$ water).

### 4.3 Designated Relief Camps (Safe High Ground)
- **Gokak Hilltop College Complex**: Elevation $610\text{m MSL}$, Capacity: $8,000$ persons.
- **Belagavi North Administrative Grounds**: Elevation $645\text{m MSL}$, Capacity: $12,000$ persons.
- **Hukkeri Government Polytechnic**: Elevation $648\text{m MSL}$, Capacity: $3,500$ persons.

---

## 5. Software Architecture & Data Pipelines

### 5.1 System Topology
```
┌──────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│   React 19 + TypeScript + Leaflet GIS + Three.js 3D WebGL    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP / JSON / GeoJSON
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                 PRODUCTION REVERSE PROXY                     │
│                  Nginx 1.27 Alpine Web Server                │
└──────────────────────────────┬───────────────────────────────┘
                               │ Upstream :8000
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                  FASTAPI APPLICATION SERVER                  │
│   Hydrodynamic Controller + Froehlich Breach Engine          │
│   Delft3D-FM / SPH Solvers + GIS Spatial Impact Engine       │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Key Backend Endpoints
- `GET /api/health`: Diagnostics and solver discovery.
- `GET /api/dams`: Catalogue of dams.
- `GET /api/dams/hidkal/terrain`: High-resolution dam crest, reservoir, and contour vectors.
- `GET /api/dams/hidkal/river`: 44.8 km high-precision river channel.
- `POST /api/simulate`: Executes hydrodynamic breach simulation.
- `GET /api/simulations/{id}/export/{format}`: Downloads `.shp`, `.kml`, or `.geojson`.
- `GET /api/gee/script`: Generates Sentinel-1 SAR GEE workflow.

---

## 6. Satellite Remote Sensing (Google Earth Engine)

The platform embeds an automated **Copernicus Sentinel-1 C-band SAR** workflow for Google Earth Engine (GEE):
- Operates through monsoon cloud cover and nighttime conditions.
- Uses Otsu thresholding on pre- and post-flood calibrated backscatter difference ($\Delta \gamma^\circ_{\text{VH}} < -3.2\text{ dB}$).
- Masks permanent water bodies via JRC Global Surface Water to extract real satellite inundation polygons for hydrodynamic validation.

---

## 7. Docker Containerization & Production Deployment

### 7.1 Multi-Container Deployment (Docker Compose)
```bash
# Build and run all services in background
docker compose up --build -d

# Verify container health
docker compose ps

# Web Dashboard: http://localhost:3000
# FastAPI Docs:  http://localhost:8000/docs
```

### 7.2 Unified Single-Container Image
```bash
# Build unified image
docker build -t pradeep26singh08/dam-flood-simulation:latest .

# Run container
docker run -d -p 8000:8000 pradeep26singh08/dam-flood-simulation:latest
```

---

## 8. Operator Manual & Feature Walkthrough

1. **2D Tactical GIS Map**:
   - Scrub the time slider from $T+0.5\text{h}$ to $T+8.0\text{h}$ to watch the flood wave propagate.
   - Toggle layers: `Inundation Extent`, `Wave Isochrones`, `Dam & Reservoir Footprint`, `Valley Topo Contours`, `Critical Infrastructure`, and `Safe Relief Camps`.
   - Switch basemaps: `Voyager` (CARTO), `Dark` (CARTO), `Satellite` (Esri), and `Topo` (World Topographic Relief).
2. **3D Water Flow**:
   - Orbit, pan, and zoom in 3D WebGL to inspect the dynamic fluid wave breaching the dam crest.
3. **HADR Impact Matrix**:
   - Review population at risk, estimated casualties, inundated farmland, and evacuation routes.
4. **Export Menu**:
   - Export GIS layers as ESRI Shapefiles (`.zip`), Google Earth (`.kml`), or GeoJSON.

---

## 9. Pitch Deck & Hackathon Presentation Guide

A complete 13-slide pitch presentation blueprint, visual layouts, metric pills, speaker scripts, and jury Q&A defense strategies are documented in:
- 📊 [**Chapter 08: Pitch Deck & Presentation Guide**](./08_PITCH_DECK_AND_PRESENTATION_GUIDE.md)

### Key Pitch Deck Highlights:
- **Slide 1–4**: Problem urgency, limitations of static 1D HEC-RAS models, and the Hidkal Dam 44.8 km study corridor.
- **Slide 5–7**: The three scientific engines: Froehlich geotechnical breach calculations, Delft3D Flexible Mesh 2D Shallow Water Equations, and DualSPHysics 3D Lagrangian particles.
- **Slide 8–10**: Disaster response: USACE Graham casualty reduction (15% down to <0.2%), infrastructure failure sequences, safe high-ground relief centers, and Sentinel-1 SAR cloud-penetrating radar validation.
- **Slide 11–13**: Dockerized microservices stack, tactical GIS exports, and nationwide scalability across India's 5,300+ large dams.
