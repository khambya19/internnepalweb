import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * ProtectedRoute for role-based access control
 * @param {string[]} allowedRoles - array of allowed roles (lowercase)
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user } = useContext(AuthContext);
  const role = user?.role?.toLowerCase() || '';

  if (!user || !role) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Role not allowed, redirect to correct dashboard or unauthorized
    if (role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (role === 'company') return <Navigate to="/company-dashboard" replace />;
    if (role === 'admin') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  // Allowed, render children
  return <Outlet />;
};

export default ProtectedRoute;
