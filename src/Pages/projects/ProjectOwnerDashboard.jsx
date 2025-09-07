// src/Pages/projects/ProjectOwnerDashboard.jsx - COMPLETE VERSION with Notifications

// Complete Project Owner Dashboard for managing their projects and applications

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  getDocs,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

// 🔥 NEW: Import notification helpers
import { createMemberJoinedNotification } from '../../utils/notificationHelpers';

// 🔥 EMAIL NOTIFICATION HELPER FUNCTION
const sendEmailNotification = async (endpoint, data) => {
  try {
    console.log(`📧 Sending email notification via ${endpoint}...`);
    
    const response = await fetch(`/api/notifications/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Email notification sent successfully:`, result.results);
      return { success: true, results: result.results };
    } else {
      console.error(`❌ Email notification failed:`, result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error(`💥 Error sending email notification:`, error);
    return { success: false, error: error.message };
  }
};

const ProjectOwnerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [myProjects, setMyProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (currentUser?.email) {
      const unsubscribe = fetchMyProjects();
      return unsubscribe;
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchMyProjects = () => {
    try {
      console.log('🔍 Fetching projects for:', currentUser.email);
      
      // Simplified query without composite index requirement
      const projectsQuery = query(
        collection(db, 'client_projects'),
        where('contactEmail', '==', currentUser.email)
      );
      
      const unsubscribe = onSnapshot(
        projectsQuery, 
        async (snapshot) => {
          console.log('📊 Projects snapshot received:', snapshot.docs.length, 'projects');
          
          try {
            const projectsList = [];
            
            for (const projectDoc of snapshot.docs) {
              const projectData = { id: projectDoc.id, ...projectDoc.data() };
              
              // Filter approved/active projects after fetching
              if (!['approved', 'active'].includes(projectData.status)) {
                continue;
              }
              
              console.log('📝 Processing project:', projectData.projectTitle);
              
              // Get associated group
              try {
                const groupQuery = query(
                  collection(db, 'groups'),
                  where('originalProjectId', '==', projectDoc.id),
                  where('adminEmail', '==', currentUser.email)
                );
                
                const groupSnapshot = await getDocs(groupQuery);
                if (!groupSnapshot.empty) {
                  projectData.group = { id: groupSnapshot.docs[0].id, ...groupSnapshot.docs[0].data() };
                  console.log('👥 Found group for project:', projectData.projectTitle);
                }
              } catch (groupError) {
                console.error('❌ Error fetching group for project:', projectDoc.id, groupError);
              }
              
              // Get pending applications count with simpler query
              try {
                const applicationsQuery = query(
                  collection(db, 'project_applications'),
                  where('projectId', '==', projectDoc.id)
                );
                
                const applicationsSnapshot = await getDocs(applicationsQuery);
                
                // Filter for pending applications after fetching
                const pendingApplications = applicationsSnapshot.docs.filter(doc => {
                  const status = doc.data().status;
                  return ['submitted', 'under_review'].includes(status);
                });
                
                projectData.pendingApplications = pendingApplications.length;
                console.log('📬 Found', projectData.pendingApplications, 'applications for:', projectData.projectTitle);
              } catch (appError) {
                console.error('❌ Error fetching applications for project:', projectDoc.id, appError);
                projectData.pendingApplications = 0;
              }
              
              projectsList.push(projectData);
            }
            
            // Sort by creation date (newest first)
            projectsList.sort((a, b) => {
              const dateA = a.createdAt?.toDate?.() || new Date(0);
              const dateB = b.createdAt?.toDate?.() || new Date(0);
              return dateB - dateA;
            });
            
            console.log('✅ Final projects list:', projectsList.length, 'projects');
            setMyProjects(projectsList);
            setLoading(false);
            setError(null);
          } catch (processingError) {
            console.error('❌ Error processing projects data:', processingError);
            setError('Error processing projects data');
            setLoading(false);
          }
        },
        (queryError) => {
          console.error('❌ Firestore query error:', queryError);
          setError('Failed to load projects: ' + queryError.message);
          setLoading(false);
          
          if (queryError.code === 'failed-precondition') {
            toast.error('Database configuration error. Please contact support.');
          } else {
            toast.error('Failed to load your projects. Please try refreshing the page.');
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up projects query:', error);
      setError('Failed to initialize projects query');
      setLoading(false);
      return () => {};
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading your projects...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Unable to Load Projects</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="space-y-4">
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                const unsubscribe = fetchMyProjects();
                return unsubscribe;
              }}
              className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🔄 Try Again
            </button>
            <Link 
              to="/projects"
              className="block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // No user logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <p className="text-gray-300 mb-6">You need to be logged in to view your projects.</p>
          <Link 
            to="/login"
            className="bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go to Login
          </Link>
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
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser ? (
                <>
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
                </>
              ) : (
                <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
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
                
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {currentUser ? (
                  <>
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
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
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
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                }}>
              My <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">Projects</span>
            </h1>
            <p className="text-lg text-gray-200 mb-8">Manage your projects and team applications</p>
          </section>

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg text-white text-sm">
              <strong>Debug Info:</strong><br/>
              User Email: {currentUser?.email}<br/>
              Projects Found: {myProjects.length}<br/>
              Loading: {loading.toString()}<br/>
              Error: {error || 'None'}
            </div>
          )}

          {/* Summary Stats */}
          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Total Projects</p>
                    <p className="text-3xl font-black text-blue-400">{myProjects.length}</p>
                  </div>
                  <div className="text-blue-400 text-3xl">🚀</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Active Teams</p>
                    <p className="text-3xl font-black text-green-400">{myProjects.filter(p => p.group).length}</p>
                  </div>
                  <div className="text-green-400 text-3xl">👥</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Pending Applications</p>
                    <p className="text-3xl font-black text-yellow-400">{myProjects.reduce((sum, p) => sum + (p.pendingApplications || 0), 0)}</p>
                  </div>
                  <div className="text-yellow-400 text-3xl">📬</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Team Members</p>
                    <p className="text-3xl font-black text-purple-400">{myProjects.reduce((sum, p) => sum + (p.group?.memberCount || 0), 0)}</p>
                  </div>
                  <div className="text-purple-400 text-3xl">🤝</div>
                </div>
              </div>
            </div>
          </section>

          {/* Projects List */}
          {myProjects.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-12 border border-white/20 max-w-2xl mx-auto">
                <div className="text-6xl mb-6">📝</div>
                <h3 className="text-2xl font-bold text-white mb-4">No Projects Yet</h3>
                <p className="text-gray-300 mb-8">Submit your first project to start building your team!</p>
                <Link 
                  to="/projects/submit"
                  className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
                >
                  Submit Your First Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {myProjects.map((project) => (
                <ProjectCard key={project.id} project={project} currentUser={currentUser} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

// Individual Project Card Component - Updated with Email Notifications
const ProjectCard = ({ project, currentUser }) => {
  const [showApplications, setShowApplications] = useState(false);
  
  return (
    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-2xl">
      {/* Project Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">{project.projectTitle}</h3>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
              {project.status}
            </span>
            {project.pendingApplications > 0 && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                {project.pendingApplications} applications
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.projectDescription}</p>
        
        <div className="flex items-center text-gray-400 text-sm space-x-4 flex-wrap">
          <span>💼 {project.projectType}</span>
          <span>⏰ {project.timeline}</span>
          <span>👥 {project.experienceLevel}</span>
          {project.budget && <span>💰 {project.budget}</span>}
        </div>
      </div>

      {/* Group Status */}
      {project.group ? (
        <div className="mb-6 p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lime-400 font-semibold">Team Created ✅</h4>
              <p className="text-gray-300 text-sm">
                {project.group.memberCount} member(s) in your team
              </p>
            </div>
            <Link 
              to={`/groups/${project.group.id}`}
              className="bg-lime-500 hover:bg-lime-600 text-black px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Manage Team
            </Link>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <h4 className="text-yellow-400 font-semibold">Team Pending ⏳</h4>
          <p className="text-gray-300 text-sm">
            Your team group will be created when your project is approved by admin.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link
          to={`/projects/${project.id}`}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-center"
        >
          📋 View Project Details
        </Link>
        
        {project.group && (
          <Link
            to={`/career/project-completion/${project.group.id}`}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-center"
          >
            🎯 Complete Project
          </Link>
        )}
      </div>

      {/* Applications Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowApplications(!showApplications)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-between"
        >
          <span>📬 Manage Applications ({project.pendingApplications})</span>
          <span className={`transition-transform duration-300 ${showApplications ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {showApplications && project.group && (
          <ProjectApplicationManager 
            projectId={project.id} 
            groupData={project.group}
            currentUser={currentUser} 
          />
        )}
        
        {showApplications && !project.group && (
          <div className="bg-gray-800/40 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h4 className="text-lg font-bold text-white mb-2">Team Not Created Yet</h4>
            <p className="text-gray-300">
              Applications will be available once your project is approved and your team group is created.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 🔥 UPDATED: Application Manager Component with Member Joined Notifications
const ProjectApplicationManager = ({ projectId, groupData, currentUser }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, [projectId]);

  // Copy to clipboard function
  const handleCopyEmail = async (applicantEmail, applicantName) => {
    try {
      await navigator.clipboard.writeText(applicantEmail);
      toast.success(`📧 ${applicantName}'s email copied to clipboard!`);
      
      console.log('📧 Email copied:', {
        applicantEmail,
        applicantName,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error copying email:', error);
      
      try {
        const textArea = document.createElement('textarea');
        textArea.value = applicantEmail;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          toast.success(`📧 ${applicantName}'s email copied to clipboard!`);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        alert(`${applicantName}'s email:\n\n${applicantEmail}\n\n(Please copy manually)`);
        toast.info(`Email: ${applicantEmail} (Please copy manually)`);
      }
    }
  };

  // Simplified query to avoid composite index requirement
  const fetchApplications = async () => {
    try {
      const applicationsQuery = query(
        collection(db, 'project_applications'),
        where('projectId', '==', projectId)
      );
      
      const unsubscribe = onSnapshot(applicationsQuery, (snapshot) => {
        const applicationsList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(app => ['submitted', 'under_review'].includes(app.status))
          .sort((a, b) => {
            const dateA = a.submittedAt?.toDate?.() || new Date(0);
            const dateB = b.submittedAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });
          
        setApplications(applicationsList);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoading(false);
      toast.error('Failed to load applications');
    }
  };

  // 🔥 UPDATED: APPLICATION APPROVAL WITH MEMBER JOINED NOTIFICATIONS
  const approveApplication = async (applicationId, applicationData) => {
    try {
      console.log('🤝 Project owner approving application...', {
        applicationId,
        applicantName: applicationData.applicantName,
        applicantEmail: applicationData.applicantEmail,
        projectTitle: groupData.projectTitle
      });

      // Validation for required fields
      if (!applicationData.applicantEmail) {
        console.error('❌ Missing applicant email, cannot proceed');
        toast.error('❌ Cannot approve: Missing applicant email');
        return;
      }

      if (!groupData.projectTitle) {
        console.error('❌ Missing project title, cannot proceed');
        toast.error('❌ Cannot approve: Missing project details');
        return;
      }

      if (!groupData.id) {
        console.error('❌ Missing group ID, cannot proceed');
        toast.error('❌ Cannot approve: Missing group information');
        return;
      }

      // 🔥 NEW: Get existing members BEFORE adding new member for notifications
      console.log('👥 Fetching existing group members for notifications...');
      const existingMembersQuery = query(
        collection(db, 'group_members'),
        where('groupId', '==', groupData.id),
        where('status', '==', 'active')
      );
      
      const existingMembersSnapshot = await getDocs(existingMembersQuery);
      const existingMembers = existingMembersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`📊 Found ${existingMembers.length} existing members to notify`);

      // 1. Update application status
      console.log('📝 Updating application status...');
      await updateDoc(doc(db, 'project_applications', applicationId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.email,
        approvedByProjectOwner: true,
        approvedByName: currentUser.displayName || currentUser.email.split('@')[0]
      });
      console.log('✅ Application status updated');

      // 2. Add applicant to group as member
      console.log('👥 Adding member to group...');
      await addDoc(collection(db, 'group_members'), {
        groupId: groupData.id,
        userEmail: applicationData.applicantEmail,
        userName: applicationData.applicantName,
        userId: applicationData.applicantId,
        role: 'member',
        status: 'active',
        joinedAt: serverTimestamp(),
        projectRole: applicationData.interestedRole || 'Developer',
        addedBy: currentUser.email,
        addedByProjectOwner: true,
        addedByName: currentUser.displayName || currentUser.email.split('@')[0]
      });
      console.log('✅ Member added to group');

      // 3. Update group member count
      console.log('🔢 Updating group member count...');
      await updateDoc(doc(db, 'groups', groupData.id), {
        memberCount: increment(1),
        updatedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });
      console.log('✅ Group member count updated');

      // 🔥 NEW: 4. Send member joined notifications to existing team members
      try {
        console.log('🔔 Creating member joined notifications...');
        
        await createMemberJoinedNotification(
          groupData.id,
          groupData.projectTitle,
          applicationData.applicantName,
          existingMembers
        );
        
        console.log('✅ Member joined notifications sent to existing team members');
      } catch (notificationError) {
        console.error('❌ Failed to send member joined notifications:', notificationError);
        // Don't block the approval process if notifications fail
      }

      // 🔥 5. Send approval email notification to applicant
      try {
        console.log('📧 Preparing to send application approval email...');
        
        const emailData = {
          applicationData: {
            applicantEmail: applicationData.applicantEmail,
            applicantName: applicationData.applicantName,
            applicantId: applicationData.applicantId,
            roleAppliedFor: applicationData.interestedRole || 'Developer',
            projectOwner: currentUser.displayName || currentUser.email.split('@')[0] || 'Project Owner',
            additionalEmails: [],
            approvalDate: new Date().toISOString(),
            projectTitle: groupData.projectTitle
          },
          projectData: {
            projectTitle: groupData.projectTitle,
            contactName: currentUser.displayName || currentUser.email.split('@')[0] || 'Project Owner',
            contactEmail: currentUser.email,
            companyName: groupData.companyName || 'Team Project',
            projectType: groupData.projectType || 'Collaborative Project',
            timeline: groupData.timeline || 'Ongoing',
            teamSize: (groupData.memberCount || 0) + 1,
            groupId: groupData.id,
            originalProjectId: groupData.originalProjectId || groupData.projectId,
            description: groupData.description || groupData.projectDescription,
            experienceLevel: groupData.experienceLevel || 'Mixed',
            budget: groupData.budget || 'Not specified'
          }
        };

        const emailResult = await sendEmailNotification('send-application-approved', emailData);
        
        if (emailResult.success) {
          console.log('✅ Application approval email sent successfully:', emailResult.results);
          toast.success('🎉 Application Approved!\n\n📧 Welcome email sent to new team member\n👥 They\'ve been added to your team\n🔔 Existing members have been notified\n🚀 Team can now collaborate together');
        } else {
          console.warn('⚠️ Application approval email failed:', emailResult.error);
          toast.success('✅ Application Approved!\n\n👥 New member added to team successfully\n🔔 Team notifications sent\n⚠️ Welcome email failed to send\n💡 You may want to contact them directly');
        }
        
      } catch (emailError) {
        console.error('📧 Failed to send application approval email:', emailError);
        toast.success('✅ Application Approved!\n\n👥 New member added to team successfully\n🔔 Team notifications sent\n⚠️ Welcome email system temporarily unavailable\n💡 Consider reaching out to them directly');
      }

      // 6. Send notification to Firebase for the new member
      try {
        console.log('📱 Creating Firebase notification for new member...');
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: applicationData.applicantEmail,
          recipientName: applicationData.applicantName,
          recipientId: applicationData.applicantId,
          type: 'application_approved',
          title: 'Application Approved! 🎉',
          message: `Your application to join "${groupData.projectTitle}" has been approved by ${currentUser.displayName || currentUser.email}. Welcome to the team!`,
          projectId: projectId,
          groupId: groupData.id,
          projectTitle: groupData.projectTitle,
          approvedBy: currentUser.email,
          approvedByName: currentUser.displayName || currentUser.email.split('@')[0],
          createdAt: serverTimestamp(),
          read: false,
          priority: 'high'
        });
        console.log('✅ Firebase notification created for new member');
      } catch (notificationError) {
        console.error('❌ Failed to create Firebase notification for new member:', notificationError);
      }

      // 7. Create group post announcement
      try {
        console.log('📢 Creating group announcement...');
        await addDoc(collection(db, 'group_posts'), {
          groupId: groupData.id,
          authorId: 'system',
          authorName: 'Favored Online',
          authorEmail: 'system@favoredsite.com',
          authorPhoto: '/Images/512X512.png',
          title: 'New Team Member Joined! 🎉',
          content: `🎉 **${applicationData.applicantName}** has joined the project team as **${applicationData.interestedRole || 'Developer'}**!\n\nWelcome aboard! We're excited to have you contribute to "${groupData.projectTitle}". Feel free to introduce yourself and let us know how you'd like to get started.\n\n👥 **Team Size:** ${(groupData.memberCount || 0) + 1} members\n🚀 **Let's build something amazing together!**`,
          type: 'announcement',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          replyCount: 0,
          isPinned: false,
          isSystemPost: true,
          relatedToApplication: applicationId,
          newMemberEmail: applicationData.applicantEmail,
          newMemberName: applicationData.applicantName,
          likes: [], // 🔥 ENSURE: Initialize empty likes array
          likeCount: 0, // 🔥 ENSURE: Initialize like count
          images: [] // Initialize empty images array
        });
        console.log('✅ Group announcement created');
      } catch (postError) {
        console.error('❌ Failed to create group announcement:', postError);
      }

      console.log('🎉 Application approval process completed successfully!');
      
    } catch (error) {
      console.error('❌ Error in application approval process:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('❌ Permission denied: You may not have rights to approve this application');
      } else if (error.code === 'not-found') {
        toast.error('❌ Application or group not found: Data may have been deleted');
      } else if (error.code === 'unavailable') {
        toast.error('❌ Service temporarily unavailable: Please try again in a moment');
      } else {
        toast.error('❌ Error approving application: ' + (error.message || 'Unknown error occurred'));
      }
    }
  };

  // 🔥 APPLICATION REJECTION WITH EMAIL NOTIFICATIONS (unchanged)
  const rejectApplication = async (applicationId, applicationData, reason = '') => {
    try {
      console.log('❌ Project owner rejecting application...', {
        applicationId,
        applicantName: applicationData.applicantName,
        applicantEmail: applicationData.applicantEmail,
        projectTitle: groupData.projectTitle,
        hasReason: !!reason
      });

      // Validation for required fields
      if (!applicationData.applicantEmail) {
        console.error('❌ Missing applicant email, cannot proceed');
        toast.error('❌ Cannot reject: Missing applicant email');
        return;
      }

      if (!groupData.projectTitle) {
        console.error('❌ Missing project title, cannot proceed');
        toast.error('❌ Cannot reject: Missing project details');
        return;
      }

      // 1. Update application status in database
      console.log('📝 Updating application status to rejected...');
      await updateDoc(doc(db, 'project_applications', applicationId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.email,
        rejectedByName: currentUser.displayName || currentUser.email.split('@')[0],
        rejectionReason: reason || 'No specific reason provided'
      });
      console.log('✅ Application status updated to rejected');

      // 🔥 2. Send rejection email notification to applicant
      try {
        console.log('📧 Sending rejection email notification to applicant...');
        
        const emailData = {
          applicationData: {
            applicantName: applicationData.applicantName,
            applicantEmail: applicationData.applicantEmail,
            applicantId: applicationData.applicantId,
            roleAppliedFor: applicationData.interestedRole || 'Developer'
          },
          projectData: {
            projectTitle: groupData.projectTitle,
            contactName: currentUser.displayName || currentUser.email.split('@')[0] || 'Project Owner',
            contactEmail: currentUser.email,
            companyName: groupData.companyName || 'Team Project',
            projectType: groupData.projectType || 'Collaborative Project',
            projectDescription: groupData.description || groupData.projectDescription || ''
          },
          rejectionReason: reason || ''
        };

        const emailResult = await sendEmailNotification('send-application-rejected', emailData);
        
        if (emailResult.success) {
          console.log('✅ Rejection email sent successfully:', emailResult.results);
          if (reason && reason.trim()) {
            toast.success('❌ Application Rejected\n\n📧 Rejection email with your feedback sent to applicant\n💬 They will receive your custom message');
          } else {
            toast.success('❌ Application Rejected\n\n📧 Professional rejection email sent to applicant\n💡 Consider providing feedback for future applications');
          }
        } else {
          console.warn('⚠️ Application rejected but email notification failed:', emailResult.error);
          toast.success('❌ Application Rejected\n\n⚠️ Rejection email failed to send\n💡 You may want to contact them directly');
        }
        
      } catch (emailError) {
        console.error('❌ Rejection email notification error:', emailError);
        toast.success('❌ Application Rejected\n\n⚠️ Email system temporarily unavailable\n💡 The rejection was saved in the system');
      }

      // 3. Optional: Create a notification in Firebase for the applicant
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: applicationData.applicantEmail,
          recipientName: applicationData.applicantName,
          recipientId: applicationData.applicantId,
          type: 'application_rejected',
          title: 'Application Update 📋',
          message: `Your application for "${groupData.projectTitle}" has been reviewed. Thank you for your interest.`,
          projectId: projectId,
          projectTitle: groupData.projectTitle,
          rejectedBy: currentUser.email,
          rejectedByName: currentUser.displayName || currentUser.email.split('@')[0],
          rejectionReason: reason || 'No specific reason provided',
          createdAt: serverTimestamp(),
          read: false,
          priority: 'normal'
        });
        console.log('✅ Firebase notification created for rejection');
      } catch (notificationError) {
        console.error('❌ Failed to create Firebase notification for rejection:', notificationError);
      }

      console.log('🎯 Application rejection completed successfully!');

    } catch (error) {
      console.error('❌ Error in application rejection process:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('❌ Permission denied: You may not have rights to reject this application');
      } else if (error.code === 'not-found') {
        toast.error('❌ Application not found: It may have been already processed or deleted');
      } else if (error.code === 'unavailable') {
        toast.error('❌ Service temporarily unavailable: Please try again in a moment');
      } else {
        toast.error('❌ Error rejecting application: ' + (error.message || 'Unknown error occurred'));
      }
    }
  };

  const markUnderReview = async (applicationId) => {
    try {
      await updateDoc(doc(db, 'project_applications', applicationId), {
        status: 'under_review',
        reviewStartedAt: serverTimestamp(),
        reviewedBy: currentUser.email
      });

      toast.success('Application marked as under review');
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Error updating application');
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-300">Loading applications...</div>;
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-800/40 rounded-xl">
        <div className="text-4xl mb-4">📭</div>
        <h4 className="text-lg font-bold text-white mb-2">No Applications Yet</h4>
        <p className="text-gray-300">Applications to your project will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {applications.map((app) => (
        <div key={app.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h4 className="font-bold text-white">{app.applicantName}</h4>
              <p className="text-gray-300 text-sm">{app.applicantEmail}</p>
              <p className="text-blue-400 text-sm">Role: {app.interestedRole || 'Developer'}</p>
              {app.availableStart && (
                <p className="text-gray-400 text-sm">Available: {new Date(app.availableStart).toLocaleDateString()}</p>
              )}
            </div>
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              app.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-400' :
              app.status === 'under_review' ? 'bg-blue-500/20 text-blue-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {app.status.replace('_', ' ')}
            </span>
          </div>

          <div className="mb-3">
            <h5 className="font-semibold text-white text-sm mb-1">Experience:</h5>
            <p className="text-gray-300 text-sm line-clamp-3">{app.experience}</p>
          </div>

          {app.portfolio && (
            <div className="mb-3">
              <a href={app.portfolio} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-400 hover:text-blue-300 underline text-sm">
                View Portfolio →
              </a>
            </div>
          )}

          {app.motivation && (
            <div className="mb-3">
              <h5 className="font-semibold text-white text-sm mb-1">Motivation:</h5>
              <p className="text-gray-300 text-sm line-clamp-2">{app.motivation}</p>
            </div>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => approveApplication(app.id, app)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
            >
              ✅ Approve & Add to Team
            </button>
            
            {app.status === 'submitted' && (
              <button
                onClick={() => markUnderReview(app.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
              >
                🔍 Mark as Reviewing
              </button>
            )}
            
            {/* 🔥 Reject button with email notification */}
            <button
              onClick={() => {
                // Enhanced rejection dialog with better UX
                const reason = prompt(
                  'Optional: Provide feedback for the applicant\n\n' +
                  'Your message will help them improve future applications:\n' +
                  '(Leave blank to send a standard rejection email)'
                );
                
                // User clicked Cancel
                if (reason === null) {
                  return;
                }
                
                // Confirm the rejection
                const confirmReject = window.confirm(
                  `Are you sure you want to reject ${app.applicantName}'s application?\n\n` +
                  `${reason ? `Your feedback: "${reason}"` : 'Standard rejection message will be sent.'}\n\n` +
                  'This action cannot be undone and the applicant will be notified via email.'
                );
                
                if (confirmReject) {
                  rejectApplication(app.id, app, reason);
                }
              }}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
            >
              ❌ Reject
            </button>
          </div>

          {/* Copy Email Button */}
          <div className="mt-2">
            <button 
              onClick={() => handleCopyEmail(app.applicantEmail, app.applicantName)}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors text-center flex items-center justify-center space-x-2"
            >
              <span>📋</span>
              <span>Copy Email Address</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectOwnerDashboard;
