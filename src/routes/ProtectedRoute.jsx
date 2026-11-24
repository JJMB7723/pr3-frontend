import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

/**
 * ProtectedRoute Guard
 * @param {Array<string>} allowedRoles - Array of roles permitted to view this route (e.g., ['admin'])
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Verifying session..." />;
  }

  // 1. Unauthenticated users redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Role restriction check
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect unauthorized user to their role-appropriate home
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'business':
        return <Navigate to="/business/dashboard" replace />;
      case 'supplier':
        return <Navigate to="/supplier/dashboard" replace />;
      case 'delivery':
        return <Navigate to="/delivery/dashboard" replace />;
      case 'customer':
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

