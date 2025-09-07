// src/Pages/applications/SubmitApplication.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SubmitApplication = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    experience: '',
    motivation: '',
    portfolio: '',
    skills: '',
    availability: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Submit to Firebase
      await addDoc(collection(db, 'applications'), {
        userId: currentUser.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: currentUser.email,
        phone: formData.phone,
        status: 'submitted',
        applicationData: {
          experience: formData.experience,
          motivation: formData.motivation,
          portfolio: formData.portfolio,
          skills: formData.skills,
          availability: formData.availability
        },
        submittedAt: serverTimestamp()
      });

      setSubmitStatus('success');
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        experience: '',
        motivation: '',
        portfolio: '',
        skills: '',
        availability: ''
      });

    } catch (error) {
      console.error('Submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation helper function
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  if (!currentUser) {
    return null; // Will redirect via useEffect
  }

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
            <div className="max-w-4xl mx-auto text-center">
              
              {/* Animated Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-pulse">
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em'
                      }}>
                  🚀 Join Our Community
                </span>
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Submit Your{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Application
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Apply to join our community of talented developers and tech professionals. 
                <span className="text-lime-300 font-semibold"> Get access to exclusive opportunities</span> and connect with industry leaders.
              </p>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Application Form */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl">
              
              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="text-green-400 text-2xl mr-4">✅</div>
                    <div>
                      <h3 className="text-green-400 font-bold text-lg mb-2">Application Submitted Successfully!</h3>
                      <p className="text-gray-200">Thank you for your application. Our team will review it and get back to you within 3-5 business days.</p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="text-red-400 text-2xl mr-4">❌</div>
                    <div>
                      <h3 className="text-red-400 font-bold text-lg mb-2">Submission Failed</h3>
                      <p className="text-gray-200">There was an error submitting your application. Please try again or contact support.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Personal Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Personal Information
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* First Name */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter your first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter your last name"
                      />
                    </div>

                    {/* Email (pre-filled) */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-6 py-4 text-gray-400 cursor-not-allowed"
                      />
                      <p className="text-gray-400 text-sm mt-2">This is your account email and cannot be changed</p>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Professional Background
                  </h2>

                  {/* Experience */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Professional Experience *
                    </label>
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="Describe your professional experience, including roles, companies, and key achievements..."
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Technical Skills & Technologies *
                    </label>
                    <textarea
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="List your technical skills, programming languages, frameworks, tools, and technologies you're proficient in..."
                    />
                  </div>

                  {/* Portfolio */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Portfolio/Website URL
                    </label>
                    <input
                      type="url"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="https://your-portfolio.com"
                    />
                  </div>
                </div>

                {/* Motivation & Availability */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Motivation & Availability
                  </h2>

                  {/* Motivation */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Why do you want to join our community? *
                    </label>
                    <textarea
                      name="motivation"
                      value={formData.motivation}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="Tell us why you're interested in joining our community and what you hope to achieve..."
                    />
                  </div>

                  {/* Availability */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Availability for Projects
                    </label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                    >
                      <option value="">Select your availability</option>
                      <option value="full-time">Full-time (40+ hours/week)</option>
                      <option value="part-time">Part-time (20-39 hours/week)</option>
                      <option value="freelance">Freelance/Contract (Flexible)</option>
                      <option value="weekends">Weekends Only</option>
                      <option value="evenings">Evenings Only</option>
                      <option value="flexible">Flexible Schedule</option>
                    </select>
                  </div>
                </div>

                {/* Application Guidelines */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-blue-300 font-bold text-lg mb-4">📋 Application Guidelines</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• <strong>Be authentic:</strong> Tell us your real story and motivations</li>
                    <li>• <strong>Showcase your skills:</strong> Highlight relevant experience and projects</li>
                    <li>• <strong>Community focus:</strong> We value collaborative and helpful members</li>
                    <li>• <strong>Review process:</strong> Applications are reviewed within 3-5 business days</li>
                    <li>• <strong>Follow up:</strong> You'll receive an email notification about your application status</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.firstName.trim() || !formData.lastName.trim() || !formData.experience.trim() || !formData.motivation.trim()}
                    className="group relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-12 py-6 rounded-full font-black text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="relative flex items-center">
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          Submit Application
                          <span className="ml-4 group-hover:translate-x-2 transition-transform text-2xl">🚀</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                  
                  <p className="text-gray-400 text-sm mt-6" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    * Required fields. Your application will be reviewed by our team and you'll hear back within 3-5 business days.
                  </p>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Footer - Same as your existing components */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mb-8 sm:mb-12">
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
                  <Link to="/community" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Community
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

          <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-300 text-sm sm:text-base" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                © {new Date().getFullYear()} Favored Online. All rights reserved.
              </p>

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

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default SubmitApplication;
