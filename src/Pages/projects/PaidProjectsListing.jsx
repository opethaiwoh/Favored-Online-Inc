// src/Pages/projects/PaidProjectsListing.jsx - PAID PROJECTS LISTING
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const PaidProjectsListing = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    projectType: '',
    budget: '',
    timeline: '',
    experience: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);

  // Authentication Check - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: '/paid-projects', message: 'Please sign in to view paid projects' }
      });
    }
  }, [currentUser, authLoading, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch projects from Firebase - Only if authenticated
  useEffect(() => {
    if (authLoading || !currentUser) {
      return;
    }

    const fetchProjects = async () => {
      try {
        const q = query(
          collection(db, 'paid_projects'),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('📊 Total approved projects found:', snapshot.docs.length);
          
          const projectsData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              deadline: data.deadline?.toDate?.()?.toISOString() || null,
              // Add computed fields
              isOwner: data.posterId === currentUser.uid,
              applicationCount: data.applications?.length || 0
            };
          });

          // Filter out expired projects (past deadline)
          const currentTime = new Date();
          const activeProjects = projectsData.filter(project => 
            !project.deadline || new Date(project.deadline) > currentTime
          );

          console.log('🎯 Active projects:', activeProjects.length);
          setProjects(activeProjects);
          setFilteredProjects(activeProjects);
          setLoading(false);
        }, (error) => {
          console.error('❌ Error fetching projects from Firebase:', error);
          setProjects([]);
          setFilteredProjects([]);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setProjects([]);
        setFilteredProjects([]);
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentUser, authLoading]);

  useEffect(() => {
    // Filter projects based on search and filters
    let filtered = projects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.skills?.join(' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
                           project.recruiterCompany?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !selectedFilters.projectType || project.projectType === selectedFilters.projectType;
      const matchesExperience = !selectedFilters.experience || project.experienceLevel === selectedFilters.experience;
      
      // Budget filter
      let matchesBudget = true;
      if (selectedFilters.budget) {
        const budget = project.budget;
        switch (selectedFilters.budget) {
          case 'under-1k':
            matchesBudget = budget < 1000;
            break;
          case '1k-5k':
            matchesBudget = budget >= 1000 && budget <= 5000;
            break;
          case '5k-10k':
            matchesBudget = budget >= 5000 && budget <= 10000;
            break;
          case 'over-10k':
            matchesBudget = budget > 10000;
            break;
          default:
            matchesBudget = true;
        }
      }
      
      // Timeline filter
      let matchesTimeline = true;
      if (selectedFilters.timeline && project.deadline) {
        const projectDeadline = new Date(project.deadline);
        const now = new Date();
        const daysDiff = Math.ceil((projectDeadline - now) / (1000 * 60 * 60 * 24));
        
        switch (selectedFilters.timeline) {
          case 'urgent':
            matchesTimeline = daysDiff <= 7;
            break;
          case 'this-month':
            matchesTimeline = daysDiff <= 30;
            break;
          case 'next-month':
            matchesTimeline = daysDiff > 30 && daysDiff <= 60;
            break;
          case 'flexible':
            matchesTimeline = daysDiff > 60;
            break;
          default:
            matchesTimeline = true;
        }
      }

      return matchesSearch && matchesType && matchesBudget && matchesTimeline && matchesExperience;
    });

    setFilteredProjects(filtered);
  }, [projects, searchQuery, selectedFilters]);

  // Navigation helper function
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      projectType: '',
      budget: '',
      timeline: '',
      experience: ''
    });
    setSearchQuery('');
  };

  // Format budget display
  const formatBudget = (budget) => {
    if (budget >= 1000) {
      return `$${(budget / 1000).toFixed(0)}k`;
    }
    return `$${budget.toLocaleString()}`;
  };

  // Format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return 'Flexible timeline';
    
    const date = new Date(deadline);
    const now = new Date();
    const daysDiff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'Expired';
    if (daysDiff === 0) return 'Due today';
    if (daysDiff === 1) return 'Due tomorrow';
    if (daysDiff <= 7) return `Due in ${daysDiff} days`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle project application
  const handleApply = (project) => {
    const subject = `Application for: ${project.title}`;
    const body = `Hi ${project.recruiterName},

I'm interested in applying for your project: "${project.title}"

About me:
[Please describe your relevant experience and why you're a good fit]

Portfolio/Previous Work:
[Include links to relevant work]

Availability:
[Your availability for this project]

Questions:
[Any questions about the project requirements]

Best regards,
${currentUser.displayName || currentUser.email}`;

    if (project.recruiterWebsite) {
      // Open website in new tab and also prepare email
      window.open(project.recruiterWebsite, '_blank');
      setTimeout(() => {
        window.open(`mailto:${project.recruiterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
      }, 1000);
    } else {
      // Just open email
      window.open(`mailto:${project.recruiterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    }
  };

  // Handle project editing
  const handleEdit = (project) => {
    setEditingProject(project.id);
    navigate(`/submit-paid-project?edit=${project.id}`);
  };

  // Handle delete request (requires admin approval)
  const handleDeleteRequest = async (project) => {
    try {
      const projectRef = doc(db, 'paid_projects', project.id);
      await updateDoc(projectRef, {
        deleteRequested: true,
        deleteRequestedAt: new Date(),
        deleteRequestedBy: currentUser.uid
      });
      
      toast.success('Delete request submitted! Admin will review your request.');
      setShowDeleteModal(null);
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast.error('Failed to submit delete request. Please try again.');
    }
  };

  const getProjectIcon = (type) => {
    const iconMap = {
      'web-development': '🌐',
      'mobile-app': '📱',
      'design': '🎨',
      'data-science': '📊',
      'ai-ml': '🤖',
      'devops': '⚙️',
      'consulting': '💼',
      'other': '💻'
    };
    return iconMap[type] || '💻';
  };

  const getExperienceColor = (level) => {
    const colorMap = {
      'entry': 'text-green-400 bg-green-500/20',
      'mid': 'text-yellow-400 bg-yellow-500/20',
      'senior': 'text-red-400 bg-red-500/20',
      'expert': 'text-purple-400 bg-purple-500/20'
    };
    return colorMap[level] || 'text-gray-400 bg-gray-500/20';
  };

  // Show loading screen while checking authentication or loading data
  if (authLoading || (currentUser && loading)) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('/Images/backg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div 
          className="fixed inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
          }}
        />
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {authLoading ? 'Checking authentication...' : 'Loading paid projects...'}
          </p>
          {!authLoading && currentUser && (
            <p className="text-gray-300 text-sm mt-2">
              Welcome, {currentUser.displayName || currentUser.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Don't render the main content if user is not authenticated
  if (!currentUser) {
    return null;
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
              <Link 
                to="/community" 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                My Career
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>

              {/* Current Page Indicator */}
              <span className="text-lime-400 font-semibold text-sm lg:text-base px-3 py-1 bg-lime-400/10 rounded-full border border-lime-400/20"
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                💼 Paid Projects
              </span>
              
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
                
                <Link 
                  to="/community" 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                <Link to="/career/dashboard" 
                      className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                      onClick={() => setMobileMenuOpen(false)}>
                  My Career
                </Link>

                <Link to="/dashboard" 
                      className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                      onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>

                {/* Current Page Indicator for Mobile */}
                <span className="text-lime-400 font-semibold text-base sm:text-lg px-3 py-2 bg-lime-400/10 rounded-full border border-lime-400/20"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  💼 Paid Projects
                </span>
                
                <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
                  <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
                  </div>
                </div>
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
              
              {/* User Welcome Message */}
              <div className="mb-6 p-4 bg-gradient-to-r from-lime-500/10 to-green-500/10 rounded-xl border border-lime-500/20">
                <p className="text-lime-300 font-semibold">
                  👋 Welcome, {currentUser.displayName || currentUser.email}! Find your next paid project below.
                </p>
              </div>
              
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
                  💼 Paid Tech Projects
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
                Find Paid{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Projects
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Connect with companies seeking talented developers and designers. 
                <span className="text-lime-300 font-semibold"> Find your next opportunity</span> to earn and grow.
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
                  placeholder="Search projects by title, company, skills, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-lg"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Project Type Filter */}
                <select
                  value={selectedFilters.projectType}
                  onChange={(e) => handleFilterChange('projectType', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Project Types</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="design">Design</option>
                  <option value="data-science">Data Science</option>
                  <option value="ai-ml">AI/ML</option>
                  <option value="devops">DevOps</option>
                  <option value="consulting">Consulting</option>
                </select>

                {/* Budget Filter */}
                <select
                  value={selectedFilters.budget}
                  onChange={(e) => handleFilterChange('budget', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Budgets</option>
                  <option value="under-1k">Under $1k</option>
                  <option value="1k-5k">$1k - $5k</option>
                  <option value="5k-10k">$5k - $10k</option>
                  <option value="over-10k">$10k+</option>
                </select>

                {/* Timeline Filter */}
                <select
                  value={selectedFilters.timeline}
                  onChange={(e) => handleFilterChange('timeline', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Timelines</option>
                  <option value="urgent">Urgent (1 week)</option>
                  <option value="this-month">This Month</option>
                  <option value="next-month">Next Month</option>
                  <option value="flexible">Flexible</option>
                </select>

                {/* Experience Filter */}
                <select
                  value={selectedFilters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Experience Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="expert">Expert Level</option>
                </select>
              </div>

              {/* Results Info and Clear Filters */}
              <div className="flex justify-between items-center">
                <div className="text-gray-300">
                  <span className="text-lime-300 font-semibold">{filteredProjects.length}</span> projects found
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

          {/* Projects Grid */}
          <section>
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
                <p className="text-gray-300 text-xl">Loading projects...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">💼</div>
                <h3 className="text-2xl font-bold text-white mb-4">No projects available</h3>
                <p className="text-gray-300 mb-8">Check back soon for new paid project opportunities!</p>
                <button 
                  onClick={() => handleNavigation('/submit-paid-project')}
                  className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl"
                  style={{
                    boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  Post a Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProjects.map((project) => (
                  <div key={project.id} className="group">
                    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500 h-full flex flex-col">
                      
                      {/* Project Header */}
                      <div className="mb-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-3">{getProjectIcon(project.projectType)}</span>
                            <span className="bg-white/10 text-lime-300 px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                              {project.projectType?.replace('-', ' ') || 'Project'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-bold">
                              {formatBudget(project.budget)}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${getExperienceColor(project.experienceLevel)}`}>
                              {project.experienceLevel?.replace('-', ' ') || 'Any Level'}
                            </span>
                          </div>
                        </div>
                        
                        <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-lime-300 transition-colors duration-300" 
                            style={{
                              textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          {project.title}
                        </h3>
                        
                        <div className="flex items-center text-gray-400 text-sm mt-3">
                          <span className="mr-4">🏢 {project.recruiterCompany}</span>
                          <span>⏰ {formatDeadline(project.deadline)}</span>
                        </div>
                      </div>

                      {/* Project Description */}
                      <div className="mb-6 flex-grow">
                        <p className="text-gray-200 leading-relaxed text-sm sm:text-base line-clamp-3" 
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                          {project.description}
                        </p>
                      </div>

                      {/* Skills */}
                      {project.skills && (
                        <div className="mb-6">
                          <div className="flex flex-wrap gap-2">
                            {project.skills.slice(0, 4).map((skill, index) => (
                              <span key={index} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                                {skill}
                              </span>
                            ))}
                            {project.skills.length > 4 && (
                              <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                                +{project.skills.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recruiter Info */}
                      <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-purple-300 font-semibold text-sm mb-2">👤 Contact Person</div>
                        <div className="text-white text-sm">
                          <div>{project.recruiterName}</div>
                          <div className="text-gray-300 text-xs mt-1">{project.recruiterEmail}</div>
                          {project.recruiterWebsite && (
                            <div className="text-blue-300 text-xs mt-1">🌐 {project.recruiterWebsite}</div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {/* Apply Button */}
                        <button
                          onClick={() => handleApply(project)}
                          className="w-full bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 hover:scale-105 text-white px-4 py-3 rounded-lg font-bold transition-all duration-300 shadow-xl flex items-center justify-center"
                          style={{
                            boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                            fontFamily: '"Inter", sans-serif'
                          }}
                        >
                          💼 Apply Now
                        </button>
                        
                        {/* Owner Actions */}
                        {project.isOwner && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleEdit(project)}
                              className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-2 rounded-lg font-semibold transition-all duration-300 border border-blue-500/30 text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(project)}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-2 rounded-lg font-semibold transition-all duration-300 border border-red-500/30 text-sm"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Call to Action for Posting Projects */}
          <section className="mt-16 text-center">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Need Help with a Project?
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
                 style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                Post your project and connect with talented developers and designers ready to help bring your ideas to life.
              </p>
              <button 
                onClick={() => handleNavigation('/submit-paid-project')}
                className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-12 py-4 rounded-full font-black text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl"
                style={{
                  boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                Post Your Project
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/80 via-gray-900/80 to-black/80 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Request Project Deletion</h3>
            <p className="text-gray-300 mb-6">
              This will submit a deletion request to the admin. Your project will remain visible until approved.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteRequest(showDeleteModal)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        /* Line clamp utility */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
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

export default PaidProjectsListing;
