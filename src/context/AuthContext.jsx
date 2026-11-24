import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pr3_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('pr3_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync state and verify user with backend on initial mount
  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('pr3_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem('pr3_user', JSON.stringify(res.user));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = (tokenData, userData) => {
    setToken(tokenData);
    setUser(userData);
    localStorage.setItem('pr3_token', tokenData);
    localStorage.setItem('pr3_user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('pr3_token');
    localStorage.removeItem('pr3_user');
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

