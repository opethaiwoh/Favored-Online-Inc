// src/Pages/events/EventsListing.jsx - UPDATED WITH START & END DATES
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const EventsListing = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({
    eventType: '',
    timeframe: '',
    format: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Authentication Check - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: '/events', message: 'Please sign in to view tech events' }
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

  // Fetch events from Firebase - Only if authenticated
  useEffect(() => {
    if (authLoading || !currentUser) {
      return;
    }

    const fetchEvents = async () => {
      try {
        const q = query(
          collection(db, 'tech_events'),
          where('status', '==', 'approved'),
          orderBy('eventDate', 'asc') // Keep ordering by eventDate for backwards compatibility
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('📊 Total approved events found:', snapshot.docs.length);
          
          const eventsData = snapshot.docs.map(doc => {
            const data = doc.data();
            
            // Handle both new and legacy event date formats
            let startDate, endDate, eventDate;
            
            if (data.startDate && data.endDate) {
              // NEW FORMAT: Events with start and end dates
              startDate = data.startDate?.toDate?.()?.toISOString() || new Date(data.startDate).toISOString();
              endDate = data.endDate?.toDate?.()?.toISOString() || new Date(data.endDate).toISOString();
              eventDate = startDate; // Use start date as main event date for filtering
            } else {
              // LEGACY FORMAT: Events with single eventDate + duration
              eventDate = data.eventDate?.toDate?.()?.toISOString() || new Date().toISOString();
              startDate = eventDate;
              
              // Calculate end date from duration if available
              if (data.duration && data.durationMs) {
                endDate = new Date(new Date(startDate).getTime() + data.durationMs).toISOString();
              } else if (data.duration) {
                // Parse duration string to calculate end date
                endDate = calculateEndDateFromDuration(startDate, data.duration);
              } else {
                // Default to 1 hour if no duration specified
                endDate = new Date(new Date(startDate).getTime() + (60 * 60 * 1000)).toISOString();
              }
            }

            return {
              id: doc.id,
              ...data,
              eventDate: eventDate,
              startDate: startDate,
              endDate: endDate,
              submissionDate: data.submissionDate?.toDate?.()?.toISOString() || new Date().toISOString(),
              // Add computed fields for display
              isMultiDay: new Date(startDate).toDateString() !== new Date(endDate).toDateString(),
              computedDuration: calculateEventDuration(startDate, endDate)
            };
          });

          // Filter out past events (events that have completely ended)
          const currentTime = new Date();
          const upcomingEvents = eventsData.filter(event => 
            new Date(event.endDate) > currentTime
          );

          console.log('🎯 Upcoming events:', upcomingEvents.length);
          setEvents(upcomingEvents);
          setFilteredEvents(upcomingEvents);
          setLoading(false);
        }, (error) => {
          console.error('❌ Error fetching events from Firebase:', error);
          setEvents([]);
          setFilteredEvents([]);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setEvents([]);
        setFilteredEvents([]);
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentUser, authLoading]);

  // Helper function to calculate end date from duration string (for legacy events)
  const calculateEndDateFromDuration = (startDate, durationString) => {
    const start = new Date(startDate);
    const duration = durationString.toLowerCase();
    
    let minutes = 0;
    
    // Parse different duration formats
    if (duration.includes('minute')) {
      const match = duration.match(/(\d+)\s*minute/);
      minutes = match ? parseInt(match[1]) : 60;
    } else if (duration.includes('hour')) {
      const match = duration.match(/(\d+(?:\.\d+)?)\s*hour/);
      minutes = match ? parseFloat(match[1]) * 60 : 60;
    } else if (duration.includes('day')) {
      const match = duration.match(/(\d+)\s*day/);
      minutes = match ? parseInt(match[1]) * 24 * 60 : 60;
    } else {
      // Default to 1 hour
      minutes = 60;
    }
    
    return new Date(start.getTime() + (minutes * 60 * 1000)).toISOString();
  };

  // Helper function to calculate duration between start and end dates
  const calculateEventDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationMs = end - start;
    
    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      if (hours === 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      if (minutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  useEffect(() => {
    // Filter events based on search and filters
    let filtered = events.filter(event => {
      const matchesSearch = event.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.eventDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           event.tags?.join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = !selectedFilters.eventType || event.eventType === selectedFilters.eventType;
      const matchesFormat = !selectedFilters.format || event.format === selectedFilters.format;
      
      // Timeframe filter - use start date for filtering
      let matchesTimeframe = true;
      if (selectedFilters.timeframe) {
        const eventStartDate = new Date(event.startDate);
        const now = new Date();
        const daysDiff = Math.ceil((eventStartDate - now) / (1000 * 60 * 60 * 24));
        
        switch (selectedFilters.timeframe) {
          case 'this-week':
            matchesTimeframe = daysDiff <= 7;
            break;
          case 'this-month':
            matchesTimeframe = daysDiff <= 30;
            break;
          case 'next-month':
            matchesTimeframe = daysDiff > 30 && daysDiff <= 60;
            break;
          default:
            matchesTimeframe = true;
        }
      }

      return matchesSearch && matchesType && matchesFormat && matchesTimeframe;
    });

    setFilteredEvents(filtered);
  }, [events, searchQuery, selectedFilters]);

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
      eventType: '',
      timeframe: '',
      format: ''
    });
    setSearchQuery('');
  };

  // UPDATED: Format event date and time to show start and end
  const formatEventDateTime = (event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const isMultiDay = event.isMultiDay;
    
    if (isMultiDay) {
      // Multi-day event
      const startFormatted = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const endFormatted = endDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return {
        primary: `${startFormatted} - ${endFormatted}`,
        duration: event.computedDuration
      };
    } else {
      // Same day event
      const dateFormatted = startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const startTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return {
        primary: `${dateFormatted}`,
        time: `${startTime} - ${endTime}`,
        duration: event.computedDuration
      };
    }
  };

  const formatEventType = (type) => {
    const typeMap = {
      'workshop': 'Workshop',
      'webinar': 'Webinar',
      'talk': 'Talk/Panel',
      'conference': 'Conference',
      'meetup': 'Meetup'
    };
    return typeMap[type] || type;
  };

  const getEventIcon = (type) => {
    const iconMap = {
      'workshop': '🛠️',
      'webinar': '💻',
      'talk': '🎤',
      'conference': '🏢',
      'meetup': '👥'
    };
    return iconMap[type] || '📅';
  };

  // UPDATED: Google Calendar integration with start and end dates
  const addToGoogleCalendar = (event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const eventDetails = `${event.eventDescription}\n\n` +
                        `${event.learningObjectives ? `What you'll learn:\n${event.learningObjectives}\n\n` : ''}` +
                        `${event.requirements ? `Requirements:\n${event.requirements}\n\n` : ''}` +
                        `${event.meetingUrl ? `Join here: ${event.meetingUrl}` : ''}`;

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventTitle)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(eventDetails)}&location=${encodeURIComponent(event.meetingUrl || '')}`;
    
    window.open(calendarUrl, '_blank');
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
            {authLoading ? 'Checking authentication...' : 'Loading tech events...'}
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
                🎯 Tech Events
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
                  🎯 Tech Events
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
                  👋 Welcome, {currentUser.displayName || currentUser.email}! Discover amazing tech events below.
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
                  🎯 Tech Events & Learning
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
                Discover Tech{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Events
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Discover workshops, webinars, and talks from tech professionals worldwide. 
                <span className="text-lime-300 font-semibold"> Learn and grow</span> your skills.
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
                  placeholder="Search events by title, description, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-lg"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                
                {/* Event Type Filter */}
                <select
                  value={selectedFilters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Event Types</option>
                  <option value="workshop">Workshops</option>
                  <option value="webinar">Webinars</option>
                  <option value="talk">Talks & Panels</option>
                  <option value="conference">Conferences</option>
                </select>

                {/* Format Filter */}
                <select
                  value={selectedFilters.format}
                  onChange={(e) => handleFilterChange('format', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Formats</option>
                  <option value="online">Online</option>
                </select>

                {/* Timeframe Filter */}
                <select
                  value={selectedFilters.timeframe}
                  onChange={(e) => handleFilterChange('timeframe', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Timeframes</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="next-month">Next Month</option>
                </select>
              </div>

              {/* Results Info and Clear Filters */}
              <div className="flex justify-between items-center">
                <div className="text-gray-300">
                  <span className="text-lime-300 font-semibold">{filteredEvents.length}</span> events found
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

          {/* Events Grid */}
          <section>
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
                <p className="text-gray-300 text-xl">Loading events...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">📅</div>
                <h3 className="text-2xl font-bold text-white mb-4">No upcoming events</h3>
                <p className="text-gray-300 mb-8">Check back soon for new tech events, workshops, and webinars!</p>
                <button 
                  onClick={() => handleNavigation('/submit-event')}
                  className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl"
                  style={{
                    boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  Host Your Event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredEvents.map((event) => {
                  const dateTimeInfo = formatEventDateTime(event);
                  
                  return (
                    <div key={event.id} className="group">
                      <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500 h-full flex flex-col">
                        
                        {/* Event Header */}
                        <div className="mb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center mb-2">
                              <span className="text-2xl mr-3">{getEventIcon(event.eventType)}</span>
                              <span className="bg-white/10 text-lime-300 px-3 py-1 rounded-full text-sm font-medium border border-white/20">
                                {formatEventType(event.eventType)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                                {event.format}
                              </span>
                              {event.isMultiDay && (
                                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                                  Multi-day
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-lime-300 transition-colors duration-300" 
                              style={{
                                textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                            {event.eventTitle}
                          </h3>
                          
                          <div className="flex items-center text-gray-400 text-sm mt-3">
                            <span className="mr-4">👤 {event.organizerName}</span>
                            <span>⏱️ {dateTimeInfo.duration}</span>
                          </div>
                        </div>

                        {/* UPDATED: Event Date & Time Display */}
                        <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="text-lime-300 font-semibold text-sm mb-1">
                            📅 {event.isMultiDay ? 'Event Dates' : 'Event Date & Time'}
                          </div>
                          <div className="text-white text-sm">
                            <div>{dateTimeInfo.primary}</div>
                            {dateTimeInfo.time && (
                              <div className="text-gray-300 text-xs mt-1">{dateTimeInfo.time}</div>
                            )}
                          </div>
                        </div>

                        {/* Event Description */}
                        <div className="mb-6 flex-grow">
                          <p className="text-gray-200 leading-relaxed text-sm sm:text-base line-clamp-3" 
                             style={{
                               textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                               fontFamily: '"Inter", sans-serif'
                             }}>
                            {event.eventDescription}
                          </p>
                        </div>

                        {/* Learning Objectives */}
                        {event.learningObjectives && (
                          <div className="mb-4">
                            <div className="text-yellow-300 font-semibold text-sm mb-2">🎯 What You'll Learn</div>
                            <p className="text-gray-300 text-sm">{event.learningObjectives}</p>
                          </div>
                        )}

                        {/* Tags */}
                        {event.tags && (
                          <div className="mb-6">
                            <div className="flex flex-wrap gap-2">
                              {event.tags.slice(0, 4).map((tag, index) => (
                                <span key={index} className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                                  {tag}
                                </span>
                              ))}
                              {event.tags.length > 4 && (
                                <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                                  +{event.tags.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-3">
                          {/* Add to Calendar Button */}
                          <button
                            onClick={() => addToGoogleCalendar(event)}
                            className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-3 rounded-lg font-semibold transition-all duration-300 border border-blue-500/30 flex items-center justify-center"
                          >
                            📅 Add to Calendar
                          </button>
                          
                          {/* Join Meeting Button */}
                          {event.meetingUrl && (
                            <button
                              onClick={() => window.open(event.meetingUrl, '_blank')}
                              className="w-full bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 hover:scale-105 text-white px-4 py-3 rounded-lg font-bold transition-all duration-300 shadow-xl flex items-center justify-center"
                              style={{
                                boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                                fontFamily: '"Inter", sans-serif'
                              }}
                            >
                              🔗 Join Event Link
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Call to Action for Hosting Events */}
          <section className="mt-16 text-center">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Host Your Own Tech Event
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
                 style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                Share your expertise through workshops, webinars, or talks. Connect with the tech community and help others grow.
              </p>
              <button 
                onClick={() => handleNavigation('/submit-event')}
                className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-12 py-4 rounded-full font-black text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl"
                style={{
                  boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                Submit Your Event
              </button>
            </div>
          </section>
        </div>
      </main>

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

export default EventsListing;
