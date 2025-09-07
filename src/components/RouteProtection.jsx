// components/RouteProtection.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Automatic route redirects based on authentication status
export const RouteRedirect = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect logged in users from landing pages to their home
    if (currentUser && (location.pathname === '/' || location.pathname === '/career')) {
      navigate('/community', { replace: true });
    }
    
    // Redirect logged out users from protected pages to landing
    if (!currentUser && ['/community', '/dashboard', '/career/dashboard'].includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  return null; // This component doesn't render anything
};

// Protected route wrapper for authenticated pages
export const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  // Show loading while redirecting
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Navigation helper hook for active states
export const useActiveNavigation = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const getNavLinkClass = (path, baseClass = "", activeClass = "text-lime-400") => {
    return `${baseClass} ${isActive(path) ? activeClass : ''}`;
  };

  return {
    isActive,
    getNavLinkClass,
    currentPath: pathname
  };
};
