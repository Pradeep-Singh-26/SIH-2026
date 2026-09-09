import React, { useEffect, useState } from 'react';
import { X, SplitSquareVertical, Zap } from 'lucide-react';
import { compareScenarios } from '../services/api';
import type { ScenarioComparison } from '../types';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<ScenarioComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    compareScenarios('sim-preset-delft3d', 'sim-preset-sph')
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <SplitSquareVertical style={{ color: 'var(--purple-sph)' }} />
            <span>Hydrodynamic Comparison: Delft3D FM vs SPH Model</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {loading || !data ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Calculating hydrodynamic comparative metrics...
          </div>
        ) : (
          <div>
            {/* Scientific Narrative Card */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '0.35rem' }}>
                <Zap size={16} />
                <span>Eulerian (Delft3D) vs Lagrangian Particle (SPH) Physics</span>
              </div>
              <p style={{ color: '#e2e8f0' }}>{data.narrative_summary}</p>
            </div>

            {/* Comparison Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.6rem 0.4rem' }}>Hydrodynamic Metric</th>
                  <th style={{ padding: '0.6rem 0.4rem', color: 'var(--cyan-primary)' }}>Delft3D-FM (2D SWE)</th>
                  <th style={{ padding: '0.6rem 0.4rem', color: 'var(--purple-sph)' }}>SPH Particle Model</th>
                  <th style={{ padding: '0.6rem 0.4rem', color: 'var(--amber-warn)' }}>Variance Δ</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.6rem 0.4rem', fontWeight: 600 }}>Peak Outflow (Qp)</td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_a.peak_q.toLocaleString()} m³/s
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_b.peak_q.toLocaleString()} m³/s
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)', color: 'var(--amber-warn)' }}>
                    {data.comparison_metrics.peak_discharge_diff_pct > 0 ? '+' : ''}
                    {data.comparison_metrics.peak_discharge_diff_pct}%
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.6rem 0.4rem', fontWeight: 600 }}>Arrival Time at Gokak City</td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_a.arrival_gokak_hr.toFixed(2)} hrs
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_b.arrival_gokak_hr.toFixed(2)} hrs
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>
                    {data.comparison_metrics.arrival_time_diff_min} mins earlier
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.6rem 0.4rem', fontWeight: 600 }}>Inundated Reach Area</td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_a.inundated_area_km2} km²
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_b.inundated_area_km2} km²
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    +{data.comparison_metrics.inundated_area_diff_km2} km²
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '0.6rem 0.4rem', fontWeight: 600 }}>Population at Risk</td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_a.pop_at_risk.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)' }}>
                    {data.comparison_metrics.scenario_b.pop_at_risk.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.6rem 0.4rem', fontFamily: 'var(--font-mono)', color: 'var(--red-hazard)' }}>
                    Identical Reach
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Key Hydraulic Insights */}
            <div style={{ background: 'rgba(6,11,24,0.6)', borderRadius: '8px', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Key Hydraulic Insights for HADR Planning
              </div>
              <ul style={{ fontSize: '0.78rem', color: '#cbd5e1', paddingLeft: '1.2rem', lineHeight: 1.6 }}>
                <li><b>Near-Field Impact:</b> SPH models steeper vertical pressure heads against river bends, recommending higher freeboard margins near the dam toe.</li>
                <li><b>Far-Field Floodplain Diffusion:</b> Delft3D FM incorporates Manning riverbed roughness dissipation more stably across wide downstream agricultural floodplains.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
