from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# --- User & Auth Schemas ---
class UserRole(str, Enum):
    HYDROLOGIST = "Hydrologist"
    EMERGENCY_COMMANDER = "Emergency Disaster Commander"
    GIS_ANALYST = "GIS & Remote Sensing Analyst"
    FIELD_OFFICER = "Field Response Officer"
    RESEARCHER = "Research Scholar"

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=120)
    password: str = Field(..., min_length=6)
    agency: str = Field(default="National Disaster Management Authority (NDMA)")
    role: str = Field(default="Hydrologist")

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    agency: str
    role: str
    created_at: str
    last_login: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Hydrodynamic Simulation Schemas ---
class BreachMode(str, Enum):
    OVERTOPPING = "OVERTOPPING"
    PIPING = "PIPING"

class EngineType(str, Enum):
    DELFT3D_FM = "DELFT3D_FM"
    SPH = "SPH"

class DamInfo(BaseModel):
    id: str
    name: str
    river: str
    basin: str
    state: str
    lat: float
    lon: float
    crest_elev_m: float
    height_m: float
    reservoir_capacity_mcm: float # Million Cubic Meters
    storage_volume_m3: float
    crest_length_m: float
    spillway_capacity_m3s: float
    description: str

class BreachParameters(BaseModel):
    failure_mode: BreachMode = BreachMode.OVERTOPPING
    initial_water_level_m: float = Field(default=662.0, description="Reservoir water elevation at breach initiation (m MSL)")
    breach_bottom_elevation_m: float = Field(default=615.0, description="Final breach invert elevation (m MSL)")
    breach_top_width_m: float = Field(default=160.0, description="Final breach crest width (m)")
    breach_bottom_width_m: float = Field(default=80.0, description="Final breach bottom width (m)")
    breach_formation_time_hr: float = Field(default=2.5, description="Breach development time (hours)")
    side_slope_z: float = Field(default=1.0, description="Breach side slope z (z H : 1 V)")
    manning_roughness_n: float = Field(default=0.035, description="Downstream riverbed Manning roughness coefficient n")
    simulation_duration_hr: float = Field(default=8.0, description="Total simulation propagation duration (hours)")
    time_step_min: float = Field(default=15.0, description="Output grid interval (minutes)")

class BreachHydrographPoint(BaseModel):
    time_hr: float
    discharge_m3s: float
    reservoir_elevation_m: float
    breach_width_m: float

class BreachHydrograph(BaseModel):
    peak_discharge_m3s: float
    time_to_peak_hr: float
    total_volume_released_mcm: float
    empirical_method: str = "Froehlich (2008) / MacDonald-Langridge"
    points: List[BreachHydrographPoint]

class SimulationRequest(BaseModel):
    dam_id: str = "hidkal"
    scenario_name: str = "Hidkal PMF Overtopping Breach"
    engine_type: EngineType = EngineType.DELFT3D_FM
    breach_params: BreachParameters = Field(default_factory=BreachParameters)

# --- HADR Input & Output Schemas ---
class HadrInputParams(BaseModel):
    estimated_valley_population: int = Field(default=120000, description="Downstream population residing in floodplain corridor")
    critical_bridges_count: int = Field(default=4, description="Number of primary highway/rail bridges in path")
    hospitals_and_clinics: int = Field(default=6, description="Medical facilities within potential inundation zone")
    warning_lead_time_target_hr: float = Field(default=2.0, description="Minimum emergency evacuation lead time (hours)")
    evacuation_safety_buffer_m: float = Field(default=12.0, description="Elevation height above flood crest for designated safe relief zones (m)")
    relief_priority: str = Field(default="HIGH", description="Emergency alert level: ROUTINE, MODERATE, HIGH, EXTREME")

class DemMetadata(BaseModel):
    filename: str
    file_size_kb: float
    width_px: int
    height_px: int
    min_elevation_m: float
    max_elevation_m: float
    mean_elevation_m: float
    crs_info: str = "WGS84 / UTM Zone (Georeferenced)"
    resolution_m: float = 30.0

class CustomDemSimulationRequest(BaseModel):
    scenario_name: str = "Custom DEM Inundation Simulation"
    dam_name: str = "Custom Dam Site"
    dam_crest_elev_m: float = Field(default=660.0)
    dam_height_m: float = Field(default=50.0)
    reservoir_capacity_mcm: float = Field(default=1200.0)
    engine_type: EngineType = EngineType.DELFT3D_FM
    breach_params: BreachParameters = Field(default_factory=BreachParameters)
    hadr_params: HadrInputParams = Field(default_factory=HadrInputParams)

class SimulationStatus(BaseModel):
    id: str
    status: str = "COMPLETED"
    progress_percent: float = 100.0
    message: str = "Simulation completed successfully"
    mode: str = "MOCK"

class FloodTimestep(BaseModel):
    time_hr: float
    inundated_area_km2: float
    max_depth_m: float
    max_velocity_ms: float

class ImpactAssetSummary(BaseModel):
    total_inundated_area_km2: float
    population_at_risk: int
    damaged_structures_count: int
    submerged_roads_km: float
    submerged_farmland_ha: float
    affected_villages: List[str]
    severed_bridges: List[str]
    safe_evacuation_centers: List[Dict[str, Any]]
    # Enhanced HADR fields
    evacuation_readiness_score_pct: Optional[float] = 88.0
    emergency_shelter_deficit: Optional[int] = 0
    priority_rescue_zones: Optional[List[str]] = None

class SimulationResult(BaseModel):
    id: str
    scenario_name: str
    dam_id: str
    engine_type: EngineType
    mode: str  # "MOCK" or "REAL"
    is_demo_data: bool
    peak_discharge_m3s: float
    max_depth_m: float
    max_velocity_ms: float
    time_to_arrival_gokak_hr: float
    timesteps: List[FloodTimestep]
    hydrograph: BreachHydrograph
    impact: ImpactAssetSummary
    created_at: str
    user_id: Optional[str] = None
    is_custom_dem: Optional[bool] = False
    dem_metadata: Optional[DemMetadata] = None

class ScenarioComparison(BaseModel):
    scenario_a_id: str
    scenario_b_id: str
    scenario_a_name: str
    scenario_b_name: str
    engine_a: str
    engine_b: str
    comparison_metrics: Dict[str, Any]
    narrative_summary: str
