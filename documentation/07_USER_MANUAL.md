# 📖 User Manual & Operational Guide
### Interactive Hydrodynamic Dashboard & GIS Map Viewer (SIH26161)

---

## 🧭 1. Getting Started

When you launch the application (via `http://localhost:3000` or local dev `http://localhost:5173`), you are greeted by the streamlined, spacious **Dam Break Inundation Modelling Dashboard**.

### 1.1 Streamlined Top Navigation Bar
- **Brand & Panel Toggle**: Brand identity, SIH26161 badge, and quick panel expand/collapse trigger.
- **Centered View Switcher**: Instant switching between `🗺️ 2D Tactical GIS` and `💧 3D Fluid Shock`.
- **Status & Quick Actions**: Live engine badge (`SPH READY` / `DELFT3D CONNECTED`), primary `Export GIS` button, theme toggle (light/dark), sound mute, fullscreen, and operator guide.

### 1.2 Left Command Activity Rail (64px)
The vertical command dock provides fast access to core modules without crowding the screen:
- ⚙️ **Scenario Setup**: Opens the breach parameter configuration drawer (dam presets, overtopping/piping, breach dimensions).
- 📊 **HADR Impact**: Opens disaster analytics (USACE casualty reduction, infrastructure damage, and high-ground relief centers).
- ⚖️ **Model Compare**: Opens side-by-side comparative analysis of Delft3D Flexible Mesh vs DualSPHysics.
- 🛰️ **Sentinel-1 SAR**: Opens the Copernicus C-band SAR satellite radar framework for Google Earth Engine.
- 📥 **Export GIS**: 1-click downloads for ESRI Shapefile ZIP, Google Earth KML, and GeoJSON.
- ◫ **Split View Toggle**: For multi-monitor or ultra-wide displays, toggles between the spacious single-drawer layout and dual-panel split deck.
- 📖 **System Guide**: Opens technical architecture and operational specifications.

### 1.3 Spacious Sliding Drawer & Expansive Map
- **1-Click Drawer Collapse**: Hiding the drawer allows the 2D GIS map or 3D fluid shock wave to expand to **100% full screen width**, giving operators maximum situational awareness.

---

## 🗺️ 2. Exploring the 2D GIS Map

The 2D GIS Map provides a dynamic geographic perspective of the Ghataprabha River basin downstream of Hidkal Dam:

```
+-------------------------------------------------------------------------------+
| [Layer Toggles: [x] Inundation Extent  [x] Isochrones  [x] Assets  [x] River] |
+-------------------------------------------------------------------------------+
|                                                                               |
|   (Dam Crest)                                                                 |
|       \                                                                       |
|        \~~ Flood Wave ~~~ (T + 0.5h Isochrone)                                |
|             \                                                                 |
|              \~~~ (T + 1.0h Isochrone) ~~~~~ [Power Substation: Submerged]    |
|                   \                                                           |
|                    \~~~ [NH4 Bridge: Severed] ~~~~ (T + 2.0h Isochrone)       |
|                         \                                                     |
|                          \~~~ (T + 4.0h) ~~~~ [Gokak Hospital: At Risk]       |
|                                                     \                         |
|                                             [Relief Camp: Safe High Ground]   |
+-------------------------------------------------------------------------------+
| [Time Slider: |====o====================| T = 2.0 Hours]  [Play / Pause >]    |
+-------------------------------------------------------------------------------+
```

### Layer Controls:
- **Inundation Extent**: Shows the flooded territory colored by water depth:
  - 🔵 **Cyan / Light Blue**: Shallow overbank flooding ($< 1.5\text{ m}$).
  - 🟡 **Yellow / Amber**: Moderate hazard depth ($1.5\text{ m} - 4.0\text{ m}$).
  - 🔴 **Red / Magenta**: Extreme danger depth ($> 4.0\text{ m}$).
- **Wave Front Isochrones**: Displays arrival time contours indicating when the flood crest reaches specific river miles ($T+0.5\text{h}, T+1.0\text{h}, T+2.0\text{h}, T+4.0\text{h}$).
- **Critical Assets**: Pinpoints downstream bridges, hospitals, power stations, and schools. Clicking any marker opens an impact pop-up detailing predicted flood depth, arrival time, and damage classification.
- **Designated Relief Camps**: Shows green tent markers for safe high-ground evacuation zones, displaying sheltering capacity and elevation.
- **Time Slider**: Scrub through the 12-hour simulation window to visualize the physical propagation of the floodwave over time.

---

## ⚙️ 3. Configuring a Dam Break Scenario

The left-hand **Simulation Control Panel** lets you model different emergency scenarios:

1. **Select Dam**: Defaults to **Hidkal Dam (Raja Lakhamagouda)** on the Ghataprabha River.
2. **Select Hydrodynamic Engine**:
   - `Delft3D Flexible Mesh`: Recommended for large-scale downstream inundation mapping (2D SWE).
   - `DualSPHysics (SPH)`: Recommended for near-field hydrodynamic wave shock and structural impact.
3. **Breach Geometry & Mechanism**:
   - **Failure Mode**: Choose between `OVERTOPPING` (uncontrolled spillway overflow) or `PIPING` (internal seepage erosion).
   - **Breach Height ($h_b$)**: Dam structural failure depth (Default: $53.3\text{ m}$).
   - **Breach Width ($B$)**: Crest breach opening (Default: $185\text{ m}$, calculated via Froehlich formula).
   - **Formation Time ($t_f$)**: Duration of breach erosion (Default: $1.8\text{ hours}$).
   - **Reservoir Level**: Initial water level above MSL (Default: $662.94\text{ m}$).
4. **Execute Simulation**: Click **Run Hydrodynamic Simulation**. The backend will process the breach hydrograph, compute wave propagation, perform spatial asset intersection, and refresh all views.

---

## 🌊 4. Visualizing the 3D Fluid Shock Wave

Click the **`3D Fluid Shock`** tab to switch to the WebGL rendering engine:
- **Interactive Orbit Controls**: Click and drag to rotate the camera around the dam structure; scroll to zoom in/out; right-click and drag to pan.
- **Wave Front Dynamics**: Observe the water volume breach through the dam crest, spilling into the downstream river canyon with realistic fluid displacement shaders and dynamic particle foam spray.
- **Fluid Properties**: Inspect near-field kinetic velocity and impact pressures on structural piers.

---

## 📊 5. Analyzing HADR Impact & Evacuation Routing

Click the **`HADR Impact`** tab to review the disaster management summary:
- **Population at Risk (PAR)**: Automatically computed based on spatial overlap with population density grids.
- **Expected Casualties**: Calculated using the USACE / Graham methodology based on available warning time.
- **Agricultural Inundation**: Total hectares of cropland submerged.
- **Asset Status Cards**: Real-time breakdown of severed bridges, threatened hospitals, and offline electrical substations.
- **Evacuation Guidance**: Directions to the nearest safe high-ground relief centers (e.g. Gokak Hilltop College Complex).

---

## ⚖️ 6. Scenario Comparison

Click the **`Scenario Compare`** tab to evaluate two different simulation runs side-by-side:
- Compare **PMF Overtopping** against a smaller **Spillway Jam** scenario.
- Contrast **Delft3D-FM 2D SWE** macro-extent against **DualSPHysics SPH** near-field shock.
- Review delta metrics for peak discharge ($\Delta Q_p$), flooded area ($\Delta \text{km}^2$), and maximum water depth ($\Delta h_{\max}$).

---

## 💾 7. Exporting Geospatial Results

To load the simulation results into external GIS software:
1. Click the **Export** button in the top navigation bar.
2. Select your desired format:
   - **Google Earth KML (`.kml`)**: For 3D terrain visualization in Google Earth Pro.
   - **ESRI Shapefile (`.zip`)**: Standard polygon vector layers for **QGIS** or **ArcGIS**.
   - **GeoJSON (`.geojson`)**: Open standard for web mapping and spatial data analysis.
