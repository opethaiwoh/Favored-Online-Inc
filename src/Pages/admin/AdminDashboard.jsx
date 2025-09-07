// src/Pages/admin/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp, 
  getDoc,
  collectionGroup,
  setDoc,
  getDocs,
  addDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import AdminEmailTester from '../../components/admin/AdminEmailTester';

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [pendingPosts, setPendingPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [pendingProjects, setPendingProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [standaloneGroups, setStandaloneGroups] = useState([]);
  const [pendingCompletions, setPendingCompletions] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('project-reviews');
  const [isAdmin, setIsAdmin] = useState(false);
  const [allCompanies, setAllCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // 🔥 NEW: Associated Projects cache for events
  const [associatedProjectsCache, setAssociatedProjectsCache] = useState({});

  // 🔥 NEW: Helper function to safely handle post data with tagging fields
  // ADD THIS FUNCTION NEAR THE TOP OF THE COMPONENT, AFTER STATE DECLARATIONS
  const normalizePostData = (post) => {
    return {
      ...post,
      // 🔥 SAFETY: Ensure all tagging fields exist with safe defaults
      taggedUsers: post.taggedUsers || [],
      taggedUserIds: post.taggedUserIds || [],
      mentions: post.mentions || [],
      images: post.images || [],
      
      // 🔥 SAFETY: Ensure core fields exist with safe defaults
      title: post.title || 'Untitled Post',
      content: post.content || '',
      authorName: post.authorName || 'Unknown Author',
      status: post.status || 'pending',
      
      // 🔥 SAFETY: Ensure interaction fields exist with safe defaults
      likes: post.likes || [],
      likeCount: post.likeCount || 0,
      repostCount: post.repostCount || 0,
      reposts: post.reposts || [],
      
      // 🔥 SAFETY: Ensure repost fields exist with safe defaults
      isRepost: post.isRepost || false,
      originalPostId: post.originalPostId || null,
      originalPost: post.originalPost || null,
      repostComment: post.repostComment || null
    };
  };

  // Helper function to safely handle undefined values
  const safeValue = (value, defaultValue = '') => {
    return value !== undefined && value !== null ? value : defaultValue;
  };

  // 🔥 NEW: Fetch associated projects for events
  const fetchAssociatedProjects = async (projectIds) => {
    if (!projectIds || projectIds.length === 0) return [];
    
    try {
      const projectPromises = projectIds.map(async (projectId) => {
        // Check cache first
        if (associatedProjectsCache[projectId]) {
          return associatedProjectsCache[projectId];
        }
        
        // Fetch from Firebase
        const projectDoc = await getDoc(doc(db, 'client_projects', projectId));
        if (projectDoc.exists()) {
          const projectData = { id: projectDoc.id, ...projectDoc.data() };
          
          // Cache the result
          setAssociatedProjectsCache(prev => ({
            ...prev,
            [projectId]: projectData
          }));
          
          return projectData;
        }
        return null;
      });
      
      const projects = await Promise.all(projectPromises);
      return projects.filter(Boolean);
    } catch (error) {
      console.error('❌ Error fetching associated projects:', error);
      return [];
    }
  };

  // 🔥 NEW: Copy edit URL to clipboard
  const copyEditUrl = (type, id, ownerInfo = null) => {
    const baseUrl = window.location.origin;
    let editUrl = '';
    let message = '';
    
    if (type === 'project') {
      editUrl = `${baseUrl}/projects/${id}/edit`;
      message = 'Project edit URL copied to clipboard';
    } else if (type === 'event') {
      editUrl = `${baseUrl}/edit-event/${id}`;
      message = 'Event edit URL copied to clipboard';
    }
    
    navigator.clipboard.writeText(editUrl).then(() => {
      toast.success(`${message}\n📧 Send this to: ${ownerInfo || 'the owner'}`);
    }).catch(() => {
      toast.error('Failed to copy URL to clipboard');
    });
  };

  // 🔥 ENHANCED EMAIL NOTIFICATION SYSTEM
  const sendEmailNotification = async (endpoint, data) => {
    try {
      console.log(`📧 Sending email notification via ${endpoint}:`, data);
      
      const response = await fetch(`/api/notifications/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Email notification sent successfully via ${endpoint}:`, result.results);
        return { success: true, results: result.results };
      } else {
        console.error(`❌ Email notification failed via ${endpoint}:`, result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error(`💥 Error sending email via ${endpoint}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced error handling for email operations
  const handleEmailNotification = async (endpoint, data, successMessage, errorMessage) => {
    try {
      const emailResult = await sendEmailNotification(endpoint, data);
      
      if (emailResult.success) {
        console.log(`✅ ${successMessage}`);
        return { success: true };
      } else {
        console.warn(`⚠️ ${errorMessage}:`, emailResult.error);
        toast.warning(`${errorMessage.split(':')[0]} but email notification failed`);
        return { success: false, error: emailResult.error };
      }
    } catch (emailError) {
      console.error(`📧 Email notification error:`, emailError);
      toast.warning(`${errorMessage.split(':')[0]} but email notification failed`);
      return { success: false, error: emailError.message };
    }
  };

  // Determine group linking status
  const determineLinkingStatus = (group) => {
    if (group.originalProjectId || group.projectId) {
      return 'project-linked';
    } else if (group.eventId) {
      return 'event-linked';
    } else if (group.groupType === 'project') {
      return 'project-type';
    } else if (group.groupType === 'event') {
      return 'event-type';
    } else if (group.projectTitle?.toLowerCase().includes('test')) {
      return 'testing';
    } else {
      return 'standalone';
    }
  };

  // 🔥 ADD THIS COMPLETE FUNCTION RIGHT AFTER determineLinkingStatus AND BEFORE useEffect
  const renderCompleteProjectContent = (project) => {
    const knownFields = [
      'id', 'projectTitle', 'projectDescription', 'projectType', 'timeline', 'requiredSkills',
      'projectGoals', 'additionalInfo', 'experienceLevel', 'contactEmail', 'contactName', 
      'companyName', 'budget', 'maxTeamSize', 'bannerImageUrl', 'bannerImageId', 'bannerDeleteHash',
      'submissionDate', 'postedDate', 'createdAt', 'updatedAt', 'status', 'workflowStage',
      'submitterId', 'submitterEmail', 'submitterName', 'submitterPhoto'
    ];
    
    // Get all additional/unknown fields
    const additionalFields = Object.keys(project).filter(key => 
      !knownFields.includes(key) && 
      project[key] !== null && 
      project[key] !== undefined && 
      project[key] !== '' &&
      project[key] !== 0 &&
      !(Array.isArray(project[key]) && project[key].length === 0)
    );

    return (
      <div className="space-y-6">
        
        {/* 🔥 COMPLETE PROJECT DESCRIPTION */}
        {project.projectDescription && (
          <div>
            <h5 className="text-orange-400 font-semibold mb-3 flex items-center">
              📖 Complete Project Description
              <span className="ml-2 text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                {project.projectDescription.length} chars
              </span>
            </h5>
            <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
              <div className="text-gray-200 leading-relaxed text-sm whitespace-pre-line break-words">
                {project.projectDescription}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 COMPLETE PROJECT GOALS */}
        {project.projectGoals && (
          <div>
            <h5 className="text-lime-400 font-semibold mb-3 flex items-center">
              🎯 Complete Project Goals & Objectives
              <span className="ml-2 text-xs bg-lime-500/20 text-lime-300 px-2 py-1 rounded-full">
                {project.projectGoals.length} chars
              </span>
            </h5>
            <div className="bg-black/30 rounded-lg p-4 border border-lime-500/20">
              <div className="text-gray-200 leading-relaxed text-sm whitespace-pre-line break-words">
                {project.projectGoals}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 COMPLETE REQUIRED SKILLS */}
        {project.requiredSkills && (
          <div>
            <h5 className="text-blue-400 font-semibold mb-3 flex items-center">
              🛠️ Complete Required Skills & Technologies
              <span className="ml-2 text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                {project.requiredSkills.length} chars
              </span>
            </h5>
            <div className="bg-black/30 rounded-lg p-4 border border-blue-500/20">
              {/* Skills as tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.requiredSkills.split(/[,;|\n]/).filter(skill => skill.trim()).map((skill, index) => (
                  <span key={index} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30">
                    {skill.trim()}
                  </span>
                ))}
              </div>
              {/* Full skills text */}
              <div className="text-gray-200 leading-relaxed text-sm whitespace-pre-line break-words">
                {project.requiredSkills}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 COMPLETE ADDITIONAL INFORMATION */}
        {project.additionalInfo && (
          <div>
            <h5 className="text-purple-400 font-semibold mb-3 flex items-center">
              📝 Complete Additional Information
              <span className="ml-2 text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                {project.additionalInfo.length} chars
              </span>
            </h5>
            <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
              <div className="text-gray-200 leading-relaxed text-sm whitespace-pre-line break-words">
                {project.additionalInfo}
              </div>
            </div>
          </div>
        )}

        {/* 🔥 CONTENT ANALYSIS & METADATA */}
        {project.contentAnalysis && (
          <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 border border-green-500/20 rounded-xl p-6">
            <h5 className="text-green-300 font-semibold mb-4 flex items-center">
              📊 Content Analysis from Submission System
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{project.contentAnalysis.totalContentLength}</div>
                <div className="text-green-300 text-xs">Total Characters</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{project.contentAnalysis.descriptionLength}</div>
                <div className="text-green-300 text-xs">Description</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{project.contentAnalysis.skillsLength}</div>
                <div className="text-green-300 text-xs">Skills</div>
              </div>
              <div className="text-center">
                <div className="text-green-400 font-bold text-lg">{project.contentAnalysis.completenessScore}/5</div>
                <div className="text-green-300 text-xs">Completeness</div>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 ALL ADDITIONAL/CUSTOM FIELDS */}
        {additionalFields.length > 0 && (
          <div>
            <h5 className="text-cyan-400 font-semibold mb-3 flex items-center">
              🔍 Additional Project Data & Metadata
              <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                {additionalFields.length} fields
              </span>
            </h5>
            <div className="space-y-3">
              {additionalFields.map(field => (
                <div key={field} className="bg-black/30 rounded-lg p-4 border border-cyan-500/20">
                  <h6 className="text-cyan-300 font-medium mb-2">
                    {field.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase())}:
                  </h6>
                  <div className="text-gray-200 text-sm">
                    {typeof project[field] === 'object' 
                      ? (
                        <pre className="text-xs text-gray-300 overflow-x-auto bg-black/50 p-3 rounded">
                          {JSON.stringify(project[field], null, 2)}
                        </pre>
                      )
                      : String(project[field])
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🔥 COMPLETE PROJECT METADATA */}
        <div className="bg-gradient-to-br from-gray-500/10 via-slate-500/10 to-gray-500/10 border border-gray-500/20 rounded-xl p-6">
          <h5 className="text-gray-300 font-semibold mb-4">📋 Complete Project Metadata</h5>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Technical Details */}
            <div className="space-y-3">
              <h6 className="text-gray-300 font-medium">Technical Information:</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Project Type:</span>
                  <span className="text-gray-200">{project.projectType?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timeline:</span>
                  <span className="text-gray-200">{project.timeline || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Experience Level:</span>
                  <span className="text-gray-200">{project.experienceLevel?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Budget:</span>
                  <span className="text-gray-200">{project.budget || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Team Size:</span>
                  <span className="text-gray-200">{project.maxTeamSize || 'Not specified'}</span>
                </div>
                {project.projectComplexity && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Complexity:</span>
                    <span className="text-gray-200">{project.projectComplexity}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Administrative Details */}
            <div className="space-y-3">
              <h6 className="text-gray-300 font-medium">Administrative Information:</h6>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-gray-200">{project.status || 'No Status'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Submitted:</span>
                  <span className="text-gray-200">{project.submissionDate?.toLocaleDateString() || 'Unknown'}</span>
                </div>
                {project.submissionSource && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Source:</span>
                    <span className="text-gray-200">{project.submissionSource}</span>
                  </div>
                )}
                {project.workflowStage && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Workflow Stage:</span>
                    <span className="text-gray-200">{project.workflowStage}</span>
                  </div>
                )}
                {project.allContentSentToAdmin !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Complete Content to Admin:</span>
                    <span className={project.allContentSentToAdmin ? 'text-green-300' : 'text-yellow-300'}>
                      {project.allContentSentToAdmin ? '✅ Yes' : '⚠️ No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-6 pt-4 border-t border-gray-600/30">
            <h6 className="text-gray-300 font-medium mb-2">Contact Information:</h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Contact Name:</span>
                <span className="text-gray-200">{project.contactName || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-200">{project.contactEmail || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Company:</span>
                <span className="text-gray-200">{project.companyName || 'Individual/Personal Project'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Submitter ID:</span>
                <span className="text-gray-200 font-mono text-xs">{project.submitterId || 'Not available'}</span>
              </div>
            </div>
          </div>

          {/* Total field count */}
          <div className="mt-6 pt-4 border-t border-gray-600/30">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Data Fields:</span>
              <span className="text-lime-300 font-semibold">
                {Object.keys(project).filter(key => 
                  project[key] !== null && 
                  project[key] !== undefined && 
                  project[key] !== '' &&
                  project[key] !== 0 &&
                  !(Array.isArray(project[key]) && project[key].length === 0)
                ).length} fields with data
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!currentUser?.email) {
        navigate('/login');
        return;
      }

      try {
        const adminDocRef = doc(db, 'adminUsers', currentUser.email);
        const adminDoc = await getDoc(adminDocRef);
        
        if (adminDoc.exists()) {
          setIsAdmin(true);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [currentUser, navigate]);

  // 🔥 UPDATED: Fetch pending posts with safe data normalization
  // REPLACE THE EXISTING useEffect FOR PENDING POSTS WITH THIS VERSION
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const rawData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        };
        
        // 🔥 SAFETY: Normalize post data to handle new tagging fields
        return normalizePostData(rawData);
      });
      
      setPendingPosts(posts);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin]);

  // 🔥 UPDATED: Fetch all posts with safe data normalization
  // REPLACE THE EXISTING useEffect FOR ALL POSTS WITH THIS VERSION
  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => {
        const rawData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        };
        
        // 🔥 SAFETY: Normalize post data to handle new tagging fields
        return normalizePostData(rawData);
      });
      
      setAllPosts(posts);
    });

    return unsubscribe;
  }, [isAdmin]);

  // 🔥 UPDATED: Fetch pending events with associated projects
  useEffect(() => {
    if (!isAdmin) return;
    
    console.log('🔍 Admin Dashboard: Fetching pending events...');
    
    const allEventsQuery = query(
      collection(db, 'tech_events'),
      orderBy('submissionDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(allEventsQuery, async (snapshot) => {
      console.log('📊 Total events found:', snapshot.docs.length);
      
      const allEventsData = [];
      
      for (const eventDoc of snapshot.docs) {
        const data = eventDoc.data();
        const eventData = {
          id: eventDoc.id,
          ...data,
          submissionDate: data.submissionDate?.toDate(),
          eventDate: data.eventDate?.toDate()
        };
        
        // 🔥 NEW: Fetch associated projects if they exist
        if (data.selectedProjectIds && data.selectedProjectIds.length > 0) {
          try {
            eventData.fetchedAssociatedProjects = await fetchAssociatedProjects(data.selectedProjectIds);
          } catch (error) {
            console.error('Error fetching associated projects for event:', eventDoc.id, error);
            eventData.fetchedAssociatedProjects = [];
          }
        }
        
        allEventsData.push(eventData);
      }
      
      setAllEvents(allEventsData);
      
      const pendingEventsData = allEventsData.filter(event => {
        const status = event.status;
        const isPending = status === 'pending_approval' || 
                         status === 'pending' || 
                         status === 'submitted' || 
                         !status;
        
        if (isPending) {
          console.log('✅ Found pending event:', event.eventTitle, 'Status:', status || 'no status');
        }
        
        return isPending;
      });
      
      console.log('🎯 Pending events after filtering:', pendingEventsData.length);
      setPendingEvents(pendingEventsData);
    }, (error) => {
      console.error('❌ Error fetching pending events:', error);
    });
    
    return unsubscribe;
  }, [isAdmin]);

  // Fetch pending project reviews
  useEffect(() => {
    if (!isAdmin) return;
    
    console.log('🔍 Admin Dashboard: Fetching pending project reviews...');
    
    const completionsQuery = query(
      collection(db, 'project_completion_requests'),
      where('status', '==', 'pending_admin_approval'),
      orderBy('submittedForApprovalAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(completionsQuery, async (snapshot) => {
      console.log('📊 Pending project reviews found:', snapshot.docs.length);
      
      const completionsList = [];
      
      for (const completionDoc of snapshot.docs) {
        const completionData = { id: completionDoc.id, ...completionDoc.data() };
        
        try {
          const groupDoc = await getDoc(doc(db, 'groups', completionData.groupId));
          if (groupDoc.exists()) {
            completionData.groupData = groupDoc.data();
          }
          
          const membersQuery = query(
            collection(db, 'group_members'),
            where('groupId', '==', completionData.groupId),
            where('status', '==', 'active')
          );
          const membersSnapshot = await getDocs(membersQuery);
          completionData.teamSize = membersSnapshot.docs.length;
          
        } catch (error) {
          console.error('Error fetching completion details:', error);
        }
        
        completionsList.push(completionData);
      }
      
      console.log('✅ Processed project reviews:', completionsList.length);
      setPendingCompletions(completionsList);
    }, (error) => {
      console.error('❌ Error fetching pending project reviews:', error);
    });
    
    return unsubscribe;
  }, [isAdmin]);

  // Fetch standalone groups
  useEffect(() => {
    if (!isAdmin) return;
    
    console.log('🔍 Admin Dashboard: Fetching standalone groups...');
    
    const groupsQuery = query(
      collection(db, 'groups'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(groupsQuery, async (snapshot) => {
      console.log('📊 Total groups found:', snapshot.docs.length);
      
      const allGroups = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        };
      });
      
      const standalone = allGroups.filter(group => {
        const hasNoProjectLink = !group.originalProjectId && !group.projectId && !group.eventId;
        const isTestingGroup = group.projectTitle?.toLowerCase().includes('testing') || 
                              group.projectTitle?.toLowerCase().includes('test');
        const groupsWithSameTitle = allGroups.filter(g => 
          g.projectTitle === group.projectTitle
        );
        const isDuplicateTitle = groupsWithSameTitle.length > 1;
        const isOldGroup = group.createdAt && group.createdAt < new Date('2025-05-01');
        
        const isStandalone = hasNoProjectLink || 
                           isTestingGroup || 
                           (isDuplicateTitle && isTestingGroup) ||
                           (isOldGroup && hasNoProjectLink);
        
        if (isStandalone) {
          console.log('🎯 Found standalone group:', {
            title: group.projectTitle,
            reason: hasNoProjectLink ? 'No project/event link' : 
                   isTestingGroup ? 'Testing group' :
                   isDuplicateTitle ? 'Duplicate title' : 'Old group',
            id: group.id
          });
        }
        
        return isStandalone;
      });
      
      console.log('🔥 Standalone groups:', standalone.length);
      setStandaloneGroups(standalone);
    }, (error) => {
      console.error('❌ Error fetching groups:', error);
    });
    
    return unsubscribe;
  }, [isAdmin]);

  // Fetch ALL groups for comprehensive management
  useEffect(() => {
    if (!isAdmin) return;
    
    console.log('🔍 Admin Dashboard: Fetching ALL groups for management...');
    setGroupsLoading(true);
    
    const allGroupsQuery = query(
      collection(db, 'groups'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(allGroupsQuery, async (snapshot) => {
      console.log('📊 Total groups found for management:', snapshot.docs.length);
      
      const allGroupsData = [];
      
      for (const groupDoc of snapshot.docs) {
        const groupData = {
          id: groupDoc.id,
          ...groupDoc.data(),
          createdAt: groupDoc.data().createdAt?.toDate()
        };
        
        try {
          const membersQuery = query(
            collection(db, 'group_members'),
            where('groupId', '==', groupDoc.id),
            where('status', '==', 'active')
          );
          const membersSnapshot = await getDocs(membersQuery);
          groupData.actualMemberCount = membersSnapshot.docs.length;
          groupData.linkingStatus = determineLinkingStatus(groupData);
          
        } catch (error) {
          console.error('Error fetching group details:', error);
          groupData.actualMemberCount = 0;
          groupData.linkingStatus = 'unknown';
        }
        
        allGroupsData.push(groupData);
      }
      
      console.log('✅ Processed all groups for management:', allGroupsData.length);
      setAllGroups(allGroupsData);
      setGroupsLoading(false);
    }, (error) => {
      console.error('❌ Error fetching all groups:', error);
      setGroupsLoading(false);
    });
    
    return unsubscribe;
  }, [isAdmin]);

  // Fetch pending projects
  useEffect(() => {
    if (!isAdmin) return;
    
    console.log('🔍 Admin Dashboard: Fetching projects...');
    
    const allProjectsQuery = query(
      collection(db, 'client_projects'),
      orderBy('submissionDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(allProjectsQuery, (snapshot) => {
      console.log('📊 Total projects found:', snapshot.docs.length);
      
      const allProjects = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          submissionDate: data.submissionDate?.toDate()
        };
      });
      
      setAllProjects(allProjects);
      
      const pendingProjects = allProjects.filter(project => {
        const status = project.status;
        const isPending = status === 'pending_approval' || 
                         status === 'pending' || 
                         status === 'submitted' || 
                         !status;
        
        if (isPending) {
          console.log('✅ Found pending project:', project.projectTitle, 'Status:', status);
        }
        
        return isPending;
      });
      
      console.log('🎯 Pending projects:', pendingProjects.length);
      setPendingProjects(pendingProjects);
    }, (error) => {
      console.error('❌ Error fetching projects:', error);
    });
    
    return unsubscribe;
  }, [isAdmin]);

  // 🔥 NEW: Fetch all companies for management
useEffect(() => {
  if (!isAdmin) return;
  
  console.log('🔍 Admin Dashboard: Fetching companies...');
  setCompaniesLoading(true);
  
  const companiesQuery = query(
    collection(db, 'companies'),
    orderBy('createdAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(companiesQuery, async (snapshot) => {
    console.log('📊 Total companies found:', snapshot.docs.length);
    
    const companiesData = [];
    
    for (const companyDoc of snapshot.docs) {
      const companyData = {
        id: companyDoc.id,
        ...companyDoc.data(),
        createdAt: companyDoc.data().createdAt?.toDate()
      };
      
      try {
        // Count company members
        const membersQuery = query(
          collection(db, 'company_members'),
          where('companyId', '==', companyDoc.id),
          where('status', '==', 'active')
        );
        const membersSnapshot = await getDocs(membersQuery);
        companyData.actualMemberCount = membersSnapshot.docs.length;
        
      } catch (error) {
        console.error('Error fetching company member count:', error);
        companyData.actualMemberCount = 0;
      }
      
      companiesData.push(companyData);
    }
    
    console.log('✅ Processed companies for management:', companiesData.length);
    setAllCompanies(companiesData);
    setCompaniesLoading(false);
  }, (error) => {
    console.error('❌ Error fetching companies:', error);
    setCompaniesLoading(false);
  });
  
  return unsubscribe;
}, [isAdmin]);

  // 🔥 MODIFIED EVENT APPROVAL - NO GROUP CREATION
  const approveEvent = async (eventId, eventData) => {
    try {
      console.log('✅ Admin approving event (NO group creation):', eventId);
      
      // Update event status
      await updateDoc(doc(db, 'tech_events', eventId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.email,
        isActive: true
      });

      // Send email notification (WITHOUT group references)
      await handleEmailNotification(
        'send-event-published',
        { 
          eventData: { 
            ...eventData, 
            eventId: eventId,
            hasEventGroup: false,
            eventGroupId: null,
            eventGroupMessage: ''
          } 
        },
        'Event published email sent successfully',
        'Event approved but email notification failed'
      );

      // Send Firebase notification (WITHOUT group references)
      if (eventData.organizerEmail && eventData.organizerEmail.trim() !== '') {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: eventData.organizerEmail,
          type: 'event_approved',
          title: 'Event Approved! 🎉',
          message: `Your event "${eventData.eventTitle}" has been approved and is now live on the events page.`,
          eventId: eventId,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      console.log('🎉 Event approved successfully (no group created)!');
      toast.success(`Event "${eventData.eventTitle}" approved and published!`);
      
    } catch (error) {
      console.error('❌ Error approving event:', error);
      toast.error('Error approving event: ' + error.message);
    }
  };

  // 🔥 ENHANCED EVENT REJECTION with Email Notifications
  const rejectEvent = async (eventId, eventData, rejectionReason = '') => {
    try {
      console.log('❌ Admin rejecting event:', eventId);
      
      const reason = rejectionReason || prompt(
        'Please provide a detailed reason for rejection:\n\n' +
        'Common reasons:\n' +
        '• Event content inappropriate or off-topic\n' +
        '• Insufficient event details provided\n' +
        '• Event date/time conflicts\n' +
        '• Missing required information\n' +
        '• Does not meet community guidelines\n' +
        '• Incomplete organizer information\n\n' +
        'Your reason:'
      );
      
      if (!reason) {
        toast.error('Rejection reason is required');
        return;
      }

      // Update event as rejected
      await updateDoc(doc(db, 'tech_events', eventId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.email,
        rejectionReason: reason
      });

      // Send email notification for rejection
      await handleEmailNotification(
        'send-event-rejected',
        {
          eventData: {
            ...eventData,
            eventId: eventId,
            rejectionReason: reason,
            rejectedBy: currentUser.email
          }
        },
        'Event rejection email sent successfully',
        'Event rejected but email notification failed'
      );

      // Send Firebase notification
      await addDoc(collection(db, 'notifications'), {
        recipientEmail: eventData.organizerEmail,
        type: 'event_rejected',
        title: 'Event Submission Needs Revision ⚠️',
        message: `Your event "${eventData.eventTitle}" requires changes before approval.\n\nReason: ${reason}\n\nPlease address these issues and resubmit your event.`,
        eventId: eventId,
        rejectionReason: reason,
        createdAt: serverTimestamp(),
        read: false,
        priority: 'high'
      });

      console.log('✅ Event rejected');
      toast.success(`Event rejected. Detailed feedback sent to organizer.`);
      
    } catch (error) {
      console.error('❌ Error rejecting event:', error);
      toast.error('Error rejecting event: ' + error.message);
    }
  };

  // Delete event function
  const deleteEvent = async (eventId, eventData) => {
    try {
      console.log('🗑️ Deleting event:', eventId);
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE this event?\n\n` +
        `Event: "${eventData.eventTitle}"\n` +
        `Organizer: ${eventData.organizerName}\n\n` +
        `This action cannot be undone and will:\n` +
        `• Delete the event permanently\n` +
        `• Delete all registrations\n` +
        `• Remove all related notifications\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE" in capital letters to confirm permanent deletion:'
      );
      
      if (secondConfirm !== 'DELETE') {
        toast.error('Deletion cancelled - confirmation text did not match.');
        return;
      }

      // Delete all event registrations
      const registrationsQuery = query(
        collection(db, 'event_registrations'),
        where('eventId', '==', eventId)
      );
      const registrationsSnapshot = await getDocs(registrationsQuery);
      const registrationDeletePromises = registrationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(registrationDeletePromises);
      console.log(`✅ Deleted ${registrationsSnapshot.docs.length} registrations`);

      // Delete notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('eventId', '==', eventId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(notificationDeletePromises);
      console.log(`✅ Deleted ${notificationsSnapshot.docs.length} notifications`);

      // Delete the event
      await deleteDoc(doc(db, 'tech_events', eventId));
      console.log('✅ Deleted event document');

      // Send notification to event organizer
      if (eventData.organizerEmail) {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: eventData.organizerEmail,
          type: 'event_deleted',
          title: 'Event Deleted by Admin',
          message: `Your event "${eventData.eventTitle}" has been permanently deleted by an administrator. If you believe this was done in error, please contact support.`,
          eventId: eventId,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser.email,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      toast.success(`Event "${eventData.eventTitle}" has been permanently deleted.`);
      console.log('🎉 Event deletion completed successfully');

    } catch (error) {
      console.error('❌ Error deleting event:', error);
      toast.error('Error deleting event: ' + error.message);
      throw error;
    }
  };

  // 🔥 ENHANCED PROJECT APPROVAL with Email Notifications (INTACT - GROUP CREATION ENABLED)
  const approveProjectAndCreateGroup = async (projectId, projectData, adminUser) => {
    try {
      console.log('🔄 Admin approving project and auto-creating group...');
      
      // Update project status to approved
      await updateDoc(doc(db, 'client_projects', projectId), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedBy: adminUser.email,
        groupAutoCreated: true
      });

      // Auto-create group for project owner
      const groupRef = doc(collection(db, 'groups'));
      
      const safeProjectData = {
        projectTitle: safeValue(projectData.projectTitle, 'Untitled Project'),
        projectDescription: safeValue(projectData.projectDescription, 'No description provided'),
        timeline: safeValue(projectData.timeline, 'flexible'),
        experienceLevel: safeValue(projectData.experienceLevel, 'any-level'),
        requiredSkills: safeValue(projectData.requiredSkills, 'Not specified'),
        budget: safeValue(projectData.budget, 'free'),
        projectType: safeValue(projectData.projectType, 'general'),
        contactEmail: safeValue(projectData.contactEmail, ''),
        contactName: safeValue(projectData.contactName, 'Project Owner'),
        submitterId: safeValue(projectData.submitterId, 'unknown')
      };
      
      const groupData = {
        id: groupRef.id,
        originalProjectId: projectId,
        projectId: projectId,
        groupType: 'project',
        projectTitle: safeProjectData.projectTitle,
        description: safeProjectData.projectDescription,
        timeline: safeProjectData.timeline,
        experienceLevel: safeProjectData.experienceLevel,
        requiredSkills: safeProjectData.requiredSkills,
        budget: safeProjectData.budget,
        projectType: safeProjectData.projectType,
        adminEmail: safeProjectData.contactEmail,
        adminName: safeProjectData.contactName,
        adminId: safeProjectData.submitterId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        memberCount: 1,
        maxMembers: 10,
        createdBy: 'admin_approval',
        approvedBy: safeValue(adminUser.email, 'unknown'),
        completionStatus: {
          isReadyForCompletion: false,
          completionInitiatedAt: null,
          completionFormSubmittedAt: null,
          completedAt: null,
          certificatesGenerated: false
        },
        projectConnection: {
          linkedAt: serverTimestamp(),
          linkedBy: safeValue(adminUser.email, 'unknown'),
          automaticallyLinked: true,
          autoCreatedForProjectOwner: true
        },
        settings: {
          allowMemberPosting: true,
          allowMemberInvites: true,
          isPrivate: false
        }
      };

      await setDoc(groupRef, groupData);

      // Add project owner as group admin
      await addDoc(collection(db, 'group_members'), {
        groupId: groupRef.id,
        userEmail: safeProjectData.contactEmail,
        userName: safeProjectData.contactName,
        userId: safeProjectData.submitterId,
        role: 'admin',
        status: 'active',
        joinedAt: serverTimestamp(),
        projectRole: 'Project Owner',
        addedBy: 'auto_creation'
      });

      // Update project with group info
      await updateDoc(doc(db, 'client_projects', projectId), {
        groupId: groupRef.id,
        groupCreated: true,
        projectOwnerCanManageApplications: true
      });

      // Send email notification
      await handleEmailNotification(
        'send-project-approved',
        {
          projectData: { ...safeProjectData, projectId: projectId }
        },
        'Project approval email sent successfully',
        'Project approved but email notification failed'
      );

      // Send Firebase notification
      if (safeProjectData.contactEmail && safeProjectData.contactEmail.trim() !== '') {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: safeProjectData.contactEmail,
          type: 'project_approved',
          title: 'Project Approved & Team Created! 🎉',
          message: `Your project "${safeProjectData.projectTitle}" has been approved and a team group has been created for you.`,
          projectId: projectId,
          groupId: groupRef.id,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      return { success: true, groupId: groupRef.id };
      
    } catch (error) {
      console.error('❌ Error in admin project approval:', error);
      throw error;
    }
  };

  // 🔥 ENHANCED PROJECT REJECTION with Email Notifications
  const rejectProject = async (projectId, projectData, rejectionReason = '') => {
    try {
      console.log('❌ Admin rejecting project:', projectId);
      
      const reason = rejectionReason || prompt(
        'Please provide a detailed reason for rejection:\n\n' +
        'Common reasons:\n' +
        '• Project description is incomplete or unclear\n' +
        '• Budget/timeline requirements not realistic\n' +
        '• Missing required project details\n' +
        '• Does not meet platform guidelines\n' +
        '• Inappropriate content or requirements\n' +
        '• Insufficient information provided\n\n' +
        'Your reason:'
      );
      
      if (!reason) {
        toast.error('Rejection reason is required');
        return;
      }

      // Update project as rejected
      await updateDoc(doc(db, 'client_projects', projectId), {
        status: 'rejected',
        moderationNote: reason,
        moderatorId: currentUser.uid,
        moderatedAt: serverTimestamp(),
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.email,
        rejectionReason: reason
      });

      // Send email notification for rejection
      await handleEmailNotification(
        'send-project-rejected',
        {
          projectData: {
            ...projectData,
            projectId: projectId,
            rejectionReason: reason,
            rejectedBy: currentUser.email
          }
        },
        'Project rejection email sent successfully',
        'Project rejected but email notification failed'
      );

      // Send Firebase notification
      if (projectData.contactEmail && projectData.contactEmail.trim() !== '') {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: projectData.contactEmail,
          type: 'project_rejected',
          title: 'Project Submission Needs Revision ⚠️',
          message: `Your project "${projectData.projectTitle}" requires changes before approval.\n\nReason: ${reason}\n\nPlease address these issues and resubmit your project.`,
          projectId: projectId,
          rejectionReason: reason,
          createdAt: serverTimestamp(),
          read: false,
          priority: 'high'
        });
      }

      toast.success(`Project rejected. Detailed feedback sent to project owner.`);
      
    } catch (error) {
      console.error('❌ Error rejecting project:', error);
      toast.error('Error rejecting project: ' + error.message);
    }
  };

  // 🔥 ENHANCED PROJECT COMPLETION APPROVAL with Email Notifications
  const approveProjectCompletion = async (completionId, completionData) => {
    try {
      console.log('✅ Admin approving project review:', completionId);
      
      // Update completion request as approved
      await updateDoc(doc(db, 'project_completion_requests', completionId), {
        'adminApproval.approved': true,
        'adminApproval.approvedAt': serverTimestamp(),
        'adminApproval.approvedBy': currentUser.email,
        status: 'admin_approved',
        phase: 'badge_assignment',
        badgeAssignmentStatus: 'ready'
      });

      // Update group status
      await updateDoc(doc(db, 'groups', completionData.groupId), {
        status: 'ready_for_badge_assignment',
        'completionStatus.adminApproved': true,
        'completionStatus.approvedAt': serverTimestamp()
      });

      // Send email notification
      await handleEmailNotification(
        'send-project-review-approved',
        {
          completionData: completionData
        },
        'Project review approval email sent successfully',
        'Project review approved but email notification failed'
      );

      // Send Firebase notification
      await addDoc(collection(db, 'notifications'), {
        recipientEmail: completionData.adminEmail,
        type: 'project_review_approved',
        title: 'Project Review Approved! 🎉',
        message: `Your project "${completionData.projectTitle}" has been approved. You can now assign badges to your team members.`,
        groupId: completionData.groupId,
        completionId: completionId,
        createdAt: serverTimestamp(),
        read: false,
        priority: 'high'
      });

      console.log('✅ Project review approved successfully');
      toast.success(`Project "${completionData.projectTitle}" review approved! Owner can now assign badges.`);
      
    } catch (error) {
      console.error('❌ Error approving project review:', error);
      toast.error('Error approving project review: ' + error.message);
    }
  };

  // 🔥 ENHANCED PROJECT COMPLETION REJECTION with Email Notifications
  const rejectProjectCompletion = async (completionId, completionData, rejectionReason = '') => {
    try {
      console.log('❌ Admin rejecting project review:', completionId);
      
      const reason = rejectionReason || prompt(
        'Please provide a detailed reason for rejection:\n\n' +
        'Common reasons:\n' +
        '• GitHub repository is not public\n' +
        '• FavoredOnlineInc not added as collaborator\n' +
        '• Team member names not visible in project\n' +
        '• Project appears incomplete or low quality\n' +
        '• Repository URL is invalid or inaccessible\n' +
        '• Project doesn\'t match team requirements\n\n' +
        'Your reason:'
      );
      
      if (!reason) {
        toast.error('Rejection reason is required');
        return;
      }

      // Update completion request as rejected
      await updateDoc(doc(db, 'project_completion_requests', completionId), {
        'adminApproval.approved': false,
        'adminApproval.rejectedAt': serverTimestamp(),
        'adminApproval.rejectedBy': currentUser.email,
        'adminApproval.rejectionReason': reason,
        status: 'admin_rejected'
      });

      // Reset group status
      await updateDoc(doc(db, 'groups', completionData.groupId), {
        status: 'active',
        'completionStatus.isReadyForCompletion': false,
        'completionStatus.submittedForReview': false
      });

      // Send email notification for rejection
      await handleEmailNotification(
        'send-project-review-rejected',
        {
          completionData: {
            ...completionData,
            rejectionReason: reason,
            rejectedBy: currentUser.email,
            rejectedAt: new Date().toISOString()
          }
        },
        'Project review rejection email sent successfully',
        'Project review rejected but email notification failed'
      );

      // Send Firebase notification
      await addDoc(collection(db, 'notifications'), {
        recipientEmail: completionData.adminEmail,
        type: 'project_review_rejected',
        title: 'Project Review Needs Revision ⚠️',
        message: `Your project "${completionData.projectTitle}" review requires changes before approval.\n\nReason: ${reason}\n\nPlease address these issues and resubmit for review.`,
        groupId: completionData.groupId,
        completionId: completionId,
        rejectionReason: reason,
        createdAt: serverTimestamp(),
        read: false,
        priority: 'high'
      });

      console.log('✅ Project review rejected');
      toast.success(`Project review rejected. Detailed feedback sent to project owner.`);
      
    } catch (error) {
      console.error('❌ Error rejecting project review:', error);
      toast.error('Error rejecting project review: ' + error.message);
    }
  };

  // Post moderation functions
  const moderatePost = async (postId, status, moderationNote = '') => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        status,
        moderationNote,
        moderatorId: currentUser.uid,
        updatedAt: serverTimestamp()
      });
      toast.success(`Post ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error moderating post:', error);
      toast.error('Error moderating post: ' + error.message);
    }
  };

  // Project moderation functions
  const moderateProject = async (projectId, action, moderationNote = '') => {
    try {
      console.log('🔄 Moderating project:', projectId, 'Action:', action);
      
      const projectRef = doc(db, 'client_projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }
      
      const projectData = projectDoc.data();
      console.log('📋 Project data:', projectData);
      
      if (action === 'approved') {
        await approveProjectAndCreateGroup(projectId, projectData, currentUser);
        toast.success('✅ Project approved and team created for project owner!');
      } else if (action === 'rejected') {
        await rejectProject(projectId, projectData, moderationNote);
      } else if (action === 'delete') {
        await deleteProject(projectId, projectData);
      }

    } catch (error) {
      console.error('❌ Error moderating project:', error);
      toast.error('Error moderating project: ' + error.message);
    }
  };

  // 🔥 UPDATED: Delete post function with safe handling of tagging fields
  // REPLACE THE EXISTING deletePost FUNCTION WITH THIS VERSION
  const deletePost = async (postId, postData) => {
    try {
      console.log('🗑️ Deleting post:', postId);
      
      // 🔥 SAFETY: Normalize post data before using it
      const safePostData = normalizePostData(postData);
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE this post?\n\n` +
        `Post: "${safePostData.title}"\n` +
        `Author: ${safePostData.authorName}\n\n` +
        `This action cannot be undone and will:\n` +
        `• Delete the post permanently\n` +
        `• Delete all replies to this post\n` +
        `• Remove all related notifications\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE" in capital letters to confirm permanent deletion:'
      );
      
      if (secondConfirm !== 'DELETE') {
        toast.error('Deletion cancelled - confirmation text did not match.');
        return;
      }

      // Delete all replies
      const repliesQuery = query(
        collection(db, 'posts', postId, 'replies')
      );
      const repliesSnapshot = await getDocs(repliesQuery);
      const replyDeletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(replyDeletePromises);
      console.log(`✅ Deleted ${repliesSnapshot.docs.length} replies`);

      // Delete notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('postId', '==', postId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(notificationDeletePromises);
      console.log(`✅ Deleted ${notificationsSnapshot.docs.length} notifications`);

      // Delete the post
      await deleteDoc(doc(db, 'posts', postId));
      console.log('✅ Deleted post document');

      toast.success(`Post "${safePostData.title}" has been permanently deleted along with all replies.`);
      console.log('🎉 Post deletion completed successfully');

    } catch (error) {
      console.error('❌ Error deleting post:', error);
      toast.error('Error deleting post: ' + error.message);
      throw error;
    }
  };

  const deleteProject = async (projectId, projectData) => {
    try {
      console.log('🗑️ Deleting project:', projectId);
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE this project?\n\n` +
        `Project: "${projectData.projectTitle}"\n` +
        `Company: ${projectData.companyName || 'N/A'}\n\n` +
        `This action cannot be undone and will:\n` +
        `• Delete the project permanently\n` +
        `• Remove any associated group\n` +
        `• Delete all applications\n` +
        `• Remove group posts and members\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE" in capital letters to confirm permanent deletion:'
      );
      
      if (secondConfirm !== 'DELETE') {
        toast.error('Deletion cancelled - confirmation text did not match.');
        return;
      }

      // Delete associated group if exists
      if (projectData.groupId) {
        console.log('🗑️ Deleting associated group:', projectData.groupId);
        
        const groupMembersQuery = query(
          collection(db, 'group_members'),
          where('groupId', '==', projectData.groupId)
        );
        const membersSnapshot = await getDocs(groupMembersQuery);
        const memberDeletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(memberDeletePromises);
        console.log(`✅ Deleted ${membersSnapshot.docs.length} group members`);

        const groupPostsQuery = query(
          collection(db, 'group_posts'),
          where('groupId', '==', projectData.groupId)
        );
        const postsSnapshot = await getDocs(groupPostsQuery);
        const postDeletePromises = postsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(postDeletePromises);
        console.log(`✅ Deleted ${postsSnapshot.docs.length} group posts`);

        await deleteDoc(doc(db, 'groups', projectData.groupId));
        console.log('✅ Deleted group document');
      }

      // Delete all project applications
      const applicationsQuery = query(
        collection(db, 'project_applications'),
        where('projectId', '==', projectId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const applicationDeletePromises = applicationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(applicationDeletePromises);
      console.log(`✅ Deleted ${applicationsSnapshot.docs.length} applications`);

      // Delete notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('projectId', '==', projectId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(notificationDeletePromises);
      console.log(`✅ Deleted ${notificationsSnapshot.docs.length} notifications`);

      // Delete the project
      await deleteDoc(doc(db, 'client_projects', projectId));
      console.log('✅ Deleted project document');

      // Send notification to project owner
      if (projectData.contactEmail) {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: projectData.contactEmail,
          type: 'project_deleted',
          title: 'Project Deleted by Admin',
          message: `Your project "${projectData.projectTitle}" has been permanently deleted by an administrator. If you believe this was done in error, please contact support.`,
          projectId: projectId,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser.email,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      toast.success(`Project "${projectData.projectTitle}" has been permanently deleted along with all associated data.`);
      console.log('🎉 Project deletion completed successfully');

    } catch (error) {
      console.error('❌ Error deleting project:', error);
      toast.error('Error deleting project: ' + error.message);
      throw error;
    }
  };

  const deleteStandaloneGroup = async (groupId, groupData) => {
    try {
      console.log('🗑️ Deleting standalone group:', groupId);
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE this standalone group?\n\n` +
        `Group: "${groupData.projectTitle || groupData.id}"\n` +
        `Admin: ${groupData.adminName || groupData.adminEmail || 'Unknown'}\n` +
        `Members: ${groupData.memberCount || 0}\n\n` +
        `This action cannot be undone and will:\n` +
        `• Delete the group permanently\n` +
        `• Remove all group members\n` +
        `• Delete all group posts and discussions\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE" in capital letters to confirm permanent deletion:'
      );
      
      if (secondConfirm !== 'DELETE') {
        toast.error('Deletion cancelled - confirmation text did not match.');
        return;
      }

      // Delete group members
      const groupMembersQuery = query(
        collection(db, 'group_members'),
        where('groupId', '==', groupId)
      );
      const membersSnapshot = await getDocs(groupMembersQuery);
      const memberDeletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(memberDeletePromises);
      console.log(`✅ Deleted ${membersSnapshot.docs.length} group members`);

      // Delete group posts
      const groupPostsQuery = query(
        collection(db, 'group_posts'),
        where('groupId', '==', groupId)
      );
      const postsSnapshot = await getDocs(groupPostsQuery);
      const postDeletePromises = postsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(postDeletePromises);
      console.log(`✅ Deleted ${postsSnapshot.docs.length} group posts`);

      // Delete group notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('groupId', '==', groupId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(notificationDeletePromises);
      console.log(`✅ Deleted ${notificationsSnapshot.docs.length} notifications`);

      // Delete the group itself
      await deleteDoc(doc(db, 'groups', groupId));
      console.log('✅ Deleted group document');

      // Send notification to group admin about deletion
      if (groupData.adminEmail) {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: groupData.adminEmail,
          type: 'group_deleted',
          title: 'Group Deleted by Admin',
          message: `Your group "${groupData.projectTitle || 'Untitled Group'}" has been permanently deleted by an administrator. If you believe this was done in error, please contact support.`,
          groupId: groupId,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser.email,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      toast.success(`Standalone group "${groupData.projectTitle || groupId}" has been permanently deleted.`);
      console.log('🎉 Standalone group deletion completed successfully');

    } catch (error) {
      console.error('❌ Error deleting standalone group:', error);
      toast.error('Error deleting group: ' + error.message);
    }
  };

  // Comprehensive group deletion
  const deleteAnyGroup = async (groupId, groupData) => {
    try {
      console.log('🗑️ Admin deleting group:', groupId);
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE this group?\n\n` +
        `Group: "${groupData.projectTitle || groupData.title || groupId}"\n` +
        `Admin: ${groupData.adminName || groupData.adminEmail || 'Unknown'}\n` +
        `Members: ${groupData.actualMemberCount || 0}\n` +
        `Status: ${groupData.linkingStatus}\n` +
        `Type: ${groupData.groupType || 'Unknown'}\n\n` +
        `This action cannot be undone and will:\n` +
        `• Delete the group permanently\n` +
        `• Remove all group members\n` +
        `• Delete all group posts and discussions\n` +
        `• Remove all badges and certificates from this group\n` +
        `• Delete completion requests and evaluations\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE GROUP" in capital letters to confirm permanent deletion:'
      );
      
      if (secondConfirm !== 'DELETE GROUP') {
        toast.error('Deletion cancelled - confirmation text did not match.');
        return;
      }

      console.log('🗑️ Starting comprehensive group deletion...');
      
      const loadingToastId = toast.loading('Deleting group and all associated data...');

      let deletionResults = {
        members: 0,
        posts: 0,
        replies: 0,
        badges: 0,
        certificates: 0,
        completionRequests: 0,
        evaluations: 0,
        notifications: 0
      };

      try {
        // Delete group members
        const groupMembersQuery = query(
          collection(db, 'group_members'),
          where('groupId', '==', groupId)
        );
        const membersSnapshot = await getDocs(groupMembersQuery);
        const memberDeletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(memberDeletePromises);
        deletionResults.members = membersSnapshot.docs.length;

        // Delete group posts
        const groupPostsQuery = query(
          collection(db, 'group_posts'),
          where('groupId', '==', groupId)
        );
        const postsSnapshot = await getDocs(groupPostsQuery);
        const postDeletePromises = postsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(postDeletePromises);
        deletionResults.posts = postsSnapshot.docs.length;

        // Delete member badges
        const badgesQuery = query(
          collection(db, 'member_badges'),
          where('groupId', '==', groupId)
        );
        const badgesSnapshot = await getDocs(badgesQuery);
        const badgeDeletePromises = badgesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(badgeDeletePromises);
        deletionResults.badges = badgesSnapshot.docs.length;

        // Delete certificates
        const certificatesQuery = query(
          collection(db, 'certificates'),
          where('groupId', '==', groupId)
        );
        const certificatesSnapshot = await getDocs(certificatesQuery);
        const certificateDeletePromises = certificatesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(certificateDeletePromises);
        deletionResults.certificates = certificatesSnapshot.docs.length;

        // Delete completion requests
        const completionRequestsQuery = query(
          collection(db, 'project_completion_requests'),
          where('groupId', '==', groupId)
        );
        const completionRequestsSnapshot = await getDocs(completionRequestsQuery);
        const completionDeletePromises = completionRequestsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(completionDeletePromises);
        deletionResults.completionRequests = completionRequestsSnapshot.docs.length;

        // Delete group notifications
        const notificationsQuery = query(
          collection(db, 'notifications'),
          where('groupId', '==', groupId)
        );
        const notificationsSnapshot = await getDocs(notificationsQuery);
        const notificationDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(notificationDeletePromises);
        deletionResults.notifications = notificationsSnapshot.docs.length;

        // Delete the group itself
        await deleteDoc(doc(db, 'groups', groupId));

        // Send notification to group admin
        if (groupData.adminEmail && groupData.adminEmail.trim() !== '') {
          await addDoc(collection(db, 'notifications'), {
            recipientEmail: groupData.adminEmail,
            type: 'group_deleted_by_admin',
            title: 'Group Deleted by Administrator',
            message: `Your group "${groupData.projectTitle || 'Untitled Group'}" has been permanently deleted by an administrator. If you believe this was done in error, please contact support.`,
            groupId: groupId,
            deletedAt: serverTimestamp(),
            deletedBy: currentUser.email,
            deletionReason: 'Admin action',
            createdAt: serverTimestamp(),
            read: false
          });
        }

        toast.dismiss(loadingToastId);

        // Force UI update
        setAllGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
        setStandaloneGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));

        const successMessage = `Group "${groupData.projectTitle || groupId}" has been permanently deleted!\n\n` +
          `Deleted items:\n` +
          `• ${deletionResults.members} members\n` +
          `• ${deletionResults.posts} posts\n` +
          `• ${deletionResults.badges} badges\n` +
          `• ${deletionResults.certificates} certificates\n` +
          `• ${deletionResults.completionRequests} completion requests\n` +
          `• ${deletionResults.notifications} notifications`;

        toast.success(successMessage, { duration: 5000 });
        console.log('🎉 Comprehensive group deletion completed successfully');

      } catch (stepError) {
        toast.dismiss(loadingToastId);
        console.error('❌ Error during deletion step:', stepError);
        toast.error(`Deletion failed at step: ${stepError.message}. Some data may have been partially deleted.`, { duration: 8000 });
        throw stepError;
      }

    } catch (error) {
      console.error('❌ Error deleting group:', error);
      toast.error(`Error deleting group: ${error.message}`, { duration: 8000 });
    }
  };

  // 🔥 NEW: Delete company function with cascading deletions
const deleteCompany = async (companyId, companyData) => {
  try {
    console.log('🗑️ Deleting company:', companyId);
    
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY DELETE this company?\n\n` +
      `Company: "${companyData.companyName}"\n` +
      `Industry: ${companyData.industry || 'N/A'}\n` +
      `Members: ${companyData.actualMemberCount || 0}\n\n` +
      `This action cannot be undone and will:\n` +
      `• Delete the company page permanently\n` +
      `• Remove all company members\n` +
      `• Delete all company-related posts\n` +
      `• Remove all related notifications\n\n` +
      `Click OK to continue.`
    );
    
    if (!confirmDelete) {
      return;
    }

    const secondConfirm = window.prompt(
      'Type "DELETE COMPANY" in capital letters to confirm permanent deletion:'
    );
    
    if (secondConfirm !== 'DELETE COMPANY') {
      toast.error('Deletion cancelled - confirmation text did not match.');
      return;
    }

    const loadingToastId = toast.loading('Deleting company and all associated data...');

    let deletionResults = {
      members: 0,
      posts: 0,
      notifications: 0
    };

    try {
      // Delete company members
      const companyMembersQuery = query(
        collection(db, 'company_members'),
        where('companyId', '==', companyId)
      );
      const membersSnapshot = await getDocs(companyMembersQuery);
      const memberDeletePromises = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(memberDeletePromises);
      deletionResults.members = membersSnapshot.docs.length;

      // Delete company-related notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('companyId', '==', companyId)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const notificationDeletePromises = notificationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(notificationDeletePromises);
      deletionResults.notifications = notificationsSnapshot.docs.length;

      // Delete the company itself
      await deleteDoc(doc(db, 'companies', companyId));

      // Send notification to company owner about deletion
      if (companyData.ownerEmail && companyData.ownerEmail.trim() !== '') {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: companyData.ownerEmail,
          type: 'company_deleted_by_admin',
          title: 'Company Page Deleted by Administrator',
          message: `Your company page "${companyData.companyName}" has been permanently deleted by an administrator. If you believe this was done in error, please contact support.`,
          companyId: companyId,
          deletedAt: serverTimestamp(),
          deletedBy: currentUser.email,
          deletionReason: 'Admin action',
          createdAt: serverTimestamp(),
          read: false
        });
      }

      toast.dismiss(loadingToastId);

      // Force UI update
      setAllCompanies(prevCompanies => prevCompanies.filter(c => c.id !== companyId));

      const successMessage = `Company "${companyData.companyName}" has been permanently deleted!\n\n` +
        `Deleted items:\n` +
        `• ${deletionResults.members} members\n` +
        `• ${deletionResults.notifications} notifications`;

      toast.success(successMessage, { duration: 5000 });
      console.log('🎉 Company deletion completed successfully');

    } catch (stepError) {
      toast.dismiss(loadingToastId);
      console.error('❌ Error during deletion step:', stepError);
      toast.error(`Deletion failed at step: ${stepError.message}. Some data may have been partially deleted.`, { duration: 8000 });
      throw stepError;
    }

  } catch (error) {
    console.error('❌ Error deleting company:', error);
    toast.error(`Error deleting company: ${error.message}`, { duration: 8000 });
  }
};

// 🔥 NEW: Bulk delete companies function
const bulkDeleteCompanies = async (companiesToDelete) => {
  try {
    console.log('🗑️ Bulk deleting companies:', companiesToDelete.length);
    
    const confirmDelete = window.confirm(
      `Are you sure you want to PERMANENTLY DELETE ${companiesToDelete.length} companies?\n\n` +
      `This will delete:\n` +
      companiesToDelete.map(c => `• ${c.companyName}`).slice(0, 5).join('\n') + 
      (companiesToDelete.length > 5 ? `\n... and ${companiesToDelete.length - 5} more` : '') + '\n\n' +
      `This action cannot be undone and will remove all associated data.\n\n` +
      `Click OK to continue.`
    );
    
    if (!confirmDelete) {
      return;
    }

    const secondConfirm = window.prompt(
      'Type "DELETE ALL COMPANIES" in capital letters to confirm bulk deletion:'
    );
    
    if (secondConfirm !== 'DELETE ALL COMPANIES') {
      toast.error('Bulk deletion cancelled - confirmation text did not match.');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const company of companiesToDelete) {
      try {
        await deleteCompany(company.id, company);
        successCount++;
      } catch (error) {
        console.error(`Error deleting company ${company.id}:`, error);
        errorCount++;
      }
    }

    toast.success(`Bulk deletion completed!\n\nSuccessfully deleted: ${successCount} companies\nErrors: ${errorCount} companies`);

  } catch (error) {
    console.error('❌ Error in bulk deletion:', error);
    toast.error('Error in bulk deletion: ' + error.message);
  }
};

  // 🔥 UPDATED: Bulk delete functions with safe post handling
  // REPLACE THE EXISTING bulkDeletePosts FUNCTION WITH THIS VERSION
  const bulkDeletePosts = async (postsToDelete) => {
    try {
      console.log('🗑️ Bulk deleting posts:', postsToDelete.length);
      
      // 🔥 SAFETY: Normalize all posts before using them
      const safePosts = (postsToDelete || []).map(post => normalizePostData(post));
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE ${safePosts.length} posts?\n\n` +
        `This will delete:\n` +
        safePosts.map(p => `• ${p.title} (by ${p.authorName})`).slice(0, 5).join('\n') + 
        (safePosts.length > 5 ? `\n... and ${safePosts.length - 5} more` : '') + '\n\n' +
        `This action cannot be undone and will remove all replies and notifications.\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE ALL" in capital letters to confirm bulk deletion:'
      );
      
      if (secondConfirm !== 'DELETE ALL') {
        toast.error('Bulk deletion cancelled - confirmation text did not match.');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const post of safePosts) {
        try {
          await deletePost(post.id, post);
          successCount++;
        } catch (error) {
          console.error(`Error deleting post ${post.id}:`, error);
          errorCount++;
        }
      }

      toast.success(`Bulk deletion completed!\n\nSuccessfully deleted: ${successCount} posts\nErrors: ${errorCount} posts`);

    } catch (error) {
      console.error('❌ Error in bulk deletion:', error);
      toast.error('Error in bulk deletion: ' + error.message);
    }
  };

  const bulkDeleteStandaloneGroups = async (groupsToDelete) => {
    try {
      console.log('🗑️ Bulk deleting standalone groups:', groupsToDelete.length);
      
      const confirmDelete = window.confirm(
        `Are you sure you want to PERMANENTLY DELETE ${groupsToDelete.length} standalone groups?\n\n` +
        `This will delete:\n` +
        groupsToDelete.map(g => `• ${g.projectTitle || g.id}`).slice(0, 5).join('\n') + 
        (groupsToDelete.length > 5 ? `\n... and ${groupsToDelete.length - 5} more` : '') + '\n\n' +
        `This action cannot be undone and will remove all associated data.\n\n` +
        `Click OK to continue.`
      );
      
      if (!confirmDelete) {
        return;
      }

      const secondConfirm = window.prompt(
        'Type "DELETE ALL" in capital letters to confirm bulk deletion:'
      );
      
      if (secondConfirm !== 'DELETE ALL') {
        toast.error('Bulk deletion cancelled - confirmation text did not match.');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const group of groupsToDelete) {
        try {
          await deleteStandaloneGroup(group.id, group);
          successCount++;
        } catch (error) {
          console.error(`Error deleting group ${group.id}:`, error);
          errorCount++;
        }
      }

      toast.success(`Bulk deletion completed!\n\nSuccessfully deleted: ${successCount} groups\nErrors: ${errorCount} groups`);

    } catch (error) {
      console.error('❌ Error in bulk deletion:', error);
      toast.error('Error in bulk deletion: ' + error.message);
    }
  };

  const deleteAllTestingGroups = async () => {
    const testingGroups = standaloneGroups.filter(group => 
      group.projectTitle?.toLowerCase().includes('testing') || 
      group.projectTitle?.toLowerCase().includes('test')
    );
    
    if (testingGroups.length === 0) {
      toast.error('No testing groups found to delete.');
      return;
    }
    
    await bulkDeleteStandaloneGroups(testingGroups);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Checking admin access...</p>
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
                  <span className="mr-1 sm:mr-2 text-sm sm:text-lg">🚀</span>
                  Login
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
                <Link to="/" 
                      className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                      onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                
                {currentUser && (
                  <Link to="/dashboard" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                )}

                {currentUser && (
                  <Link to="/career/dashboard" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                <Link to="/projects" 
                      className="text-lime-400 font-bold transition-all duration-300 hover:text-lime-300 text-base sm:text-lg" 
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5), 1px 1px 2px rgba(0,0,0,0.8)'}}
                      onClick={() => setMobileMenuOpen(false)}>
                  Projects
                </Link>
                
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
                    Login with Google
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
          
          {/* Admin Header */}
          <section className="mb-12">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Admin{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Dashboard
                </span>
              </h1>
              <p className="text-lg text-gray-200 mb-8">🔥 FIXED: Safe handling of tagging fields for posts</p>
            </div>
          </section>

          {/* 🔥 UPDATED STATS CARDS - SAFE HANDLING OF ARRAY LENGTHS */}
          {/* REPLACE THE EXISTING STATS CARDS SECTION WITH THIS VERSION */}
          <section className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4">
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lime-400 text-xl">📝</div>
                    <span className="text-lime-400 text-xs font-medium px-2 py-1 bg-lime-400/10 rounded-full">Posts</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Pending Posts</p>
                    <p className="text-2xl font-black text-lime-400 mb-1">{pendingPosts?.length || 0}</p>
                    <p className="text-gray-500 text-xs">🔥 Safe tagging handling</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-cyan-400 text-xl">📅</div>
                    <span className="text-cyan-400 text-xs font-medium px-2 py-1 bg-cyan-400/10 rounded-full">Events</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Pending Events</p>
                    <p className="text-2xl font-black text-cyan-400 mb-1">{pendingEvents?.length || 0}</p>
                    <p className="text-gray-500 text-xs">🔥 + Banner & Projects</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-orange-400 text-xl">🚀</div>
                    <span className="text-orange-400 text-xs font-medium px-2 py-1 bg-orange-400/10 rounded-full">Projects</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Pending Projects</p>
                    <p className="text-2xl font-black text-orange-400 mb-1">{pendingProjects?.length || 0}</p>
                    <p className="text-gray-500 text-xs">🔥 + Banner Images</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-yellow-400 text-xl">🔍</div>
                    <span className="text-yellow-400 text-xs font-medium px-2 py-1 bg-yellow-400/10 rounded-full">Reviews</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Project Reviews</p>
                    <p className="text-2xl font-black text-yellow-400 mb-1">{pendingCompletions?.length || 0}</p>
                    <p className="text-gray-500 text-xs">Awaiting review</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-blue-400 text-xl">📊</div>
                    <span className="text-blue-400 text-xs font-medium px-2 py-1 bg-blue-400/10 rounded-full">Posts</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Total Posts</p>
                    <p className="text-2xl font-black text-blue-400 mb-1">{allPosts?.length || 0}</p>
                    <p className="text-gray-500 text-xs">🔥 Fixed tagging support</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-purple-400 text-xl">🎯</div>
                    <span className="text-purple-400 text-xs font-medium px-2 py-1 bg-purple-400/10 rounded-full">Projects</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Total Projects</p>
                    <p className="text-2xl font-black text-purple-400 mb-1">{allProjects?.length || 0}</p>
                    <p className="text-gray-500 text-xs">🔥 + Edit URLs</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-pink-400 text-xl">👥</div>
                    <span className="text-pink-400 text-xs font-medium px-2 py-1 bg-pink-400/10 rounded-full">Groups</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Standalone Groups</p>
                    <p className="text-2xl font-black text-pink-400 mb-1">{standaloneGroups?.length || 0}</p>
                    <p className="text-gray-500 text-xs">Safe to delete</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-red-400 text-xl">🗑️</div>
                    <span className="text-red-400 text-xs font-medium px-2 py-1 bg-red-400/10 rounded-full">Groups</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">All Groups</p>
                    <p className="text-2xl font-black text-red-400 mb-1">{allGroups?.length || 0}</p>
                    <p className="text-gray-500 text-xs">Comprehensive delete</p>
                  </div>
                </div>
              </div>
              
              {/* 🔥 NEW: Company Stats Card */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-4 border border-white/20">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-emerald-400 text-xl">🏢</div>
                    <span className="text-emerald-400 text-xs font-medium px-2 py-1 bg-emerald-400/10 rounded-full">Companies</span>
                  </div>
                  <div className="flex-grow">
                    <p className="text-gray-400 text-xs font-medium mb-1">Total Companies</p>
                    <p className="text-2xl font-black text-emerald-400 mb-1">{allCompanies?.length || 0}</p>
                    <p className="text-gray-500 text-xs">🔥 NEW: Delete control</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 🔥 UPDATED TAB NAVIGATION - SAFE HANDLING OF ARRAY LENGTHS */}
          {/* REPLACE THE EXISTING TAB NAVIGATION SECTION WITH THIS VERSION */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-2 border border-white/20">
              <div className="relative">
                <div 
                  className="flex space-x-2 overflow-x-auto pb-2 scrollbar-custom"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(76, 175, 80, 0.6) rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <button
                    onClick={() => setActiveTab('project-reviews')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'project-reviews' 
                        ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🔍 Project Reviews ({pendingCompletions?.length || 0})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'posts' 
                        ? 'bg-lime-500 text-white shadow-lg shadow-lime-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📝 Pending Posts ({pendingPosts?.length || 0}) 🔥
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('pending-events')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'pending-events' 
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📅 Events ({pendingEvents?.length || 0}) 🔥
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('pending-projects')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'pending-projects' 
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🚀 Projects ({pendingProjects?.length || 0}) 🔥
                  </button>

                  <button
                    onClick={() => setActiveTab('all-posts')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'all-posts' 
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📊 All Posts ({allPosts?.length || 0}) 🔥
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('manage-projects')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'manage-projects' 
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🎯 Manage Projects ({allProjects?.length || 0})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('manage-events')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'manage-events' 
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🎪 Manage Events ({allEvents?.length || 0})
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('standalone-groups')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'standalone-groups' 
                        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    👥 Standalone Groups ({standaloneGroups?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('manage-all-groups')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'manage-all-groups' 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🗑️ Delete Any Group ({allGroups?.length || 0})
                  </button>

                  {/* 🔥 NEW: Company Management Tab */}
                  <button
                    onClick={() => setActiveTab('manage-companies')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'manage-companies'
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    🏢 Companies ({allCompanies?.length || 0}) 🔥
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('email-system')}
                    className={`flex-shrink-0 px-3 md:px-4 py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs md:text-sm ${
                      activeTab === 'email-system' 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    📧 Email System
                  </button>
                </div>
                
                {/* Gradient fade indicators */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/40 to-transparent pointer-events-none rounded-l-xl"></div>
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/40 to-transparent pointer-events-none rounded-r-xl"></div>
              </div>
            </div>
          </section>

          {/* Content Sections */}
          <section>
            
            {/* Project Reviews Tab */}
            {activeTab === 'project-reviews' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Project Completion Reviews</h2>
                
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <h4 className="text-yellow-400 font-bold mb-2">🔍 Project Review Guidelines</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    Please verify the following before approving:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>• GitHub repository is public and accessible</li>
                    <li>• FavoredOnlineInc is added as collaborator</li>
                    <li>• All team member names are visible in the project</li>
                    <li>• Project appears complete and functional</li>
                    <li>• Repository URL works and leads to the correct project</li>
                  </ul>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading project reviews...</p>
                  </div>
                ) : (!pendingCompletions || pendingCompletions.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
                    <p className="text-gray-300">No project reviews pending.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {(pendingCompletions || []).map((completion) => (
                      <div key={completion.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl">
                        
                        {/* Project Header */}
                        <div className="mb-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <h3 className="text-xl md:text-2xl font-bold text-white">{completion.projectTitle}</h3>
                            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold border border-yellow-500/30 w-fit">
                              🔍 Pending Review
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-sm">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <span className="text-blue-400 font-semibold block mb-2">👤 Project Owner</span>
                              <span className="text-white font-medium">{completion.adminName || completion.adminEmail}</span>
                            </div>
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                              <span className="text-green-400 font-semibold block mb-2">👥 Team Size</span>
                              <span className="text-white font-medium">{completion.teamSize || 0} members</span>
                            </div>
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                              <span className="text-purple-400 font-semibold block mb-2">📅 Submitted</span>
                              <span className="text-white font-medium">{completion.submittedForApprovalAt?.toDate?.()?.toLocaleDateString()}</span>
                            </div>
                            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                              <span className="text-orange-400 font-semibold block mb-2">🏷️ Group ID</span>
                              <span className="text-white font-medium text-xs break-all">{completion.groupId}</span>
                            </div>
                          </div>
                        </div>

                        {/* Repository & Project URLs */}
                        <div className="mb-8">
                          <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl">
                            <h5 className="text-blue-300 font-bold text-lg mb-4 flex items-center">
                              🔗 Repository & Project Information
                            </h5>
                            
                            {(() => {
                              let githubUrl = null;
                              let projectUrl = null;
                              let demoUrl = null;
                              
                              // Get URLs from projectReview object
                              if (completion.projectReview) {
                                githubUrl = completion.projectReview.repositoryUrl || completion.projectReview.githubRepositoryUrl || completion.projectReview.githubUrl;
                                projectUrl = completion.projectReview.projectUrl || completion.projectReview.projectLink;
                                demoUrl = completion.projectReview.demoUrl || completion.projectReview.liveDemoUrl;
                              }
                              
                              // Fallback: check direct fields if projectReview doesn't exist or URLs are missing
                              if (!githubUrl || !projectUrl) {
                                const possibleGitHubFields = [
                                  'githubRepositoryUrl', 'GitHub Repository URL', 'githubUrl', 'repositoryUrl',
                                  'repository_url', 'repo_url', 'github_url', 'gitUrl', 'codeUrl',
                                  'projectRepository', 'sourceCode', 'repoLink', 'githubLink'
                                ];
                                
                                const possibleProjectFields = [
                                  'projectUrl', 'Project URL', 'projectLink', 'website', 'siteUrl',
                                  'project_url', 'mainUrl', 'appUrl', 'websiteUrl'
                                ];
                                
                                // Find fallback GitHub URL
                                if (!githubUrl) {
                                  for (const field of possibleGitHubFields) {
                                    if (completion[field] && completion[field].trim() !== '') {
                                      githubUrl = completion[field];
                                      break;
                                    }
                                  }
                                }
                                
                                // Find fallback project URL
                                if (!projectUrl) {
                                  for (const field of possibleProjectFields) {
                                    if (completion[field] && completion[field].trim() !== '') {
                                      projectUrl = completion[field];
                                      break;
                                    }
                                  }
                                }
                              }
                              
                              if (githubUrl || projectUrl) {
                                return (
                                  <div className="space-y-4">
                                    {githubUrl && (
                                      <div>
                                        <label className="text-blue-200 font-semibold block mb-2">
                                          📁 GitHub Repository URL: <span className="text-red-300">*Required</span>
                                        </label>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                          <a 
                                            href={githubUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-black/30 border border-blue-500/30 rounded-lg px-4 py-3 text-blue-200 hover:text-blue-100 transition-colors break-all"
                                          >
                                            {githubUrl}
                                          </a>
                                          <button
                                            onClick={() => window.open(githubUrl, '_blank')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap w-full sm:w-auto"
                                          >
                                            🚀 Open GitHub
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {projectUrl && (
                                      <div>
                                        <label className="text-green-200 font-semibold block mb-2">
                                          🌐 Project URL:
                                        </label>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                          <a 
                                            href={projectUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-black/30 border border-green-500/30 rounded-lg px-4 py-3 text-green-200 hover:text-green-100 transition-colors break-all"
                                          >
                                            {projectUrl}
                                          </a>
                                          <button
                                            onClick={() => window.open(projectUrl, '_blank')}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap w-full sm:w-auto"
                                          >
                                            🔗 Visit Project
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {demoUrl && (
                                      <div>
                                        <label className="text-purple-200 font-semibold block mb-2">
                                          🎮 Live Demo URL:
                                        </label>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                          <a 
                                            href={demoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-black/30 border border-purple-500/30 rounded-lg px-4 py-3 text-purple-200 hover:text-purple-100 transition-colors break-all"
                                          >
                                            {demoUrl}
                                          </a>
                                          <button
                                            onClick={() => window.open(demoUrl, '_blank')}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap w-full sm:w-auto"
                                          >
                                            🎮 Try Demo
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                    ⚠️ No repository or project URLs found in the completion data
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        </div>

                        {/* Project Details Section */}
                        <div className="mb-8 space-y-6">
                          
                          {/* Project Description */}
                          {completion.projectReview?.projectSummary && (
                            <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-700/50 border border-gray-600/30 rounded-xl">
                              <h5 className="text-gray-300 font-bold text-lg mb-4 flex items-center">
                                📋 Project Summary
                              </h5>
                              <div className="bg-black/30 border border-gray-600/30 rounded-lg p-4">
                                <p className="text-gray-200 leading-relaxed">
                                  {completion.projectReview.projectSummary}
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Technologies Used */}
                          {completion.projectReview?.technologiesUsed && (
                            <div className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                              <h5 className="text-green-300 font-bold text-lg mb-4 flex items-center">
                                🛠️ Technologies Used
                              </h5>
                              <div className="bg-black/30 border border-green-500/30 rounded-lg p-4">
                                <p className="text-green-100 leading-relaxed">
                                  {completion.projectReview.technologiesUsed}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Key Features */}
                          {completion.projectReview?.keyFeatures && (
                            <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl">
                              <h5 className="text-blue-300 font-bold text-lg mb-4 flex items-center">
                                ⭐ Key Features
                              </h5>
                              <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4">
                                <p className="text-blue-100 leading-relaxed">
                                  {completion.projectReview.keyFeatures}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <button
                            onClick={() => approveProjectCompletion(completion.id, completion)}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                          >
                            <span className="mr-2 text-xl">✅</span>
                            Approve Project Review
                          </button>
                          
                          <button
                            onClick={() => rejectProjectCompletion(completion.id, completion)}
                            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                          >
                            <span className="mr-2 text-xl">❌</span>
                            Request Changes
                          </button>
                        </div>

                        {/* Review Guidelines Reminder */}
                        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                          <p className="text-yellow-300 text-sm">
                            <strong>📋 Before approving:</strong> Ensure the repository is accessible, FavoredOnlineInc is added as collaborator, 
                            team member names are visible, and the project meets completion standards.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 🔥 UPDATED: Pending Posts Tab with Safe Tagging Support */}
            {/* REPLACE THE EXISTING PENDING POSTS TAB WITH THIS VERSION */}
            {activeTab === 'posts' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Posts Awaiting Moderation 🔥</h2>
                
                <div className="mb-6 p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl">
                  <h4 className="text-lime-400 font-bold mb-2">🔥 Enhanced Post Moderation</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    Now with safe handling of tagging fields including:
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>• <strong>Tagged Users:</strong> Shows @mentions and tagged users</li>
                    <li>• <strong>Images:</strong> Displays attached images count</li>
                    <li>• <strong>Safe Rendering:</strong> Handles posts with/without tagging fields</li>
                    <li>• <strong>Backwards Compatible:</strong> Works with old and new posts</li>
                  </ul>
                </div>
                
                {/* Bulk Actions for Pending Posts */}
                {pendingPosts && pendingPosts.length > 0 && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => bulkDeletePosts(pendingPosts)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Pending Posts ({pendingPosts?.length || 0})
                      </button>
                      
                      <div className="bg-gray-700 text-gray-300 px-4 py-3 rounded-lg text-center text-sm">
                        {pendingPosts?.length || 0} posts awaiting moderation
                      </div>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading posts...</p>
                  </div>
                ) : (!pendingPosts || pendingPosts.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
                    <p className="text-gray-300">No posts pending moderation.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(pendingPosts || []).map((post) => (
                      <div key={post.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-white mb-2">{post.title || 'Untitled Post'}</h3>
                          <div className="flex items-center text-gray-400 text-sm mb-3">
                            <span className="mr-4">👤 {post.authorName || 'Unknown Author'}</span>
                            <span>📅 {post.createdAt?.toLocaleDateString() || 'Unknown Date'}</span>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <p className="text-gray-200 text-sm leading-relaxed">
                            {(() => {
                              const content = post.content || '';
                              return content.length > 200 ? `${content.substring(0, 200)}...` : content;
                            })()}
                          </p>
                          
                          {/* 🔥 NEW: Safe handling of tagged users */}
                          {post.taggedUsers && post.taggedUsers.length > 0 && (
                            <div className="mt-3 p-2 bg-lime-500/10 border border-lime-500/20 rounded-lg">
                              <p className="text-lime-300 text-xs font-semibold mb-1">
                                🏷️ Tagged Users ({post.taggedUsers.length}):
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {(post.taggedUsers || []).slice(0, 3).map((user, index) => (
                                  <span key={index} className="text-xs bg-lime-500/20 text-lime-300 px-2 py-1 rounded">
                                    @{user.displayName || user.email?.split('@')[0] || 'Unknown'}
                                  </span>
                                ))}
                                {post.taggedUsers.length > 3 && (
                                  <span className="text-xs text-lime-400">
                                    +{post.taggedUsers.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* 🔥 NEW: Safe handling of images */}
                          {post.images && post.images.length > 0 && (
                            <div className="mt-3 flex items-center text-gray-400 text-xs">
                              <span className="mr-1">🖼️</span>
                              {post.images.length} image{post.images.length !== 1 ? 's' : ''} attached
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <button
                            onClick={() => moderatePost(post.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 text-sm"
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => moderatePost(post.id, 'rejected', 'Does not meet community guidelines')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 text-sm"
                          >
                            ❌ Reject
                          </button>
                          <button
                            onClick={() => deletePost(post.id, post)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-300 text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Events and Projects tabs remain the same as in the original */}
            {/* [Other tabs would continue here with the same structure] */}

            {/* 🔥 UPDATED: ALL POSTS Tab with Safe Tagging Support */}
            {/* REPLACE THE EXISTING ALL POSTS TAB WITH THIS VERSION */}
            {activeTab === 'all-posts' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">All Community Posts Management 🔥</h2>
                
                {/* Bulk Actions for All Posts */}
                {allPosts && allPosts.length > 0 && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => bulkDeletePosts((allPosts || []).filter(p => (p.status || 'pending') === 'pending'))}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                        disabled={(allPosts || []).filter(p => (p.status || 'pending') === 'pending').length === 0}
                      >
                        🗑️ Delete All Pending ({(allPosts || []).filter(p => (p.status || 'pending') === 'pending').length})
                      </button>
                      
                      <button
                        onClick={() => bulkDeletePosts((allPosts || []).filter(p => (p.status || '') === 'rejected'))}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                        disabled={(allPosts || []).filter(p => (p.status || '') === 'rejected').length === 0}
                      >
                        🗑️ Delete All Rejected ({(allPosts || []).filter(p => (p.status || '') === 'rejected').length})
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm('⚠️ DANGER: Delete ALL posts? This cannot be undone!')) {
                            bulkDeletePosts(allPosts || []);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        💥 Delete ALL Posts ({allPosts?.length || 0})
                      </button>
                    </div>
                  </div>
                )}

                {/* Posts Statistics */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-green-400 font-bold text-lg">
                      {(allPosts || []).filter(p => (p.status || '') === 'approved').length}
                    </div>
                    <div className="text-green-300 text-xs">Approved</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                    <div className="text-yellow-400 font-bold text-lg">
                      {(allPosts || []).filter(p => (p.status || 'pending') === 'pending').length}
                    </div>
                    <div className="text-yellow-300 text-xs">Pending</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-red-400 font-bold text-lg">
                      {(allPosts || []).filter(p => (p.status || '') === 'rejected').length}
                    </div>
                    <div className="text-red-300 text-xs">Rejected</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-blue-400 font-bold text-lg">
                      {allPosts?.length || 0}
                    </div>
                    <div className="text-blue-300 text-xs">Total Posts</div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading all posts...</p>
                  </div>
                ) : (!allPosts || allPosts.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-white mb-2">No posts found</h3>
                    <p className="text-gray-300">No posts exist in the system.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(allPosts || []).map((post) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
                          case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                          case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
                          default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                        }
                      };

                      return (
                        <div key={post.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 border border-white/20 hover:border-blue-400/30 transition-all duration-300">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {post.title || 'Untitled Post'}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(post.status || 'pending')}`}>
                                {post.status || 'pending'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex justify-between">
                                <span>Author:</span>
                                <span className="text-white truncate ml-2 max-w-32">
                                  {post.authorName || 'Unknown Author'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="text-white">
                                  {post.createdAt?.toLocaleDateString() || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span className="text-white">
                                  {post.category || 'General'}
                                </span>
                              </div>
                              {/* 🔥 NEW: Show tagging info */}
                              {post.taggedUsers && post.taggedUsers.length > 0 && (
                                <div className="flex justify-between">
                                  <span>Tagged:</span>
                                  <span className="text-lime-400">{post.taggedUsers.length} users</span>
                                </div>
                              )}
                              {/* 🔥 NEW: Show image info */}
                              {post.images && post.images.length > 0 && (
                                <div className="flex justify-between">
                                  <span>Images:</span>
                                  <span className="text-cyan-400">{post.images.length}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300">
                              {(() => {
                                const content = post.content || 'No content';
                                return content.length > 100 ? `${content.substring(0, 100)}...` : content;
                              })()}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {(post.status || 'pending') === 'pending' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => moderatePost(post.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() => moderatePost(post.id, 'rejected', 'Content needs revision')}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                            
                            <button
                              onClick={() => deletePost(post.id, post)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                            >
                              🗑️ Delete Permanently
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Other tabs would continue here... */}
            {/* The rest of the tabs (events, projects, groups, etc.) remain the same */}

            {/* 🔥 ENHANCED Pending Events Tab - WITH BANNER IMAGES & ASSOCIATED PROJECTS */}
            {activeTab === 'pending-events' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Events Awaiting Approval 🔥</h2>
                
                <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                  <h4 className="text-cyan-400 font-bold mb-2">📅 Enhanced Event Approval Process</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    🔥 <strong>New Features:</strong> Review banner images & associated projects when approving events.
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>• ✅ Event becomes visible on the events page</li>
                    <li>• 📸 <strong>NEW: Banner image content review</strong></li>
                    <li>• 🎯 <strong>NEW: Associated projects verification</strong></li>
                    <li>• 📧 Event organizer receives approval notification</li>
                    <li>• 📅 Attendees can view event details and add to calendar</li>
                    <li>• <span className="line-through text-gray-500">Event group automatically created</span> (DISABLED)</li>
                  </ul>
                  <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-orange-300 text-xs">
                      <strong>⚠️ Note:</strong> Event group creation disabled. Events approved without creating associated groups.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading events...</p>
                  </div>
                ) : pendingEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
                    <p className="text-gray-300">No events pending approval.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {pendingEvents.map((event) => (
                      <div key={event.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                        
                        {/* 🔥 NEW: Event Banner Image Display */}
                        {event.eventBannerUrl && (
                          <div className="mb-6">
                            <h5 className="text-cyan-400 font-semibold mb-3 flex items-center">
                              📸 Event Banner Image
                              <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">NEW</span>
                            </h5>
                            <div className="relative group">
                              <img 
                                src={event.eventBannerUrl} 
                                alt="Event banner" 
                                className="w-full h-48 object-cover rounded-xl shadow-lg border border-cyan-500/30"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div className="hidden bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                <span className="text-red-400">⚠️ Failed to load banner image</span>
                              </div>
                              
                              {/* Image Metadata */}
                              {event.eventBannerMetadata && (
                                <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-xs">ID: {event.eventBannerMetadata.imgurId}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Banner Actions */}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => window.open(event.eventBannerUrl, '_blank')}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                🔍 View Full Size
                              </button>
                              {event.eventBannerMetadata?.imgurId && (
                                <span className="bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-xs">
                                  Imgur ID: {event.eventBannerMetadata.imgurId}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Event Header */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">{event.eventTitle}</h3>
                            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-semibold">
                              Pending Approval
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div>
                              <span className="text-gray-400">Organizer:</span><br/>
                              <span className="text-white font-medium">{event.organizerName}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Email:</span><br/>
                              <span className="text-white font-medium">{event.organizerEmail}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Event Date:</span><br/>
                              <span className="text-white font-medium">
                                {event.eventDate?.toLocaleDateString()} at {event.eventDate?.toLocaleTimeString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">Duration:</span><br/>
                              <span className="text-white font-medium">{event.duration}</span>
                            </div>
                          </div>
                        </div>

                        {/* 🔥 NEW: Associated Projects Display */}
                        {event.selectedProjectIds && event.selectedProjectIds.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-cyan-400 font-semibold mb-3 flex items-center">
                              🎯 Associated Projects ({event.selectedProjectIds.length})
                              <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">NEW</span>
                            </h5>
                            
                            <div className="space-y-3 max-h-48 overflow-y-auto">
                              {event.fetchedAssociatedProjects && event.fetchedAssociatedProjects.length > 0 ? (
                                event.fetchedAssociatedProjects.map((project, index) => (
                                  <div key={project.id || index} className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                                    <div className="text-cyan-200 text-sm space-y-1">
                                      <p><strong className="text-cyan-300">Project:</strong> {project.projectTitle}</p>
                                      <p><strong className="text-cyan-300">Timeline:</strong> {project.timeline}</p>
                                      <p><strong className="text-cyan-300">Company:</strong> {project.companyName || 'Individual'}</p>
                                      <p><strong className="text-cyan-300">Status:</strong> {project.status}</p>
                                      {project.contactEmail && (
                                        <p><strong className="text-cyan-300">Owner:</strong> {project.contactEmail}</p>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                  <p className="text-yellow-300 text-sm">
                                    <strong>Project IDs:</strong> {event.selectedProjectIds.join(', ')}
                                  </p>
                                  <p className="text-yellow-200 text-xs mt-1">
                                    ⚠️ Project details couldn't be fetched. Verify these project IDs exist.
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Manual Verification Notice */}
                            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-blue-300 text-sm">
                                🔍 <strong>Admin Action Required:</strong> Manually verify this organizer's association 
                                with the selected projects through group memberships and project ownership.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Event Details */}
                        <div className="mb-6">
                          <h4 className="text-lg font-bold text-blue-400 mb-4">📋 Event Details</h4>
                          
                          <div className="space-y-4">
                            {/* Event Type and Format */}
                            <div className="flex gap-4">
                              <div className="flex items-center">
                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-semibold">
                                  {event.eventType}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                                  {event.format}
                                </span>
                              </div>
                            </div>

                            {/* Event Description */}
                            <div className="p-4 bg-gray-800/50 rounded-xl">
                              <h5 className="text-gray-400 font-semibold mb-2">Description:</h5>
                              <p className="text-gray-200 text-sm leading-relaxed">
                                {event.eventDescription}
                              </p>
                            </div>

                            {/* Meeting URL */}
                            {event.meetingUrl && (
                              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <h5 className="text-green-400 font-semibold mb-2">🔗 Meeting Link:</h5>
                                <a 
                                  href={event.meetingUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-300 hover:text-green-200 text-sm break-all underline"
                                >
                                  {event.meetingUrl}
                                </a>
                              </div>
                            )}

                            {/* Tags */}
                            {event.tags && event.tags.length > 0 && (
                              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                <h5 className="text-purple-400 font-semibold mb-2">🏷️ Tags:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {event.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <button
                            onClick={() => approveEvent(event.id, event)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-300"
                          >
                            ✅ Approve & Publish
                          </button>
                          
                          <button
                            onClick={() => rejectEvent(event.id, event)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-300"
                          >
                            ❌ Request Changes
                          </button>

                          {/* 🔥 NEW: Copy Edit URL Button */}
                          <button
                            onClick={() => copyEditUrl('event', event.id, event.organizerEmail)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-300"
                          >
                            📝 Copy Edit URL
                          </button>
                        </div>

                        {/* Submission Info */}
                        <div className="mt-4 p-3 bg-gray-800/40 rounded-lg">
                          <h6 className="text-gray-400 text-sm font-semibold mb-2">📋 Submission Details:</h6>
                          <div className="text-xs text-gray-300 space-y-1">
                            <div>• Submitted: {event.submissionDate?.toLocaleDateString()}</div>
                            <div>• Event ID: {event.id}</div>
                            <div>• Organizer ID: {event.submitterId || 'Unknown'}</div>
                            {event.selectedProjectIds && (
                              <div>• Associated Projects: {event.selectedProjectIds.length}</div>
                            )}
                            {event.eventBannerUrl && (
                              <div>• 📸 Has Banner Image: Yes</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 🔥 ENHANCED Pending Projects Tab - WITH BANNER IMAGES */}
            {/* 🔥 REPLACE YOUR ENTIRE PENDING PROJECTS TAB WITH THIS COMPLETE CODE */}
            {activeTab === 'pending-projects' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Projects Awaiting Approval 🔥</h2>
                
                <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <h4 className="text-orange-400 font-bold mb-2">🚀 COMPLETE Project Content Review</h4>
                  <p className="text-gray-300 text-sm mb-2">
                    🔥 <strong>Enhanced Admin Dashboard:</strong> Now shows ALL submitted content for comprehensive review.
                  </p>
                  <ul className="text-gray-300 text-sm space-y-1 ml-4">
                    <li>• ✅ <strong>Complete descriptions, goals & additional info</strong> (no truncation)</li>
                    <li>• 🛠️ <strong>Full skills breakdown</strong> with tags and complete text</li>
                    <li>• 📸 <strong>Banner image content review</strong></li>
                    <li>• 📊 <strong>Content analysis & metadata</strong> from submission system</li>
                    <li>• 🔍 <strong>All custom fields & additional data</strong></li>
                    <li>• 📝 <strong>Edit URL generation</strong> for revision requests</li>
                    <li>• 🏗️ <strong>Auto team group creation</strong> upon approval</li>
                  </ul>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading projects...</p>
                  </div>
                ) : pendingProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
                    <p className="text-gray-300">No projects pending approval.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {pendingProjects.map((project) => (
                      <div key={project.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border border-white/20 shadow-2xl">
                        
                        {/* Project Header */}
                        <div className="mb-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                            <h3 className="text-xl md:text-2xl font-bold text-white">{project.projectTitle}</h3>
                            <span className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold border border-orange-500/30 w-fit">
                              🚀 Pending Approval
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-sm">
                            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <span className="text-blue-400 font-semibold block mb-2">🏢 Company/Owner</span>
                              <span className="text-white font-medium">{project.companyName || project.contactName || 'Individual Project'}</span>
                            </div>
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                              <span className="text-green-400 font-semibold block mb-2">📧 Contact</span>
                              <span className="text-white font-medium">{project.contactEmail}</span>
                            </div>
                            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                              <span className="text-purple-400 font-semibold block mb-2">📅 Submitted</span>
                              <span className="text-white font-medium">{project.submissionDate?.toLocaleDateString()}</span>
                            </div>
                            <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                              <span className="text-cyan-400 font-semibold block mb-2">🏷️ Project ID</span>
                              <span className="text-white font-medium text-xs break-all">{project.id}</span>
                            </div>
                          </div>
                        </div>

                        {/* 🔥 Project Banner Image Display */}
                        {project.bannerImageUrl && (
                          <div className="mb-8">
                            <h5 className="text-orange-400 font-semibold mb-4 flex items-center">
                              📸 Project Banner Image
                              <span className="ml-2 text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">Admin Review Required</span>
                            </h5>
                            <div className="relative group">
                              <img 
                                src={project.bannerImageUrl} 
                                alt="Project banner" 
                                className="w-full h-64 md:h-80 object-cover rounded-xl shadow-lg border border-orange-500/30"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div className="hidden bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                                <span className="text-red-400">⚠️ Failed to load banner image</span>
                              </div>
                              
                              {/* Image Metadata */}
                              {project.bannerImageId && (
                                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-sm">Imgur ID: {project.bannerImageId}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Banner Actions */}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button
                                onClick={() => window.open(project.bannerImageUrl, '_blank')}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                              >
                                🔍 View Full Size
                              </button>
                              {project.bannerImageId && (
                                <span className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm">
                                  ID: {project.bannerImageId}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 🔥 COMPLETE PROJECT CONTENT */}
                        <div className="mb-8">
                          <h4 className="text-orange-300 font-bold text-xl mb-6 flex items-center">
                            📋 Complete Project Content Review
                            <span className="ml-3 text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full">
                              ALL CONTENT VISIBLE
                            </span>
                          </h4>
                          
                          {renderCompleteProjectContent(project)}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <button
                            onClick={() => moderateProject(project.id, 'approved')}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                          >
                            <span className="mr-2 text-xl">✅</span>
                            Approve & Create Group
                          </button>
                          
                          <button
                            onClick={() => moderateProject(project.id, 'rejected', 'Project needs revision')}
                            className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                          >
                            <span className="mr-2 text-xl">❌</span>
                            Request Changes
                          </button>

                          <button
                            onClick={() => copyEditUrl('project', project.id, project.contactEmail)}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                          >
                            <span className="mr-2 text-xl">📝</span>
                            Copy Edit URL
                          </button>
                          
                          <button
                            onClick={() => moderateProject(project.id, 'delete')}
                            className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center"
                          >
                            <span className="mr-2 text-xl">🗑️</span>
                            Delete
                          </button>
                        </div>

                        {/* Review Guidelines */}
                        <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                          <p className="text-orange-300 text-sm">
                            <strong>📋 Complete Content Review:</strong> All submitted content is now visible above including complete descriptions, 
                            goals, skills, additional information, and banner image. No content has been truncated for admin review.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}


            {/* ALL POSTS Tab */}
{activeTab === 'all-posts' && (
  <div>
    <h2 className="text-2xl font-bold text-white mb-6">All Community Posts Management</h2>
    
    {/* Bulk Actions for All Posts */}
    {allPosts && allPosts.length > 0 && (
      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => bulkDeletePosts((allPosts || []).filter(p => p.status === 'pending'))}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            disabled={(allPosts || []).filter(p => p.status === 'pending').length === 0}
          >
            🗑️ Delete All Pending ({(allPosts || []).filter(p => p.status === 'pending').length})
          </button>
          
          <button
            onClick={() => bulkDeletePosts((allPosts || []).filter(p => p.status === 'rejected'))}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            disabled={(allPosts || []).filter(p => p.status === 'rejected').length === 0}
          >
            🗑️ Delete All Rejected ({(allPosts || []).filter(p => p.status === 'rejected').length})
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('⚠️ DANGER: Delete ALL posts? This cannot be undone!')) {
                bulkDeletePosts(allPosts || []);
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            💥 Delete ALL Posts ({allPosts?.length || 0})
          </button>
        </div>
      </div>
    )}

    {/* Posts Statistics */}
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
        <div className="text-green-400 font-bold text-lg">
          {(allPosts || []).filter(p => p.status === 'approved').length}
        </div>
        <div className="text-green-300 text-xs">Approved</div>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
        <div className="text-yellow-400 font-bold text-lg">
          {(allPosts || []).filter(p => p.status === 'pending').length}
        </div>
        <div className="text-yellow-300 text-xs">Pending</div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
        <div className="text-red-400 font-bold text-lg">
          {(allPosts || []).filter(p => p.status === 'rejected').length}
        </div>
        <div className="text-red-300 text-xs">Rejected</div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
        <div className="text-blue-400 font-bold text-lg">
          {allPosts?.length || 0}
        </div>
        <div className="text-blue-300 text-xs">Total Posts</div>
      </div>
    </div>

    {loading ? (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading all posts...</p>
      </div>
    ) : (!allPosts || allPosts.length === 0) ? (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-xl font-bold text-white mb-2">No posts found</h3>
        <p className="text-gray-300">No posts exist in the system.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {(allPosts || []).map((post) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
                          case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                          case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
                          default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                        }
                      };

                      return (
                        <div key={post.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 border border-white/20 hover:border-blue-400/30 transition-all duration-300">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {post.title}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(post.status)}`}>
                                {post.status || 'unknown'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex justify-between">
                                <span>Author:</span>
                                <span className="text-white truncate ml-2 max-w-32">
                                  {post.authorName}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="text-white">
                                  {post.createdAt?.toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Category:</span>
                                <span className="text-white">
                                  {post.category || 'General'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300">
                              {post.content.length > 100 ? `${post.content.substring(0, 100)}...` : post.content}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {post.status === 'pending' && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => moderatePost(post.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() => moderatePost(post.id, 'rejected', 'Content needs revision')}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                            
                            <button
                              onClick={() => deletePost(post.id, post)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                            >
                              🗑️ Delete Permanently
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MANAGE ALL PROJECTS Tab */}
            {activeTab === 'manage-projects' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">All Projects Management</h2>
                
                {/* Bulk Actions for All Projects */}
                {allProjects.length > 0 && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => {
                          const pendingProjs = allProjects.filter(p => ['pending', 'pending_approval', 'submitted'].includes(p.status) || !p.status);
                          if (pendingProjs.length > 0 && window.confirm(`Delete all ${pendingProjs.length} pending projects?`)) {
                            pendingProjs.forEach(project => deleteProject(project.id, project));
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Pending ({allProjects.filter(p => ['pending', 'pending_approval', 'submitted'].includes(p.status) || !p.status).length})
                      </button>
                      
                      <button
                        onClick={() => {
                          const rejectedProjs = allProjects.filter(p => p.status === 'rejected');
                          if (rejectedProjs.length > 0 && window.confirm(`Delete all ${rejectedProjs.length} rejected projects?`)) {
                            rejectedProjs.forEach(project => deleteProject(project.id, project));
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Rejected ({allProjects.filter(p => p.status === 'rejected').length})
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm('⚠️ DANGER: Delete ALL projects? This will also delete associated groups and data!')) {
                            if (window.prompt('Type "DELETE ALL PROJECTS" to confirm:') === 'DELETE ALL PROJECTS') {
                              allProjects.forEach(project => deleteProject(project.id, project));
                            }
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        💥 Delete ALL Projects ({allProjects.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Projects Statistics */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-green-400 font-bold text-lg">
                      {allProjects.filter(p => p.status === 'approved').length}
                    </div>
                    <div className="text-green-300 text-xs">Approved</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                    <div className="text-yellow-400 font-bold text-lg">
                      {allProjects.filter(p => ['pending', 'pending_approval', 'submitted'].includes(p.status) || !p.status).length}
                    </div>
                    <div className="text-yellow-300 text-xs">Pending</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-red-400 font-bold text-lg">
                      {allProjects.filter(p => p.status === 'rejected').length}
                    </div>
                    <div className="text-red-300 text-xs">Rejected</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                    <div className="text-purple-400 font-bold text-lg">
                      {allProjects.length}
                    </div>
                    <div className="text-purple-300 text-xs">Total Projects</div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading all projects...</p>
                  </div>
                ) : allProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
                    <p className="text-gray-300">No projects exist in the system.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allProjects.map((project) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
                          case 'pending':
                          case 'pending_approval':
                          case 'submitted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                          case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
                          default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                        }
                      };

                      return (
                        <div key={project.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 border border-white/20 hover:border-purple-400/30 transition-all duration-300">
                          
                          {/* 🔥 NEW: Project Banner Preview (Small) */}
                          {project.bannerImageUrl && (
                            <div className="mb-3">
                              <img 
                                src={project.bannerImageUrl} 
                                alt="Project banner" 
                                className="w-full h-24 object-cover rounded-lg border border-purple-500/30"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {project.projectTitle}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(project.status)}`}>
                                {project.status || 'pending'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex justify-between">
                                <span>Company:</span>
                                <span className="text-white truncate ml-2 max-w-32">
                                  {project.companyName || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Contact:</span>
                                <span className="text-white truncate ml-2 max-w-32">
                                  {project.contactName}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Submitted:</span>
                                <span className="text-white">
                                  {project.submissionDate?.toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Budget:</span>
                                <span className="text-white">
                                  {project.budget}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Timeline:</span>
                                <span className="text-white">
                                  {project.timeline}
                                </span>
                              </div>
                              {project.bannerImageUrl && (
                                <div className="flex justify-between">
                                  <span>Banner:</span>
                                  <span className="text-green-400">✅ Yes</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300">
                              {project.projectDescription?.length > 100 ? 
                                `${project.projectDescription.substring(0, 100)}...` : 
                                project.projectDescription || 'No description'}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {['pending', 'pending_approval', 'submitted'].includes(project.status) || !project.status ? (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => moderateProject(project.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() => moderateProject(project.id, 'rejected', 'Project needs revision')}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            ) : null}
                            
                            {/* 🔥 NEW: Copy Edit URL Button */}
                            <button
                              onClick={() => copyEditUrl('project', project.id, project.contactEmail)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                            >
                              📝 Copy Edit URL
                            </button>
                            
                            <button
                              onClick={() => deleteProject(project.id, project)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                            >
                              🗑️ Delete Permanently
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* MANAGE ALL EVENTS Tab */}
            {activeTab === 'manage-events' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">All Events Management</h2>
                
                {/* Bulk Actions for All Events */}
                {allEvents.length > 0 && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <button
                        onClick={() => {
                          const pendingEvents = allEvents.filter(e => ['pending', 'pending_approval', 'submitted'].includes(e.status) || !e.status);
                          if (pendingEvents.length > 0 && window.confirm(`Delete all ${pendingEvents.length} pending events?`)) {
                            pendingEvents.forEach(event => deleteEvent(event.id, event));
                          }
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Pending ({allEvents.filter(e => ['pending', 'pending_approval', 'submitted'].includes(e.status) || !e.status).length})
                      </button>
                      
                      <button
                        onClick={() => {
                          const rejectedEvents = allEvents.filter(e => e.status === 'rejected');
                          if (rejectedEvents.length > 0 && window.confirm(`Delete all ${rejectedEvents.length} rejected events?`)) {
                            rejectedEvents.forEach(event => deleteEvent(event.id, event));
                          }
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Rejected ({allEvents.filter(e => e.status === 'rejected').length})
                      </button>
                      
                      <button
                        onClick={() => {
                          const pastEvents = allEvents.filter(e => e.eventDate && e.eventDate < new Date());
                          if (pastEvents.length > 0 && window.confirm(`Delete all ${pastEvents.length} past events?`)) {
                            pastEvents.forEach(event => deleteEvent(event.id, event));
                          }
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Past Events ({allEvents.filter(e => e.eventDate && e.eventDate < new Date()).length})
                      </button>
                      
                      <button
                        onClick={() => {
                          if (window.confirm('⚠️ DANGER: Delete ALL events? This cannot be undone!')) {
                            if (window.prompt('Type "DELETE ALL EVENTS" to confirm:') === 'DELETE ALL EVENTS') {
                              allEvents.forEach(event => deleteEvent(event.id, event));
                            }
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        💥 Delete ALL Events ({allEvents.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Events Statistics */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-green-400 font-bold text-lg">
                      {allEvents.filter(e => e.status === 'approved').length}
                    </div>
                    <div className="text-green-300 text-xs">Approved</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
                    <div className="text-yellow-400 font-bold text-lg">
                      {allEvents.filter(e => ['pending', 'pending_approval', 'submitted'].includes(e.status) || !e.status).length}
                    </div>
                    <div className="text-yellow-300 text-xs">Pending</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-red-400 font-bold text-lg">
                      {allEvents.filter(e => e.status === 'rejected').length}
                    </div>
                    <div className="text-red-300 text-xs">Rejected</div>
                  </div>
                  <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-center">
                    <div className="text-gray-400 font-bold text-lg">
                      {allEvents.filter(e => e.eventDate && e.eventDate < new Date()).length}
                    </div>
                    <div className="text-gray-300 text-xs">Past Events</div>
                  </div>
                  <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-center">
                    <div className="text-teal-400 font-bold text-lg">
                      {allEvents.length}
                    </div>
                    <div className="text-teal-300 text-xs">Total Events</div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading all events...</p>
                  </div>
                ) : allEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
                    <p className="text-gray-300">No events exist in the system.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allEvents.map((event) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
                          case 'pending':
                          case 'pending_approval':
                          case 'submitted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
                          case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
                          default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                        }
                      };

                      const isPastEvent = event.eventDate && event.eventDate < new Date();

                      return (
                        <div key={event.id} className={`bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 border border-white/20 hover:border-teal-400/30 transition-all duration-300 ${isPastEvent ? 'opacity-75' : ''}`}>
                          
                          {/* 🔥 NEW: Event Banner Preview (Small) */}
                          {event.eventBannerUrl && (
                            <div className="mb-3">
                              <img 
                                src={event.eventBannerUrl} 
                                alt="Event banner" 
                                className="w-full h-24 object-cover rounded-lg border border-teal-500/30"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {event.eventTitle}
                              </h3>
                              <div className="flex flex-col items-end space-y-1">
                                <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(event.status)}`}>
                                  {event.status || 'pending'}
                                </span>
                                {isPastEvent && (
                                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                    Past Event
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex justify-between">
                                <span>Organizer:</span>
                                <span className="text-white truncate ml-2 max-w-32">
                                  {event.organizerName}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Date:</span>
                                <span className={`${isPastEvent ? 'text-gray-400' : 'text-white'}`}>
                                  {event.eventDate?.toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Time:</span>
                                <span className={`${isPastEvent ? 'text-gray-400' : 'text-white'}`}>
                                  {event.eventDate?.toLocaleTimeString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span className="text-white">
                                  {event.duration}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Type:</span>
                                <span className="text-white">
                                  {event.eventType}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Format:</span>
                                <span className="text-white">
                                  {event.format}
                                </span>
                              </div>
                              {event.selectedProjectIds && (
                                <div className="flex justify-between">
                                  <span>Projects:</span>
                                  <span className="text-cyan-400">{event.selectedProjectIds.length}</span>
                                </div>
                              )}
                              {event.eventBannerUrl && (
                                <div className="flex justify-between">
                                  <span>Banner:</span>
                                  <span className="text-green-400">✅ Yes</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300">
                              {event.eventDescription?.length > 100 ? 
                                `${event.eventDescription.substring(0, 100)}...` : 
                                event.eventDescription || 'No description'}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {(['pending', 'pending_approval', 'submitted'].includes(event.status) || !event.status) && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => approveEvent(event.id, event)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() => rejectEvent(event.id, event)}
                                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                            
                            {/* 🔥 NEW: Copy Edit URL Button */}
                            <button
                              onClick={() => copyEditUrl('event', event.id, event.organizerEmail)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                            >
                              📝 Copy Edit URL
                            </button>
                            
                            <button
                              onClick={() => deleteEvent(event.id, event)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                            >
                              🗑️ Delete Permanently
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Standalone Groups Tab */}
            {activeTab === 'standalone-groups' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Standalone Groups Management</h2>
                
                {/* Bulk Actions for Standalone Groups */}
                {standaloneGroups.length > 0 && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={deleteAllTestingGroups}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🧪 Delete All Testing Groups ({standaloneGroups.filter(g => 
                          g.projectTitle?.toLowerCase().includes('testing') || 
                          g.projectTitle?.toLowerCase().includes('test')
                        ).length})
                      </button>
                      
                      <button
                        onClick={() => bulkDeleteStandaloneGroups(standaloneGroups)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                      >
                        🗑️ Delete All Standalone Groups ({standaloneGroups.length})
                      </button>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading standalone groups...</p>
                  </div>
                ) : standaloneGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">✨</div>
                    <h3 className="text-xl font-bold text-white mb-2">All cleaned up!</h3>
                    <p className="text-gray-300">No standalone groups found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {standaloneGroups.map((group) => (
                      <div key={group.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {group.projectTitle || 'Untitled Group'}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div>
                              <span className="text-gray-400">Admin:</span><br/>
                              <span className="text-white font-medium">{group.adminName || group.adminEmail || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Members:</span><br/>
                              <span className="text-white font-medium">{group.memberCount || 0}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Created:</span><br/>
                              <span className="text-white font-medium">{group.createdAt?.toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Status:</span><br/>
                              <span className="text-white font-medium">{group.status || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        
                        {group.description && (
                          <div className="mb-6">
                            <div className="p-4 bg-gray-800/50 rounded-xl">
                              <p className="text-gray-200 text-sm leading-relaxed">
                                {group.description.length > 150 ? `${group.description.substring(0, 150)}...` : group.description}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          {group.projectTitle?.toLowerCase().includes('test') && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                              <span className="text-orange-400 text-sm font-semibold">🧪 Testing Group Detected</span>
                            </div>
                          )}
                          
                          <button
                            onClick={() => deleteStandaloneGroup(group.id, group)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-300"
                          >
                            🗑️ Delete Standalone Group
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* MANAGE ALL GROUPS Tab */}
            {activeTab === 'manage-all-groups' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Comprehensive Group Management</h2>
                
                {/* Warning Section */}
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h4 className="text-red-400 font-bold mb-2">⚠️ DANGER ZONE</h4>
                  <p className="text-sm text-gray-300 mb-3">
                    This section allows you to delete ANY group regardless of its status or linking. This includes:
                  </p>
                  <ul className="text-sm text-gray-300 space-y-1 ml-4 mb-3">
                    <li>• Groups linked to projects (active or completed)</li>
                    <li>• Groups linked to events (even though new event groups are disabled)</li>
                    <li>• Standalone testing groups</li>
                    <li>• Groups with active members and ongoing discussions</li>
                    <li>• Groups with assigned badges and certificates</li>
                  </ul>
                  <p className="text-red-300 font-semibold text-sm">
                    🚨 Deletion is PERMANENT and removes ALL associated data including posts, badges, certificates, and member records.
                  </p>
                </div>

                {/* Group Statistics */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
                    <div className="text-blue-400 font-bold text-lg">
                      {allGroups.filter(g => g.linkingStatus === 'project-linked').length}
                    </div>
                    <div className="text-blue-300 text-xs">Project Linked</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
                    <div className="text-purple-400 font-bold text-lg">
                      {allGroups.filter(g => g.linkingStatus === 'event-linked').length}
                    </div>
                    <div className="text-purple-300 text-xs">Event Linked</div>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
                    <div className="text-orange-400 font-bold text-lg">
                      {allGroups.filter(g => g.linkingStatus === 'testing').length}
                    </div>
                    <div className="text-orange-300 text-xs">Testing Groups</div>
                  </div>
                  <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-center">
                    <div className="text-gray-400 font-bold text-lg">
                      {allGroups.filter(g => g.linkingStatus === 'standalone').length}
                    </div>
                    <div className="text-gray-300 text-xs">Standalone</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    <div className="text-green-400 font-bold text-lg">
                      {allGroups.filter(g => g.status === 'completed').length}
                    </div>
                    <div className="text-green-300 text-xs">Completed</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                    <div className="text-red-400 font-bold text-lg">
                      {allGroups.length}
                    </div>
                    <div className="text-red-300 text-xs">Total Groups</div>
                  </div>
                </div>

                {groupsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-400 mx-auto mb-4"></div>
                    <p className="text-gray-300">Loading all groups...</p>
                  </div>
                ) : allGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-white mb-2">No groups found</h3>
                    <p className="text-gray-300">No groups exist in the system.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {allGroups.map((group) => {
                      const getLinkingStatusColor = (status) => {
                        switch (status) {
                          case 'project-linked': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                          case 'event-linked': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
                          case 'testing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
                          case 'standalone': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
                          default: return 'bg-red-500/20 text-red-400 border-red-500/30';
                        }
                      };

                      const getLinkingStatusLabel = (status) => {
                        switch (status) {
                          case 'project-linked': return '🔗 Project Linked';
                          case 'event-linked': return '📅 Event Linked';
                          case 'testing': return '🧪 Testing Group';
                          case 'standalone': return '🔀 Standalone';
                          default: return '❓ Unknown';
                        }
                      };

                      return (
                        <div key={group.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 border border-white/20 hover:border-red-400/30 transition-all duration-300">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-bold text-white truncate">
                                {group.projectTitle || group.title || 'Untitled Group'}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold border ${getLinkingStatusColor(group.linkingStatus)}`}>
                                {getLinkingStatusLabel(group.linkingStatus)}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex justify-between">
                                <span>Admin:</span>
                                <span className="text-white truncate ml-2 max-w-32">
                                  {group.adminName || group.adminEmail || 'Unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Members:</span>
                                <span className="text-white">{group.actualMemberCount || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={`font-semibold ${
                                  group.status === 'completed' ? 'text-green-400' :
                                  group.status === 'active' ? 'text-blue-400' :
                                  group.status === 'completing' ? 'text-yellow-400' :
                                  'text-gray-400'
                                }`}>
                                  {group.status || 'unknown'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Created:</span>
                                <span className="text-white">
                                  {group.createdAt?.toLocaleDateString() || 'Unknown'}
                                </span>
                              </div>
                              {group.originalProjectId && (
                                <div className="flex justify-between">
                                  <span>Project ID:</span>
                                  <span className="text-blue-300 text-xs truncate ml-2 max-w-20">
                                    {group.originalProjectId}
                                  </span>
                                </div>
                              )}
                              {group.eventId && (
                                <div className="flex justify-between">
                                  <span>Event ID:</span>
                                  <span className="text-purple-300 text-xs truncate ml-2 max-w-20">
                                    {group.eventId}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button
                            onClick={() => deleteAnyGroup(group.id, group)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-semibold transition-colors duration-300 text-sm"
                          >
                            🗑️ Delete Permanently
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 🔥 NEW: Company Management Tab */}
{activeTab === 'manage-companies' && (
  <div>
    <h2 className="text-2xl font-bold text-white mb-6">Company Management 🔥</h2>
    
    <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
      <h4 className="text-emerald-400 font-bold mb-2">🏢 Company Directory Control</h4>
      <p className="text-gray-300 text-sm mb-2">
        🔥 <strong>New Features:</strong> Admin control over company pages
      </p>
      <ul className="text-gray-300 text-sm space-y-1 ml-4">
        <li>• <strong>No Approval Required:</strong> Companies auto-publish when created</li>
        <li>• <strong>Admin Deletion:</strong> Remove inappropriate or spam companies</li>
        <li>• <strong>Cascading Cleanup:</strong> Deletes members, posts, and notifications</li>
        <li>• <strong>Owner Notification:</strong> Company owners notified of deletions</li>
        <li>• <strong>Member Protection:</strong> All company members safely removed</li>
      </ul>
    </div>

    {/* Bulk Actions for Companies */}
    {allCompanies.length > 0 && (
      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <h4 className="text-red-400 font-bold mb-3">🚨 Bulk Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              const testCompanies = allCompanies.filter(c => 
                c.companyName?.toLowerCase().includes('test') || 
                c.description?.toLowerCase().includes('test')
              );
              if (testCompanies.length > 0) {
                bulkDeleteCompanies(testCompanies);
              } else {
                toast.info('No test companies found');
              }
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            🧪 Delete Test Companies ({allCompanies.filter(c => 
              c.companyName?.toLowerCase().includes('test') || 
              c.description?.toLowerCase().includes('test')
            ).length})
          </button>
          
          <button
            onClick={() => {
              const inactiveCompanies = allCompanies.filter(c => 
                (c.actualMemberCount || 0) === 0
              );
              if (inactiveCompanies.length > 0) {
                bulkDeleteCompanies(inactiveCompanies);
              } else {
                toast.info('No companies with 0 members found');
              }
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            👤 Delete Empty Companies ({allCompanies.filter(c => (c.actualMemberCount || 0) === 0).length})
          </button>
          
          <button
            onClick={() => {
              if (window.confirm('⚠️ DANGER: Delete ALL companies? This cannot be undone!')) {
                if (window.prompt('Type "DELETE ALL COMPANIES" to confirm:') === 'DELETE ALL COMPANIES') {
                  bulkDeleteCompanies(allCompanies);
                }
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            💥 Delete ALL Companies ({allCompanies.length})
          </button>
        </div>
      </div>
    )}

    {/* Company Statistics */}
    <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
        <div className="text-emerald-400 font-bold text-lg">
          {allCompanies.filter(c => c.status === 'active' || !c.status).length}
        </div>
        <div className="text-emerald-300 text-xs">Active Companies</div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
        <div className="text-blue-400 font-bold text-lg">
          {allCompanies.filter(c => c.isVerified).length}
        </div>
        <div className="text-blue-300 text-xs">Verified</div>
      </div>
      <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-center">
        <div className="text-gray-400 font-bold text-lg">
          {allCompanies.filter(c => (c.actualMemberCount || 0) === 0).length}
        </div>
        <div className="text-gray-300 text-xs">No Members</div>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
        <div className="text-orange-400 font-bold text-lg">
          {allCompanies.filter(c => 
            c.companyName?.toLowerCase().includes('test') || 
            c.description?.toLowerCase().includes('test')
          ).length}
        </div>
        <div className="text-orange-300 text-xs">Test Companies</div>
      </div>
    </div>

    {companiesLoading ? (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading companies...</p>
      </div>
    ) : allCompanies.length === 0 ? (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🏢</div>
        <h3 className="text-xl font-bold text-white mb-2">No companies found</h3>
        <p className="text-gray-300">No companies exist in the system.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {allCompanies.map((company) => (
          <div key={company.id} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 border border-white/20 hover:border-emerald-400/30 transition-all duration-300">
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-white truncate flex-1">
                  {company.companyName}
                </h3>
                <div className="flex items-center space-x-1 ml-2">
                  {company.isVerified && (
                    <span className="text-blue-400 text-xs">✓</span>
                  )}
                  <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                    company.status === 'active' || !company.status
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {company.status || 'active'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Industry:</span>
                  <span className="text-white truncate ml-2 max-w-32">
                    {company.industry || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="text-white truncate ml-2 max-w-32">
                    {company.location || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Founded:</span>
                  <span className="text-white">
                    {company.foundedYear || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Members:</span>
                  <span className="text-emerald-400 font-semibold">
                    {company.actualMemberCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="text-white truncate ml-2 max-w-32">
                    {company.ownerName || company.ownerEmail || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-white">
                    {company.createdAt?.toLocaleDateString() || 'Unknown'}
                  </span>
                </div>
                {company.website && (
                  <div className="flex justify-between">
                    <span>Website:</span>
                    <a 
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs truncate ml-2 max-w-24"
                    >
                      Visit →
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-300">
                {(() => {
                  const description = company.description || 'No description provided';
                  return description.length > 100 ? `${description.substring(0, 100)}...` : description;
                })()}
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => window.open(`/companies/${company.id}`, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
              >
                👁️ View Company Page
              </button>
              
              <button
                onClick={() => deleteCompany(company.id, company)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
              >
                🗑️ Delete Company
              </button>
            </div>

            {/* Test Company Warning */}
            {(company.companyName?.toLowerCase().includes('test') || 
              company.description?.toLowerCase().includes('test')) && (
              <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <span className="text-orange-400 text-xs font-semibold">🧪 Test Company Detected</span>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}

            {/* EMAIL SYSTEM TAB with AdminEmailTester */}
            {activeTab === 'email-system' && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">📧 Email Notification System</h2>
                
                {/* Email System Overview */}
                <div className="mb-8">
                  <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-green-500/10 backdrop-blur-2xl rounded-2xl p-6 border border-green-500/20">
                    <div className="flex items-center justify-center mb-4">
                      <div className="text-green-400 text-3xl mr-4">📧</div>
                      <div className="text-center">
                        <h3 className="text-green-300 font-bold text-xl">Complete Email Notification System</h3>
                        <p className="text-green-200 text-sm">Enhanced with visual content review & associated projects</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
                        <div className="text-blue-400 text-2xl mb-2">✅</div>
                        <div className="text-blue-300 font-semibold">Approval Emails</div>
                        <div className="text-blue-200 text-sm">🔥 Enhanced Review</div>
                      </div>
                      
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                        <div className="text-red-400 text-2xl mb-2">❌</div>
                        <div className="text-red-300 font-semibold">Rejection Emails</div>
                        <div className="text-red-200 text-sm">🔥 Edit URLs</div>
                      </div>
                      
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
                        <div className="text-purple-400 text-2xl mb-2">🎪</div>
                        <div className="text-purple-300 font-semibold">Auto Group Creation</div>
                        <div className="text-purple-200 text-sm">Projects Only</div>
                      </div>
                      
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                        <div className="text-yellow-400 text-2xl mb-2">📬</div>
                        <div className="text-yellow-300 font-semibold">Admin Notifications</div>
                        <div className="text-yellow-200 text-sm">All Types Active</div>
                      </div>
                    </div>

                    {/* Configuration Notice */}
                    <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <div className="flex items-center">
                        <div className="text-orange-400 text-xl mr-3">⚠️</div>
                        <div>
                          <h5 className="text-orange-300 font-semibold">🔥 Enhanced Features</h5>
                          <div className="text-orange-200 text-sm mt-1">
                            <span className="text-green-300">✅ Project banner image review</span><br/>
                            <span className="text-cyan-300">✅ Event banner & associated projects review</span><br/>
                            <span className="text-blue-300">✅ Edit URL generation for revisions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Testing System */}
                <AdminEmailTester />
              </div>
            )}
                        
          </section>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Enhanced scrollbar for tab navigation */
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(76, 175, 80, 0.6) rgba(255, 255, 255, 0.1);
        }
        
        .scrollbar-custom::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(55, 65, 81, 0.3);
          border-radius: 4px;
          margin: 0 8px;
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(90deg, rgba(76, 175, 80, 0.6), rgba(34, 197, 94, 0.8));
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(90deg, rgba(76, 175, 80, 0.8), rgba(34, 197, 94, 1));
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.4);
        }

        /* 🔥 NEW: Enhanced styling for tagging display */
        .tagging-info {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(34, 197, 94, 0.1));
          border: 1px solid rgba(76, 175, 80, 0.3);
          border-radius: 8px;
          padding: 8px;
          margin-top: 8px;
        }
        
        .tag-badge {
          background: rgba(76, 175, 80, 0.2);
          color: rgb(163, 230, 53);
          border: 1px solid rgba(76, 175, 80, 0.4);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
