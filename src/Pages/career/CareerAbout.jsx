// src/Pages/career/CareerAbout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CareerAbout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { currentUser, isAuthorized } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 sm:mb-24 md:mb-32 pt-8 sm:pt-12 md:pt-20">
            <div className="max-w-6xl mx-auto text-center">
              
              {/* Animated Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-pulse">
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em sm:0.2em'
                      }}>
                  🚀 Empowering Tech Careers Since Day One
                </span>
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                About{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Favored Online
                </span>
              </h1>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
              
              {/* Floating Elements - Hidden on very small screens */}
              <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-lime-400/20 rounded-full blur-xl animate-bounce"></div>
              <div className="hidden sm:block absolute bottom-20 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="hidden sm:block absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </section>

          {/* Welcome Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500">
              <div className="text-center mb-8 sm:mb-10 md:mb-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                    style={{
                      textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                    Welcome!
                  </span>
                </h2>
              </div>
              
              <div className="space-y-6 sm:space-y-8">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light" 
                   style={{
                     textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                     fontFamily: '"Inter", sans-serif'
                   }}>
                  <span className="text-lime-300 font-semibold">Favored Online Inc.</span> is a tech skills development platform designed to empower individuals through hands-on, team-based projects and a structured learning journey.
                </p>
          
              </div>
            </div>
          </section>

          {/* Vision and Objectives */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16">
              
              {/* Vision */}
              <div className="group transform hover:scale-105 transition-all duration-500">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-green-500/20 shadow-2xl h-full flex flex-col">
                  <div className="flex items-center mb-6 sm:mb-8 md:mb-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl mr-3 sm:mr-4 md:mr-6 shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                      🚀
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Our Vision
                    </h2>
                  </div>
                  
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-6 sm:mb-7 md:mb-8 flex-grow" 
                     style={{
                       textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    To be the leading platform that cultivates the next generation of <span className="text-lime-300 font-semibold">tech innovators and industry experts</span>.
                  </p>
                  
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-6 sm:p-7 md:p-8 rounded-xl sm:rounded-2xl border border-white/20 transform group-hover:scale-105 transition-transform duration-500">
                    <p className="italic text-lime-300 text-center text-base sm:text-lg md:text-xl font-light" 
                       style={{
                         textShadow: '0 0 10px rgba(76, 175, 80, 0.8), 1px 1px 2px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      "Empowering the next generation through hands-on learning and real-world experience."
                    </p>
                  </div>
                </div>
              </div>

              {/* Objectives */}
              <div className="group transform hover:scale-105 transition-all duration-500">
                <div className="bg-gradient-to-br from-lime-500/10 to-green-500/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-lime-500/20 shadow-2xl h-full">
                  <div className="flex items-center mb-6 sm:mb-8 md:mb-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-lime-500 to-green-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl mr-3 sm:mr-4 md:mr-6 shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                      🎯
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Our Objectives
                    </h2>
                  </div>
                  <ul className="space-y-4 sm:space-y-5 md:space-y-6 text-gray-200 text-base sm:text-lg md:text-xl">
                    {[
                      "To develop human capital by engaging individuals in real-world, team-based projects",
                      "To help people understand and find their niche in tech through AI-powered recommendations and expert human guidance",
                      "To provide the resources needed to successfully build a career in any tech field by curating top-rated online courses and offering tailored learning roadmaps",
                      "To develop tech experts through a badge system that validates skills and tracks progress from novice to expert",
                      "To provide global opportunities by connecting with hiring organizations and individuals worldwide"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start group-hover:text-white transition-colors duration-300" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                        <span className="text-lime-400 mr-3 sm:mr-4 text-lg sm:text-xl md:text-2xl transform group-hover:scale-125 transition-transform duration-300 flex-shrink-0"
                              style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
                          ✓
                        </span>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - Enhanced */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mb-8 sm:mb-12">
            
            {/* Logo and Description */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4 sm:mb-6">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-2 sm:mr-3 md:mr-4 transform hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xl sm:text-2xl md:text-3xl font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  Favored Online
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto md:mx-0"
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                AI-powered career transformation with real projects and badge validation - completely free.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-lime-400 mb-4 sm:mb-6"
                  style={{
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to="/tech-badges" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Tech Badges
                  </Link>
                </li>
                <li>
                  <Link to="/career/contact" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Hire Talents
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-lime-400 mb-4 sm:mb-6"
                  style={{
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Support & Legal
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/career/support" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Support
                  </Link>
                </li>
                <li>
                  <Link to="/career/about" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/career/terms" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/career/privacy" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              
              {/* Copyright */}
              <p className="text-gray-300 text-sm sm:text-base" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                © {new Date().getFullYear()} Favored Online. All rights reserved.
              </p>

              {/* Social or Additional Info */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">🚀</span>
                <span className="text-gray-300 text-sm font-medium"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Transforming Careers with AI
                </span>
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">✨</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
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
      `}</style>
    </div>
  );
};

export default CareerAbout;
