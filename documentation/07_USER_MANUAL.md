# 📖 User Manual & Operational Guide
### Interactive Hydrodynamic Dashboard & GIS Map Viewer (SIH26161)

---

## 🧭 1. Getting Started & User Authentication

When you launch the application (via `http://localhost:3000` or local dev `http://localhost:5173`), you are greeted by the modern, responsive **Dam Break Inundation Modelling Dashboard**.

### 1.1 User Authentication & Cloud Profiles
- **Sign In / Sign Up**: Click the **Sign In** button in the top navigation bar to open the authentication modal, or click **Full Page View** for an expansive dedicated authentication experience.
- **Roles & Agency Affiliation**: Register with your disaster management agency (e.g. *Central Water Commission*, *NDMA*, *SDRF*, *State Water Resources Dept*) and designation (*Chief Hydrologist*, *Disaster Relief Commander*, *Structural Analyst*).
- **Dual Storage Persistence**:
  - Automatically syncs to **MongoDB Atlas** when cloud credentials are configured.
  - Automatically falls back to offline local JSON storage (`backend/data/local_db/`) if running without internet access.
- **Saved Simulations**: All simulations executed while logged in are permanently linked to your profile, accessible via the user menu.

### 1.2 Top Navigation Bar & Global Controls
- **Brand Identity**: SIH26161 badge and system title.
- **View Switcher**: Instant toggle between `🗺️ 2D Tactical GIS` and `💧 3D Fluid Shock`.
- **Engine Status Badge**: Real-time indication of solver mode (`SPH READY`, `DELFT3D CONNECTED`, or `[DEMO DATA - HYDRODYNAMIC MOCK]`).
- **Tactical Audio**: Toggle synthesized sound effects on/off for clicks, warnings, and timeline scrubbing.
- **Theme Switcher**: Switch between Light Mode (crisp, high-contrast) and Dark Mode (sleek command center).
- **User Avatar**: View profile details or log out.

### 1.3 Left Command Activity Rail
The vertical dock provides instant access to all workflow drawers:
- ⚙️ **Scenario Setup**: Standard breach parameter configuration (Hidkal Dam study area).
- 📁 **DEM Ingest**: Custom GeoTIFF digital elevation raster upload and modeling.
- 📊 **HADR Impact**: Real-time disaster impact metrics and high-ground camp allocations.
- ⚖️ **Model Compare**: Side-by-side comparative analysis (Delft3D Flexible Mesh vs SPH).
- 🛰️ **Sentinel-1 SAR**: Copernicus C-band SAR satellite radar framework for Google Earth Engine.
- 📥 **Export GIS**: 1-click downloads for ESRI Shapefile ZIP, Google Earth KML, and GeoJSON.
- ◫ **Split View Toggle**: Toggle between single-drawer expansion and dual-panel split view.
- 📖 **System Guide**: In-depth operational documentation modal.

---

## 🗺️ 2. Exploring the 2D Tactical GIS Map

The 2D GIS Map provides a dynamic geospatial interface of the Ghataprabha River basin downstream of Hidkal Dam:

```
+-------------------------------------------------------------------------------+
| [Geospatial Overlays: [x] Bridges  [x] Shelters  [ ] Towns  [ ] Gauges ...]   |
+-------------------------------------------------------------------------------+
|                                                                               |
|   (Dam Crest Shield: 🛡️)                                                     |
|       \                                                                       |
|        \~~ Flood Wave ~~~ (T + 0.5h Isochrone)                                |
|             \                                                                 |
|              \~~~ (T + 1.0h Isochrone) ~~~~~ [💧 GLBC Head Regulator]        |
|                   \                                                           |
|                    \~~~ [🌉 SH-31 Bridge: Submerged]                          |
|                         \                                                     |
|                          \~~~ (T + 4.0h) ~~~~ [🏛️ Historic Gokak Mills 1887]  |
|                                                     \                         |
|                                             [🏕️ Relief Camp: Safe MSL]       |
+-------------------------------------------------------------------------------+
| [Time Slider: |====o====================| T = 2.5 Hours]  [Play / Pause >]    |
+-------------------------------------------------------------------------------+
```

### 2.1 Granular Layer Overlays (Top-Left HUD)
Toggle layers independently to keep the map clean and tailored to your mission:
- 🌉 **Bridges & Crossings** (Default: `ON`): Real-time submersion status (passable vs severed).
- 🏕️ **Safe Relief Shelters** (Default: `ON`): High-ground camps with verified safety freeboards (+27m to +48m MSL).
- 🏘️ **Downstream Towns** (Default: `OFF`): 13 riverine villages and population centers with evacuation routing.
- 🏥 **Hospitals & Power Grid** (Default: `OFF`): Critical trauma centers and 110kV electrical substations.
- 💧 **Gauges & Canal Lifelines** (Default: `OFF`): CWC stream telemetry stations and GLBC/GRBC canal head regulators.
- 🚒 **Emergency Rescue Bases** (Default: `OFF`): Fire & Rescue stations and Taluk EOC depots.
- 🏛️ **Heritage & Industrial Sites** (Default: `OFF`): Historic Gokak Mills (1887), Chalukyan temples, rail junctions, and diversion weirs.
- 🧱 **Dam & Reservoir Footprint** (Default: `ON`): 45-point dendritic reservoir lake, 10.18km embankment axis, and spillway.
- ⛰️ **Valley Topo Contours** (Default: `OFF`): Topographic contour lines from 660m down to 540m MSL.
- 🌊 **Ghataprabha Channel** (Default: `ON`): Precision river centerline.

### 2.2 Uncluttered Pin Architecture
- **Compact Circular Emblems (22–26px)**: Markers are designed as sleek circular badge pins with zero visual collision or text crowding.
- **Glassmorphic Hover Tooltips**: Hovering any landmark brings up a `.tactical-tooltip` showing real-time status and distance.
- **Detailed Click Popups**: Clicking any pin displays comprehensive operational data (exact ground elevation, arrival ETA, emergency advisories, and shelter capacities).

### 2.3 Basemaps & Spatial Bookmarks
- **Four Basemap Modes**: CARTO Voyager (Light), CARTO Dark Matter (Dark), Esri World Imagery (Satellite), and Esri World Topographic Relief.
- **Spatial Bookmarks**: Instant animated navigation (`flyTo`) to:
  - *Dam Crest* (Embankment & spillway)
  - *Gokak Falls* (52m vertical plunge)
  - *Gorge Bridge* (Deep canyon crossing)
  - *Gokak City* (Major urban flood hazard zone)
  - *Full Reach* (Dam to Konnur macro overview)

---

## 📁 3. Ingesting Custom GeoTIFF (.tif) DEM Rasters

To model a flash flood or dam breach on any custom terrain:

1. Click the **📁 Custom DEM** icon on the left command rail.
2. **Upload GeoTIFF File**: Drag and drop or browse for a `.tif` or `.tiff` raster (or click **Load Sample DEM**).
3. **Configure Simulation Parameters**:
   - **Scenario & Dam Title**: Give your simulation an informative name.
   - **Dam Height & Crest Elevation**: Specify structural dam metrics.
   - **Reservoir Volume ($V$)**: Gross storage in Million Cubic Meters (MCM).
   - **Manning's Roughness ($n$)**: Set channel hydraulic roughness (default: `0.035`).
4. **Tune HADR Emergency Parameters**:
   - **Estimated Valley Population**: Total population living in the downstream floodplain.
   - **Critical Bridges & Hospitals**: Quantity of key lifelines to monitor.
   - **Target Warning Lead Time**: Required emergency evacuation buffer (in hours).
5. **Run Custom Simulation**: Click **Execute Custom DEM Simulation**. The backend will process the GeoTIFF raster, compute the breach hydrograph, model flood inundation, evaluate HADR casualties, and display the results immediately.

---

## 🌊 4. Visualizing the 3D Fluid Shock Wave

Click the **`3D Fluid Shock`** tab to switch to the WebGL fluid particle engine:
- **Interactive Orbit Controls**: Click and drag to rotate around the breach site; scroll to zoom; right-click to pan.
- **Fluid Surge Dynamics**: Observe the water volume breach through the dam embankment, spilling into the canyon with realistic fluid displacement shaders and dynamic particle spray.
- **Impact Pressures**: Inspect kinetic fluid velocity vectors as the water strikes downstream topography.

---

## 📊 5. HADR Impact Assessment & Evacuation Planning

Click the **`HADR Impact`** icon on the command rail:
- **Population at Risk (PAR)**: Automatically computed based on spatial overlap between flood polygons and settlement coordinates.
- **Expected Casualties**: Calculated using the USACE / Graham methodology considering warning lead times.
- **Agricultural Inundation**: Total hectares of farmland submerged.
- **Evacuation Routing**: Real-time routing recommendations matching threatened villages to safe high-ground relief centers.

---

## 💾 6. Exporting Geospatial Results

To load the simulation results into external GIS software:
1. Click the **Export GIS** button in the top navigation bar or left command dock.
2. Select your preferred format:
   - **ESRI Shapefile Archive (`.zip`)**: Standard polygon vector shapefile complete with `.shp`, `.shx`, `.dbf`, and `.prj` projection metadata.
   - **Google Earth KML (`.kml`)**: For 3D terrain fly-throughs in Google Earth.
   - **GeoJSON (`.geojson`)**: Open standard for web mapping and spatial data analysis in QGIS or Mapbox.
