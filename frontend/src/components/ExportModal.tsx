import React from 'react';
import { X, Download, FileText, Globe, Map } from 'lucide-react';
import { getExportUrl } from '../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, simulationId }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Download style={{ color: 'var(--cyan-primary)' }} />
            <span>Export Simulation Layers to GIS</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Download simulated flood extents, depth contours, and hazard boundaries in standardized formats compatible with QGIS, ArcGIS, and Google Earth.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
          {/* GeoJSON */}
          <a
            href={getExportUrl(simulationId, 'geojson')}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Globe size={22} style={{ color: 'var(--cyan-primary)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>GeoJSON Feature Collection</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EPSG:4326 WGS84 standard format for web GIS and MapLibre</div>
              </div>
            </div>
            <Download size={18} />
          </a>

          {/* KML */}
          <a
            href={getExportUrl(simulationId, 'kml')}
            download={`flood_inundation_${simulationId}.kml`}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Map size={22} style={{ color: 'var(--amber-warn)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>Google Earth KML 2.2</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vector polygons and styled disaster placemarks for Google Earth 3D</div>
              </div>
            </div>
            <Download size={18} />
          </a>

          {/* ESRI Shapefile Bundle */}
          <a
            href={getExportUrl(simulationId, 'shp')}
            download={`flood_shapefile_${simulationId}.zip`}
            className="btn btn-secondary"
            style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={22} style={{ color: 'var(--emerald-safe)' }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>ESRI GIS Bundle (.zip)</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Complete archive with PRJ, metadata, and GIS layers for ArcGIS/QGIS</div>
              </div>
            </div>
            <Download size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};
