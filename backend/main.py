import uuid
import json
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Response, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from backend.config import MODE, DELFT3D_BIN_PATH, DUALSPHYSICS_BIN_PATH, OUTPUTS_DIR
from backend.models.schemas import (
    SimulationRequest, SimulationResult, SimulationStatus,
    DamInfo, ScenarioComparison, EngineType, BreachMode, BreachParameters,
    UserCreate, UserLogin, UserResponse, TokenResponse, HadrInputParams
)
from backend.db.mongodb import db_manager
from backend.auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_current_user
)
from backend.data.hidkal_dam.data_loader import (
    get_dam_info, get_river_centerline_geojson, get_infrastructure_geojson,
    get_dam_terrain_geojson
)
from backend.hydro_engine.delft3d_runner import run_delft3d_simulation
from backend.hydro_engine.sph_runner import run_sph_simulation
from backend.hydro_engine.dem_processor import run_custom_dem_simulation
from backend.hydro_engine.exporter import convert_geojson_to_kml, create_shapefile_archive

from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(
    title="Dam Break Inundation Modelling API (SIH26161)",
    description="2D Hydrodynamic Dam Break Simulation Engine supporting Delft3D FM, SPH, and HADR Impact Analysis",
    version="1.0.0"
)

app.add_middleware(GZipMiddleware, minimum_size=800)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for simulation results and cached GIS layers
SIMULATION_STORE: Dict[str, SimulationResult] = {}
GIS_CACHE: Dict[str, Any] = {}

# Initialize with preset default runs for instant demonstration
def _init_presets():
    # Preset 1: Delft3D FM PMF Overtopping
    req_delft = SimulationRequest(
        dam_id="hidkal",
        scenario_name="Hidkal Dam PMF Overtopping (Delft3D-FM)",
        engine_type=EngineType.DELFT3D_FM
    )
    sim_id_delft = "sim-preset-delft3d"
    res_delft = run_delft3d_simulation(sim_id_delft, req_delft.breach_params, req_delft.scenario_name)
    SIMULATION_STORE[sim_id_delft] = res_delft
    
    # Preset 2: SPH Dynamic Wave Shock
    req_sph = SimulationRequest(
        dam_id="hidkal",
        scenario_name="Hidkal Dam Dynamic Wave (SPH)",
        engine_type=EngineType.SPH
    )
    sim_id_sph = "sim-preset-sph"
    res_sph = run_sph_simulation(sim_id_sph, req_sph.breach_params, req_sph.scenario_name)
    SIMULATION_STORE[sim_id_sph] = res_sph

_init_presets()

@app.get("/api/health")
def get_health():
    return {
        "status": "ONLINE",
        "mode": MODE,
        "is_demo_data": MODE == "MOCK",
        "delft3d_binary_detected": Path(DELFT3D_BIN_PATH).is_file(),
        "dualsphysics_binary_detected": Path(DUALSPHYSICS_BIN_PATH).is_file(),
        "supported_engines": ["DELFT3D_FM", "SPH"],
        "active_simulations_count": len(SIMULATION_STORE)
    }

@app.get("/api/dams")
def list_dams():
    return [get_dam_info("hidkal")]

@app.get("/api/dams/{dam_id}")
def get_dam(dam_id: str):
    if dam_id != "hidkal":
        raise HTTPException(status_code=404, detail="Dam not found")
    return get_dam_info(dam_id)

@app.get("/api/dams/{dam_id}/river")
def get_dam_river(dam_id: str, response: Response):
    response.headers["Cache-Control"] = "public, max-age=3600"
    if "river" not in GIS_CACHE:
        GIS_CACHE["river"] = get_river_centerline_geojson()
    return GIS_CACHE["river"]

@app.get("/api/dams/{dam_id}/infrastructure")
def get_dam_infrastructure(dam_id: str, response: Response):
    response.headers["Cache-Control"] = "public, max-age=3600"
    if "infra" not in GIS_CACHE:
        GIS_CACHE["infra"] = get_infrastructure_geojson()
    return GIS_CACHE["infra"]

@app.get("/api/dams/{dam_id}/terrain")
def get_dam_terrain(dam_id: str, response: Response):
    if dam_id != "hidkal":
        raise HTTPException(status_code=404, detail="Dam terrain not found")
    response.headers["Cache-Control"] = "public, max-age=3600"
    if "terrain" not in GIS_CACHE:
        GIS_CACHE["terrain"] = get_dam_terrain_geojson()
    return GIS_CACHE["terrain"]

# -------------------------------------------------------------
# Authentication & MongoDB Atlas Routes
# -------------------------------------------------------------
@app.get("/api/auth/db-status")
def get_db_status():
    """Returns MongoDB Atlas connection status and storage mode."""
    return db_manager.get_status()

@app.post("/api/auth/signup", response_model=TokenResponse)
def signup(req: UserCreate):
    """Registers a new disaster management / hydrologist user and issues a JWT token."""
    existing = db_manager.find_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )

    pwd_data = hash_password(req.password)
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    user_doc = {
        "id": user_id,
        "full_name": req.full_name,
        "email": req.email,
        "agency": req.agency,
        "role": req.role,
        "password_hash": pwd_data["hash"],
        "password_salt": pwd_data["salt"]
    }
    created = db_manager.create_user(user_doc)
    token = create_access_token({"sub": user_id, "email": req.email, "role": req.role})

    user_resp = UserResponse(
        id=created["id"],
        full_name=created["full_name"],
        email=created["email"],
        agency=created["agency"],
        role=created["role"],
        created_at=created.get("created_at", ""),
        last_login=created.get("last_login")
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: UserLogin):
    """Authenticates user against MongoDB Atlas and returns JWT access token."""
    user = db_manager.find_user_by_email(req.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(req.password, user.get("password_hash", ""), user.get("password_salt", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    db_manager.update_user_last_login(user["id"])
    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user.get("role", "")})

    user_resp = UserResponse(
        id=user["id"],
        full_name=user["full_name"],
        email=user["email"],
        agency=user.get("agency", "National Disaster Management Authority"),
        role=user.get("role", "Hydrologist"),
        created_at=user.get("created_at", ""),
        last_login=user.get("last_login")
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user: Dict[str, Any] = Depends(require_current_user)):
    """Returns currently authenticated user profile."""
    return UserResponse(
        id=user["id"],
        full_name=user["full_name"],
        email=user["email"],
        agency=user.get("agency", "National Disaster Management Authority"),
        role=user.get("role", "Hydrologist"),
        created_at=user.get("created_at", ""),
        last_login=user.get("last_login")
    )

@app.get("/api/auth/my-simulations")
def get_my_simulations(user: Dict[str, Any] = Depends(require_current_user)):
    """Returns list of simulations saved by the logged-in user."""
    return db_manager.get_simulations_by_user(user["id"])

# -------------------------------------------------------------
# Simulation Execution & Custom DEM Ingestion Routes
# -------------------------------------------------------------
@app.post("/api/simulate", response_model=SimulationResult)
def trigger_simulation(req: SimulationRequest, current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    sim_id = f"sim-{uuid.uuid4().hex[:8]}"
    if req.engine_type == EngineType.SPH:
        result = run_sph_simulation(sim_id, req.breach_params, req.scenario_name)
    else:
        result = run_delft3d_simulation(sim_id, req.breach_params, req.scenario_name)
        
    if current_user:
        result.user_id = current_user.get("id")
        db_manager.save_simulation(result.model_dump())

    SIMULATION_STORE[sim_id] = result
    return result

@app.post("/api/simulate/custom-dem", response_model=SimulationResult)
async def trigger_custom_dem_simulation(
    file: UploadFile = File(...),
    scenario_name: str = Form("Custom Terrain Breach Simulation"),
    dam_name: str = Form("Custom Dam Site"),
    dam_crest_elev_m: float = Form(662.0),
    dam_height_m: float = Form(52.0),
    reservoir_capacity_mcm: float = Form(1400.0),
    engine_type: EngineType = Form(EngineType.DELFT3D_FM),
    # Breach Parameters
    failure_mode: BreachMode = Form(BreachMode.OVERTOPPING),
    initial_water_level_m: float = Form(660.0),
    breach_bottom_elevation_m: float = Form(615.0),
    breach_top_width_m: float = Form(160.0),
    breach_bottom_width_m: float = Form(80.0),
    breach_formation_time_hr: float = Form(2.5),
    side_slope_z: float = Form(1.0),
    manning_roughness_n: float = Form(0.035),
    simulation_duration_hr: float = Form(8.0),
    # HADR Parameters
    estimated_valley_population: int = Form(120000),
    critical_bridges_count: int = Form(4),
    hospitals_and_clinics: int = Form(6),
    warning_lead_time_target_hr: float = Form(2.0),
    evacuation_safety_buffer_m: float = Form(12.0),
    relief_priority: str = Form("HIGH"),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """
    Ingests an uploaded GeoTIFF (.tif/.tiff) DEM and executes hydrodynamic dam break
    inundation modeling and customized HADR emergency analytics.
    """
    # Validate file extension
    ext = Path(file.filename or "upload.tif").suffix.lower()
    if ext not in [".tif", ".tiff"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Please upload a GeoTIFF (.tif or .tiff) elevation raster."
        )

    upload_dir = OUTPUTS_DIR / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    sim_id = f"dem-{uuid.uuid4().hex[:8]}"
    saved_tif_path = upload_dir / f"{sim_id}_{file.filename}"

    with open(saved_tif_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    breach_params = BreachParameters(
        failure_mode=failure_mode,
        initial_water_level_m=initial_water_level_m,
        breach_bottom_elevation_m=breach_bottom_elevation_m,
        breach_top_width_m=breach_top_width_m,
        breach_bottom_width_m=breach_bottom_width_m,
        breach_formation_time_hr=breach_formation_time_hr,
        side_slope_z=side_slope_z,
        manning_roughness_n=manning_roughness_n,
        simulation_duration_hr=simulation_duration_hr
    )

    hadr_params = HadrInputParams(
        estimated_valley_population=estimated_valley_population,
        critical_bridges_count=critical_bridges_count,
        hospitals_and_clinics=hospitals_and_clinics,
        warning_lead_time_target_hr=warning_lead_time_target_hr,
        evacuation_safety_buffer_m=evacuation_safety_buffer_m,
        relief_priority=relief_priority
    )

    user_id = current_user.get("id") if current_user else None

    result = run_custom_dem_simulation(
        sim_id=sim_id,
        tif_path=saved_tif_path,
        scenario_name=scenario_name,
        dam_name=dam_name,
        dam_crest_elev_m=dam_crest_elev_m,
        dam_height_m=dam_height_m,
        reservoir_capacity_mcm=reservoir_capacity_mcm,
        breach_params=breach_params,
        hadr_params=hadr_params,
        engine_type=engine_type,
        user_id=user_id
    )

    SIMULATION_STORE[sim_id] = result
    # Save to MongoDB Atlas / local DB
    db_manager.save_simulation(result.model_dump())

    return result

@app.get("/api/simulations/{sim_id}/results", response_model=SimulationResult)
def get_simulation_results(sim_id: str):
    if sim_id not in SIMULATION_STORE:
        # Check disk cache
        sum_path = OUTPUTS_DIR / sim_id / "summary.json"
        if sum_path.exists():
            with open(sum_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return SimulationResult(**data)
        raise HTTPException(status_code=404, detail="Simulation run not found")
    return SIMULATION_STORE[sim_id]

@app.get("/api/simulations/{sim_id}/layers")
def get_simulation_layers(sim_id: str, timestep: Optional[float] = None):
    run_dir = OUTPUTS_DIR / sim_id
    layers_path = run_dir / "hydro_layers.json"
    isochrones_path = run_dir / "isochrones.json"
    
    if not layers_path.exists():
        raise HTTPException(status_code=404, detail="Simulation layer data not found")
        
    with open(layers_path, "r", encoding="utf-8") as f:
        layers_data = json.load(f)
    
    isochrones_data = {}
    if isochrones_path.exists():
        with open(isochrones_path, "r", encoding="utf-8") as f:
            isochrones_data = json.load(f)
            
    if timestep is not None:
        ts_key = str(timestep)
        if ts_key in layers_data:
            return {
                "timestep_hr": timestep,
                "layers": layers_data[ts_key],
                "isochrones": isochrones_data
            }
            
    return {
        "timesteps": list(layers_data.keys()),
        "layers_by_timestep": layers_data,
        "isochrones": isochrones_data
    }

@app.post("/api/compare", response_model=ScenarioComparison)
def compare_scenarios(payload: Dict[str, str]):
    sim_a_id = payload.get("scenario_a_id", "sim-preset-delft3d")
    sim_b_id = payload.get("scenario_b_id", "sim-preset-sph")
    
    sim_a = SIMULATION_STORE.get(sim_a_id)
    sim_b = SIMULATION_STORE.get(sim_b_id)
    
    if not sim_a or not sim_b:
        raise HTTPException(status_code=404, detail="One or both simulation runs not found for comparison")
        
    peak_diff_pct = round(((sim_b.peak_discharge_m3s - sim_a.peak_discharge_m3s) / sim_a.peak_discharge_m3s) * 100.0, 1)
    arrival_diff_min = round((sim_b.time_to_arrival_gokak_hr - sim_a.time_to_arrival_gokak_hr) * 60.0, 0)
    area_diff_km2 = round(sim_b.impact.total_inundated_area_km2 - sim_a.impact.total_inundated_area_km2, 2)
    
    narrative = (
        f"Delft3D-FM (Eulerian 2D shallow water) projects peak breach outflow of {sim_a.peak_discharge_m3s:,.1f} m³/s, "
        f"reaching Gokak City in {sim_a.time_to_arrival_gokak_hr:.2f} hours with maximum depth {sim_a.max_depth_m:.1f} m. "
        f"In contrast, SPH (Lagrangian particle formulation) resolves the steep wave front with {peak_diff_pct:+.1f}% "
        f"surge magnitude near the dam abutment and arrives {abs(arrival_diff_min):.0f} minutes "
        f"{'earlier' if arrival_diff_min < 0 else 'later'} at Gokak gorge due to dynamic pressure head acceleration."
    )
    
    metrics = {
        "peak_discharge_diff_pct": peak_diff_pct,
        "arrival_time_diff_min": arrival_diff_min,
        "inundated_area_diff_km2": area_diff_km2,
        "scenario_a": {
            "name": sim_a.scenario_name,
            "engine": sim_a.engine_type,
            "peak_q": sim_a.peak_discharge_m3s,
            "arrival_gokak_hr": sim_a.time_to_arrival_gokak_hr,
            "inundated_area_km2": sim_a.impact.total_inundated_area_km2,
            "pop_at_risk": sim_a.impact.population_at_risk
        },
        "scenario_b": {
            "name": sim_b.scenario_name,
            "engine": sim_b.engine_type,
            "peak_q": sim_b.peak_discharge_m3s,
            "arrival_gokak_hr": sim_b.time_to_arrival_gokak_hr,
            "inundated_area_km2": sim_b.impact.total_inundated_area_km2,
            "pop_at_risk": sim_b.impact.population_at_risk
        }
    }
    
    return ScenarioComparison(
        scenario_a_id=sim_a.id,
        scenario_b_id=sim_b.id,
        scenario_a_name=sim_a.scenario_name,
        scenario_b_name=sim_b.scenario_name,
        engine_a=sim_a.engine_type,
        engine_b=sim_b.engine_type,
        comparison_metrics=metrics,
        narrative_summary=narrative
    )

@app.get("/api/simulations/{sim_id}/export/{export_format}")
def export_simulation_gis(sim_id: str, export_format: str):
    run_dir = OUTPUTS_DIR / sim_id
    layers_path = run_dir / "hydro_layers.json"
    if not layers_path.exists():
        raise HTTPException(status_code=404, detail="Simulation data not found")
        
    with open(layers_path, "r", encoding="utf-8") as f:
        layers = json.load(f)
        
    # Get maximum extent polygon layer (final timestep)
    last_key = list(layers.keys())[-1]
    poly_collection = layers[last_key]["polygons"]
    
    if export_format.lower() == "geojson":
        return poly_collection
        
    elif export_format.lower() == "kml":
        kml_str = convert_geojson_to_kml(poly_collection, f"Flood_Extent_{sim_id}")
        return Response(
            content=kml_str,
            media_type="application/vnd.google-earth.kml+xml",
            headers={"Content-Disposition": f"attachment; filename=inundation_{sim_id}.kml"}
        )
        
    elif export_format.lower() in ["shp", "shapefile", "zip"]:
        zip_bytes = create_shapefile_archive(poly_collection, f"flood_inundation_{sim_id}")
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=flood_shapefile_{sim_id}.zip"}
        )
        
    raise HTTPException(status_code=400, detail="Supported export formats: geojson, kml, shp")

@app.get("/api/gee/framework")
def get_gee_satellite_framework():
    """
    Near-Real-Time Flood Inundation framework using open-source Sentinel-1 SAR & Google Earth Engine (GEE).
    Addresses Problem Statement deliverable iv.
    """
    return {
        "title": "Near Real-Time Flood Inundation Framework via Open-Source Satellite Earth Observation",
        "sensors": ["Copernicus Sentinel-1 SAR (C-band GRD)", "Copernicus Sentinel-2 MSI (Optical)"],
        "methodology": "Otsu thresholding on pre- and post-flood calibrated backscatter (VV/VH polarization) with permanent water masking via JRC Global Surface Water",
        "gee_script_snippet": """// Google Earth Engine (GEE) JavaScript API Workflow
var damPoint = ee.Geometry.Point([74.6366, 16.1488]);
var aoi = damPoint.buffer(45000).bounds();

// Filter Sentinel-1 SAR GRD collections
var preFlood = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filterDate('2026-08-01', '2026-08-20')
  .mosaic().clip(aoi);

var postFlood = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filterDate('2026-08-21', '2026-09-08')
  .mosaic().clip(aoi);

// Backscatter Difference
var diff = postFlood.select('VH').subtract(preFlood.select('VH'));
var flooded = diff.lt(-3.2); // Water causes specular reflection, reducing backscatter
Map.addLayer(flooded.updateMask(flooded), {palette: ['#00f0ff']}, 'SAR Satellite Flood Extent');
"""
    }

# Optional SPA static file serving for unified Docker container deployment
_dist_candidates = [
    Path(__file__).resolve().parent.parent / "frontend" / "dist",
    Path("/app/frontend/dist"),
    Path("/app/dist")
]
for _candidate in _dist_candidates:
    if _candidate.is_dir() and (_candidate / "index.html").is_file():
        from fastapi.staticfiles import StaticFiles
        from fastapi.responses import FileResponse
        _assets_dir = _candidate / "assets"
        if _assets_dir.is_dir():
            app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="static_assets")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def serve_spa_frontend(full_path: str):
            # Do not intercept API requests
            if full_path.startswith("api/") or full_path == "api":
                raise HTTPException(status_code=404, detail="API endpoint not found")
            target = _candidate / full_path
            if target.is_file():
                return FileResponse(str(target))
            return FileResponse(str(_candidate / "index.html"))
        break
