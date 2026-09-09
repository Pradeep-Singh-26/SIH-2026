# 🛡️ HADR & Disaster Management Decision Framework
### Operational Guidelines for Emergency Response & Loss Estimation (SIH26161)

---

## 🚨 1. The HADR Mission

The primary objective of this hydrodynamic simulation platform is to support **Humanitarian Assistance and Disaster Relief (HADR)** missions conducted by agencies such as the **National Disaster Response Force (NDRF)**, **State Disaster Response Forces (SDRF)**, **District Disaster Management Authorities (DDMA)**, and the **Armed Forces**.

During a dam breach event, time is measured in minutes. Emergency planners cannot spend hours analyzing hydraulic raw files; they need automated spatial answers to three critical operational questions:

1. **Where will the water hit first, and with what force?**
2. **Which critical lifelines (roads, bridges, hospitals, power) will be severed?**
3. **Where can affected populations be safely evacuated and sheltered on high ground?**

---

## 👥 2. Population at Risk (PAR) & Fatality Estimation

The platform incorporates the **US Army Corps of Engineers (USACE) / Graham (1999)** empirical framework for estimating life loss resulting from dam failure.

### Fatality Rate Matrix ($F_r$)

Fatality rates depend heavily on two independent variables:
1. **Flood Severity**: Characterized by depth ($d$) and velocity ($v$), with dangerous flood conditions defined as $d \cdot v \ge 1.5\text{ m}^2/\text{s}$.
2. **Warning Time ($T_w$)**: The lead-time between public alert dissemination and the arrival of the flood crest.

$$\text{Estimated Casualties} = \text{PAR} \times F_r$$

| Warning Time ($T_w$) | Flood Severity | Flood Understanding | Fatality Rate ($F_r$) |
| :--- | :--- | :--- | :--- |
| **No Warning ($T_w < 15\text{ min}$)** | High ($d \cdot v \ge 1.5\text{ m}^2/\text{s}$) | Vague / None | **$0.150$** ($15\%$) |
| **Short ($15\text{ min} \le T_w < 60\text{ min}$)** | High ($d \cdot v \ge 1.5\text{ m}^2/\text{s}$) | Moderate | **$0.030$** ($3\%$) |
| **Adequate ($T_w \ge 60\text{ min}$)** | High ($d \cdot v \ge 1.5\text{ m}^2/\text{s}$) | Good | **$0.002$** ($0.2\%$) |
| **Adequate ($T_w \ge 60\text{ min}$)** | Low ($d \cdot v < 1.5\text{ m}^2/\text{s}$) | Good | **$0.0002$** ($0.02\%$) |

### Actionable Takeaway
By providing **1.5 to 3.5 hours of predictive lead-time** for downstream centers like Gokak, this platform enables evacuation before the wave crest arrives, driving fatality rates down from catastrophic levels ($>15\%$) to under $0.2\%$.

---

## 🏥 3. Critical Infrastructure Vulnerability Matrix

The backend GIS processor automatically evaluates the operational status of critical assets located within the downstream inundation zone:

| Asset Name | Asset Type | Coordinates | Arrival Time ($T_{\text{arr}}$) | Peak Depth | Vulnerability Status | Operational Directive |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Ghataprabha Railway Viaduct** | Rail Transport | $74.712^\circ\text{E}, 16.175^\circ\text{N}$ | $T+1.4\text{ h}$ | $5.2\text{ m}$ | **CRITICAL: SEVERED** | Immediately halt all rail traffic on South Western Railway division. |
| **NH4 National Highway Bridge** | Road Lifeline | $74.750^\circ\text{E}, 16.168^\circ\text{N}$ | $T+2.1\text{ h}$ | $4.2\text{ m}$ | **CRITICAL: SEVERED** | Divert heavy traffic and military convoys via Belagavi-Hubbali bypass. |
| **Gokak General Hospital** | Healthcare | $74.825^\circ\text{E}, 16.162^\circ\text{N}$ | $T+3.2\text{ h}$ | $1.4\text{ m}$ | **WARNING: THREATENED** | Evacuate ICU and ground-floor patients to upper floors or Belagavi Civil Hospital. |
| **Power Substation Ghat-3** | Energy Grid | $74.685^\circ\text{E}, 16.160^\circ\text{N}$ | $T+1.1\text{ h}$ | $3.8\text{ m}$ | **CRITICAL: SUBMERGED** | De-energize 110kV lines to prevent electrical fire and ground electrocution. |
| **Gokak Historic Suspension Bridge** | Heritage / Pedestrian | $74.805^\circ\text{E}, 16.185^\circ\text{N}$ | $T+2.9\text{ h}$ | $6.8\text{ m}$ | **DESTROYED** | Enforce military perimeter; prevent civilian spectator access. |

---

## 🏕️ 4. Disaster Relief Camp Logistics & High-Ground Zoning

Relief camps must never be established in secondary depression zones or ephemeral drainage basins. The system identifies safe high-ground zones based on digital elevation contours:

```
                                  +---------------------------------------+
                                  |   RELIEF CAMP CAPACITY & ZONING       |
                                  +---------------------------------------+

  [CAMP A] Gokak Hilltop College Complex
   - Elevation : 610 m MSL (Safe from 580m flood crest)
   - Capacity  : 8,000 Persons
   - Facilities: Potable water storage, emergency generator, sports ground helipad
   - Status    : SAFE_HIGH_GROUND

  [CAMP B] Belagavi North Administrative Ground
   - Elevation : 645 m MSL
   - Capacity  : 12,000 Persons
   - Facilities: Primary logistics staging hub, military supply depot
   - Status    : SAFE_HIGH_GROUND

  [CAMP C] Hidkal Heights Community Center
   - Elevation : 670 m MSL
   - Capacity  : 2,500 Persons
   - Facilities: Immediate triage center for dam operational personnel
   - Status    : SAFE_HIGH_GROUND
```

---

## 🛰️ 5. Google Earth Engine (GEE) & Satellite Verification

To validate model predictions against real-world observations during monsoon events, the system provides an automated script for **Google Earth Engine** utilizing **Copernicus Sentinel-1 Synthetic Aperture Radar (SAR)**:

- **All-Weather Capability**: C-band radar ($5.405\text{ GHz}$) penetrates torrential monsoon cloud decks and operates day or night.
- **Backscatter Drop**: Water acts as a specular reflector, resulting in low backscatter ($\sigma^\circ_{\text{VH}} < -18\text{ dB}$).
- **Automated Workflow**:
  1. Filter Sentinel-1 GRD collection for pre-event and post-event passes.
  2. Compute difference image $\Delta \sigma^\circ = \sigma^\circ_{\text{post}} - \sigma^\circ_{\text{pre}}$.
  3. Apply Otsu thresholding ($\Delta \sigma^\circ < -3.2\text{ dB}$).
  4. Mask permanent water bodies using JRC Global Surface Water.
  5. Vectorize satellite-derived flood extent and overlay against Delft3D simulation boundaries.
