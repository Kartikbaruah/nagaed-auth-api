import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);

const STORAGE_KEY = 'nagaed_auth_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const doLogin = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    setSession({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
  }, []);

  const doRegister = useCallback((payload) => authApi.register(payload), []);

  const logout = useCallback(() => setSession(null), []);

  const value = { session, isAuthenticated: Boolean(session), login: doLogin, register: doRegister, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
