import math
from typing import List, Dict, Any
from backend.models.schemas import ImpactAssetSummary
from backend.data.hidkal_dam.data_loader import (
    DOWNSTREAM_SETTLEMENTS, CRITICAL_INFRASTRUCTURE, RELIEF_CAMPS
)

def compute_impact_assessment(inundated_area_km2: float) -> ImpactAssetSummary:
    """
    Computes HADR disaster impact metrics based on maximum inundation envelope.
    """
    # Progression factor based on reach affected
    # Max reach area is approx 115 km2 for 40 km reach
    reach_ratio = min(1.0, max(0.1, inundated_area_km2 / 95.0))
    
    affected_settlements = []
    total_pop_risk = 0
    
    for s in DOWNSTREAM_SETTLEMENTS:
        # Check if settlement lies within current inundation reach
        if s["dist_km"] <= reach_ratio * 40.0:
            affected_settlements.append(s["name"])
            total_pop_risk += int(s["population"] * min(1.0, 0.45 + reach_ratio * 0.4))
            
    # Structure count estimate: ~4.5 persons per household/structure in rural/peri-urban Belagavi
    structures_damaged = int(total_pop_risk / 4.6)
    
    # Submerged roads: ~1.4 km of roadway per km2 of floodplain
    submerged_roads_km = round(inundated_area_km2 * 1.35, 1)
    
    # Submerged farmland: roughly 70% of the inundated valley is agricultural land (1 km2 = 100 hectares)
    farmland_ha = round(inundated_area_km2 * 0.68 * 100.0, 1)
    
    # Severed bridges
    severed = []
    for ci in CRITICAL_INFRASTRUCTURE:
        if ci["type"] == "BRIDGE":
            if reach_ratio >= 0.25 and "SH-31" in ci["name"]:
                severed.append(ci["name"])
            elif reach_ratio >= 0.45 and "Yamakanmardi" in ci["name"]:
                severed.append(ci["name"])
            elif reach_ratio >= 0.70 and "Gokak" in ci["name"]:
                severed.append(ci["name"])
                
    # Safe relief camps status
    relief_centers = []
    for rc in RELIEF_CAMPS:
        relief_centers.append({
            "id": rc["id"],
            "name": rc["name"],
            "capacity": rc["capacity"],
            "elevation_m": rc["elevation_m"],
            "status": rc["status"],
            "distance_to_flood_m": round(max(300.0, rc["elevation_m"] - 580.0), 1)
        })
        
    return ImpactAssetSummary(
        total_inundated_area_km2=round(inundated_area_km2, 2),
        population_at_risk=total_pop_risk,
        damaged_structures_count=structures_damaged,
        submerged_roads_km=submerged_roads_km,
        submerged_farmland_ha=farmland_ha,
        affected_villages=affected_settlements,
        severed_bridges=severed,
        safe_evacuation_centers=relief_centers
    )
