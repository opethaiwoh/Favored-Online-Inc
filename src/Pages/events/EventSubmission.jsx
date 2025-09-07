// src/Pages/events/EventSubmission.jsx - ENHANCED WITH START & END DATES - NO DURATION RESTRICTION
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const EventSubmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Form state - UPDATED with start/end dates
  const [formData, setFormData] = useState({
    eventTitle: '',
    eventDescription: '',
    eventType: '',
    format: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    requirements: '',
    learningObjectives: '',
    organizerName: '',
    organizerEmail: '',
    organizerBio: '',
    meetingUrl: '',
    tags: '',
    additionalInfo: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [dateError, setDateError] = useState('');

  // Authentication Check - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: '/submit-event', message: 'Please sign in to submit an event' }
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
    if (currentUser && !formData.organizerEmail) {
      setFormData(prev => ({
        ...prev,
        organizerEmail: currentUser.email || '',
        organizerName: currentUser.displayName || ''
      }));
    }
  }, [currentUser, formData.organizerEmail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear date error when user changes dates
    if (name.includes('Date') || name.includes('Time')) {
      setDateError('');
    }
  };

  // Validate that end date/time is after start date/time - REMOVED 7-DAY RESTRICTION
  const validateDateRange = () => {
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      return true; // Let required field validation handle missing fields
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      setDateError('End date and time must be after start date and time');
      return false;
    }

    // REMOVED: 7-day duration restriction - now allows unlimited duration
    setDateError('');
    return true;
  };

  // Calculate event duration automatically
  const getEventDuration = () => {
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      return '';
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    
    if (endDateTime <= startDateTime) {
      return '';
    }

    const durationMs = endDateTime - startDateTime;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      const remainingHours = hours % 24;
      if (remainingHours === 0) {
        return `${days} day${days > 1 ? 's' : ''}`;
      }
      return `${days} day${days > 1 ? 's' : ''}, ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      if (minutes === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  const validateUrl = (url) => {
    if (!url) {
      setUrlError('');
      return true;
    }
    
    try {
      const urlPattern = /^https?:\/\/(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if (!urlPattern.test(url)) {
        setUrlError('Please enter a valid URL (e.g., https://meet.google.com/abc-defg-hij)');
        return false;
      }
      setUrlError('');
      return true;
    } catch (error) {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handleMeetingUrlChange = (e) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, meetingUrl: url }));
    validateUrl(url);
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.eventTitle.trim()) errors.push('Event title is required');
    if (!formData.eventDescription.trim()) errors.push('Event description is required');
    if (!formData.eventType) errors.push('Event type is required');
    if (!formData.format) errors.push('Event format is required');
    if (!formData.startDate) errors.push('Start date is required');
    if (!formData.startTime) errors.push('Start time is required');
    if (!formData.endDate) errors.push('End date is required');
    if (!formData.endTime) errors.push('End time is required');
    if (!formData.organizerName.trim()) errors.push('Organizer name is required');
    if (!formData.organizerEmail.trim()) errors.push('Organizer email is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.organizerEmail && !emailRegex.test(formData.organizerEmail)) {
      errors.push('Please enter a valid email address');
    }

    // Start date validation (must be in the future)
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    if (startDateTime <= new Date()) {
      errors.push('Start date and time must be in the future');
    }

    // Date range validation
    if (!validateDateRange()) {
      errors.push(dateError);
    }

    // URL validation if provided
    if (formData.meetingUrl && !validateUrl(formData.meetingUrl)) {
      errors.push('Please enter a valid meeting URL');
    }
    
    return errors;
  };

  // Send admin notification email
  const sendAdminNotification = async (eventData, submitterData) => {
    try {
      console.log('📧 Sending admin notification for event submission...');
      
      const response = await fetch('/api/notifications/send-event-submission-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventData: eventData,
          submitterData: submitterData
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
      toast.error('Please sign in to submit an event');
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
      console.log('📝 Submitting event for admin approval...');

      // Create start and end DateTime objects
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      // Calculate duration for backwards compatibility
      const durationMs = endDateTime - startDateTime;
      const calculatedDuration = getEventDuration();

      // Prepare submission data - UPDATED with start/end dates
      const submissionData = {
        // Basic event information
        eventTitle: formData.eventTitle.trim(),
        eventDescription: formData.eventDescription.trim(),
        eventType: formData.eventType,
        format: formData.format,
        
        // NEW: Start and End dates
        startDate: startDateTime,
        endDate: endDateTime,
        startTime: formData.startTime,
        endTime: formData.endTime,
        
        // BACKWARDS COMPATIBILITY: Keep old fields for existing systems
        eventDate: startDateTime, // Main event date for filtering
        duration: calculatedDuration, // Calculated duration string
        durationMs: durationMs, // Duration in milliseconds for calculations
        
        // Event details
        requirements: formData.requirements.trim() || null,
        learningObjectives: formData.learningObjectives.trim() || null,
        additionalInfo: formData.additionalInfo.trim() || null,
        
        // Organizer information
        organizerName: formData.organizerName.trim(),
        organizerEmail: formData.organizerEmail.trim(),
        organizerBio: formData.organizerBio.trim() || null,
        
        // Meeting details
        meetingUrl: formData.meetingUrl.trim() || null,
        
        // Tags and categorization
        tags: formData.tags.trim() ? formData.tags.trim().split(',').map(tag => tag.trim()) : [],
        
        // System fields
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Status and workflow
        status: 'pending_approval',
        workflowStage: 'submitted',
        
        // User information
        submitterId: currentUser.uid,
        submitterEmail: currentUser.email,
        submitterName: currentUser.displayName || currentUser.email,
        submitterPhoto: currentUser.photoURL || null,
        
        // Event management
        isActive: false,
        
        // Metadata for admin dashboard
        submissionSource: 'web_form',
        eventComplexity: calculateEventComplexity(),
        isMultiDay: formData.startDate !== formData.endDate
      };

      // Submit to Firebase
      const docRef = await addDoc(collection(db, 'tech_events'), submissionData);
      console.log('✅ Event submitted with ID:', docRef.id);

      // Send admin notification email after successful Firebase submission
      const emailNotificationData = {
        ...submissionData,
        submissionDate: new Date(),
        startDate: startDateTime,
        endDate: endDateTime,
        id: docRef.id
      };

      const submitterData = {
        submitterId: currentUser.uid,
        submitterEmail: currentUser.email,
        submitterName: currentUser.displayName || currentUser.email,
        submitterPhoto: currentUser.photoURL || null
      };

      // Send admin notification
      const notificationResult = await sendAdminNotification(emailNotificationData, submitterData);
      
      if (notificationResult.success) {
        console.log('✅ Admin notification sent successfully');
        toast.success('📧 Admin has been notified of your submission!');
      } else {
        console.warn('⚠️ Admin notification failed, but event was still submitted:', notificationResult.error);
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
            startDate: startDateTime.toISOString(),
            endDate: endDateTime.toISOString(),
            id: docRef.id,
            type: 'event'
          })
        });
        console.log('✅ Backup submission successful');
      } catch (scriptError) {
        console.log('⚠️ Google Apps Script backup failed (this is okay):', scriptError);
      }

      setSubmitStatus('success');
      
      // Show success message
      toast.success(
        '🎉 Event submitted successfully!\n\n' +
        '📋 Next steps:\n' +
        '• Admin will review your event\n' +
        '• You\'ll get an email when approved\n' +
        '• Event will be published on the events page\n' +
        '• Attendees can add it to their calendars'
      );

      // Reset form
      setFormData({
        eventTitle: '',
        eventDescription: '',
        eventType: '',
        format: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        requirements: '',
        learningObjectives: '',
        organizerName: currentUser?.displayName || '',
        organizerEmail: currentUser?.email || '',
        organizerBio: '',
        meetingUrl: '',
        tags: '',
        additionalInfo: ''
      });

      // Redirect to events page after delay
      setTimeout(() => {
        navigate('/events');
      }, 3000);

    } catch (error) {
      console.error('❌ Firebase submission error:', error);
      
      // Enhanced error handling with fallback
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please make sure you\'re logged in and try again.');
      } else if (error.code === 'network-request-failed') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Fallback to Google Apps Script if Firebase fails
        try {
          const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
          const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
          
          const response = await fetch('https://script.google.com/macros/s/AKfycbxHrl4fwEpKC5ZXnGc29O16SDsbfvUp4gGBvhlU1oVwPtpmxnIN866IHOkMKd8ZUCJpcA/exec', {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...formData,
              startDate: startDateTime.toISOString(),
              endDate: endDateTime.toISOString(),
              eventDate: startDateTime.toISOString(), // For backwards compatibility
              duration: getEventDuration(),
              submissionDate: new Date().toISOString(),
              status: 'pending_approval',
              type: 'event',
              submitterId: currentUser.uid,
              submitterEmail: currentUser.email
            })
          });

          if (response.ok) {
            setSubmitStatus('success');
            toast.success('Event submitted via backup system! You\'ll receive confirmation soon.');
            
            // Reset form
            setFormData({
              eventTitle: '',
              eventDescription: '',
              eventType: '',
              format: '',
              startDate: '',
              startTime: '',
              endDate: '',
              endTime: '',
              requirements: '',
              learningObjectives: '',
              organizerName: currentUser?.displayName || '',
              organizerEmail: currentUser?.email || '',
              organizerBio: '',
              meetingUrl: '',
              tags: '',
              additionalInfo: ''
            });
          } else {
            setSubmitStatus('error');
            toast.error('Submission failed. Please try again or contact support.');
          }
        } catch (fallbackError) {
          console.error('❌ Both Firebase and Google Apps Script failed:', fallbackError);
          setSubmitStatus('error');
          toast.error('Unable to submit event. Please try again later or contact support.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate event complexity for admin dashboard
  const calculateEventComplexity = () => {
    let complexity = 'simple';
    
    const description = formData.eventDescription.toLowerCase();
    const type = formData.eventType;
    
    // Check for complex topics
    const complexTopics = ['ai', 'machine learning', 'blockchain', 'advanced', 'expert', 'architecture'];
    const hasComplexTopic = complexTopics.some(topic => 
      description.includes(topic) || formData.learningObjectives.toLowerCase().includes(topic)
    );
    
    // Check if multi-day event
    const isMultiDay = formData.startDate !== formData.endDate;
    
    // Check duration (updated to not penalize long events)
    const calculatedDuration = getEventDuration();
    const isLongDuration = calculatedDuration.includes('6 hour') || calculatedDuration.includes('8 hour');
    
    // Check event type
    const complexTypes = ['workshop', 'conference'];
    const isComplexType = complexTypes.includes(type);
    
    if (hasComplexTopic || isLongDuration || isComplexType || isMultiDay) {
      complexity = 'complex';
    } else if (formData.eventDescription.length > 500) {
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

  // Auto-fill end date when start date changes
  useEffect(() => {
    if (formData.startDate && !formData.endDate) {
      setFormData(prev => ({
        ...prev,
        endDate: formData.startDate
      }));
    }
  }, [formData.startDate, formData.endDate]);

  // Auto-fill end time when start time changes (default 1 hour later)
  useEffect(() => {
    if (formData.startTime && !formData.endTime && formData.startDate === formData.endDate) {
      const startTime = formData.startTime;
      const [hours, minutes] = startTime.split(':');
      const endHours = (parseInt(hours) + 1) % 24;
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes}`;
      setFormData(prev => ({
        ...prev,
        endTime: endTime
      }));
    }
  }, [formData.startTime, formData.endTime, formData.startDate, formData.endDate]);

  // Show loading screen while checking authentication
  if (authLoading) {
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
          <p className="text-white text-lg">Checking authentication...</p>
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
                🎯 Submit Event
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
                  🎯 Submit Event
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
                  👋 Welcome, {currentUser.displayName || currentUser.email}! Ready to share your expertise?
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
                  🎯 Host Your Tech Event
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
                  Tech Event
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Share your expertise through workshops, webinars, and talks. 
                <span className="text-lime-300 font-semibold"> Connect with the tech community</span> and help others grow.
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
                      <h3 className="text-green-400 font-bold text-lg mb-2">Event Submitted Successfully!</h3>
                      <p className="text-gray-200 mb-2">Your event has been submitted for admin review.</p>
                      <div className="text-sm text-gray-300">
                        <p>📋 <strong>Next steps:</strong></p>
                        <p>• Admin will review your event details</p>
                        <p>• You'll receive email notification when approved</p>
                        <p>• Event will be published on the events page</p>
                        <p>• Attendees can view details and add to their calendars</p>
                        <p>• 📧 Admin has been automatically notified</p>
                      </div>
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
                      <p className="text-gray-200">There was an error submitting your event. Please try again or contact support.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Event Details Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Event Details
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Event Title */}
                    <div className="lg:col-span-2">
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        name="eventTitle"
                        value={formData.eventTitle}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter your event title (e.g., Modern React Development Workshop)"
                      />
                    </div>

                    {/* Event Type */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Event Type *
                      </label>
                      <select
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Select event type</option>
                        <option value="workshop">🛠️ Workshop</option>
                        <option value="webinar">💻 Webinar</option>
                        <option value="talk">🎤 Talk/Panel</option>
                        <option value="conference">🏢 Conference</option>
                      </select>
                    </div>

                    {/* Format */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Format *
                      </label>
                      <select
                        name="format"
                        value={formData.format}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Select format</option>
                        <option value="online">💻 Online</option>
                      </select>
                    </div>
                  </div>

                  {/* NEW: Start Date and Time Section */}
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lime-300 font-semibold text-lg mb-4">📅 Event Start</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Start Date */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Start Date *
                        </label>
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleInputChange}
                          required
                          min={getMinDate()}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          Start Time *
                        </label>
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* NEW: End Date and Time Section */}
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-orange-300 font-semibold text-lg mb-4">🏁 Event End</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* End Date */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          End Date *
                        </label>
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleInputChange}
                          required
                          min={formData.startDate || getMinDate()}
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="block text-white font-medium mb-2">
                          End Time *
                        </label>
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Date Range Validation Error */}
                    {dateError && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm flex items-center">
                          <span className="mr-2">⚠️</span>
                          {dateError}
                        </p>
                      </div>
                    )}

                    {/* Duration Display - Updated to show unlimited duration support */}
                    {getEventDuration() && !dateError && (
                      <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-300 text-sm flex items-center">
                          <span className="mr-2">⏱️</span>
                          <strong>Duration:</strong> {getEventDuration()}
                          {formData.startDate !== formData.endDate && (
                            <span className="ml-2 text-purple-300 text-xs">🌟 Multi-day event!</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Event Description */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Event Description *
                    </label>
                    <textarea
                      name="eventDescription"
                      value={formData.eventDescription}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="Provide a detailed description of your event, including topics covered, agenda, and what attendees will learn..."
                    />
                  </div>

                  {/* Learning Objectives */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Learning Objectives
                    </label>
                    <textarea
                      name="learningObjectives"
                      value={formData.learningObjectives}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="What specific skills or knowledge will attendees gain from this event?"
                    />
                  </div>

                  {/* Requirements */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Prerequisites & Requirements
                    </label>
                    <textarea
                      name="requirements"
                      value={formData.requirements}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="Any prerequisites, software requirements, or materials attendees should prepare beforehand..."
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Topics & Tags
                    </label>
                    <input
                      type="text"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="React, JavaScript, Frontend, API, Workshop (comma-separated)"
                    />
                    <p className="text-gray-400 text-sm mt-2">Separate tags with commas to help people find your event</p>
                  </div>
                </div>

                {/* Organizer Information */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Organizer Information
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        name="organizerName"
                        value={formData.organizerName}
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
                        name="organizerEmail"
                        value={formData.organizerEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Your Bio & Expertise
                    </label>
                    <textarea
                      name="organizerBio"
                      value={formData.organizerBio}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                      placeholder="Brief description of your background, expertise, and why you're qualified to host this event..."
                    />
                  </div>
                </div>

                {/* Meeting & Technical Details */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Meeting Details
                  </h2>

                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Meeting URL (Google Meet / Zoom)
                    </label>
                    <input
                      type="url"
                      name="meetingUrl"
                      value={formData.meetingUrl}
                      onChange={handleMeetingUrlChange}
                      className={`w-full bg-white/10 backdrop-blur-sm border ${urlError ? 'border-red-500' : 'border-white/20'} rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300`}
                      placeholder="https://meet.google.com/abc-defg-hij or https://us02web.zoom.us/j/123456789"
                    />
                    {urlError && (
                      <p className="text-red-400 text-sm mt-2 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {urlError}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm mt-2">
                      You can add this later if you don't have it ready. We'll help you set up the meeting link.
                    </p>
                  </div>

                  {/* Google Calendar Instructions */}
                  <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <h4 className="text-blue-400 font-bold mb-3">📅 Adding to Google Calendar</h4>
                    <div className="text-gray-300 text-sm space-y-2">
                      <p><strong>For attendees:</strong> They can use the "Add to Calendar" button on your event page</p>
                      <p><strong>For you:</strong> After approval, your event will be visible with calendar integration</p>
                      <p><strong>Meeting links:</strong> Will be automatically included in calendar events</p>
                      <p><strong>Simple process:</strong> No registrations needed - attendees just add to calendar and join</p>
                      <p><strong>Multi-day events:</strong> 🌟 Events can span multiple days without restrictions!</p>
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
                    placeholder="Any additional details, special requirements, or questions you'd like to include..."
                  />
                </div>

                {/* Process Information */}
                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <h4 className="text-green-400 font-bold mb-3">📋 What Happens After Submission:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
                    <div>
                      <p>📧 <strong>Instant Admin Alert:</strong> Admin gets notified immediately</p>
                      <p>✅ <strong>Admin Review:</strong> Your event will be reviewed for quality and relevance</p>
                      <p>👀 <strong>Event Discovery:</strong> Your event will be featured on our events page</p>
                    </div>
                    <div>
                      <p>📅 <strong>Calendar Integration:</strong> Attendees can easily add to their calendars</p>
                      <p>🎯 <strong>Simple Process:</strong> No complex registrations - just calendar and join links</p>
                      <p>📬 <strong>Email Updates:</strong> You'll be notified at each step</p>
                      <p>🌟 <strong>Multi-day Support:</strong> Events can span any duration without restrictions</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting || urlError || dateError}
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
                          Submitting Event...
                        </>
                      ) : (
                        <>
                          Submit Event for Approval
                          <span className="ml-4 group-hover:translate-x-2 transition-transform text-2xl">🎯</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                  
                  <p className="text-gray-400 text-sm mt-6" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    * Required fields. Your event will be reviewed and approved before being published.<br/>
                    📧 <strong>Admin will be automatically notified</strong> upon submission.<br/>
                    🌟 <strong>Events can span multiple days</strong> without any duration restrictions.
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

export default EventSubmission;
