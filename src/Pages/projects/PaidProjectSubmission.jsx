// src/Pages/projects/PaidProjectSubmission.jsx - PAID PROJECT SUBMISSION FORM
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const PaidProjectSubmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Check if we're editing an existing project
  const editProjectId = searchParams.get('edit');
  const isEditing = Boolean(editProjectId);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectType: '',
    budget: '',
    estimatedHours: '',
    deadline: '',
    experienceLevel: '',
    skills: '',
    requirements: '',
    deliverables: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterCompany: '',
    recruiterWebsite: '',
    additionalInfo: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [loading, setLoading] = useState(false);

  // Authentication Check - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: '/submit-paid-project', message: 'Please sign in to submit a project' }
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

  // Pre-fill user information if logged in
  useEffect(() => {
    if (currentUser && !formData.recruiterEmail && !isEditing) {
      setFormData(prev => ({
        ...prev,
        recruiterEmail: currentUser.email || '',
        recruiterName: currentUser.displayName || ''
      }));
    }
  }, [currentUser, formData.recruiterEmail, isEditing]);

  // Load project data if editing
  useEffect(() => {
    if (isEditing && editProjectId && currentUser) {
      loadProjectForEditing();
    }
  }, [isEditing, editProjectId, currentUser]);

  const loadProjectForEditing = async () => {
    try {
      setLoading(true);
      const projectRef = doc(db, 'paid_projects', editProjectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const data = projectSnap.data();
        
        // Check if current user owns this project
        if (data.posterId !== currentUser.uid) {
          toast.error('You can only edit your own projects');
          navigate('/paid-projects');
          return;
        }
        
        // Fill form with existing data
        setFormData({
          title: data.title || '',
          description: data.description || '',
          projectType: data.projectType || '',
          budget: data.budget?.toString() || '',
          estimatedHours: data.estimatedHours?.toString() || '',
          deadline: data.deadline ? new Date(data.deadline.toDate()).toISOString().split('T')[0] : '',
          experienceLevel: data.experienceLevel || '',
          skills: data.skills ? data.skills.join(', ') : '',
          requirements: data.requirements || '',
          deliverables: data.deliverables || '',
          recruiterName: data.recruiterName || '',
          recruiterEmail: data.recruiterEmail || '',
          recruiterCompany: data.recruiterCompany || '',
          recruiterWebsite: data.recruiterWebsite || '',
          additionalInfo: data.additionalInfo || ''
        });
      } else {
        toast.error('Project not found');
        navigate('/paid-projects');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Error loading project data');
      navigate('/paid-projects');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear budget error when user changes budget
    if (name === 'budget') {
      setBudgetError('');
    }
  };

  // Validate budget
  const validateBudget = (budget) => {
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setBudgetError('Please enter a valid budget amount');
      return false;
    }
    if (numBudget < 50) {
      setBudgetError('Minimum budget is $50');
      return false;
    }
    if (numBudget > 1000000) {
      setBudgetError('Maximum budget is $1,000,000');
      return false;
    }
    setBudgetError('');
    return true;
  };

  const validateUrl = (url) => {
    if (!url) {
      setUrlError('');
      return true;
    }
    
    try {
      const urlPattern = /^https?:\/\/(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if (!urlPattern.test(url)) {
        setUrlError('Please enter a valid URL (e.g., https://yourcompany.com)');
        return false;
      }
      setUrlError('');
      return true;
    } catch (error) {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handleWebsiteChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, recruiterWebsite: url }));
    validateUrl(url);
  };

  const handleBudgetChange = (e) => {
    const budget = e.target.value;
    setFormData(prev => ({ ...prev, budget }));
    if (budget) {
      validateBudget(budget);
    } else {
      setBudgetError('');
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) errors.push('Project title is required');
    if (!formData.description.trim()) errors.push('Project description is required');
    if (!formData.projectType) errors.push('Project type is required');
    if (!formData.budget) errors.push('Budget is required');
    if (!formData.experienceLevel) errors.push('Experience level is required');
    if (!formData.recruiterName.trim()) errors.push('Recruiter name is required');
    if (!formData.recruiterEmail.trim()) errors.push('Recruiter email is required');
    if (!formData.recruiterCompany.trim()) errors.push('Company name is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.recruiterEmail && !emailRegex.test(formData.recruiterEmail)) {
      errors.push('Please enter a valid email address');
    }

    // Budget validation
    if (formData.budget && !validateBudget(formData.budget)) {
      errors.push(budgetError);
    }

    // Deadline validation (must be in the future if provided)
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      if (deadlineDate <= new Date()) {
        errors.push('Deadline must be in the future');
      }
    }

    // URL validation if provided
    if (formData.recruiterWebsite && !validateUrl(formData.recruiterWebsite)) {
      errors.push('Please enter a valid website URL');
    }
    
    return errors;
  };

  // Send admin notification email
  const sendAdminNotification = async (projectData, submitterData) => {
    try {
      console.log('📧 Sending admin notification for project submission...');
      
      const response = await fetch('/api/notifications/send-project-submission-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectData: projectData,
          submitterData: submitterData,
          isEdit: isEditing
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Admin notification sent successfully:', result.message);
        return { success: true, data: result };
      } else {
        console.error('❌ Admin notification failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending admin notification:', error);
      return { success: false, error: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Additional auth check before submission
    if (!currentUser) {
      toast.error('Please sign in to submit a project');
      navigate('/login');
      setIsSubmitting(false);
      return;
    }

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n• ${errors.join('\n• ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log(isEditing ? '📝 Updating project...' : '📝 Submitting project for admin approval...');

      // Prepare submission data
      const submissionData = {
        // Basic project information
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectType: formData.projectType,
        budget: parseFloat(formData.budget),
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : null,
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        experienceLevel: formData.experienceLevel,
        
        // Skills and requirements
        skills: formData.skills.trim() ? formData.skills.trim().split(',').map(skill => skill.trim()) : [],
        requirements: formData.requirements.trim() || null,
        deliverables: formData.deliverables.trim() || null,
        additionalInfo: formData.additionalInfo.trim() || null,
        
        // Recruiter information
        recruiterName: formData.recruiterName.trim(),
        recruiterEmail: formData.recruiterEmail.trim(),
        recruiterCompany: formData.recruiterCompany.trim(),
        recruiterWebsite: formData.recruiterWebsite.trim() || null,
        
        // System fields
        updatedAt: serverTimestamp()
      };

      let docRef;
      
      if (isEditing) {
        // Update existing project
        const projectRef = doc(db, 'paid_projects', editProjectId);
        await updateDoc(projectRef, {
          ...submissionData,
          // Keep original creation data
          editHistory: serverTimestamp()
        });
        docRef = { id: editProjectId };
        console.log('✅ Project updated with ID:', editProjectId);
      } else {
        // Create new project
        const newSubmissionData = {
          ...submissionData,
          // Additional fields for new projects
          createdAt: serverTimestamp(),
          submissionDate: serverTimestamp(),
          
          // Status and workflow
          status: 'pending_approval',
          workflowStage: 'submitted',
          
          // User information
          posterId: currentUser.uid,
          posterEmail: currentUser.email,
          posterName: currentUser.displayName || currentUser.email,
          posterPhoto: currentUser.photoURL || null,
          
          // Project management
          isActive: false,
          applications: [],
          
          // Metadata for admin dashboard
          submissionSource: 'web_form',
          projectComplexity: calculateProjectComplexity()
        };

        docRef = await addDoc(collection(db, 'paid_projects'), newSubmissionData);
        console.log('✅ Project submitted with ID:', docRef.id);
      }

      // Send admin notification email after successful Firebase submission
      const emailNotificationData = {
        ...submissionData,
        submissionDate: new Date(),
        deadline: formData.deadline ? new Date(formData.deadline) : null,
        id: docRef.id
      };

      const submitterData = {
        posterId: currentUser.uid,
        posterEmail: currentUser.email,
        posterName: currentUser.displayName || currentUser.email,
        posterPhoto: currentUser.photoURL || null
      };

      // Send admin notification
      const notificationResult = await sendAdminNotification(emailNotificationData, submitterData);
      
      if (notificationResult.success) {
        console.log('✅ Admin notification sent successfully');
        toast.success('📧 Admin has been notified of your submission!');
      } else {
        console.warn('⚠️ Admin notification failed, but project was still submitted:', notificationResult.error);
      }

      // Backup submission to Google Apps Script
      try {
        await fetch('https://script.google.com/macros/s/AKfycbxHrl4fwEpKC5ZXnGc29O16SDsbfvUp4gGBvhlU1oVwPtpmxnIN866IHOkMKd8ZUCJpcA/exec', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...submissionData,
            submissionDate: new Date().toISOString(),
            deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
            id: docRef.id,
            type: 'project',
            action: isEditing ? 'update' : 'create'
          })
        });
        console.log('✅ Backup submission successful');
      } catch (scriptError) {
        console.log('⚠️ Google Apps Script backup failed (this is okay):', scriptError);
      }

      setSubmitStatus('success');
      
      // Show success message
      const successMessage = isEditing 
        ? '🎉 Project updated successfully!\n\n📋 Your changes have been saved and are now live.'
        : '🎉 Project submitted successfully!\n\n📋 Next steps:\n• Admin will review your project\n• You\'ll get an email when approved\n• Project will be published on the projects page\n• Developers can apply via email';
      
      toast.success(successMessage);

      if (!isEditing) {
        // Reset form for new submissions
        setFormData({
          title: '',
          description: '',
          projectType: '',
          budget: '',
          estimatedHours: '',
          deadline: '',
          experienceLevel: '',
          skills: '',
          requirements: '',
          deliverables: '',
          recruiterName: currentUser?.displayName || '',
          recruiterEmail: currentUser?.email || '',
          recruiterCompany: '',
          recruiterWebsite: '',
          additionalInfo: ''
        });
      }

      // Redirect to projects page after delay
      setTimeout(() => {
        navigate('/paid-projects');
      }, 3000);

    } catch (error) {
      console.error('❌ Firebase submission error:', error);
      
      // Enhanced error handling with fallback
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please make sure you\'re logged in and try again.');
      } else if (error.code === 'network-request-failed') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        setSubmitStatus('error');
        toast.error('Submission failed. Please try again or contact support.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate project complexity for admin dashboard
  const calculateProjectComplexity = () => {
    let complexity = 'simple';
    
    const description = formData.description.toLowerCase();
    const budget = parseFloat(formData.budget);
    const estimatedHours = parseInt(formData.estimatedHours) || 0;
    
    // Check for complex keywords
    const complexKeywords = ['ai', 'machine learning', 'blockchain', 'advanced', 'enterprise', 'scalable'];
    const hasComplexKeywords = complexKeywords.some(keyword => 
      description.includes(keyword) || formData.title.toLowerCase().includes(keyword)
    );
    
    // Check budget and time complexity
    const isHighBudget = budget > 5000;
    const isLongProject = estimatedHours > 100;
    const hasMultipleSkills = formData.skills.split(',').length > 5;
    
    if (hasComplexKeywords || isHighBudget || isLongProject || hasMultipleSkills) {
      complexity = 'complex';
    } else if (budget > 1000 || estimatedHours > 40 || formData.description.length > 500) {
      complexity = 'moderate';
    }
    
    return complexity;
  };

  // Navigation helper function
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Get minimum date (tomorrow)
  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  };

  // Show loading screen while checking authentication or loading project data
  if (authLoading || loading) {
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
            {authLoading ? 'Checking authentication...' : loading ? 'Loading project data...' : 'Loading...'}
          </p>
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
                💼 {isEditing ? 'Edit Project' : 'Submit Project'}
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
                  💼 {isEditing ? 'Edit Project' : 'Submit Project'}
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
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-6xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 sm:mb-24 md:mb-32 pt-8 sm:pt-12 md:pt-20">
            <div className="max-w-4xl mx-auto text-center">
              
              {/* User Welcome Message */}
              <div className="mb-6 p-4 bg-gradient-to-r from-lime-500/10 to-green-500/10 rounded-xl border border-lime-500/20">
                <p className="text-lime-300 font-semibold">
                  👋 Welcome, {currentUser.displayName || currentUser.email}! 
                  {isEditing ? ' Update your project details below.' : ' Ready to find talented developers?'}
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
                  💼 {isEditing ? 'Edit Your Project' : 'Post Paid Project'}
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
                {isEditing ? 'Update Your' : 'Post Your'}{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Project
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                {isEditing 
                  ? 'Make changes to your project and reach the right developers.'
                  : 'Connect with skilled developers and designers for your next project.'
                } <span className="text-lime-300 font-semibold"> Find the perfect talent</span> for your needs.
              </p>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Submission Form */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl">
              
              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mb-8 p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="text-green-400 text-2xl mr-4">✅</div>
                    <div>
                      <h3 className="text-green-400 font-bold text-lg mb-2">
                        {isEditing ? 'Project Updated Successfully!' : 'Project Submitted Successfully!'}
                      </h3>
                      <p className="text-gray-200 mb-2">
                        {isEditing 
                          ? 'Your project changes have been saved and are now live.'
                          : 'Your project has been submitted for admin review.'
                        }
                      </p>
                      {!isEditing && (
                        <div className="text-sm text-gray-300">
                          <p>📋 <strong>Next steps:</strong></p>
                          <p>• Admin will review your project details</p>
                          <p>• You'll receive email notification when approved</p>
                          <p>• Project will be published on the projects page</p>
                          <p>• Developers can apply via your contact information</p>
                          <p>• 📧 Admin has been automatically notified</p>
                        </div>
                      )}
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
                      <p className="text-gray-200">There was an error submitting your project. Please try again or contact support.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Project Details Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Project Details
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Title */}
                    <div className="lg:col-span-2">
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter your project title (e.g., E-commerce Website Development)"
                      />
                    </div>

                    {/* Project Type */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project Type *
                      </label>
                      <select
                        name="projectType"
                        value={formData.projectType}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Select project type</option>
                        <option value="web-development">🌐 Web Development</option>
                        <option value="mobile-app">📱 Mobile App</option>
                        <option value="design">🎨 Design</option>
                        <option value="data-science">📊 Data Science</option>
                        <option value="ai-ml">🤖 AI/ML</option>
                        <option value="devops">⚙️ DevOps</option>
                        <option value="consulting">💼 Consulting</option>
                        <option value="other">💻 Other</option>
                      </select>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Experience Level Required *
                      </label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Select experience level</option>
                        <option value="entry">🟢 Entry Level</option>
                        <option value="mid">🟡 Mid Level</option>
                        <option value="senior">🟠 Senior Level</option>
                        <option value="expert">🔴 Expert Level</option>
                      </select>
                    </div>
                  </div>

                  {/* Budget and Hours */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Budget */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Budget (USD) *
                      </label>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleBudgetChange}
                        required
                        min="50"
                        max="1000000"
                        step="50"
                        className={`w-full bg-white/10 backdrop-blur-sm border ${budgetError ? 'border-red-500' : 'border-white/20'} rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300`}
                        placeholder="5000"
                      />
                      {budgetError && (
                        <p className="text-red-400 text-sm mt-2 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {budgetError}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm mt-2">Minimum budget: $50</p>
                    </div>

                    {/* Estimated Hours */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Estimated Hours
                      </label>
                      <input
                        type="number"
                        name="estimatedHours"
                        value={formData.estimatedHours}
                        onChange={handleInputChange}
                        min="1"
                        max="1000"
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="40"
                      />
                      <p className="text-gray-400 text-sm mt-2">Optional: Estimated time to complete</p>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Project Deadline
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      min={getMinDate()}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                    />
                    <p className="text-gray-400 text-sm mt-2">Optional: When do you need this completed?</p>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Project Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="Provide a detailed description of your project, including goals, features, and any specific requirements..."
                    />
                  </div>

                  {/* Skills Required */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Skills Required
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="React, Node.js, PostgreSQL, AWS, UI/UX Design (comma-separated)"
                    />
                    <p className="text-gray-400 text-sm mt-2">List the key skills and technologies needed</p>
                  </div>

                  {/* Requirements & Deliverables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Requirements
                      </label>
                      <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                        placeholder="Any specific requirements, constraints, or preferences..."
                      />
                    </div>

                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Deliverables
                      </label>
                      <textarea
                        name="deliverables"
                        value={formData.deliverables}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                        placeholder="What should be delivered upon completion..."
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Contact Information
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="recruiterName"
                        value={formData.recruiterName}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Contact Email *
                      </label>
                      <input
                        type="email"
                        name="recruiterEmail"
                        value={formData.recruiterEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="your.email@company.com"
                      />
                      <p className="text-gray-400 text-sm mt-2">Developers will contact you via this email</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Company/Organization *
                      </label>
                      <input
                        type="text"
                        name="recruiterCompany"
                        value={formData.recruiterCompany}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Your company or organization name"
                      />
                    </div>

                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Company Website
                      </label>
                      <input
                        type="url"
                        name="recruiterWebsite"
                        value={formData.recruiterWebsite}
                        onChange={handleWebsiteChange}
                        className={`w-full bg-white/10 backdrop-blur-sm border ${urlError ? 'border-red-500' : 'border-white/20'} rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300`}
                        placeholder="https://yourcompany.com"
                      />
                      {urlError && (
                        <p className="text-red-400 text-sm mt-2 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {urlError}
                        </p>
                      )}
                      <p className="text-gray-400 text-sm mt-2">Optional: Your company website</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-3 text-lg">
                    Additional Information
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Any additional details, application process, or questions you'd like to include..."
                  />
                </div>

                {/* Application Process Information */}
                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <h4 className="text-blue-400 font-bold mb-3">📧 How Applications Work:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
                    <div>
                      <p>📝 <strong>Direct Contact:</strong> Developers apply via your email</p>
                      <p>🌐 <strong>Website Link:</strong> Optional website gets opened first</p>
                      <p>📧 <strong>Email Template:</strong> Pre-filled application email</p>
                    </div>
                    <div>
                      <p>⚡ <strong>Quick Process:</strong> No complex registration forms</p>
                      <p>🎯 <strong>Targeted Reach:</strong> Only interested developers apply</p>
                      <p>💼 <strong>Professional:</strong> Structured application format</p>
                    </div>
                  </div>
                </div>

                {/* Process Information */}
                {!isEditing && (
                  <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="text-green-400 font-bold mb-3">📋 What Happens After Submission:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
                      <div>
                        <p>📧 <strong>Instant Admin Alert:</strong> Admin gets notified immediately</p>
                        <p>✅ <strong>Admin Review:</strong> Your project will be reviewed for quality</p>
                        <p>👀 <strong>Project Discovery:</strong> Your project will be featured on our projects page</p>
                      </div>
                      <div>
                        <p>💼 <strong>Developer Applications:</strong> Qualified developers can apply directly</p>
                        <p>🎯 <strong>Simple Process:</strong> No complex application systems</p>
                        <p>📬 <strong>Email Updates:</strong> You'll be notified at each step</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="text-center pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting || urlError || budgetError}
                    className="group relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-12 py-6 rounded-full font-black text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                          {isEditing ? 'Updating Project...' : 'Submitting Project...'}
                        </>
                      ) : (
                        <>
                          {isEditing ? 'Update Project' : 'Submit Project for Approval'}
                          <span className="ml-4 group-hover:translate-x-2 transition-transform text-2xl">💼</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                  
                  <p className="text-gray-400 text-sm mt-6" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    * Required fields. {isEditing 
                      ? 'Your changes will be saved immediately.' 
                      : 'Your project will be reviewed and approved before being published.'
                    }<br/>
                    {!isEditing && (
                      <>
                        📧 <strong>Admin will be automatically notified</strong> upon submission.<br/>
                        💼 <strong>Developers apply directly via email</strong> - no complex systems.
                      </>
                    )}
                  </p>
                </div>
              </form>
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

export default PaidProjectSubmission;
