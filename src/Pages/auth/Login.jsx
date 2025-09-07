// src/Pages/auth/Login.jsx - Enhanced with Dashboard Styling
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage, isSafariMobileDevice, isAndroidMobileDevice, hasPotentialStorageIssues } from '../../firebase/config';
import enhancedStorageService from '../../services/enhancedStorageService';

const Login = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authMethod, setAuthMethod] = useState('');
  const [hasExistingData, setHasExistingData] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Mouse tracking for animated background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check if user is on mobile browser with potential storage issues
  const isSafariMobile = isSafariMobileDevice();
  const isAndroidMobile = isAndroidMobileDevice();
  const hasStorageIssues = hasPotentialStorageIssues();

  // Check for existing user data
  useEffect(() => {
    if (currentUser) {
      const userId = currentUser.uid || currentUser.email;
      const userDataStatus = enhancedStorageService.hasUserData(userId);
      setHasExistingData(userDataStatus.hasAnalysis || userDataStatus.hasFormData);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const userId = currentUser.uid || currentUser.email;
      const userDataStatus = enhancedStorageService.hasUserData(userId);
      
      if (userDataStatus.canSkipTest) {
        console.log('✅ User has complete data, redirecting to dashboard');
        navigate('/career/dashboard');
      } else {
        console.log('📝 User needs to complete assessment');
        navigate('/career/test');
      }
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (hasStorageIssues) {
        setAuthMethod('popup');
        console.log("Mobile browser with potential storage issues detected - using popup authentication");
      } else {
        setAuthMethod('redirect');
      }
      
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
      
      const friendlyErrorMessage = getAuthErrorMessage(error);
      setError(friendlyErrorMessage);
      setIsLoading(false);
      setAuthMethod('');
      
      console.error("Technical error details:", {
        code: error?.code,
        message: error?.message,
        isSafariMobile,
        isAndroidMobile,
        hasStorageIssues,
        userAgent: navigator.userAgent
      });
    }
  };

  const getLoadingMessage = () => {
    if (!isLoading) return "Sign in with Google";
    
    switch (authMethod) {
      case 'popup':
        return "Opening sign-in popup...";
      case 'redirect':
        return "Redirecting to Google...";
      default:
        return "Signing in...";
    }
  };

  const getHelpText = () => {
    if (isSafariMobile) {
      return "On Safari mobile, sign-in will open in a popup window. Please allow popups if prompted.";
    } else if (isAndroidMobile) {
      return "On Android devices, sign-in will open in a popup window. Please allow popups if prompted.";
    } else if (hasStorageIssues) {
      return "Your browser may have storage restrictions. Sign-in will use a popup window.";
    }
    return "Secure login powered by Google";
  };

  return (
    <div 
      className="min-h-screen overflow-hidden flex flex-col relative"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Animated background overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />
      {/* Header - Enhanced with glassmorphism effect */}
<header className="fixed top-0 left-0 right-0 z-50" 
        style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
  <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="flex items-center group">
          <img 
            src="/Images/512X512.png" 
            alt="Favored Online Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4 transform group-hover:scale-110 transition-transform duration-300"
          />
          <span className="text-lg sm:text-2xl font-black text-white tracking-wide" 
                style={{
                  textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                  fontFamily: '"Inter", sans-serif'
                }}>
            Favored Online
          </span>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6 lg:space-x-10">
        {/* HOME LINK - Different destinations for logged in vs logged out users */}
        <Link 
          to={currentUser ? "/community" : "/"} 
          className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
        >
          Home
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
        </Link>
        
        {/* LOGGED IN USER NAVIGATION */}
        {currentUser ? (
          <>
            {/* MY CAREER LINK - Only for logged in users */}
            <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              My Career
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* DASHBOARD LINK - Only for logged in users */}
            <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </>
        ) : (
          /* LOGGED OUT USER NAVIGATION */
          <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Career
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
        )}
        
        {/* USER AUTHENTICATION SECTION */}
        {currentUser ? (
          <div className="flex items-center space-x-2 lg:space-x-4">
            <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-white/20">
              {currentUser.photoURL && (
                <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
              )}
              <span className="text-xs sm:text-sm text-white font-medium truncate max-w-20 sm:max-w-none" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                {currentUser.displayName || currentUser.email}
              </span>
            </div>
            <button 
              onClick={() => navigate('/logout')} 
              className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-300 backdrop-blur-sm border border-white/20 font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')} 
            className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
          >
            <span className="mr-1 sm:mr-2 text-sm sm:text-lg">🚀</span>
            Get Started
          </button>
        )}
      </nav>
      
      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
    </div>
    
    {/* Enhanced Mobile Menu */}
    {mobileMenuOpen && (
      <div className="md:hidden mt-4 sm:mt-6 pb-4 sm:pb-6 rounded-2xl" 
           style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
        <div className="flex flex-col space-y-3 sm:space-y-5 p-4 sm:p-6">
          
          {/* HOME LINK FOR MOBILE - Different for logged in vs out */}
          <Link 
            to={currentUser ? "/community" : "/"} 
            className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          {/* LOGGED IN USER MOBILE NAVIGATION */}
          {currentUser ? (
            <>
              {/* MY CAREER LINK FOR MOBILE */}
              <Link to="/career/dashboard" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                My Career
              </Link>

              {/* DASHBOARD LINK FOR MOBILE */}
              <Link to="/dashboard" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            </>
          ) : (
            /* LOGGED OUT USER MOBILE NAVIGATION */
            <Link to="/career" 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}>
              Career
            </Link>
          )}
          
          {/* MOBILE USER AUTHENTICATION SECTION */}
          {currentUser ? (
            <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
              <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                {currentUser.photoURL && (
                  <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                )}
                <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
              </div>
              <button 
                onClick={() => navigate('/logout')} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm transition-colors w-full font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center shadow-xl"
            >
              <span className="mr-2">🚀</span>
              Get Started
            </button>
          )}
        </div>
      </div>
    )}
  </div>
</header>

      {/* Main Content */}
      <main className="flex-grow pt-20 md:pt-24 flex items-center justify-center px-4 relative z-10">
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 md:p-10 w-full max-w-md border border-white/20 transform hover:scale-105 transition-all duration-500">
          <div className="text-center">
            {/* Hero Section */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 mb-4 animate-pulse">
                <div className="h-2 w-2 sm:h-3 sm:w-3 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em'
                      }}>
                  🔐 Secure Access
                </span>
                <div className="h-2 w-2 sm:h-3 sm:w-3 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3" 
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)'
                  }}>
                Welcome to{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Favored Online
                </span>
              </h1>
              
              <p className="text-gray-300 text-sm sm:text-base font-medium" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Access your free career assessment and personalized recommendations
              </p>

              <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mt-4"
                   style={{boxShadow: '0 0 30px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
            
            {/* Enhanced Error Display */}
            {error && (
              <div className="bg-gradient-to-br from-red-900/40 via-red-800/40 to-red-900/40 backdrop-blur-xl border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 shadow-2xl">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-sm text-red-300">Sign-in Failed</p>
                    <p className="text-sm mt-1 text-red-200">{error}</p>
                    {error.includes('popup') && (
                      <p className="text-xs mt-2 text-red-400">
                        💡 Try enabling popups in your browser settings
                      </p>
                    )}
                    {error.includes('refresh') && (
                      <button 
                        onClick={() => window.location.reload()} 
                        className="text-xs mt-2 underline text-red-400 hover:text-red-300 transition-colors duration-300"
                      >
                        Click here to refresh the page
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Browser Info Banner */}
            {hasStorageIssues && !error && (
              <div className="bg-gradient-to-br from-blue-900/40 via-blue-800/40 to-blue-900/40 backdrop-blur-xl border border-blue-500/30 text-blue-300 px-4 py-3 rounded-xl mb-6 shadow-2xl">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-sm text-blue-300">
                      {isSafariMobile ? 'Safari Mobile Detected' : 
                       isAndroidMobile ? 'Android Mobile Detected' : 
                       'Mobile Browser Detected'}
                    </p>
                    <p className="text-xs mt-1 text-blue-200">Sign-in will open in a popup. Please allow popups if prompted.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4 sm:space-y-6">
              <button 
                onClick={handleGoogleSignIn} 
                disabled={isLoading}
                className="w-full bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 text-white py-3 sm:py-4 px-4 rounded-xl shadow-2xl hover:shadow-3xl flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 group"
                style={{
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-lime-400" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    <span className="font-semibold">{getLoadingMessage()}</span>
                  </>
                ) : (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform duration-300">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-bold text-lg">Sign in with Google</span>
                    <span className="text-lime-400 group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </>
                )}
              </button>

              {/* Enhanced FREE ACCESS MESSAGE */}
              <div className="bg-gradient-to-br from-green-900/40 via-emerald-800/40 to-green-900/40 backdrop-blur-xl border border-green-500/30 text-green-300 px-4 py-3 rounded-xl shadow-2xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-sm text-green-300">✨ Completely Free!</p>
                    <p className="text-xs mt-1 text-green-200">
                      Sign in to access all career assessment features at no cost. 
                      Your data is saved automatically.
                    </p>
                  </div>
                </div>
              </div>

              {/* Existing data indicator */}
              {currentUser && hasExistingData && (
                <div className="bg-gradient-to-br from-blue-900/40 via-blue-800/40 to-blue-900/40 backdrop-blur-xl border border-blue-500/30 text-blue-300 px-4 py-3 rounded-xl shadow-2xl">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-bold text-sm text-blue-300">📊 Saved Data Found</p>
                      <p className="text-xs mt-1 text-blue-200">You have previous career analysis data. You'll be redirected to your dashboard.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="mt-6 sm:mt-8 pt-4 border-t border-white/20">
              <button
                onClick={() => navigate('/career')}
                className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors duration-300 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform duration-300 inline-block">←</span>
                {' '}Back to Home
              </button>
            </div>

            {/* Enhanced Additional Info */}
            <div className="mt-4 sm:mt-6">
              <p className="text-xs text-gray-400" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                {getHelpText()}
              </p>
              {/* Enhanced debug info for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-2 space-y-1 bg-black/20 rounded-lg p-2 border border-white/10">
                  <p>Debug: {isSafariMobile ? 'Safari Mobile' : 
                            isAndroidMobile ? 'Android Mobile' : 
                            hasStorageIssues ? 'Mobile with Storage Issues' : 'Desktop Browser'} | Method: {authMethod || 'None'}</p>
                  <p>Has Data: {hasExistingData ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <img 
                src="/Images/512X512.png" 
                alt="Favored Online Logo" 
                className="w-8 h-8 transform hover:scale-110 transition-transform duration-300"
              />
              <span className="text-xl font-black" 
                    style={{
                      textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                Favored Online
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-lime-400 text-xl">🚀</span>
              <span className="text-gray-300 text-sm font-medium" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Transforming Careers with AI-Powered Project Collaboration
              </span>
              <span className="text-lime-400 text-xl">✨</span>
            </div>
            <p className="text-gray-400 text-sm" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              © {new Date().getFullYear()} Favored Online. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(76, 175, 80, 0.1);
        }
        
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(76, 175, 80, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 175, 80, 0.7);
        }

        /* Enhanced touch targets for mobile */
        @media (max-width: 768px) {
          button, a, input, textarea {
            min-height: 44px;
          }
        }

        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
