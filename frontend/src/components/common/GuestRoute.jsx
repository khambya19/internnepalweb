import React, { useContext } from 'react';
import { AuthContext } from '../../context/authContext';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * GuestRoute - Only allows unauthenticated users
 * Redirects authenticated users to their dashboard
 * Prevents flash of login/register/home pages for logged-in users
 */
const GuestRoute = () => {
  const { user, loading } = useContext(AuthContext);

  // Still verifying - show nothing (App.jsx shows loading screen)
  if (loading) {
    return null;
  }

  // User is authenticated - redirect to their dashboard
  if (user) {
    const role = user.role?.toLowerCase() || '';
    if (role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (role === 'company') return <Navigate to="/company/dashboard" replace />;
    if (role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
  }

  // Not authenticated - allow access to guest pages
  return <Outlet />;
};

export default GuestRoute;
