import React, { useEffect, useState } from 'react';
import { X, Satellite, Copy, Check, Terminal } from 'lucide-react';
import { getGeeFramework } from '../services/api';

interface GeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GeeModal: React.FC<GeeModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    getGeeFramework().then(setData).catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!data?.gee_script_snippet) return;
    navigator.clipboard.writeText(data.gee_script_snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 750 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Satellite style={{ color: 'var(--cyan-primary)' }} />
            <span>Near Real-Time Flood EO Framework (Sentinel-1 / GEE)</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ fontSize: '0.84rem', lineHeight: 1.5, color: '#cbd5e1', marginBottom: '1rem' }}>
          <p>
            In compliance with <b>Problem Statement SIH26161 Deliverable IV</b>, this module integrates open-source Earth Observation (EO) satellite data for emergency response validation.
          </p>
          <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
            <b>Methodology:</b> Cloud-penetrating Copernicus Sentinel-1 Synthetic Aperture Radar (SAR) C-band GRD backscatter thresholding (VH cross-polarization). Smooth standing water reflects radar pulses away from the satellite sensor, producing distinct backscatter drops (&lt; -3.2 dB difference).
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          <div className="meta-item">
            <div className="meta-label">Primary Satellite Sensor</div>
            <div className="meta-val" style={{ fontSize: '0.78rem' }}>Copernicus Sentinel-1 SAR (C-band)</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Validation Sensor</div>
            <div className="meta-val" style={{ fontSize: '0.78rem' }}>Sentinel-2 MSI (Optical 10m NDWI)</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Terminal size={14} />
              <span>Google Earth Engine (GEE) Code Editor Script</span>
            </span>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
            >
              {copied ? <Check size={13} style={{ color: 'var(--emerald-safe)' }} /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy GEE Script'}</span>
            </button>
          </div>

          <pre style={{
            background: '#040813',
            border: '1px solid var(--border-glass)',
            borderRadius: 8,
            padding: '0.85rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem',
            color: '#38bdf8',
            maxHeight: 220,
            overflowY: 'auto',
            lineHeight: 1.4
          }}>
            {data?.gee_script_snippet || '// Loading GEE script...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
