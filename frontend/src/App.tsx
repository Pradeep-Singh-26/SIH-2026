import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { SidebarRail, type DrawerTab } from './components/SidebarRail';
import { SpaciousDrawer } from './components/SpaciousDrawer';
import { ScenarioPanel } from './components/ScenarioPanel';
import { MapViewer } from './components/MapViewer';
import { TimelineController } from './components/TimelineController';
import { ImpactPanel } from './components/ImpactPanel';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { OnboardingTour } from './components/OnboardingTour';
import { FaqModal } from './components/FaqModal';

// Code-split heavy visualizers, modals & full-page views to optimize initial bundle size
const ThreeSphSimulation = lazy(() => import('./components/ThreeSphSimulation').then(m => ({ default: m.ThreeSphSimulation })));
const AuthPage = lazy(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const ComparisonModal = lazy(() => import('./components/ComparisonModal').then(m => ({ default: m.ComparisonModal })));
const ExportModal = lazy(() => import('./components/ExportModal').then(m => ({ default: m.ExportModal })));
const GeeModal = lazy(() => import('./components/GeeModal').then(m => ({ default: m.GeeModal })));
const SystemGuideModal = lazy(() => import('./components/SystemGuideModal').then(m => ({ default: m.SystemGuideModal })));

import {
  getHealth, getDams, getRiverGeoJSON, getInfrastructureGeoJSON,
  getDamTerrainGeoJSON,
  getSimulationResults, getSimulationLayers, triggerSimulation,
  simulateCustomDem
} from './services/api';
import { authService } from './services/authService';
import type { DamInfo, SimulationResult, BreachParameters, EngineType, User } from './types';
import { soundEffects } from './services/soundEffects';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<'SIMULATION' | 'AUTH'>('SIMULATION');
  const [activeView, setActiveView] = useState<'3D_SIMULATION' | '2D_GIS'>('2D_GIS');
  const [sphDurationMinutes, setSphDurationMinutes] = useState<number>(10);

  // Authentication State
  const [user, setUser] = useState<User | null>(() => authService.getUser());

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
  const [isFaqOpen, setIsFaqOpen] = useState<boolean>(false);
  const [runTour, setRunTour] = useState<boolean>(false);
  const [showTourPrompt, setShowTourPrompt] = useState<boolean>(false);

  // Spacious Layout & Drawer State
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('SCENARIO');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [isDualSplit, setIsDualSplit] = useState<boolean>(false);

  // Dual-split legacy collapsible sidebar states (for ultra-wide mode)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);

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
    // 0. Verify auth profile
    authService.getMe().then((profile) => {
      if (profile) setUser(profile);
    }).catch(console.error);

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

    // 5. Onboarding Check
    const hasSeenTour = localStorage.getItem('hasSeenHydroTour');
    if (!hasSeenTour) {
      setShowTourPrompt(true);
    }
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

  const handleRunCustomDem = async (formData: FormData) => {
    setIsRunning(true);
    addToast('DEM Ingestion Started', 'Parsing elevation raster & executing 2D hydrodynamic solver...', 'info');
    try {
      const newSim = await simulateCustomDem(formData);
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
      addToast(
        'Custom Simulation Ready',
        `Peak Outflow: ${newSim.peak_discharge_m3s.toLocaleString()} m³/s | Pop at Risk: ${newSim.impact.population_at_risk.toLocaleString()}`,
        'success'
      );
      // Seamlessly switch to HADR impact tab to display the fresh disaster analytics
      setDrawerTab('IMPACT');
    } catch (err: any) {
      console.error('Custom DEM simulation failed:', err);
      addToast('DEM Simulation Error', err.message || 'Failed to simulate custom DEM', 'danger');
    } finally {
      setIsRunning(false);
    }
  };

  // Dynamic grid template for dual split mode
  const getGridTemplate = () => {
    const leftCol = isLeftCollapsed ? '48px' : '360px';
    const rightCol = isRightCollapsed ? '48px' : '390px';
    return `${leftCol} 1fr ${rightCol}`;
  };

  // Full Page Authentication View
  if (activePage === 'AUTH') {
    return (
      <div className="app-container">
        <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan-primary)' }}>Loading Identity Portal...</div>}>
          <AuthPage
            currentUser={user}
            onSuccess={(u) => {
              setUser(u);
              setActivePage('SIMULATION');
              addToast('Access Granted', `Welcome back, ${u.full_name} (${u.agency})`, 'success');
            }}
            onContinueAsGuest={() => setActivePage('SIMULATION')}
          />
        </Suspense>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Top Streamlined Navigation */}
      <Header
        mode={health?.mode || 'MOCK'}
        isDemoData={health ? health.is_demo_data : true}
        activeView={activeView}
        onViewChange={setActiveView}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenTour={() => {
          setIsGuideOpen(false);
          setIsFaqOpen(false);
          setRunTour(true);
        }}
        onOpenFaq={() => setIsFaqOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isDrawerOpen={isDrawerOpen}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        user={user}
        onOpenAuth={() => setActivePage('AUTH')}
        onLogout={() => {
          authService.logout();
          setUser(null);
          addToast('Signed Out', 'Platform session ended', 'info');
        }}
      />

      {/* Main Spacious Workspace */}
      <div className="app-workspace">
        {/* Left Vertical Activity Rail */}
        <SidebarRail
          activeTab={drawerTab}
          onSelectTab={(tab) => {
            setDrawerTab(tab);
            setIsDrawerOpen(true);
          }}
          isDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          isDualSplit={isDualSplit}
          onToggleDualSplit={() => setIsDualSplit(!isDualSplit)}
          onOpenComparison={() => setIsComparisonOpen(true)}
          onOpenGee={() => setIsGeeOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenGuide={() => setIsGuideOpen(true)}
          onOpenAuth={() => setActivePage('AUTH')}
        />

        {/* Content Area: Dual Split Mode vs Spacious Single Drawer Mode */}
        {isDualSplit && activeView === '2D_GIS' ? (
          /* Dual Split View (Both panels visible flanking the map) */
          <div className="split-dashboard-wrapper">
            <main
              className="dashboard-grid"
              style={{
                gridTemplateColumns: getGridTemplate(),
                transition: 'grid-template-columns 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                width: '100%',
                height: '100%'
              }}
            >
              <ScenarioPanel
                dam={dam}
                isRunning={isRunning}
                onRunSimulation={handleRunSimulation}
                isCollapsed={isLeftCollapsed}
                onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
              />

              <div className="map-and-timeline-wrapper">
                <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100% - 75px)', overflow: 'hidden' }}>
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
                </div>
                <TimelineController
                  timesteps={timesteps}
                  currentTimestep={currentTimestep}
                  onTimestepChange={setCurrentTimestep}
                />
              </div>

              <ImpactPanel
                simulation={simulation}
                currentTimestep={currentTimestep}
                isCollapsed={isRightCollapsed}
                onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
              />
            </main>
          </div>
        ) : (
          /* New Spacious Mode (Unified sliding drawer + huge expansive map or 3D canvas) */
          <>
            <SpaciousDrawer
              activeTab={drawerTab}
              onSelectTab={setDrawerTab}
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              isDualSplit={isDualSplit}
              onToggleDualSplit={() => setIsDualSplit(!isDualSplit)}
              dam={dam}
              isRunning={isRunning}
              onRunSimulation={handleRunSimulation}
              onRunCustomDem={handleRunCustomDem}
              simulation={simulation}
              currentTimestep={currentTimestep}
            />

            <div className="main-view-container">
              {activeView === '3D_SIMULATION' ? (
                <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                  <Suspense fallback={
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cyan-primary)', gap: 10, fontSize: 13, fontWeight: 600 }}>
                      <span className="status-dot"></span>
                      <span>Loading DualSPHysics 3D Particle Engine...</span>
                    </div>
                  }>
                    <ThreeSphSimulation
                      durationMinutes={sphDurationMinutes}
                      onDurationChange={setSphDurationMinutes}
                      simulation={simulation}
                      onNotify={addToast}
                      theme={theme}
                    />
                  </Suspense>
                </div>
              ) : (
                <>
                  <div className="map-view-wrapper">
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
                  </div>
                  <TimelineController
                    timesteps={timesteps}
                    currentTimestep={currentTimestep}
                    onTimestepChange={setCurrentTimestep}
                  />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Analytical Modals (Loaded Dynamically on Demand) */}
      <Suspense fallback={null}>
        {isComparisonOpen && (
          <ComparisonModal
            isOpen={isComparisonOpen}
            onClose={() => setIsComparisonOpen(false)}
          />
        )}

        {isExportOpen && (
          <ExportModal
            isOpen={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            simulationId={simulation?.id || 'sim-preset-delft3d'}
          />
        )}

        {isGeeOpen && (
          <GeeModal
            isOpen={isGeeOpen}
            onClose={() => setIsGeeOpen(false)}
          />
        )}

        {isGuideOpen && (
          <SystemGuideModal
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
          />
        )}

        {isFaqOpen && (
          <FaqModal
            isOpen={isFaqOpen}
            onClose={() => setIsFaqOpen(false)}
          />
        )}
      </Suspense>

      {/* Onboarding & Prompts */}
      <OnboardingTour 
        run={runTour} 
        onFinish={() => setRunTour(false)} 
      />

      {showTourPrompt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--cyan-primary)' }}>Welcome to Hydro-Breach</h3>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Would you like a quick walkthrough of the interface and its historical context before you begin?
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => {
                localStorage.setItem('hasSeenHydroTour', 'true');
                setShowTourPrompt(false);
              }}>Skip</button>
              <button className="btn btn-primary" onClick={() => {
                localStorage.setItem('hasSeenHydroTour', 'true');
                setShowTourPrompt(false);
                setRunTour(true);
              }}>Start Walkthrough</button>
            </div>
          </div>
        </div>
      )}

      {/* Ephemeral Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
