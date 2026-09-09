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
  const [showVelocity, setShowVelocity] = useState(true);
  const [showIsochrones, setShowIsochrones] = useState(true);
  const [showInfra, setShowInfra] = useState(true);
  const [showRelief, setShowRelief] = useState(true);
  const [showDamStructure, setShowDamStructure] = useState(true);
  const [showContours, setShowContours] = useState(true);
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
      attributionControl: true
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Tile Layer
    const initialTile = createTileLayer(baseMap).addTo(map);
    tileLayerRef.current = initialTile;

    // Dam marker
    const damIcon = L.divIcon({
      className: 'dam-marker',
      html: `
        <div style="
          background: #00f0ff;
          border: 2px solid #ffffff;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 16px rgba(0,240,255,0.8);
          font-weight: 800;
          font-size: 11px;
          color: #04101e;
        ">
          DAM
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const damMarker = L.marker([16.1488, 74.6366], { icon: damIcon }).addTo(map);
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
            className: 'power-icon',
            html: `<div style="background:#8b5cf6;border:2px solid #fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(139,92,246,0.8);font-size:12px;">⚡</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          L.marker([coords[1], coords[0]], { icon: powerIcon }).bindPopup(`
            <div style="font-family: Inter, sans-serif; color: #04101e; padding: 4px;">
              <h4 style="margin: 0; color: #6d28d9; font-size: 13px; font-weight: 700;">⚡ ${feat.properties.name}</h4>
              <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">${feat.properties.installed_capacity_mw ? `${feat.properties.installed_capacity_mw} MW Capacity` : 'Hydroelectric Generation Plant'}</p>
            </div>
          `).addTo(terrainLayerRef.current!);
        } else if (type === 'WATERFALL_GORGE') {
          const coords = feat.geometry.coordinates;
          const fallIcon = L.divIcon({
            className: 'waterfall-icon',
            html: `<div style="background:#0284c7;border:2px solid #fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(2,132,199,0.9);font-size:13px;">🌊</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          L.marker([coords[1], coords[0]], { icon: fallIcon }).bindPopup(`
            <div style="font-family: Inter, sans-serif; color: #04101e; padding: 4px; min-width: 210px;">
              <h4 style="margin: 0; color: #0284c7; font-size: 13px; font-weight: 700;">🌊 ${feat.properties.name}</h4>
              <p style="margin: 4px 0 0; font-size: 11px; color: #475569;">Famous 52m vertical waterfall plunge on Ghataprabha River into a horseshoe sandstone canyon gorge.</p>
            </div>
          `).addTo(terrainLayerRef.current!);
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

  // 5. Infrastructure & Settlements
  useEffect(() => {
    if (!infraLayerRef.current || !infraGeoJson) return;
    infraLayerRef.current.clearLayers();

    if (!showInfra && !showRelief) return;

    infraGeoJson.features?.forEach((feat: any) => {
      const [lon, lat] = feat.geometry.coordinates;
      const props = feat.properties;

      if (props.category === 'SETTLEMENT' && showInfra) {
        const marker = L.circleMarker([lat, lon], {
          radius: 6,
          fillColor: '#f59e0b',
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 0.9
        });
        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #04101e; padding: 4px;">
            <strong style="font-size: 13px;">${props.name}</strong><br/>
            <span style="font-size: 11px;">Population: <b>${props.population?.toLocaleString() || 'N/A'}</b></span><br/>
            <span style="font-size: 11px;">Dist from Dam: <b>${props.distance_km || 'N/A'} km</b></span>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      } else if (props.category === 'INFRASTRUCTURE' && showInfra) {
        const marker = L.circleMarker([lat, lon], {
          radius: 7,
          fillColor: '#ef4444',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95
        });
        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #04101e; padding: 4px;">
            <strong style="font-size: 13px; color: #dc2626;">[CRITICAL] ${props.name}</strong><br/>
            <span style="font-size: 11px;">Type: <b>${props.sub_type || 'Infrastructure'}</b></span><br/>
            <span style="font-size: 11px;">Hazard Status: <b>INUNDATION RISK</b></span>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      } else if (props.category === 'RELIEF_CAMP' && showRelief) {
        const marker = L.circleMarker([lat, lon], {
          radius: 8,
          fillColor: '#10b981',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95
        });
        marker.bindPopup(`
          <div style="font-family: Outfit, sans-serif; color: #04101e; padding: 4px;">
            <strong style="font-size: 13px; color: #059669;">[SAFE] ${props.name}</strong><br/>
            <span style="font-size: 11px;">Capacity: <b>${props.capacity?.toLocaleString() || 'N/A'} persons</b></span><br/>
            <span style="font-size: 11px;">Elevation: <b>${props.elevation_m || 'N/A'} m MSL</b></span>
          </div>
        `);
        infraLayerRef.current?.addLayer(marker);
      }
    });
  }, [infraGeoJson, showInfra, showRelief]);

  // 6. Arrival Wave Isochrones
  useEffect(() => {
    if (!isochroneLayerRef.current) return;
    isochroneLayerRef.current.clearLayers();

    if (!showIsochrones || !isochronesData?.features) return;

    isochronesData.features.forEach((iso: any) => {
      const [lon, lat] = iso.geometry.coordinates;
      const { arrival_time_hr, distance_from_dam_km, location_label } = iso.properties;

      const isochroneIcon = L.divIcon({
        className: 'isochrone-marker',
        html: `
          <div style="
            background: rgba(14, 165, 233, 0.92);
            border: 1.5px solid #00f0ff;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 10px;
            white-space: nowrap;
            box-shadow: 0 0 8px rgba(0, 240, 255, 0.6);
            display: inline-block;
          ">
            ⏱ +${arrival_time_hr}h
          </div>
        `,
        iconSize: [40, 18],
        iconAnchor: [20, 9]
      });

      const m = L.marker([lat, lon], { icon: isochroneIcon });
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
        const depth = feature?.properties?.max_depth_m || 0;
        let fillColor = '#38bdf8';
        if (depth > 8.0) fillColor = '#ef4444';
        else if (depth > 4.0) fillColor = '#f59e0b';
        else if (depth > 2.0) fillColor = '#2563eb';

        return {
          fillColor: fillColor,
          fillOpacity: 0.65,
          color: '#00f0ff',
          weight: 2.5,
          opacity: 0.95
        };
      });

      floodPolyLayerRef.current.bindPopup((layer: any) => {
        const props = layer.feature?.properties || {};
        return `
          <div style="font-family: Outfit, sans-serif; color: #04101e; padding: 4px;">
            <strong style="font-size: 13px;">Hydrodynamic Inundation Front</strong><br/>
            <span style="font-size: 11px;">Time: <b>T + ${props.time_hr || currentTimestep} hrs</b></span><br/>
            <span style="font-size: 11px;">Peak Depth: <b>${props.max_depth_m} m</b></span><br/>
            <span style="font-size: 11px;">Peak Velocity: <b>${props.max_velocity_ms} m/s</b></span><br/>
            <span style="font-size: 11px;">Inundated Area: <b>${props.inundated_area_km2} km²</b></span>
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
        <div className="hud-panel layer-toggles">
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
            className={`toggle-item ${showInfra ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowInfra(!showInfra); }}
          >
            <span>Settlements & Bridges</span>
            {showInfra ? <Eye size={14} /> : <EyeOff size={14} />}
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

          <div
            className={`toggle-item ${showRelief ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setShowRelief(!showRelief); }}
          >
            <span>Safe Relief Camps</span>
            {showRelief ? <Eye size={14} /> : <EyeOff size={14} />}
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem', marginTop: '0.2rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.2rem' }}>
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
          <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
              <span>Severed Bridges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
              <span>High-Ground Shelters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
              <span>Downstream Villages</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
