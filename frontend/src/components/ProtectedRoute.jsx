import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ruet-blue dark:border-white"></div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but role is loading (should usually be resolved if loading is false)
  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
         <div className="text-center">
            <h2 className="text-xl font-bold dark:text-white">Role Verification Failed</h2>
            <p className="text-gray-600 dark:text-gray-400">Your account does not have a valid role assigned.</p>
         </div>
      </div>
    );
  }

  // Not authorized for this route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Authorized
  return <Outlet />;
};

export default ProtectedRoute;
