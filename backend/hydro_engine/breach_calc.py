import math
import numpy as np
from typing import Tuple, List
from backend.models.schemas import BreachParameters, BreachMode, BreachHydrograph, BreachHydrographPoint

def calculate_breach_hydrograph(
    params: BreachParameters,
    reservoir_storage_m3: float = 1.44e9, # Hidkal Dam: ~1.44 Billion Cubic Meters
    reservoir_surface_area_m2: float = 6.34e7 # ~63.4 sq km at FRL
) -> BreachHydrograph:
    """
    Computes dam breach outflow hydrograph using Froehlich (2008) empirical relations
    coupled with dynamic reservoir routing (Broad-crested weir / orifice hydraulics).
    """
    g = 9.81
    dt_sec = 60.0 # 1-minute routing step
    total_sec = int(params.simulation_duration_hr * 3600)
    
    # Breach geometry
    h_b = max(5.0, params.initial_water_level_m - params.breach_bottom_elevation_m)
    t_f_sec = max(600.0, params.breach_formation_time_hr * 3600.0) # Breach formation time
    
    # Overtopping coefficient ko = 1.3 for overtopping, 1.0 for piping
    ko = 1.3 if params.failure_mode == BreachMode.OVERTOPPING else 1.0
    
    # Froehlich (2008) average breach width empirical benchmark:
    # B_avg = 0.27 * ko * (V_w)^0.32 * h_b^0.04
    b_avg_froehlich = 0.27 * ko * (reservoir_storage_m3 ** 0.32) * (h_b ** 0.04)
    # Calibrate user inputs against empirical bounds
    target_top_width = max(params.breach_top_width_m, b_avg_froehlich * 0.8)
    target_bottom_width = max(params.breach_bottom_width_m, target_top_width * 0.5)
    
    time_points: List[BreachHydrographPoint] = []
    
    cur_storage = reservoir_storage_m3
    cur_head = params.initial_water_level_m
    z_invert = params.breach_bottom_elevation_m
    
    time_series = []
    q_series = []
    head_series = []
    width_series = []
    
    base_spillway_q = 850.0 # Routine spillway release prior to breach initiation
    
    for t in range(0, total_sec + int(dt_sec), int(dt_sec)):
        t_hr = t / 3600.0
        
        # Breach development progression fraction [0, 1]
        prog = min(1.0, t / t_f_sec)
        # S-curve breach expansion (slow initial erosion, rapid mechanical failure, stabilization)
        breach_frac = 3 * (prog ** 2) - 2 * (prog ** 3)
        
        cur_bottom_width = target_bottom_width * breach_frac
        cur_invert = params.initial_water_level_m - (h_b * breach_frac)
        
        head_above_invert = max(0.0, cur_head - cur_invert)
        
        if head_above_invert > 0.0 and breach_frac > 0.001:
            if params.failure_mode == BreachMode.OVERTOPPING or prog > 0.6:
                # Broad-crested weir formulation with side slope trapezoid:
                # Q = C_w * B * H^1.5 + C_ss * z * H^2.5
                c_w = 1.70 # Weir discharge coefficient (SI)
                c_ss = 1.35
                q_breach = (c_w * cur_bottom_width * (head_above_invert ** 1.5) +
                            c_ss * params.side_slope_z * (head_above_invert ** 2.5))
            else:
                # Initial piping orifice flow:
                # Q = C_d * A * sqrt(2 g H)
                c_d = 0.62
                pipe_dia = max(1.0, 15.0 * breach_frac)
                a_pipe = math.pi * ((pipe_dia / 2.0) ** 2)
                q_breach = c_d * a_pipe * math.sqrt(2.0 * g * max(1.0, cur_head - cur_invert))
        else:
            q_breach = 0.0
            
        total_q = q_breach + base_spillway_q * max(0.0, 1.0 - (t / t_f_sec))
        
        # Reservoir level drop dS = -Q * dt
        vol_out = total_q * dt_sec
        cur_storage = max(reservoir_storage_m3 * 0.15, cur_storage - vol_out)
        # Dynamic reservoir head reduction
        cur_head = params.breach_bottom_elevation_m + ((cur_storage / reservoir_storage_m3) ** 0.5) * h_b
        
        time_series.append(t_hr)
        q_series.append(total_q)
        head_series.append(cur_head)
        width_series.append(cur_bottom_width)
    
    # Downsample points for API payload (~15 min intervals)
    sample_interval_steps = max(1, int((params.time_step_min * 60) / dt_sec))
    for idx in range(0, len(time_series), sample_interval_steps):
        time_points.append(BreachHydrographPoint(
            time_hr=round(time_series[idx], 2),
            discharge_m3s=round(q_series[idx], 2),
            reservoir_elevation_m=round(head_series[idx], 2),
            breach_width_m=round(width_series[idx], 2)
        ))
        
    peak_q = float(np.max(q_series))
    t_peak_hr = float(time_series[int(np.argmax(q_series))])
    total_vol_mcm = float(np.sum(q_series) * dt_sec / 1e6)
    
    return BreachHydrograph(
        peak_discharge_m3s=round(peak_q, 1),
        time_to_peak_hr=round(t_peak_hr, 2),
        total_volume_released_mcm=round(total_vol_mcm, 1),
        empirical_method="Froehlich (2008) + Non-linear Reservoir Routing",
        points=time_points
    )
