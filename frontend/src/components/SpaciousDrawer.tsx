import React from 'react';
import { Sliders, Activity, UploadCloud, ChevronLeft, Columns } from 'lucide-react';
import { ScenarioPanel } from './ScenarioPanel';
import { ImpactPanel } from './ImpactPanel';
import { DemUploadPanel } from './DemUploadPanel';
import type { DamInfo, SimulationResult, BreachParameters, EngineType } from '../types';
import { soundEffects } from '../services/soundEffects';
import type { DrawerTab } from './SidebarRail';

interface SpaciousDrawerProps {
  activeTab: DrawerTab;
  onSelectTab: (tab: DrawerTab) => void;
  isOpen: boolean;
  onClose: () => void;
  isDualSplit: boolean;
  onToggleDualSplit: () => void;
  // ScenarioPanel props
  dam: DamInfo | null;
  isRunning: boolean;
  onRunSimulation: (engine: EngineType, scenarioName: string, params: BreachParameters) => void;
  // Custom DEM props
  onRunCustomDem: (formData: FormData) => Promise<void>;
  // ImpactPanel props
  simulation: SimulationResult | null;
  currentTimestep: number;
}

export const SpaciousDrawer: React.FC<SpaciousDrawerProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  isDualSplit,
  onToggleDualSplit,
  dam,
  isRunning,
  onRunSimulation,
  onRunCustomDem,
  simulation,
  currentTimestep
}) => {
  if (!isOpen) return null;

  return (
    <div className="spacious-drawer">
      {/* Drawer Tab Navigation Header */}
      <div className="drawer-header">
        <div className="drawer-tabs">
          <button
            className={`drawer-tab-btn ${activeTab === 'SCENARIO' ? 'active' : ''}`}
            onClick={() => {
              soundEffects.playClickSound();
              onSelectTab('SCENARIO');
            }}
          >
            <Sliders size={15} />
            <span>Breach Setup</span>
          </button>

          <button
            className={`drawer-tab-btn ${activeTab === 'UPLOAD_DEM' ? 'active' : ''}`}
            onClick={() => {
              soundEffects.playClickSound();
              onSelectTab('UPLOAD_DEM');
            }}
          >
            <UploadCloud size={15} />
            <span>DEM Studio</span>
          </button>

          <button
            className={`drawer-tab-btn ${activeTab === 'IMPACT' ? 'active' : ''}`}
            onClick={() => {
              soundEffects.playClickSound();
              onSelectTab('IMPACT');
            }}
          >
            <Activity size={15} />
            <span>HADR & Impact</span>
          </button>
        </div>

        <div className="drawer-actions">
          {/* Quick Dual Split Toggle for wide screens */}
          <button
            className={`btn-icon ${isDualSplit ? 'active-split' : ''}`}
            style={{ width: 30, height: 30 }}
            onClick={() => {
              soundEffects.playClickSound();
              onToggleDualSplit();
            }}
            title={isDualSplit ? 'Return to Single Tabbed Drawer' : 'Expand Both Panels (Dual Split View)'}
            aria-label="Toggle Dual Split View"
          >
            <Columns size={15} />
          </button>

          {/* Close / Collapse Drawer button */}
          <button
            className="btn-icon"
            style={{ width: 30, height: 30 }}
            onClick={() => {
              soundEffects.playClickSound();
              onClose();
            }}
            title="Collapse Drawer (Expands Map to Maximum Width)"
            aria-label="Collapse Drawer"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Drawer Body Content */}
      <div className="drawer-body">
        {activeTab === 'SCENARIO' && (
          <ScenarioPanel
            dam={dam}
            isRunning={isRunning}
            onRunSimulation={onRunSimulation}
            isCollapsed={false}
          />
        )}
        
        {activeTab === 'UPLOAD_DEM' && (
          <DemUploadPanel
            isRunning={isRunning}
            onRunCustomDem={onRunCustomDem}
          />
        )}

        {activeTab === 'IMPACT' && (
          <ImpactPanel
            simulation={simulation}
            currentTimestep={currentTimestep}
            isCollapsed={false}
          />
        )}
      </div>
    </div>
  );
};

export default SpaciousDrawer;
