//src/Pages/projects/ProjectSubmission.jsx - ENHANCED TO SEND ALL CONTENT TO ADMIN + START/END DATES

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

// Import image upload utilities
import { 
  uploadToImgur, 
  validateImageFile, 
  formatFileSize, 
  createFilePreview, 
  cleanupPreviews 
} from '../../utils/imgurUpload';

const ProjectSubmission = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, loading: authLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef(null);
  
  // Form state - ENHANCED with image upload fields + START/END DATES
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDescription: '',
    projectType: '',
    timeline: '',
    startDate: '', // NEW: Project start date
    endDate: '',   // NEW: Project end date
    requiredSkills: '',
    projectGoals: '',
    additionalInfo: '',
    experienceLevel: '',
    contactEmail: '',
    contactName: '',
    companyName: '',
    budget: '',
    maxTeamSize: 5,
    bannerImageUrl: '',
    bannerImageId: '',
    bannerDeleteHash: ''
  });
  
  // Image upload state
  const [imageUpload, setImageUpload] = useState({
    selectedFile: null,
    previewUrl: null,
    isUploading: false,
    uploadProgress: 0,
    uploadError: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [adminNotificationSuccess, setAdminNotificationSuccess] = useState(false);

  // Authentication Check - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: '/projects/submit', message: 'Please sign in to submit a project' }
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
    if (currentUser && !formData.contactEmail) {
      setFormData(prev => ({
        ...prev,
        contactEmail: currentUser.email || '',
        contactName: currentUser.displayName || ''
      }));
    }
  }, [currentUser, formData.contactEmail]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imageUpload.previewUrl) {
        cleanupPreviews([imageUpload.previewUrl]);
      }
    };
  }, [imageUpload.previewUrl]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Debug date inputs specifically
    if (name === 'startDate' || name === 'endDate') {
      console.log(`🗓️ Date input changed - ${name}:`, {
        value: value,
        valueType: typeof value,
        valueLength: value.length,
        isEmpty: value === '',
        isNull: value === null,
        isUndefined: value === undefined
      });
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setImageUpload({
        selectedFile: null,
        previewUrl: null,
        isUploading: false,
        uploadProgress: 0,
        uploadError: null
      });
      return;
    }

    // Validate the file
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageUpload(prev => ({
        ...prev,
        uploadError: validationError
      }));
      toast.error(validationError);
      return;
    }

    // Create preview
    const previewUrl = createFilePreview(file);
    
    setImageUpload({
      selectedFile: file,
      previewUrl: previewUrl,
      isUploading: false,
      uploadProgress: 0,
      uploadError: null
    });

    // Auto-upload the image
    uploadSelectedImage(file);
  };

  // Upload image to Imgur
  const uploadSelectedImage = async (file) => {
    setImageUpload(prev => ({
      ...prev,
      isUploading: true,
      uploadProgress: 0,
      uploadError: null
    }));

    try {
      console.log('📸 Uploading project banner image...');
      
      // Simulate upload progress (since Imgur doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setImageUpload(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }));
      }, 200);

      const uploadResult = await uploadToImgur(file);
      
      clearInterval(progressInterval);
      
      // Update form data with uploaded image info
      setFormData(prev => ({
        ...prev,
        bannerImageUrl: uploadResult.url,
        bannerImageId: uploadResult.id,
        bannerDeleteHash: uploadResult.deleteHash
      }));

      setImageUpload(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 100,
        uploadError: null
      }));

      toast.success('✅ Project banner uploaded successfully!');
      console.log('✅ Image uploaded:', uploadResult.url);

    } catch (error) {
      console.error('❌ Image upload failed:', error);
      
      setImageUpload(prev => ({
        ...prev,
        isUploading: false,
        uploadProgress: 0,
        uploadError: error.message
      }));

      toast.error(`Upload failed: ${error.message}`);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    if (imageUpload.previewUrl) {
      cleanupPreviews([imageUpload.previewUrl]);
    }

    setImageUpload({
      selectedFile: null,
      previewUrl: null,
      isUploading: false,
      uploadProgress: 0,
      uploadError: null
    });

    setFormData(prev => ({
      ...prev,
      bannerImageUrl: '',
      bannerImageId: '',
      bannerDeleteHash: ''
    }));

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    toast.info('Image removed');
  };

  // 🔥 ENHANCED: Updated validation to include banner image + START/END DATES
  const validateForm = () => {
    const errors = [];
    
    console.log('🔍 Form validation - checking dates:', {
      startDate: formData.startDate,
      endDate: formData.endDate,
      startDateType: typeof formData.startDate,
      endDateType: typeof formData.endDate,
      startDateEmpty: formData.startDate === '',
      endDateEmpty: formData.endDate === '',
      formDataKeys: Object.keys(formData),
      allFormData: formData
    });
    
    if (!formData.projectTitle.trim()) errors.push('Project title is required');
    if (!formData.projectDescription.trim()) errors.push('Project description is required');
    if (!formData.projectType) errors.push('Project type is required');
    if (!formData.timeline) errors.push('Timeline is required');
    if (!formData.startDate) {
      console.log('❌ Start date validation failed:', formData.startDate);
      errors.push('Project start date is required');
    }
    if (!formData.endDate) {
      console.log('❌ End date validation failed:', formData.endDate);
      errors.push('Project end date is required');
    }
    if (!formData.requiredSkills.trim()) errors.push('Required skills are required');
    if (!formData.contactEmail.trim()) errors.push('Contact email is required');
    
    // Date validation
    if (formData.startDate && formData.endDate) {
      console.log('✅ Both dates present, validating logic...');
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      console.log('📅 Date objects:', {
        startDate: startDate,
        endDate: endDate,
        today: today,
        startDateValid: !isNaN(startDate.getTime()),
        endDateValid: !isNaN(endDate.getTime())
      });
      
      if (startDate < today) {
        errors.push('Project start date cannot be in the past');
      }
      
      if (endDate <= startDate) {
        errors.push('Project end date must be after the start date');
      }
      
      // Check if dates make sense with timeline
      const daysDifference = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      console.log('📊 Timeline analysis:', {
        daysDifference: daysDifference,
        selectedTimeline: formData.timeline
      });
      
      const timelineWarnings = {
        '1-week': { min: 5, max: 9, label: '1 Week' },
        '2-weeks': { min: 10, max: 16, label: '2 Weeks' },
        '1-month': { min: 25, max: 35, label: '1 Month' },
        '2-3-months': { min: 55, max: 100, label: '2-3 Months' },
        '3-6-months': { min: 85, max: 190, label: '3-6 Months' },
        '6-months-plus': { min: 180, max: 999, label: '6+ Months' }
      };
      
      const timelineInfo = timelineWarnings[formData.timeline];
      if (timelineInfo && (daysDifference < timelineInfo.min || daysDifference > timelineInfo.max)) {
        errors.push(`Your selected dates (${daysDifference} days) don't align with the chosen timeline (${timelineInfo.label}). Please adjust either the dates or timeline.`);
      }
    }
    
    // Banner image validation (COMPULSORY)
    if (!formData.bannerImageUrl) errors.push('Project banner image is required');
    if (imageUpload.isUploading) errors.push('Please wait for image upload to complete');
    if (imageUpload.uploadError) errors.push('Please fix the image upload error');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      errors.push('Please enter a valid email address');
    }
    
    console.log('🔍 Validation complete. Errors found:', errors);
    return errors;
  };

  // Calculate project complexity for admin dashboard
  const calculateProjectComplexity = () => {
    let complexity = 'simple';
    
    const description = formData.projectDescription.toLowerCase();
    const skills = formData.requiredSkills.toLowerCase();
    
    const complexTech = ['ai', 'machine learning', 'blockchain', 'microservices', 'cloud architecture'];
    const hasComplexTech = complexTech.some(tech => 
      description.includes(tech) || skills.includes(tech)
    );
    
    const longTimeline = ['3-6-months', '6-months-plus'].includes(formData.timeline);
    const complexTypes = ['ai-ml', 'blockchain', 'game-development'];
    const isComplexType = complexTypes.includes(formData.projectType);
    
    // Calculate duration in days
    let durationInDays = 0;
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      durationInDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    }
    
    if (hasComplexTech || longTimeline || isComplexType || durationInDays > 90) {
      complexity = 'complex';
    } else if (formData.projectDescription.length > 500 || formData.requiredSkills.split(',').length > 5 || durationInDays > 30) {
      complexity = 'moderate';
    }
    
    return complexity;
  };

  // 🔥 ENHANCED: Function to create COMPLETE admin notification with ALL content + DATES
  const createCompleteAdminNotification = (submissionData, projectId) => {
    return {
      projectData: {
        // 🔥 COMPLETE PROJECT INFORMATION - NO TRUNCATION + DATES
        projectId: projectId,
        submissionTimestamp: new Date().toISOString(),
        
        // Core Project Details (FULL CONTENT)
        projectTitle: submissionData.projectTitle,
        projectDescription: submissionData.projectDescription, // FULL description
        projectType: submissionData.projectType,
        timeline: submissionData.timeline,
        startDate: submissionData.startDate, // NEW: Start date (YYYY-MM-DD)
        endDate: submissionData.endDate,     // NEW: End date (YYYY-MM-DD)
        startDateFormatted: submissionData.startDateFormatted, // NEW: Human readable start date
        endDateFormatted: submissionData.endDateFormatted, // NEW: Human readable end date
        projectDuration: submissionData.projectDurationDays, // NEW: Calculated duration
        requiredSkills: submissionData.requiredSkills, // FULL skills list
        projectGoals: submissionData.projectGoals || 'Not specified', // FULL goals
        additionalInfo: submissionData.additionalInfo || 'None provided', // FULL additional info
        experienceLevel: submissionData.experienceLevel,
        
        // Banner Image Information (COMPLETE)
        bannerImageUrl: submissionData.bannerImageUrl,
        bannerImageId: submissionData.bannerImageId,
        bannerDeleteHash: submissionData.bannerDeleteHash,
        hasBannerImage: !!submissionData.bannerImageUrl,
        
        // Contact and Company Information (COMPLETE)
        contactEmail: submissionData.contactEmail,
        contactName: submissionData.contactName,
        companyName: submissionData.companyName || 'Individual/Personal Project',
        
        // Project Settings (COMPLETE)
        budget: submissionData.budget,
        maxTeamSize: submissionData.maxTeamSize,
        
        // User Information (COMPLETE)
        submitterId: submissionData.submitterId,
        submitterEmail: submissionData.submitterEmail,
        submitterName: submissionData.submitterName,
        submitterPhoto: submissionData.submitterPhoto,
        
        // Status and Workflow (COMPLETE)
        status: submissionData.status,
        workflowStage: submissionData.workflowStage,
        
        // Metadata (COMPLETE)
        submissionSource: submissionData.submissionSource,
        projectComplexity: submissionData.projectComplexity,
        requiresTeamCreation: submissionData.requiresTeamCreation,
        
        // Additional Analytics
        characterCounts: {
          projectDescription: submissionData.projectDescription?.length || 0,
          requiredSkills: submissionData.requiredSkills?.length || 0,
          projectGoals: submissionData.projectGoals?.length || 0,
          additionalInfo: submissionData.additionalInfo?.length || 0,
          totalContent: (
            (submissionData.projectDescription?.length || 0) +
            (submissionData.requiredSkills?.length || 0) +
            (submissionData.projectGoals?.length || 0) +
            (submissionData.additionalInfo?.length || 0)
          )
        },
        
        // NEW: Date Analysis
        dateAnalysis: {
          startDate: submissionData.startDate,
          endDate: submissionData.endDate,
          startDateFormatted: submissionData.startDateFormatted,
          endDateFormatted: submissionData.endDateFormatted,
          durationInDays: submissionData.projectDurationDays,
          timelineAlignment: submissionData.timelineAlignment,
          daysUntilStart: submissionData.daysUntilStart,
          isUrgentStart: submissionData.daysUntilStart <= 7,
          isLongTerm: submissionData.projectDurationDays > 90
        },
        
        // Content Quality Indicators
        contentCompleteness: {
          hasDescription: !!submissionData.projectDescription?.trim(),
          hasGoals: !!submissionData.projectGoals?.trim(),
          hasAdditionalInfo: !!submissionData.additionalInfo?.trim(),
          hasCompanyInfo: !!submissionData.companyName?.trim(),
          hasBanner: !!submissionData.bannerImageUrl,
          hasSpecificDates: !!(submissionData.startDate && submissionData.endDate),
          completenessScore: [
            !!submissionData.projectDescription?.trim(),
            !!submissionData.projectGoals?.trim(),
            !!submissionData.additionalInfo?.trim(),
            !!submissionData.companyName?.trim(),
            !!submissionData.bannerImageUrl,
            !!(submissionData.startDate && submissionData.endDate)
          ].filter(Boolean).length
        },
        
        // 🔥 ALL FORM FIELDS - ENSURING NOTHING IS MISSED
        allSubmittedFields: Object.keys(submissionData).filter(key => 
          submissionData[key] !== null && 
          submissionData[key] !== undefined && 
          submissionData[key] !== '' &&
          submissionData[key] !== 0
        ),
        fieldCount: Object.keys(submissionData).filter(key => 
          submissionData[key] !== null && 
          submissionData[key] !== undefined && 
          submissionData[key] !== '' &&
          submissionData[key] !== 0
        ).length,
        
        // Admin Review Information
        adminReviewInfo: {
          requiresImageReview: !!submissionData.bannerImageUrl,
          requiresDateValidation: !!(submissionData.startDate && submissionData.endDate),
          contentLength: 'detailed',
          estimatedReviewTime: submissionData.projectComplexity === 'complex' ? '10-15 minutes' : '5-10 minutes',
          flaggedForDetailed: submissionData.projectComplexity === 'complex' || 
                             (submissionData.projectDescription?.length || 0) > 1000,
          priorityLevel: submissionData.projectComplexity === 'complex' ? 'high' : 'normal'
        }
      },
      
      // 🔥 ENHANCED ADMIN NOTIFICATION METADATA
      notificationMetadata: {
        type: 'complete_project_submission_with_dates',
        urgency: 'normal',
        requiresFullReview: true,
        includesAllContent: true,
        includesDates: true, // NEW flag
        contentTruncated: false, // Explicitly state NO truncation
        reviewType: 'comprehensive',
        timestamp: new Date().toISOString(),
        submissionMethod: 'web_form_enhanced_with_dates',
        
        // Content flags for admin attention
        flags: {
          hasLongDescription: (submissionData.projectDescription?.length || 0) > 500,
          hasExtensiveSkills: (submissionData.requiredSkills?.length || 0) > 200,
          hasDetailedGoals: (submissionData.projectGoals?.length || 0) > 200,
          hasAdditionalInfo: !!submissionData.additionalInfo?.trim(),
          hasCompanyAffiliation: !!submissionData.companyName?.trim(),
          hasBannerImage: !!submissionData.bannerImageUrl,
          hasSpecificDates: !!(submissionData.startDate && submissionData.endDate),
          isUrgentDeadline: submissionData.daysUntilStart <= 7,
          isLongTermProject: submissionData.projectDurationDays > 90,
          isComplexProject: submissionData.projectComplexity === 'complex'
        }
      }
    };
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

    // Validate form (including image and dates)
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n• ${errors.join('\n• ')}`);
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('📝 Submitting project with COMPLETE content + dates for admin review...');
      console.log('📅 Date values:', {
        startDate: formData.startDate,
        endDate: formData.endDate,
        startDateType: typeof formData.startDate,
        endDateType: typeof formData.endDate,
        startDateIsString: typeof formData.startDate === 'string',
        endDateIsString: typeof formData.endDate === 'string',
        startDateLength: formData.startDate ? formData.startDate.length : 0,
        endDateLength: formData.endDate ? formData.endDate.length : 0
      });

      // Calculate additional date information - ADD SAFETY CHECKS
      let startDate, endDate, projectDurationDays = 0, daysUntilStart = 0;
      
      if (formData.startDate && formData.endDate && 
          typeof formData.startDate === 'string' && typeof formData.endDate === 'string' &&
          formData.startDate.length > 0 && formData.endDate.length > 0) {
        
        startDate = new Date(formData.startDate);
        endDate = new Date(formData.endDate);
        const today = new Date();
        
        // Ensure dates are valid
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          projectDurationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
          daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
        } else {
          console.error('❌ Invalid date objects created from:', formData.startDate, formData.endDate);
        }
      } else {
        console.error('❌ Missing or invalid date strings:', {
          startDate: formData.startDate,
          endDate: formData.endDate,
          startDateType: typeof formData.startDate,
          endDateType: typeof formData.endDate
        });
      }

      console.log('📊 Calculated date information:', {
        startDateString: formData.startDate,
        endDateString: formData.endDate,
        startDateObj: startDate,
        endDateObj: endDate,
        projectDurationDays,
        daysUntilStart,
        datesAreValid: !!(formData.startDate && formData.endDate)
      });

      // 🔥 ENHANCED: Prepare submission data with ALL content + DATES
      const submissionData = {
        // Basic project information (COMPLETE)
        projectTitle: formData.projectTitle.trim(),
        projectDescription: formData.projectDescription.trim(), // FULL CONTENT
        projectType: formData.projectType,
        timeline: formData.timeline,
        
        // 🔥 CRITICAL: Ensure dates are properly stored in database
        startDate: formData.startDate || null, // YYYY-MM-DD format
        endDate: formData.endDate || null,     // YYYY-MM-DD format
        projectStartDate: formData.startDate || null, // Backup field name
        projectEndDate: formData.endDate || null,     // Backup field name
        startDateFormatted: formData.startDate ? formatDateForDisplay(formData.startDate) : null, // Human readable
        endDateFormatted: formData.endDate ? formatDateForDisplay(formData.endDate) : null, // Human readable
        
        // Calculated date fields
        projectDurationDays: projectDurationDays || 0, // Calculated duration
        daysUntilStart: daysUntilStart || 0, // Days until project starts
        timelineAlignment: 'specified_dates', // Indicates specific dates provided
        
        // Additional date metadata for database queries
        hasSpecificDates: !!(formData.startDate && formData.endDate),
        dateRange: formData.startDate && formData.endDate ? `${formData.startDate} to ${formData.endDate}` : null,
        
        requiredSkills: formData.requiredSkills.trim(), // FULL CONTENT
        projectGoals: formData.projectGoals.trim() || null, // FULL CONTENT
        additionalInfo: formData.additionalInfo.trim() || null, // FULL CONTENT
        experienceLevel: formData.experienceLevel || 'any-level',
        
        // Banner image information (COMPLETE)
        bannerImageUrl: formData.bannerImageUrl,
        bannerImageId: formData.bannerImageId,
        bannerDeleteHash: formData.bannerDeleteHash,
        
        // Contact and company information (COMPLETE)
        contactEmail: formData.contactEmail.trim(),
        contactName: formData.contactName.trim() || 'Project Owner',
        companyName: formData.companyName.trim() || null,
        
        // Project settings (COMPLETE)
        budget: formData.budget || 'free',
        maxTeamSize: parseInt(formData.maxTeamSize) || 5,
        
        // System fields
        submissionDate: serverTimestamp(),
        postedDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // Status and workflow
        status: 'pending_approval',
        workflowStage: 'submitted',
        
        // User information (COMPLETE)
        submitterId: currentUser.uid,
        submitterEmail: currentUser.email,
        submitterName: currentUser.displayName || currentUser.email,
        submitterPhoto: currentUser.photoURL || null,
        
        // Integration flags
        groupAutoCreated: false,
        projectOwnerCanManageApplications: false,
        isActive: false,
        
        // Admin notification tracking
        adminNotifiedOfSubmission: false,
        adminNotificationSentAt: null,
        adminNotificationMessageId: null,
        
        // Metadata for admin dashboard (ENHANCED)
        submissionSource: 'web_form_complete_content_with_dates',
        requiresTeamCreation: true,
        projectComplexity: calculateProjectComplexity(),
        
        // 🔥 NEW: Content analysis for admin (including dates)
        contentAnalysis: {
          totalContentLength: (
            formData.projectDescription.length +
            formData.requiredSkills.length +
            (formData.projectGoals?.length || 0) +
            (formData.additionalInfo?.length || 0)
          ),
          descriptionLength: formData.projectDescription.length,
          skillsLength: formData.requiredSkills.length,
          goalsLength: formData.projectGoals?.length || 0,
          additionalInfoLength: formData.additionalInfo?.length || 0,
          hasCompanyInfo: !!formData.companyName?.trim(),
          hasBannerImage: !!formData.bannerImageUrl,
          hasSpecificDates: !!(formData.startDate && formData.endDate),
          projectDuration: projectDurationDays,
          isUrgentStart: daysUntilStart <= 7,
          completenessScore: [
            !!formData.projectDescription?.trim(),
            !!formData.projectGoals?.trim(),
            !!formData.additionalInfo?.trim(),
            !!formData.companyName?.trim(),
            !!formData.bannerImageUrl,
            !!(formData.startDate && formData.endDate)
          ].filter(Boolean).length
        },
        
        // Additional tracking
        viewCount: 0,
        applicationCount: 0
      };

      console.log('🔥 CRITICAL DATABASE CHECK - Submission data includes dates:', {
        startDate: submissionData.startDate,
        endDate: submissionData.endDate,
        projectStartDate: submissionData.projectStartDate,
        projectEndDate: submissionData.projectEndDate,
        hasSpecificDates: submissionData.hasSpecificDates,
        dateRange: submissionData.dateRange,
        formDataStartDate: formData.startDate,
        formDataEndDate: formData.endDate
      });

      console.log('📤 Submission data being sent to Firebase:', {
        startDate: submissionData.startDate,
        endDate: submissionData.endDate,
        projectDurationDays: submissionData.projectDurationDays,
        daysUntilStart: submissionData.daysUntilStart,
        timelineAlignment: submissionData.timelineAlignment
      });

      // Submit to Firebase
      const docRef = await addDoc(collection(db, 'client_projects'), submissionData);
      console.log('✅ Project submitted with ID:', docRef.id);

      // 🔥 ENHANCED: Send COMPLETE admin notification with ALL content + DATES
      try {
        console.log('📧 Sending COMPLETE admin notification with ALL project content + dates...');
        
        // Create comprehensive notification with ALL data including dates
        const completeNotificationData = createCompleteAdminNotification(submissionData, docRef.id);
        
        console.log('📊 Admin notification includes:', {
          projectId: docRef.id,
          totalFields: completeNotificationData.projectData.fieldCount,
          contentLength: completeNotificationData.projectData.characterCounts.totalContent,
          hasAllContent: completeNotificationData.notificationMetadata.includesAllContent,
          includesDates: completeNotificationData.notificationMetadata.includesDates,
          projectDuration: projectDurationDays,
          startDate: completeNotificationData.projectData.startDate,
          endDate: completeNotificationData.projectData.endDate,
          dateAnalysis: completeNotificationData.projectData.dateAnalysis,
          reviewType: completeNotificationData.notificationMetadata.reviewType
        });
        
        // Try multiple admin notification endpoints
        console.log('🔄 Attempting primary admin notification endpoint...');
        
        let adminNotificationResponse;
        let adminNotificationResult;
        
        try {
          // Primary endpoint attempt
          adminNotificationResponse = await fetch('/api/notifications/send-new-project-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectData: {
                ...submissionData,
                projectId: docRef.id,
                submissionDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                completeContentNotification: true,
                includesSpecificDates: true,
                dateAnalysis: completeNotificationData.projectData.dateAnalysis
              }
            })
          });

          adminNotificationResult = await adminNotificationResponse.json();
          
        } catch (primaryError) {
          console.warn('⚠️ Primary endpoint failed:', primaryError);
          
          // Fallback endpoint attempt
          console.log('🔄 Attempting fallback admin notification...');
          
          try {
            adminNotificationResponse = await fetch('/api/notifications/admin-project-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(completeNotificationData)
            });

            adminNotificationResult = await adminNotificationResponse.json();
            
          } catch (fallbackError) {
            console.warn('⚠️ Fallback endpoint also failed:', fallbackError);
            throw new Error('Both notification endpoints failed');
          }
        }
        
        if (adminNotificationResult && adminNotificationResult.success) {
          console.log('✅ Admin notification sent successfully:', adminNotificationResult);
          setAdminNotificationSuccess(true);
          
          await updateDoc(doc(db, 'client_projects', docRef.id), {
            adminNotifiedOfSubmission: true,
            adminNotificationSentAt: serverTimestamp(),
            adminNotificationMessageId: adminNotificationResult.messageId || 'sent',
            adminNotificationType: 'complete_content_with_dates',
            allContentSentToAdmin: true,
            datesSentToAdmin: true,
            notificationEndpointUsed: 'primary_or_fallback'
          });
          
        } else {
          console.warn('⚠️ Admin notification failed with result:', adminNotificationResult);
          
          // Final fallback: Simple notification
          console.log('📧 Attempting simple notification fallback...');
          
          try {
            const simpleNotificationResponse = await fetch('/api/admin/notify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'new_project_submission',
                projectId: docRef.id,
                projectTitle: submissionData.projectTitle,
                submitterEmail: submissionData.submitterEmail,
                startDate: submissionData.startDate,
                endDate: submissionData.endDate,
                timestamp: new Date().toISOString()
              })
            });
            
            const simpleResult = await simpleNotificationResponse.json();
            if (simpleResult.success) {
              console.log('✅ Simple notification fallback succeeded');
              setAdminNotificationSuccess(true);
            }
            
          } catch (simpleError) {
            console.error('❌ All notification methods failed:', simpleError);
          }
        }
        
      } catch (adminEmailError) {
        console.error('❌ Admin notification error:', adminEmailError);
        
        // Emergency fallback: Log to console and try direct email
        console.log('🚨 EMERGENCY: Admin notification completely failed. Project details:', {
          projectId: docRef.id,
          title: submissionData.projectTitle,
          submitter: submissionData.submitterEmail,
          startDate: submissionData.startDate,
          endDate: submissionData.endDate,
          timestamp: new Date().toISOString()
        });
        
        // Mark as notification attempted but failed
        try {
          await updateDoc(doc(db, 'client_projects', docRef.id), {
            adminNotifiedOfSubmission: false,
            adminNotificationAttempted: true,
            adminNotificationError: adminEmailError.message,
            adminNotificationFailedAt: serverTimestamp(),
            requiresManualNotification: true
          });
        } catch (updateError) {
          console.error('❌ Failed to update notification status:', updateError);
        }
      }

      // Enhanced backup submission to Google Apps Script with detailed logging
      try {
        console.log('🔄 Attempting Google Apps Script backup with complete data...');
        
        const backupData = {
          ...submissionData,
          submissionDate: new Date().toISOString(),
          id: docRef.id,
          backupType: 'complete_content_with_dates',
          adminNotificationStatus: adminNotificationSuccess ? 'success' : 'failed',
          fallbackNotification: true,
          
          // Ensure dates are included in backup
          projectStartDate: submissionData.startDate,
          projectEndDate: submissionData.endDate,
          projectDurationDays: projectDurationDays,
          daysUntilProjectStart: daysUntilStart,
          
          // Admin contact info for manual review if needed
          requiresAdminAttention: !adminNotificationSuccess,
          manualReviewRequired: !adminNotificationSuccess
        };
        
        console.log('📤 Backup data being sent:', {
          projectId: docRef.id,
          hasStartDate: !!backupData.projectStartDate,
          hasEndDate: !!backupData.projectEndDate,
          notificationWorked: adminNotificationSuccess
        });
        
        const scriptResponse = await fetch('https://script.google.com/macros/s/AKfycbxHrl4fwEpKC5ZXnGc29O16SDsbfvUp4gGBvhlU1oVwPtpmxnIN866IHOkMKd8ZUCJpcA/exec', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(backupData)
        });
        
        // Check if the request was successful
        if (scriptResponse.ok) {
          const scriptResult = await scriptResponse.text(); // Google Apps Script returns text
          console.log('✅ Google Apps Script backup successful:', scriptResult);
          
          // If primary admin notification failed, this backup serves as emergency notification
          if (!adminNotificationSuccess) {
            console.log('📧 Google Apps Script serving as emergency admin notification');
            setAdminNotificationSuccess(true); // Mark as successful since backup worked
            
            await updateDoc(doc(db, 'client_projects', docRef.id), {
              adminNotifiedOfSubmission: true,
              adminNotificationSentAt: serverTimestamp(),
              adminNotificationMethod: 'google_apps_script_backup',
              emergencyNotificationUsed: true
            });
          }
        } else {
          console.warn('⚠️ Google Apps Script returned non-OK status:', scriptResponse.status);
        }
        
      } catch (scriptError) {
        console.error('❌ Google Apps Script backup failed:', scriptError);
        
        // Log detailed error for debugging
        console.log('🔍 Google Apps Script Error Details:', {
          error: scriptError.message,
          stack: scriptError.stack,
          projectId: docRef.id,
          timestamp: new Date().toISOString()
        });
      }

      setSubmitStatus('success');
      
      // Enhanced success message with notification status
      const successMessage = adminNotificationSuccess 
        ? '🎉 Project submitted successfully!\n\n' +
          '📋 Next steps:\n' +
          '• ✅ Admin has been notified and will receive your complete project details\n' +
          '• 📊 ALL content (descriptions, goals, skills, dates, etc.) included\n' +
          (formData.startDate && formData.endDate ? 
            `• 📅 Project timeline: ${formatDateForDisplay(formData.startDate)} to ${formatDateForDisplay(formData.endDate)}\n` +
            `• ⏱️ Duration: ${getProjectDuration()}\n` : '') +
          '• 📸 Banner image will be reviewed by admin\n' +
          '• ⏳ You\'ll get an email when approved (usually within 24-48 hours)\n' +
          '• 🏗️ Your team group will be created automatically\n' +
          '• 📊 You can then manage applications from your dashboard'
        : '🎉 Project submitted successfully!\n\n' +
          '📋 Status:\n' +
          '• ✅ Your project has been saved with all details\n' +
          '• ⚠️ Admin notification had technical issues, but they will be contacted\n' +
          '• 📊 ALL your project content including dates has been preserved\n' +
          (formData.startDate && formData.endDate ? 
            `• 📅 Project timeline: ${formatDateForDisplay(formData.startDate)} to ${formatDateForDisplay(formData.endDate)}\n` : '') +
          '• 📧 Backup notifications have been sent\n' +
          '• ⏳ You\'ll get an email when approved\n' +
          '• 🏗️ Your team group will be created automatically\n' +
          '• 📞 If no response in 48 hours, please contact support';
      
      toast.success(successMessage);

      // Reset form including image and dates
      setFormData({
        projectTitle: '',
        projectDescription: '',
        projectType: '',
        timeline: '',
        startDate: '',
        endDate: '',
        requiredSkills: '',
        projectGoals: '',
        additionalInfo: '',
        experienceLevel: '',
        contactEmail: currentUser?.email || '',
        contactName: currentUser?.displayName || '',
        companyName: '',
        budget: '',
        maxTeamSize: 5,
        bannerImageUrl: '',
        bannerImageId: '',
        bannerDeleteHash: ''
      });

      // Reset image upload state
      removeImage();

      // Redirect to dashboard after delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('❌ Firebase submission error:', error);
      
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Please make sure you\'re logged in and try again.');
      } else if (error.code === 'network-request-failed') {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        setSubmitStatus('error');
        toast.error('Unable to submit project. Please try again later or contact support.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation helper function
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Helper function to get minimum date (today)
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Calculate project duration for display
  const getProjectDuration = () => {
    if (!formData.startDate || !formData.endDate) return '';
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    if (durationDays <= 0) return '';
    
    if (durationDays === 1) return '1 day';
    if (durationDays < 7) return `${durationDays} days`;
    if (durationDays < 30) return `${Math.round(durationDays / 7)} weeks`;
    if (durationDays < 365) return `${Math.round(durationDays / 30)} months`;
    return `${Math.round(durationDays / 365)} years`;
  };

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

      {/* Header */}
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

              <span className="text-lime-400 font-semibold text-sm lg:text-base px-3 py-1 bg-lime-400/10 rounded-full border border-lime-400/20"
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                🚀 Submit Project
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
          
          {/* Mobile Menu */}
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

                <span className="text-lime-400 font-semibold text-base sm:text-lg px-3 py-2 bg-lime-400/10 rounded-full border border-lime-400/20"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  🚀 Submit Project
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
                  👋 Welcome, {currentUser.displayName || currentUser.email}! Ready to submit your project with COMPLETE details including specific dates?
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
                  🚀 Submit Your Tech Project - ALL CONTENT + DATES TO ADMIN
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
                  Complete Project
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Connect with talented developers and bring your tech project to life.
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
                      <h3 className="text-green-400 font-bold text-lg mb-2">Project Submitted Successfully!</h3>
                      <p className="text-gray-200 mb-2">Your complete project with specific dates has been submitted for admin review.</p>
                      <div className="text-sm text-gray-300">
                        <p>📧 <strong>Admin Notification Status:</strong> {adminNotificationSuccess ? 'Successfully sent' : 'Backup methods used'}</p>
                        <p>📊 <strong>Data Preserved:</strong> All content including dates, goals, skills, and banner image</p>
                        {formData.startDate && formData.endDate && (
                          <p>📅 <strong>Timeline Captured:</strong> {formatDateForDisplay(formData.startDate)} to {formatDateForDisplay(formData.endDate)}</p>
                        )}
                        <p>📋 <strong>Next steps:</strong></p>
                        <p>• Admin will review your complete project within 24-48 hours</p>
                        <p>• You'll receive email notification when approved</p>
                        <p>• Your team group will be created automatically</p>
                        <p>• You can then manage applications from your dashboard</p>
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
                      <p className="text-gray-200">There was an error submitting your project. Please try again or contact support.</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Project Banner Image Section - FIRST SECTION */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    📸 Project Banner Image *
                  </h2>

                  <div className="bg-black/20 border border-white/10 rounded-xl p-6">
                    <label className="block text-lime-300 font-semibold mb-4 text-lg">
                      Upload Project Banner (Required) *
                    </label>
                    
                    {/* Image Upload Area */}
                    <div className="relative">
                      {/* File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="banner-upload"
                      />
                      
                      {/* Upload Area or Preview */}
                      {!imageUpload.previewUrl ? (
                        <label
                          htmlFor="banner-upload"
                          className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-lime-400/30 rounded-xl cursor-pointer bg-lime-400/5 hover:bg-lime-400/10 transition-all duration-300"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-16 h-16 mb-4 text-lime-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="mb-2 text-lg font-semibold text-lime-300">
                              Click to upload project banner
                            </p>
                            <p className="text-sm text-gray-400">
                              PNG, JPG, GIF or WebP (Max 10MB)
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Recommended: 1200x630px for best display
                            </p>
                            <p className="text-xs text-lime-300 mt-2 font-semibold">
                              🔥 Banner will be included in admin review
                            </p>
                          </div>
                        </label>
                      ) : (
                        <div className="relative">
                          {/* Image Preview */}
                          <div className="relative rounded-xl overflow-hidden bg-black/30">
                            <img
                              src={imageUpload.previewUrl}
                              alt="Project banner preview"
                              className="w-full h-64 object-cover"
                            />
                            
                            {/* Upload Progress Overlay */}
                            {imageUpload.isUploading && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
                                  <p className="text-white font-semibold">Uploading...</p>
                                  <div className="w-48 bg-gray-700 rounded-full h-2 mt-3">
                                    <div 
                                      className="bg-lime-400 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${imageUpload.uploadProgress}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-gray-300 text-sm mt-2">{imageUpload.uploadProgress}%</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Image Actions */}
                          <div className="flex items-center justify-between mt-4 p-3 bg-black/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {imageUpload.selectedFile && (
                                <>
                                  <span className="text-green-400">✅</span>
                                  <div>
                                    <p className="text-white font-medium">{imageUpload.selectedFile.name}</p>
                                    <p className="text-gray-400 text-sm">{formatFileSize(imageUpload.selectedFile.size)}</p>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="flex space-x-2">
                              <label
                                htmlFor="banner-upload"
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 text-sm"
                              >
                                Change
                              </label>
                              <button
                                type="button"
                                onClick={removeImage}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-all duration-300 text-sm"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Upload Error */}
                      {imageUpload.uploadError && (
                        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-300 font-medium">❌ {imageUpload.uploadError}</p>
                        </div>
                      )}
                      
                      {/* Success Message */}
                      {formData.bannerImageUrl && !imageUpload.isUploading && !imageUpload.uploadError && (
                        <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                          <p className="text-green-300 font-medium">✅ Banner image uploaded - will be reviewed by admin!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Details Section */}
                <div className="space-y-6">
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Complete Project Details
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Project Title */}
                    <div className="lg:col-span-2">
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        name="projectTitle"
                        value={formData.projectTitle}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter your complete project title"
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
                        <option value="web-development">Web Development</option>
                        <option value="mobile-app">Mobile App</option>
                        <option value="desktop-software">Desktop Software</option>
                        <option value="ai-ml">AI/Machine Learning</option>
                        <option value="data-analysis">Data Analysis</option>
                        <option value="blockchain">Blockchain</option>
                        <option value="game-development">Game Development</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Timeline */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        General Timeline *
                      </label>
                      <select
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Select general timeline</option>
                        <option value="1-week">1 Week</option>
                        <option value="2-weeks">2 Weeks</option>
                        <option value="1-month">1 Month</option>
                        <option value="2-3-months">2-3 Months</option>
                        <option value="3-6-months">3-6 Months</option>
                        <option value="6-months-plus">6+ Months</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>

                    {/* NEW: START DATE */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        min={getTodayDateString()}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      />
                      {formData.startDate && (
                        <p className="text-green-300 text-sm mt-2">
                          📅 <strong>Starts:</strong> {formatDateForDisplay(formData.startDate)}
                        </p>
                      )}
                    </div>

                    {/* NEW: END DATE */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate || getTodayDateString()}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      />
                      {formData.endDate && (
                        <p className="text-green-300 text-sm mt-2">
                          🏁 <strong>Ends:</strong> {formatDateForDisplay(formData.endDate)}
                        </p>
                      )}
                    </div>

                    {/* Project Duration Display */}
                    {formData.startDate && formData.endDate && getProjectDuration() && (
                      <div className="lg:col-span-2">
                        <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                          <h4 className="text-cyan-300 font-semibold mb-2">📊 Project Duration Analysis:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-300">
                                <strong>Duration:</strong> {getProjectDuration()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-300">
                                <strong>Days:</strong> {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-300">
                                <strong>Starts in:</strong> {Math.ceil((new Date(formData.startDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                              </p>
                            </div>
                          </div>
                          <p className="text-cyan-300 text-xs mt-2">
                            🔥 All date details will be included in admin notification
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Experience Level */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Required Experience Level
                      </label>
                      <select
                        name="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Select experience level</option>
                        <option value="junior-level">Junior Level (0-2 years)</option>
                        <option value="mid-level">Mid Level (2-5 years)</option>
                        <option value="senior-level">Senior Level (5+ years)</option>
                        <option value="expert-level">Expert Level (10+ years)</option>
                        <option value="any-level">Any Level</option>
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project Type
                      </label>
                      <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="">Project Type</option>
                        <option value="free">Free (Learning Project)</option>
                      </select>
                    </div>

                    {/* Max Team Size */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Maximum Team Size
                      </label>
                      <select
                        name="maxTeamSize"
                        value={formData.maxTeamSize}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      >
                        <option value="2">2 members</option>
                        <option value="3">3 members</option>
                        <option value="4">4 members</option>
                        <option value="5">5 members</option>
                        <option value="6">6 members</option>
                        <option value="8">8 members</option>
                        <option value="10">10 members</option>
                      </select>
                    </div>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Complete Project Description *
                    </label>
                    <div className="relative">
                      <textarea
                        name="projectDescription"
                        value={formData.projectDescription}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                        placeholder="Provide a detailed description of your project, including key features, functionality, and any specific requirements..."
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.projectDescription.length} characters (all sent to admin)
                      </div>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Required Skills & Technologies *
                    </label>
                    <div className="relative">
                      <textarea
                        name="requiredSkills"
                        value={formData.requiredSkills}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                        placeholder="List the programming languages, frameworks, tools, and technologies required (e.g., React, Node.js, Python, AWS, etc.)"
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.requiredSkills.length} characters (all sent to admin)
                      </div>
                    </div>
                  </div>

                  {/* Project Goals */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Project Goals & Success Criteria
                    </label>
                    <div className="relative">
                      <textarea
                        name="projectGoals"
                        value={formData.projectGoals}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                        placeholder="What are the main objectives and how will success be measured?"
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.projectGoals.length} characters (all sent to admin)
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Your Name
                      </label>
                      <input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
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
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="block text-lime-300 font-semibold mb-3 text-lg">
                        Project Group Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                        placeholder="Enter company or organization name"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-3 text-lg">
                      Additional Information
                    </label>
                    <div className="relative">
                      <textarea
                        name="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                        placeholder="Any additional details, special requirements, or questions you'd like to include..."
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        {formData.additionalInfo.length} characters (all sent to admin)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting || imageUpload.isUploading || !formData.bannerImageUrl || !formData.startDate || !formData.endDate}
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
                          Submitting Complete Content + Dates to Admin...
                        </>
                      ) : imageUpload.isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          Uploading Banner Image...
                        </>
                      ) : !formData.bannerImageUrl ? (
                        <>
                          📸 Upload Banner Image First
                        </>
                      ) : !formData.startDate || !formData.endDate ? (
                        <>
                          📅 Set Project Start & End Dates
                        </>
                      ) : (
                        <>
                          Submit Complete Project + Dates for Review
                          <span className="ml-4 group-hover:translate-x-2 transition-transform text-2xl">🚀</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                  
                  <p className="text-gray-400 text-sm mt-6" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    * Required fields. ALL content including banner image and specific dates will be sent to admin for comprehensive review.
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

        /* Character counter styles */
        .character-counter {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 0.75rem;
          color: rgba(156, 163, 175, 0.8);
          pointer-events: none;
        }

        /* Enhanced textarea with counter */
        .textarea-with-counter {
          position: relative;
        }

        .textarea-with-counter textarea {
          padding-bottom: 2rem;
        }

        /* Date input styling */
        input[type="date"] {
          color-scheme: dark;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2384cc16'%3e%3cpath fillRule='evenodd' d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z' clipRule='evenodd'/%3e%3c/svg%3e");
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default ProjectSubmission;
