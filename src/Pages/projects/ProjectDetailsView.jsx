// src/Pages/projects/ProjectDetailsView.jsx - ENHANCED WITH EVENT INTEGRATION
// Individual Project Details View with Related Events

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const ProjectDetailsView = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userApplication, setUserApplication] = useState(null);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  useEffect(() => {
    if (currentUser && project) {
      checkUserApplication();
      checkIfProjectOwner();
    }
  }, [currentUser, project]);

  // Fetch events related to this project
  useEffect(() => {
    if (project) {
      fetchRelatedEvents();
    }
  }, [project]);

  const fetchProjectDetails = async () => {
    try {
      console.log('🔍 Fetching project details for:', projectId);
      
      const projectDoc = await getDoc(doc(db, 'client_projects', projectId));
      
      if (projectDoc.exists()) {
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        console.log('📊 Project data loaded:', projectData);
        setProject(projectData);
      } else {
        console.error('❌ Project not found');
        setError('Project not found');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      setError('Failed to load project details');
      setLoading(false);
    }
  };

  const fetchRelatedEvents = async () => {
    try {
      console.log('🎯 Fetching events related to project:', project.projectTitle);
      
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

        // Find events related to this specific project
        const projectRelatedEvents = upcomingEvents.filter(event => {
          return event.selectedProjectIds && 
                 event.selectedProjectIds.length > 0 &&
                 event.associatedProjects &&
                 event.associatedProjects.some(eventProject => 
                   eventProject.projectTitle === project.projectTitle ||
                   eventProject.id === project.id
                 );
        });

        console.log('📅 Found related events:', projectRelatedEvents.length);
        setRelatedEvents(projectRelatedEvents);
        setLoadingEvents(false);
      }, (error) => {
        console.error('❌ Error fetching related events:', error);
        setRelatedEvents([]);
        setLoadingEvents(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up events listener:', error);
      setRelatedEvents([]);
      setLoadingEvents(false);
    }
  };

  const checkUserApplication = async () => {
    if (!currentUser?.email || !projectId) return;

    try {
      const applicationsQuery = query(
        collection(db, 'project_applications'),
        where('projectId', '==', projectId),
        where('applicantEmail', '==', currentUser.email)
      );

      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      if (!applicationsSnapshot.empty) {
        const applicationData = applicationsSnapshot.docs[0].data();
        setUserApplication(applicationData);
        console.log('📝 User application found:', applicationData.status);
      }
    } catch (error) {
      console.error('❌ Error checking application:', error);
    }
  };

  const checkIfProjectOwner = () => {
    if (currentUser?.email && project?.contactEmail) {
      const isOwner = currentUser.email === project.contactEmail;
      setIsProjectOwner(isOwner);
      console.log('👤 Is project owner:', isOwner);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getApplicationStatusText = () => {
    if (!userApplication) return null;
    
    switch (userApplication.status) {
      case 'submitted':
        return '📝 Application Submitted - Pending Review';
      case 'under_review':
        return '👀 Application Under Review';
      case 'approved':
        return '✅ Application Approved - Welcome to the team!';
      case 'rejected':
        return '❌ Application Rejected';
      default:
        return '📝 Application Status: ' + userApplication.status;
    }
  };

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
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Project Not Found</h2>
          <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">{error || 'The project you are looking for does not exist.'}</p>
          <div className="space-y-3 sm:space-y-4">
            <Link 
              to="/projects"
              className="block bg-lime-500 hover:bg-lime-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              ← Back to Projects
            </Link>
          </div>
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

      {/* Header - Enhanced responsive design */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mr-2 sm:mr-3 lg:mr-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm sm:text-lg lg:text-2xl font-black text-white tracking-wide" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  <span className="hidden sm:inline">Favored Online</span>
                  <span className="sm:hidden">FO</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8">
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser ? (
                <>
                  <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>

                  <Link to="/events" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Events
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              ) : (
                <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              {currentUser ? (
                <div className="flex items-center space-x-2 xl:space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 xl:px-4 py-1 xl:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 xl:w-8 xl:h-8 rounded-full mr-2 xl:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs xl:text-sm text-white font-medium truncate max-w-16 xl:max-w-24" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 xl:px-8 py-2 xl:py-3 rounded-full text-xs xl:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
                >
                  <span className="mr-1 xl:mr-2 text-sm xl:text-lg">🚀</span>
                  Get Started
                </button>
              )}
            </nav>
            
            {/* Mobile/Tablet Menu Button */}
            <div className="lg:hidden flex items-center space-x-2">
              {/* User Avatar for Mobile */}
              {currentUser && (
                <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 py-1 border border-white/20">
                  {currentUser.photoURL && (
                    <img 
                      src={currentUser.photoURL} 
                      alt="Profile" 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full mr-1 sm:mr-2 ring-2 ring-lime-400/50" 
                    />
                  )}
                  <span className="text-xs text-white font-medium truncate max-w-12 sm:max-w-20" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    {(currentUser.displayName || currentUser.email).split(' ')[0]}
                  </span>
                </div>
              )}
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Enhanced Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 sm:mt-4 pb-4 sm:pb-6 rounded-2xl animate-fadeIn" 
                 style={{background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 sm:space-y-4 p-4 sm:p-6">
                
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2 px-3 rounded-lg hover:bg-white/5" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🏠 Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2 px-3 rounded-lg hover:bg-white/5" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      💼 My Career
                    </Link>

                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2 px-3 rounded-lg hover:bg-white/5" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      📊 Dashboard
                    </Link>

                    <Link to="/events" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2 px-3 rounded-lg hover:bg-white/5" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      📅 Events
                    </Link>

                    <span className="text-lime-400 font-semibold text-base sm:text-lg px-3 py-2 bg-lime-400/10 rounded-lg border border-lime-400/20"
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      📋 Project Details
                    </span>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2 px-3 rounded-lg hover:bg-white/5" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    💼 Career
                  </Link>
                )}
                
                {currentUser ? (
                  <div className="pt-3 sm:pt-4 border-t border-white/20">
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
      <main className="flex-grow pt-14 sm:pt-16 lg:pt-20 pb-8 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 max-w-7xl">
          
          {/* Back Navigation - Responsive */}
          <div className="mb-4 sm:mb-6">
            <Link 
              to={isProjectOwner ? "/projects/owner-dashboard" : "/projects"}
              className="text-lime-400 hover:text-lime-300 font-semibold transition-colors flex items-center text-sm sm:text-base"
            >
              ← Back to {isProjectOwner ? "My Projects" : "All Projects"}
            </Link>
          </div>

          {/* Project Header - Enhanced responsive */}
          <section className="mb-8 sm:mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
              
              {/* Project Title and Status */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 sm:mb-8">
                <div className="mb-4 sm:mb-6 lg:mb-0 flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4">
                    {project.projectTitle}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
                    <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusColor(project.status)}`}>
                      {project.status === 'approved' ? '✅ Approved' : 
                       project.status === 'active' ? '🟢 Active' :
                       project.status === 'pending' ? '⏳ Pending' : project.status}
                    </span>
                    
                    <span className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-500/20 text-blue-400 rounded-full text-xs sm:text-sm font-semibold border border-blue-500/30">
                      💼 {project.projectType}
                    </span>
                    
                    <span className="px-3 sm:px-4 py-1 sm:py-2 bg-purple-500/20 text-purple-400 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/30">
                      ⏰ {project.timeline}
                    </span>
                  </div>
                  
                  {isProjectOwner && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                      <div className="flex items-center text-yellow-400">
                        <span className="text-lg sm:text-xl mr-2">👑</span>
                        <span className="font-semibold text-sm sm:text-base">You own this project</span>
                      </div>
                    </div>
                  )}
                  
                  {userApplication && (
                    <div className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 ${getStatusColor(userApplication.status)}`}>
                      <div className="font-semibold text-sm sm:text-base">
                        {getApplicationStatusText()}
                      </div>
                      {userApplication.submittedAt && (
                        <div className="text-xs sm:text-sm mt-1 opacity-80">
                          Applied on {new Date(userApplication.submittedAt.seconds * 1000).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons - Responsive */}
                <div className="flex flex-col space-y-2 sm:space-y-3 lg:ml-8 w-full lg:w-auto">
                  {isProjectOwner ? (
                    <>
                      <Link 
                        to="/projects/owner-dashboard"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-center text-sm sm:text-base"
                      >
                        📊 Manage Project
                      </Link>
                      <Link 
                        to={`/projects/${projectId}/edit`}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 text-center text-sm sm:text-base"
                      >
                        ✏️ Edit Project
                      </Link>
                      <Link 
                        to="/submit-event"
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-center text-sm sm:text-base"
                      >
                        🎯 Host Event
                      </Link>
                    </>
                  ) : currentUser ? (
                    userApplication ? (
                      <div className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-center opacity-75 text-sm sm:text-base">
                        Application {userApplication.status}
                      </div>
                    ) : (
                      <Link 
                        to={`/projects/${projectId}/apply`}
                        className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 text-center text-sm sm:text-base"
                      >
                        🚀 Apply to Join
                      </Link>
                    )
                  ) : (
                    <Link 
                      to="/login"
                      className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 text-center text-sm sm:text-base"
                    >
                      Login to Apply
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Project Details Grid - Enhanced responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
              
              {/* Project Description */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">📋 Project Description</h2>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                  {project.projectDescription}
                </p>
              </div>

              {/* Required Skills */}
              {project.requiredSkills && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">🛠️ Required Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredSkills.split(',').map((skill, index) => (
                      <span 
                        key={index}
                        className="px-2 sm:px-3 py-1 bg-lime-500/20 text-lime-400 rounded-full text-xs sm:text-sm border border-lime-500/30"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Goals */}
              {project.projectGoals && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">🎯 Project Goals</h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                    {project.projectGoals}
                  </p>
                </div>
              )}

              {/* Related Events Section - NEW */}
              {relatedEvents.length > 0 && (
                <div className="bg-gradient-to-br from-orange-900/20 via-red-900/20 to-pink-900/20 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
                      🎯 <span className="ml-2">Related Project Events</span>
                    </h2>
                    <Link 
                      to="/events"
                      className="text-orange-400 hover:text-white transition-colors text-sm sm:text-base"
                    >
                      View All Events
                    </Link>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {relatedEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="bg-orange-500/10 border border-orange-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 event-card">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4">
                          <div className="flex-1 min-w-0 mb-3 sm:mb-0">
                            <div className="flex items-center mb-2">
                              <span className="text-base sm:text-lg mr-2">{getEventIcon(event.eventType)}</span>
                              <div className="font-bold text-orange-200 text-sm sm:text-base truncate">
                                {event.eventTitle}
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 mb-1">
                              {formatEventDate(event.eventDate)}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-400 mb-2">
                              👤 {event.organizerName} • ⏱️ {event.duration}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2">
                              {event.eventDescription}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          {/* Add to Calendar */}
                          <button
                            onClick={() => addToGoogleCalendar(event)}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-blue-500/30 text-xs sm:text-sm"
                          >
                            📅 <span className="hidden sm:inline">Add to Calendar</span><span className="sm:hidden">Calendar</span>
                          </button>
                          
                          {/* Join Event */}
                          {event.meetingUrl && (
                            <button
                              onClick={() => window.open(event.meetingUrl, '_blank')}
                              className="flex-1 bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-lime-500/30 text-xs sm:text-sm"
                            >
                              🔗 <span className="hidden sm:inline">Join Event</span><span className="sm:hidden">Join</span>
                            </button>
                          )}
                          
                          {/* Event Details */}
                          <Link
                            to="/events"
                            className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 border border-gray-500/30 text-center text-xs sm:text-sm"
                          >
                            📋 <span className="hidden sm:inline">View Details</span><span className="sm:hidden">Details</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                    
                    {relatedEvents.length > 3 && (
                      <div className="text-center pt-3 sm:pt-4 border-t border-orange-500/20">
                        <Link 
                          to="/events"
                          className="text-orange-400 hover:text-white font-semibold transition-colors text-sm sm:text-base"
                        >
                          View {relatedEvents.length - 3} more project events →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Enhanced responsive */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Project Info */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">📊 Project Information</h3>
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm">
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timeline:</span>
                    <span className="text-white font-semibold">{project.timeline}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experience Level:</span>
                    <span className="text-white font-semibold">{project.experienceLevel}</span>
                  </div>
                  
                  {project.budget && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Budget:</span>
                      <span className="text-white font-semibold">{project.budget}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project Type:</span>
                    <span className="text-white font-semibold">{project.projectType}</span>
                  </div>
                  
                  {project.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Posted:</span>
                      <span className="text-white font-semibold">
                        {new Date(project.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">👤 Project Owner</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-xs sm:text-sm">Contact:</span>
                    <p className="text-white font-semibold text-sm sm:text-base">{project.contactName || 'Project Owner'}</p>
                  </div>
                  
                  {!isProjectOwner && currentUser && (
                    <a 
                      href={`mailto:${project.contactEmail}?subject=Interest in ${project.projectTitle}&body=Hi,%0D%0A%0D%0AI'm interested in your project "${project.projectTitle}" and would like to learn more about the opportunity.%0D%0A%0D%0AThank you!`}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-center text-xs sm:text-sm"
                    >
                      📧 Contact Owner
                    </a>
                  )}
                </div>
              </div>

              {/* Events Quick Access */}
              {relatedEvents.length > 0 && (
                <div className="bg-gradient-to-br from-orange-900/20 via-red-900/20 to-pink-900/20 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-500/30">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center">
                    🎯 <span className="ml-2">Project Events</span>
                  </h3>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-400 mb-1">{relatedEvents.length}</div>
                    <div className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">upcoming events</div>
                    <Link 
                      to="/events"
                      className="block w-full bg-orange-600 hover:bg-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-center text-xs sm:text-sm"
                    >
                      View All Events
                    </Link>
                  </div>
                </div>
              )}

              {/* Application Stats (for project owner) */}
              {isProjectOwner && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">📈 Application Stats</h3>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-lime-400 mb-1">View Dashboard</div>
                    <div className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">for detailed statistics</div>
                    <Link 
                      to="/projects/owner-dashboard"
                      className="block w-full bg-lime-600 hover:bg-lime-700 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-center text-xs sm:text-sm"
                    >
                      View Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Custom Styles - Mobile optimized */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * {
          font-family: 'Inter', sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Smooth transitions for event cards */
        .event-card {
          transition: all 0.3s ease;
        }
        
        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(249, 115, 22, 0.2);
        }

        /* Mobile-first responsive design */
        @media (max-width: 640px) {
          /* Ensure proper touch targets on mobile */
          button, a {
            min-height: 44px;
          }

          /* Disable hover effects on mobile */
          .event-card:hover {
            transform: none;
          }

          /* Improved mobile text readability */
          .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }

        /* Tablet optimizations */
        @media (min-width: 641px) and (max-width: 1024px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }

        /* Enhanced focus states for accessibility */
        button:focus, a:focus {
          outline: 2px solid rgba(76, 175, 80, 0.5);
          outline-offset: 2px;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Prevent horizontal overflow */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};

export default ProjectDetailsView;
