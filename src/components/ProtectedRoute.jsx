import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/**
 * Route guard component enforcing authentication and optional role requirements.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] Optional array of allowed roles, e.g. ['Owner']
 * @param {string} [props.redirectTo] Path to redirect if unauthorized (default: '/login' or '/scan')
 */
export default function ProtectedRoute({ children, allowedRoles, redirectTo }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(user?.role);
    if (!hasPermission) {
      // Authenticated but unauthorized for this route (e.g. Worker visiting Owner page)
      return <Navigate to={redirectTo || '/scan'} replace />;
    }
  }

  return children;
}
