import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle, ShieldCheck, Activity, Flame, ChevronRight, ChevronLeft,
  Layers, MapPin, Gauge, Wheat
} from 'lucide-react';
import type { SimulationResult } from '../types';
import { soundEffects } from '../services/soundEffects';

interface ImpactPanelProps {
  simulation: SimulationResult | null;
  currentTimestep: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({
  simulation,
  currentTimestep,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INFRASTRUCTURE' | 'EVACUATION'>('OVERVIEW');

  if (isCollapsed) {
    return (
      <div
        className="sidebar-collapsed sidebar-right-collapsed"
        style={{
          width: 48,
          background: 'var(--bg-glass)',
          borderLeft: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '1rem 0',
          gap: '1rem',
          zIndex: 500
        }}
      >
        <button
          className="btn-icon"
          onClick={() => { soundEffects.playClickSound(); onToggleCollapse?.(); }}
          title="Expand HADR Impact & Analytics Panel"
        >
          <ChevronLeft size={18} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 600
          }}
        >
          HADR Impact & Hydrograph
        </div>
      </div>
    );
  }

  if (!simulation) {
    return (
      <aside className="sidebar sidebar-right">
        <div className="panel-card">
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>
            No simulation loaded. Select parameters and click "Run Hydrodynamic Model".
          </div>
        </div>
      </aside>
    );
  }

  const { hydrograph, impact } = simulation;

  // Chart data for hydrograph
  const chartData = hydrograph.points.map((pt) => ({
    time: `${pt.time_hr}h`,
    discharge: Math.round(pt.discharge_m3s)
  }));

  // Current timestep metrics
  const curStep = simulation.timesteps.find((t) => t.time_hr === currentTimestep) || simulation.timesteps[0];

  return (
    <aside className="sidebar sidebar-right">
      {/* Top Header with Tab Switcher */}
      <div className="panel-card" style={{ padding: '0.65rem 0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
          <div className="panel-title" style={{ fontSize: '0.8rem' }}>
            <Activity size={16} style={{ color: 'var(--cyan-primary)' }} />
            <span>HADR Impact Analytics</span>
          </div>
          {onToggleCollapse && (
            <button
              className="btn-icon"
              style={{ width: 24, height: 24, padding: 0 }}
              onClick={() => { soundEffects.playClickSound(); onToggleCollapse(); }}
              title="Collapse Panel"
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        <div className="segmented-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'OVERVIEW' ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setActiveTab('OVERVIEW'); }}
          >
            Overview
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'INFRASTRUCTURE' ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setActiveTab('INFRASTRUCTURE'); }}
          >
            Infra ({impact.severed_bridges.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'EVACUATION' ? 'active' : ''}`}
            onClick={() => { soundEffects.playClickSound(); setActiveTab('EVACUATION'); }}
          >
            Shelters ({impact.safe_evacuation_centers.length})
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & HYDROGRAPH */}
      {activeTab === 'OVERVIEW' && (
        <>
          {/* Hydrograph Chart Panel */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Gauge size={15} style={{ color: 'var(--cyan-primary)' }} />
                <span>Breach Outflow Hydrograph</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>
                Peak: {hydrograph.peak_discharge_m3s.toLocaleString()} m³/s
              </span>
            </div>

            <div style={{ height: 140, width: '100%', marginTop: '0.4rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hydroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cyan-primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--cyan-primary)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                      borderRadius: 8,
                      fontSize: '11px',
                      boxShadow: 'var(--card-shadow)'
                    }}
                    formatter={(val: any) => [`${val.toLocaleString()} m³/s`, 'Discharge']}
                  />
                  <Area
                    type="monotone"
                    dataKey="discharge"
                    stroke="var(--cyan-primary)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#hydroGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              <span>Method: {hydrograph.empirical_method.split('+')[0]}</span>
              <span>Vol: {hydrograph.total_volume_released_mcm.toLocaleString()} MCM</span>
            </div>
          </div>

          {/* Current Timestep Dynamic KPIs */}
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Flame size={15} style={{ color: 'var(--amber-warn)' }} />
                <span>HADR Impact at T + {currentTimestep}h</span>
              </div>
            </div>

            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-val danger">
                  {curStep ? curStep.inundated_area_km2 : impact.total_inundated_area_km2}
                </div>
                <div className="kpi-label">Inundated Area (km²)</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-val warn">
                  {impact.population_at_risk.toLocaleString()}
                </div>
                <div className="kpi-label">Population at Risk</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-val">
                  {curStep ? curStep.max_depth_m : simulation.max_depth_m}m
                </div>
                <div className="kpi-label">Peak Water Depth</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-val">
                  {curStep ? curStep.max_velocity_ms : simulation.max_velocity_ms} m/s
                </div>
                <div className="kpi-label">Front Flow Velocity</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: CRITICAL INFRASTRUCTURE */}
      {activeTab === 'INFRASTRUCTURE' && (
        <div className="panel-card" style={{ flex: 1 }}>
          <div className="panel-header">
            <div className="panel-title">
              <AlertTriangle size={15} style={{ color: 'var(--red-hazard)' }} />
              <span>Severed Bridges & Lifeline Cutoffs</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.85rem' }}>
            {impact.severed_bridges.length === 0 ? (
              <div style={{ fontSize: '0.78rem', color: 'var(--emerald-safe)' }}>
                No critical road cut-offs at this stage.
              </div>
            ) : (
              impact.severed_bridges.map((br, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '0.5rem 0.65rem',
                    borderRadius: 6,
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <AlertTriangle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{br}</div>
                    <div style={{ fontSize: '0.66rem', color: '#f87171' }}>Traffic halted • High hydrodynamic drag</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ background: 'rgba(6, 11, 24, 0.6)', padding: '0.65rem', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Secondary Damage Projections
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.3rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Wheat size={13} style={{ color: '#f59e0b' }} />
                <span>Farmland Submerged:</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--cyan-primary)' }}>
                {impact.submerged_farmland_ha.toLocaleString()} ha
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Layers size={13} style={{ color: '#ef4444' }} />
                <span>Roadways Cut Off:</span>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#ef4444' }}>
                {impact.submerged_roads_km} km
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVACUATION SHELTERS */}
      {activeTab === 'EVACUATION' && (
        <div className="panel-card" style={{ flex: 1 }}>
          <div className="panel-header">
            <div className="panel-title">
              <ShieldCheck size={15} style={{ color: 'var(--emerald-safe)' }} />
              <span>Designated High-Ground Relief Hubs</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {impact.safe_evacuation_centers.map((camp) => (
              <div
                key={camp.id}
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  padding: '0.55rem 0.7rem',
                  borderRadius: 6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={13} />
                    <span>{camp.name}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  <span>Capacity: <b>{camp.capacity.toLocaleString()}</b> persons</span>
                  <span>Elevation: <b>{camp.elevation_m}m</b> MSL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
