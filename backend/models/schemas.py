from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

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

class ScenarioComparison(BaseModel):
    scenario_a_id: str
    scenario_b_id: str
    scenario_a_name: str
    scenario_b_name: str
    engine_a: str
    engine_b: str
    comparison_metrics: Dict[str, Any]
    narrative_summary: str
