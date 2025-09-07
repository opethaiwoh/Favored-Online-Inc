// src/Pages/career/PrivacyPolicy.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivacyPolicy = () => {
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
                  🔒 Your Privacy Matters to Us
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
                Privacy{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Policy
                </span>
              </h1>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Privacy Policy Content */}
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
                  Favored Online Inc. values your privacy and is committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard the data of individuals who engage with our tech skills development platform designed to empower individuals through hands-on, team-based projects and structured learning journeys.
                </p>
                
                {/* Updated Free Platform Badge */}
                <div className="bg-gradient-to-r from-lime-500/20 to-green-500/20 backdrop-blur-sm p-4 sm:p-6 rounded-xl border border-lime-500/30 mb-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎓</span>
                    <div>
                      <h3 className="text-lime-300 font-bold text-lg sm:text-xl mb-2">Currently Free Tech Skills Development Platform</h3>
                      <p className="text-gray-200 text-sm sm:text-base">
                        Favored Online Inc. currently offers free tech skills development through hands-on, team-based projects and structured learning journeys. We currently do not collect payment information, financial data, or billing details as our core services are provided at no cost. However, if we introduce premium features in the future, we may collect additional data necessary to provide those enhanced services.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Sections */}
              <div className="space-y-8 sm:space-y-10">
                
                {/* Section 1 - Updated */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    1. Information We Collect
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    We currently collect limited personal information necessary to help volunteer participants engage meaningfully in our tech skills development platform and hands-on learning experiences. This may include:
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-gray-200 text-sm sm:text-base mb-4">
                    {[
                      "Full name and email address",
                      "Tech skills and role preferences for volunteer projects and team-based collaboration",
                      "GitHub handles or LinkedIn profiles (if voluntarily provided for portfolio development)",
                      "Learning interests and volunteer project applications related to tech skills development",
                      "Basic usage data such as browser type, IP address, and device information to improve platform performance"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-lime-400 mr-3 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-yellow-200 text-sm sm:text-base font-medium">
                        <strong>Current Status:</strong> We currently do not collect any financial information, payment data, or billing details as our core tech skills development platform is free.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-200 text-sm sm:text-base font-medium">
                        <strong>Future Considerations:</strong> If we introduce premium features or advanced programs, we may collect additional information necessary to provide those services, such as payment information or enhanced profile data. Any such changes would be clearly communicated and require your consent.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 2 - Updated */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    2. How We Use Your Information
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    We currently use collected data to:
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-gray-200 text-sm sm:text-base mb-4">
                    {[
                      "Enable participation in currently free volunteer tech projects and hands-on learning programs",
                      "Facilitate team-based collaboration and structured learning journeys",
                      "Provide access to personalized dashboards and tech skills development profiles",
                      "Communicate relevant educational updates, volunteer opportunities, or platform news",
                      "Improve platform performance and enhance user learning experience",
                      "Ensure volunteer community safety and maintain a productive learning environment",
                      "Match participants with appropriate tech skills development opportunities based on skill level and interests"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-lime-400 mr-3 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-200 text-sm sm:text-base font-medium">
                      <strong>Future Use:</strong> If we introduce premium features, we may use data to provide enhanced services, process payments, deliver personalized experiences, or provide premium support. Any new uses would be clearly disclosed and require appropriate consent.
                    </p>
                  </div>
                </div>

                {/* Section 3 - Updated */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    3. Data Sharing and Disclosure
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    We do not sell, rent, or monetize your personal information in any way. As a platform that currently provides free tech skills development services, we have no commercial interest in selling your data. We may share limited information with trusted service providers who help us operate the platform, such as email services or hosting providers, but only under strict data protection agreements.
                  </p>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    If we introduce premium features in the future, we may need to share data with payment processors or other service providers necessary to deliver those enhanced services, but this would be done with appropriate safeguards and user consent.
                  </p>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    In rare cases, we may disclose information if legally required to do so.
                  </p>
                </div>

                {/* Section 4 */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    4. Data Security
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    We take appropriate technical and organizational measures to protect your personal information from unauthorized access, misuse, or loss. These measures include secure data storage, encryption where appropriate, and role-based access control. As our platform evolves and potentially introduces premium features, we will continue to implement security measures proportionate to the sensitivity of the data we collect and our expanding service offerings.
                  </p>
                </div>

                {/* Section 5 */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    5. Your Rights
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    You have the right to:
                  </p>
                  <ul className="space-y-2 sm:space-y-3 text-gray-200 text-sm sm:text-base mb-4">
                    {[
                      "Request access to your data",
                      "Correct or update any inaccurate information",
                      "Request deletion of your data (subject to volunteer platform participation constraints)",
                      "Withdraw consent at any time",
                      "Export your data for personal use or portfolio purposes",
                      "Opt out of any future premium features or services"
                    ].map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-lime-400 mr-3 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    To exercise any of these rights, please{' '}
                    <Link 
                      to="/career/support" 
                      className="text-lime-400 hover:text-lime-300 font-semibold underline decoration-lime-400/50 hover:decoration-lime-300 transition-all duration-300"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}
                    >
                      contact our support team
                    </Link>.
                  </p>
                </div>

                {/* Sections 6-9 - Updated */}
                {[
                  {
                    number: 6,
                    title: "Use of Cookies and Analytics",
                    content: "We may use cookies or basic analytics tools to monitor traffic, improve platform functionality, and understand how volunteer participants engage with our tech skills development resources and hands-on learning experiences. This helps us improve the educational experience we currently provide for free. If we introduce premium features, we may use additional analytics to enhance those services. You can manage cookie preferences through your browser settings."
                  },
                  {
                    number: 7,
                    title: "Third-Party Links and Educational Resources",
                    content: "Our platform may contain links to external educational sites, learning resources, or tools that support our tech skills development programs and team-based projects. We are not responsible for their privacy practices. Please review those policies independently before sharing any personal information. Any future premium features may include additional third-party integrations, which would be clearly disclosed."
                  },
                  {
                    number: 8,
                    title: "Data Retention",
                    content: "We retain your personal information only as long as necessary to provide our tech skills development services and fulfill the purposes outlined in this policy. When you request account deletion, we will remove your personal data while preserving anonymized learning analytics that help improve our platform for future volunteers. If premium features are introduced, retention periods may vary based on the specific services provided."
                  },
                  {
                    number: 9,
                    title: "Updates to This Policy",
                    content: "We may update this Privacy Policy periodically to reflect changes in our tech skills development services, introduction of premium features, or legal requirements. Any significant changes, especially those related to new data collection for premium services, will be prominently communicated to users. We encourage you to review this policy periodically to stay informed about how we protect your privacy."
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

                {/* New Section 10 - Contact Information */}
                <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-xl border border-white/10">
                  <h3 className="text-xl sm:text-2xl font-bold text-lime-300 mb-4 sm:mb-6"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
                    10. Contact Information
                  </h3>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed mb-4">
                    If you have any questions about this Privacy Policy, our data practices, or your privacy rights, please contact us through our{' '}
                    <Link 
                      to="/career/support" 
                      className="text-lime-400 hover:text-lime-300 font-semibold underline decoration-lime-400/50 hover:decoration-lime-300 transition-all duration-300"
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}
                    >
                      support page
                    </Link>.
                  </p>
                  <p className="text-gray-200 text-base sm:text-lg leading-relaxed">
                    We are committed to addressing your privacy concerns and will respond to your inquiries in a timely manner.
                  </p>
                </div>
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

      {/* Footer - Enhanced and Updated */}
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
                  <Link to="/career/terms" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/career/privacy" className="text-lime-400 font-bold transition-colors duration-300 text-sm sm:text-base"
                        style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'}}>
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
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">🔒</span>
                <span className="text-gray-300 text-sm font-medium"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Your Privacy Protected & Transparent
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

export default PrivacyPolicy;
