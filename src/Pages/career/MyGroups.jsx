// src/Pages/career/MyGroups.jsx 

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const MyGroups = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [groupEvents, setGroupEvents] = useState({});
  
  // ADD THIS LINE - Missing mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  // Fetch user's groups
  useEffect(() => {
    if (!currentUser) return;

    const memberQuery = query(
      collection(db, 'group_members'),
      where('userEmail', '==', currentUser.email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(memberQuery, async (snapshot) => {
      const membershipData = snapshot.docs.map(doc => doc.data());
      
      // Fetch group details for each membership
      const groupPromises = membershipData.map(async (membership) => {
        try {
          const groupDoc = await getDoc(doc(db, 'groups', membership.groupId));
          if (groupDoc.exists()) {
            return {
              ...groupDoc.data(),
              userRole: membership.role,
              joinedAt: membership.joinedAt?.toDate()
            };
          }
        } catch (error) {
          console.error('Error fetching group:', error);
        }
        return null;
      });

      const groups = await Promise.all(groupPromises);
      const validGroups = groups.filter(group => group !== null);
      
      // Sort groups: admin groups first, then by creation date
      validGroups.sort((a, b) => {
        if (a.userRole === 'admin' && b.userRole !== 'admin') return -1;
        if (b.userRole === 'admin' && a.userRole !== 'admin') return 1;
        return (b.createdAt?.toDate() || new Date()) - (a.createdAt?.toDate() || new Date());
      });
      
      setUserGroups(validGroups);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Fetch events for each group's project
  useEffect(() => {
    if (!currentUser || userGroups.length === 0) return;

    const fetchGroupEvents = async () => {
      try {
        // Get all approved events
        const eventsQuery = query(
          collection(db, 'tech_events'),
          where('status', '==', 'approved'),
          orderBy('eventDate', 'asc')
        );

        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
          const allEvents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            eventDate: doc.data().eventDate?.toDate?.() || new Date()
          }));

          // Filter out past events
          const currentTime = new Date();
          const upcomingEvents = allEvents.filter(event => 
            event.eventDate > currentTime
          );

          // Group events by project association
          const eventsByGroup = {};
          
          userGroups.forEach(group => {
            // Find events that are associated with this group's project
            const relatedEvents = upcomingEvents.filter(event => {
              return event.selectedProjectIds && 
                     event.selectedProjectIds.length > 0 &&
                     event.associatedProjects &&
                     event.associatedProjects.some(project => 
                       project.projectTitle === group.projectTitle ||
                       project.id === group.projectId
                     );
            });
            
            if (relatedEvents.length > 0) {
              eventsByGroup[group.id] = relatedEvents.slice(0, 3); // Limit to 3 events per group
            }
          });

          setGroupEvents(eventsByGroup);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching group events:', error);
        setGroupEvents({});
      }
    };

    fetchGroupEvents();
  }, [currentUser, userGroups]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completing':
        return '🟡';
      case 'completed':
        return '🎉';
      default:
        return '⚪';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completing':
        return 'Completing';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  // Check if user is an admin of any groups
  const isProjectOwner = userGroups.some(group => group.userRole === 'admin');

  // Helper function to format event dates
  const formatEventDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get event type icon
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

  // Helper function to add event to Google Calendar
  const addToGoogleCalendar = (event) => {
    const startDate = new Date(event.eventDate);
    const endDate = new Date(startDate.getTime() + (parseFloat(event.duration) * 60 * 60 * 1000));
    
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventTitle)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(`${event.eventDescription}\n\nJoin here: ${event.meetingUrl}`)}&location=${encodeURIComponent(event.meetingUrl)}`;
    
    window.open(calendarUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading your groups...</p>
        </div>
      </div>
    );
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

            {/* EVENTS LINK - Only for logged in users */}
            <Link to="/events" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              Events
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

              {/* EVENTS LINK FOR MOBILE */}
              <Link to="/events" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                Events
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
      <main className="flex-grow pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 animate-pulse">
              <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                   style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                    style={{
                      textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif',
                      letterSpacing: '0.1em'
                    }}>
                👥 Project Collaboration
              </span>
              <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                   style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                }}>
              My Project{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                    style={{
                      textShadow: 'none',
                      filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                      animation: 'glow 2s ease-in-out infinite alternate'
                    }}>
                Groups
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed" 
               style={{
                 textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                 fontFamily: '"Inter", sans-serif'
               }}>
              Collaborate with your project teams in dedicated workspaces. Share updates, discuss ideas, and track progress together.
            </p>

            {/* Quick Action Buttons Section - Enhanced with Event Submission */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 flex-wrap">
              {/* Project Owner Dashboard Button - Show if user owns any projects */}
              {isProjectOwner && (
                <Link 
                  to="/projects/owner-dashboard" 
                  className="inline-flex items-center bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-purple-600 hover:via-pink-600 hover:to-red-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-base sm:text-lg"
                  style={{
                    boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <span className="mr-2 sm:mr-3 text-xl">📊</span>
                  Project Dashboard
                  <span className="ml-2 sm:ml-3 text-xl">→</span>
                </Link>
              )}

              {/* Event Submission Button - Show for Project Owners/Mentors */}
              {isProjectOwner && (
                <Link 
                  to="/submit-event" 
                  className="inline-flex items-center bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-base sm:text-lg"
                  style={{
                    boxShadow: '0 0 30px rgba(249, 115, 22, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <span className="mr-2 sm:mr-3 text-xl">🎯</span>
                  Host Project Event
                  <span className="ml-2 sm:ml-3 text-xl">✨</span>
                </Link>
              )}

              {/* Events List Button - For all users */}
              <Link 
                to="/events" 
                className="inline-flex items-center bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-base sm:text-lg"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="mr-2 sm:mr-3 text-xl">📅</span>
                View All Events
                <span className="ml-2 sm:ml-3 text-xl">→</span>
              </Link>

              {/* My Groups Button - Current page indicator */}
              <span className="inline-flex items-center bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg opacity-60 cursor-default"
                style={{
                  boxShadow: '0 0 30px rgba(76, 175, 80, 0.2)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="mr-2 sm:mr-3 text-xl">👥</span>
                My Project Groups
                <span className="ml-2 sm:ml-3 text-xl">⭐</span>
              </span>
            </div>

            {/* Events Integration Info */}
            <div className="mb-8 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-blue-900/20 via-indigo-900/20 to-purple-900/20 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-blue-500/30">
                <div className="flex items-center justify-center mb-4">
                  <span className="text-2xl mr-3">📅</span>
                  <h3 className="text-lg sm:text-xl font-bold text-white">Project Events Integration</h3>
                  <span className="text-2xl ml-3">🎯</span>
                </div>
                <p className="text-gray-300 text-sm sm:text-base text-center mb-4">
                  Join project-related events directly from your group workspace. Each group shows upcoming events specifically designed for your project by mentors and project managers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">🔗 Quick Join</div>
                    <div className="text-gray-400 mt-1">Join events directly from group cards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-indigo-400 font-semibold">📅 Calendar Sync</div>
                    <div className="text-gray-400 mt-1">Add events to your personal calendar</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">🎯 Project-Focused</div>
                    <div className="text-gray-400 mt-1">Events tailored to your project's needs</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-1 w-24 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-12"
                 style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
          </section>

          {/* Groups Content */}
          <section>
            {userGroups.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-12 border border-white/20 max-w-2xl mx-auto">
                  <div className="text-8xl mb-8">👥</div>
                  <h3 className="text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    No Project Groups Yet
                  </h3>
                  <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                    You're not part of any project groups yet. Apply to projects or submit your own to get started with collaborative workspaces.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      to="/projects" 
                      className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                      style={{
                        boxShadow: '0 0 30px rgba(76, 175, 80, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      Browse Projects
                    </Link>
                    <Link 
                      to="/submit-project" 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                      style={{
                        boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      Submit Project
                    </Link>
                    <Link 
                      to="/projects/owner-dashboard" 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                      style={{
                        boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      📊 Owner Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-lime-400 mb-2">{userGroups.length}</div>
                    <div className="text-gray-300 font-semibold">Total Groups</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-yellow-400 mb-2">
                      {userGroups.filter(g => g.userRole === 'admin').length}
                    </div>
                    <div className="text-gray-300 font-semibold">Groups I Lead</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-green-400 mb-2">
                      {userGroups.filter(g => g.status === 'active').length}
                    </div>
                    <div className="text-gray-300 font-semibold">Active Projects</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-blue-400 mb-2">
                      {userGroups.filter(g => g.status === 'completed').length}
                    </div>
                    <div className="text-gray-300 font-semibold">Completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-orange-400 mb-2">
                      {Object.values(groupEvents).flat().length}
                    </div>
                    <div className="text-gray-300 font-semibold">Upcoming Events</div>
                  </div>
                </div>

                {/* Enhanced Quick Actions for Project Owners */}
                {isProjectOwner && (
                  <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-red-900/20 backdrop-blur-2xl rounded-2xl p-6 border border-purple-500/30 mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                          <span className="mr-3 text-2xl">👑</span>
                          Project Manager & Mentor Tools
                        </h3>
                        <p className="text-gray-400">Manage your projects, teams, and host educational events efficiently</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link 
                          to="/projects/owner-dashboard" 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-center"
                        >
                          📊 Project Dashboard
                        </Link>
                        <Link 
                          to="/submit-event" 
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-center"
                        >
                          🎯 Host Event
                        </Link>
                        <Link 
                          to="/events" 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-center"
                        >
                          📅 View Events
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {userGroups.map((group) => (
                    <div 
                      key={group.id} 
                      className="group bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:border-lime-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                      style={{
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                      }}
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl flex items-center justify-center text-black font-bold text-lg transform group-hover:scale-110 transition-transform duration-300">
                            {group.projectTitle.charAt(0).toUpperCase()}
                          </div>
                          {group.userRole === 'admin' && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30 animate-pulse">
                              👑 Admin
                            </span>
                          )}
                        </div>
                        
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center ${getStatusColor(group.status)}`}>
                          {getStatusIcon(group.status)} {getStatusLabel(group.status)}
                        </span>
                      </div>
                      
                      {/* Group Content */}
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-lime-400 transition-colors duration-300">
                          {group.projectTitle}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                          {group.description}
                        </p>
                      </div>
                      
                      {/* Group Stats */}
                      <div className="space-y-3 border-t border-gray-700 pt-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400 flex items-center">
                              👥 <span className="ml-1">{group.memberCount} members</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            📅 Joined {group.joinedAt?.toLocaleDateString() || 'Recently'}
                          </span>
                          {group.createdAt && (
                            <span>
                              Created {group.createdAt.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Related Events Section - NEW */}
                      {groupEvents[group.id] && groupEvents[group.id].length > 0 && (
                        <div className="mb-6 border-t border-gray-700 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-orange-400 font-semibold text-sm flex items-center">
                              🎯 <span className="ml-1">Upcoming Project Events</span>
                            </h4>
                            <Link 
                              to="/events"
                              className="text-xs text-lime-400 hover:text-white transition-colors"
                            >
                              View All
                            </Link>
                          </div>
                          
                          <div className="space-y-3 max-h-48 overflow-y-auto">
                            {groupEvents[group.id].map((event) => (
                              <div key={event.id} className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center mb-1">
                                      <span className="text-sm mr-2">{getEventIcon(event.eventType)}</span>
                                      <div className="font-medium text-orange-200 text-sm truncate">
                                        {event.eventTitle}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {formatEventDate(event.eventDate)}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      👤 {event.organizerName} • ⏱️ {event.duration}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 mt-3">
                                  {/* Add to Calendar */}
                                  <button
                                    onClick={() => addToGoogleCalendar(event)}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-2 py-1 rounded text-xs font-medium transition-all duration-300 border border-blue-500/30"
                                  >
                                    📅 Add to Calendar
                                  </button>
                                  
                                  {/* Join Event */}
                                  {event.meetingUrl && (
                                    <button
                                      onClick={() => window.open(event.meetingUrl, '_blank')}
                                      className="flex-1 bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 px-2 py-1 rounded text-xs font-medium transition-all duration-300 border border-lime-500/30"
                                    >
                                      🔗 Join Event
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <Link 
                              to="/events"
                              className="block w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 text-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 border border-orange-500/20"
                            >
                              🎯 View All Project Events
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {/* Main Group Link */}
                        <Link 
                          to={`/groups/${group.id}`}
                          className="block w-full bg-gradient-to-r from-lime-500 to-green-500 text-white text-center px-4 py-3 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                        >
                          View Group →
                        </Link>

                        {/* Event Creation for Admins */}
                        {group.userRole === 'admin' && group.status === 'active' && (
                          <Link 
                            to="/submit-event"
                            className="block w-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-center px-4 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm"
                          >
                            🎯 Host Project Event
                          </Link>
                        )}

                        {/* Completion Actions for Admins */}
                        {group.userRole === 'admin' && (
                          <>
                            {group.status === 'active' && (
                              <Link 
                                to={`/groups/${group.id}/complete`}
                                className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center px-4 py-2 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 text-sm"
                              >
                                🏁 Complete Project
                              </Link>
                            )}
                            
                            {group.status === 'completing' && (
                              <Link 
                                to={`/groups/${group.id}/complete`}
                                className="block w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-center px-4 py-2 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 text-sm animate-pulse"
                              >
                                ⏳ Continue Completion
                              </Link>
                            )}
                            
                            {group.status === 'completed' && (
                              <Link 
                                to={`/groups/${group.id}/complete`}
                                className="block w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm"
                              >
                                🎉 View Completion
                              </Link>
                            )}
                          </>
                        )}

                        {/* Completion Status for Members */}
                        {group.userRole !== 'admin' && group.status === 'completed' && (
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                            <div className="text-blue-400 font-semibold text-sm">🎉 Project Completed!</div>
                            <div className="text-gray-400 text-xs mt-1">Check your badges in profile</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
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
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Custom scrollbar for event sections */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(249, 115, 22, 0.5);
          border-radius: 2px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.7);
        }

        /* Smooth transitions for event cards */
        .event-card {
          transition: all 0.3s ease;
        }
        
        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(249, 115, 22, 0.2);
        }

        /* Mobile responsiveness for events */
        @media (max-width: 640px) {
          .event-grid {
            gap: 0.75rem;
          }
          
          .event-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MyGroups;
