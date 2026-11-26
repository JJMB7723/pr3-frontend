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

  // Always false — page renders immediately from localStorage cache.
  // Token is verified silently in the background by the useEffect below.
  const [loading] = useState(false);

  // Silently verify token in the background — does NOT block page render
  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('pr3_token');
      if (!savedToken) return; // No session, nothing to verify

      try {
        const res = await authService.getMe();
        if (res && res.user) {
          // Silently refresh user data from backend
          setUser(res.user);
          localStorage.setItem('pr3_user', JSON.stringify(res.user));
        }
      } catch {
        // Token is invalid or expired — log the user out silently
        logout();
      }
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

