import React, { useContext } from 'react';
import { AuthContext } from '../../context/authContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute for role-based access control
 * - Shows loading spinner while token is being verified with the backend
 * - Redirects to /login if no valid user
 * - Redirects to correct dashboard if role doesn't match
 */
const ProtectedRoute = ({ allowedRoles = [], allowIncompletePaths = [] }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Still verifying token with backend → return null (App.jsx shows global loading)
  if (loading) {
    return null;
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role?.toLowerCase() || '';
  const profileCompletion = user?.profileCompletion;

  // Role not in allowed list → redirect to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (role === 'company') return <Navigate to="/company/dashboard" replace />;
    if (role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  if (
    (role === 'student' || role === 'company') &&
    profileCompletion &&
    profileCompletion.completed === false
  ) {
    const currentPath = location.pathname;
    const canAccessIncompleteRoute = allowIncompletePaths.some((path) => currentPath.startsWith(path));

    if (!canAccessIncompleteRoute) {
      const redirectPath = role === 'student' ? '/student/profile' : '/company/dashboard/profile';
      return <Navigate to={redirectPath} replace state={{ from: currentPath, reason: 'profile_incomplete' }} />;
    }
  }

  // All good → render the protected page
  return <Outlet />;
};

export default ProtectedRoute;
