import type { User, AuthResponse, DbStatus } from '../types';

const TOKEN_KEY = 'hydro_auth_token';
const USER_KEY = 'hydro_auth_user';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 
  (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:8000/api' : '/api');

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },

  setSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async getDbStatus(): Promise<DbStatus> {
    try {
      const res = await fetch(`${API_BASE}/auth/db-status`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) throw new Error('Failed to fetch DB status');
      return await res.json();
    } catch (err) {
      return {
        is_atlas: false,
        status: 'Local Mode (Atlas connection pending)',
        database_name: 'local_storage',
        atlas_uri_configured: false
      };
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Login failed: Invalid credentials');
      }

      const data: AuthResponse = await res.json();
      this.setSession(data.access_token, data.user);
      return data;
    } catch (err: any) {
      // Fallback demo user if backend is offline
      if (err.message.includes('fetch') || err.message.includes('timeout')) {
        const mockUser: User = {
          id: 'usr_offline_demo',
          full_name: email.split('@')[0].toUpperCase() || 'Commander Analyst',
          email,
          agency: 'National Disaster Management Authority (NDMA)',
          role: 'Hydrologist',
          created_at: new Date().toISOString()
        };
        const mockResp: AuthResponse = {
          access_token: 'mock-jwt-token-demo',
          token_type: 'bearer',
          user: mockUser
        };
        this.setSession(mockResp.access_token, mockResp.user);
        return mockResp;
      }
      throw err;
    }
  },

  async signup(data: {
    full_name: string;
    email: string;
    password: string;
    agency: string;
    role: string;
  }): Promise<AuthResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Signup failed. Please try again.');
      }

      const respData: AuthResponse = await res.json();
      this.setSession(respData.access_token, respData.user);
      return respData;
    } catch (err: any) {
      if (err.message.includes('fetch') || err.message.includes('timeout')) {
        const mockUser: User = {
          id: `usr_${Date.now()}`,
          full_name: data.full_name,
          email: data.email,
          agency: data.agency,
          role: data.role,
          created_at: new Date().toISOString()
        };
        const mockResp: AuthResponse = {
          access_token: 'mock-jwt-token-demo',
          token_type: 'bearer',
          user: mockUser
        };
        this.setSession(mockResp.access_token, mockResp.user);
        return mockResp;
      }
      throw err;
    }
  },

  async getMe(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: this.getAuthHeaders(),
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) {
        this.logout();
        return null;
      }
      const user: User = await res.json();
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      return this.getUser();
    }
  }
};
