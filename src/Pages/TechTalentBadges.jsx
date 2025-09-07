// src/Pages/TechTalentBadges.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const TechTalentBadges = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const { currentUser, isAuthorized } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Badge data structure
  const badgeCategories = [
    {
      id: 'techmo',
      badgeTitle: 'TechMO Badges',
      category: 'mentorship',
      subtitle: 'Awarded to Tech Mentors',
      image: '/Images/TechMO.png',
      companyName: 'TechTalents City',
      description: 'Awarded to Tech Mentors after the successful completion of each collaborative project. This badge marks the entry point for mentors demonstrating their capability to guide and support team members effectively in technical growth and project collaboration.',
      requiredSkills: 'Mentorship, Leadership, Technical Coaching, Team Development, Knowledge Transfer',
      badgeGoals: 'Build exceptional mentorship ability and experience, reserved for the most accomplished and skilled tech mentors who excel in developing technical talent.',
      postedDate: '2025-05-30T08:00:00Z',
      levels: ['Novice', 'Beginners', 'Intermediate', 'Expert']
    },
    {
      id: 'techqa',
      badgeTitle: 'TechQA Badges',
      category: 'quality-assurance',
      subtitle: 'Awarded to Quality Testers',
      image: '/Images/TechQA.png',
      companyName: 'TechTalents City',
      description: 'Awarded to Quality Testers who successfully complete their first collaboration on a project. This badge marks the entry point for quality assurance professionals demonstrating their capability to contribute effectively to ensuring software quality.',
      requiredSkills: 'Quality Assurance, Testing, Bug Detection, Test Automation, Software Validation',
      badgeGoals: 'Achieve exceptional quality assurance ability and experience, reserved for the most accomplished and skilled quality testers in their respective fields.',
      postedDate: '2025-05-29T08:00:00Z',
      levels: ['Novice', 'Beginners', 'Intermediate', 'Expert']
    },
    {
      id: 'techdev',
      badgeTitle: 'TechDev Badges',
      category: 'development',
      subtitle: 'Awarded to Coding Developers',
      image: '/Images/TechDev.png',
      companyName: 'TechTalents City',
      description: 'Awarded to Coding Developers who successfully complete their first collaboration on a project. This badge marks the entry point for coding professionals demonstrating their capability to contribute effectively to software development.',
      requiredSkills: 'Programming, Software Development, Code Review, Debugging, Technical Architecture',
      badgeGoals: 'Achieve exceptional coding ability and experience, reserved for the most accomplished and skilled coding developers in their respective fields.',
      postedDate: '2025-05-28T08:00:00Z',
      levels: ['Novice', 'Beginners', 'Intermediate', 'Expert']
    },
    {
      id: 'techleads',
      badgeTitle: 'TechLeads Badges',
      category: 'leadership',
      subtitle: 'Awarded to Non-Technical Professionals',
      image: '/Images/TechLeads.png',
      companyName: 'TechTalents City',
      description: 'Awarded to Non-Technical Professionals who successfully complete their first collaboration on a project. This badge marks the entry point for non-technical roles demonstrating their capability to create, lead, or manage projects or tasks within a project.',
      requiredSkills: 'Project Management, Leadership, Strategic Planning, Team Coordination, Business Analysis',
      badgeGoals: 'Achieve exceptional ability and experience in project leadership and management, reserved for the most accomplished and skilled professionals in their respective fields.',
      postedDate: '2025-05-27T08:00:00Z',
      levels: ['Novice', 'Beginners', 'Intermediate', 'Expert']
    },
    {
      id: 'techarchs',
      badgeTitle: 'TechArchs Badges',
      category: 'design',
      subtitle: 'Awarded to No-Code Developers and Designers',
      image: '/Images/TechArchs.png',
      companyName: 'TechTalents City',
      description: 'Awarded to No-Code Developers and Designers who successfully complete their first collaboration on a project. This badge marks the entry point for professionals demonstrating their capability to contribute effectively to tech projects using no-code platforms and design tools.',
      requiredSkills: 'No-Code Development, UI/UX Design, Visual Design, Platform Architecture, Creative Solutions',
      badgeGoals: 'Achieve exceptional ability and experience in no-code development and design, reserved for the most accomplished and skilled professionals in their respective fields.',
      postedDate: '2025-05-26T08:00:00Z',
      levels: ['Novice', 'Beginners', 'Intermediate', 'Expert']
    },
    {
      id: 'techguard',
      badgeTitle: 'TechGuard Badges',
      category: 'security',
      subtitle: 'Awarded to Network and Cybersecurity Professionals',
      image: '/Images/TechGuard.png',
      companyName: 'TechTalents City',
      description: 'Awarded to Network and Cybersecurity professionals, including Cloud Administrators and DevOps Engineers, who successfully complete their first collaboration on a project. This badge marks the entry point for professionals demonstrating their capability to implement and manage network and security tasks within a project effectively.',
      requiredSkills: 'Cybersecurity, Network Security, Cloud Administration, DevOps, Infrastructure Security',
      badgeGoals: 'Achieve exceptional expertise in securing and optimizing complex digital systems and infrastructures, reserved for the most accomplished professionals.',
      postedDate: '2025-05-25T08:00:00Z',
      levels: ['Novice', 'Beginners', 'Intermediate', 'Expert']
    }
  ];

  const categories = [
    { value: 'all', label: 'All Badge Categories' },
    { value: 'mentorship', label: 'Mentorship' },
    { value: 'quality-assurance', label: 'Quality Assurance' },
    { value: 'development', label: 'Development' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'design', label: 'Design & No-Code' },
    { value: 'security', label: 'Security & DevOps' }
  ];

  const filteredBadges = badgeCategories.filter(badge => {
    const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
    const matchesSearch = badge.badgeTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         badge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         badge.requiredSkills.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
  };

  const openBadgeModal = (badge) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  const closeBadgeModal = () => {
    setShowBadgeModal(false);
    setSelectedBadge(null);
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
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 sm:mb-24 pt-8 sm:pt-12 md:pt-20">
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
                  🏆 TechTalent Badges
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
                Discover Your{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Badge Path
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Advance your career with our innovative TechTalents badges, awarded based on completed projects.
                <span className="text-lime-300 font-semibold"> Showcase your achievements</span> and 
                <span className="text-lime-300 font-semibold"> build your reputation</span>.
              </p>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Search and Filters */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
              
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search badge categories by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-lg"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                
                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Results Info and Clear Filters */}
              <div className="flex justify-between items-center">
                <div className="text-gray-300">
                  <span className="text-lime-300 font-semibold">{filteredBadges.length}</span> badge categories found
                </div>
                <button
                  onClick={clearFilters}
                  className="text-lime-300 hover:text-white font-semibold transition-colors duration-300"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </section>

          {/* Badge Categories Grid */}
          <section>
            {filteredBadges.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-4">No badge categories found</h3>
                <p className="text-gray-300">Try adjusting your search or filters to see more results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredBadges.map((badge) => (
                  <div key={badge.id} className="group">
                    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500 h-full flex flex-col">
                      
                      {/* Badge Header */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center mb-4">
                            <img 
                              src={badge.image} 
                              alt={`${badge.badgeTitle} Icon`}
                              className="w-12 h-12 mr-4 object-contain"
                            />
                            <div>
                              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-lime-300 transition-colors duration-300" 
                                  style={{
                                    textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                                    fontFamily: '"Inter", sans-serif'
                                  }}>
                                {badge.badgeTitle}
                              </h3>
                              <p className="text-lime-300 font-semibold text-sm">{badge.subtitle}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-400 text-sm mb-4">
                          <span className="mr-4">🏢 {badge.companyName}</span>
                          <span>📅 {new Date(badge.postedDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Badge Description */}
                      <div className="mb-6 flex-grow">
                        <p className="text-gray-200 leading-relaxed text-sm sm:text-base line-clamp-4" 
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                          {badge.description}
                        </p>
                      </div>

                      {/* Skills Tags */}
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {badge.requiredSkills.split(', ').slice(0, 4).map((skill, index) => (
                            <span key={index} className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                              {skill}
                            </span>
                          ))}
                          {badge.requiredSkills.split(', ').length > 4 && (
                            <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                              +{badge.requiredSkills.split(', ').length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Badge Levels */}
                      <div className="mb-6">
                        <div className="text-gray-400 text-sm mb-2">Badge Levels:</div>
                        <div className="flex flex-wrap gap-2">
                          {badge.levels.map((level, index) => {
                            const colors = ['#FFC107', '#2196F3', '#9C27B0', '#4CAF50'];
                            return (
                              <span 
                                key={index}
                                className="px-2 py-1 rounded-lg text-xs font-medium text-white border"
                                style={{
                                  backgroundColor: `${colors[index]}20`,
                                  borderColor: `${colors[index]}50`,
                                  color: colors[index]
                                }}
                              >
                                {level}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => openBadgeModal(badge)}
                        className="group/btn relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-bold text-sm transition-all duration-500 transform hover:scale-105 shadow-xl overflow-hidden"
                        style={{
                          boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                          fontFamily: '"Inter", sans-serif'
                        }}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></span>
                        <span className="relative flex items-center justify-center">
                          View Badge Details
                          <span className="ml-2 group-hover/btn:translate-x-1 transition-transform text-lg">🏆</span>
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Become a Product Owner Section */}
          <section className="mt-16">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-6 sm:p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 via-red-400/20 to-pink-400/20 animate-pulse"></div>
                <div className="relative text-center">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    💡 Become a Product Owner
                  </h2>
                  <p className="text-lg sm:text-xl md:text-2xl text-orange-100 font-light leading-relaxed max-w-4xl mx-auto" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Lead your own project, build a team, and bring your ideas to life while others earn badges working with you.
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  
                  {/* How It Works */}
                  <div className="space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      🚀 How It Works
                    </h3>
                    <ol className="space-y-4 text-gray-200">
                      {[
                        'A Product Owner submits a project. They can be a developer or anyone with an idea—tech badges or niche categories are not required at this stage.',
                        'People apply to join the project.',
                        'Favored Online will review and approve collaborators, create the project channel, and add both you and the accepted team members.',
                        'The Product Owner leads the team and ensures that the Project Manager (or themselves, if acting as both) delivers the project within the given timeline.'
                      ].map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm mr-4 flex-shrink-0 mt-1">
                            {index + 1}
                          </span>
                          <span className="text-sm sm:text-base leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-6">
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      🏆 Benefits of Becoming a Product Owner
                    </h3>
                    <ul className="space-y-4 text-gray-200">
                      {[
                        'You own and lead the project',
                        'You choose the direction and vision for the work',
                        'If your project gains interest or attracts potential buyers, you will be the primary point of contact',
                        'You receive a Certificate of Ownership from Favored Online'
                      ].map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-400 mr-3 text-lg flex-shrink-0 mt-1"
                                style={{filter: 'drop-shadow(0 0 10px rgba(251, 146, 60, 0.8))'}}>
                            ✓
                          </span>
                          <span className="text-sm sm:text-base leading-relaxed font-medium">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="mt-12 bg-gradient-to-r from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-red-500/20">
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    📋 Responsibilities
                  </h3>
                  <ul className="space-y-4 text-gray-200">
                    {[
                      'While Favored Online promotes your project, you are also responsible for sharing and speaking about your idea across your personal platforms',
                      'Projects are for educational purposes only and must not be used for commercial or business activities. If a project demonstrates potential for commercialization, all team members will be contacted and involved, and appropriate legal processes will be carried out to ensure fair recognition and protection of contributions',
                      'Favored Online reserves the right to host project files in its repository to protect the interests of all contributors and to maintain transparent project records',
                      'Favored Online will also monitor your project timeline, provide light oversight, and may periodically check in to ensure steady progress and team alignment'
                    ].map((responsibility, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-400 mr-3 text-lg flex-shrink-0 mt-1"
                              style={{filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.8))'}}>
                          •
                        </span>
                        <span className="text-sm sm:text-base leading-relaxed">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tools & Guidelines */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-blue-500/20">
                    <h4 className="text-xl sm:text-2xl font-black text-white mb-4" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      🛠️ Tools & Collaboration Guidelines
                    </h4>
                    <ul className="space-y-3 text-gray-200 text-sm sm:text-base">
                      {[
                        'All projects must be executed within Favored Online\'s approved repositories and communication channels',
                        'Favored Online provides access to private GitHub repositories and dedicated discussion channels for each project',
                        'Product Owners and teams may use Google Meet or Zoom for virtual meetings',
                        'Final project submissions must be made to the assigned repository following provided instructions',
                        'External tools may not be used for project tracking or submissions unless explicitly approved'
                      ].map((guideline, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-400 mr-2 text-sm flex-shrink-0 mt-1">→</span>
                          <span>{guideline}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-6">
                    {/* Eligibility */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
                      <h4 className="text-xl font-black text-white mb-3" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        ✨ Eligibility
                      </h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        Anyone passionate about solving real-world problems—whether you're a student, developer, designer, or aspiring entrepreneur—can become a Product Owner. No prior badge or tech category is required.
                      </p>
                    </div>

                    {/* Time Commitment */}
                    <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/20">
                      <h4 className="text-xl font-black text-white mb-3" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        ⏰ Time Commitment
                      </h4>
                      <p className="text-gray-200 text-sm sm:text-base leading-relaxed">
                        Projects typically last <span className="text-yellow-300 font-semibold">4–8 weeks</span>, depending on scope. Product Owners are expected to guide the team and ensure milestones are achieved.
                      </p>
                    </div>

                    {/* Community Values */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                      <h4 className="text-xl font-black text-white mb-3" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        🤝 Community Values
                      </h4>
                      <p className="text-gray-200 text-sm mb-3">We expect all participants to:</p>
                      <ul className="space-y-2 text-gray-200 text-sm">
                        {[
                          'Foster a respectful and inclusive team culture',
                          'Communicate clearly and consistently',
                          'Credit every team member\'s contributions',
                          'Maintain professionalism throughout the project lifecycle'
                        ].map((value, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-purple-400 mr-2 text-xs flex-shrink-0 mt-1">•</span>
                            <span>{value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Project Manager Tips & Best Practices Section */}
          <section className="mt-12 sm:mt-16">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl lg:rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-600 p-4 sm:p-6 md:p-8 lg:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-cyan-400/20 to-blue-400/20 animate-pulse"></div>
                <div className="relative text-center">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-6 leading-tight" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    📋 Project Manager Tips & Best Practices
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-cyan-100 font-light leading-relaxed max-w-4xl mx-auto px-2 sm:px-4" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Master the art of project management with proven strategies and best practices for leading successful teams.
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 md:p-8 lg:p-12">
                
                {/* Core Responsibilities */}
                <div className="mb-8 sm:mb-10 md:mb-12">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-6 sm:mb-8 text-center sm:text-left" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    🎯 Core Responsibilities
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Weekly Planning & Reporting */}
                    <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-teal-500/20 hover:border-teal-500/40 transition-all duration-300">
                      <div className="text-teal-400 text-xl sm:text-2xl mb-2 sm:mb-3">📅</div>
                      <h4 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        Weekly Planning & Reporting
                      </h4>
                      <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                        Project managers organize weekly meetings to gather progress reports and strategize for the upcoming week toward project completion.
                      </p>
                    </div>

                    {/* Team Development */}
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
                      <div className="text-cyan-400 text-xl sm:text-2xl mb-2 sm:mb-3">🚀</div>
                      <h4 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        Team Development
                      </h4>
                      <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                        Project managers collaborate with mentors to organize workshops, webinars, and tech talks for the team.
                      </p>
                    </div>

                    {/* Team Member Support */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-5 lg:p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 sm:col-span-2 lg:col-span-1">
                      <div className="text-blue-400 text-xl sm:text-2xl mb-2 sm:mb-3">🤝</div>
                      <h4 className="text-lg sm:text-xl font-black text-white mb-2 sm:mb-3" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        Team Member Support
                      </h4>
                      <p className="text-gray-200 text-xs sm:text-sm leading-relaxed">
                        Project managers ensure team members have the resources, guidance, and support needed to succeed in their roles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Tips for Effective Project Management */}
                <div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-6 sm:mb-8 text-center sm:text-left" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    💡 Additional Tips for Effective Project Management
                  </h3>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                    
                    {/* Communication & Coordination */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-4 sm:mb-6" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        💬 Communication & Coordination
                      </h4>
                      <ul className="space-y-2 sm:space-y-3 text-gray-200 text-xs sm:text-sm lg:text-base">
                        {[
                          'Establish clear communication channels and response time expectations',
                          'Document decisions and action items from every meeting',
                          'Hold regular one-on-ones with team members to address individual concerns'
                        ].map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-emerald-400 mr-2 sm:mr-3 text-sm sm:text-lg flex-shrink-0 mt-0.5">•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Planning & Organization */}
                    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-4 sm:mb-6" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        📊 Planning & Organization
                      </h4>
                      <ul className="space-y-2 sm:space-y-3 text-gray-200 text-xs sm:text-sm lg:text-base">
                        {[
                          'Break down large tasks into smaller, manageable milestones',
                          'Create realistic timelines with buffer time for unexpected challenges',
                          'Identify and track project risks early, with mitigation plans',
                          'Set clear project scope and manage scope creep proactively'
                        ].map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-amber-400 mr-2 sm:mr-3 text-sm sm:text-lg flex-shrink-0 mt-0.5">•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Team Leadership */}
                    <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-4 sm:mb-6" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        👥 Team Leadership
                      </h4>
                      <ul className="space-y-2 sm:space-y-3 text-gray-200 text-xs sm:text-sm lg:text-base">
                        {[
                          'Foster a collaborative environment where team members feel comfortable sharing ideas and concerns',
                          'Recognize and celebrate achievements both big and small',
                          'Facilitate knowledge sharing between team members',
                          'Provide constructive feedback regularly, not just during formal reviews'
                        ].map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-violet-400 mr-2 sm:mr-3 text-sm sm:text-lg flex-shrink-0 mt-0.5">•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Process Improvement */}
                    <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-300">
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-4 sm:mb-6" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        🔄 Process Improvement
                      </h4>
                      <ul className="space-y-2 sm:space-y-3 text-gray-200 text-xs sm:text-sm lg:text-base">
                        {[
                          'Conduct retrospectives at the end of each sprint or milestone',
                          'Gather feedback from team members continuously',
                          'Stay updated on industry best practices and project management methodologies',
                          'Adapt your management style to different team members\' working preferences'
                        ].map((tip, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-rose-400 mr-2 sm:mr-3 text-sm sm:text-lg flex-shrink-0 mt-0.5">•</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Pro Tips Section */}
                <div className="mt-8 sm:mt-10 md:mt-12 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-300">
                  <h4 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-4 sm:mb-6 text-center sm:text-left" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    ⭐ Pro Tips for Success
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-gray-200">
                    <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
                      <h5 className="text-indigo-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
                        <span className="mr-2">🎯</span>
                        Stay Focused
                      </h5>
                      <p className="leading-relaxed text-xs sm:text-sm">
                        Keep the team aligned with project goals and regularly revisit objectives to ensure everyone stays on track.
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
                      <h5 className="text-purple-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
                        <span className="mr-2">🔥</span>
                        Maintain Momentum
                      </h5>
                      <p className="leading-relaxed text-xs sm:text-sm">
                        Celebrate small wins and maintain team energy through regular check-ins and positive reinforcement.
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
                      <h5 className="text-teal-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
                        <span className="mr-2">🛡️</span>
                        Risk Management
                      </h5>
                      <p className="leading-relaxed text-xs sm:text-sm">
                        Identify potential blockers early and have contingency plans ready to keep the project moving forward.
                      </p>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
                      <h5 className="text-cyan-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
                        <span className="mr-2">📈</span>
                        Continuous Learning
                      </h5>
                      <p className="leading-relaxed text-xs sm:text-sm">
                        Learn from each project and apply those lessons to improve your project management skills continuously.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action for Projects */}
          <section className="mt-16 text-center">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                🚀 Ready to Lead a Project or Earn Your Badges?
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed"
                 style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                💡 Have an idea? Take the lead and build something impactful—or join a project, contribute your skills, and earn badges as you grow. Whether you're leading or learning, <span className="text-lime-300 font-semibold">Favored Online gives you the platform to build your portfolio and your future</span>.
              </p>
              <div className="text-white text-lg mb-8 font-semibold">
                <span className="text-orange-300">Submit Your Project</span> or <span className="text-lime-300">Join a Project</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  to="/projects"
                  className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-black text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl inline-block"
                  style={{
                    boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  Join a Project
                </Link>
                <Link 
                  to="/submit-project"
                  className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white px-8 py-4 rounded-full font-black text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl inline-block"
                  style={{
                    boxShadow: '0 0 40px rgba(251, 146, 60, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  Submit Your Project
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Badge Details Modal */}
      {showBadgeModal && selectedBadge && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <img 
                  src={selectedBadge.image} 
                  alt={`${selectedBadge.badgeTitle} Icon`}
                  className="w-16 h-16 mr-4 object-contain"
                />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    {selectedBadge.badgeTitle}
                  </h2>
                  <p className="text-lime-300 font-semibold">{selectedBadge.subtitle}</p>
                </div>
              </div>
              <button
                onClick={closeBadgeModal}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Badge Content */}
            <div className="space-y-6">
              
              {/* Description */}
              <div>
                <h3 className="text-lime-300 font-semibold mb-2 text-lg">About This Badge</h3>
                <p className="text-gray-200 leading-relaxed">{selectedBadge.description}</p>
              </div>

              {/* Required Skills */}
              <div>
                <h3 className="text-lime-300 font-semibold mb-2 text-lg">Key Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBadge.requiredSkills.split(', ').map((skill, index) => (
                    <span 
                      key={index}
                      className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm border border-white/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Badge Goals */}
              <div>
                <h3 className="text-lime-300 font-semibold mb-2 text-lg">Badge Goals</h3>
                <p className="text-gray-200 leading-relaxed">{selectedBadge.badgeGoals}</p>
              </div>

              {/* Badge Levels */}
              <div>
                <h3 className="text-lime-300 font-semibold mb-3 text-lg">Badge Progression Levels</h3>
                <div className="space-y-3">
                  {selectedBadge.levels.map((level, index) => {
                    const colors = ['#FFC107', '#2196F3', '#9C27B0', '#4CAF50'];
                    const descriptions = [
                      'Entry level - First successful project collaboration',
                      'Experienced - 5+ completed projects',
                      'Advanced - 10+ completed projects with high proficiency',
                      'Expert - 15+ completed projects with exceptional skills'
                    ];
                    return (
                      <div key={index} className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                        <div 
                          className="w-4 h-4 rounded-full mr-3 shadow-lg"
                          style={{
                            backgroundColor: colors[index],
                            boxShadow: `0 0 10px ${colors[index]}50`
                          }}
                        ></div>
                        <div>
                          <div className="font-semibold text-white">{level}</div>
                          <div className="text-gray-400 text-sm">{descriptions[index]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={closeBadgeModal}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-white/20"
                >
                  Close
                </button>
                <Link
                  to="/projects"
                  onClick={closeBadgeModal}
                  className="flex-1 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-bold transition-all duration-500 transform hover:scale-105 shadow-xl text-center"
                  style={{
                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  Start Earning This Badge
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

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
        
        /* Custom scrollbar */
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

        /* Line clamp utility */
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Enhanced form styles */
        input:focus, textarea:focus, select:focus {
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
        
        select option {
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default TechTalentBadges;
