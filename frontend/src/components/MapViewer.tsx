import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Eye, EyeOff, Clock, Navigation, Mountain, Waves } from 'lucide-react';
import type { DamInfo } from '../types';
import { soundEffects } from '../services/soundEffects';
import { DEFAULT_TERRAIN_GEOJSON } from '../services/mockData';

interface MapViewerProps {
  dam: DamInfo | null;
  riverGeoJson: any;
  infraGeoJson: any;
  terrainGeoJson?: any;
  layersData: any;
  isochronesData?: any;
  currentTimestep: number;
  theme?: 'light' | 'dark';
}

export const MapViewer: React.FC<MapViewerProps> = ({
  dam,
  riverGeoJson,
  infraGeoJson,
  terrainGeoJson,
  layersData,
  isochronesData,
  currentTimestep,
  theme = 'light'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layer group refs
  const riverLayerRef = useRef<L.GeoJSON | null>(null);
  const floodPolyLayerRef = useRef<L.GeoJSON | null>(null);
  const velocityLayerRef = useRef<L.LayerGroup | null>(null);
  const infraLayerRef = useRef<L.LayerGroup | null>(null);
  const isochroneLayerRef = useRef<L.LayerGroup | null>(null);
  const terrainLayerRef = useRef<L.LayerGroup | null>(null);

  // HUD Visibility Toggles
  const [showDepth, setShowDepth] = useState(true);
  const [showVelocity, setShowVelocity] = useState(false);
  const [showIsochrones, setShowIsochrones] = useState(false);
  const [showBridges, setShowBridges] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showSettlements, setShowSettlements] = useState(false);
  const [showFacilities, setShowFacilities] = useState(false);
  const [showGauges, setShowGauges] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showHeritage, setShowHeritage] = useState(false);
  const [showDamStructure, setShowDamStructure] = useState(true);
  const [showContours, setShowContours] = useState(false);
  const [showRiver, setShowRiver] = useState(true);
  const [baseMap, setBaseMap] = useState<'light' | 'satellite' | 'dark' | 'topo'>(theme === 'dark' ? 'dark' : 'light');

  const CARTO_API_KEY = (import.meta as any).env?.VITE_CARTO_API_KEY || 'cb1_31ua_1_ab86827ad08256e283b46b25';

  const createTileLayer = (mode: 'light' | 'satellite' | 'dark' | 'topo') => {
    if (mode === 'topo') {
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri World Topographic &mdash; USGS, DeLorme'
      });
    }
    if (mode === 'satellite') {
      return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; Esri World Imagery'
      });
    }
    const subpath = mode === 'dark' ? 'dark_all' : 'voyager';
    return L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/${subpath}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`, {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'
    });
  };

  // 1. Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [16.175, 74.76],
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer
    const initialTile = createTileLayer(baseMap).addTo(map);
    tileLayerRef.current = initialTile;

    // Dam marker
    const damIcon = L.divIcon({
      className: 'custom-poi-marker',
      html: `
        <div class="poi-badge" style="
          background: #0284c7;
          border: 2px solid #ffffff;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 10px rgba(2, 132, 199, 0.6);
          cursor: pointer;
          transition: transform 0.15s ease;
        ">
          <span style="font-size: 13px;">🛡️</span>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const damMarker = L.marker([16.1488, 74.6366], { icon: damIcon }).addTo(map);
    damMarker.bindTooltip(`
      <div style="font-weight: 700; font-size: 11px; color: #ffffff;">🛡️ ${dam ? dam.name : 'Hidkal Dam'}</div>
      <div style="font-size: 10px; color: #38bdf8;">Crest: ${dam?.crest_elev_m || 662.94}m MSL • Height: ${dam?.height_m || 53.34}m</div>
    `, { direction: 'top', offset: [0, -14], className: 'tactical-tooltip', opacity: 0.95 });
    damMarker.bindPopup(`
      <div style="font-family: var(--font-main); color: #04101e; padding: 4px;">
        <h4 style="margin: 0; font-weight: 700;">${dam ? dam.name : 'Hidkal Dam Structure'}</h4>
        <p style="margin: 4px 0 0 0; font-size: 12px;">Crest: ${dam?.crest_elev_m || 662.94} m MSL | Storage: ${dam?.reservoir_capacity_mcm || 1448} MCM</p>
      </div>
    `);

    // Layer groups
    terrainLayerRef.current = L.layerGroup().addTo(map);
    floodPolyLayerRef.current = L.geoJSON(undefined).addTo(map);
    velocityLayerRef.current = L.layerGroup().addTo(map);
    infraLayerRef.current = L.layerGroup().addTo(map);
    isochroneLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    // Ensure Leaflet container dimensions settle properly
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      terrainLayerRef.current = null;
    };
  }, []);

  // 2. Invalidate size on container layout changes (e.g. sidebar toggle or tab switch)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // 3. Base map toggle
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newLayer = createTileLayer(baseMap).addTo(mapRef.current);
    tileLayerRef.current = newLayer;
  }, [baseMap]);

  // 4. River Centerline
  useEffect(() => {
    if (!mapRef.current) return;

    if (riverLayerRef.current) {
      mapRef.current.removeLayer(riverLayerRef.current);
      riverLayerRef.current = null;
    }

    if (!riverGeoJson || !showRiver) return;

    riverLayerRef.current = L.geoJSON(riverGeoJson, {
      style: {
        color: '#00f0ff',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '5, 4'
      }
    }).addTo(mapRef.current);
  }, [riverGeoJson, showRiver]);

  // 5. Accurate Terrain & Dam Structure (Reservoir Lake, Dam Crest Axis, Spillway, Powerhouse, Gokak Falls, Contours)
  useEffect(() => {
    if (!mapRef.current) return;
    if (!terrainLayerRef.current) {
      terrainLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    terrainLayerRef.current.clearLayers();

    const data = terrainGeoJson || DEFAULT_TERRAIN_GEOJSON;
    if (!data || !data.features) return;

    data.features.forEach((feat: any) => {
      const type = feat.properties?.feature_type;

      if (showDamStructure) {
        if (type === 'RESERVOIR_LAKE') {
          L.geoJSON(feat, {
            style: {
              fillColor: '#1d4ed8',
              fillOpacity: 0.42,
              color: '#3b82f6',
              weight: 2
            }
          }).bindPopup(`
            <div style="font-family: Inter, sans-serif; color: #04101e; padding: 6px; min-width: 220px;">
              <h4 style="margin: 0 0 6px; color: #1e40af; font-size: 13px; font-weight: 700;">🌊 ${feat.properties.name}</h4>
              <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                <div><strong>Full Reservoir Level (FRL):</strong> ${feat.properties.water_level_m} m MSL</div>
                <div><strong>Gross Storage:</strong> ${feat.properties.gross_capacity_mcm} MCM (51.1 TMC)</div>
                <div><strong>Surface Area:</strong> ~${feat.properties.surface_area_km2} km²</div>
                <div style="margin-top: 4px; color: #0369a1; font-weight: 600;">Impounded Ghataprabha River Reservoir</div>
              </div>
            </div>
          `).addTo(terrainLayerRef.current!);
        } else if (type === 'DAM_CREST_AXIS') {
          // Thick outer crest embankment casing
          L.geoJSON(feat, {
            style: {
              color: '#0f172a',
              weight: 7,
              opacity: 0.95
            }
          }).addTo(terrainLayerRef.current!);
          // Inner crest road centerline
          L.geoJSON(feat, {
            style: {
              color: '#f8fafc',
              weight: 2.5,
              dashArray: '5, 6',
              opacity: 1
            }
          }).bindPopup(`
            <div style="font-family: Inter, sans-serif; color: #04101e; padding: 6px; min-width: 220px;">
              <h4 style="margin: 0 0 6px; color: #0f172a; font-size: 13px; font-weight: 700;">🧱 ${feat.properties.name}</h4>
              <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                <div><strong>Total Length:</strong> ${feat.properties.crest_length_m.toLocaleString()} meters (10.18 km)</div>
                <div><strong>Structural Height:</strong> ${feat.properties.height_m} meters</div>
                <div><strong>Crest Elevation:</strong> ${feat.properties.crest_elevation_m} m MSL</div>
                <div><strong>Type:</strong> Composite Earthen with Central Masonry Spillway</div>
              </div>
            </div>
          `).addTo(terrainLayerRef.current!);
        } else if (type === 'SPILLWAY') {
          L.geoJSON(feat, {
            style: {
              fillColor: '#f59e0b',
              fillOpacity: 0.85,
              color: '#b45309',
              weight: 2
            }
          }).bindPopup(`
            <div style="font-family: Inter, sans-serif; color: #04101e; padding: 6px; min-width: 200px;">
              <h4 style="margin: 0 0 6px; color: #d97706; font-size: 13px; font-weight: 700;">⚙️ ${feat.properties.name}</h4>
              <div style="font-size: 11px; color: #475569; line-height: 1.5;">
                <div><strong>Radial Gates:</strong> ${feat.properties.gate_count || 10} Units</div>
                <div><strong>Discharge Capacity:</strong> ${feat.properties.spillway_capacity_m3s} m³/s</div>
                <div><strong>Crest Elevation:</strong> 653.80 m MSL</div>
              </div>
            </div>
          `).addTo(terrainLayerRef.current!);
        } else if (type === 'POWERHOUSE') {
          const coords = feat.geometry.coordinates;
          const powerIcon = L.divIcon({
            className: 'custom-poi-marker',
            html: `
              <div class="poi-badge" style="
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #6d28d9;
                border: 2px solid #c4b5fd;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(109, 40, 217, 0.6);
                cursor: pointer;
                transition: transform 0.15s ease;
              ">
                <span style="font-size: 12px;">⚡</span>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          const powerMarker = L.marker([coords[1], coords[0]], { icon: powerIcon });
          powerMarker.bindTooltip(`
            <div style="font-weight: 700; font-size: 11px; color: #ffffff;">⚡ ${feat.properties.name}</div>
            <div style="font-size: 10px; color: #ddd6fe;">${feat.properties.installed_capacity_mw ? `${feat.properties.installed_capacity_mw} MW` : 'Hydroelectric Plant'} • 2 Kaplan Turbines</div>
          `, { direction: 'top', offset: [0, -14], className: 'tactical-tooltip', opacity: 0.95 });
          powerMarker.bindPopup(`
            <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                <span style="font-size: 18px;">⚡</span>
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${feat.properties.name}</div>
                  <div style="font-size: 10px; font-weight: 700; color: #6d28d9;">HYDROELECTRIC GENERATION ASSET</div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Installed Capacity:</span>
                  <b>${feat.properties.installed_capacity_mw || 36} MW</b>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Generation Units:</span>
                  <b>${feat.properties.units || '2 x 18 MW Kaplan'}</b>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Location:</span>
                  <b>Dam Toe / Left Flank</b>
                </div>
              </div>
            </div>
          `);
          powerMarker.addTo(terrainLayerRef.current!);
        } else if (type === 'WATERFALL_GORGE') {
          const coords = feat.geometry.coordinates;
          const fallIcon = L.divIcon({
            className: 'custom-poi-marker',
            html: `
              <div class="poi-badge" style="
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background: #0284c7;
                border: 2px solid #7dd3fc;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(2, 132, 199, 0.6);
                cursor: pointer;
                transition: transform 0.15s ease;
              ">
                <span style="font-size: 13px;">🌊</span>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          const fallMarker = L.marker([coords[1], coords[0]], { icon: fallIcon });
          fallMarker.bindTooltip(`
            <div style="font-weight: 700; font-size: 11px; color: #ffffff;">🌊 ${feat.properties.name}</div>
            <div style="font-size: 10px; color: #bae6fd;">52m Sandstone Drop • 21km from Dam</div>
          `, { direction: 'top', offset: [0, -15], className: 'tactical-tooltip', opacity: 0.95 });
          fallMarker.bindPopup(`
            <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 230px;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                <span style="font-size: 18px;">🌊</span>
                <div>
                  <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${feat.properties.name}</div>
                  <div style="font-size: 10px; font-weight: 700; color: #0284c7;">MAJOR NATURAL WATERFALL & GORGE</div>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Drop Height:</span>
                  <b>${feat.properties.drop_height_m || 52} meters</b>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Gorge Depth:</span>
                  <b>${feat.properties.gorge_depth_m || 75} meters</b>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Distance from Dam:</span>
                  <b>21.0 km downstream</b>
                </div>
                <div style="margin-top: 4px; padding: 5px 7px; background: #f0f9ff; border-radius: 4px; border: 1px solid #bae6fd; font-size: 10px; color: #0369a1;">
                  Famous Precambrian sandstone gorge on Ghataprabha River. Acts as natural hydrodynamic choke point before Konnur plains.
                </div>
              </div>
            </div>
          `);
          fallMarker.addTo(terrainLayerRef.current!);
        }
      }

      if (showContours && type === 'TERRAIN_CONTOUR') {
        L.geoJSON(feat, {
          style: {
            color: '#64748b',
            weight: 1.8,
            dashArray: '4, 6',
            opacity: 0.8
          }
        }).bindTooltip(`${feat.properties.label || `${feat.properties.elevation_m}m MSL`}`, {
          sticky: true,
          direction: 'top',
          className: 'contour-tooltip'
        }).addTo(terrainLayerRef.current!);
      }
    });
  }, [terrainGeoJson, showDamStructure, showContours]);

  // 5. Infrastructure, Bridges, Shelters & Settlements
  useEffect(() => {
    if (!infraLayerRef.current || !infraGeoJson) return;
    infraLayerRef.current.clearLayers();

    // Calculate wave front extent along reach (km) at current simulation timestep
    const waveFrontKm = Math.min(44.8, 13.8 * Math.pow(Math.max(0.01, currentTimestep), 0.72));

    infraGeoJson.features?.forEach((feat: any) => {
      const [lon, lat] = feat.geometry.coordinates;
      const props = feat.properties || {};
      const distKm = props.distance_km ?? props.dist_km ?? 0;
      const isSubmerged = distKm > 0 && distKm <= waveFrontKm;
      const arr_t = Math.max(0.1, Math.pow(Math.max(0.1, distKm) / 13.8, 1 / 0.72));
      const leadTimeHr = Math.max(0, arr_t - currentTimestep);

      // --- BRIDGES & CROSSINGS ---
      if (props.sub_type === 'BRIDGE' && showBridges) {
        const bg = isSubmerged ? '#991b1b' : '#0369a1';
        const border = isSubmerged ? '#ef4444' : '#38bdf8';
        const pulseClass = isSubmerged ? 'poi-pulse-danger' : '';

        const bridgeIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge ${pulseClass}" style="
              width: 24px;
              height: 24px;
              border-radius: 50%;
              background: ${bg};
              border: 2px solid ${border};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.5);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 18h20"></path>
                <path d="M4 18V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10"></path>
                <path d="M4 14c4-3 12-3 16 0"></path>
                <path d="M12 6v8"></path>
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([lat, lon], { icon: bridgeIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #ffffff;">🌉 ${props.name}</div>
          <div style="font-size: 10px; color: ${isSubmerged ? '#fca5a5' : '#38bdf8'}; font-weight: 600;">
            ${isSubmerged ? '⚠ SEVERED / SUBMERGED' : `✓ INTACT (${leadTimeHr > 0 ? `ETA +${leadTimeHr.toFixed(1)}h` : 'PASSABLE'})`}
          </div>
        `, { direction: 'top', offset: [0, -14], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">🌉</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 700; color: ${isSubmerged ? '#dc2626' : '#0284c7'};">
                  ${props.criticality || 'CRITICAL'} RIVER CROSSING
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Distance from Dam:</span>
                <b>${distKm} km</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Wave Arrival ETA:</span>
                <b>T + ${arr_t.toFixed(2)} hrs</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Current Status (T+${currentTimestep}h):</span>
                <b style="color: ${isSubmerged ? '#dc2626' : '#059669'};">
                  ${isSubmerged ? '⚠ SEVERED / SUBMERGED' : '✓ OPERATIONAL / INTACT'}
                </b>
              </div>
              <div style="margin-top: 4px; padding: 5px 7px; background: ${isSubmerged ? '#fef2f2' : '#f0fdf4'}; border-radius: 4px; border: 1px solid ${isSubmerged ? '#fecaca' : '#bbf7d0'}; font-size: 10px; color: ${isSubmerged ? '#991b1b' : '#166534'};">
                ${isSubmerged
                  ? '<b>ADVISORY:</b> Bridge is overtopped by hydrodynamic surge. Roadway impassable. Emergency traffic re-routed.'
                  : `<b>ADVISORY:</b> Active evacuation corridor. Safe clearance available before T+${arr_t.toFixed(1)}h.`}
              </div>
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }

      // --- RELIEF CAMPS & EVACUATION BASES ---
      else if (props.category === 'RELIEF_CAMP' && showShelters) {
        const shelterIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge poi-pulse-safe" style="
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: #065f46;
              border: 2px solid #34d399;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 10px rgba(16, 185, 129, 0.6);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"></path>
                <path d="M3 21l9-18 9 18"></path>
                <path d="M12 13v4"></path>
              </svg>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([lat, lon], { icon: shelterIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #34d399;">🏕️ ${props.name}</div>
          <div style="font-size: 10px; color: #a7f3d0;">SAFE +${props.buffer_m || 30}m Freeboard • Cap: ${props.capacity?.toLocaleString() || 'N/A'}</div>
        `, { direction: 'top', offset: [0, -15], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 230px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">🏕️</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #065f46; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 700; color: #059669;">VERIFIED SAFE HIGH-GROUND BASE</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Shelter Capacity:</span>
                <b style="color: #059669;">${props.capacity?.toLocaleString() || 'N/A'} persons</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Ground Elevation:</span>
                <b>${props.elevation_m || 'N/A'} m MSL</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Safety Freeboard:</span>
                <b style="color: #059669;">+${props.buffer_m || 30} m above flood surge</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Operational Readiness:</span>
                <b style="color: #10b981;">100% (SECURE HIGH GROUND)</b>
              </div>
              <div style="margin-top: 4px; padding: 5px 7px; background: #f0fdf4; border-radius: 4px; border: 1px solid #bbf7d0; font-size: 10px; color: #166534;">
                <b>Logistics & Facilities:</b> ${props.facilities || 'Potable water filtration, medical triage, emergency diesel power, wireless comms, helipad.'}
              </div>
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }

      // --- DOWNSTREAM SETTLEMENTS & TOWNS ---
      else if (props.category === 'SETTLEMENT' && showSettlements) {
        const bg = isSubmerged ? '#7c2d12' : '#1e293b';
        const border = isSubmerged ? '#ea580c' : '#f59e0b';
        const pulseClass = isSubmerged ? 'poi-pulse-danger' : '';

        const settlementIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge ${pulseClass}" style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: ${bg};
              border: 2px solid ${border};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([lat, lon], { icon: settlementIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #ffffff;">🏘️ ${props.name}</div>
          <div style="font-size: 10px; color: ${isSubmerged ? '#fca5a5' : '#fbbf24'};">
            ${isSubmerged ? '⚠ ACTIVE INUNDATION' : `Pop: ${(props.population / 1000).toFixed(1)}k (${leadTimeHr > 0 ? `ETA +${leadTimeHr.toFixed(1)}h` : 'SAFE'})`}
          </div>
        `, { direction: 'top', offset: [0, -13], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">🏘️</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 600; color: #64748b;">RIVERINE POPULATION CENTER</div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Population at Risk:</span>
                <b style="color: #ea580c;">${props.population?.toLocaleString() || 'N/A'}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Distance from Dam:</span>
                <b>${distKm} km</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Ground Elevation:</span>
                <b>${props.elevation_m || 'N/A'} m MSL</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Wave Arrival ETA:</span>
                <b>T + ${arr_t.toFixed(2)} hrs</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Flood Hazard Status:</span>
                <b style="color: ${isSubmerged ? '#dc2626' : '#f59e0b'};">
                  ${isSubmerged ? '⚠ SEVERE INUNDATION' : `MONITORING (${leadTimeHr > 0 ? `+${leadTimeHr.toFixed(1)}h buffer` : 'IMMINENT'})`}
                </b>
              </div>
              ${props.assigned_shelter ? `
              <div style="margin-top: 4px; padding: 5px 7px; background: #eff6ff; border-radius: 4px; border: 1px solid #bfdbfe; font-size: 10px; color: #1e40af;">
                <b>Assigned Shelter:</b> ${props.assigned_shelter}
              </div>` : ''}
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }

      // --- CRITICAL FACILITIES (HOSPITAL & POWER GRID) ---
      else if ((props.sub_type === 'HOSPITAL' || props.sub_type === 'POWER_GRID') && showFacilities) {
        const isHosp = props.sub_type === 'HOSPITAL';
        const bg = isHosp ? '#1d4ed8' : '#b45309';
        const border = isHosp ? '#60a5fa' : '#fde047';
        const emoji = isHosp ? '🏥' : '⚡';

        const facIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge ${isSubmerged ? 'poi-pulse-danger' : ''}" style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: ${bg};
              border: 2px solid ${border};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 11px;">${emoji}</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([lat, lon], { icon: facIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #ffffff;">${emoji} ${props.name}</div>
          <div style="font-size: 10px; color: ${isSubmerged ? '#fca5a5' : '#93c5fd'};">
            ${isSubmerged ? '⚠ INUNDATED' : (isHosp ? 'Trauma Center' : 'Grid Substation')}
          </div>
        `, { direction: 'top', offset: [0, -13], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">${emoji}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 700; color: ${isHosp ? '#2563eb' : '#d97706'};">
                  ${isHosp ? 'EMERGENCY MEDICAL ASSET' : 'POWER INFRASTRUCTURE'}
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Distance from Dam:</span>
                <b>${distKm} km</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Criticality Rating:</span>
                <b style="color: #dc2626;">${props.criticality || 'HIGH'}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Surge Threat (T+${currentTimestep}h):</span>
                <b style="color: ${isSubmerged ? '#dc2626' : '#059669'};">
                  ${isSubmerged ? '⚠ SUBMERGED HAZARD' : 'OPERATIONAL'}
                </b>
              </div>
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }

      // --- HYDROMETRIC GAUGES & CANAL HEAD REGULATORS ---
      else if (props.sub_type === 'GAUGE' && showGauges) {
        const gaugeIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge ${isSubmerged ? 'poi-pulse-danger' : ''}" style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #0284c7;
              border: 2px solid #38bdf8;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 11px;">💧</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([lat, lon], { icon: gaugeIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #ffffff;">💧 ${props.name}</div>
          <div style="font-size: 10px; color: ${isSubmerged ? '#fca5a5' : '#7dd3fc'};">
            ${isSubmerged ? '⚠ SENSOR OVERTOPPED' : 'Hydrometric Telemetry Gauge'}
          </div>
        `, { direction: 'top', offset: [0, -13], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">💧</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 700; color: #0284c7;">
                  CWC / IRRIGATION TELEMETRY STATION
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Distance from Dam:</span>
                <b>${distKm} km</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Criticality Rating:</span>
                <b style="color: #0284c7;">${props.criticality || 'HIGH'}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Telemetry Status:</span>
                <b style="color: ${isSubmerged ? '#dc2626' : '#059669'};">
                  ${isSubmerged ? '⚠ INUNDATED / CALIBRATION LOST' : '✓ TRANSMITTING DISCHARGE'}
                </b>
              </div>
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }

      // --- EMERGENCY & RESCUE SERVICES ---
      else if (props.sub_type === 'EMERGENCY_SERVICES' && showEmergency) {
        const emergIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge poi-pulse-safe" style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #b91c1c;
              border: 2px solid #f87171;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(185, 28, 28, 0.6);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 11px;">🚒</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([lat, lon], { icon: emergIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #ffffff;">🚒 ${props.name}</div>
          <div style="font-size: 10px; color: #fca5a5;">
            Tactical Disaster Response & Rescue
          </div>
        `, { direction: 'top', offset: [0, -13], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">🚒</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 700; color: #b91c1c;">
                  CIVIL DEFENSE & FIRST RESPONDER DEPOT
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Distance from Dam:</span>
                <b>${distKm} km</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Operational Readiness:</span>
                <b style="color: #059669;">100% (ACTIVE READINESS)</b>
              </div>
              <div style="margin-top: 4px; padding: 5px 7px; background: #fef2f2; border-radius: 4px; border: 1px solid #fecaca; font-size: 10px; color: #991b1b;">
                Equipped with flood inflatable rescue boats, emergency power, heavy extraction, and direct link to SDRF/NDRF.
              </div>
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }

      // --- HERITAGE & INDUSTRIAL LANDMARKS ---
      else if (props.sub_type === 'HERITAGE_INDUSTRY' && showHeritage) {
        const symbol = props.name.includes('Temple') ? '🛕' : (props.name.includes('Rail') ? '🚂' : (props.name.includes('Barrage') ? '🌊' : '🏛️'));
        const heritageIcon = L.divIcon({
          className: 'custom-poi-marker',
          html: `
            <div class="poi-badge ${isSubmerged ? 'poi-pulse-danger' : ''}" style="
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: #475569;
              border: 2px solid #94a3b8;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5);
              cursor: pointer;
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 11px;">${symbol}</span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const marker = L.marker([lat, lon], { icon: heritageIcon });
        marker.bindTooltip(`
          <div style="font-weight: 700; font-size: 11px; color: #ffffff;">${symbol} ${props.name}</div>
          <div style="font-size: 10px; color: ${isSubmerged ? '#fca5a5' : '#cbd5e1'};">
            ${isSubmerged ? '⚠ INUNDATION WARNING' : 'Heritage / Industrial Asset'}
          </div>
        `, { direction: 'top', offset: [0, -13], className: 'tactical-tooltip', opacity: 0.95 });

        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 6px; min-width: 220px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              <span style="font-size: 18px;">${symbol}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; line-height: 1.2;">${props.name}</div>
                <div style="font-size: 10px; font-weight: 600; color: #475569;">
                  RIVER BASIN HISTORICAL & ECONOMIC ASSET
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Distance from Dam:</span>
                <b>${distKm} km</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Criticality Rating:</span>
                <b style="color: #475569;">${props.criticality || 'MEDIUM'}</b>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Flood Hazard at T+${currentTimestep}h:</span>
                <b style="color: ${isSubmerged ? '#dc2626' : '#059669'};">
                  ${isSubmerged ? '⚠ PARTIALLY SUBMERGED' : '✓ SECURE'}
                </b>
              </div>
            </div>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }
    });
  }, [infraGeoJson, showBridges, showShelters, showSettlements, showFacilities, showGauges, showEmergency, showHeritage, currentTimestep]);

  // 6. Arrival Wave Isochrones
  useEffect(() => {
    if (!isochroneLayerRef.current) return;
    isochroneLayerRef.current.clearLayers();

    if (!showIsochrones || !isochronesData?.features) return;

    isochronesData.features.forEach((iso: any) => {
      const [lon, lat] = iso.geometry.coordinates;
      const { arrival_time_hr, distance_from_dam_km, location_label } = iso.properties;

      const isochroneIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div class="poi-badge" style="
            background: #0284c7;
            border: 1.5px solid #38bdf8;
            color: #ffffff;
            font-size: 9px;
            font-weight: 700;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            ${arrival_time_hr}h
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const m = L.marker([lat, lon], { icon: isochroneIcon });
      m.bindTooltip(`
        <div style="font-weight: 700; font-size: 11px; color: #38bdf8;">⏱ ${location_label || 'Wave Front Arrival'}</div>
        <div style="font-size: 10px; color: #cbd5e1;">ETA: <b>T + ${arrival_time_hr} hrs</b> • Reach: <b>${distance_from_dam_km} km</b></div>
      `, { direction: 'top', offset: [0, -12], className: 'tactical-tooltip', opacity: 0.95 });

      m.bindPopup(`
        <div style="font-family: Outfit, sans-serif; color: #04101e; padding: 4px;">
          <strong style="font-size: 13px; color: #0284c7;">${location_label || 'Flood Wave Arrival'}</strong><br/>
          <span style="font-size: 11px;">Wave Arrival Time: <b>T + ${arrival_time_hr} hrs</b></span><br/>
          <span style="font-size: 11px;">Distance along Reach: <b>${distance_from_dam_km} km</b></span>
        </div>
      `);
      isochroneLayerRef.current?.addLayer(m);
    });
  }, [isochronesData, showIsochrones]);

  // 7. Dynamic Flood Envelope & Velocity Vectors at currentTimestep
  useEffect(() => {
    if (!floodPolyLayerRef.current || !layersData || !mapRef.current) return;

    floodPolyLayerRef.current.clearLayers();
    velocityLayerRef.current?.clearLayers();

    // Robust lookup across "1", "1.0", 1, etc.
    const stepData =
      layersData[String(currentTimestep)] ||
      layersData[currentTimestep.toFixed(1)] ||
      layersData[Object.keys(layersData).find((k) => Math.abs(parseFloat(k) - currentTimestep) < 0.05) || ''];

    if (!stepData) return;

    // 1. Inundation Polygon
    if (showDepth && stepData.polygons) {
      floodPolyLayerRef.current.addData(stepData.polygons);
      floodPolyLayerRef.current.setStyle((feature: any) => {
        const props = feature?.properties || {};
        const tier = props.zone_tier;
        const depth = props.max_depth_m || 0;

        if (tier === 'CHANNEL_CORE') {
          // Deep high-momentum torrent channel
          return {
            fillColor: '#0369a1',
            fillOpacity: 0.72,
            color: '#38bdf8',
            weight: 1.2,
            opacity: 0.85,
            smoothFactor: 1.2
          };
        } else if (tier === 'FLOODPLAIN_SWATH') {
          // Wider shallow floodplain inundation envelope
          return {
            fillColor: '#38bdf8',
            fillOpacity: 0.38,
            color: '#0284c7',
            weight: 1.0,
            opacity: 0.70,
            smoothFactor: 1.2
          };
        }

        // Depth-based realistic hydrodynamic palette (shallow sky-blue to deep ocean azure)
        let fillColor = '#7dd3fc';
        let fillOpacity = 0.40;
        let strokeColor = '#38bdf8';

        if (depth > 10.0) {
          fillColor = '#0c4a6e';
          fillOpacity = 0.75;
          strokeColor = '#0284c7';
        } else if (depth > 5.0) {
          fillColor = '#0284c7';
          fillOpacity = 0.65;
          strokeColor = '#38bdf8';
        } else if (depth > 2.0) {
          fillColor = '#38bdf8';
          fillOpacity = 0.50;
          strokeColor = '#7dd3fc';
        }

        return {
          fillColor,
          fillOpacity,
          color: strokeColor,
          weight: 1.0,
          opacity: 0.80,
          smoothFactor: 1.2
        };
      });

      floodPolyLayerRef.current.bindPopup((layer: any) => {
        const props = layer.feature?.properties || {};
        const tierTitle = props.zone_tier === 'CHANNEL_CORE'
          ? 'Deep Channel Torrent (High Momentum)'
          : props.zone_tier === 'FLOODPLAIN_SWATH'
          ? 'Valley Floodplain Swath (Active Inundation)'
          : 'Hydrodynamic Flood Extent';

        return `
          <div style="font-family: Outfit, sans-serif; color: #0f172a; padding: 4px; min-width: 170px;">
            <div style="font-size: 12px; font-weight: 700; color: #0284c7; margin-bottom: 4px;">
              ${tierTitle}
            </div>
            <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748b;">Simulation Time:</span>
              <b>T + ${props.time_hr || currentTimestep} hrs</b>
            </div>
            <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748b;">Peak Depth:</span>
              <b style="color: #0369a1;">${props.max_depth_m} m</b>
            </div>
            <div style="font-size: 11px; display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748b;">Wave Celerity:</span>
              <b>${props.max_velocity_ms} m/s</b>
            </div>
            <div style="font-size: 11px; display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Inundated Area:</span>
              <b>${props.inundated_area_km2} km²</b>
            </div>
          </div>
        `;
      });
    }

    // 2. Velocity Vectors
    if (showVelocity && stepData.vectors && velocityLayerRef.current) {
      stepData.vectors.features?.forEach((vec: any) => {
        const [lon, lat] = vec.geometry.coordinates;
        const v = vec.properties.velocity_ms;
        const heading = vec.properties.heading_deg;

        const arrowIcon = L.divIcon({
          className: 'vel-arrow',
          html: `
            <div style="
              transform: rotate(${heading}deg);
              width: 18px;
              height: 18px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              text-shadow: 0 0 6px #00f0ff;
            ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });

        const m = L.marker([lat, lon], { icon: arrowIcon });
        m.bindTooltip(`Flow Velocity: ${v} m/s`, { permanent: false });
        velocityLayerRef.current?.addLayer(m);
      });
    }
  }, [layersData, currentTimestep, showDepth, showVelocity]);

  return (
    <div className="map-viewport">
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top Left HUD: Layer Switches & Base Map */}
      <div className="map-hud-top-left">
        <div className="hud-panel layer-toggles tour-map-layers">
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600 }}>
            Geospatial Overlays
          </div>

          <div
            className={`toggle-item ${showDepth ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowDepth(!showDepth); }}
          >
            <span>Flood Depth Heatmap</span>
            {showDepth ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showVelocity ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowVelocity(!showVelocity); }}
          >
            <span>Velocity Vectors (m/s)</span>
            {showVelocity ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showIsochrones ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowIsochrones(!showIsochrones); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} style={{ color: 'var(--cyan-primary)' }} />
              <span>Wave Isochrones</span>
            </div>
            {showIsochrones ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showBridges ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowBridges(!showBridges); }}
            title="Toggle Major River Bridges & Highway Crossings"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>🌉</span>
              <span>Bridges & Crossings</span>
            </div>
            {showBridges ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showShelters ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowShelters(!showShelters); }}
            title="Toggle Safe High-Ground Relief Camps & Evacuation Centers"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>🏕️</span>
              <span>Safe Relief Shelters</span>
            </div>
            {showShelters ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showSettlements ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowSettlements(!showSettlements); }}
            title="Toggle Downstream Population Centers & Villages"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>🏘️</span>
              <span>Downstream Towns</span>
            </div>
            {showSettlements ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showFacilities ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowFacilities(!showFacilities); }}
            title="Toggle Hospitals, Trauma Centers & Power Substations"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>🏥</span>
              <span>Hospitals & Power Grid</span>
            </div>
            {showFacilities ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showGauges ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowGauges(!showGauges); }}
            title="Toggle CWC Stream Telemetry Gauges & Canal Head Regulators"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>💧</span>
              <span>Gauges & Canal Lifelines</span>
            </div>
            {showGauges ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showEmergency ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowEmergency(!showEmergency); }}
            title="Toggle Fire & Emergency Rescue Stations and Taluk EOCs"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>🚒</span>
              <span>Emergency Rescue Bases</span>
            </div>
            {showEmergency ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showHeritage ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowHeritage(!showHeritage); }}
            title="Toggle Historic Gokak Mills, Temples, Rail Junction & Weirs"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '11px' }}>🏛️</span>
              <span>Heritage & Industrial Sites</span>
            </div>
            {showHeritage ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showDamStructure ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowDamStructure(!showDamStructure); }}
            title="Toggle Hidkal Dam 10.18km Embankment, Spillway & Raja Lakhamagouda Reservoir"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Waves size={12} style={{ color: '#38bdf8' }} />
              <span>Dam & Reservoir Footprint</span>
            </div>
            {showDamStructure ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showContours ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowContours(!showContours); }}
            title="Toggle Topographic Elevation Contours (660m to 540m MSL)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Mountain size={12} style={{ color: '#a78bfa' }} />
              <span>Valley Topo Contours</span>
            </div>
            {showContours ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div
            className={`toggle-item ${showRiver ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowRiver(!showRiver); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span style={{ width: 8, height: 2, background: '#00f0ff', display: 'inline-block' }}></span>
              <span>Ghataprabha Channel</span>
            </div>
            {showRiver ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div className="tour-map-styles" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.2rem' }}>
            <button
              className={`btn ${baseMap === 'light' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.62rem', padding: '0.2rem 0.15rem', justifyContent: 'center' }}
              onClick={() => { soundEffects.playClickSound(); setBaseMap('light'); }}
              title="CARTO Voyager Basemap (Key Active)"
            >
              Voyager
            </button>
            <button
              className={`btn ${baseMap === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.62rem', padding: '0.2rem 0.15rem', justifyContent: 'center' }}
              onClick={() => { soundEffects.playClickSound(); setBaseMap('dark'); }}
              title="CARTO Dark Matter (Key Active)"
            >
              Dark
            </button>
            <button
              className={`btn ${baseMap === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.62rem', padding: '0.2rem 0.15rem', justifyContent: 'center' }}
              onClick={() => { soundEffects.playClickSound(); setBaseMap('satellite'); }}
              title="Esri World Satellite Imagery"
            >
              Satellite
            </button>
            <button
              className={`btn ${baseMap === 'topo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.62rem', padding: '0.2rem 0.15rem', justifyContent: 'center' }}
              onClick={() => { soundEffects.playClickSound(); setBaseMap('topo'); }}
              title="Esri World Topographic Relief"
            >
              Topo
            </button>
          </div>

          {/* Quick Spatial Bookmarks */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.2rem' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Navigation size={11} style={{ color: 'var(--cyan-primary)' }} />
              <span>Spatial Bookmarks:</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.62rem', padding: '0.2rem 0.2rem', justifyContent: 'center' }}
                onClick={() => {
                  soundEffects.playClickSound();
                  mapRef.current?.flyTo([16.1488, 74.6366], 13, { duration: 1.2 });
                }}
              >
                Dam Crest
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.62rem', padding: '0.2rem 0.2rem', justifyContent: 'center' }}
                onClick={() => {
                  soundEffects.playClickSound();
                  mapRef.current?.flyTo([16.1752, 74.7965], 14, { duration: 1.2 });
                }}
              >
                Gokak Falls
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.62rem', padding: '0.2rem 0.2rem', justifyContent: 'center' }}
                onClick={() => {
                  soundEffects.playClickSound();
                  mapRef.current?.flyTo([16.168, 74.70], 13, { duration: 1.2 });
                }}
              >
                Gorge Bridge
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.62rem', padding: '0.2rem 0.2rem', justifyContent: 'center' }}
                onClick={() => {
                  soundEffects.playClickSound();
                  mapRef.current?.flyTo([16.175, 74.82], 12, { duration: 1.2 });
                }}
              >
                Gokak City
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.62rem', padding: '0.2rem 0.2rem', justifyContent: 'center', gridColumn: 'span 2' }}
                onClick={() => {
                  soundEffects.playClickSound();
                  mapRef.current?.flyTo([16.175, 74.76], 11, { duration: 1.2 });
                }}
              >
                Full Reach (Dam to Konnur)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Right HUD: Water Depth Legend */}
      <div className="map-hud-top-right">
        <div className="hud-panel" style={{ minWidth: '170px' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Water Depth Legend
          </div>
          <div className="depth-ramp">
            <div className="ramp-bar"></div>
            <div className="ramp-labels">
              <span>0m</span>
              <span>2m</span>
              <span>5m</span>
              <span>10m+</span>
            </div>
          </div>
          <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '12px' }}>🌉</span>
              <span>Bridges (Severed ⚠ / Intact ✓)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '12px' }}>🏕️</span>
              <span>Safe High-Ground Shelters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '12px' }}>🏘️</span>
              <span>Downstream Villages & Cities</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '12px' }}>🏥</span>
              <span>Hospitals & Power Substations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
