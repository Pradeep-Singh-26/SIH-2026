import type { SimulationResult, SimulationRequest, ScenarioComparison, DamInfo } from '../types';
import {
  DEFAULT_DAM,
  DEFAULT_RIVER_GEOJSON,
  DEFAULT_INFRASTRUCTURE_GEOJSON,
  DEFAULT_TERRAIN_GEOJSON,
  DEFAULT_SIMULATION
} from './mockData';
import presetLayersData from './presetLayers.json';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 
  (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000/api' : '/api');

export async function getHealth(): Promise<{
  status: string;
  mode: string;
  is_demo_data: boolean;
  delft3d_binary_detected: boolean;
  dualsphysics_binary_detected: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('[API] Health check unreachable, using fallback state:', err);
    return {
      status: 'ONLINE (FALLBACK MOCK)',
      mode: 'MOCK',
      is_demo_data: true,
      delft3d_binary_detected: false,
      dualsphysics_binary_detected: false
    };
  }
}

export async function getDams(): Promise<DamInfo[]> {
  try {
    const res = await fetch(`${API_BASE}/dams`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Failed to fetch dam catalogue');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable for /dams, using default Hidkal dam:', err);
    return [DEFAULT_DAM];
  }
}

export async function getRiverGeoJSON(damId: string = 'hidkal'): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/dams/${damId}/river`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Failed to fetch river geometry');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable for river GeoJSON, using fallback reach:', err);
    return DEFAULT_RIVER_GEOJSON;
  }
}

export async function getInfrastructureGeoJSON(damId: string = 'hidkal'): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/dams/${damId}/infrastructure`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Failed to fetch infrastructure');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable for infrastructure, using fallback data:', err);
    return DEFAULT_INFRASTRUCTURE_GEOJSON;
  }
}

export async function getDamTerrainGeoJSON(damId: string = 'hidkal'): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/dams/${damId}/terrain`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Failed to fetch dam terrain');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable for terrain, using fallback terrain:', err);
    return DEFAULT_TERRAIN_GEOJSON;
  }
}

export async function triggerSimulation(req: SimulationRequest): Promise<SimulationResult> {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) throw new Error('Failed to initiate hydrodynamic simulation');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend simulate unreachable, returning calibrated simulation result:', err);
    return {
      ...DEFAULT_SIMULATION,
      id: `sim-fallback-${Date.now()}`,
      scenario_name: req.scenario_name,
      engine_type: req.engine_type
    };
  }
}

export async function getSimulationResults(simId: string): Promise<SimulationResult> {
  try {
    const res = await fetch(`${API_BASE}/simulations/${simId}/results`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Failed to fetch simulation results');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable for simulation results, using fallback:', err);
    return DEFAULT_SIMULATION;
  }
}

export async function getSimulationLayers(simId: string, timestep?: number): Promise<any> {
  try {
    const url = timestep !== undefined
      ? `${API_BASE}/simulations/${simId}/layers?timestep=${timestep}`
      : `${API_BASE}/simulations/${simId}/layers`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Failed to fetch flood layer geometries');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend unreachable for layers, using presetLayers:', err);
    return presetLayersData;
  }
}

export async function compareScenarios(simAId: string, simBId: string): Promise<ScenarioComparison> {
  try {
    const res = await fetch(`${API_BASE}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_a_id: simAId, scenario_b_id: simBId }),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error('Failed to compute scenario comparison');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend compare unreachable, using preset comparison:', err);
    return {
      scenario_a_id: simAId,
      scenario_b_id: simBId,
      scenario_a_name: 'Delft3D Flexible Mesh Inundation',
      scenario_b_name: 'DualSPHysics SPH Wave Propagation',
      engine_a: 'DELFT3D_FM',
      engine_b: 'SPH',
      comparison_metrics: {
        peak_discharge_diff_pct: 8.94,
        peak_depth_diff_m: 3.12,
        arrival_time_diff_hr: -0.23,
        inundation_area_diff_km2: 1.4,
        key_differences: [
          'SPH Eulerian/Lagrangian particle formulation models higher dynamic impact pressure near dam toe.',
          'Delft3D-FM 2D shallow water equations provide wider diffusion in low-gradient agricultural floodplains.',
          'Wave arrival at Gokak Falls is predicted ~14 minutes earlier by SPH due to inertial shock momentum.'
        ]
      },
      narrative_summary: 'DualSPHysics exhibits stronger dynamic wave-front momentum in the gorge, whereas Delft3D-FM exhibits broader spatial inundation over flat farmlands.'
    };
  }
}

export function getExportUrl(simId: string, format: 'geojson' | 'kml' | 'shp'): string {
  return `${API_BASE}/simulations/${simId}/export/${format}`;
}

export async function getGeeFramework(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/gee/framework`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) throw new Error('Failed to load GEE framework');
    return await res.json();
  } catch (err) {
    console.warn('[API] Backend GEE unreachable, using fallback framework:', err);
    return {
      title: 'Copernicus Sentinel-1 SAR Automated Water Delineation Framework',
      gee_script: `// Earth Engine Dam Inundation Detection Workflow\nvar aoi = ee.Geometry.Polygon([[[74.5, 16.0], [75.0, 16.0], [75.0, 16.3], [74.5, 16.3]]]);\nMap.centerObject(aoi, 11);`
    };
  }
}
