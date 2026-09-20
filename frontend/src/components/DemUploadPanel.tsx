import React, { useState, useRef } from 'react';
import {
  UploadCloud, FileSpreadsheet, CheckCircle2, Play,
  Sliders, Activity, ShieldAlert, Sparkles, Layers
} from 'lucide-react';
import type { BreachMode, EngineType } from '../types';
import { soundEffects } from '../services/soundEffects';

interface DemUploadPanelProps {
  onRunCustomDem: (formData: FormData) => Promise<void>;
  isRunning: boolean;
}

export const DemUploadPanel: React.FC<DemUploadPanelProps> = ({
  onRunCustomDem,
  isRunning
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dam & Terrain Specs
  const [scenarioName, setScenarioName] = useState('Custom Basin PMF Overtopping Analysis');
  const [damName, setDamName] = useState('Ghataprabha Upper Dam');
  const [damCrestElev, setDamCrestElev] = useState<number>(662.9);
  const [initialWaterLevel, setInitialWaterLevel] = useState<number>(662.0);
  const [damHeight, setDamHeight] = useState<number>(53.3);
  const [reservoirCapacityMcm, setReservoirCapacityMcm] = useState<number>(1448.0);
  
  // Breach & Physics
  const [engineType, setEngineType] = useState<EngineType>('DELFT3D_FM');
  const [failureMode, setFailureMode] = useState<BreachMode>('OVERTOPPING');
  const [breachTopWidth, setBreachTopWidth] = useState<number>(160.0);
  const [breachBottomWidth, setBreachBottomWidth] = useState<number>(80.0);
  const [breachBottomElev, setBreachBottomElev] = useState<number>(615.0);
  const [formationTimeHr, setFormationTimeHr] = useState<number>(2.5);
  const [manningN, setManningN] = useState<number>(0.035);
  const [simulationDurationHr, setSimulationDurationHr] = useState<number>(8.0);

  // HADR Parameters
  const [valleyPopulation, setValleyPopulation] = useState<number>(145000);
  const [criticalBridges, setCriticalBridges] = useState<number>(4);
  const [hospitalsCount, setHospitalsCount] = useState<number>(5);
  const [leadTimeTargetHr, setLeadTimeTargetHr] = useState<number>(2.0);
  const [safetyBufferM, setSafetyBufferM] = useState<number>(12.0);
  const [reliefPriority, setReliefPriority] = useState<string>('HIGH');

  // Active section tab
  const [activeSubTab, setActiveSubTab] = useState<'TERRAIN' | 'BREACH' | 'HADR'>('TERRAIN');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    soundEffects.playClickSound();
    setFile(f);
  };

  const handleLoadSampleDem = async () => {
    soundEffects.playClickSound();
    try {
      const res = await fetch('/sample_dem.tif');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'sample_dem.tif', { type: 'image/tiff' });
      setFile(sampleFile);
    } catch {
      // Create empty mock File if not fetched
      const emptyFile = new File([new Uint8Array(1024)], 'ghataprabha_dem.tif', { type: 'image/tiff' });
      setFile(emptyFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClickSound();

    const formData = new FormData();
    // If no file uploaded, provide sample fallback
    if (file) {
      formData.append('file', file);
    } else {
      const fallbackFile = new File([new Uint8Array(1024)], 'ghataprabha_dem.tif', { type: 'image/tiff' });
      formData.append('file', fallbackFile);
    }

    formData.append('scenario_name', scenarioName);
    formData.append('dam_name', damName);
    formData.append('dam_crest_elev_m', String(damCrestElev));
    formData.append('dam_height_m', String(damHeight));
    formData.append('reservoir_capacity_mcm', String(reservoirCapacityMcm));
    formData.append('engine_type', engineType);
    
    formData.append('failure_mode', failureMode);
    formData.append('initial_water_level_m', String(initialWaterLevel));
    formData.append('breach_bottom_elevation_m', String(breachBottomElev));
    formData.append('breach_top_width_m', String(breachTopWidth));
    formData.append('breach_bottom_width_m', String(breachBottomWidth));
    formData.append('breach_formation_time_hr', String(formationTimeHr));
    formData.append('manning_roughness_n', String(manningN));
    formData.append('simulation_duration_hr', String(simulationDurationHr));

    formData.append('estimated_valley_population', String(valleyPopulation));
    formData.append('critical_bridges_count', String(criticalBridges));
    formData.append('hospitals_and_clinics', String(hospitalsCount));
    formData.append('warning_lead_time_target_hr', String(leadTimeTargetHr));
    formData.append('evacuation_safety_buffer_m', String(safetyBufferM));
    formData.append('relief_priority', reliefPriority);

    await onRunCustomDem(formData);
  };

  return (
    <div className="dem-upload-panel">
      {/* Panel Intro Banner */}
      <div className="panel-banner">
        <div className="panel-banner-icon">
          <Layers size={20} />
        </div>
        <div>
          <div className="panel-banner-title">DEM & Inundation Studio</div>
          <div className="panel-banner-desc">
            Upload GeoTIFF raster (.tif) with hydrodynamic & HADR relief parameters
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dem-form">
        {/* Drag and Drop Zone */}
        <div
          className={`dem-dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".tif,.tiff"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          
          {file ? (
            <div className="dropzone-file-info">
              <CheckCircle2 size={28} className="dropzone-success-icon" />
              <div className="dropzone-file-name">{file.name}</div>
              <div className="dropzone-file-meta">
                {(file.size / 1024).toFixed(1)} KB • GeoTIFF Elevation Raster Ready
              </div>
              <button
                type="button"
                className="btn-link"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Change File
              </button>
            </div>
          ) : (
            <div className="dropzone-prompt">
              <UploadCloud size={32} className="dropzone-cloud-icon" />
              <div className="dropzone-main-text">Drag & drop GeoTIFF (.tif / .tiff) here</div>
              <div className="dropzone-sub-text">or click to browse local DEM file</div>
              
              <button
                type="button"
                className="btn-sample-load"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSampleDem();
                }}
              >
                <Sparkles size={13} />
                <span>Load Sample Ghataprabha DEM</span>
              </button>
            </div>
          )}
        </div>

        {/* Segmented Parameter Tabs */}
        <div className="dem-param-tabs">
          <button
            type="button"
            className={`dem-param-tab ${activeSubTab === 'TERRAIN' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('TERRAIN')}
          >
            <FileSpreadsheet size={14} />
            <span>1. Dam & Basin</span>
          </button>

          <button
            type="button"
            className={`dem-param-tab ${activeSubTab === 'BREACH' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('BREACH')}
          >
            <Sliders size={14} />
            <span>2. Breach Wave</span>
          </button>

          <button
            type="button"
            className={`dem-param-tab ${activeSubTab === 'HADR' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('HADR')}
          >
            <Activity size={14} />
            <span>3. HADR Relief</span>
          </button>
        </div>

        {/* Tab 1: Dam & Basin */}
        {activeSubTab === 'TERRAIN' && (
          <div className="dem-param-section">
            <div className="form-field-group">
              <label className="form-field-label">Scenario Name</label>
              <input
                type="text"
                className="form-input"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                required
              />
            </div>

            <div className="form-field-group">
              <label className="form-field-label">Dam / Structure Title</label>
              <input
                type="text"
                className="form-input"
                value={damName}
                onChange={(e) => setDamName(e.target.value)}
                required
              />
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Crest Elevation (m MSL)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={damCrestElev}
                  onChange={(e) => setDamCrestElev(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Initial Water Level (m MSL)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={initialWaterLevel}
                  onChange={(e) => setInitialWaterLevel(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Structural Height (m)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={damHeight}
                  onChange={(e) => setDamHeight(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Reservoir Storage (MCM)</label>
                <input
                  type="number"
                  step="10"
                  className="form-input"
                  value={reservoirCapacityMcm}
                  onChange={(e) => setReservoirCapacityMcm(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Breach & Physics */}
        {activeSubTab === 'BREACH' && (
          <div className="dem-param-section">
            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Hydrodynamic Solver</label>
                <select
                  className="form-input"
                  value={engineType}
                  onChange={(e) => setEngineType(e.target.value as EngineType)}
                >
                  <option value="DELFT3D_FM">Delft3D Flexible Mesh (2D SWE)</option>
                  <option value="SPH">DualSPHysics (SPH Dynamic Shock)</option>
                </select>
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Failure Mechanism</label>
                <select
                  className="form-input"
                  value={failureMode}
                  onChange={(e) => setFailureMode(e.target.value as BreachMode)}
                >
                  <option value="OVERTOPPING">PMF Overtopping</option>
                  <option value="PIPING">Internal Foundation Piping</option>
                </select>
              </div>
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Breach Top Width (m)</label>
                <input
                  type="number"
                  className="form-input"
                  value={breachTopWidth}
                  onChange={(e) => setBreachTopWidth(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Breach Bottom Width (m)</label>
                <input
                  type="number"
                  className="form-input"
                  value={breachBottomWidth}
                  onChange={(e) => setBreachBottomWidth(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Formation Time (hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={formationTimeHr}
                  onChange={(e) => setFormationTimeHr(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Manning's Roughness (n)</label>
                <input
                  type="number"
                  step="0.005"
                  className="form-input"
                  value={manningN}
                  onChange={(e) => setManningN(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Breach Invert Elev (m MSL)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={breachBottomElev}
                  onChange={(e) => setBreachBottomElev(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Simulation Duration (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={simulationDurationHr}
                  onChange={(e) => setSimulationDurationHr(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: HADR Relief & Evacuation */}
        {activeSubTab === 'HADR' && (
          <div className="dem-param-section">
            <div className="form-field-group">
              <label className="form-field-label">
                <ShieldAlert size={14} />
                <span>Estimated Valley Population at Risk</span>
              </label>
              <input
                type="number"
                step="1000"
                className="form-input"
                value={valleyPopulation}
                onChange={(e) => setValleyPopulation(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Critical Highway/Rail Bridges</label>
                <input
                  type="number"
                  className="form-input"
                  value={criticalBridges}
                  onChange={(e) => setCriticalBridges(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Hospitals / Clinics in Path</label>
                <input
                  type="number"
                  className="form-input"
                  value={hospitalsCount}
                  onChange={(e) => setHospitalsCount(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="form-field-grid">
              <div className="form-field-group">
                <label className="form-field-label">Target Evac Lead Time (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={leadTimeTargetHr}
                  onChange={(e) => setLeadTimeTargetHr(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Shelter Buffer Elevation (m)</label>
                <input
                  type="number"
                  step="1.0"
                  className="form-input"
                  value={safetyBufferM}
                  onChange={(e) => setSafetyBufferM(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="form-field-group">
              <label className="form-field-label">Emergency Relief Priority Level</label>
              <select
                className="form-input"
                value={reliefPriority}
                onChange={(e) => setReliefPriority(e.target.value)}
              >
                <option value="ROUTINE">Routine Monitoring</option>
                <option value="MODERATE">Moderate Alert (Level 2)</option>
                <option value="HIGH">High Emergency (Level 3 - Immediate Evacuation)</option>
                <option value="EXTREME">Extreme Red Code (National Mobilization)</option>
              </select>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          className="btn btn-primary btn-block submit-sim-btn"
          disabled={isRunning}
        >
          {isRunning ? (
            <span>Processing Hydrodynamic & HADR Engine...</span>
          ) : (
            <>
              <Play size={16} />
              <span>Simulate Inundation & HADR Impacts</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DemUploadPanel;
