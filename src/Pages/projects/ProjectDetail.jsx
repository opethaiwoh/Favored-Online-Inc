// src/Pages/projects/ProjectDetail.jsx - COMPLETE CODE WITH SIMPLE DATE DISPLAY

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// Email notification helper function
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

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Application Modal State
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [applicationData, setApplicationData] = useState({
    applicantName: '',
    applicantEmail: '',
    experience: '',
    portfolio: '',
    proposal: ''
  });
  const [urlError, setUrlError] = useState('');

  // 🔥 SIMPLE DATE FORMATTING FUNCTIONS
  const formatDateAsText = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If date is invalid, return the original string
        return dateString;
      }
      
      // Return a nicely formatted date
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      // If any error, return the original string
      return dateString;
    }
  };

  const formatShortDateText = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const calculateDaysUntilStart = (startDate) => {
    if (!startDate) return null;
    
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return null;
      
      const today = new Date();
      const diffTime = start - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      return null;
    }
  };

  const calculateProjectDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return null;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) return null;
      if (diffDays === 1) return '1 day';
      if (diffDays < 7) return `${diffDays} days`;
      if (diffDays < 30) return `${Math.round(diffDays / 7)} weeks`;
      if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
      return `${Math.round(diffDays / 365)} years`;
    } catch (error) {
      return null;
    }
  };

  const getTimelineStatus = (startDate) => {
    const daysUntil = calculateDaysUntilStart(startDate);
    
    if (daysUntil === null) return null;
    
    if (daysUntil > 7) {
      return { label: 'Upcoming Project', color: 'text-blue-300', icon: '🔮' };
    } else if (daysUntil > 0) {
      return { 
        label: `Starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`, 
        color: 'text-orange-300 animate-pulse', 
        icon: '⚡' 
      };
    } else if (daysUntil === 0) {
      return { label: 'Starts Today!', color: 'text-green-300 animate-pulse', icon: '🚀' };
    } else {
      return { 
        label: `Started ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} ago`, 
        color: 'text-green-300', 
        icon: '🏃' 
      };
    }
  };

  // Helper function to check if current user owns the project
  const isProjectOwner = (project) => {
    if (!currentUser || !project) return false;
    
    if (project.submitterId && currentUser.uid === project.submitterId) {
      return true;
    }
    
    if (project.submitterEmail && currentUser.email === project.submitterEmail) {
      return true;
    }
    
    if (project.contactEmail && currentUser.email === project.contactEmail) {
      return true;
    }
    
    return false;
  };

  // Helper function to get project type icon
  const getProjectTypeIcon = (projectType) => {
    switch(projectType) {
      case 'web-development': return '🌐';
      case 'mobile-app': return '📱';
      case 'ai-ml': return '🤖';
      case 'blockchain': return '⛓️';
      case 'game-development': return '🎮';
      case 'data-analysis': return '📊';
      case 'desktop-software': return '💻';
      default: return '🚀';
    }
  };

  // Helper function to format timeline
  const formatTimeline = (timeline) => {
    const timelineMap = {
      '1-week': '1 Week',
      '2-weeks': '2 Weeks',
      '1-month': '1 Month',
      '2-3-months': '2-3 Months',
      '3-6-months': '3-6 Months',
      '6-months-plus': '6+ Months',
      'flexible': 'Flexible'
    };
    return timelineMap[timeline] || timeline;
  };

  // Handle mouse movement for background effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) {
        setError('Project ID not provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Fetching project:', projectId);
        
        const projectRef = doc(db, 'client_projects', projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (projectSnap.exists()) {
          const rawData = projectSnap.data();
          
          const projectData = {
            id: projectSnap.id,
            ...rawData,
            // Get dates from multiple possible field names
            startDate: rawData.startDate || rawData.projectStartDate || null,
            endDate: rawData.endDate || rawData.projectEndDate || null,
            postedDate: rawData.submissionDate?.toDate?.()?.toISOString() || 
                       rawData.postedDate?.toDate?.()?.toISOString() || 
                       rawData.createdAt?.toDate?.()?.toISOString() || 
                       new Date().toISOString()
          };
          
          console.log('📅 Project dates found:', {
            startDate: projectData.startDate,
            endDate: projectData.endDate,
            hasStartDate: !!projectData.startDate,
            hasEndDate: !!projectData.endDate
          });
          
          if (projectData.status !== 'approved') {
            setError('Project not found or not approved');
            setLoading(false);
            return;
          }
          
          setProject(projectData);
          console.log('✅ Project loaded:', projectData.projectTitle);
        } else {
          setError('Project not found');
        }
      } catch (error) {
        console.error('❌ Error fetching project:', error);
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  // Check if user has already applied
  useEffect(() => {
    const checkApplication = async () => {
      if (!currentUser || !projectId) {
        setHasApplied(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'project_applications'),
          where('applicantId', '==', currentUser.uid),
          where('projectId', '==', projectId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          setHasApplied(!snapshot.empty);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error checking application:', error);
      }
    };

    checkApplication();
  }, [currentUser, projectId]);

  // Handle project URL click
  const handleProjectUrlClick = (url) => {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle edit project
  const handleEditProject = () => {
    navigate(`/projects/${project.id}/edit`);
  };

  // Application Modal Functions
  const openApplicationModal = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (hasApplied) {
      return;
    }
    
    setShowApplicationModal(true);
    setApplicationStatus(null);
    
    setApplicationData(prev => ({
      ...prev,
      applicantName: currentUser.displayName || '',
      applicantEmail: currentUser.email || ''
    }));
  };

  const closeApplicationModal = () => {
    setShowApplicationModal(false);
    setUrlError('');
    setApplicationData({
      applicantName: '',
      applicantEmail: '',
      experience: '',
      portfolio: '',
      proposal: ''
    });
  };

  const validateUrl = (url) => {
    if (!url) {
      setUrlError('');
      return true;
    }
    
    try {
      const urlPattern = /^https?:\/\/(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if (!urlPattern.test(url)) {
        setUrlError('Please enter a valid URL (e.g., https://linkedin.com/in/yourprofile)');
        return false;
      }
      setUrlError('');
      return true;
    } catch (error) {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handlePortfolioChange = (e) => {
    const url = e.target.value;
    setApplicationData(prev => ({ ...prev, portfolio: url }));
    validateUrl(url);
  };

  // Handle application submission
  const handleApplicationSubmit = async () => {
    if (!applicationData.applicantName || !applicationData.applicantEmail || 
        !applicationData.experience || !applicationData.proposal) {
      setApplicationStatus('error');
      return;
    }

    if (applicationData.portfolio && !validateUrl(applicationData.portfolio)) {
      return;
    }

    setApplicationStatus('submitting');
    
    try {
      console.log('📝 Starting project application submission...');

      const applicationRef = await addDoc(collection(db, 'project_applications'), {
        projectId: project.id,
        projectTitle: project.projectTitle,
        applicantId: currentUser.uid,
        applicantName: applicationData.applicantName,
        applicantEmail: applicationData.applicantEmail,
        experience: applicationData.experience,
        portfolio: applicationData.portfolio,
        proposal: applicationData.proposal,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        contactEmail: project.contactEmail || project.companyEmail,
        motivation: applicationData.proposal,
        skills: applicationData.experience,
        interestedRole: 'Developer',
        projectOwnerEmail: project.contactEmail || project.companyEmail
      });

      try {
        const projectOwnerEmail = project.contactEmail || project.companyEmail;
        
        if (projectOwnerEmail) {
          const emailData = {
            applicationData: {
              applicantName: applicationData.applicantName,
              applicantEmail: applicationData.applicantEmail,
              applicantId: currentUser.uid,
              experience: applicationData.experience || 'Not provided',
              motivation: applicationData.proposal || 'Not provided',
              skills: applicationData.experience || 'Not provided',
              portfolio: applicationData.portfolio || '',
              phone: '',
              availability: '',
              interestedRole: 'Developer'
            },
            projectData: {
              projectTitle: project.projectTitle,
              projectDescription: project.projectDescription,
              projectType: project.projectType,
              timeline: project.timeline,
              experienceLevel: project.experienceLevel,
              budget: project.budget,
              contactName: project.contactName || project.companyName,
              companyName: project.companyName || project.contactName
            },
            projectOwnerData: {
              name: project.contactName || project.companyName || 'Project Owner',
              email: projectOwnerEmail
            }
          };

          await sendEmailNotification('send-project-application', emailData);
        }
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError);
      }

      try {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: currentUser.email,
          recipientName: applicationData.applicantName,
          recipientId: currentUser.uid,
          type: 'application_submitted',
          title: 'Application Submitted! 📝',
          message: `Your application for "${project.projectTitle}" has been submitted successfully. The project owner will review it soon.`,
          projectId: project.id,
          projectTitle: project.projectTitle,
          applicationId: applicationRef.id,
          createdAt: serverTimestamp(),
          read: false,
          priority: 'normal'
        });
      } catch (notificationError) {
        console.error('❌ Failed to create applicant notification:', notificationError);
      }

      setApplicationStatus('success');
      setHasApplied(true);
      
      setTimeout(() => {
        closeApplicationModal();
      }, 2000);

    } catch (error) {
      console.error('❌ Error in project application submission:', error);
      setApplicationStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{
             backgroundImage: `url('/Images/backg.png')`,
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-xl">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{
             backgroundImage: `url('/Images/backg.png')`,
             backgroundSize: 'cover',
             backgroundPosition: 'center'
           }}>
        <div className="text-center">
          <div className="text-6xl mb-6">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">{error || 'Project not found'}</h2>
          <button 
            onClick={() => navigate('/projects')}
            className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 py-3 rounded-full font-bold transition-all duration-300 transform hover:scale-105"
          >
            Back to Projects
          </button>
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
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

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
            
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-10">
              <Link to="/" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser && (
                <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              {currentUser && (
                <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              <Link to="/projects" className="text-lime-400 font-bold transition-all duration-300 hover:text-lime-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                Projects
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-lime-400 to-green-500"></span>
              </Link>
              
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
                  <span className="mr-1 sm:mr-2 text-sm sm:text-lg">G</span>
                  Login
                </button>
              )}
            </nav>
            
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
        </div>
      </header>

      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-6xl">
          
          <div className="mb-8">
            <button 
              onClick={() => navigate('/projects')}
              className="flex items-center text-lime-300 hover:text-lime-200 font-semibold transition-colors duration-300"
            >
              <span className="mr-2">←</span>
              Back to Projects
            </button>
          </div>

          <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl mb-8">
            
            <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
              {project.bannerImageUrl ? (
                <img 
                  src={project.bannerImageUrl} 
                  alt={`${project.projectTitle} banner`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div 
                className={`w-full h-full bg-gradient-to-br from-lime-500/20 via-green-500/20 to-emerald-500/20 flex items-center justify-center ${project.bannerImageUrl ? 'hidden' : 'flex'}`}
                style={{ display: project.bannerImageUrl ? 'none' : 'flex' }}
              >
                <div className="text-center">
                  <div className="text-8xl mb-4 opacity-60">
                    {getProjectTypeIcon(project.projectType)}
                  </div>
                  <p className="text-gray-400 font-semibold text-lg">
                    {project.projectType ? project.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tech Project'}
                  </p>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute top-6 right-6 flex flex-col gap-3">
                <div className="bg-green-500/90 backdrop-blur-sm text-green-100 px-4 py-2 rounded-lg text-sm font-bold border border-green-400/30 shadow-lg">
                  ✓ VERIFIED PROJECT
                </div>
                {isProjectOwner(project) && (
                  <div className="bg-blue-500/90 backdrop-blur-sm text-blue-100 px-4 py-2 rounded-lg text-sm font-bold border border-blue-400/30 shadow-lg">
                    👑 YOUR PROJECT
                  </div>
                )}
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 leading-tight"
                    style={{
                      textShadow: '0 0 20px rgba(0,0,0,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  {project.projectTitle}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-gray-200">
                  <span className="flex items-center">
                    <span className="mr-2">🏢</span>
                    {project.companyName || 'Individual Project'}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">📅</span>
                    {formatTimeline(project.timeline)}
                  </span>
                  <span className="flex items-center">
                    <span className="mr-2">📊</span>
                    {project.projectType ? project.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tech Project'}
                  </span>
                  
                  {/* Timeline Status in banner */}
                  {(() => {
                    const timelineStatus = getTimelineStatus(project.startDate);
                    if (timelineStatus) {
                      return (
                        <span className={`flex items-center ${timelineStatus.color} font-semibold`}>
                          <span className="mr-2">{timelineStatus.icon}</span>
                          {timelineStatus.label}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-6" 
                    style={{
                      textShadow: '0 0 15px rgba(255,255,255,0.2)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Project Description
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-200 leading-relaxed text-lg whitespace-pre-line"
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    {project.projectDescription}
                  </p>
                </div>
              </div>

              {/* 🔥 SIMPLE PROJECT DATES SECTION */}
              {(project.startDate || project.endDate) && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                  <h2 className="text-2xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    📅 Project Timeline & Dates
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Start Date Display */}
                    {project.startDate && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="text-3xl mr-3">🚀</div>
                          <div>
                            <h3 className="text-green-300 font-bold text-lg">Project Starts</h3>
                            <p className="text-gray-400 text-sm">When the project begins</p>
                          </div>
                        </div>
                        
                        <div className="text-white font-bold text-xl mb-2">
                          {formatDateAsText(project.startDate) || project.startDate}
                        </div>
                        
                        <div className="text-gray-400 text-sm mb-3">
                          Raw date: {project.startDate}
                        </div>
                        
                        {(() => {
                          const daysUntil = calculateDaysUntilStart(project.startDate);
                          if (daysUntil !== null) {
                            if (daysUntil > 0) {
                              return (
                                <p className={`text-sm font-medium ${
                                  daysUntil <= 7 ? 'text-orange-300 animate-pulse' : 'text-gray-300'
                                }`}>
                                  Starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                                  {daysUntil <= 7 && <span className="ml-1">⚡</span>}
                                </p>
                              );
                            } else if (daysUntil === 0) {
                              return <p className="text-green-300 font-bold animate-pulse">🎯 Starts Today!</p>;
                            } else {
                              const daysRunning = Math.abs(daysUntil);
                              return (
                                <p className="text-green-300 font-medium">
                                  🏃 Running for {daysRunning} day{daysRunning !== 1 ? 's' : ''}
                                </p>
                              );
                            }
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    
                    {/* End Date Display */}
                    {project.endDate && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="text-3xl mr-3">🏁</div>
                          <div>
                            <h3 className="text-blue-300 font-bold text-lg">Project Ends</h3>
                            <p className="text-gray-400 text-sm">Target completion date</p>
                          </div>
                        </div>
                        
                        <div className="text-white font-bold text-xl mb-2">
                          {formatDateAsText(project.endDate) || project.endDate}
                        </div>
                        
                        <div className="text-gray-400 text-sm mb-3">
                          Raw date: {project.endDate}
                        </div>
                        
                        {(() => {
                          try {
                            const end = new Date(project.endDate);
                            if (isNaN(end.getTime())) {
                              return <p className="text-gray-400 text-sm">Date calculation not available</p>;
                            }
                            
                            const today = new Date();
                            const daysUntilEnd = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                            
                            if (daysUntilEnd > 0) {
                              return (
                                <p className="text-gray-300 text-sm font-medium">
                                  {daysUntilEnd} day{daysUntilEnd !== 1 ? 's' : ''} remaining
                                </p>
                              );
                            } else if (daysUntilEnd === 0) {
                              return <p className="text-blue-300 font-bold">🎯 Ends Today!</p>;
                            } else {
                              return <p className="text-gray-400 text-sm">Project completed</p>;
                            }
                          } catch (error) {
                            return <p className="text-gray-400 text-sm">Date calculation error</p>;
                          }
                        })()}
                      </div>
                    )}
                    
                    {/* Timeline Summary */}
                    {project.startDate && project.endDate && (
                      <div className="md:col-span-2 bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                        <div className="flex items-center mb-4">
                          <div className="text-3xl mr-3">📊</div>
                          <div>
                            <h3 className="text-purple-300 font-bold text-lg">Timeline Summary</h3>
                            <p className="text-gray-400 text-sm">Complete project overview</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-white font-bold text-lg mb-1">
                              {formatShortDateText(project.startDate) || project.startDate}
                            </div>
                            <div className="text-green-300 text-sm font-medium">Start Date</div>
                          </div>
                          
                          <div>
                            <div className="text-white font-bold text-lg mb-1">
                              {calculateProjectDuration(project.startDate, project.endDate) || 'Duration N/A'}
                            </div>
                            <div className="text-purple-300 text-sm font-medium">Duration</div>
                          </div>
                          
                          <div>
                            <div className="text-white font-bold text-lg mb-1">
                              {formatShortDateText(project.endDate) || project.endDate}
                            </div>
                            <div className="text-blue-300 text-sm font-medium">End Date</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-gray-300 text-center">
                            <strong>Timeline:</strong> {formatShortDateText(project.startDate)} → {formatShortDateText(project.endDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fallback for projects without dates */}
              {!project.startDate && !project.endDate && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">⚠️</div>
                    <div>
                      <h3 className="text-yellow-300 font-bold text-lg">No Specific Dates Available</h3>
                      <p className="text-gray-400 text-sm">This project uses general timeline only</p>
                    </div>
                  </div>
                  
                  <div className="text-gray-300">
                    <p><strong>General Timeline:</strong> {formatTimeline(project.timeline)}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Contact the project owner for specific start and end dates.
                    </p>
                  </div>
                </div>
              )}

              {project.requiredSkills && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                  <h2 className="text-2xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Required Skills & Technologies
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {project.requiredSkills.split(', ').map((skill, index) => (
                      <span key={index} className="bg-gradient-to-r from-lime-500/20 to-green-500/20 text-lime-300 px-4 py-2 rounded-full font-semibold border border-lime-400/30 shadow-lg">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(project.deliverables || project.communicationPreferences || project.additionalNotes) && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
                  <h2 className="text-2xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Additional Information
                  </h2>
                  <div className="space-y-6">
                    {project.deliverables && (
                      <div>
                        <h3 className="text-lg font-bold text-lime-300 mb-3">Expected Deliverables</h3>
                        <p className="text-gray-200 leading-relaxed whitespace-pre-line">{project.deliverables}</p>
                      </div>
                    )}
                    {project.communicationPreferences && (
                      <div>
                        <h3 className="text-lg font-bold text-lime-300 mb-3">Communication Preferences</h3>
                        <p className="text-gray-200 leading-relaxed">{project.communicationPreferences}</p>
                      </div>
                    )}
                    {project.additionalNotes && (
                      <div>
                        <h3 className="text-lg font-bold text-lime-300 mb-3">Additional Notes</h3>
                        <p className="text-gray-200 leading-relaxed whitespace-pre-line">{project.additionalNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-2xl sticky top-24">
                <h3 className="text-xl font-black text-white mb-6" 
                    style={{
                      textShadow: '0 0 15px rgba(255,255,255,0.2)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Project Details
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Timeline:</span>
                    <span className="text-gray-200 font-semibold">{formatTimeline(project.timeline)}</span>
                  </div>
                  
                  {/* Simple Start Date in Sidebar */}
                  {project.startDate && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">🚀 Start Date:</span>
                      <div className="text-right">
                        <div className="text-green-300 font-semibold">
                          {formatShortDateText(project.startDate) || project.startDate}
                        </div>
                        {(() => {
                          const daysUntil = calculateDaysUntilStart(project.startDate);
                          if (daysUntil !== null && daysUntil > 0 && daysUntil <= 7) {
                            return <div className="text-orange-300 text-xs animate-pulse">Starts soon!</div>;
                          }
                          if (daysUntil === 0) {
                            return <div className="text-green-300 text-xs font-bold animate-pulse">Today! 🚀</div>;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* Simple End Date in Sidebar */}
                  {project.endDate && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">🏁 End Date:</span>
                      <span className="text-blue-300 font-semibold">
                        {formatShortDateText(project.endDate) || project.endDate}
                      </span>
                    </div>
                  )}
                  
                  {/* Project Duration in Sidebar */}
                  {project.startDate && project.endDate && calculateProjectDuration(project.startDate, project.endDate) && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">⏱️ Duration:</span>
                      <span className="text-purple-300 font-semibold">
                        {calculateProjectDuration(project.startDate, project.endDate)}
                      </span>
                    </div>
                  )}
                  
                  {project.budget && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Budget:</span>
                      <span className="text-gray-200 font-semibold">{project.budget}</span>
                    </div>
                  )}
                  
                  {project.experienceLevel && (
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="text-gray-400">Experience Level:</span>
                      <span className="text-gray-200 font-semibold">{project.experienceLevel}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-gray-400">Posted:</span>
                    <span className="text-gray-200 font-semibold">{new Date(project.postedDate).toLocaleDateString()}</span>
                  </div>

                  {/* Timeline Status in Sidebar */}
                  {(() => {
                    const timelineStatus = getTimelineStatus(project.startDate);
                    if (timelineStatus) {
                      return (
                        <div className="flex justify-between border-b border-white/10 pb-2">
                          <span className="text-gray-400">Status:</span>
                          <span className={`font-semibold ${timelineStatus.color}`}>
                            <span className="mr-1">{timelineStatus.icon}</span>
                            {timelineStatus.label}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {project.projectUrl && (
                    <div className="border-b border-white/10 pb-2">
                      <span className="text-gray-400 block mb-2">Project URL:</span>
                      <button
                        onClick={() => handleProjectUrlClick(project.projectUrl)}
                        className="flex items-center text-lime-300 hover:text-lime-200 transition-colors duration-300 font-medium break-all"
                        title="Visit project website"
                      >
                        <span className="mr-2">🔗</span>
                        <span className="truncate">
                          {project.projectUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </span>
                        <span className="ml-1 text-xs">↗</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {isProjectOwner(project) && (
                    <button
                      onClick={handleEditProject}
                      className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-4 rounded-full font-bold transition-all duration-500 transform hover:scale-105 shadow-xl"
                      style={{
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      <span className="flex items-center justify-center">
                        Edit Project
                        <span className="ml-2 text-lg">✏️</span>
                      </span>
                    </button>
                  )}

                  {!isProjectOwner(project) && (
                    <button
                      onClick={openApplicationModal}
                      disabled={!currentUser || hasApplied}
                      className={`w-full ${
                        hasApplied 
                          ? 'bg-gray-600 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 hover:scale-105'
                      } text-white px-6 py-4 rounded-full font-bold transition-all duration-500 transform shadow-xl disabled:transform-none`}
                      style={{
                        boxShadow: hasApplied 
                          ? '0 0 20px rgba(107, 114, 128, 0.4)' 
                          : '0 0 20px rgba(76, 175, 80, 0.4)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      <span className="flex items-center justify-center">
                        {hasApplied ? (
                          <>
                            Already Applied
                            <span className="ml-2 text-lg">✅</span>
                          </>
                        ) : !currentUser ? (
                          <>
                            Login to Apply
                            <span className="ml-2 text-lg">🔐</span>
                          </>
                        ) : (
                          <>
                            Apply Now
                            <span className="ml-2 text-lg">🚀</span>
                          </>
                        )}
                      </span>
                    </button>
                  )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <h4 className="text-lg font-bold text-white mb-4">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Contact:</span>
                      <span className="text-gray-200">{project.contactName || project.companyName || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-gray-200 truncate">{project.contactEmail || project.companyEmail || 'Available after application'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Apply to Project
                </h2>
                <p className="text-lime-300 font-semibold">{project.projectTitle}</p>
                {/* Show project timeline in modal */}
                {(project.startDate || project.endDate) && (
                  <div className="mt-2 text-sm text-gray-400">
                    {project.startDate && project.endDate ? (
                      <span>📅 Timeline: {formatShortDateText(project.startDate)} → {formatShortDateText(project.endDate)}</span>
                    ) : project.startDate ? (
                      <span>🚀 Starts: {formatShortDateText(project.startDate)}</span>
                    ) : (
                      <span>🏁 Ends: {formatShortDateText(project.endDate)}</span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={closeApplicationModal}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {applicationStatus === 'success' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                <div className="flex items-center">
                  <div className="text-green-400 text-xl mr-3">✅</div>
                  <div>
                    <h3 className="text-green-400 font-bold">Application Submitted Successfully! 🎉</h3>
                    <p className="text-gray-200 text-sm">📧 The project owner has been notified via email and will review your application soon.</p>
                    {project.startDate && (
                      <p className="text-gray-200 text-sm mt-1">
                        📅 Project starts: {formatDateAsText(project.startDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {applicationStatus === 'error' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center">
                  <div className="text-red-400 text-xl mr-3">❌</div>
                  <div>
                    <h3 className="text-red-400 font-bold">Application Failed</h3>
                    <p className="text-gray-200 text-sm">There was an error submitting your application. Please try again.</p>
                  </div>
                </div>
              </div>
            )}

            {applicationStatus !== 'success' && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={applicationData.applicantName}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, applicantName: e.target.value }))}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={applicationData.applicantEmail}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, applicantEmail: e.target.value }))}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Relevant Experience *
                  </label>
                  <textarea
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, experience: e.target.value }))}
                    rows={4}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Describe your relevant experience and skills for this project..."
                  />
                </div>

                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Portfolio/LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={applicationData.portfolio}
                    onChange={handlePortfolioChange}
                    className={`w-full bg-white/10 backdrop-blur-sm border ${urlError ? 'border-red-500' : 'border-white/20'} rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300`}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {urlError && (
                    <p className="text-red-400 text-sm mt-2 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {urlError}
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Optional: LinkedIn profile, portfolio website, or GitHub profile
                  </p>
                </div>

                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Project Proposal *
                  </label>
                  <textarea
                    value={applicationData.proposal}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, proposal: e.target.value }))}
                    rows={5}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Explain your approach to this project, timeline, and what makes you the right fit..."
                  />
                  {project.startDate && (
                    <p className="text-gray-400 text-xs mt-1">
                      💡 Note: This project starts on {formatDateAsText(project.startDate)}. Please consider this timeline in your proposal.
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={closeApplicationModal}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplicationSubmit}
                    disabled={applicationStatus === 'submitting' || urlError}
                    className="flex-1 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-bold transition-all duration-500 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {applicationStatus === 'submitting' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
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

        input:focus, textarea:focus, select:focus {
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ProjectDetail;
