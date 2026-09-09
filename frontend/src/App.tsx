import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ScenarioPanel } from './components/ScenarioPanel';
import { MapViewer } from './components/MapViewer';
import { TimelineController } from './components/TimelineController';
import { ImpactPanel } from './components/ImpactPanel';
import { ThreeSphSimulation } from './components/ThreeSphSimulation';
import { ComparisonModal } from './components/ComparisonModal';
import { ExportModal } from './components/ExportModal';
import { GeeModal } from './components/GeeModal';
import { SystemGuideModal } from './components/SystemGuideModal';
import { ToastContainer, type ToastMessage } from './components/Toast';

import {
  getHealth, getDams, getRiverGeoJSON, getInfrastructureGeoJSON,
  getDamTerrainGeoJSON,
  getSimulationResults, getSimulationLayers, triggerSimulation
} from './services/api';
import type { DamInfo, SimulationResult, BreachParameters, EngineType } from './types';
import { soundEffects } from './services/soundEffects';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'3D_SIMULATION' | '2D_GIS'>('2D_GIS');
  const [sphDurationMinutes, setSphDurationMinutes] = useState<number>(10);

  const [health, setHealth] = useState<any>(null);
  const [dam, setDam] = useState<DamInfo | null>(null);
  const [riverGeoJson, setRiverGeoJson] = useState<any>(null);
  const [infraGeoJson, setInfraGeoJson] = useState<any>(null);
  const [terrainGeoJson, setTerrainGeoJson] = useState<any>(null);
  
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [layersData, setLayersData] = useState<any>(null);
  const [isochronesData, setIsochronesData] = useState<any>(null);
  const [timesteps, setTimesteps] = useState<number[]>([0.5, 1.0, 2.0, 3.0, 4.0, 6.0, 8.0]);
  const [currentTimestep, setCurrentTimestep] = useState<number>(0.5);
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isGeeOpen, setIsGeeOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Theme Management (Light mode default)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('hydro_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hydro_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 2D GIS Collapsible sidebar states
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

  // Toast Notification System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((title: string, message?: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, title, message, type };
    setToasts((prev) => [...prev.slice(-3), newToast]); // Keep at most 4 toasts

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial load
  useEffect(() => {
    // 1. Health check
    getHealth().then(setHealth).catch(console.error);

    // 2. Dam catalogue
    getDams().then((dams) => {
      if (dams.length > 0) setDam(dams[0]);
    }).catch(console.error);

    // 3. Static GIS features
    getRiverGeoJSON('hidkal').then(setRiverGeoJson).catch(console.error);
    getInfrastructureGeoJSON('hidkal').then(setInfraGeoJson).catch(console.error);
    getDamTerrainGeoJSON('hidkal').then(setTerrainGeoJson).catch(console.error);

    // 4. Load initial preset simulation (Delft3D-FM)
    getSimulationResults('sim-preset-delft3d').then((res) => {
      setSimulation(res);
    }).catch(console.error);

    getSimulationLayers('sim-preset-delft3d').then((res) => {
      if (res.layers_by_timestep) {
        setLayersData(res.layers_by_timestep);
        if (res.isochrones) {
          setIsochronesData(res.isochrones);
        }
        const steps = Object.keys(res.layers_by_timestep).map(parseFloat).sort((a, b) => a - b);
        setTimesteps(steps);
        setCurrentTimestep(steps[0]);
      }
    }).catch(console.error);
  }, []);

  const handleRunSimulation = async (engine: EngineType, scenarioName: string, params: BreachParameters) => {
    setIsRunning(true);
    addToast('Simulation Queued', `Running ${scenarioName} with ${engine}`, 'info');
    try {
      const newSim = await triggerSimulation({
        dam_id: 'hidkal',
        scenario_name: scenarioName,
        engine_type: engine,
        breach_params: params
      });
      setSimulation(newSim);

      const layers = await getSimulationLayers(newSim.id);
      if (layers.layers_by_timestep) {
        setLayersData(layers.layers_by_timestep);
        if (layers.isochrones) {
          setIsochronesData(layers.isochrones);
        }
        const steps = Object.keys(layers.layers_by_timestep).map(parseFloat).sort((a, b) => a - b);
        setTimesteps(steps);
        setCurrentTimestep(steps[0]);
      }
      soundEffects.playChimeSound();
      addToast('Simulation Complete', `Peak Discharge: ${newSim.hydrograph.peak_discharge_m3s.toLocaleString()} m³/s`, 'success');
    } catch (err) {
      console.error('Simulation run failed:', err);
      addToast('Execution Error', 'Failed to execute simulation. Check backend logs.', 'danger');
    } finally {
      setIsRunning(false);
    }
  };

  // Dynamic grid column template based on collapsed sidebars
  const getGridTemplate = () => {
    const leftCol = isLeftCollapsed ? '48px' : '360px';
    const rightCol = isRightCollapsed ? '48px' : '390px';
    return `${leftCol} 1fr ${rightCol}`;
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Header
        mode={health?.mode || 'MOCK'}
        isDemoData={health ? health.is_demo_data : true}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenGee={() => setIsGeeOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Workspace: 3D Three.js SPH or 2D Tactical GIS */}
      {activeView === '3D_SIMULATION' ? (
        <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 65px)', overflow: 'hidden' }}>
          <ThreeSphSimulation
            durationMinutes={sphDurationMinutes}
            onDurationChange={setSphDurationMinutes}
            simulation={simulation}
            onNotify={addToast}
            theme={theme}
          />
        </div>
      ) : (
        <>
          <main
            className="dashboard-grid"
            style={{
              gridTemplateColumns: getGridTemplate(),
              transition: 'grid-template-columns 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Left: Dam Selector & Breach Configuration Panel */}
            <ScenarioPanel
              dam={dam}
              isRunning={isRunning}
              onRunSimulation={handleRunSimulation}
              isCollapsed={isLeftCollapsed}
              onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
            />

            {/* Center: Interactive Geospatial Leaflet Map */}
            <MapViewer
              dam={dam}
              riverGeoJson={riverGeoJson}
              infraGeoJson={infraGeoJson}
              terrainGeoJson={terrainGeoJson}
              layersData={layersData}
              isochronesData={isochronesData}
              currentTimestep={currentTimestep}
              theme={theme}
            />

            {/* Right: Hydrograph, KPIs & HADR Impact Panel */}
            <ImpactPanel
              simulation={simulation}
              currentTimestep={currentTimestep}
              isCollapsed={isRightCollapsed}
              onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
            />
          </main>

          {/* Bottom: Timeline Playback Scrubber for 2D GIS */}
          <TimelineController
            timesteps={timesteps}
            currentTimestep={currentTimestep}
            onTimestepChange={setCurrentTimestep}
          />
        </>
      )}

      {/* Modals */}
      <ComparisonModal
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        simulationId={simulation?.id || 'sim-preset-delft3d'}
      />

      <GeeModal
        isOpen={isGeeOpen}
        onClose={() => setIsGeeOpen(false)}
      />

      <SystemGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* Ephemeral Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
