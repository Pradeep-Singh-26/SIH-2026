import React from 'react';
import {
  Sliders, Activity, SplitSquareVertical, Satellite, Download,
  HelpCircle, Columns, ChevronLeft, ChevronRight
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

export type DrawerTab = 'SCENARIO' | 'IMPACT' | null;

interface SidebarRailProps {
  activeTab: DrawerTab;
  onSelectTab: (tab: DrawerTab) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  isDualSplit: boolean;
  onToggleDualSplit: () => void;
  onOpenComparison: () => void;
  onOpenGee: () => void;
  onOpenExport: () => void;
  onOpenGuide: () => void;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onSelectTab,
  isDrawerOpen,
  onToggleDrawer,
  isDualSplit,
  onToggleDualSplit,
  onOpenComparison,
  onOpenGee,
  onOpenExport,
  onOpenGuide
}) => {
  const handleTabClick = (tab: 'SCENARIO' | 'IMPACT') => {
    soundEffects.playClickSound();
    if (isDrawerOpen && activeTab === tab) {
      // Toggle close if already active
      onToggleDrawer();
    } else {
      onSelectTab(tab);
      if (!isDrawerOpen) onToggleDrawer();
    }
  };

  return (
    <aside className="app-rail" aria-label="Command Rail">
      {/* Top Group: Primary Operational Panels */}
      <div className="rail-group">
        <button
          className={`rail-btn ${isDrawerOpen && activeTab === 'SCENARIO' ? 'active' : ''}`}
          onClick={() => handleTabClick('SCENARIO')}
          title="Breach Parameters & Scenario Setup"
          aria-label="Scenario Setup"
        >
          <Sliders size={20} />
          <span className="rail-btn-label">Scenario</span>
          {isDrawerOpen && activeTab === 'SCENARIO' && <span className="rail-active-pill" />}
        </button>

        <button
          className={`rail-btn ${isDrawerOpen && activeTab === 'IMPACT' ? 'active' : ''}`}
          onClick={() => handleTabClick('IMPACT')}
          title="HADR Impact Analytics & Relief Corridors"
          aria-label="HADR Impact"
        >
          <Activity size={20} />
          <span className="rail-btn-label">Impact</span>
          {isDrawerOpen && activeTab === 'IMPACT' && <span className="rail-active-pill" />}
        </button>

        <button
          className={`rail-btn rail-btn-toggle ${isDrawerOpen ? 'open' : ''}`}
          onClick={() => {
            soundEffects.playClickSound();
            onToggleDrawer();
          }}
          title={isDrawerOpen ? 'Collapse Side Panel (Expands Map)' : 'Open Side Panel'}
          aria-label="Toggle Panel"
        >
          {isDrawerOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className="rail-divider" />

      {/* Middle Group: Advanced Analytical Tools & Interoperability */}
      <div className="rail-group">
        <button
          className="rail-btn"
          onClick={() => {
            soundEffects.playClickSound();
            onOpenComparison();
          }}
          title="Hydrodynamic Model Comparison (Delft3D-FM vs DualSPHysics)"
          aria-label="Model Comparison"
        >
          <SplitSquareVertical size={20} />
          <span className="rail-btn-label">Compare</span>
        </button>

        <button
          className="rail-btn"
          onClick={() => {
            soundEffects.playClickSound();
            onOpenGee();
          }}
          title="Near Real-Time Sentinel-1 SAR Radar Framework (Google Earth Engine)"
          aria-label="Sentinel-1 SAR"
        >
          <Satellite size={20} />
          <span className="rail-btn-label">SAR GEE</span>
        </button>

        <button
          className="rail-btn"
          onClick={() => {
            soundEffects.playClickSound();
            onOpenExport();
          }}
          title="Export Spatial Layers (ESRI Shapefile, Google Earth KML, GeoJSON)"
          aria-label="Export GIS Data"
        >
          <Download size={20} />
          <span className="rail-btn-label">Export</span>
        </button>
      </div>

      {/* Spacer to push utilities to the bottom */}
      <div style={{ flex: 1 }} />

      {/* Bottom Group: Layout Mode & System Guide */}
      <div className="rail-group rail-bottom-group">
        {/* Toggle between Clean Spacious Single Drawer vs Dual Split View */}
        <button
          className={`rail-btn ${isDualSplit ? 'active' : ''}`}
          onClick={() => {
            soundEffects.playClickSound();
            onToggleDualSplit();
          }}
          title={isDualSplit ? 'Switch to Spacious Single Drawer' : 'Switch to Dual Split View (Both Panels Visible)'}
          aria-label="Toggle Dual Split Layout"
        >
          <Columns size={18} />
          <span className="rail-btn-label">Split View</span>
        </button>

        <button
          className="rail-btn"
          onClick={() => {
            soundEffects.playClickSound();
            onOpenGuide();
          }}
          title="System Architecture & Operator Guide"
          aria-label="System Guide"
        >
          <HelpCircle size={18} style={{ color: 'var(--cyan-primary)' }} />
          <span className="rail-btn-label">Guide</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarRail;
