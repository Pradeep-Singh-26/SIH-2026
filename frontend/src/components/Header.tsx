import React, { useState, useEffect } from 'react';
import {
  Box, Map, Download, Volume2, VolumeX, Maximize, Minimize,
  HelpCircle, Sun, Moon, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface HeaderProps {
  mode: string;
  isDemoData: boolean;
  activeView: '3D_SIMULATION' | '2D_GIS';
  onViewChange: (view: '3D_SIMULATION' | '2D_GIS') => void;
  onOpenComparison?: () => void;
  onOpenGee?: () => void;
  onOpenExport: () => void;
  onOpenGuide: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode: _mode,
  isDemoData,
  activeView,
  onViewChange,
  onOpenExport,
  onOpenGuide,
  theme = 'light',
  onToggleTheme,
  isDrawerOpen,
  onToggleDrawer
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
      {/* Left: Clean Brand & Panel Toggle */}
      <div className="brand-section">
        {onToggleDrawer && (
          <button
            className="btn-icon rail-panel-trigger"
            onClick={() => {
              soundEffects.playClickSound();
              onToggleDrawer();
            }}
            title={isDrawerOpen ? 'Close Side Panel (Expands Map)' : 'Open Side Panel'}
            aria-label="Toggle Side Panel"
          >
            {isDrawerOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        )}

        <img
          src="/logo.png"
          alt="Hydro-Breach Logo"
          style={{
            height: '40px',
            width: 'auto',
            maxHeight: '40px',
            objectFit: 'contain',
            display: 'block',
            userSelect: 'none'
          }}
        />
        <div className="brand-text-container">
          <div className="brand-title">HYDRO-BREACH</div>
          <div className="brand-subtitle">
            <span className="brand-subtitle-text">2D/3D Hydrodynamic Platform</span>
            <span className="badge-sih">SIH26161</span>
          </div>
        </div>
      </div>

      {/* Center: Spacious View Switcher Pill */}
      <div className="view-switcher-pill">
        <button
          className={`view-pill-btn ${activeView === '2D_GIS' ? 'active' : ''}`}
          onClick={() => {
            soundEffects.playClickSound();
            onViewChange('2D_GIS');
          }}
        >
          <Map size={16} />
          <span>2D Tactical GIS</span>
        </button>

        <button
          className={`view-pill-btn ${activeView === '3D_SIMULATION' ? 'active' : ''}`}
          onClick={() => {
            soundEffects.playClickSound();
            onViewChange('3D_SIMULATION');
          }}
        >
          <Box size={16} />
          <span>3D Fluid Shock</span>
        </button>
      </div>

      {/* Right: Status Pill, Primary Action & Compact Utility Group */}
      <div className="nav-actions">
        {/* Mode Indicator Badge */}
        <div className={`mode-badge ${isDemoData ? 'mock' : 'real'}`}>
          <span className="status-dot"></span>
          <span>{isDemoData ? 'SPH ENGINE READY' : 'DELFT3D CONNECTED'}</span>
        </div>

        {/* Primary Export Button */}
        <button
          className="btn btn-primary"
          onClick={() => {
            soundEffects.playClickSound();
            onOpenExport();
          }}
          title="Export simulation layers in SHP / KML / GeoJSON"
        >
          <Download size={15} />
          <span>Export GIS</span>
        </button>

        <div className="nav-utility-group">
          {/* Light / Dark Mode Toggle Button */}
          {onToggleTheme && (
            <button
              className="btn-icon"
              onClick={() => {
                soundEffects.playClickSound();
                onToggleTheme();
              }}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} style={{ color: '#f59e0b' }} />}
            </button>
          )}

          {/* Audio Mute Toggle */}
          <button
            className="btn-icon"
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Audio & Sirens' : 'Mute Audio & Sirens'}
            aria-label="Toggle Sound"
            style={{ color: isMuted ? 'var(--text-muted)' : 'var(--cyan-primary)' }}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            className="btn-icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* System Guide / Quick Specs Modal */}
          <button
            className="btn-icon"
            onClick={() => {
              soundEffects.playClickSound();
              onOpenGuide();
            }}
            title="System Architecture & User Guide"
            aria-label="System Guide"
          >
            <HelpCircle size={16} style={{ color: 'var(--cyan-primary)' }} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
