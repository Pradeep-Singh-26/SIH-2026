import json
from typing import Dict, List, Any
from backend.models.schemas import DamInfo

HIDKAL_DAM_INFO = DamInfo(
    id="hidkal",
    name="Hidkal Dam (Raja Lakhamgouda Reservoir)",
    river="Ghataprabha River",
    basin="Krishna River Basin",
    state="Karnataka, India",
    lat=16.1488,
    lon=74.6366,
    crest_elev_m=662.94,
    height_m=53.34,
    reservoir_capacity_mcm=1448.0,
    storage_volume_m3=1.448e9,
    crest_length_m=10183.0,
    spillway_capacity_m3s=3230.0,
    description="Major multipurpose composite dam on Ghataprabha River in Belagavi district. Primary irrigation, drinking water, and flood moderation infrastructure protecting the lower Krishna basin."
)

DOWNSTREAM_SETTLEMENTS = [
    {"name": "Hidkal Colony", "lat": 16.155, "lon": 74.648, "population": 4200, "elevation_m": 612, "dist_km": 1.5, "assigned_shelter": "Hukkeri Govt Polytechnic Relief Center"},
    {"name": "Yadwad Village", "lat": 16.162, "lon": 74.675, "population": 6800, "elevation_m": 605, "dist_km": 4.8, "assigned_shelter": "Yamakanmardi Community Shelter"},
    {"name": "Bellad Bagewadi", "lat": 16.145, "lon": 74.720, "population": 14500, "elevation_m": 598, "dist_km": 9.2, "assigned_shelter": "Yamakanmardi Community Shelter"},
    {"name": "Yamakanmardi Town", "lat": 16.185, "lon": 74.715, "population": 11200, "elevation_m": 622, "dist_km": 10.8, "assigned_shelter": "Yamakanmardi Community Shelter"},
    {"name": "Hukkeri Taluk HQ", "lat": 16.232, "lon": 74.602, "population": 24500, "elevation_m": 645, "dist_km": 12.2, "assigned_shelter": "Hukkeri Govt Polytechnic Relief Center"},
    {"name": "Borgal", "lat": 16.182, "lon": 74.745, "population": 5300, "elevation_m": 589, "dist_km": 13.5, "assigned_shelter": "Yamakanmardi Community Shelter"},
    {"name": "Ankalgi Village", "lat": 16.125, "lon": 74.760, "population": 7500, "elevation_m": 602, "dist_km": 15.5, "assigned_shelter": "Yamakanmardi Community Shelter"},
    {"name": "Naganur Village", "lat": 16.160, "lon": 74.775, "population": 5100, "elevation_m": 585, "dist_km": 18.2, "assigned_shelter": "Gokak Hilltop College Complex"},
    {"name": "Gokak Falls Township", "lat": 16.175, "lon": 74.795, "population": 22000, "elevation_m": 574, "dist_km": 21.0, "assigned_shelter": "Gokak Hilltop College Complex"},
    {"name": "Gokak City (Riverbank)", "lat": 16.165, "lon": 74.835, "population": 85000, "elevation_m": 562, "dist_km": 26.5, "assigned_shelter": "Gokak Hilltop College Complex"},
    {"name": "Lolakatte Village", "lat": 16.185, "lon": 74.855, "population": 4300, "elevation_m": 558, "dist_km": 29.5, "assigned_shelter": "Gokak Hilltop College Complex"},
    {"name": "Konnur", "lat": 16.195, "lon": 74.870, "population": 19500, "elevation_m": 554, "dist_km": 32.0, "assigned_shelter": "Konnur High Ground Camp"},
    {"name": "Mamdapur", "lat": 16.210, "lon": 74.910, "population": 8200, "elevation_m": 546, "dist_km": 37.5, "assigned_shelter": "Konnur High Ground Camp"}
]

CRITICAL_INFRASTRUCTURE = [
    # River Bridges & Roadway Arteries
    {"id": "br-dam", "name": "Hidkal Dam Toe Tailrace Bridge", "type": "BRIDGE", "lat": 16.1542, "lon": 74.6520, "dist_km": 1.6, "criticality": "CRITICAL"},
    {"id": "br-1", "name": "SH-31 Ghataprabha River Bridge", "type": "BRIDGE", "lat": 16.1520, "lon": 74.6850, "dist_km": 5.8, "criticality": "HIGH"},
    {"id": "br-2", "name": "Yamakanmardi Highway Bridge", "type": "BRIDGE", "lat": 16.1700, "lon": 74.7400, "dist_km": 14.4, "criticality": "CRITICAL"},
    {"id": "br-3", "name": "Gokak Historic Suspension Bridge (1887)", "type": "BRIDGE", "lat": 16.1760, "lon": 74.8020, "dist_km": 23.3, "criticality": "EXTREME"},
    {"id": "br-4", "name": "Gokak Town Road Bridge (SH-134)", "type": "BRIDGE", "lat": 16.1670, "lon": 74.8320, "dist_km": 26.5, "criticality": "HIGH"},
    {"id": "br-5", "name": "Konnur Rail & Highway Bridge", "type": "BRIDGE", "lat": 16.2025, "lon": 74.8820, "dist_km": 32.9, "criticality": "CRITICAL"},
    # Hydrometric Gauging Stations & Canal Lifelines
    {"id": "gauge-glbc", "name": "Ghataprabha Left Bank Canal Head Regulator (GLBC)", "type": "GAUGE", "lat": 16.1510, "lon": 74.6395, "dist_km": 0.8, "criticality": "HIGH"},
    {"id": "gauge-grbc", "name": "Ghataprabha Right Bank Canal Head Regulator (GRBC)", "type": "GAUGE", "lat": 16.1450, "lon": 74.6360, "dist_km": 0.6, "criticality": "HIGH"},
    {"id": "gauge-cwc-1", "name": "CWC Gokak Falls Stream Telemetry Gauge", "type": "GAUGE", "lat": 16.1758, "lon": 74.7930, "dist_km": 21.2, "criticality": "CRITICAL"},
    # Industrial & Heritage Landmarks
    {"id": "her-mill", "name": "Historic Gokak Mills (Forbes Gokak Ltd, 1887)", "type": "HERITAGE_INDUSTRY", "lat": 16.1770, "lon": 74.7975, "dist_km": 21.6, "criticality": "HIGH"},
    {"id": "her-temple", "name": "Mahalingeshwara Temple (Chalikyan Shrine)", "type": "HERITAGE_INDUSTRY", "lat": 16.1745, "lon": 74.7960, "dist_km": 21.3, "criticality": "MEDIUM"},
    {"id": "her-rail", "name": "Gokak Road Railway Junction (SWR)", "type": "HERITAGE_INDUSTRY", "lat": 16.2080, "lon": 74.8320, "dist_km": 27.8, "criticality": "CRITICAL"},
    {"id": "her-weir", "name": "Konnur Historical Anicut & Diversion Barrage", "type": "HERITAGE_INDUSTRY", "lat": 16.2040, "lon": 74.8810, "dist_km": 33.1, "criticality": "HIGH"},
    {"id": "ind-yadwad", "name": "Yadwad Industrial Limestone Corridor", "type": "HERITAGE_INDUSTRY", "lat": 16.1850, "lon": 74.6950, "dist_km": 7.2, "criticality": "MEDIUM"},
    # Emergency Response, Medical & Power Assets
    {"id": "hosp-1", "name": "Gokak General Hospital & Trauma Center", "type": "HOSPITAL", "lat": 16.1680, "lon": 74.8250, "dist_km": 26.0, "criticality": "HIGH"},
    {"id": "hosp-2", "name": "Hukkeri Taluk General Hospital", "type": "HOSPITAL", "lat": 16.2300, "lon": 74.6000, "dist_km": 12.0, "criticality": "HIGH"},
    {"id": "power-1", "name": "Gokak Falls 110kV Hydro Substation", "type": "POWER_GRID", "lat": 16.1780, "lon": 74.7920, "dist_km": 21.5, "criticality": "CRITICAL"},
    {"id": "power-dam", "name": "Hidkal Hydroelectric Powerhouse & Switchyard", "type": "POWER_GRID", "lat": 16.1495, "lon": 74.6385, "dist_km": 0.5, "criticality": "CRITICAL"},
    {"id": "emerg-fire", "name": "Gokak Fire & Emergency Rescue Station", "type": "EMERGENCY_SERVICES", "lat": 16.1710, "lon": 74.8210, "dist_km": 25.4, "criticality": "CRITICAL"},
    {"id": "emerg-teoc", "name": "Hukkeri Taluk Emergency Operations Center (TEOC)", "type": "EMERGENCY_SERVICES", "lat": 16.2350, "lon": 74.5950, "dist_km": 12.5, "criticality": "CRITICAL"}
]

RELIEF_CAMPS = [
    {"id": "rc-1", "name": "Hukkeri Govt Polytechnic Relief Center", "lat": 16.2250, "lon": 74.6050, "capacity": 3500, "elevation_m": 648, "buffer_m": 36.0, "status": "SAFE_HIGH_GROUND", "facilities": "Helipad, Medical Triage, Potable Water, Wireless Comm"},
    {"id": "rc-2", "name": "Yamakanmardi Community Shelter", "lat": 16.1950, "lon": 74.7100, "capacity": 2200, "elevation_m": 625, "buffer_m": 27.0, "status": "SAFE_HIGH_GROUND", "facilities": "Emergency Food Distribution, Field Clinic, Generators"},
    {"id": "rc-3", "name": "Gokak Hilltop College Complex", "lat": 16.1500, "lon": 74.8480, "capacity": 8000, "elevation_m": 610, "buffer_m": 48.0, "status": "SAFE_HIGH_GROUND", "facilities": "Major Evacuee Hub, Surgical Center, Helipad, State NDRF Base"},
    {"id": "rc-4", "name": "Konnur High Ground Camp", "lat": 16.2200, "lon": 74.8850, "capacity": 4000, "elevation_m": 590, "buffer_m": 36.0, "status": "SAFE_HIGH_GROUND", "facilities": "Boat Rescue Depot, Relief Supplies, Medical Outpost"},
    {"id": "rc-5", "name": "Sankeshwar - Hukkeri Regional Logistics Hub", "lat": 16.2550, "lon": 74.5500, "capacity": 6000, "elevation_m": 660, "buffer_m": 48.0, "status": "SAFE_HIGH_GROUND", "facilities": "National Disaster Airlift Corridor, Central Supply Depot"}
]

def get_dam_info(dam_id: str = "hidkal") -> DamInfo:
    return HIDKAL_DAM_INFO

def get_river_centerline_geojson() -> Dict[str, Any]:
    """High-precision Ghataprabha river reach downstream from Hidkal Dam toe through Gokak Gorge to Konnur."""
    coords = [
        [74.6375, 16.1492], # Spillway stilling basin / Dam toe
        [74.6410, 16.1510],
        [74.6455, 16.1528],
        [74.6520, 16.1542], # Hidkal Colony bridge
        [74.6580, 16.1565],
        [74.6645, 16.1592],
        [74.6710, 16.1610], # North of Yadwad
        [74.6785, 16.1630],
        [74.6860, 16.1615],
        [74.6940, 16.1578],
        [74.7015, 16.1530],
        [74.7090, 16.1490],
        [74.7170, 16.1465], # Bellad Bagewadi bend
        [74.7245, 16.1472],
        [74.7310, 16.1515],
        [74.7365, 16.1580],
        [74.7410, 16.1660],
        [74.7445, 16.1745], # Yamakanmardi bridge reach
        [74.7490, 16.1795], # Borgal meander
        [74.7565, 16.1825],
        [74.7640, 16.1830],
        [74.7725, 16.1815],
        [74.7810, 16.1790],
        [74.7895, 16.1768],
        [74.7960, 16.1755], # Gokak Falls crest (Plunge point)
        [74.7985, 16.1742], # Deep sandstone gorge pool
        [74.8050, 16.1720], # Suspension bridge reach
        [74.8130, 16.1685],
        [74.8210, 16.1650], # Entering Gokak city
        [74.8300, 16.1635], # Gokak urban riverfront
        [74.8395, 16.1660],
        [74.8480, 16.1715],
        [74.8560, 16.1780],
        [74.8645, 16.1865],
        [74.8730, 16.1950], # Konnur upstream reach
        [74.8820, 16.2025], # Konnur road bridge
        [74.8920, 16.2085],
        [74.9030, 16.2135],
        [74.9140, 16.2170], # Mamdapur confluence approach
        [74.9250, 16.2195]
    ]
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                },
                "properties": {
                    "name": "Ghataprabha River High-Resolution Channel",
                    "reach": "Hidkal Dam to Konnur Reach",
                    "length_km": 44.8,
                    "manning_n": 0.035,
                    "gradient_mps": 0.0024
                }
            }
        ]
    }

def get_dam_terrain_geojson() -> Dict[str, Any]:
    """
    Returns accurate vector terrain layers for Hidkal Dam (Raja Lakhamagouda Dam):
    1. Raja Lakhamagouda Reservoir water body at Full Reservoir Level (662.94 m MSL)
    2. Dam Crest Embankment alignment (10.18 km length)
    3. Masonry Spillway & Radial Gate structure
    4. Topographic Elevation Contours (660m down to 540m MSL) along the river valley
    5. Canyon & Gorge geological features
    """
    # 1. Reservoir body at Full Reservoir Level (FRL 662.94 m MSL)
    # 1. Natural Dendritic Reservoir Body at Full Reservoir Level (FRL 662.94 m MSL)
    # Reflects the true dendritic morphology of Raja Lakhamagouda Reservoir
    # with its Ghataprabha upstream river inlets, bays, coves, and peninsulas
    reservoir_polygon = [
        # Dam face interface (eastern boundary along embankment)
        [74.6366, 16.1488], # Central Spillway
        [74.6390, 16.1530],
        [74.6418, 16.1585],
        [74.6442, 16.1645],
        [74.6460, 16.1710], # Right bank dam abutment
        
        # Northern shoreline and Chikkalgud embayments
        [74.6420, 16.1745],
        [74.6350, 16.1762],
        [74.6265, 16.1785],
        [74.6180, 16.1820],
        [74.6095, 16.1802],
        [74.6020, 16.1755],
        [74.5950, 16.1778],
        [74.5875, 16.1842],
        [74.5800, 16.1868],
        
        # Northern hills & Hukkeri inlet bay
        [74.5720, 16.1840],
        [74.5645, 16.1788],
        [74.5580, 16.1722],
        [74.5502, 16.1760],
        [74.5420, 16.1732],
        [74.5350, 16.1665],
        [74.5280, 16.1620],
        [74.5185, 16.1582],
        [74.5080, 16.1530],
        
        # Western meandering reach towards Daddi backwaters (Ghataprabha inflow)
        [74.4980, 16.1462],
        [74.4880, 16.1385],
        [74.4760, 16.1292],
        [74.4625, 16.1200],
        [74.4480, 16.1082],
        [74.4360, 16.0965],
        [74.4250, 16.0825],
        [74.4200, 16.0720], # Upstream backwater tip
        [74.4230, 16.0680],
        [74.4320, 16.0742],
        [74.4440, 16.0865],
        [74.4560, 16.0982],
        
        # Southern shore & Markandeya River inlet branch
        [74.4680, 16.1065],
        [74.4800, 16.1112],
        [74.4920, 16.1050],
        [74.5050, 16.0982],
        [74.5150, 16.0860],
        [74.5220, 16.0722],
        [74.5280, 16.0620],
        [74.5360, 16.0550], # Markandeya southern cove
        [74.5420, 16.0645],
        [74.5400, 16.0782],
        [74.5320, 16.0920],
        
        # Central-southern Badigwad peninsula and promontory
        [74.5385, 16.1052],
        [74.5460, 16.1160],
        [74.5550, 16.1252],
        [74.5622, 16.1310], # Promontory point
        [74.5680, 16.1225],
        [74.5750, 16.1120],
        [74.5850, 16.1062],
        [74.5950, 16.1085],
        [74.6025, 16.1152],
        [74.6100, 16.1215],
        [74.6150, 16.1260],
        [74.6200, 16.1305], # Left bank dam abutment
        
        # South dam embankment up to spillway
        [74.6255, 16.1350],
        [74.6305, 16.1405],
        [74.6345, 16.1455],
        [74.6366, 16.1488]  # Closes back at Spillway
    ]

    # 2. Dam Crest Axis (10,183 m total length, curving along the ridge)
    dam_crest_line = [
        [74.6200, 16.1305], # Southern earthen wing tip
        [74.6255, 16.1350],
        [74.6305, 16.1405],
        [74.6345, 16.1455],
        [74.6366, 16.1488], # Central Masonry Spillway (Radial Gates)
        [74.6390, 16.1530],
        [74.6418, 16.1585],
        [74.6442, 16.1645],
        [74.6460, 16.1710]  # Northern right bank abutment
    ]

    # 3. Spillway Footprint
    spillway_box = [
        [74.6355, 16.1478],
        [74.6378, 16.1500],
        [74.6392, 16.1486],
        [74.6370, 16.1465],
        [74.6355, 16.1478]
    ]

    # 4. Topographic Valley Elevation Contours
    # Contour 660m (Dam crest & valley rim)
    contour_660 = [
        [74.618, 16.126], [74.630, 16.136], [74.643, 16.145], [74.656, 16.151],
        [74.670, 16.154], [74.690, 16.148], [74.715, 16.138], [74.740, 16.160],
        [74.760, 16.170], [74.785, 16.165], [74.810, 16.152], [74.840, 16.150]
    ]
    # Contour 620m (Intermediate river terrace)
    contour_620 = [
        [74.642, 16.148], [74.654, 16.151], [74.668, 16.157], [74.685, 16.158],
        [74.702, 16.151], [74.718, 16.144], [74.735, 16.153], [74.748, 16.172],
        [74.768, 16.179], [74.790, 16.174], [74.815, 16.163], [74.835, 16.161]
    ]
    # Contour 580m (Gokak canyon lip before falls)
    contour_580 = [
        [74.738, 16.155], [74.746, 16.170], [74.758, 16.180], [74.775, 16.179],
        [74.792, 16.174], [74.805, 16.169], [74.820, 16.162], [74.845, 16.164],
        [74.865, 16.175], [74.885, 16.195]
    ]
    # Contour 540m (Gokak plunge pool & Konnur alluvial plain)
    contour_540 = [
        [74.799, 16.173], [74.810, 16.167], [74.825, 16.162], [74.845, 16.165],
        [74.860, 16.174], [74.875, 16.188], [74.890, 16.200], [74.910, 16.212]
    ]

    features = [
        # Reservoir Polygon
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [reservoir_polygon]
            },
            "properties": {
                "feature_type": "RESERVOIR_LAKE",
                "name": "Raja Lakhamagouda Reservoir (Hidkal Lake)",
                "water_level_m": 662.94,
                "gross_capacity_mcm": 1448.0,
                "surface_area_km2": 63.4,
                "description": "Impounded Ghataprabha reservoir at Full Reservoir Level (FRL)."
            }
        },
        # Dam Embankment Line
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": dam_crest_line
            },
            "properties": {
                "feature_type": "DAM_CREST_AXIS",
                "name": "Hidkal Dam Crest & Embankment",
                "crest_length_m": 10183.0,
                "crest_elevation_m": 662.94,
                "height_m": 53.34,
                "dam_type": "Composite Earth-Fill / Masonry"
            }
        },
        # Spillway
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [spillway_box]
            },
            "properties": {
                "feature_type": "SPILLWAY",
                "name": "Hidkal Ogee Spillway & Radial Gates",
                "gate_count": 10,
                "spillway_capacity_m3s": 3230.0,
                "crest_elev_m": 653.80
            }
        },
        # Hydroelectric Powerhouse
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [74.6385, 16.1495]
            },
            "properties": {
                "feature_type": "POWERHOUSE",
                "name": "Hidkal Hydroelectric Powerhouse",
                "installed_capacity_mw": 36.0,
                "units": "2 x 18 MW Kaplan Turbines"
            }
        },
        # Gokak Falls Plunge Point
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [74.7965, 16.1752]
            },
            "properties": {
                "feature_type": "WATERFALL_GORGE",
                "name": "Gokak Falls (52m Sandstone Plunge)",
                "drop_height_m": 52.0,
                "gorge_depth_m": 75.0,
                "canyon_type": "Precambrian Sandstone Gorge"
            }
        },
        # Elevation Contours
        {
            "type": "Feature",
            "geometry": { "type": "LineString", "coordinates": contour_660 },
            "properties": { "feature_type": "TERRAIN_CONTOUR", "elevation_m": 660, "label": "660m MSL (Dam Crest Elevation)" }
        },
        {
            "type": "Feature",
            "geometry": { "type": "LineString", "coordinates": contour_620 },
            "properties": { "feature_type": "TERRAIN_CONTOUR", "elevation_m": 620, "label": "620m MSL (Middle Canyon Terrace)" }
        },
        {
            "type": "Feature",
            "geometry": { "type": "LineString", "coordinates": contour_580 },
            "properties": { "feature_type": "TERRAIN_CONTOUR", "elevation_m": 580, "label": "580m MSL (Gokak Gorge Canyon Rim)" }
        },
        {
            "type": "Feature",
            "geometry": { "type": "LineString", "coordinates": contour_540 },
            "properties": { "feature_type": "TERRAIN_CONTOUR", "elevation_m": 540, "label": "540m MSL (Lower Alluvial Floodplain)" }
        }
    ]

    return {
        "type": "FeatureCollection",
        "features": features
    }

def get_infrastructure_geojson() -> Dict[str, Any]:
    features = []
    
    # Settlements
    for s in DOWNSTREAM_SETTLEMENTS:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [s["lon"], s["lat"]]
            },
            "properties": {
                "category": "SETTLEMENT",
                "name": s["name"],
                "population": s["population"],
                "elevation_m": s["elevation_m"],
                "distance_km": s["dist_km"],
                "assigned_shelter": s.get("assigned_shelter", "")
            }
        })
        
    # Critical infrastructure
    for ci in CRITICAL_INFRASTRUCTURE:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ci["lon"], ci["lat"]]
            },
            "properties": {
                "category": "INFRASTRUCTURE",
                "sub_type": ci["type"],
                "id": ci["id"],
                "name": ci["name"],
                "criticality": ci["criticality"],
                "distance_km": ci.get("dist_km", 0.0)
            }
        })
        
    # Relief camps
    for rc in RELIEF_CAMPS:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [rc["lon"], rc["lat"]]
            },
            "properties": {
                "category": "RELIEF_CAMP",
                "id": rc["id"],
                "name": rc["name"],
                "capacity": rc["capacity"],
                "elevation_m": rc["elevation_m"],
                "buffer_m": rc.get("buffer_m", 30.0),
                "status": rc["status"],
                "facilities": rc.get("facilities", "Emergency Logistics Hub")
            }
        })
        
    return {
        "type": "FeatureCollection",
        "features": features
    }
