// src/Pages/career/ProjectCompletionForm.jsx
// Phase 1: Submit project URL for admin review with email notifications
// Phase 2: After admin approval, project owner assigns badges
// RESPONSIVE VERSION - Optimized for all screen sizes

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

// 🔥 NEW: Email notification helper function
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

const ProjectCompletionForm = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [groupData, setGroupData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // PHASE 1: Project Review Submission (for admin)
  const [projectReviewForm, setProjectReviewForm] = useState({
    projectUrl: '',
    demoUrl: '',
    repositoryUrl: '', // Now required
    projectSummary: '',
    keyFeatures: '',
    technologiesUsed: '',
    challengesFaced: '',
    projectStatus: 'completed',
    additionalNotes: ''
  });

  // Check if already submitted for review
  const [existingSubmission, setExistingSubmission] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (groupId && currentUser) {
      fetchGroupData();
      checkExistingSubmission();
    }
  }, [groupId, currentUser]);

  // Pre-populate form if resubmitting rejected project
  useEffect(() => {
    if (existingSubmission && existingSubmission.status === 'rejected' && existingSubmission.projectReview) {
      const prevData = existingSubmission.projectReview;
      setProjectReviewForm({
        projectUrl: prevData.projectUrl || '',
        demoUrl: prevData.demoUrl || '',
        repositoryUrl: prevData.repositoryUrl || '',
        projectSummary: prevData.projectSummary || '',
        keyFeatures: prevData.keyFeatures || '',
        technologiesUsed: prevData.technologiesUsed || '',
        challengesFaced: prevData.challengesFaced || '',
        projectStatus: prevData.projectStatus || 'completed',
        additionalNotes: prevData.additionalNotes || ''
      });
    }
  }, [existingSubmission]);

  const fetchGroupData = async () => {
    try {
      console.log('🔍 Fetching group data for:', groupId);
      
      // Get group information
      const groupDoc = await getDoc(doc(db, 'groups', groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const data = groupDoc.data();
      console.log('📋 Group data:', data);
      
      // Check if current user is admin of this group
      if (data.adminEmail !== currentUser.email) {
        throw new Error('You must be the project owner to submit for completion');
      }
      
      setGroupData({ id: groupDoc.id, ...data });

      // Get team members
      const membersQuery = query(
        collection(db, 'group_members'),
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      );
      
      const membersSnapshot = await getDocs(membersQuery);
      const membersList = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('👥 Team members:', membersList);
      setTeamMembers(membersList);
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Error fetching group data:', error);
      toast.error(error.message);
      setLoading(false);
    }
  };

  const checkExistingSubmission = async () => {
    try {
      const submissionQuery = query(
        collection(db, 'project_completion_requests'),
        where('groupId', '==', groupId),
        where('status', 'in', ['pending_admin_approval', 'admin_approved', 'rejected'])
      );
      
      const submissionSnapshot = await getDocs(submissionQuery);
      if (!submissionSnapshot.empty) {
        const submission = { id: submissionSnapshot.docs[0].id, ...submissionSnapshot.docs[0].data() };
        setExistingSubmission(submission);
        console.log('📋 Existing submission found:', submission);
      }
    } catch (error) {
      console.error('Error checking existing submission:', error);
    }
  };

  const handleProjectReviewFormChange = (e) => {
    const { name, value } = e.target;
    setProjectReviewForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🔥 UPDATED: submitForAdminReview with email notifications
  const submitForAdminReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      console.log('📝 Submitting project for admin review...');

      // Validate required fields
      if (!projectReviewForm.projectUrl.trim()) {
        throw new Error('Project URL is required');
      }
      if (!projectReviewForm.repositoryUrl.trim()) {
        throw new Error('GitHub Repository URL is required');
      }
      if (!projectReviewForm.projectSummary.trim()) {
        throw new Error('Project summary is required');
      }

      // Validate GitHub URL format
      const githubUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?$/;
      if (!githubUrlPattern.test(projectReviewForm.repositoryUrl.trim())) {
        throw new Error('Please provide a valid GitHub repository URL (e.g., https://github.com/username/repository)');
      }

      // Create submission data structure
      const submissionData = {
        // Group and project info
        groupId: groupId,
        projectTitle: groupData.projectTitle,
        adminEmail: currentUser.email,
        adminName: currentUser.displayName || currentUser.email,
        adminId: currentUser.uid,
        
        // Project details for admin review
        projectReview: {
          projectUrl: projectReviewForm.projectUrl.trim(),
          demoUrl: projectReviewForm.demoUrl.trim() || null,
          repositoryUrl: projectReviewForm.repositoryUrl.trim(),
          projectSummary: projectReviewForm.projectSummary.trim(),
          keyFeatures: projectReviewForm.keyFeatures.trim() || null,
          technologiesUsed: projectReviewForm.technologiesUsed.trim() || null,
          challengesFaced: projectReviewForm.challengesFaced.trim() || null,
          projectStatus: projectReviewForm.projectStatus,
          additionalNotes: projectReviewForm.additionalNotes.trim() || null,
          
          // GitHub requirements tracking
          githubRequirements: {
            repositoryIsPublic: true,
            favoredOnlineIncAdded: true,
            teamMembersIncluded: true,
            requirementsMet: true
          }
        },
        
        // Team information
        teamSize: teamMembers.length,
        teamMembers: teamMembers.map(member => ({
          memberName: member.userName,
          memberEmail: member.userEmail,
          role: member.projectRole || member.role,
          joinedAt: member.joinedAt
        })),
        
        // Workflow status
        status: 'pending_admin_approval',
        phase: 'admin_review',
        submittedForApprovalAt: serverTimestamp(),
        
        // Admin approval fields (will be filled by admin)
        adminApproval: {
          approved: null,
          approvedAt: null,
          approvedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null
        },
        
        // Badge assignment will happen in Phase 2 after admin approval
        badgeAssignmentStatus: 'pending',
        
        // Original project connection
        originalProjectId: groupData.originalProjectId || null
      };

      console.log('📋 Submission data:', submissionData);

      let docRef;
      const isResubmission = existingSubmission && existingSubmission.status === 'rejected';
      
      if (isResubmission) {
        // Update existing rejected submission instead of creating new one
        await updateDoc(doc(db, 'project_completion_requests', existingSubmission.id), {
          ...submissionData,
          // Keep creation timestamp, update submission timestamp
          createdAt: existingSubmission.createdAt,
          // Reset admin approval fields for re-review
          'adminApproval.approved': null,
          'adminApproval.rejectedAt': null,
          'adminApproval.rejectedBy': null,
          'adminApproval.rejectionReason': null,
          resubmittedAt: serverTimestamp(),
          resubmissionCount: (existingSubmission.resubmissionCount || 0) + 1
        });
        
        docRef = { id: existingSubmission.id };
        console.log('✅ Existing rejected submission updated:', existingSubmission.id);
        
      } else {
        // Create new submission for first-time submissions
        submissionData.createdAt = serverTimestamp();
        docRef = await addDoc(collection(db, 'project_completion_requests'), submissionData);
        console.log('✅ New submission created with ID:', docRef.id);
      }

      // 🔥 NEW: Send email notification to admins
      try {
        console.log('📧 Sending admin notification email for project review...');
        
        const emailData = {
          projectData: {
            projectTitle: groupData.projectTitle,
            contactName: currentUser.displayName || currentUser.email.split('@')[0] || 'Project Owner',
            contactEmail: currentUser.email,
            companyName: groupData.companyName || 'Team Project',
            projectType: 'Completion Review',
            timeline: 'Review Required',
            experienceLevel: 'Team Project',
            budget: 'N/A',
            projectDescription: projectReviewForm.projectSummary,
            // Additional completion-specific data
            repositoryUrl: projectReviewForm.repositoryUrl,
            projectUrl: projectReviewForm.projectUrl,
            demoUrl: projectReviewForm.demoUrl || null,
            teamSize: teamMembers.length,
            isResubmission: isResubmission,
            completionRequestId: docRef.id,
            submissionType: 'project_completion_review'
          }
        };
        const emailResult = await sendEmailNotification('send-project-submitted-admin', emailData);
        
        if (emailResult.success) {
          console.log('✅ Admin notification email sent successfully');
          toast.success(
            isResubmission 
              ? '🔄 Project resubmitted for admin review!\n\n📧 Admin notification email sent\n📋 You\'ll be notified when the review is complete'
              : '🎉 Project submitted for admin review!\n\n📧 Admin notification email sent\n📋 You\'ll be notified when approved for badge assignment'
          );
        } else {
          console.warn('⚠️ Admin notification email failed:', emailResult.error);
          toast.success(
            isResubmission 
              ? '🔄 Project resubmitted for admin review!\n\n📋 Next Steps:\n• Admin will re-evaluate your updated submission\n• You\'ll be notified when the review is complete'
              : '🎉 Project submitted for admin review!\n\n📋 Next Steps:\n• Admin will verify GitHub repository and team credits\n• You\'ll be notified when approved for badge assignment\n• Make sure "FavoredOnlineInc" has collaborator access'
          );
        }
        
      } catch (emailError) {
        console.error('📧 Failed to send admin notification email:', emailError);
        // Don't throw - email failure shouldn't break the submission process
        toast.success(
          isResubmission 
            ? '🔄 Project resubmitted for admin review!\n\n📋 Admin will re-evaluate your submission\n(Note: Email notification failed, but submission was successful)'
            : '🎉 Project submitted for admin review!\n\n📋 Admin will verify your project\n(Note: Email notification failed, but submission was successful)'
        );
      }

      // Update group status
      await updateDoc(doc(db, 'groups', groupId), {
        'completionStatus.isReadyForCompletion': false,
        'completionStatus.submittedForReview': true,
        'completionStatus.submittedAt': serverTimestamp(),
        status: 'pending_completion_review'
      });

      // Send notification to Firebase (existing code)
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientType: 'admin',
          type: 'project_completion_review',
          title: isResubmission ? 'Project Resubmitted for Review' : 'New Project Completion Review Request',
          message: `${groupData.projectTitle} has been ${isResubmission ? 'resubmitted' : 'submitted'} for completion review by ${currentUser.displayName || currentUser.email}`,
          groupId: groupId,
          completionRequestId: docRef.id,
          projectUrl: projectReviewForm.projectUrl,
          repositoryUrl: projectReviewForm.repositoryUrl,
          isResubmission: isResubmission,
          createdAt: serverTimestamp(),
          read: false,
          priority: 'normal'
        });
      } catch (notificationError) {
        console.warn('Failed to send Firebase admin notification:', notificationError);
      }
      
      // Refresh to show the new status
      await checkExistingSubmission();
      
    } catch (error) {
      console.error('❌ Error submitting for review:', error);
      toast.error('Error submitting project: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading project details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!groupData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-white text-center max-w-sm sm:max-w-md mx-auto p-4 sm:p-6">
          <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Group Not Found</h2>
          <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">Could not load group information.</p>
          <Link 
            to="/my-groups"
            className="bg-lime-500 hover:bg-lime-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
          >
            ← Back to My Groups
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-x-hidden flex flex-col relative"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Animated background overlay - Responsive */}
      <div 
        className="fixed inset-0 opacity-20 sm:opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />
      
      {/* Header - Enhanced responsive design */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-6 py-2 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-7 h-7 sm:w-10 sm:h-10 mr-2 sm:mr-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-base sm:text-2xl font-black text-white tracking-wide" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  <span className="hidden xs:inline">Favored Online</span>
                  <span className="xs:hidden">FO</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation - Hidden on mobile/tablet */}
            <nav className="hidden lg:flex items-center space-x-6 xl:space-x-10">
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
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-3 xl:px-4 py-1 xl:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 xl:w-8 xl:h-8 rounded-full mr-2 xl:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs xl:text-sm text-white font-medium truncate max-w-20 xl:max-w-none" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigate('/logout')} 
                    className="bg-white/10 hover:bg-white/20 text-white px-3 xl:px-6 py-1 xl:py-2 rounded-full text-xs xl:text-sm transition-all duration-300 backdrop-blur-sm border border-white/20 font-medium"
                  >
                    Logout
                  </button>
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
            <div className="lg:hidden">
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
          
          {/* Enhanced Mobile/Tablet Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 sm:mt-6 pb-3 sm:pb-6 rounded-xl sm:rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 sm:space-y-5 p-3 sm:p-6">
                
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>

                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-lg" 
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
                    <button 
                      onClick={() => navigate('/logout')} 
                      className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm transition-colors w-full font-medium"
                    >
                      Logout
                    </button>
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

      {/* Main Content - Improved mobile spacing */}
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-16">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-5xl prevent-overflow">
          
          {/* Header Section - Responsive typography */}
          <section className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 px-2"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                }}>
              Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">Project</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-200 mb-3 sm:mb-4 px-2">{groupData.projectTitle}</p>
            <p className="text-xs sm:text-sm text-gray-400 px-2">Submit your completed project for admin review</p>
          </section>

          {/* Process Flow Info - Responsive grid */}
          <section className="mb-8 sm:mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 prevent-overflow">
              <h3 className="text-lime-400 font-bold text-base sm:text-lg mb-3 sm:mb-4">📋 Completion Process</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">1</div>
                    <div>
                      <h4 className="text-white font-semibold text-sm sm:text-base">Submit Project for Review</h4>
                      <p className="text-gray-300 text-xs sm:text-sm">Share your project URL and details for admin evaluation</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">2</div>
                    <div>
                      <h4 className="text-white font-semibold text-sm sm:text-base">Admin Reviews Work</h4>
                      <p className="text-gray-300 text-xs sm:text-sm">Admin evaluates the actual project and its quality</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">3</div>
                    <div>
                      <h4 className="text-white font-semibold text-sm sm:text-base">Project Approved</h4>
                      <p className="text-gray-300 text-xs sm:text-sm">Once approved, you can assign badges to team members</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">4</div>
                    <div>
                      <h4 className="text-white font-semibold text-sm sm:text-base">Award Badges</h4>
                      <p className="text-gray-300 text-xs sm:text-sm">Recognize team member contributions with digital badges</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Existing Submission Status - Responsive layout */}
          {existingSubmission && (
            <section className="mb-8 sm:mb-12">
              <div className={`bg-gradient-to-br backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border prevent-overflow ${
                existingSubmission.status === 'admin_approved' 
                  ? 'from-green-500/20 via-green-600/20 to-green-700/20 border-green-500/30'
                  : existingSubmission.status === 'rejected'
                  ? 'from-red-500/20 via-red-600/20 to-red-700/20 border-red-500/30'
                  : 'from-yellow-500/20 via-yellow-600/20 to-yellow-700/20 border-yellow-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                  <h3 className={`font-bold text-base sm:text-lg ${
                    existingSubmission.status === 'admin_approved' ? 'text-green-400' : 
                    existingSubmission.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {existingSubmission.status === 'admin_approved' ? '✅ Project Approved!' : 
                     existingSubmission.status === 'rejected' ? '❌ Project Rejected' : '⏳ Under Review'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${
                    existingSubmission.status === 'admin_approved' 
                      ? 'bg-green-500/20 text-green-400' 
                      : existingSubmission.status === 'rejected'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {existingSubmission.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="text-gray-300 text-xs sm:text-sm mb-3 sm:mb-4 space-y-1">
                  <p><strong>Submitted:</strong> {existingSubmission.submittedForApprovalAt?.toDate?.()?.toLocaleDateString()}</p>
                  {existingSubmission.resubmittedAt && (
                    <p><strong>Last Resubmitted:</strong> {existingSubmission.resubmittedAt?.toDate?.()?.toLocaleDateString()}</p>
                  )}
                  <div className="space-y-1">
                    <strong>Project URL:</strong>
                    <a href={existingSubmission.projectReview?.projectUrl} target="_blank" rel="noopener noreferrer" 
                       className="text-blue-400 hover:text-blue-300 underline break-all block word-break overflow-wrap-anywhere">
                      {existingSubmission.projectReview?.projectUrl}
                    </a>
                  </div>
                </div>

                {/* Show rejection reason if rejected */}
                {existingSubmission.status === 'rejected' && (
                  <div className="text-red-300 mb-3 sm:mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <p className="font-semibold text-sm sm:text-base">Rejection Reason:</p>
                    <p className="mt-1 text-xs sm:text-sm">{existingSubmission.adminApproval?.rejectionReason || 'No specific reason provided'}</p>
                    <p className="text-xs mt-2 text-red-400">Please address the issues above and resubmit your project.</p>
                  </div>
                )}

                {existingSubmission.status === 'admin_approved' && (
                  <div className="space-y-3 sm:space-y-4">
                    <p className="text-green-300 text-sm sm:text-base">
                      🎉 Congratulations! Your project has been approved. You can now assign badges to your team members.
                    </p>
                    <Link 
                      to={`/career/project-completion/${groupId}`}
                      className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    >
                      🏆 Assign Team Badges
                    </Link>
                  </div>
                )}

                {existingSubmission.status === 'pending_admin_approval' && (
                  <p className="text-yellow-300 text-sm sm:text-base">
                    📋 Your project is currently under admin review. You will be notified once the review is complete.
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Project Submission Form - Mobile-optimized */}
          {(!existingSubmission || existingSubmission.status === 'rejected') && (
            <section className="mb-8 sm:mb-12">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-white/20 prevent-overflow">
                <form onSubmit={submitForAdminReview} className="space-y-4 sm:space-y-6">
                  
                  <div className="mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                      📝 {existingSubmission?.status === 'rejected' ? 'Resubmit' : 'Submit'} Project for Admin Review
                    </h2>
                    
                    <p className="text-gray-300 text-sm sm:text-base mb-3 sm:mb-4">
                      Share your completed project details so our admin can review the work before badge assignment.
                    </p>
                    
                    {/* 👇 THE WARNING MESSAGE IS HERE 👇 */}
                    <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 sm:mb-6">
                      <h4 className="text-red-400 font-bold text-sm sm:text-lg mb-2">⚠️ IMPORTANT: One Submission Only</h4>
                      <div className="text-red-300 text-xs sm:text-sm space-y-1">
                        <p>• <strong>Only quality projects will be approved</strong></p>
                        <p>• <strong>No second submissions allowed</strong> - make it count!</p>
                        <p>• Ensure your project meets ALL requirements before submitting</p>
                        <p>• Double-check GitHub repository is public with team credits</p>
                      </div>
                    </div>
                    {/* 👆 THE WARNING MESSAGE IS HERE 👆 */}
                    
                    {/* Email notification notice - Mobile responsive */}
                    <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-4 sm:mb-6">
                      <h4 className="text-blue-400 font-bold text-sm sm:text-lg mb-2">📧 Auto-Notification System</h4>
                      <div className="text-blue-300 text-xs sm:text-sm space-y-1">
                        <p>• Admins will automatically receive email notification of your submission</p>
                        <p>• You'll get email confirmation when your project is reviewed</p>
                        <p>• All notifications are tracked for your reference</p>
                      </div>
                    </div>
                    
                    {/* GitHub Requirements Alert - Mobile responsive */}
                    <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4 sm:mb-6">
                      <h4 className="text-red-400 font-bold text-sm sm:text-lg mb-2">⚠️ IMPORTANT: GitHub Requirements</h4>
                      <div className="text-red-300 text-xs sm:text-sm space-y-1">
                        <p>• <strong>GitHub repository URL is REQUIRED</strong> for all project submissions</p>
                        <p>• Repository must be set to <strong>PUBLIC</strong> for all projects</p>
                        <p>• You must add <strong>"FavoredOnlineInc"</strong> as a collaborator</p>
                        <p>• All team members' full names must be visible in your project</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Fields - Mobile optimized */}
                  
                  {/* Project URL - Required */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Project URL * 
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Live demo, deployed app, or main project link)</span>
                    </label>
                    <input
                      type="url"
                      name="projectUrl"
                      value={projectReviewForm.projectUrl}
                      onChange={handleProjectReviewFormChange}
                      required
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="https://your-project.com or https://github.com/user/repo"
                    />
                  </div>

                  {/* Demo URL - Optional */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Live Demo URL (Optional)
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Deployed/hosted version - different from GitHub)</span>
                    </label>
                    <input
                      type="url"
                      name="demoUrl"
                      value={projectReviewForm.demoUrl}
                      onChange={handleProjectReviewFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="https://your-app.vercel.app or https://your-app.netlify.app"
                    />
                  </div>

                  {/* Repository URL - REQUIRED */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      GitHub Repository URL *
                      <span className="text-red-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Required for project verification)</span>
                    </label>
                    <input
                      type="url"
                      name="repositoryUrl"
                      value={projectReviewForm.repositoryUrl}
                      onChange={handleProjectReviewFormChange}
                      required
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="https://github.com/username/repository-name"
                    />
                    
                    {/* GitHub Requirements - Mobile responsive */}
                    <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl">
                      <h5 className="text-blue-400 font-bold text-xs sm:text-sm mb-2">📋 GitHub Repository Requirements:</h5>
                      <ul className="text-gray-300 text-xs sm:text-sm space-y-1">
                        <li>✅ <strong>Must be PUBLIC</strong> for all projects</li>
                        <li>✅ <strong>Add "FavoredOnlineInc" as collaborator</strong> to the repository</li>
                        <li>✅ <strong>Include all team members' full names</strong> in your project (as a page, README section, or presentation)</li>
                        <li>✅ Repository must contain the actual project code</li>
                      </ul>
                    </div>
                  </div>

                  {/* Project Summary - Required */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Project Summary *
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Brief overview of what was built)</span>
                    </label>
                    <textarea
                      name="projectSummary"
                      value={projectReviewForm.projectSummary}
                      onChange={handleProjectReviewFormChange}
                      required
                      rows={3}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical text-sm sm:text-base"
                      placeholder="Describe what your team built, the main purpose, and key accomplishments..."
                    />
                  </div>

                  {/* Key Features */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Key Features (Optional)
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Main functionality and features)</span>
                    </label>
                    <textarea
                      name="keyFeatures"
                      value={projectReviewForm.keyFeatures}
                      onChange={handleProjectReviewFormChange}
                      rows={3}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical text-sm sm:text-base"
                      placeholder="• User authentication&#10;• Real-time messaging&#10;• Data visualization&#10;• etc..."
                    />
                  </div>

                  {/* Technologies Used */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Technologies Used (Optional)
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Programming languages, frameworks, tools)</span>
                    </label>
                    <input
                      type="text"
                      name="technologiesUsed"
                      value={projectReviewForm.technologiesUsed}
                      onChange={handleProjectReviewFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                      placeholder="React, Node.js, MongoDB, AWS, Python, etc."
                    />
                  </div>

                  {/* Challenges Faced */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Challenges Faced (Optional)
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Technical or coordination challenges)</span>
                    </label>
                    <textarea
                      name="challengesFaced"
                      value={projectReviewForm.challengesFaced}
                      onChange={handleProjectReviewFormChange}
                      rows={3}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical text-sm sm:text-base"
                      placeholder="Describe any significant challenges your team overcame during development..."
                    />
                  </div>

                  {/* Project Status */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Project Status
                    </label>
                    <select
                      name="projectStatus"
                      value={projectReviewForm.projectStatus}
                      onChange={handleProjectReviewFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                    >
                      <option value="completed">✅ Completed</option>
                      <option value="mostly-completed">🟡 Mostly Completed</option>
                      <option value="mvp-completed">🎯 MVP Completed</option>
                    </select>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                      Additional Notes (Optional)
                      <span className="text-gray-400 text-xs sm:text-sm font-normal ml-1 sm:ml-2 block sm:inline">(Anything else the admin should know)</span>
                    </label>
                    <textarea
                      name="additionalNotes"
                      value={projectReviewForm.additionalNotes}
                      onChange={handleProjectReviewFormChange}
                      rows={3}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical text-sm sm:text-base"
                      placeholder="Any additional information or context for the admin review..."
                    />
                  </div>

                  {/* Team Summary - Mobile responsive */}
                  <div className="p-3 sm:p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl">
                    <h4 className="text-blue-400 font-bold mb-2 sm:mb-3 text-sm sm:text-base">👥 Team Summary</h4>
                    <div className="text-gray-300 text-xs sm:text-sm">
                      <p><strong>Team Size:</strong> {teamMembers.length} members</p>
                      <p><strong>Team Members:</strong></p>
                      <ul className="ml-3 sm:ml-4 mt-2 space-y-1">
                        {teamMembers.map((member, index) => (
                          <li key={index} className="break-words word-break">• {member.userName} - {member.projectRole || member.role}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* GitHub Setup Instructions - Mobile responsive */}
                  <div className="p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg sm:rounded-xl">
                    <h4 className="text-yellow-400 font-bold mb-2 sm:mb-3 text-sm sm:text-base">🛠️ GitHub Repository Setup Instructions</h4>
                    <div className="text-gray-300 text-xs sm:text-sm space-y-2">
                      <div>
                        <strong className="text-white">1. Make Repository Public:</strong>
                        <p className="ml-3 sm:ml-4">Go to Settings → General → Change repository visibility to Public</p>
                      </div>
                      <div>
                        <strong className="text-white">2. Add FavoredOnlineInc as Collaborator:</strong>
                        <p className="ml-3 sm:ml-4">Go to Settings → Manage access → Invite "FavoredOnlineInc" with Read access</p>
                      </div>
                      <div>
                        <strong className="text-white">3. Include Team Member Credits:</strong>
                        <p className="ml-3 sm:ml-4">Add all team members' full names in one of these formats:</p>
                        <ul className="ml-6 sm:ml-8 mt-1 space-y-1">
                          <li>• README.md "Contributors" or "Team Members" section</li>
                          <li>• Dedicated "About Us" or "Team" page in your project</li>
                          <li>• Credits slide in project presentation</li>
                          <li>• Footer or credits section in your application</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Project Requirements Checklist - Mobile responsive */}
                  <div className="p-3 sm:p-4 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl">
                    <h4 className="text-red-400 font-bold mb-2 sm:mb-3 text-sm sm:text-base">✅ Pre-Submission Checklist</h4>
                    <div className="text-red-300 text-xs sm:text-sm">
                      <p className="mb-2">Please verify before submitting:</p>
                      <ul className="space-y-1">
                        <li>☐ GitHub repository is set to <strong>PUBLIC</strong></li>
                        <li>☐ "FavoredOnlineInc" has been added as collaborator</li>
                        <li>☐ All {teamMembers.length} team members' full names are visible in the project</li>
                        <li>☐ Repository contains the actual working project code</li>
                        <li>☐ Project is functional and ready for review</li>
                        <li>☐ Project URL and GitHub URL both work and are accessible</li>
                      </ul>
                    </div>
                  </div>

                  {/* Submit Button - Mobile responsive */}
                  <div className="text-center pt-4 sm:pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-sm sm:text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      style={{
                        boxShadow: '0 0 40px rgba(59, 130, 246, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                      <span className="relative flex items-center justify-center">
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                            <span className="hidden sm:inline">
                              {existingSubmission?.status === 'rejected' ? 'Resubmitting...' : 'Submitting for Review...'}
                            </span>
                            <span className="sm:hidden">
                              {existingSubmission?.status === 'rejected' ? 'Resubmitting...' : 'Submitting...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">
                              📝 {existingSubmission?.status === 'rejected' ? 'Resubmit for Admin Review' : 'Submit for Admin Review'}
                            </span>
                            <span className="sm:hidden">
                              📝 {existingSubmission?.status === 'rejected' ? 'Resubmit Project' : 'Submit Project'}
                            </span>
                            <span className="ml-2 sm:ml-3 group-hover:translate-x-1 transition-transform">→</span>
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                    
                    <p className="text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4 px-2">
                      📧 Admins will be automatically notified via email when you submit your project
                    </p>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Back Navigation - Mobile responsive */}
          <section className="text-center">
            <Link 
              to={`/groups/${groupId}`}
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              ← Back to Group
            </Link>
          </section>
        </div>
      </main>

      {/* Custom Styles - Enhanced for responsive */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        /* Custom breakpoint for extra small devices */
        @media (min-width: 475px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
        
        @media (max-width: 474px) {
          .xs\\:inline { display: none; }
          .xs\\:hidden { display: inline; }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        @media (min-width: 640px) {
          ::-webkit-scrollbar {
            width: 8px;
          }
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

        /* Form focus states */
        input:focus, textarea:focus, select:focus {
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
        
        select option {
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 640px) {
          input, textarea, select {
            font-size: 16px; /* Prevents zoom on iOS */
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
          }
          
          /* Reduce backdrop blur on mobile for better performance */
          .backdrop-blur-2xl {
            backdrop-filter: blur(12px);
          }
          
          /* Ensure no element can cause horizontal scroll */
          * {
            max-width: 100%;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          /* Special handling for URLs and long text */
          a, p, span, div {
            word-break: break-word;
            overflow-wrap: anywhere;
          }
        }
        
        /* Prevent horizontal scroll on mobile */
        html, body {
          overflow-x: hidden;
          max-width: 100vw;
        }
        
        /* Global container overflow prevention */
        * {
          box-sizing: border-box;
        }
        
        /* Ensure all containers respect viewport width */
        .container {
          max-width: 100%;
          overflow-x: hidden;
        }
        
        /* Better touch targets for mobile */
        @media (max-width: 640px) {
          button, a, input, textarea, select {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* URL and long text handling */
        .break-all {
          word-break: break-all;
          overflow-wrap: anywhere;
          hyphens: auto;
        }
        
        .word-break {
          word-break: break-word;
          overflow-wrap: break-word;
        }
        
        .overflow-wrap-anywhere {
          overflow-wrap: anywhere;
        }
        
        /* Prevent any horizontal overflow */
        .prevent-overflow {
          max-width: 100%;
          overflow-x: hidden;
          word-wrap: break-word;
        }
      `}</style>
    </div>
  );
};

export default ProjectCompletionForm;
