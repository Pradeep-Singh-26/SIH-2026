import React from 'react';
import { X, Cpu, BookOpen, Zap, ShieldAlert } from 'lucide-react';

interface SystemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemGuideModal: React.FC<SystemGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 780 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={20} style={{ color: 'var(--cyan-primary)' }} />
            <span>Mission Control & Solver Framework Guide</span>
            <span className="badge-sih" style={{ marginLeft: '0.5rem' }}>SIH26161</span>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close guide">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {/* Executive Architecture Overview */}
          <div className="panel-card" style={{ background: 'rgba(6, 11, 24, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#ffffff', fontWeight: 600 }}>
              <Cpu size={16} style={{ color: 'var(--cyan-primary)' }} />
              <span>Coupled Hydrodynamic Simulation Architecture</span>
            </div>
            <p style={{ lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Built for <b>Smart India Hackathon 2026 (SIH26161)</b>, this platform provides high-fidelity dam breach hydrodynamic modelling, rapid inundation forecasting, and Humanitarian Assistance & Disaster Relief (HADR) emergency response planning for <b>Hidkal Dam (Raja Lakhamgouda Reservoir)</b> on the Ghataprabha River.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div className="meta-item">
                <div className="meta-label">2D Shallow Water Equations</div>
                <div style={{ color: 'var(--cyan-primary)', fontWeight: 600, fontSize: '0.8rem' }}>Delft3D Flexible Mesh</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Unstructured curvilinear SWE downstream routing</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">3D Near-Field CFD</div>
                <div style={{ color: '#8b5cf6', fontWeight: 600, fontSize: '0.8rem' }}>Three.js SPH Lagrangian</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>60,000 particle dam breach & canyon jet</div>
              </div>
              <div className="meta-item">
                <div className="meta-label">Earth Observation Validation</div>
                <div style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>Sentinel-1 SAR via GEE</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>All-weather cloud-penetrating flood extent</div>
              </div>
            </div>
          </div>

          {/* Quick Keyboard Shortcuts & Hotkeys */}
          <div className="panel-card" style={{ background: 'rgba(6, 11, 24, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: '#ffffff', fontWeight: 600 }}>
              <Zap size={16} style={{ color: '#f59e0b' }} />
              <span>Tactical Keyboard Shortcuts</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                <span>Toggle Play / Pause</span>
                <kbd style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', padding: '0.15rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>Space</kbd>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                <span>Toggle Zen / Cinematic Mode (Hide HUD)</span>
                <kbd style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', padding: '0.15rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>H</kbd>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                <span>Quick Camera Viewpoints</span>
                <kbd style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', padding: '0.15rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>1, 2, 3, 4</kbd>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 4 }}>
                <span>Toggle Audio Sound FX & Siren</span>
                <kbd style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-glass)', padding: '0.15rem 0.5rem', borderRadius: 4, fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>M</kbd>
              </div>
            </div>
          </div>

          {/* Operational Workflow for Demonstrations */}
          <div className="panel-card" style={{ background: 'rgba(6, 11, 24, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: '#ffffff', fontWeight: 600 }}>
              <ShieldAlert size={16} style={{ color: '#ef4444' }} />
              <span>Recommended Presentation Workflow</span>
            </div>
            <ol style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', lineHeight: 1.45 }}>
              <li><b>3D SPH Fluid Visualization:</b> Observe the intact reservoir at T - 30s. Click <b>"Trigger Dam Break (T=0)"</b> to unleash the 3D hydrodynamic fluid surge down the Hidkal gorge.</li>
              <li><b>Real-Time Hydraulic Telemetry:</b> Monitor the <b>Discharge Q(t)</b>, Froude number (<b>Fr &gt; 1 supercritical chute flow</b>), and submerged asset alarms as the wave impacts the Gorge Bridge.</li>
              <li><b>Live HADR Drawer:</b> Open the slide-out disaster drawer on the right to inspect vulnerable population metrics without switching views.</li>
              <li><b>2D Tactical GIS Map:</b> Toggle to the 2D GIS view to examine spatial flood polygon envelopes across Gokak City and view high-ground evacuation centers.</li>
              <li><b>Cross-Engine Comparison & Satellite Validation:</b> Open <b>"Compare Delft3D vs SPH"</b> and <b>"Sentinel-1 GEE"</b> in the top navbar for scientific validation and GIS exports (Shapefile / GeoJSON / KML).</li>
            </ol>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.45rem 1.25rem' }}>
            Got It, Back to Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
