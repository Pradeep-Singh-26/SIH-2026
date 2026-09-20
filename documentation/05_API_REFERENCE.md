# 🔌 FastAPI REST API Reference Specification
### Dam Break Inundation Modelling API (SIH26161)

---

## 🌐 1. Overview & Base URL

The backend provides a standardized, asynchronous RESTful API built with **FastAPI** and **Pydantic v2**, equipped with JWT authentication and MongoDB Atlas cloud persistence.

- **Default Base URL (Local Dev)**: `http://localhost:8000/api`
- **Docker Compose (Proxy)**: `http://localhost:3000/api` or `http://localhost:8000/api`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Interactive Documentation**: `http://localhost:8000/redoc`

---

## 📋 2. Endpoints Summary

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Healthcheck, mode (`MOCK` vs `REAL`), and binary status |
| **Auth** | `GET` | `/api/auth/db-status` | Check MongoDB Atlas connection status and storage fallback |
| **Auth** | `POST` | `/api/auth/signup` | Register a new responder account and issue JWT token |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user credentials and return JWT bearer token |
| **Auth** | `GET` | `/api/auth/me` | Retrieve active authenticated user profile |
| **Auth** | `GET` | `/api/auth/my-simulations`| Retrieve saved simulation runs for the authenticated user |
| **GIS Catalog** | `GET` | `/api/dams` | List all configured dams and reservoirs |
| **GIS Catalog** | `GET` | `/api/dams/{dam_id}` | Retrieve detailed metadata for a specific dam |
| **GIS Catalog** | `GET` | `/api/dams/{dam_id}/river` | GeoJSON LineString of downstream river centerline |
| **GIS Catalog** | `GET` | `/api/dams/{dam_id}/infrastructure` | GeoJSON FeatureCollection of 38 downstream critical assets |
| **GIS Catalog** | `GET` | `/api/dams/{dam_id}/terrain` | GeoJSON of reservoir polygon, 10.18km dam axis, spillway & contours |
| **Simulation** | `POST` | `/api/simulate` | Execute a new Delft3D-FM or SPH dam break simulation |
| **Simulation** | `POST` | `/api/simulate/custom-dem` | Ingest GeoTIFF raster (.tif) with breach & HADR parameters |
| **Simulation** | `GET` | `/api/simulations/{sim_id}/results` | Retrieve simulation results, hydrographs, and KPIs |
| **Simulation** | `GET` | `/api/simulations/{sim_id}/layers` | Retrieve step-by-step depth polygon and velocity vector layers |
| **Simulation** | `GET` | `/api/simulations/{sim_id}/export/{format}` | Export simulation layer as `.kml`, `.shp` (ZIP), or `.geojson` |
| **Simulation** | `GET` | `/api/simulations/compare` | Compare two simulation runs side-by-side |
| **Satellite EO** | `GET` | `/api/gee/script` | Retrieve Copernicus Sentinel-1 Google Earth Engine workflow |

---

## 🔍 3. Endpoint Specifications

### 1. System Health & Diagnostics
#### `GET /api/health`
Returns system status, active operating mode, and binary discovery flags.

**Response Example (`200 OK`)**:
```json
{
  "status": "ONLINE",
  "mode": "MOCK",
  "is_demo_data": true,
  "delft3d_binary_detected": false,
  "dualsphysics_binary_detected": false,
  "supported_engines": ["DELFT3D_FM", "SPH"],
  "active_simulations_count": 4
}
```

---

### 2. Authentication & Cloud Storage

#### `GET /api/auth/db-status`
Checks connection health to MongoDB Atlas. If Atlas is unreachable or unconfigured, the system automatically runs on local JSON storage (`backend/data/local_db/`).

**Response Example (`200 OK`)**:
```json
{
  "status": "connected",
  "mode": "mongodb_atlas",
  "database": "dam_flood_simulation",
  "users_count": 12,
  "simulations_count": 8
}
```

#### `POST /api/auth/signup`
Creates a new user profile with hashed credentials (salt + SHA-256) and returns a signed JWT access token.

**Request Body**:
```json
{
  "full_name": "Dr. Ramesh Kulkarni",
  "email": "ramesh.k@cwc.gov.in",
  "password": "SecurePassword123!",
  "agency": "Central Water Commission (CWC)",
  "role": "Chief Hydrologist"
}
```

**Response Example (`200 OK`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_7a8f9c1b2d",
    "full_name": "Dr. Ramesh Kulkarni",
    "email": "ramesh.k@cwc.gov.in",
    "agency": "Central Water Commission (CWC)",
    "role": "Chief Hydrologist",
    "created_at": "2026-09-21T03:30:00Z"
  }
}
```

#### `POST /api/auth/login`
Authenticates existing user credentials and returns a signed JWT access token.

**Request Body**:
```json
{
  "email": "ramesh.k@cwc.gov.in",
  "password": "SecurePassword123!"
}
```

#### `GET /api/auth/me`
Headers: `Authorization: Bearer <token>`  
Returns the profile information of the authenticated user.

---

### 3. Custom GeoTIFF (.tif) DEM Upload & Simulation
#### `POST /api/simulate/custom-dem`
Accepts a multipart form containing a GeoTIFF digital elevation raster file and simulation parameters. Executes hydrodynamic wave propagation and computes customized HADR metrics.

**Form Data Parameters**:
- `file`: Binary GeoTIFF raster (`.tif` or `.tiff`).
- `scenario_name`: String (e.g., `"Krishna Basin Upper Reach Flash Flood"`).
- `dam_name`: String (e.g., `"Custom Valley Check Dam"`).
- `dam_crest_elev_m`: Float (e.g., `662.0`).
- `dam_height_m`: Float (e.g., `52.0`).
- `reservoir_capacity_mcm`: Float (e.g., `1400.0`).
- `engine_type`: String (`"DELFT3D_FM"` or `"SPH"`).
- `failure_mode`: String (`"OVERTOPPING"` or `"PIPING"`).
- `initial_water_level_m`: Float (e.g., `660.0`).
- `breach_formation_time_hr`: Float (e.g., `2.0`).
- `manning_roughness_n`: Float (e.g., `0.035`).
- `estimated_valley_population`: Integer (e.g., `120000`).
- `critical_bridges_count`: Integer (e.g., `5`).
- `hospitals_and_clinics`: Integer (e.g., `8`).
- `warning_lead_time_target_hr`: Float (e.g., `2.5`).
- `evacuation_safety_buffer_m`: Float (e.g., `15.0`).

**Response Example (`200 OK`)**:
```json
{
  "id": "dem-4a2e8f19",
  "scenario_name": "Krishna Basin Upper Reach Flash Flood",
  "dam_name": "Custom Valley Check Dam",
  "engine_type": "DELFT3D_FM",
  "breach_summary": {
    "peak_discharge_m3s": 29840.0,
    "breach_width_m": 165.2,
    "breach_formation_time_hr": 2.0,
    "failure_mode": "OVERTOPPING"
  },
  "impact_summary": {
    "population_at_risk": 120000,
    "estimated_casualties": 42,
    "submerged_bridges": 4,
    "inundated_hospitals": 2,
    "safe_relief_camps_assigned": 5
  },
  "hydrograph": [ ... ],
  "isochrones": { "type": "FeatureCollection", "features": [ ... ] }
}
```

---

### 4. Standard Dam Break Simulation
#### `POST /api/simulate`
Triggers an automated hydrodynamic run on the calibrated Hidkal Dam study area.

**Request Body**:
```json
{
  "scenario_name": "Monsoon Overtopping PMF Run",
  "engine_type": "DELFT3D_FM",
  "breach_params": {
    "failure_mode": "OVERTOPPING",
    "breach_height_m": 53.3,
    "breach_width_m": 185.0,
    "breach_formation_time_hr": 1.8,
    "initial_water_level_m": 662.0,
    "reservoir_elevation_m": 662.94,
    "manning_roughness_n": 0.035,
    "simulation_duration_hr": 8.0
  }
}
```

---

### 5. Dam Infrastructure & Terrain Vector Assets

#### `GET /api/dams/hidkal/infrastructure`
Returns 38 critical assets along the 44.8 km downstream corridor as a GeoJSON FeatureCollection.

**Feature Categories**:
- `BRIDGE`: River crossings (SH-31, Yamakanmardi, Gokak Historic Suspension Bridge, Konnur Rail Bridge).
- `RELIEF_CAMP`: Verified high-ground relief centers (+27m to +48m MSL freeboard).
- `SETTLEMENT`: 13 downstream villages and urban centers (Gokak City, Konnur, Bellad Bagewadi, etc.).
- `GAUGE`: CWC Gokak Falls telemetry station, GLBC and GRBC canal head regulators.
- `HERITAGE_INDUSTRY`: Historic Gokak Mills (1887), Chalukyan temples, rail junctions, and diversion weirs.
- `EMERGENCY_SERVICES`: Fire & rescue stations and Taluk Emergency Operations Centers (TEOC).
- `HOSPITAL` & `POWER_GRID`: General hospitals and 110kV substations.

#### `GET /api/dams/hidkal/terrain`
Returns vector polygons and polylines representing:
- Dendritic Raja Lakhamagouda Reservoir water body at Full Reservoir Level (662.94 m MSL).
- 10.18 km composite earth-fill dam crest embankment axis.
- 10-radial-gate ogee spillway and stilling basin.
- Topographic valley elevation contours (660m down to 540m MSL).

---

### 6. GIS Layer Export
#### `GET /api/simulations/{sim_id}/export/{format}`
Exports flood simulation layers for desktop GIS tools (QGIS, ArcGIS, Google Earth).

**Supported Formats**:
- `shp`: Returns a `.zip` archive containing shapefile layers (`.shp`, `.shx`, `.dbf`, `.prj`).
- `kml`: Returns a Google Earth `.kml` file.
- `geojson`: Returns a standard GeoJSON FeatureCollection.

**CURL Examples**:
```bash
# Export Google Earth KML
curl -O http://localhost:8000/api/simulations/sim-preset-delft3d/export/kml

# Export ESRI Shapefile Archive (.zip)
curl -O http://localhost:8000/api/simulations/sim-preset-delft3d/export/shp

# Export GeoJSON
curl -O http://localhost:8000/api/simulations/sim-preset-delft3d/export/geojson
```

---

### 7. Scenario Comparison
#### `GET /api/simulations/compare?sim_id_1={id1}&sim_id_2={id2}`
Computes differential hydrodynamic and HADR metrics between two simulation runs.
