# 🔌 FastAPI REST API Reference Specification
### Dam Break Inundation Modelling API (SIH26161)

---

## 🌐 1. Overview & Base URL

The backend provides a standardized, asynchronous RESTful API built with **FastAPI** and **Pydantic v2**.

- **Default Base URL (Local Dev)**: `http://localhost:8000/api`
- **Docker Compose (Proxy)**: `http://localhost:3000/api` or `http://localhost:8000/api`
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Interactive Documentation**: `http://localhost:8000/redoc`

---

## 📋 2. Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck and hydrodynamic solver status |
| `GET` | `/api/dams` | List all configured dams and reservoirs |
| `GET` | `/api/dams/{dam_id}` | Retrieve detailed metadata for a specific dam |
| `GET` | `/api/dams/{dam_id}/river` | GeoJSON LineString of downstream river centerline |
| `GET` | `/api/dams/{dam_id}/infrastructure` | GeoJSON FeatureCollection of downstream critical assets |
| `POST` | `/api/simulation/run` | Execute a new Delft3D-FM or SPH dam break simulation |
| `GET` | `/api/simulation/{sim_id}` | Retrieve simulation results, hydrographs, and isochrones |
| `GET` | `/api/simulation/{sim_id}/export/{format}` | Export simulation layer as `.kml`, `.shp` (ZIP), or `.geojson` |
| `GET` | `/api/simulation/compare` | Compare two simulation runs side-by-side |
| `GET` | `/api/gee/script` | Retrieve Copernicus Sentinel-1 Google Earth Engine workflow |

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
  "active_simulations_count": 2
}
```

---

### 2. Dam Catalogue
#### `GET /api/dams`
Returns metadata for all available dams in the system.

**Response Example (`200 OK`)**:
```json
[
  {
    "id": "hidkal",
    "name": "Hidkal Dam (Raja Lakhamagouda)",
    "river": "Ghataprabha River",
    "basin": "Krishna Basin",
    "latitude": 16.1488,
    "longitude": 74.6366,
    "dam_type": "Composite Earth-Fill / Masonry",
    "height_m": 53.34,
    "crest_length_m": 10183.0,
    "storage_capacity_mcm": 1448.0,
    "full_reservoir_level_m": 662.94,
    "max_water_level_m": 664.0,
    "spillway_capacity_m3s": 5890.0,
    "default_dem_resolution_m": 30.0
  }
]
```

---

### 3. Run Dam Break Simulation
#### `POST /api/simulation/run`
Triggers an automated hydrodynamic run based on user parameters.

**Request Body**:
```json
{
  "dam_id": "hidkal",
  "scenario_name": "Emergency Monsoon Overtopping Run",
  "engine_type": "DELFT3D_FM",
  "breach_params": {
    "failure_mode": "OVERTOPPING",
    "breach_height_m": 53.3,
    "breach_width_m": 185.0,
    "breach_formation_time_hr": 1.8,
    "reservoir_elevation_m": 662.94,
    "initial_water_level_m": 662.0
  }
}
```

**Response Example (`200 OK`)**:
```json
{
  "simulation_id": "sim-8f3e2d1a-4b5c-4d8e-9f0a-1b2c3d4e5f6a",
  "dam_id": "hidkal",
  "scenario_name": "Emergency Monsoon Overtopping Run",
  "engine_type": "DELFT3D_FM",
  "status": "COMPLETED",
  "mode": "MOCK",
  "is_demo_data": true,
  "breach_params": { ... },
  "peak_discharge_m3s": 28450.0,
  "total_flood_area_km2": 48.6,
  "max_depth_m": 11.4,
  "max_velocity_ms": 6.8,
  "time_series": [
    { "time_hr": 0.0, "discharge_m3s": 500.0, "depth_m": 1.2, "velocity_ms": 0.8 },
    { "time_hr": 1.0, "discharge_m3s": 18200.0, "depth_m": 7.4, "velocity_ms": 4.5 },
    { "time_hr": 2.0, "discharge_m3s": 28450.0, "depth_m": 11.4, "velocity_ms": 6.8 }
  ],
  "inundation_geojson": { "type": "FeatureCollection", "features": [ ... ] },
  "isochrones_geojson": { "type": "FeatureCollection", "features": [ ... ] },
  "impact_summary": {
    "population_at_risk": 14200,
    "estimated_casualties": 35,
    "agricultural_land_submerged_ha": 3420.0,
    "critical_assets_affected": [ ... ],
    "recommended_relief_camps": [ ... ]
  }
}
```

---

### 4. GIS Layer Export
#### `GET /api/simulation/{sim_id}/export/{format}`
Exports simulation inundation layers for GIS desktop software.

**Supported Path Parameters**:
- `format`: `kml`, `shp`, or `geojson`

**CURL Examples**:
```bash
# Export Google Earth KML
curl -O http://localhost:8000/api/simulation/sim-preset-delft3d/export/kml

# Export ESRI Shapefile Archive (.zip)
curl -O http://localhost:8000/api/simulation/sim-preset-delft3d/export/shp

# Export GeoJSON
curl -O http://localhost:8000/api/simulation/sim-preset-delft3d/export/geojson
```

---

### 5. Scenario Comparison
#### `GET /api/simulation/compare?sim_id_1={id1}&sim_id_2={id2}`
Computes differential flood metrics between two hydrodynamic runs.

**Response Example (`200 OK`)**:
```json
{
  "scenario_1": { ... },
  "scenario_2": { ... },
  "delta_peak_discharge_m3s": 4250.0,
  "delta_flood_area_km2": 6.2,
  "delta_max_depth_m": 1.8,
  "comparison_summary": "Scenario 1 exhibits 14.9% higher peak discharge with an additional 6.2 km² of flooded agricultural area."
}
```
