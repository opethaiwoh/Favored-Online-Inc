// src/Pages/auth/Logout.jsx - Enhanced with Dashboard Styling
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Logout = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [countdown, setCountdown] = useState(3);
  const navigate = useNavigate();

  // Mouse tracking for animated background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (isLoggedOut && !error && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate('/career');
    }
  }, [isLoggedOut, error, countdown, navigate]);

  // Auto logout when component mounts if user is logged in
  useEffect(() => {
    if (currentUser && !isLoggedOut) {
      handleLogout();
    } else if (!currentUser) {
      setIsLoggedOut(true);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError('');
      
      await logout();
      
      setIsLoggingOut(false);
      setIsLoggedOut(true);
      
    } catch (error) {
      console.error('Logout failed:', error);
      setError('Failed to log out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const handleManualLogout = () => {
    if (!isLoggingOut) {
      handleLogout();
    }
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
                  👋 Signing Out
                </span>
                <div className="h-2 w-2 sm:h-3 sm:w-3 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3" 
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)'
                  }}>
                {isLoggedOut ? (
                  <>
                    See You{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                          style={{
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                            animation: 'glow 2s ease-in-out infinite alternate'
                          }}>
                      Soon!
                    </span>
                  </>
                ) : (
                  <>
                    Signing{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-red-400 to-pink-500"
                          style={{
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 20px rgba(255, 69, 0, 0.5))',
                            animation: 'glow 2s ease-in-out infinite alternate'
                          }}>
                      Out...
                    </span>
                  </>
                )}
              </h1>

              <div className="h-1 w-16 sm:w-20 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl"
                   style={{boxShadow: '0 0 30px rgba(76, 175, 80, 0.6)'}}></div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-gradient-to-br from-red-900/40 via-red-800/40 to-red-900/40 backdrop-blur-xl border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-6 shadow-2xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-bold text-sm text-red-300">Logout Error</p>
                    <p className="text-xs mt-1 text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoggingOut && (
              <div className="mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="animate-spin h-12 w-12 border-4 border-lime-400/20 border-t-lime-400 rounded-full shadow-lg"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-lime-400 rounded-full animate-pulse shadow-lg" 
                           style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 font-medium" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Securely signing you out...
                </p>
                <div className="mt-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full animate-pulse" style={{width: '70%'}}></div>
                </div>
              </div>
            )}

            {/* Success State */}
            {isLoggedOut && !error && (
              <div className="mb-6">
                <div className="bg-gradient-to-br from-green-900/40 via-emerald-800/40 to-green-900/40 backdrop-blur-xl border border-green-500/30 text-green-300 px-4 py-4 rounded-xl mb-4 shadow-2xl">
                  <div className="flex items-center justify-center mb-3">
                    <div className="relative">
                      <svg className="w-12 h-12 text-green-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.8))'}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <p className="font-bold text-lg text-green-300 mb-2">Successfully Logged Out!</p>
                  <p className="text-sm text-green-200">Thank you for using Favored Online</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/30 via-blue-800/30 to-blue-900/30 backdrop-blur-xl border border-blue-500/20 text-blue-300 px-4 py-3 rounded-xl">
                  <p className="text-sm font-medium">
                    🏠 Redirecting to home in{' '}
                    <span className="text-blue-400 font-bold text-lg animate-pulse">{countdown}</span>
                    {' '}second{countdown !== 1 ? 's' : ''}...
                  </p>
                  <div className="mt-2 bg-blue-500/20 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full rounded-full transition-all duration-1000 ease-linear" 
                      style={{width: `${((3 - countdown) / 3) * 100}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Logout for Not Logged In Users */}
            {!currentUser && !isLoggedOut && (
              <div className="mb-6">
                <div className="bg-gradient-to-br from-yellow-900/40 via-yellow-800/40 to-orange-900/40 backdrop-blur-xl border border-yellow-500/30 text-yellow-300 px-4 py-3 rounded-xl">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="font-bold text-yellow-300">Not Currently Logged In</p>
                  <p className="text-sm text-yellow-200 mt-1">You are already signed out</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 sm:space-y-4">
              
              {/* Logout Button (for error state) */}
              {error && (
                <button
                  onClick={handleManualLogout}
                  disabled={isLoggingOut}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  style={{
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  {isLoggingOut ? (
                    <span className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      <span>Logging out...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>🔄</span>
                      <span>Try Again</span>
                    </span>
                  )}
                </button>
              )}

              {/* Navigation Options */}
              <button
                onClick={() => navigate('/career')}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{
                  boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)'
                }}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🏠</span>
                  <span>Go to Home</span>
                </span>
              </button>
              
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl border border-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
                style={{
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🔑</span>
                  <span>Sign In Again</span>
                </span>
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-white/20">
              <p className="text-xs text-gray-400" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                🔒 Your session has been securely terminated
              </p>
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

export default Logout;
