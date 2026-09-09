import uuid
import json
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.config import MODE, DELFT3D_BIN_PATH, DUALSPHYSICS_BIN_PATH, OUTPUTS_DIR
from backend.models.schemas import (
    SimulationRequest, SimulationResult, SimulationStatus,
    DamInfo, ScenarioComparison, EngineType
)
from backend.data.hidkal_dam.data_loader import (
    get_dam_info, get_river_centerline_geojson, get_infrastructure_geojson,
    get_dam_terrain_geojson
)
from backend.hydro_engine.delft3d_runner import run_delft3d_simulation
from backend.hydro_engine.sph_runner import run_sph_simulation
from backend.hydro_engine.exporter import convert_geojson_to_kml, create_shapefile_archive

app = FastAPI(
    title="Dam Break Inundation Modelling API (SIH26161)",
    description="2D Hydrodynamic Dam Break Simulation Engine supporting Delft3D FM, SPH, and HADR Impact Analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for simulation results
SIMULATION_STORE: Dict[str, SimulationResult] = {}

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
def get_dam_river(dam_id: str):
    return get_river_centerline_geojson()

@app.get("/api/dams/{dam_id}/infrastructure")
def get_dam_infrastructure(dam_id: str):
    return get_infrastructure_geojson()

@app.get("/api/dams/{dam_id}/terrain")
def get_dam_terrain(dam_id: str):
    if dam_id != "hidkal":
        raise HTTPException(status_code=404, detail="Dam terrain not found")
    return get_dam_terrain_geojson()

@app.post("/api/simulate", response_model=SimulationResult)
def trigger_simulation(req: SimulationRequest):
    sim_id = f"sim-{uuid.uuid4().hex[:8]}"
    if req.engine_type == EngineType.SPH:
        result = run_sph_simulation(sim_id, req.breach_params, req.scenario_name)
    else:
        result = run_delft3d_simulation(sim_id, req.breach_params, req.scenario_name)
        
    SIMULATION_STORE[sim_id] = result
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
