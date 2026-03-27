import { useState, useCallback } from 'react';
import api, { getErrorMessage } from '../utils/api';
import type { User, AuthResponse } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const saveSession = useCallback((data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, username?: string) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthResponse>('/auth/signup', {
          email,
          password,
          username,
        });
        saveSession(data);
        return data;
      } catch (err) {
        throw new Error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const signin = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { data } = await api.post<AuthResponse>('/auth/signin', { email, password });
        saveSession(data);
        return data;
      } catch (err) {
        throw new Error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const isAuthenticated = !!user && !!localStorage.getItem('token');

  return { user, loading, isAuthenticated, signup, signin, logout };
}
