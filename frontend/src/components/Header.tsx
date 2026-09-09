import React, { useState, useEffect } from 'react';
import {
  Box, Map, SplitSquareVertical, Satellite, Download,
  Volume2, VolumeX, Maximize, Minimize, HelpCircle, Sun, Moon
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface HeaderProps {
  mode: string;
  isDemoData: boolean;
  activeView: '3D_SIMULATION' | '2D_GIS';
  onViewChange: (view: '3D_SIMULATION' | '2D_GIS') => void;
  onOpenComparison: () => void;
  onOpenGee: () => void;
  onOpenExport: () => void;
  onOpenGuide: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode: _mode,
  isDemoData,
  activeView,
  onViewChange,
  onOpenComparison,
  onOpenGee,
  onOpenExport,
  onOpenGuide,
  theme = 'light',
  onToggleTheme
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.isMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    soundEffects.playClickSound();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen errors
    }
  };

  const handleToggleMute = () => {
    const next = soundEffects.toggleMute();
    setIsMuted(next);
    if (!next) {
      soundEffects.playClickSound();
    }
  };

  return (
    <header className="navbar">
      <div className="brand-section">
        <img
          src="/logo.png"
          alt="Hydro-Breach Logo"
          style={{
            height: '44px',
            width: 'auto',
            maxHeight: '44px',
            objectFit: 'contain',
            display: 'block',
            userSelect: 'none'
          }}
        />
        <div>
          <div className="brand-title">HYDRO-BREACH SIMULATOR</div>
          <div className="brand-subtitle">
            <span>3D SPH Fluid & 2D Delft3D-FM Platform</span>
            <span className="badge-sih">SIH26161</span>
          </div>
        </div>
      </div>

      {/* View Switcher: 3D SPH Fluid vs 2D Tactical GIS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface-elevated)',
          padding: '0.22rem',
          borderRadius: '30px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
        }}
      >
        <button
          className={`btn ${activeView === '3D_SIMULATION' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '0.42rem 1.05rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            boxShadow: activeView === '3D_SIMULATION' ? '0 2px 10px var(--cyan-glow)' : 'none'
          }}
          onClick={() => {
            soundEffects.playClickSound();
            onViewChange('3D_SIMULATION');
          }}
        >
          <Box size={15} />
          <span>3D Water Flow</span>
        </button>

        <button
          className={`btn ${activeView === '2D_GIS' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '0.42rem 1.05rem',
            borderRadius: '20px',
            fontSize: '0.8rem',
            boxShadow: activeView === '2D_GIS' ? '0 2px 10px var(--cyan-glow)' : 'none'
          }}
          onClick={() => {
            soundEffects.playClickSound();
            onViewChange('2D_GIS');
          }}
        >
          <Map size={15} />
          <span>2D Flood Map</span>
        </button>
      </div>

      <div className="nav-actions">
        {/* Mode Indicator Badge */}
        <div className={`mode-badge ${isDemoData ? 'mock' : 'real'}`}>
          <span className="status-dot"></span>
          <span>{isDemoData ? 'SPH ENGINE READY' : 'DELFT3D CONNECTED'}</span>
        </div>

        <button
          className="btn btn-sph"
          onClick={() => { soundEffects.playClickSound(); onOpenComparison(); }}
          title="Compare Delft3D vs SPH hydrodynamic results"
        >
          <SplitSquareVertical size={16} />
          <span>Model Comparison</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => { soundEffects.playClickSound(); onOpenGee(); }}
          title="Near real-time open-source Sentinel-1 SAR framework"
        >
          <Satellite size={16} />
          <span>Sentinel-1 SAR</span>
        </button>

        <button
          className="btn btn-primary"
          onClick={() => { soundEffects.playClickSound(); onOpenExport(); }}
          title="Export simulation layers in SHP / KML / GeoJSON"
        >
          <Download size={16} />
          <span>Export GIS</span>
        </button>

        {/* Light / Dark Mode Toggle Button */}
        {onToggleTheme && (
          <button
            className="btn-icon"
            onClick={() => { soundEffects.playClickSound(); onToggleTheme(); }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} style={{ color: '#f59e0b' }} />}
          </button>
        )}

        {/* Audio Mute Toggle */}
        <button
          className="btn-icon"
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Audio & Sirens (Press M)' : 'Mute Audio & Sirens (Press M)'}
          style={{ color: isMuted ? 'var(--text-muted)' : 'var(--cyan-primary)' }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          className="btn-icon"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        {/* System Guide / Quick Specs Modal */}
        <button
          className="btn-icon"
          onClick={() => { soundEffects.playClickSound(); onOpenGuide(); }}
          title="System Architecture & User Guide"
        >
          <HelpCircle size={16} style={{ color: 'var(--cyan-primary)' }} />
        </button>
      </div>
    </header>
  );
};
