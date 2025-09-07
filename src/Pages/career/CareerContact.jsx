// src/Pages/career/CareerContact.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const CareerContact = () => {
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
                  🎯 Hire Validated Tech Professionals
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
                Access Pre-Vetted{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Tech Talent Pool
                </span>
              </h1>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 sm:mb-12 md:mb-16 text-gray-100 max-w-5xl mx-auto leading-relaxed font-light px-4"
                 style={{
                   textShadow: '0 0 20px rgba(255,255,255,0.1), 2px 2px 8px rgba(0,0,0,0.9)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Connect with <span className="text-lime-300 font-semibold">skilled tech professionals</span> who have proven their expertise through 
                <span className="text-green-300 font-semibold"> real project completions</span> and earned validated badges from 
                <span className="text-emerald-300 font-semibold"> Novice to Expert levels</span>.
              </p>
              
              {/* Floating Elements - Hidden on very small screens */}
              <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-lime-400/20 rounded-full blur-xl animate-bounce"></div>
              <div className="hidden sm:block absolute bottom-20 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="hidden sm:block absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </section>

          {/* Badge Progression System Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-600 p-6 sm:p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-pink-400/20 to-red-400/20 animate-pulse"></div>
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    How Our Talents Prove Their Skills
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-purple-100 font-light leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Each professional in our network has earned validated badges through successful project completions:
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 md:p-12">
                
                {/* Badge Progression Explanation */}
                <div className="text-center mb-12 sm:mb-16 md:mb-20">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 sm:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Progressive Skill Validation Through Real Projects
                  </h3>
                  <p className="text-gray-200 text-lg sm:text-xl max-w-4xl mx-auto leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Our talents grow from <span className="text-yellow-300 font-semibold">Novice to Expert</span> through hands-on experience. 
                    Each badge represents not just technical skills, but also proven soft skills like 
                    <span className="text-lime-300 font-semibold"> communication, problem-solving, and collaboration</span>.
                  </p>
                </div>
                
                {/* Badge Levels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16">
                  {[
                    { 
                      level: "Expert", 
                      projects: "15+", 
                      color: "from-green-500 to-emerald-600", 
                      icon: "🏆",
                      skills: ["Advanced technical expertise", "Team leadership", "Complex problem solving", "Mentoring abilities"],
                      bgColor: "from-green-500/10 to-emerald-500/10",
                      borderColor: "border-green-500/30"
                    },
                    { 
                      level: "Intermediate", 
                      projects: "8-14", 
                      color: "from-purple-500 to-indigo-600", 
                      icon: "⭐",
                      skills: ["Independent development", "Cross-functional collaboration", "Code optimization", "Quality assurance"],
                      bgColor: "from-purple-500/10 to-indigo-500/10",
                      borderColor: "border-purple-500/30"
                    },
                    { 
                      level: "Beginners", 
                      projects: "3-7", 
                      color: "from-blue-500 to-cyan-600", 
                      icon: "🎯",
                      skills: ["Core development skills", "Team participation", "Best practices", "Documentation"],
                      bgColor: "from-blue-500/10 to-cyan-500/10",
                      borderColor: "border-blue-500/30"
                    },
                    { 
                      level: "Novice", 
                      projects: "1-2", 
                      color: "from-yellow-500 to-orange-600", 
                      icon: "🌟",
                      skills: ["Basic technical skills", "Learning mindset", "Following guidance", "Eagerness to grow"],
                      bgColor: "from-yellow-500/10 to-orange-500/10",
                      borderColor: "border-yellow-500/30"
                    }
                  ].map((badge, index) => (
                    <div key={index} 
                         className="group transform hover:scale-105 transition-all duration-500">
                      
                      <div className={`bg-gradient-to-br ${badge.bgColor} backdrop-blur-sm rounded-2xl p-6 sm:p-8 border ${badge.borderColor} h-full flex flex-col`}>
                        
                        {/* Badge Header */}
                        <div className="text-center mb-6">
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r ${badge.color} flex items-center justify-center text-2xl sm:text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-2xl`}>
                            {badge.icon}
                          </div>
                          <h4 className="text-xl sm:text-2xl font-black text-white mb-2 group-hover:text-lime-300 transition-colors duration-300"
                              style={{
                                textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                            {badge.level}
                          </h4>
                          <div className={`bg-gradient-to-r ${badge.color} text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg inline-block`}>
                            {badge.projects} Projects
                          </div>
                        </div>
                        
                        {/* Skills List */}
                        <ul className="space-y-2 sm:space-y-3 flex-grow">
                          {badge.skills.map((skill, idx) => (
                            <li key={idx} 
                                className="flex items-start text-gray-200 text-sm sm:text-base group-hover:text-white transition-colors duration-300" 
                                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              <span className="text-lime-400 mr-2 sm:mr-3 text-xs flex-shrink-0 mt-1"
                                    style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
                                ✓
                              </span>
                              <span className="font-medium">{skill}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* Progress Indicator */}
                        <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${badge.color} transition-all duration-700 mt-4 rounded-full`}
                             style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Why Our Talents Stand Out */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Why Our{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Talents
                </span>{' '}
                Stand Out
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
              {[
                {
                  icon: "🎯",
                  title: "Real-World Experience",
                  description: "Our talents have completed actual projects, not just theoretical exercises. Each badge represents hands-on problem-solving experience.",
                  gradient: "from-lime-400 to-green-500"
                },
                {
                  icon: "🤝",
                  title: "Proven Soft Skills",
                  description: "Through collaborative projects, they've developed essential skills: communication, teamwork, analytical thinking, and professional interaction.",
                  gradient: "from-green-400 to-emerald-500"
                },
                {
                  icon: "📈",
                  title: "Continuous Growth",
                  description: "The badge progression system ensures ongoing skill development. You're hiring professionals committed to continuous improvement.",
                  gradient: "from-emerald-400 to-teal-500"
                },
                {
                  icon: "✅",
                  title: "Validated Expertise",
                  description: "Every skill claim is backed by completed projects. No guesswork - you see exactly what they've accomplished.",
                  gradient: "from-blue-400 to-purple-500"
                },
                {
                  icon: "🏆",
                  title: "Industry-Ready",
                  description: "From day one, they understand professional workflows, code quality standards, and project delivery expectations.",
                  gradient: "from-purple-400 to-pink-500"
                },
                {
                  icon: "🔄",
                  title: "Adaptable & Reliable",
                  description: "Multi-project experience has taught them to adapt to different technologies, teams, and project requirements efficiently.",
                  gradient: "from-pink-400 to-red-500"
                }
              ].map((feature, index) => (
                <div key={index} 
                     className="group transform hover:scale-105 transition-all duration-500 cursor-pointer">
                  
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl h-full flex flex-col">
                    
                    {/* Icon */}
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 text-center transform group-hover:scale-125 transition-all duration-500"
                         style={{filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.8))'}}>
                      {feature.icon}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 text-white group-hover:text-lime-300 transition-colors duration-500 text-center" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-200 leading-relaxed text-center text-sm sm:text-base flex-grow" 
                       style={{
                         textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      {feature.description}
                    </p>
                    
                    {/* Animated Underline */}
                    <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${feature.gradient} transition-all duration-700 mt-6 rounded-full`}
                         style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Direct Access CTA Section - UPDATED */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 p-6 sm:p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-lime-400/20 via-green-400/20 to-emerald-400/20 animate-pulse"></div>
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    🎯 Access Our Talent Directory!
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-lime-100 font-light leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Browse our validated tech talent pool with access to professional profiles.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 md:p-12">
                <div className="max-w-4xl mx-auto text-center">
                  
                  {/* Benefits List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
                    {[
                      {
                        icon: "📊",
                        title: "Access",
                        description: "Browse as many detailed profiles as you need to find the perfect talent"
                      },
                      {
                        icon: "⚡",
                        title: "Quick Registration",
                        description: "Simple sign-up process to start accessing our talent pool immediately"
                      },
                      {
                        icon: "🔍",
                        title: "Detailed Profiles",
                        description: "View comprehensive skills, badges, projects, and contact information"
                      }
                    ].map((benefit, index) => (
                      <div key={index} className="bg-gradient-to-br from-lime-500/10 to-green-500/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-lime-500/20">
                        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{benefit.icon}</div>
                        <h3 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3"
                            style={{
                              textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          {benefit.title}
                        </h3>
                        <p className="text-gray-200 text-sm sm:text-base"
                           style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                          {benefit.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Main CTA Button */}
                  <div className="mb-6 sm:mb-8">
                    <Link
                      to="/members"
                      className="group relative inline-block bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-full font-black text-lg sm:text-xl md:text-2xl transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden"
                      style={{
                        boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif',
                        textDecoration: 'none'
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                      <span className="relative flex items-center justify-center">
                        Browse Talent Directory
                        <span className="ml-2 sm:ml-4 group-hover:translate-x-2 transition-transform text-xl sm:text-2xl md:text-3xl">🚀</span>
                      </span>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Link>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-white/20">
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className="font-bold text-lime-300">What You'll Get:</span> Professional profiles with validated skills, completed projects, earned badges, and direct contact information. Full access to our entire talent directory.
                    </p>
                  </div>
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
                AI-powered career transformation with real projects and badge validation.
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
                  <Link to="/members" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
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

export default CareerContact;
