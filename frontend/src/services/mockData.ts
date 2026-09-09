import type { DamInfo, SimulationResult } from '../types';

export const DEFAULT_DAM: DamInfo = {
  id: 'hidkal',
  name: 'Hidkal Dam (Raja Lakhamgouda Reservoir)',
  river: 'Ghataprabha River',
  basin: 'Krishna River Basin',
  state: 'Karnataka, India',
  lat: 16.1488,
  lon: 74.6366,
  crest_elev_m: 662.94,
  height_m: 53.34,
  reservoir_capacity_mcm: 1448.0,
  storage_volume_m3: 1.448e9,
  crest_length_m: 10183.0,
  spillway_capacity_m3s: 3230.0,
  description: 'Major multipurpose composite dam on Ghataprabha River in Belagavi district. Primary irrigation, drinking water, and flood moderation infrastructure.'
};

export const DEFAULT_RIVER_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.6375, 16.1492],
          [74.6410, 16.1510],
          [74.6455, 16.1528],
          [74.6520, 16.1542],
          [74.6580, 16.1565],
          [74.6645, 16.1592],
          [74.6710, 16.1610],
          [74.6785, 16.1630],
          [74.6860, 16.1615],
          [74.6940, 16.1578],
          [74.7015, 16.1530],
          [74.7090, 16.1490],
          [74.7170, 16.1465],
          [74.7245, 16.1472],
          [74.7310, 16.1515],
          [74.7365, 16.1580],
          [74.7410, 16.1660],
          [74.7445, 16.1745],
          [74.7490, 16.1795],
          [74.7565, 16.1825],
          [74.7640, 16.1830],
          [74.7725, 16.1815],
          [74.7810, 16.1790],
          [74.7895, 16.1768],
          [74.7960, 16.1755],
          [74.7985, 16.1742],
          [74.8050, 16.1720],
          [74.8130, 16.1685],
          [74.8210, 16.1650],
          [74.8300, 16.1635],
          [74.8395, 16.1660],
          [74.8480, 16.1715],
          [74.8560, 16.1780],
          [74.8645, 16.1865],
          [74.8730, 16.1950],
          [74.8820, 16.2025],
          [74.8920, 16.2085],
          [74.9030, 16.2135],
          [74.9140, 16.2170],
          [74.9250, 16.2195]
        ]
      },
      properties: {
        name: 'Ghataprabha River High-Resolution Channel',
        reach: 'Hidkal Dam to Konnur',
        length_km: 44.8,
        manning_n: 0.035
      }
    }
  ]
};

export const DEFAULT_TERRAIN_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // 1. Raja Lakhamagouda Reservoir (FRL 662.94 m MSL)
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          // Dam face interface
          [74.6366, 16.1488],
          [74.6390, 16.1530],
          [74.6418, 16.1585],
          [74.6442, 16.1645],
          [74.6460, 16.1710],
          
          // Northern shoreline and Chikkalgud embayments
          [74.6420, 16.1745],
          [74.6350, 16.1762],
          [74.6265, 16.1785],
          [74.6180, 16.1820],
          [74.6095, 16.1802],
          [74.6020, 16.1755],
          [74.5950, 16.1778],
          [74.5875, 16.1842],
          [74.5800, 16.1868],
          
          // Northern hills & Hukkeri inlet bay
          [74.5720, 16.1840],
          [74.5645, 16.1788],
          [74.5580, 16.1722],
          [74.5502, 16.1760],
          [74.5420, 16.1732],
          [74.5350, 16.1665],
          [74.5280, 16.1620],
          [74.5185, 16.1582],
          [74.5080, 16.1530],
          
          // Western meandering reach towards Daddi backwaters (Ghataprabha inflow)
          [74.4980, 16.1462],
          [74.4880, 16.1385],
          [74.4760, 16.1292],
          [74.4625, 16.1200],
          [74.4480, 16.1082],
          [74.4360, 16.0965],
          [74.4250, 16.0825],
          [74.4200, 16.0720],
          [74.4230, 16.0680],
          [74.4320, 16.0742],
          [74.4440, 16.0865],
          [74.4560, 16.0982],
          
          // Southern shore & Markandeya River inlet branch
          [74.4680, 16.1065],
          [74.4800, 16.1112],
          [74.4920, 16.1050],
          [74.5050, 16.0982],
          [74.5150, 16.0860],
          [74.5220, 16.0722],
          [74.5280, 16.0620],
          [74.5360, 16.0550],
          [74.5420, 16.0645],
          [74.5400, 16.0782],
          [74.5320, 16.0920],
          
          // Central-southern Badigwad peninsula and promontory
          [74.5385, 16.1052],
          [74.5460, 16.1160],
          [74.5550, 16.1252],
          [74.5622, 16.1310],
          [74.5680, 16.1225],
          [74.5750, 16.1120],
          [74.5850, 16.1062],
          [74.5950, 16.1085],
          [74.6025, 16.1152],
          [74.6100, 16.1215],
          [74.6150, 16.1260],
          [74.6200, 16.1305],
          
          // South dam embankment up to spillway
          [74.6255, 16.1350],
          [74.6305, 16.1405],
          [74.6345, 16.1455],
          [74.6366, 16.1488]
        ]]
      },
      properties: {
        feature_type: 'RESERVOIR_LAKE',
        name: 'Raja Lakhamagouda Reservoir (Hidkal Lake)',
        water_level_m: 662.94,
        gross_capacity_mcm: 1448.0,
        surface_area_km2: 63.4
      }
    },
    // 2. Dam Crest Embankment (10,183 m)
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.6200, 16.1305],
          [74.6255, 16.1350],
          [74.6305, 16.1405],
          [74.6345, 16.1455],
          [74.6366, 16.1488],
          [74.6390, 16.1530],
          [74.6418, 16.1585],
          [74.6442, 16.1645],
          [74.6460, 16.1710]
        ]
      },
      properties: {
        feature_type: 'DAM_CREST_AXIS',
        name: 'Hidkal Dam Crest & Embankment',
        crest_length_m: 10183.0,
        crest_elevation_m: 662.94,
        height_m: 53.34
      }
    },
    // 3. Spillway Footprint
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [74.6355, 16.1478],
          [74.6378, 16.1500],
          [74.6392, 16.1486],
          [74.6370, 16.1465],
          [74.6355, 16.1478]
        ]]
      },
      properties: {
        feature_type: 'SPILLWAY',
        name: 'Hidkal Ogee Spillway & 10 Radial Gates',
        gate_count: 10,
        spillway_capacity_m3s: 3230.0
      }
    },
    // 4. Powerhouse
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [74.6385, 16.1495]
      },
      properties: {
        feature_type: 'POWERHOUSE',
        name: 'Hidkal Hydroelectric Powerhouse (36 MW)'
      }
    },
    // 5. Gokak Falls Drop
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [74.7965, 16.1752]
      },
      properties: {
        feature_type: 'WATERFALL_GORGE',
        name: 'Gokak Falls (52m Sandstone Plunge Drop)',
        drop_height_m: 52.0
      }
    },
    // 6. Topographic Elevation Contours
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.618, 16.126], [74.630, 16.136], [74.643, 16.145], [74.656, 16.151],
          [74.670, 16.154], [74.690, 16.148], [74.715, 16.138], [74.740, 16.160],
          [74.760, 16.170], [74.785, 16.165], [74.810, 16.152], [74.840, 16.150]
        ]
      },
      properties: { feature_type: 'TERRAIN_CONTOUR', elevation_m: 660, label: '660m MSL (Dam Crest Topography)' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.642, 16.148], [74.654, 16.151], [74.668, 16.157], [74.685, 16.158],
          [74.702, 16.151], [74.718, 16.144], [74.735, 16.153], [74.748, 16.172],
          [74.768, 16.179], [74.790, 16.174], [74.815, 16.163], [74.835, 16.161]
        ]
      },
      properties: { feature_type: 'TERRAIN_CONTOUR', elevation_m: 620, label: '620m MSL (Middle Valley Terrace)' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.738, 16.155], [74.746, 16.170], [74.758, 16.180], [74.775, 16.179],
          [74.792, 16.174], [74.805, 16.169], [74.820, 16.162], [74.845, 16.164],
          [74.865, 16.175], [74.885, 16.195]
        ]
      },
      properties: { feature_type: 'TERRAIN_CONTOUR', elevation_m: 580, label: '580m MSL (Gokak Gorge Canyon Rim)' }
    },
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [74.799, 16.173], [74.810, 16.167], [74.825, 16.162], [74.845, 16.165],
          [74.860, 16.174], [74.875, 16.188], [74.890, 16.200], [74.910, 16.212]
        ]
      },
      properties: { feature_type: 'TERRAIN_CONTOUR', elevation_m: 540, label: '540m MSL (Lower Alluvial Floodplain)' }
    }
  ]
};

export const DEFAULT_INFRASTRUCTURE_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // Settlements
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.648, 16.155] }, properties: { category: 'SETTLEMENT', name: 'Hidkal Colony', population: 4200, distance_km: 1.5 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.675, 16.162] }, properties: { category: 'SETTLEMENT', name: 'Yadwad Village', population: 6800, distance_km: 4.8 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.720, 16.145] }, properties: { category: 'SETTLEMENT', name: 'Bellad Bagewadi', population: 14500, distance_km: 9.2 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.745, 16.182] }, properties: { category: 'SETTLEMENT', name: 'Borgal', population: 5300, distance_km: 13.5 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.795, 16.175] }, properties: { category: 'SETTLEMENT', name: 'Gokak Falls Township', population: 22000, distance_km: 21.0 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.835, 16.165] }, properties: { category: 'SETTLEMENT', name: 'Gokak City (Riverbank)', population: 85000, distance_km: 26.5 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.870, 16.195] }, properties: { category: 'SETTLEMENT', name: 'Konnur', population: 19500, distance_km: 32.0 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.910, 16.210] }, properties: { category: 'SETTLEMENT', name: 'Mamdapur', population: 8200, distance_km: 37.5 } },
    // Critical Infrastructure
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.685, 16.152] }, properties: { category: 'INFRASTRUCTURE', sub_type: 'BRIDGE', name: 'SH-31 Ghataprabha River Bridge', criticality: 'HIGH' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.740, 16.170] }, properties: { category: 'INFRASTRUCTURE', sub_type: 'BRIDGE', name: 'Yamakanmardi Link Bridge', criticality: 'CRITICAL' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.802, 16.176] }, properties: { category: 'INFRASTRUCTURE', sub_type: 'BRIDGE', name: 'Gokak Historic Suspension Bridge', criticality: 'EXTREME' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.825, 16.168] }, properties: { category: 'INFRASTRUCTURE', sub_type: 'HOSPITAL', name: 'Gokak General Hospital', criticality: 'HIGH' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.792, 16.178] }, properties: { category: 'INFRASTRUCTURE', sub_type: 'POWER_GRID', name: 'Gokak Falls Hydroelectric Substation', criticality: 'CRITICAL' } },
    // Relief Camps
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.605, 16.225] }, properties: { category: 'RELIEF_CAMP', name: 'Hukkeri Govt Polytechnic Relief Center', capacity: 3500, elevation_m: 648 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.710, 16.195] }, properties: { category: 'RELIEF_CAMP', name: 'Yamakanmardi Community Shelter', capacity: 2200, elevation_m: 625 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.848, 16.150] }, properties: { category: 'RELIEF_CAMP', name: 'Gokak Hilltop College Complex', capacity: 8000, elevation_m: 610 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [74.885, 16.220] }, properties: { category: 'RELIEF_CAMP', name: 'Konnur High Ground Camp', capacity: 4000, elevation_m: 590 } }
  ]
};

export const DEFAULT_SIMULATION: SimulationResult = {
  id: 'sim-preset-delft3d',
  scenario_name: 'Hidkal Dam PMF Overtopping (Delft3D-FM)',
  dam_id: 'hidkal',
  engine_type: 'DELFT3D_FM' as any,
  mode: 'MOCK',
  is_demo_data: true,
  peak_discharge_m3s: 82296.7,
  max_depth_m: 39.03,
  max_velocity_ms: 12.0,
  time_to_arrival_gokak_hr: 1.89,
  timesteps: [
    { time_hr: 0.5, inundated_area_km2: 13.59, max_depth_m: 27.23, max_velocity_ms: 10.02 },
    { time_hr: 1.0, inundated_area_km2: 28.42, max_depth_m: 30.7, max_velocity_ms: 10.85 },
    { time_hr: 2.0, inundated_area_km2: 63.99, max_depth_m: 39.03, max_velocity_ms: 12.0 },
    { time_hr: 3.0, inundated_area_km2: 97.89, max_depth_m: 37.56, max_velocity_ms: 12.0 },
    { time_hr: 4.0, inundated_area_km2: 97.89, max_depth_m: 29.54, max_velocity_ms: 10.58 },
    { time_hr: 6.0, inundated_area_km2: 97.89, max_depth_m: 18.28, max_velocity_ms: 7.68 },
    { time_hr: 8.0, inundated_area_km2: 97.89, max_depth_m: 11.31, max_velocity_ms: 5.58 }
  ],
  hydrograph: {
    peak_discharge_m3s: 82296.7,
    time_to_peak_hr: 2.42,
    total_volume_released_mcm: 1201.7,
    empirical_method: 'Froehlich (2008) + Non-linear Reservoir Routing',
    points: [
      { time_hr: 0.0, discharge_m3s: 850.0, reservoir_elevation_m: 662.0, breach_width_m: 0.0 },
      { time_hr: 0.5, discharge_m3s: 1015.7, reservoir_elevation_m: 661.98, breach_width_m: 14.55 },
      { time_hr: 1.0, discharge_m3s: 7560.13, reservoir_elevation_m: 661.88, breach_width_m: 49.23 },
      { time_hr: 1.5, discharge_m3s: 31984.91, reservoir_elevation_m: 661.33, breach_width_m: 90.63 },
      { time_hr: 2.0, discharge_m3s: 67694.01, reservoir_elevation_m: 659.81, breach_width_m: 125.32 },
      { time_hr: 2.5, discharge_m3s: 81546.64, reservoir_elevation_m: 657.34, breach_width_m: 139.86 },
      { time_hr: 3.0, discharge_m3s: 73325.33, reservoir_elevation_m: 654.76, breach_width_m: 139.86 },
      { time_hr: 4.0, discharge_m3s: 59003.65, reservoir_elevation_m: 649.92, breach_width_m: 139.86 },
      { time_hr: 5.0, discharge_m3s: 47130.02, reservoir_elevation_m: 645.49, breach_width_m: 139.86 },
      { time_hr: 6.0, discharge_m3s: 37315.95, reservoir_elevation_m: 641.44, breach_width_m: 139.86 },
      { time_hr: 7.0, discharge_m3s: 29237.19, reservoir_elevation_m: 637.74, breach_width_m: 139.86 },
      { time_hr: 8.0, discharge_m3s: 22622.05, reservoir_elevation_m: 634.38, breach_width_m: 139.86 }
    ]
  },
  impact: {
    total_inundated_area_km2: 97.89,
    population_at_risk: 140675,
    damaged_structures_count: 30581,
    submerged_roads_km: 132.2,
    submerged_farmland_ha: 6656.5,
    affected_villages: [
      'Hidkal Colony', 'Yadwad Village', 'Bellad Bagewadi', 'Borgal',
      'Gokak Falls Township', 'Gokak City (Riverbank District)', 'Konnur', 'Mamdapur'
    ],
    severed_bridges: [
      'SH-31 Ghataprabha River Bridge', 'Yamakanmardi Link Bridge', 'Gokak Historic Suspension Bridge'
    ],
    safe_evacuation_centers: [
      { id: 'rc-1', name: 'Hukkeri Govt Polytechnic Relief Center', capacity: 3500, elevation_m: 648, status: 'SAFE_HIGH_GROUND', distance_to_flood_m: 300.0 },
      { id: 'rc-2', name: 'Yamakanmardi Community Shelter', capacity: 2200, elevation_m: 625, status: 'SAFE_HIGH_GROUND', distance_to_flood_m: 300.0 },
      { id: 'rc-3', name: 'Gokak Hilltop College Complex', capacity: 8000, elevation_m: 610, status: 'SAFE_HIGH_GROUND', distance_to_flood_m: 300.0 },
      { id: 'rc-4', name: 'Konnur High Ground Camp', capacity: 4000, elevation_m: 590, status: 'SAFE_HIGH_GROUND', distance_to_flood_m: 300.0 }
    ]
  },
  created_at: '2026-09-08 02:00:00'
};
