import React, { useRef, useState } from 'react';
import {
  Play, Pause, RotateCcw, AlertTriangle, Eye, EyeOff, Clock, FolderUp, Layers,
  Activity, Gauge, Waves, Sliders, Sparkles, CircleDot, ChevronDown, ChevronUp,
  Video, ShieldAlert, ShieldCheck, Compass, Info, Zap
} from 'lucide-react';
import type { CameraViewMode, ParticleRenderMode } from './ThreeSphSimulation';
import type { SimulationResult } from '../types';
import { soundEffects } from '../services/soundEffects';

interface ThreeControlsOverlayProps {
  simTimeSec: number;
  durationMinutes: number;
  onDurationChange: (minutes: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  simSpeed: number;
  onSpeedChange: (speed: number) => void;
  onReset: () => void;
  onTriggerBreak: () => void;
  viewMode: CameraViewMode;
  onViewModeChange: (view: CameraViewMode) => void;
  showParticles: boolean;
  onToggleParticles: () => void;
  showWaterSurface: boolean;
  onToggleWaterSurface: () => void;
  particleRenderMode?: ParticleRenderMode;
  onParticleRenderModeChange?: (mode: ParticleRenderMode) => void;
  particleScale?: number;
  onParticleScaleChange?: (scale: number) => void;
  simStatus: 'PRE_BREAK' | 'BREACHING' | 'SURGING' | 'COMPLETED';
  submergedAssetsCount: number;
  waveFrontDistM: number;
  demSource?: string;
  froudeNumber?: number;
  currentDischargeM3s?: number;
  maxVelocityMs?: number;
  avgDepthM?: number;
  manningN?: number;
  onManningNChange?: (n: number) => void;
  simulation?: SimulationResult | null;
  onNotify?: (title: string, message?: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
  theme?: 'light' | 'dark';
}

export const ThreeControlsOverlay: React.FC<ThreeControlsOverlayProps> = ({
  simTimeSec,
  durationMinutes,
  onDurationChange,
  isPlaying,
  onTogglePlay,
  simSpeed,
  onSpeedChange,
  onReset,
  onTriggerBreak,
  viewMode,
  onViewModeChange,
  showParticles,
  onToggleParticles,
  showWaterSurface,
  onToggleWaterSurface,
  particleRenderMode = '3D_SPHERES',
  onParticleRenderModeChange,
  particleScale = 1.4,
  onParticleScaleChange,
  simStatus,
  submergedAssetsCount,
  waveFrontDistM,
  demSource = 'Real GeoTIFF (default.tif)',
  froudeNumber = 0,
  currentDischargeM3s = 0,
  maxVelocityMs = 0,
  avgDepthM = 0,
  manningN = 0.035,
  onManningNChange,
  simulation,
  onNotify
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab states for organized, non-cluttered layout
  const [leftTab, setLeftTab] = useState<'METRICS' | 'CAMERA' | 'SETTINGS'>('METRICS');
  const [rightTab, setRightTab] = useState<'VISUALS' | 'IMPACT'>('VISUALS');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const formatTime = (totalSec: number) => {
    const isNegative = totalSec < 0;
    const absSec = Math.abs(Math.round(totalSec));
    const m = Math.floor(absSec / 60);
    const s = absSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    if (isNegative) {
      return `T - ${pad(m)}:${pad(s)} (Pre-Break)`;
    }
    return `T + ${pad(m)}:${pad(s)} (Flood Active)`;
  };

  const getStatusBadge = () => {
    switch (simStatus) {
      case 'PRE_BREAK':
        return { text: 'RESERVOIR INTACT', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
      case 'BREACHING':
        return { text: 'BREACH IN PROGRESS', color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' };
      case 'SURGING':
        return { text: 'FLOOD WATER SURGING', color: '#e11d48', bg: 'rgba(225, 29, 72, 0.15)' };
      case 'COMPLETED':
        return { text: 'SIMULATION COMPLETE', color: '#059669', bg: 'rgba(5, 150, 105, 0.15)' };
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      if ((window as any).__loadCustomDemTif) {
        (window as any).__loadCustomDemTif(buffer, file.name);
        soundEffects.playChimeSound();
        onNotify?.('GeoTIFF Loaded', file.name, 'success');
      }
    } catch (err) {
      console.error('Failed to load GeoTIFF:', err);
      onNotify?.('Upload Failed', 'Invalid or unreadable GeoTIFF file', 'danger');
    }
  };

  const handleTriggerDamBreak = () => {
    soundEffects.playAlarmSound();
    onTriggerBreak();
    onNotify?.('Dam Break Triggered!', 'Catastrophic breach initiated. Flood wave spreading downstream.', 'danger');
  };

  const handleTogglePlay = () => {
    soundEffects.playClickSound();
    if (!isPlaying) {
      soundEffects.startWaterAmbience();
    } else {
      soundEffects.stopWaterAmbience();
    }
    onTogglePlay();
  };

  const handleReset = () => {
    soundEffects.playChimeSound();
    soundEffects.stopWaterAmbience();
    onReset();
    onNotify?.('Simulation Reset', 'Returned to Pre-Break reservoir state (T - 30s)', 'info');
  };

  const handleCameraSelect = (mode: CameraViewMode) => {
    soundEffects.playClickSound();
    onViewModeChange(mode);
    const names: Record<CameraViewMode, string> = {
      AERIAL: 'Valley Overview',
      DAM_CREST: 'Dam Crest Overlook',
      DOWNSTREAM_BRIDGE: 'Gorge River Bridge',
      FOLLOW_WAVE: 'Follow Flood Wave'
    };
    onNotify?.('Camera View Changed', names[mode], 'info');
  };

  const badge = getStatusBadge();
  const dischargePercent = Math.min(100, Math.round((currentDischargeM3s / 16000) * 100));

  return (
    <>
      {/* Friendly Floating Tip & Zen Mode Toggle at Top Center */}
      <div
        style={{
          position: 'absolute',
          top: '0.9rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        <div
          style={{
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '20px',
            padding: '0.35rem 0.95rem',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <Info size={13} style={{ color: 'var(--cyan-primary)' }} />
          <span>Click <b>"Trigger Dam Break"</b> below to unleash the flood wave!</span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClickSound();
            setIsZenMode(!isZenMode);
          }}
          className="btn btn-secondary zen-toggle-btn"
          title={isZenMode ? 'Show Controls (Press H)' : 'Clean Screen View (Press H)'}
          style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '20px',
            fontSize: '0.74rem',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          {isZenMode ? <Eye size={13} style={{ color: 'var(--cyan-primary)' }} /> : <EyeOff size={13} />}
          <span>{isZenMode ? 'Show Controls (H)' : 'Clean View (H)'}</span>
        </button>
      </div>

      {/* If Zen Mode is active, hide the HUD overlays */}
      {!isZenMode && (
        <>
          {/* Top Left Tactical Deck */}
          <div
            className={`tactical-deck tactical-deck-left ${isLeftCollapsed ? 'collapsed' : ''}`}
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              width: 325,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div className="hud-panel" style={{ padding: '0.9rem', overflow: 'hidden' }}>
              {/* Deck Header & Digital Clock */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Clock size={17} style={{ color: 'var(--cyan-primary)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: simTimeSec < 0 ? 'var(--cyan-primary)' : 'var(--red-hazard)'
                    }}
                  >
                    {formatTime(simTimeSec)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 4,
                      color: badge.color,
                      background: badge.bg,
                      border: `1px solid ${badge.color}`
                    }}
                  >
                    {badge.text}
                  </span>
                  <button
                    className="btn-icon"
                    style={{ width: 24, height: 24, padding: 0 }}
                    onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                    title={isLeftCollapsed ? 'Expand Deck' : 'Collapse Deck'}
                  >
                    {isLeftCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>

              {!isLeftCollapsed && (
                <>
                  {/* Segmented Tab Navigation */}
                  <div className="segmented-tabs" style={{ marginBottom: '0.75rem' }}>
                    <button
                      type="button"
                      className={`tab-btn ${leftTab === 'METRICS' ? 'active' : ''}`}
                      onClick={() => { soundEffects.playClickSound(); setLeftTab('METRICS'); }}
                    >
                      <Activity size={12} />
                      <span>Live Metrics</span>
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${leftTab === 'CAMERA' ? 'active' : ''}`}
                      onClick={() => { soundEffects.playClickSound(); setLeftTab('CAMERA'); }}
                    >
                      <Video size={12} />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      className={`tab-btn ${leftTab === 'SETTINGS' ? 'active' : ''}`}
                      onClick={() => { soundEffects.playClickSound(); setLeftTab('SETTINGS'); }}
                    >
                      <Sliders size={12} />
                      <span>Terrain & Physics</span>
                    </button>
                  </div>

                  {/* TAB 1: LIVE METRICS */}
                  {leftTab === 'METRICS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {/* Discharge Gauge with Fill Bar */}
                      <div className="meta-item" style={{ padding: '0.6rem 0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                          <span className="meta-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', margin: 0 }}>
                            <Gauge size={13} />
                            <span>Water Flow Rate (Q)</span>
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--cyan-primary)' }}>
                            {currentDischargeM3s > 0 ? `${currentDischargeM3s.toLocaleString()} m³/s` : '0 m³/s (Intact)'}
                          </span>
                        </div>
                        <div style={{ height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${dischargePercent}%`,
                              background: 'linear-gradient(90deg, #0284c7, #e11d48)',
                              transition: 'width 0.2s ease'
                            }}
                          />
                        </div>
                      </div>

                      {/* Friendly Metrics Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                        <div className="meta-item">
                          <div className="meta-label">Water Speed</div>
                          <div className="meta-val" style={{ color: maxVelocityMs > 8 ? 'var(--red-hazard)' : 'var(--cyan-primary)' }}>
                            {maxVelocityMs > 0 ? `${maxVelocityMs} m/s` : '0.0 m/s'}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {maxVelocityMs > 10 ? '⚡ Rapid Surge' : 'Gentle Flow'}
                          </span>
                        </div>

                        <div className="meta-item">
                          <div className="meta-label">Flood Depth</div>
                          <div className="meta-val" style={{ color: 'var(--blue-primary)' }}>
                            {avgDepthM > 0 ? `${avgDepthM} m` : '0.0 m'}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Gorge channel depth</span>
                        </div>

                        <div className="meta-item">
                          <div className="meta-label">Wave Distance</div>
                          <div className="meta-val">
                            {waveFrontDistM > 0 ? `${waveFrontDistM} m` : 'At Dam Toe'}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Downstream distance</span>
                        </div>

                        <div className="meta-item">
                          <div className="meta-label">Flow Type</div>
                          <div className="meta-val" style={{ color: froudeNumber > 1 ? 'var(--amber-warn)' : 'var(--cyan-primary)' }}>
                            {froudeNumber > 1 ? 'Supercritical' : 'Subcritical'}
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            Fr = {froudeNumber > 0 ? froudeNumber.toFixed(2) : '0.00'}
                          </span>
                        </div>
                      </div>

                      {/* Submerged Assets Alert Banner */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          background: submergedAssetsCount > 0 ? 'rgba(225, 29, 72, 0.08)' : 'rgba(5, 150, 105, 0.08)',
                          border: `1px solid ${submergedAssetsCount > 0 ? 'rgba(225, 29, 72, 0.25)' : 'rgba(5, 150, 105, 0.25)'}`
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', color: submergedAssetsCount > 0 ? 'var(--red-hazard)' : 'var(--emerald-safe)', fontWeight: 600 }}>
                          <ShieldAlert size={15} />
                          <span>Key Structures Flooded:</span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.85rem', color: submergedAssetsCount > 0 ? 'var(--red-hazard)' : 'var(--emerald-safe)' }}>
                          {submergedAssetsCount} / 5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CAMERA VIEWPOINTS */}
                  {leftTab === 'CAMERA' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        Click a camera view to jump directly into action:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className={`btn ${viewMode === 'AERIAL' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.55rem 0.5rem', justifyContent: 'center' }}
                          onClick={() => handleCameraSelect('AERIAL')}
                        >
                          🦅 Valley Overview
                        </button>
                        <button
                          type="button"
                          className={`btn ${viewMode === 'DAM_CREST' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.55rem 0.5rem', justifyContent: 'center' }}
                          onClick={() => handleCameraSelect('DAM_CREST')}
                        >
                          🌊 Dam Crest
                        </button>
                        <button
                          type="button"
                          className={`btn ${viewMode === 'DOWNSTREAM_BRIDGE' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.55rem 0.5rem', justifyContent: 'center' }}
                          onClick={() => handleCameraSelect('DOWNSTREAM_BRIDGE')}
                        >
                          🌉 River Bridge
                        </button>
                        <button
                          type="button"
                          className={`btn ${viewMode === 'FOLLOW_WAVE' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.75rem', padding: '0.55rem 0.5rem', justifyContent: 'center' }}
                          onClick={() => handleCameraSelect('FOLLOW_WAVE')}
                        >
                          💧 Follow Wave
                        </button>
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem', padding: '0.4rem', background: 'var(--bg-surface-elevated)', borderRadius: 6 }}>
                        <Compass size={13} style={{ color: 'var(--cyan-primary)' }} />
                        <span>Use Left Click to rotate, Right Click to pan, Scroll to zoom.</span>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SETTINGS (PHYSICS & DEM) */}
                  {leftTab === 'SETTINGS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* DEM Source Info & Upload */}
                      <div style={{
                        background: 'var(--bg-surface-elevated)',
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--cyan-primary)', fontWeight: 600 }}>
                            <Layers size={13} />
                            <span>Terrain: {demSource}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '0.35rem 0.6rem', width: '100%', justifyContent: 'center' }}
                          title="Upload custom GeoTIFF DEM file"
                        >
                          <FolderUp size={13} />
                          <span>Upload Custom GeoTIFF .TIF</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".tif,.tiff"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                      </div>

                      {/* Manning Bed Roughness Resistance Slider */}
                      {onManningNChange && (
                        <div style={{
                          background: 'var(--bg-surface-elevated)',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                              <Sliders size={12} />
                              <span>Riverbed Friction (n):</span>
                            </span>
                            <span style={{ color: 'var(--cyan-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              {manningN.toFixed(3)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.020"
                            max="0.060"
                            step="0.005"
                            value={manningN}
                            onChange={(e) => onManningNChange(parseFloat(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--cyan-primary)', marginBottom: '0.45rem' }}
                          />
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.65rem', padding: '0.2rem 0.3rem', justifyContent: 'center' }}
                              onClick={() => onManningNChange(0.020)}
                            >
                              Smooth
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.65rem', padding: '0.2rem 0.3rem', justifyContent: 'center' }}
                              onClick={() => onManningNChange(0.035)}
                            >
                              Normal River
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ fontSize: '0.65rem', padding: '0.2rem 0.3rem', justifyContent: 'center' }}
                              onClick={() => onManningNChange(0.060)}
                            >
                              Rocky Gorge
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Top Right Deck: Visuals & Live HADR Impact Drawer */}
          <div
            className={`tactical-deck tactical-deck-right ${isRightCollapsed ? 'collapsed' : ''}`}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              width: 315,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div className="hud-panel" style={{ padding: '0.9rem' }}>
              {/* Deck Header & Tab Nav */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <div className="segmented-tabs" style={{ flex: 1, marginRight: '0.5rem' }}>
                  <button
                    type="button"
                    className={`tab-btn ${rightTab === 'VISUALS' ? 'active' : ''}`}
                    onClick={() => { soundEffects.playClickSound(); setRightTab('VISUALS'); }}
                  >
                    <Sparkles size={12} />
                    <span>Visuals & Time</span>
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${rightTab === 'IMPACT' ? 'active' : ''}`}
                    onClick={() => { soundEffects.playClickSound(); setRightTab('IMPACT'); }}
                  >
                    <ShieldAlert size={12} />
                    <span>Flood Impact</span>
                  </button>
                </div>

                <button
                  className="btn-icon"
                  style={{ width: 24, height: 24, padding: 0 }}
                  onClick={() => setIsRightCollapsed(!isRightCollapsed)}
                  title={isRightCollapsed ? 'Expand Deck' : 'Collapse Deck'}
                >
                  {isRightCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
              </div>

              {!isRightCollapsed && (
                <>
                  {/* TAB 1: VISUALS & DURATION */}
                  {rightTab === 'VISUALS' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {/* Render Mode Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Water Look:</span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            type="button"
                            className={`btn ${particleRenderMode === '3D_SPHERES' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => {
                              soundEffects.playClickSound();
                              onParticleRenderModeChange && onParticleRenderModeChange('3D_SPHERES');
                            }}
                          >
                            <CircleDot size={12} />
                            <span>3D Droplets</span>
                          </button>
                          <button
                            type="button"
                            className={`btn ${particleRenderMode === 'POINT_BEADS' ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                            onClick={() => {
                              soundEffects.playClickSound();
                              onParticleRenderModeChange && onParticleRenderModeChange('POINT_BEADS');
                            }}
                          >
                            <Waves size={12} />
                            <span>Beads</span>
                          </button>
                        </div>
                      </div>

                      {/* Droplet Scale Slider */}
                      {onParticleScaleChange && (
                        <div style={{
                          background: 'var(--bg-surface-elevated)',
                          padding: '0.5rem 0.65rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Droplet Bead Size:</span>
                            <span style={{ color: 'var(--cyan-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                              {particleScale.toFixed(1)}x
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="2.5"
                            step="0.1"
                            value={particleScale}
                            onChange={(e) => onParticleScaleChange(parseFloat(e.target.value))}
                            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--cyan-primary)' }}
                          />
                        </div>
                      )}

                      {/* Layer Visibility Toggles */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem' }}>
                        <div
                          className={`toggle-item ${showParticles ? 'active' : ''}`}
                          style={{ flex: 1 }}
                          onClick={() => {
                            soundEffects.playClickSound();
                            onToggleParticles();
                          }}
                        >
                          <span style={{ fontSize: '0.7rem' }}>Water Particles</span>
                          {showParticles ? <Eye size={13} /> : <EyeOff size={13} />}
                        </div>
                        <div
                          className={`toggle-item ${showWaterSurface ? 'active' : ''}`}
                          style={{ flex: 1 }}
                          onClick={() => {
                            soundEffects.playClickSound();
                            onToggleWaterSurface();
                          }}
                        >
                          <span style={{ fontSize: '0.7rem' }}>Water Surface</span>
                          {showWaterSurface ? <Eye size={13} /> : <EyeOff size={13} />}
                        </div>
                      </div>

                      {/* Duration Presets */}
                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.55rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                          Simulate Flood Until:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.3rem', marginBottom: '0.45rem' }}>
                          {[10, 30, 60, 120].map((m) => (
                            <button
                              key={m}
                              type="button"
                              className={`btn ${durationMinutes === m ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ fontSize: '0.7rem', padding: '0.3rem 0.2rem', justifyContent: 'center' }}
                              onClick={() => {
                                soundEffects.playClickSound();
                                onDurationChange(m);
                              }}
                            >
                              {m < 60 ? `${m}m` : `${m / 60}h`}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Custom:</span>
                          <input
                            type="number"
                            min="1"
                            max="360"
                            value={durationMinutes}
                            onChange={(e) => onDurationChange(Math.max(1, parseInt(e.target.value) || 10))}
                            className="form-input"
                            style={{ width: '70px', padding: '0.25rem 0.4rem', fontSize: '0.76rem', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>minutes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LIVE DISASTER IMPACT */}
                  {rightTab === 'IMPACT' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      {simulation ? (
                        <>
                          <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                            <div className="meta-item" style={{ padding: '0.55rem', textAlign: 'center' }}>
                              <div className="meta-label">People at Risk</div>
                              <div style={{ color: 'var(--amber-warn)', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem' }}>
                                {simulation.impact.population_at_risk.toLocaleString()}
                              </div>
                            </div>
                            <div className="meta-item" style={{ padding: '0.55rem', textAlign: 'center' }}>
                              <div className="meta-label">Flooded Land</div>
                              <div style={{ color: 'var(--red-hazard)', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1.05rem' }}>
                                {simulation.impact.total_inundated_area_km2} km²
                              </div>
                            </div>
                          </div>

                          <div className="meta-item" style={{ padding: '0.55rem' }}>
                            <div className="meta-label">Blocked / Submerged Bridges:</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.3rem' }}>
                              {simulation.impact.severed_bridges.map((bridge, idx) => (
                                <div key={idx} style={{ fontSize: '0.72rem', color: 'var(--red-hazard)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <AlertTriangle size={12} style={{ color: 'var(--red-hazard)' }} />
                                  <span>{bridge}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="meta-item" style={{ padding: '0.55rem' }}>
                            <div className="meta-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--emerald-safe)' }}>
                              <ShieldCheck size={13} />
                              <span>High-Ground Safe Havens:</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                              <b>{simulation.impact.safe_evacuation_centers.length} shelters</b> operational with medical relief
                            </div>
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.2rem 0' }}>
                          Hydrodynamic impact model active. Inundation metrics streaming live.
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bottom Floating Command Bar */}
      <div
        className="bottom-command-bar"
        style={{
          position: 'absolute',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '35px',
          padding: '0.5rem 1.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          boxShadow: 'var(--elevated-shadow)'
        }}
      >
        <button
          className="btn-icon"
          onClick={handleReset}
          title="Reset Simulation to Beginning (T - 30s)"
        >
          <RotateCcw size={16} />
        </button>

        {/* Play/Pause Button */}
        <button
          className="btn"
          style={{
            borderRadius: '25px',
            padding: '0.5rem 1.15rem',
            background: 'linear-gradient(135deg, var(--cyan-primary), #0369a1)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: isPlaying ? '0 2px 10px var(--cyan-glow)' : 'none'
          }}
          onClick={handleTogglePlay}
          title={isPlaying ? 'Pause Simulation (Space)' : 'Play Simulation (Space)'}
        >
          {isPlaying ? <Pause size={17} /> : <Play size={17} />}
          <span>{isPlaying ? 'Pause' : 'Play Flow'}</span>
        </button>

        {/* Big Emergency Trigger Dam Break Button */}
        <button
          className="btn emergency-breach-btn"
          style={{
            background: 'linear-gradient(135deg, #e11d48, #be123c)',
            color: '#ffffff',
            boxShadow: '0 2px 12px rgba(225, 29, 72, 0.45)',
            fontSize: '0.82rem',
            padding: '0.52rem 1.25rem',
            borderRadius: '25px'
          }}
          onClick={handleTriggerDamBreak}
          title="Trigger Dam Collapse (T=0)"
        >
          <Zap size={16} />
          <span>TRIGGER DAM BREAK (T=0)</span>
        </button>

        {/* Speed Multiplier Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginLeft: '0.2rem' }}>
          {[1, 5, 15, 30].map((s) => (
            <button
              key={s}
              className="btn-icon"
              style={{
                width: 32,
                height: 32,
                fontSize: '0.72rem',
                fontWeight: 700,
                borderColor: simSpeed === s ? 'var(--cyan-primary)' : undefined,
                color: simSpeed === s ? 'var(--cyan-primary)' : undefined,
                background: simSpeed === s ? 'rgba(2, 132, 199, 0.12)' : undefined
              }}
              onClick={() => {
                soundEffects.playClickSound();
                onSpeedChange(s);
              }}
              title={`Simulation Speed: ${s}x`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
