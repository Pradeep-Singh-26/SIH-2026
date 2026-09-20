export type BreachMode = 'OVERTOPPING' | 'PIPING';
export type EngineType = 'DELFT3D_FM' | 'SPH';

// --- User Authentication & Profile Types ---
export interface User {
  id: string;
  full_name: string;
  email: string;
  agency: string;
  role: string;
  created_at: string;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DbStatus {
  is_atlas: boolean;
  status: string;
  database_name: string;
  atlas_uri_configured: boolean;
}

// --- Dam & Hydraulic Specifications ---
export interface DamInfo {
  id: string;
  name: string;
  river: string;
  basin: string;
  state: string;
  lat: number;
  lon: number;
  crest_elev_m: number;
  height_m: number;
  reservoir_capacity_mcm: number;
  storage_volume_m3: number;
  crest_length_m: number;
  spillway_capacity_m3s: number;
  description: string;
}

export interface BreachParameters {
  failure_mode: BreachMode;
  initial_water_level_m: number;
  breach_bottom_elevation_m: number;
  breach_top_width_m: number;
  breach_bottom_width_m: number;
  breach_formation_time_hr: number;
  side_slope_z: number;
  manning_roughness_n: number;
  simulation_duration_hr: number;
  time_step_min: number;
}

export interface BreachHydrographPoint {
  time_hr: number;
  discharge_m3s: number;
  reservoir_elevation_m: number;
  breach_width_m: number;
}

export interface BreachHydrograph {
  peak_discharge_m3s: number;
  time_to_peak_hr: number;
  total_volume_released_mcm: number;
  empirical_method: string;
  points: BreachHydrographPoint[];
}

export interface FloodTimestep {
  time_hr: number;
  inundated_area_km2: number;
  max_depth_m: number;
  max_velocity_ms: number;
}

export interface ReliefCamp {
  id: string;
  name: string;
  capacity: number;
  elevation_m: number;
  status: string;
  distance_to_flood_m?: number;
}

export interface ImpactAssetSummary {
  total_inundated_area_km2: number;
  population_at_risk: number;
  damaged_structures_count: number;
  submerged_roads_km: number;
  submerged_farmland_ha: number;
  affected_villages: string[];
  severed_bridges: string[];
  safe_evacuation_centers: ReliefCamp[];
  evacuation_readiness_score_pct?: number;
  emergency_shelter_deficit?: number;
  priority_rescue_zones?: string[];
}

export interface DemMetadata {
  filename: string;
  file_size_kb: number;
  width_px: number;
  height_px: number;
  min_elevation_m: number;
  max_elevation_m: number;
  mean_elevation_m: number;
  crs_info: string;
  resolution_m: number;
}

export interface SimulationResult {
  id: string;
  scenario_name: string;
  dam_id: string;
  engine_type: EngineType;
  mode: string;
  is_demo_data: boolean;
  peak_discharge_m3s: number;
  max_depth_m: number;
  max_velocity_ms: number;
  time_to_arrival_gokak_hr: number;
  timesteps: FloodTimestep[];
  hydrograph: BreachHydrograph;
  impact: ImpactAssetSummary;
  created_at: string;
  user_id?: string;
  is_custom_dem?: boolean;
  dem_metadata?: DemMetadata;
}

export interface SimulationRequest {
  dam_id: string;
  scenario_name: string;
  engine_type: EngineType;
  breach_params: BreachParameters;
}

export interface ScenarioComparison {
  scenario_a_id: string;
  scenario_b_id: string;
  scenario_a_name: string;
  scenario_b_name: string;
  engine_a: string;
  engine_b: string;
  comparison_metrics: any;
  narrative_summary: string;
}

// --- HADR Input Configuration ---
export interface HadrInputParams {
  estimated_valley_population: number;
  critical_bridges_count: number;
  hospitals_and_clinics: number;
  warning_lead_time_target_hr: number;
  evacuation_safety_buffer_m: number;
  relief_priority: 'ROUTINE' | 'MODERATE' | 'HIGH' | 'EXTREME';
}

export interface CustomDemParams {
  scenario_name: string;
  dam_name: string;
  dam_crest_elev_m: number;
  dam_height_m: number;
  reservoir_capacity_mcm: number;
  engine_type: EngineType;
  breach_params: BreachParameters;
  hadr_params: HadrInputParams;
}
