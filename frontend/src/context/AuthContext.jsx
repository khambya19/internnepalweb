import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from './authContext';

// Only store these minimal fields in localStorage — never store base64 images or large profile data
const toStorableUser = (userData) => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  role: userData.role,
  isVerified: userData.isVerified,
  profileCompletion: userData.profileCompletion || null,
});

export const AuthProvider = ({ children }) => {
  // Restore minimal user from localStorage for immediate UI (before token verify completes)
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async ({ signal } = {}) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setUser(null);
      localStorage.removeItem('user');
      return null;
    }

    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
        signal
      });

      if (res?.data?.success && res?.data?.user) {
        const fullUser = res.data.user;
        setUser(fullUser);
        localStorage.setItem('user', JSON.stringify(toStorableUser(fullUser)));
        return fullUser;
      }

      // Unexpected response shape should not force logout.
      return null;
    } catch (error) {
      if (error?.response?.status === 401) {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const verifyToken = async () => {
      try {
        if (!isMounted) return;
        await refreshUser({ signal: controller.signal });
      } catch (error) {
        if (error.name === 'CanceledError') return;
        if (!isMounted) return;
        // Only clear local session on true auth failure (401) in refreshUser().
        // Keep session on transient backend/network errors to avoid surprise logout.
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [refreshUser]);

  // Login — store full user in state, only minimal in localStorage
  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(toStorableUser(userData)));
    localStorage.setItem('token', token);
  };

  // Logout
  const logout = async () => {
    const token = localStorage.getItem('token');

    try {
      if (token) {
        await axios.post(
          '/api/auth/logout',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {
      // Ignore logout API errors and always clear local session.
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
