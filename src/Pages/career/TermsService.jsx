// src/Pages/career/TermsService.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TermsService = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Get current date for automatic updates
  const getCurrentDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-6xl">
          
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
                  📋 Our Service Terms & Guidelines
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
                Terms of{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Service
                </span>
              </h1>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Terms of Service Content */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl">
              
              {/* Header Section */}
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4" 
                    style={{
                      textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                    Favored Online Inc.
                  </span>
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 font-medium"
                   style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Effective Date: {getCurrentDate()}
                </p>
              </div>

              {/* Introduction */}
              <div className="mb-8 sm:mb-10">
                <p className="text-lg sm:text-xl text-gray-200 leading-relaxed mb-6" 
                   style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                  Welcome to Favored Online Inc., a tech skills development platform designed to empower individuals through hands-on, team-based projects and structured learning journeys. By accessing or using our platform, you agree to abide by these Terms of Service. These Terms govern your use of the services, resources, and content provided by Favored Online Inc. for educational and portfolio development purposes.
                </p>
                
                <p className="text-lg sm:text-xl text-gray-200 leading-relaxed mb-6" 
                   style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                  If you do not agree to these Terms, please do not use the platform.
                </p>
                
                {/* Updated Free Platform Badge */}
                <div className="bg-gradient-to-r from-lime-500/20 to-green-500/20 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-lime-500/30 mb-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎓</span>
                    <div>
                      <h3 className="text-lime-300 font-bold text-lg sm:text-xl mb-2">Currently Free Tech Skills Development Platform</h3>
                      <p className="text-gray-200 text-sm sm:text-base">
                        Favored Online Inc. currently offers free tech skills development through hands-on, team-based projects and structured learning journeys. Our core features including project collaboration, portfolio building, and talent hiring are provided at no cost. However, we may introduce charges for additional premium features or programs in the future to enhance the platform experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Sections */}
              <div className="space-y-8 sm:space-y-10">
                
                {/* Section 1 - Eligibility */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    1. Eligibility
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    To use Favored Online Inc., you must be at least 13 years old or the age of digital consent in your jurisdiction. By using the platform, you confirm that you meet this requirement and understand that all participation is voluntary, currently unpaid, and focused on tech skills development through hands-on learning experiences.
                  </p>
                </div>

                {/* Section 2 - User Responsibilities */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    2. User Responsibilities
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    As a volunteer participant, you agree to:
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-gray-200 text-sm sm:text-base mb-4">
                    {[
                      "Provide accurate and complete information when signing up or submitting forms",
                      "Engage respectfully with others in all communication channels and team-based projects",
                      "Use the platform for its intended purposes: tech skills development, hands-on learning, collaboration, and portfolio building",
                      "Not impersonate another person or misrepresent your identity or skill level",
                      "Understand that participation is currently voluntary, educational in nature, and part of a structured learning journey"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-lime-400 mr-3 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    You are responsible for maintaining the confidentiality of any login credentials associated with your account.
                  </p>
                </div>

                {/* Section 3 - Platform Use and Conduct */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    3. Platform Use and Conduct
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    You may not:
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-gray-200 text-sm sm:text-base mb-4">
                    {[
                      "Upload malicious code, spam, or attempt unauthorized access to other users' data",
                      "Use the platform in any way that violates applicable laws or infringes on intellectual property",
                      "Misuse the platform for unauthorized purposes outside of tech skills development and learning",
                      "Attempt to commercialize or monetize access to the currently free platform or its resources"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-400 mr-3 mt-1">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-200 text-sm sm:text-base font-medium">
                      <strong>Warning:</strong> Violations of these terms may result in restricted access, suspension, or permanent removal from the platform.
                    </p>
                  </div>
                </div>

                {/* Section 4 - Intellectual Property */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    4. Intellectual Property
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    All content, tools, and materials provided by Favored Online Inc. are the intellectual property of Favored Online Inc. unless otherwise stated. You may not reproduce, distribute, or use any part of the platform's content for commercial use without written permission. Educational and personal use for learning purposes is encouraged.
                  </p>
                </div>

                {/* Section 5 - Current Free Services and Potential Future Charges */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    5. Current Free Services and Potential Future Charges
                  </h3>
                  
                  {/* Subsections */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">A. Currently Free Core Services:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        The following services are currently provided free of charge: project collaboration, team-based learning experiences, portfolio building tools, skill development resources, hiring platform access for both talent and organizations, and basic career development features. These core educational services form the foundation of our platform's mission.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">B. Potential Future Premium Features:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        While our core services remain free, we may introduce premium features or advanced programs that could incur charges. These might include specialized courses, one-on-one mentorship programs, premium project templates, advanced analytics tools, priority support services, or enhanced profile features. Any such additions would be clearly marked as premium services and would be entirely optional.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">C. Career Page and Platform Sustainability:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        While we currently absorb all operational costs for the career page and hiring platform, maintaining high-quality service requires ongoing investment in infrastructure, security, and features. If the need arises to implement access restrictions, enhanced security measures, or premium improvements to reduce overhead costs and ensure platform sustainability, some advanced career features may require charges in the future. We will provide adequate notice before implementing any such changes.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">D. Commitment to Free Education:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        Regardless of any future premium offerings, we remain committed to providing free access to essential learning opportunities, basic project collaboration, and core hiring platform functionality. Our mission is to remove barriers to tech education and career development, and this fundamental commitment will not change.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 6 - Free Volunteer Projects and Intellectual Property */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    6. Free Volunteer Projects and Intellectual Property
                  </h3>
                  
                  {/* Subsections */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">A. Educational Nature of All Projects:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        All projects on Favored Online Inc. are free volunteer opportunities designed for educational purposes, tech skills development, and portfolio building through hands-on, team-based learning experiences. No monetary compensation is provided for any project participation. Projects are intended as structured learning journeys and should not be used directly in production environments without proper review, additional development, and security considerations.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">B. Portfolio and Learning Rights:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        All volunteer participants retain the right to showcase their contributions in their personal portfolios, resumes, and professional profiles. This includes the right to reference projects, describe their role and contributions, and display work samples for career development purposes. Participants may use their project contributions as examples of their tech skills and experience when applying for jobs or educational opportunities.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">C. Project Ownership and Usage:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        Unless otherwise specified in a project agreement, volunteer projects are collaborative learning exercises designed to develop tech skills through hands-on experience. Project creators who submit ideas to the platform understand that the resulting work is primarily for educational benefit. Favored Online Inc. facilitates these learning opportunities but does not claim ownership of volunteer project outputs. Any commercial use of project results should be discussed and agreed upon by all project participants.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-semibold text-green-300 mb-3">D. Open Source and Learning Focus:</h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        We encourage open source practices and knowledge sharing. Many projects may be made publicly available for the broader learning community. Participants should be prepared for their contributions to be part of educational resources that benefit future learners. If you have concerns about sharing specific work, please discuss this with project coordinators before participating.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Updated Section 7 - For Organizations Interested in Hiring Talent */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    7. For Organizations Interested in Hiring Talent
                  </h3>
                  <div className="space-y-4">
                    
                    {/* Current Free Hiring */}
                    <div className="bg-gradient-to-r from-lime-500/20 to-green-500/20 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-lime-500/30 mb-6">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">💼</span>
                        <div>
                          <h4 className="text-lime-300 font-bold text-lg sm:text-xl mb-2">Currently Free Talent Hiring Platform</h4>
                          <p className="text-gray-200 text-sm sm:text-base">
                            Connecting with and hiring talent through Favored Online Inc. is currently completely free. There are presently no fees, commissions, or charges for organizations to discover, connect with, or hire talented individuals from our platform. However, to ensure platform sustainability and continued high-quality service, some advanced hiring features may require charges in the future.
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                      Organizations interested in hiring talent from our platform can currently browse participant profiles, view project portfolios, and connect with individuals who have demonstrated their skills through hands-on, team-based projects and structured learning journeys at no cost.
                    </p>
                    
                    <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                      All participants on our platform have voluntarily chosen to showcase their work and make themselves available for potential opportunities. Their project contributions, skill demonstrations, and portfolio pieces serve as authentic representations of their capabilities.
                    </p>

                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-green-300">Current Free Hiring Benefits:</h4>
                      <ul className="space-y-2 text-gray-200 text-sm sm:text-base">
                        {[
                          "No fees or commissions for hiring participants",
                          "Access to portfolios showcasing real project work",
                          "View demonstrated skills through collaborative team projects",
                          "Connect with individuals who have hands-on experience",
                          "Review authentic work samples from educational projects"
                        ].map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-lime-400 mr-3 mt-1">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <p className="text-orange-200 text-sm sm:text-base font-medium">
                        <strong>Future Considerations:</strong> While basic hiring platform access will remain free, advanced features such as enhanced search filters, detailed analytics, priority candidate matching, or premium support services may be introduced as optional paid features to help sustain and improve the platform.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sections 8-11 */}
                {[
                  {
                    number: 8,
                    title: "Third-Party Services",
                    content: "Our platform may link to third-party websites or services for educational purposes. Favored Online Inc. is not responsible for the content or privacy practices of those external platforms. Users engage with them at their own discretion and should review their respective terms of service."
                  },
                  {
                    number: 9,
                    title: "Educational Disclaimers",
                    content: "Please understand that: All projects are learning exercises and should not be used in production without proper review and additional development; Participation does not guarantee employment, certification, or specific career outcomes; The platform provides tech skills development opportunities but does not replace formal education or professional training; Project quality and outcomes may vary as they are created by volunteers for learning purposes through hands-on experience."
                  },
                  {
                    number: 10,
                    title: "Modifications and Termination",
                    content: "We reserve the right to modify or discontinue any part of the platform at any time with reasonable notice when possible. We may also revise these Terms from time to time, and continued use of the platform after such changes implies acceptance of the new Terms. As a platform that currently operates with free core services, some features may be subject to changes in availability or pricing structure to ensure long-term sustainability."
                  },
                  {
                    number: 11,
                    title: "General Disclaimers",
                    content: "Favored Online Inc. is provided as a tech skills development service without warranties or guarantees of any kind. We make no guarantees regarding uninterrupted access, error-free performance, or specific learning outcomes. We are not liable for any damages resulting from your use of the platform, and users participate at their own risk and discretion. While we currently provide many services free of charge, this does not create any obligation to maintain such pricing indefinitely."
                  }
                ].map((section) => (
                  <div key={section.number} className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                    <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                        style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                      {section.number}. {section.title}
                    </h3>
                    <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                ))}
              </div>

              {/* Last Updated */}
              <div className="mt-8 sm:mt-12 text-center">
                <div className="bg-gradient-to-r from-lime-500/10 to-green-500/10 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-lime-500/20">
                  <p className="text-lime-300 font-semibold text-base sm:text-lg">
                    Last updated: {getCurrentDate()}
                  </p>
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
                  Favored Online Inc.
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto md:mx-0"
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Tech skills development platform empowering individuals through hands-on, team-based projects and structured learning journeys - currently free with potential premium features.
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
                  <Link to="/career/terms" className="text-lime-400 font-bold transition-colors duration-300 text-sm sm:text-base"
                        style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
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
                © {new Date().getFullYear()} Favored Online Inc. All rights reserved.
              </p>

              {/* Social or Additional Info */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">📋</span>
                <span className="text-gray-300 text-sm font-medium"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Fair Terms & Transparent Guidelines
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

export default TermsService;
