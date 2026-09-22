import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Map, Download, Volume2, VolumeX, Maximize, Minimize,
  HelpCircle, Sun, Moon, PanelLeftClose, PanelLeftOpen,
  LogIn, LogOut, ChevronDown, ShieldCheck, Compass, MessageCircleQuestion
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import type { User } from '../types';

interface HeaderProps {
  mode: string;
  isDemoData: boolean;
  activeView: '3D_SIMULATION' | '2D_GIS';
  onViewChange: (view: '3D_SIMULATION' | '2D_GIS') => void;
  onOpenComparison?: () => void;
  onOpenGee?: () => void;
  onOpenExport: () => void;
  onOpenGuide: () => void;
  onOpenTour?: () => void;
  onOpenFaq?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isDrawerOpen?: boolean;
  onToggleDrawer?: () => void;
  // Auth props
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode: _mode,
  isDemoData,
  activeView,
  onViewChange,
  onOpenExport,
  onOpenGuide,
  onOpenTour,
  onOpenFaq,
  theme = 'light',
  onToggleTheme,
  isDrawerOpen,
  onToggleDrawer,
  user,
  onOpenAuth,
  onLogout
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.isMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAgencyAcronym = (agencyName: string) => {
    if (agencyName.includes('NDMA')) return 'NDMA';
    if (agencyName.includes('CWC')) return 'CWC';
    if (agencyName.includes('SDMA')) return 'SDMA';
    if (agencyName.includes('IMD')) return 'IMD';
    return 'HYDRO';
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
      <div className="view-switcher-pill tour-view-switcher">
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

      {/* Right: Status Pill, Primary Action & User Profile Group */}
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

        {/* User Identity / Authentication Control */}
        {user ? (
          <div className="user-profile-widget" ref={userMenuRef}>
            <button
              className="user-profile-btn"
              onClick={() => {
                soundEffects.playClickSound();
                setIsUserMenuOpen(!isUserMenuOpen);
              }}
              title="User Profile & Atlas Status"
            >
              <div className="user-avatar-circle">{getInitials(user.full_name)}</div>
              <div className="user-info-brief">
                <span className="user-name-label">{user.full_name.split(' ')[0]}</span>
                <span className="user-agency-tag">{getAgencyAcronym(user.agency)}</span>
              </div>
              <ChevronDown size={14} className="user-chevron" />
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-name">{user.full_name}</div>
                  <div className="user-dropdown-email">{user.email}</div>
                  <div className="user-dropdown-role">
                    <ShieldCheck size={13} style={{ color: 'var(--emerald-safe)' }} />
                    <span>{user.role}</span>
                  </div>
                  <div className="user-dropdown-agency">{user.agency}</div>
                </div>
                <div className="user-dropdown-divider" />
                <button
                  className="user-dropdown-item"
                  onClick={() => {
                    soundEffects.playClickSound();
                    setIsUserMenuOpen(false);
                    onOpenAuth();
                  }}
                >
                  <ShieldCheck size={14} style={{ color: 'var(--cyan-primary)' }} />
                  <span>Account & Cloud Status</span>
                </button>
                <button
                  className="user-dropdown-item logout"
                  onClick={() => {
                    soundEffects.playClickSound();
                    onLogout();
                    setIsUserMenuOpen(false);
                  }}
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-signin"
            onClick={() => {
              soundEffects.playClickSound();
              onOpenAuth();
            }}
            title="Sign in with Disaster Management Credentials"
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}

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

          {/* Tour Toggle */}
          {onOpenTour && (
            <button
              className="btn-icon"
              onClick={() => {
                soundEffects.playClickSound();
                onOpenTour();
              }}
              title="Start Interactive Tour"
              aria-label="Start Tour"
            >
              <Compass size={16} style={{ color: 'var(--cyan-primary)' }} />
            </button>
          )}

          {/* FAQ Modal */}
          {onOpenFaq && (
            <button
              className="btn-icon"
              onClick={() => {
                soundEffects.playClickSound();
                onOpenFaq();
              }}
              title="FAQ & Settings Explanations"
              aria-label="FAQ"
            >
              <MessageCircleQuestion size={16} style={{ color: 'var(--cyan-primary)' }} />
            </button>
          )}

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
