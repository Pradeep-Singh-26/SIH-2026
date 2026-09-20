import React, { useState, useEffect } from 'react';
import {
  X, LogIn, UserPlus, Shield, Database, CheckCircle2,
  AlertCircle, Building2, UserCircle2, KeyRound, Mail, Sparkles
} from 'lucide-react';
import { authService } from '../services/authService';
import type { User, DbStatus } from '../types';
import { soundEffects } from '../services/soundEffects';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
    if (isOpen) {
      setError(null);
      authService.getDbStatus().then(setDbStatus).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    soundEffects.playClickSound();

    try {
      const res = await authService.login(loginEmail, loginPassword);
      soundEffects.playChimeSound();
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <Shield size={18} className="auth-brand-icon" />
            <div>
              <div className="auth-title">HYDRO-BREACH IDENTITY</div>
              <div className="auth-subtitle">Disaster Command & Hydrology Portal</div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {/* Live MongoDB Status Banner */}
        <div className={`db-status-banner ${dbStatus?.is_atlas ? 'atlas-live' : 'local-mode'}`}>
          <Database size={15} />
          <div className="db-status-content">
            <span className="db-status-title">
              {dbStatus?.is_atlas ? 'MongoDB Atlas Cloud Verified' : 'MongoDB Storage Active'}
            </span>
            <span className="db-status-desc">{dbStatus?.status || 'Detecting database cluster...'}</span>
          </div>
          <span className="db-pulse-dot" />
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-pill">
          <button
            type="button"
            className={`auth-tab-btn ${tab === 'LOGIN' ? 'active' : ''}`}
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
            className={`auth-tab-btn ${tab === 'SIGNUP' ? 'active' : ''}`}
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

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {tab === 'LOGIN' ? (
          <form className="auth-form" onSubmit={handleLogin}>
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
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Access Platform</span>
                </>
              )}
            </button>

            <div className="auth-footer-divider">
              <span>or quick evaluate</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-block demo-btn"
              onClick={handleQuickDemo}
              disabled={loading}
            >
              <Sparkles size={15} style={{ color: 'var(--cyan-primary)' }} />
              <span>One-Click Officer Demo Access</span>
            </button>
          </form>
        ) : (
          /* Signup Form */
          <form className="auth-form" onSubmit={handleSignup}>
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
                <span>Official Email</span>
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
                  <span>Register & Save Profile</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
