// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth(); // Removed isAuthorized since we're making it free

  // Only check if user is authenticated (logged in)
  if (!currentUser) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected content (no payment check needed)
  return children;
};

export default ProtectedRoute;
