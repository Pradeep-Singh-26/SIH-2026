import React, { useState } from 'react';
import {
  Play, Database, ChevronLeft, ChevronRight, Zap, RefreshCw,
  Sliders, Check
} from 'lucide-react';
import type { DamInfo, BreachParameters, EngineType, BreachMode } from '../types';
import { soundEffects } from '../services/soundEffects';

interface ScenarioPanelProps {
  dam: DamInfo | null;
  isRunning: boolean;
  onRunSimulation: (engine: EngineType, scenarioName: string, params: BreachParameters) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface PresetOption {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  engine: EngineType;
  mode: BreachMode;
  topWidth: number;
  formationTime: number;
  waterLevel: number;
  manningN: number;
}

const PRESETS: PresetOption[] = [
  {
    id: 'pmf',
    name: 'Monsoon Overtopping',
    icon: '🌊',
    subtitle: 'Worst-case monsoon rain overflowing crest',
    engine: 'DELFT3D_FM',
    mode: 'OVERTOPPING',
    topWidth: 180.0,
    formationTime: 2.0,
    waterLevel: 662.9,
    manningN: 0.035
  },
  {
    id: 'piping',
    name: 'Foundation Piping Leak',
    icon: '💧',
    subtitle: 'Internal seepage hole rapidly eroding',
    engine: 'DELFT3D_FM',
    mode: 'PIPING',
    topWidth: 130.0,
    formationTime: 1.5,
    waterLevel: 658.0,
    manningN: 0.035
  },
  {
    id: 'collapse',
    name: 'Sudden Wall Failure',
    icon: '⚡',
    subtitle: 'Catastrophic rapid structure breach',
    engine: 'SPH',
    mode: 'OVERTOPPING',
    topWidth: 220.0,
    formationTime: 1.0,
    waterLevel: 662.5,
    manningN: 0.040
  },
  {
    id: 'spillway',
    name: 'Emergency Spillway Overload',
    icon: '🌧️',
    subtitle: 'Extreme reservoir inflow over chutes',
    engine: 'DELFT3D_FM',
    mode: 'OVERTOPPING',
    topWidth: 90.0,
    formationTime: 3.5,
    waterLevel: 654.0,
    manningN: 0.030
  }
];

export const ScenarioPanel: React.FC<ScenarioPanelProps> = ({
  dam,
  isRunning,
  onRunSimulation,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pmf');
  const [engine, setEngine] = useState<EngineType>('DELFT3D_FM');
  const [scenarioName, setScenarioName] = useState<string>('Hidkal Monsoon Overtopping');
  const [failureMode, setFailureMode] = useState<BreachMode>('OVERTOPPING');
  const [topWidth, setTopWidth] = useState<number>(180.0);
  const [formationTime, setFormationTime] = useState<number>(2.0);
  const [waterLevel, setWaterLevel] = useState<number>(662.9);
  const [manningN, setManningN] = useState<number>(0.035);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const applyPreset = (p: PresetOption) => {
    soundEffects.playClickSound();
    setSelectedPresetId(p.id);
    setEngine(p.engine);
    setFailureMode(p.mode);
    setTopWidth(p.topWidth);
    setFormationTime(p.formationTime);
    setWaterLevel(p.waterLevel);
    setManningN(p.manningN);
    setScenarioName(`Hidkal ${p.name}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playAlarmSound();
    const params: BreachParameters = {
      failure_mode: failureMode,
      initial_water_level_m: waterLevel,
      breach_bottom_elevation_m: 615.0,
      breach_top_width_m: topWidth,
      breach_bottom_width_m: topWidth * 0.5,
      breach_formation_time_hr: formationTime,
      side_slope_z: 1.0,
      manning_roughness_n: manningN,
      simulation_duration_hr: 8.0,
      time_step_min: 15.0
    };
    onRunSimulation(engine, scenarioName, params);
  };

  if (isCollapsed) {
    return (
      <div
        className="sidebar-collapsed"
        style={{
          width: 48,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border-subtle)',
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
          title="Expand Scenario Setup"
        >
          <ChevronRight size={18} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 700
          }}
        >
          Dam & Scenarios
        </div>
      </div>
    );
  }

  return (
    <aside className="sidebar">
      {/* Dam Information Card */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <Database size={16} style={{ color: 'var(--cyan-primary)' }} />
            <span>Study Reservoir</span>
          </div>
          {onToggleCollapse && (
            <button
              className="btn-icon"
              style={{ width: 26, height: 26, padding: 0 }}
              onClick={() => { soundEffects.playClickSound(); onToggleCollapse(); }}
              title="Collapse Panel"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
          {dam ? dam.name : 'Hidkal Dam (Raja Lakhamgouda)'}
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
          {dam?.river || 'Ghataprabha River'} • {dam?.basin || 'Krishna Basin, Karnataka'}
        </div>

        <div className="dam-meta-grid">
          <div className="meta-item">
            <div className="meta-label">Crest Height</div>
            <div className="meta-val">{dam?.crest_elev_m || 662.9} m MSL</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Reservoir Volume</div>
            <div className="meta-val">{dam?.reservoir_capacity_mcm || 1448} MCM</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Dam Wall Height</div>
            <div className="meta-val">{dam?.height_m || 53.3} m</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Spillway Capacity</div>
            <div className="meta-val">3,230 m³/s</div>
          </div>
        </div>
      </div>

      {/* 1-Click Scenario Preset Cards */}
      <div className="panel-card tour-breach-conditions">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.55rem' }}>
          <div className="panel-title" style={{ fontSize: '0.82rem' }}>
            <Zap size={15} style={{ color: 'var(--amber-warn)' }} />
            <span>Select Flood Scenario</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--cyan-primary)', fontWeight: 700 }}>
            1-Click Setup
          </span>
        </div>

        <div className="preset-card-grid">
          {PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <div
                key={p.id}
                className={`preset-card ${isSelected ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                  {isSelected && (
                    <span style={{ background: 'var(--cyan-primary)', color: '#ffffff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: '0.2rem' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {p.subtitle}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Submission & Advanced Settings */}
      <form onSubmit={handleSubmit} className="panel-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Active Scenario: <span style={{ color: 'var(--cyan-primary)' }}>{scenarioName}</span>
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ fontSize: '0.68rem', padding: '0.2rem 0.45rem' }}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Sliders size={12} />
            <span>{showAdvanced ? 'Hide Tweak' : 'Tweak'}</span>
          </button>
        </div>

        {/* Advanced Accordion for Detailed Parameters */}
        {showAdvanced && (
          <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">
                <span>Hydrodynamic Solver</span>
              </label>
              <select
                className="form-select"
                value={engine}
                onChange={(e) => setEngine(e.target.value as EngineType)}
              >
                <option value="DELFT3D_FM">Delft3D FM (2D Shallow Water Equations)</option>
                <option value="SPH">SPH (Smoothed Particle Hydrodynamics)</option>
              </select>
            </div>

            <div className="form-group">
              <div className="form-label">
                <span>Breach Opening Width</span>
                <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{topWidth} m</span>
              </div>
              <input
                type="range"
                min="60"
                max="300"
                step="10"
                value={topWidth}
                onChange={(e) => setTopWidth(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>

            <div className="form-group">
              <div className="form-label">
                <span>Formation Time</span>
                <span style={{ color: 'var(--cyan-primary)', fontFamily: 'var(--font-mono)' }}>{formationTime} hrs</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={formationTime}
                onChange={(e) => setFormationTime(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan-primary)' }}
              />
            </div>
          </div>
        )}

        {/* Big Action Run Button */}
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            marginTop: 'auto',
            padding: '0.8rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)'
          }}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <RefreshCw className="animate-spin" size={18} />
              <span>Simulating Flood Wave...</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>Run Hydrodynamic Model</span>
            </>
          )}
        </button>
      </form>
    </aside>
  );
};
