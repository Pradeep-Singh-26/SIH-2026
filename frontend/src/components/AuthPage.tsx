import React, { useState, useEffect } from 'react';
import {
  LogIn, UserPlus, Shield, Database, CheckCircle2,
  AlertCircle, Building2, UserCircle2, KeyRound, Mail, Sparkles,
  ArrowRight, Waves, Radio, Activity, ArrowLeft
} from 'lucide-react';
import { authService } from '../services/authService';
import type { User, DbStatus } from '../types';
import { soundEffects } from '../services/soundEffects';

interface AuthPageProps {
  onSuccess: (user: User) => void;
  onContinueAsGuest: () => void;
  currentUser: User | null;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  onContinueAsGuest,
  currentUser
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agency, setAgency] = useState('National Disaster Management Authority (NDMA)');
  const [role, setRole] = useState('Hydrologist');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService.getDbStatus().then(setDbStatus).catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEffects.playClickSound();

    try {
      const res = await authService.login(loginEmail, loginPassword);
      soundEffects.playChimeSound();
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEffects.playClickSound();

    try {
      const res = await authService.signup({
        full_name: fullName,
        email: signupEmail,
        password: signupPassword,
        agency,
        role
      });
      soundEffects.playChimeSound();
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    soundEffects.playClickSound();
    setLoginEmail('officer.ndma@gov.in');
    setLoginPassword('DisasterResponse2026!');
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login('officer.ndma@gov.in', 'DisasterResponse2026!');
      soundEffects.playChimeSound();
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullpage-container">
      {/* Top Floating Bar */}
      <div className="auth-fullpage-topbar">
        <div className="auth-fullpage-brand">
          <img
            src="/logo.png"
            alt="Hydro-Breach Logo"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <div className="auth-fullpage-brand-title">HYDRO-BREACH</div>
            <div className="auth-fullpage-brand-sub">SIH26161 • Disaster Management Intelligence</div>
          </div>
        </div>

        <button
          className="btn-guest-return"
          onClick={() => {
            soundEffects.playClickSound();
            onContinueAsGuest();
          }}
          title="Proceed directly to GIS Tactical Simulation Map"
        >
          <span>Continue to Simulation Map</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Main Full-Page Content Grid */}
      <div className="auth-fullpage-body">
        {/* Left Hero Column: Platform Capabilities & Mission */}
        <div className="auth-hero-column">
          <div className="auth-hero-content">
            <div className="auth-badge-sih">
              <Shield size={14} />
              <span>National Hydrological Safety Platform</span>
            </div>

            <h1 className="auth-hero-heading">
              Hydrodynamic Dam Break & Emergency Disaster Response
            </h1>

            <p className="auth-hero-paragraph">
              Integrated high-performance 2D shallow water flood routing, DualSPHysics particle wave shock simulation,
              GeoTIFF DEM ingestion, and automated HADR relief corridor planning.
            </p>

            {/* Feature Pills */}
            <div className="auth-feature-cards">
              <div className="auth-feature-card">
                <div className="auth-feature-icon cyan">
                  <Waves size={18} />
                </div>
                <div>
                  <div className="auth-feature-title">Delft3D-FM & DualSPHysics Solvers</div>
                  <div className="auth-feature-desc">Eulerian 2D inundation & Lagrangian particle fluid shock waves</div>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-icon emerald">
                  <Activity size={18} />
                </div>
                <div>
                  <div className="auth-feature-title">Real-Time HADR Analytics</div>
                  <div className="auth-feature-desc">Automated population at risk, severed bridges & safe shelter buffers</div>
                </div>
              </div>

              <div className="auth-feature-card">
                <div className="auth-feature-icon purple">
                  <Radio size={18} />
                </div>
                <div>
                  <div className="auth-feature-title">Copernicus Sentinel-1 SAR Radar</div>
                  <div className="auth-feature-desc">Near-Real-Time cloud-penetrating water delineation via Google Earth Engine</div>
                </div>
              </div>
            </div>

            {/* Live Cloud Status */}
            <div className={`auth-cloud-badge ${dbStatus?.is_atlas ? 'atlas' : 'local'}`}>
              <Database size={16} />
              <div className="auth-cloud-text">
                <span className="auth-cloud-title">
                  {dbStatus?.is_atlas ? 'MongoDB Atlas Cloud Cluster Active' : 'MongoDB Storage Engine Active'}
                </span>
                <span className="auth-cloud-desc">
                  {dbStatus?.status || 'Detecting database cluster...'}
                </span>
              </div>
              <span className="auth-cloud-dot" />
            </div>
          </div>
        </div>

        {/* Right Column: Sleek Authentication Form Card */}
        <div className="auth-form-column">
          <div className="auth-form-card">
            {currentUser ? (
              /* Already Signed In state */
              <div className="auth-active-profile">
                <div className="auth-profile-avatar">
                  {currentUser.full_name.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="auth-card-title">Welcome Back, {currentUser.full_name}</h2>
                <div className="auth-profile-role">{currentUser.role}</div>
                <div className="auth-profile-agency">{currentUser.agency}</div>
                <div className="auth-profile-email">{currentUser.email}</div>

                <div className="auth-profile-actions">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      soundEffects.playClickSound();
                      onContinueAsGuest();
                    }}
                  >
                    <span>Launch Tactical GIS Map</span>
                    <ArrowRight size={16} />
                  </button>

                  <button
                    className="btn btn-secondary btn-block"
                    onClick={() => {
                      soundEffects.playClickSound();
                      authService.logout();
                      window.location.reload();
                    }}
                  >
                    <span>Sign Out / Switch Profile</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Switcher Tab */}
                <div className="auth-segmented-control">
                  <button
                    type="button"
                    className={`auth-segment-btn ${tab === 'LOGIN' ? 'active' : ''}`}
                    onClick={() => {
                      soundEffects.playClickSound();
                      setTab('LOGIN');
                      setError(null);
                    }}
                  >
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </button>

                  <button
                    type="button"
                    className={`auth-segment-btn ${tab === 'SIGNUP' ? 'active' : ''}`}
                    onClick={() => {
                      soundEffects.playClickSound();
                      setTab('SIGNUP');
                      setError(null);
                    }}
                  >
                    <UserPlus size={15} />
                    <span>Create Account</span>
                  </button>
                </div>

                <div className="auth-card-header">
                  <h2 className="auth-card-title">
                    {tab === 'LOGIN' ? 'Sign in to Hydro-Breach' : 'Register Officer Credentials'}
                  </h2>
                  <p className="auth-card-subtitle">
                    {tab === 'LOGIN'
                      ? 'Access simulation parameters, custom DEMs, and HADR emergency records'
                      : 'Store your disaster analytics and simulation scenarios on MongoDB Atlas'}
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="auth-fullpage-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                {tab === 'LOGIN' ? (
                  <form className="auth-fullpage-form" onSubmit={handleLogin}>
                    <div className="form-field-group">
                      <label className="form-field-label">
                        <Mail size={14} />
                        <span>Official Email Address</span>
                      </label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="commander@ndma.gov.in"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="form-field-label">
                        <KeyRound size={14} />
                        <span>Password</span>
                      </label>
                      <input
                        type="password"
                        required
                        className="form-input"
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                      {loading ? (
                        <span>Verifying Credentials...</span>
                      ) : (
                        <>
                          <LogIn size={16} />
                          <span>Sign In to Command Center</span>
                        </>
                      )}
                    </button>

                    <div className="auth-divider-or">
                      <span>or evaluate instantly</span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-block auth-demo-btn"
                      onClick={handleQuickDemo}
                      disabled={loading}
                    >
                      <Sparkles size={15} style={{ color: 'var(--cyan-primary)' }} />
                      <span>One-Click Officer Demo Access</span>
                    </button>
                  </form>
                ) : (
                  /* Signup Form */
                  <form className="auth-fullpage-form" onSubmit={handleSignup}>
                    <div className="form-field-group">
                      <label className="form-field-label">
                        <UserCircle2 size={14} />
                        <span>Full Name</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        placeholder="Dr. Rajeshwari Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="form-field-group">
                      <label className="form-field-label">
                        <Mail size={14} />
                        <span>Official Email Address</span>
                      </label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="r.sharma@cwc.gov.in"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-field-grid">
                      <div className="form-field-group">
                        <label className="form-field-label">
                          <Building2 size={14} />
                          <span>Agency / Department</span>
                        </label>
                        <select
                          className="form-input"
                          value={agency}
                          onChange={(e) => setAgency(e.target.value)}
                        >
                          <option value="National Disaster Management Authority (NDMA)">NDMA (National)</option>
                          <option value="State Disaster Management Authority (SDMA)">SDMA (State Disaster)</option>
                          <option value="Central Water Commission (CWC)">Central Water Commission (CWC)</option>
                          <option value="Irrigation & Water Resources Dept">State Irrigation Dept</option>
                          <option value="Indian Meteorological Department (IMD)">IMD Meteorological</option>
                          <option value="GIS & Hydrology Research Institute">Academic / Research Lab</option>
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label className="form-field-label">
                          <Shield size={14} />
                          <span>Professional Role</span>
                        </label>
                        <select
                          className="form-input"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                        >
                          <option value="Hydrologist">Hydrologist / Modeler</option>
                          <option value="Emergency Disaster Commander">Emergency Commander</option>
                          <option value="GIS & Remote Sensing Analyst">GIS Remote Sensing Analyst</option>
                          <option value="Field Response Officer">Field Response Officer</option>
                          <option value="Research Scholar">Research Scholar</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-field-group">
                      <label className="form-field-label">
                        <KeyRound size={14} />
                        <span>Password (min. 6 characters)</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        className="form-input"
                        placeholder="••••••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                      {loading ? (
                        <span>Registering on MongoDB Atlas...</span>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Register & Save to MongoDB Atlas</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </>
            )}

            <div className="auth-card-footer">
              <button
                type="button"
                className="btn-back-link"
                onClick={() => {
                  soundEffects.playClickSound();
                  onContinueAsGuest();
                }}
              >
                <ArrowLeft size={13} />
                <span>Return to Tactical Map without Signing In</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
