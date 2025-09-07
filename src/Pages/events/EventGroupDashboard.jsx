// src/Pages/events/EventGroupDashboard.jsx - ENHANCED APPLICATION MANAGEMENT

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  getDocs,
  addDoc,
  arrayUnion,
  arrayRemove,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

// Import helper functions
import { 
  getEventGroup,
  getEventGroupMembers,
  approveEventGroupMember,
  removeEventGroupMember,
  getUserEventGroupStatus
} from '../../utils/eventGroupHelpers';

// Import error handling utilities
import { 
  safeFirestoreOperation, 
  showSuccessMessage, 
  showWarningMessage,
  handleFirebaseError 
} from '../../utils/errorHandler';

// 🔥 NEW: Enhanced Application Review Component
const ApplicationReviewCard = ({ 
  application, 
  onApprove, 
  onReject, 
  onRequestInterview,
  approvingMember, 
  rejectingMember,
  eventGroup 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [notes, setNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('pending');

  // Calculate application urgency based on time submitted
  const getApplicationUrgency = () => {
    if (!application.appliedAt) return 'normal';
    const hoursAgo = (new Date() - application.appliedAt) / (1000 * 60 * 60);
    if (hoursAgo < 2) return 'urgent';
    if (hoursAgo < 24) return 'recent';
    if (hoursAgo < 72) return 'normal';
    return 'old';
  };

  const urgency = getApplicationUrgency();
  const urgencyColors = {
    urgent: 'border-red-500/50 bg-red-500/10',
    recent: 'border-yellow-500/50 bg-yellow-500/10', 
    normal: 'border-blue-500/50 bg-blue-500/10',
    old: 'border-gray-500/50 bg-gray-500/10'
  };

  const urgencyLabels = {
    urgent: '🔥 Just Applied',
    recent: '⚡ Recent', 
    normal: '📋 Pending',
    old: '⏰ Waiting'
  };

  return (
    <div className={`rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-2xl ${urgencyColors[urgency]}`}>
      
      {/* Application Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {application.userName?.charAt(0).toUpperCase() || '?'}
            </div>
            {urgency === 'urgent' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white">{application.userName}</h3>
            <p className="text-gray-300">{application.userEmail}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                urgency === 'urgent' ? 'bg-red-500/30 text-red-300' :
                urgency === 'recent' ? 'bg-yellow-500/30 text-yellow-300' :
                urgency === 'normal' ? 'bg-blue-500/30 text-blue-300' :
                'bg-gray-500/30 text-gray-300'
              }`}>
                {urgencyLabels[urgency]}
              </span>
              <span className="text-xs text-gray-400">
                Applied {application.appliedAt?.toLocaleDateString()} at {application.appliedAt?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {showDetails ? '▼ Hide Details' : '▶ Show Details'}
        </button>
      </div>

      {/* Application Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-black/30 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Requested Role</div>
          <div className="text-white font-semibold">{application.eventRole || 'Attendee'}</div>
        </div>
        
        <div className="bg-black/30 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Experience Level</div>
          <div className="text-white font-semibold">{application.experienceLevel || 'Not specified'}</div>
        </div>
        
        <div className="bg-black/30 p-3 rounded-lg">
          <div className="text-xs text-gray-400">Join Source</div>
          <div className="text-white font-semibold">{application.joinedFrom || 'Direct'}</div>
        </div>
      </div>

      {/* Detailed Information (Expandable) */}
      {showDetails && (
        <div className="space-y-4 mb-6 p-4 bg-black/20 rounded-lg border border-white/10">
          
          {/* Application Message */}
          {application.applicationMessage && (
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">💬 Application Message</h4>
              <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                <p className="text-gray-200 italic leading-relaxed text-sm">
                  "{application.applicationMessage}"
                </p>
              </div>
            </div>
          )}

          {/* Skills & Interests */}
          {application.skills && (
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">🛠️ Skills & Technologies</h4>
              <div className="flex flex-wrap gap-2">
                {application.skills.split(',').map((skill, index) => (
                  <span key={index} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning Goals */}
          {application.learningGoals && (
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">🎯 Learning Goals</h4>
              <p className="text-gray-200 text-sm">{application.learningGoals}</p>
            </div>
          )}

          {/* Previous Experience */}
          {application.previousExperience && (
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">📈 Previous Experience</h4>
              <p className="text-gray-200 text-sm">{application.previousExperience}</p>
            </div>
          )}

          {/* Availability */}
          {application.availability && (
            <div>
              <h4 className="text-sm font-semibold text-cyan-300 mb-2">⏰ Availability</h4>
              <p className="text-gray-200 text-sm">{application.availability}</p>
            </div>
          )}

          {/* Admin Review Notes */}
          <div>
            <h4 className="text-sm font-semibold text-cyan-300 mb-2">📝 Review Notes (Internal)</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this application..."
              className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none text-sm"
              rows="3"
            />
          </div>
        </div>
      )}

      {/* Quick Review Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => onApprove(application.id, application)}
          disabled={approvingMember[application.id]}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          {approvingMember[application.id] ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Approving...</span>
            </>
          ) : (
            <>
              <span>✅</span>
              <span>Approve</span>
            </>
          )}
        </button>

        <button
          onClick={() => onRequestInterview && onRequestInterview(application)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          <span>📞</span>
          <span>Interview</span>
        </button>

        <button
          onClick={() => onReject(application.id, application)}
          disabled={rejectingMember[application.id]}
          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
          {rejectingMember[application.id] ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Rejecting...</span>
            </>
          ) : (
            <>
              <span>❌</span>
              <span>Reject</span>
            </>
          )}
        </button>
      </div>

      {/* Application Analytics */}
      <div className="border-t border-white/20 pt-4">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Application ID: {application.id.slice(-8)}</span>
          <span>Processing time: {Math.ceil((new Date() - application.appliedAt) / (1000 * 60))} minutes</span>
        </div>
      </div>
    </div>
  );
};

// 🔥 NEW: Application Statistics Component
const ApplicationStats = ({ applications, groupMembers }) => {
  const stats = {
    total: applications.length,
    today: applications.filter(app => {
      const today = new Date();
      const appDate = app.appliedAt;
      return appDate && appDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: applications.filter(app => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return app.appliedAt && app.appliedAt > weekAgo;
    }).length,
    avgResponseTime: '2.5 hours', // This could be calculated from historical data
    topRoles: applications.reduce((acc, app) => {
      const role = app.eventRole || 'Attendee';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {})
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30">
        <div className="text-2xl font-bold text-blue-300">{stats.total}</div>
        <div className="text-blue-200 text-sm">Total Pending</div>
      </div>
      
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
        <div className="text-2xl font-bold text-green-300">{stats.today}</div>
        <div className="text-green-200 text-sm">Applied Today</div>
      </div>
      
      <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30">
        <div className="text-2xl font-bold text-yellow-300">{stats.thisWeek}</div>
        <div className="text-yellow-200 text-sm">This Week</div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
        <div className="text-2xl font-bold text-purple-300">{groupMembers.length}</div>
        <div className="text-purple-200 text-sm">Active Members</div>
      </div>
    </div>
  );
};

// 🔥 NEW: Bulk Actions Component
const BulkActions = ({ selectedApplications, onBulkApprove, onBulkReject, onSelectAll, onClearSelection }) => {
  if (selectedApplications.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4 rounded-xl border border-indigo-500/30 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-white font-semibold">
            {selectedApplications.length} application{selectedApplications.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-white text-sm"
          >
            Clear selection
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onBulkApprove}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            ✅ Approve All
          </button>
          <button
            onClick={onBulkReject}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            ❌ Reject All
          </button>
        </div>
      </div>
    </div>
  );
};

// Main EventGroupDashboard Component
const EventGroupDashboard = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { eventGroupId } = useParams();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [eventGroup, setEventGroup] = useState(null);
  const [relatedEvent, setRelatedEvent] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  
  // 🔥 NEW: Enhanced application management state
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [applicationFilters, setApplicationFilters] = useState({
    urgency: 'all',
    role: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('newest');
  const [searchApplications, setSearchApplications] = useState('');
  
  // Existing state
  const [approvingMember, setApprovingMember] = useState({});
  const [rejectingMember, setRejectingMember] = useState({});
  const [emailNotificationsSent, setEmailNotificationsSent] = useState(new Set());

  // 🔥 CORRECTED: Robust admin checking function
  const checkEventCreatorStatus = async (eventData, userId, userEmail) => {
    if (!eventData || !userId) return false;
    
    console.log('🔍 Checking event creator status:', {
      currentUserId: userId,
      currentUserEmail: userEmail,
      eventCreatedBy: eventData.createdBy,
      eventCreatorId: eventData.creatorId,
      eventCreatorUid: eventData.creatorUid,
      eventCreatorEmail: eventData.creatorEmail,
      eventOrganizerEmail: eventData.organizerEmail,
      eventOrganizerId: eventData.organizerId
    });
    
    const isCreator = (
      eventData.createdBy === userId ||
      eventData.creatorId === userId ||
      eventData.creatorUid === userId ||
      eventData.creatorEmail === userEmail ||
      eventData.organizerEmail === userEmail ||
      eventData.organizerId === userId ||
      eventData.authorId === userId ||
      eventData.hostId === userId ||
      eventData.hostEmail === userEmail
    );
    
    console.log('✅ Event creator check result:', isCreator);
    return isCreator;
  };

  // Authentication Check
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: `/event-group/${eventGroupId}`, message: 'Please sign in to access event groups' }
      });
    }
  }, [currentUser, authLoading, navigate, eventGroupId]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fetch event group details with proper admin checking
  useEffect(() => {
    if (!currentUser || !eventGroupId) return;

    const fetchEventGroup = async () => {
      try {
        console.log('🚀 Fetching event group data...');
        const eventGroupData = await getEventGroup(eventGroupId);
        
        if (eventGroupData) {
          setEventGroup(eventGroupData);
          console.log('✅ Event group data fetched:', eventGroupData);
          
          if (eventGroupData.eventId) {
            console.log('🔍 Fetching related event data...');
            const eventDoc = await getDoc(doc(db, 'tech_events', eventGroupData.eventId));
            if (eventDoc.exists()) {
              const eventData = {
                id: eventDoc.id,
                ...eventDoc.data(),
                eventDate: eventDoc.data().eventDate?.toDate()
              };
              
              setRelatedEvent(eventData);
              console.log('✅ Related event data fetched:', eventData);
              
              const isCreator = await checkEventCreatorStatus(eventData, currentUser.uid, currentUser.email);
              setIsGroupAdmin(isCreator);
              
              console.log('🎯 Final admin status:', isCreator);
            } else {
              console.log('⚠️ Related event not found');
            }
          } else {
            console.log('⚠️ Event group has no related event ID');
          }
          
        } else {
          console.error('❌ Event group not found');
          navigate('/events');
        }
      } catch (error) {
        console.error('❌ Error fetching event group:', error);
        navigate('/events');
      } finally {
        setLoading(false);
      }
    };

    fetchEventGroup();
  }, [currentUser, eventGroupId, navigate]);

  // Fetch group members and applications
  useEffect(() => {
    if (!eventGroupId) return;

    const membersQuery = query(
      collection(db, 'event_group_members'),
      where('eventGroupId', '==', eventGroupId)
    );

    const unsubscribe = onSnapshot(membersQuery, (snapshot) => {
      const allMembers = snapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          joinedAt: data.joinedAt?.toDate(),
          appliedAt: data.appliedAt?.toDate()
        };
      });

      const activeMembers = allMembers
        .filter(member => member.status === 'active')
        .sort((a, b) => (b.joinedAt || new Date(0)) - (a.joinedAt || new Date(0)));
        
      const pending = allMembers
        .filter(member => member.status === 'pending')
        .sort((a, b) => (b.appliedAt || new Date(0)) - (a.appliedAt || new Date(0)));
      
      setGroupMembers(activeMembers);
      setPendingApplications(pending);
    }, (error) => {
      console.error('Error fetching group members:', error);
    });

    return unsubscribe;
  }, [eventGroupId]);

  // 🔥 NEW: Enhanced application filtering and sorting
  const getFilteredAndSortedApplications = () => {
    let filtered = pendingApplications.filter(app => {
      // Search filter
      if (searchApplications) {
        const searchLower = searchApplications.toLowerCase();
        const matchesSearch = (
          app.userName?.toLowerCase().includes(searchLower) ||
          app.userEmail?.toLowerCase().includes(searchLower) ||
          app.applicationMessage?.toLowerCase().includes(searchLower) ||
          app.eventRole?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Role filter
      if (applicationFilters.role !== 'all') {
        if ((app.eventRole || 'Attendee') !== applicationFilters.role) return false;
      }

      // Urgency filter
      if (applicationFilters.urgency !== 'all') {
        const hoursAgo = app.appliedAt ? (new Date() - app.appliedAt) / (1000 * 60 * 60) : 999;
        const urgency = hoursAgo < 2 ? 'urgent' : hoursAgo < 24 ? 'recent' : hoursAgo < 72 ? 'normal' : 'old';
        if (urgency !== applicationFilters.urgency) return false;
      }

      // Date range filter
      if (applicationFilters.dateRange !== 'all') {
        const now = new Date();
        const appDate = app.appliedAt;
        if (!appDate) return false;

        switch (applicationFilters.dateRange) {
          case 'today':
            if (appDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (appDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (appDate < monthAgo) return false;
            break;
        }
      }

      return true;
    });

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.appliedAt || new Date(0)) - (a.appliedAt || new Date(0));
        case 'oldest':
          return (a.appliedAt || new Date(0)) - (b.appliedAt || new Date(0));
        case 'name':
          return (a.userName || '').localeCompare(b.userName || '');
        case 'role':
          return (a.eventRole || 'Attendee').localeCompare(b.eventRole || 'Attendee');
        default:
          return 0;
      }
    });

    return filtered;
  };

  // 🔥 NEW: Enhanced notification system for admin
  const showBrowserNotification = (title, body, icon = '🔔') => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: body,
          icon: '/Images/512X512.png',
          badge: '/Images/512X512.png',
          tag: 'event-group-application',
          requireInteraction: true
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, {
              body: body,
              icon: '/Images/512X512.png',
              badge: '/Images/512X512.png',
              tag: 'event-group-application',
              requireInteraction: true
            });
          }
        });
      }
    }
  };

  const sendJoinRequestNotification = async (applicationData) => {
    console.log('📧 Attempting to send join request notification:', {
      applicantName: applicationData.userName,
      applicantEmail: applicationData.userEmail,
      adminEmail: currentUser.email,
      eventGroupId: eventGroupId
    });

    try {
      showBrowserNotification(
        '🔔 New Event Group Application',
        `${applicationData.userName} wants to join "${eventGroup?.eventTitle}". Click to review.`
      );

      await addDoc(collection(db, 'notifications'), {
        recipientEmail: currentUser.email,
        type: 'event_group_join_request',
        title: '🔔 New Event Group Join Request',
        message: `${applicationData.userName} (${applicationData.userEmail}) wants to join "${eventGroup?.eventTitle}". Please review their application.`,
        eventId: eventGroup?.eventId,
        eventGroupId: eventGroupId,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          applicantName: applicationData.userName,
          applicantEmail: applicationData.userEmail,
          applicantRole: applicationData.eventRole || 'Attendee',
          applicationMessage: applicationData.applicationMessage || '',
          eventGroupTitle: eventGroup?.eventTitle,
          appliedAt: applicationData.appliedAt
        }
      });

      console.log('✅ In-app notification created successfully');

      try {
        const response = await fetch('/api/notifications/send-event-group-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicantData: {
              userEmail: applicationData.userEmail,
              userName: applicationData.userName,
              eventRole: applicationData.eventRole || 'Attendee',
              appliedAt: applicationData.appliedAt,
              applicationMessage: applicationData.applicationMessage || ''
            },
            eventGroupData: {
              id: eventGroupId,
              eventTitle: eventGroup?.eventTitle || 'Event Group',
              description: eventGroup?.description || '',
              eventDate: eventGroup?.eventDate,
              location: eventGroup?.location || eventGroup?.venue || '',
              eventType: eventGroup?.eventType || 'Event',
              memberCount: groupMembers.length,
              maxMembers: eventGroup?.maxMembers || 'Unlimited'
            },
            adminData: {
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email
            }
          })
        });

        if (response.ok) {
          console.log('✅ Email notification sent successfully');
          showSuccessMessage(`📧 New join request from ${applicationData.userName}! Check your email and dashboard.`, { autoClose: 5000 });
        } else {
          console.log('⚠️ Email API not available, using in-app notifications only');
          showSuccessMessage(`🔔 New join request from ${applicationData.userName}! Check your dashboard.`, { autoClose: 5000 });
        }
      } catch (emailError) {
        console.log('⚠️ Email service unavailable, using in-app notifications:', emailError.message);
        showSuccessMessage(`🔔 New join request from ${applicationData.userName}! Check your dashboard.`, { autoClose: 5000 });
      }

      setEmailNotificationsSent(prev => new Set([...prev, applicationData.id]));
      
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      showBrowserNotification(
        '⚠️ New Application Alert',
        `${applicationData.userName} applied to join. Please check the applications tab.`
      );
      showWarningMessage(`New join request from ${applicationData.userName}. Please check the applications tab.`);
    }
  };

  // Monitor for new applications
  useEffect(() => {
    console.log('🔍 Monitoring applications:', {
      isGroupAdmin,
      hasEventGroup: !!eventGroup,
      pendingCount: pendingApplications.length,
      notificationsSent: emailNotificationsSent.size
    });

    if (!isGroupAdmin || !eventGroup) return;

    const newApplications = pendingApplications.filter(app => {
      const hasNotification = emailNotificationsSent.has(app.id);
      const isRecent = app.appliedAt && (new Date() - app.appliedAt) < 24 * 60 * 60 * 1000;
      
      console.log(`📋 Application ${app.id}:`, {
        userName: app.userName,
        hasNotification,
        isRecent,
        appliedAt: app.appliedAt,
        willNotify: !hasNotification && isRecent
      });
      
      return !hasNotification && isRecent;
    });

    console.log(`🎯 Found ${newApplications.length} new applications to notify about`);

    if (newApplications.length > 0) {
      newApplications.forEach(application => {
        console.log(`📤 Sending notification for: ${application.userName}`);
        sendJoinRequestNotification(application);
      });
    }

  }, [pendingApplications, isGroupAdmin, eventGroup, emailNotificationsSent, currentUser]);

  // 🔥 NEW: Enhanced member approval with custom message
  const approveMember = async (applicationId, memberData) => {
    setApprovingMember(prev => ({ ...prev, [applicationId]: true }));
    
    try {
      await updateDoc(doc(db, 'event_group_members', applicationId), {
        status: 'active',
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.email,
        joinedAt: serverTimestamp()
      });

      // Send welcome email
      try {
        const response = await fetch('/api/notifications/send-event-group-approval', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicantData: {
              userEmail: memberData.userEmail,
              userName: memberData.userName,
              eventRole: memberData.eventRole || 'Attendee',
              appliedAt: memberData.appliedAt
            },
            eventGroupData: {
              id: eventGroupId,
              eventTitle: eventGroup.eventTitle,
              description: eventGroup.description,
              eventDate: eventGroup.eventDate,
              location: eventGroup.location || eventGroup.venue,
              eventType: eventGroup.eventType,
              memberCount: groupMembers.length + 1,
              maxMembers: eventGroup.maxMembers,
              meetingUrl: eventGroup.meetingUrl
            },
            adminData: {
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email
            }
          })
        });
        
        if (!response.ok) {
          console.error('Welcome email failed to send');
        }
        
      } catch (emailError) {
        console.error('Member approved but welcome email failed:', emailError);
      }

      // Create in-app notification
      await addDoc(collection(db, 'notifications'), {
        recipientEmail: memberData.userEmail,
        type: 'event_group_approved',
        title: 'Welcome to the Event Group! 🎉',
        message: `Your request to join the event group for "${eventGroup.eventTitle}" has been approved. Welcome to the group!`,
        eventId: eventGroup.eventId,
        eventGroupId: eventGroupId,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          eventGroupTitle: eventGroup.eventTitle,
          eventGroupId: eventGroupId,
          memberRole: memberData.eventRole || 'Attendee'
        }
      });

      setPendingApplications(prev => prev.filter(app => app.id !== applicationId));
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
      
      toast.success(`🎉 ${memberData.userName} has been approved and will receive a welcome email!`);
      
    } catch (error) {
      console.error('Error approving member:', error);
      toast.error('Error approving member: ' + error.message);
    } finally {
      setApprovingMember(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  // 🔥 NEW: Enhanced member rejection with detailed feedback
  const rejectMember = async (applicationId, memberData) => {
    setRejectingMember(prev => ({ ...prev, [applicationId]: true }));
    
    try {
      const reason = prompt('Reason for rejection (optional):') || 'No specific reason provided';

      await updateDoc(doc(db, 'event_group_members', applicationId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser.email,
        rejectionReason: reason
      });

      // Send rejection email
      try {
        const response = await fetch('/api/notifications/send-event-group-rejection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicantData: {
              userEmail: memberData.userEmail,
              userName: memberData.userName,
              eventRole: memberData.eventRole || 'Attendee',
              appliedAt: memberData.appliedAt,
              applicationMessage: memberData.applicationMessage || ''
            },
            eventGroupData: {
              id: eventGroupId,
              eventTitle: eventGroup.eventTitle,
              description: eventGroup.description,
              eventDate: eventGroup.eventDate,
              location: eventGroup.location || eventGroup.venue,
              eventType: eventGroup.eventType,
              memberCount: groupMembers.length,
              maxMembers: eventGroup.maxMembers
            },
            adminData: {
              email: currentUser.email,
              name: currentUser.displayName || currentUser.email
            },
            rejectionReason: reason
          })
        });
        
        if (response.ok) {
          showSuccessMessage(`📧 ${memberData.userName} has been notified of the decision via email`);
        } else {
          showWarningMessage('Member rejected, but email notification failed to send');
        }
        
      } catch (emailError) {
        console.error('Member rejected but email notification failed:', emailError);
        showWarningMessage('Member rejected, but email notification failed to send');
      }

      // Create in-app notification
      await addDoc(collection(db, 'notifications'), {
        recipientEmail: memberData.userEmail,
        type: 'event_group_rejected',
        title: 'Event Group Application Update',
        message: `Your request to join "${eventGroup.eventTitle}" was not approved. Reason: ${reason}`,
        eventId: eventGroup.eventId,
        eventGroupId: eventGroupId,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          eventGroupTitle: eventGroup.eventTitle,
          eventGroupId: eventGroupId,
          rejectionReason: reason
        }
      });

      setPendingApplications(prev => prev.filter(app => app.id !== applicationId));
      setSelectedApplications(prev => prev.filter(id => id !== applicationId));
      
      toast.success(`Application rejected and ${memberData.userName} has been notified`);
      
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast.error('Error rejecting member: ' + error.message);
    } finally {
      setRejectingMember(prev => ({ ...prev, [applicationId]: false }));
    }
  };

  // 🔥 NEW: Bulk actions
  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) return;
    
    const confirmApprove = window.confirm(
      `Are you sure you want to approve ${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmApprove) return;

    for (const appId of selectedApplications) {
      const application = pendingApplications.find(app => app.id === appId);
      if (application) {
        await approveMember(appId, application);
      }
    }
    
    setSelectedApplications([]);
    toast.success(`Successfully approved ${selectedApplications.length} applications!`);
  };

  const handleBulkReject = async () => {
    if (selectedApplications.length === 0) return;
    
    const reason = prompt('Reason for bulk rejection:') || 'Bulk rejection - criteria not met';
    const confirmReject = window.confirm(
      `Are you sure you want to reject ${selectedApplications.length} application${selectedApplications.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmReject) return;

    for (const appId of selectedApplications) {
      const application = pendingApplications.find(app => app.id === appId);
      if (application) {
        await rejectMember(appId, application);
      }
    }
    
    setSelectedApplications([]);
    toast.success(`Successfully rejected ${selectedApplications.length} applications`);
  };

  // 🔥 NEW: Request interview functionality
  const handleRequestInterview = async (application) => {
    try {
      const interviewDate = prompt('Preferred interview date and time:');
      if (!interviewDate) return;

      // Create interview request notification
      await addDoc(collection(db, 'notifications'), {
        recipientEmail: application.userEmail,
        type: 'interview_request',
        title: 'Interview Request for Event Group',
        message: `The organizer of "${eventGroup.eventTitle}" would like to schedule an interview. Proposed time: ${interviewDate}`,
        eventId: eventGroup.eventId,
        eventGroupId: eventGroupId,
        createdAt: serverTimestamp(),
        read: false,
        data: {
          eventGroupTitle: eventGroup.eventTitle,
          interviewDate: interviewDate,
          organizerEmail: currentUser.email
        }
      });

      toast.success(`Interview request sent to ${application.userName}`);
    } catch (error) {
      console.error('Error sending interview request:', error);
      toast.error('Failed to send interview request');
    }
  };

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
          <p className="text-white text-lg">Loading event group...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const filteredApplications = getFilteredAndSortedApplications();

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
            
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-10">
              <Link to="/events" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Events
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>

              <span className="text-cyan-400 font-semibold text-sm lg:text-base px-3 py-1 bg-cyan-400/10 rounded-full border border-cyan-400/20"
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                🎪 Event Group
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
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          
          {/* Event Group Header */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl">
              
              <div className="mb-6">
                <nav className="text-sm text-gray-400">
                  <Link to="/events" className="hover:text-lime-400 transition-colors">Events</Link>
                  <span className="mx-2">›</span>
                  <span className="text-cyan-400">Event Group</span>
                </nav>
              </div>

              {eventGroup && (
                <>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-3xl">🎪</span>
                        <div>
                          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2"
                              style={{
                                textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                            {eventGroup.eventTitle}
                          </h1>
                          <p className="text-cyan-300 font-semibold">Event Group</p>
                        </div>
                      </div>
                      
                      <p className="text-gray-200 text-lg leading-relaxed">
                        {eventGroup.description}
                      </p>
                    </div>

                    {isGroupAdmin && (
                      <div className="mt-4 lg:mt-0 lg:ml-6">
                        <span className="bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-full text-sm font-semibold border border-cyan-500/30">
                          👑 Event Creator (Admin)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Group Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center">
                      <div className="text-xl sm:text-2xl font-black text-blue-400">{groupMembers.length}</div>
                      <div className="text-gray-300 text-xs sm:text-sm">Members</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center">
                      <div className="text-xl sm:text-2xl font-black text-yellow-400">{pendingApplications.length}</div>
                      <div className="text-gray-300 text-xs sm:text-sm">Pending</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center">
                      <div className="text-xl sm:text-2xl font-black text-green-400">0</div>
                      <div className="text-gray-300 text-xs sm:text-sm">Posts</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 sm:p-4 text-center">
                      <div className="text-lg sm:text-2xl font-black text-purple-400">
                        {relatedEvent ? new Date(relatedEvent.eventDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="text-gray-300 text-xs sm:text-sm">Event Date</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Enhanced Admin Notification Panel */}
          {isGroupAdmin && (
            <section className="mb-8">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                
                {/* Enhanced Applications Alert */}
                {pendingApplications.length > 0 && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 rounded-xl animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <span className="text-3xl">🔔</span>
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce">
                            {pendingApplications.length}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-yellow-300 font-bold text-xl">🚨 Application Management Center</h4>
                          <p className="text-yellow-200">
                            {pendingApplications.length} {pendingApplications.length === 1 ? 'application needs' : 'applications need'} your review
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('applications')}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
                      >
                        Review Applications →
                      </button>
                    </div>
                    
                    {/* Application Summary */}
                    <ApplicationStats applications={pendingApplications} groupMembers={groupMembers} />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">👑 Event Creator Dashboard</h3>
                    <p className="text-gray-300 text-sm">
                      Enhanced application management system with filtering, bulk actions, and detailed reviews
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Tab Navigation */}
          <section className="mb-8">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-2 border border-white/20">
              <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide pb-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === 'overview' 
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  📊 Overview
                </button>
                
                <button
                  onClick={() => setActiveTab('members')}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm ${
                    activeTab === 'members' 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  👥 Members ({groupMembers.length})
                </button>
                
                {/* Enhanced Applications Tab */}
                {isGroupAdmin && (
                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 whitespace-nowrap text-xs sm:text-sm relative ${
                      activeTab === 'applications' 
                        ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    } ${pendingApplications.length > 0 ? 'animate-pulse ring-2 ring-yellow-500/50' : ''}`}
                  >
                    📝 Applications
                    {pendingApplications.length > 0 && (
                      <>
                        <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] inline-flex items-center justify-center animate-bounce">
                          {pendingApplications.length}
                        </span>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Tab Content */}
          <section>
            
            {/* Enhanced Applications Tab */}
            {activeTab === 'applications' && isGroupAdmin && (
              <div className="space-y-6">
                
                {/* Application Management Header */}
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">🎯 Application Management Center</h3>
                  
                  {/* Search and Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <input
                      type="text"
                      placeholder="Search applications..."
                      value={searchApplications}
                      onChange={(e) => setSearchApplications(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                    />
                    
                    <select
                      value={applicationFilters.urgency}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, urgency: e.target.value }))}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="all">All Urgency</option>
                      <option value="urgent">🔥 Urgent (2h)</option>
                      <option value="recent">⚡ Recent (24h)</option>
                      <option value="normal">📋 Normal (3d)</option>
                      <option value="old">⏰ Old (3d+)</option>
                    </select>
                    
                    <select
                      value={applicationFilters.role}
                      onChange={(e) => setApplicationFilters(prev => ({ ...prev, role: e.target.value }))}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="Attendee">Attendee</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Speaker">Speaker</option>
                      <option value="Organizer">Organizer</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="role">By Role</option>
                    </select>
                  </div>

                  {/* Results Summary */}
                  <div className="flex items-center justify-between text-gray-300 text-sm">
                    <span>
                      Showing {filteredApplications.length} of {pendingApplications.length} applications
                    </span>
                    <button
                      onClick={() => {
                        setApplicationFilters({ urgency: 'all', role: 'all', dateRange: 'all' });
                        setSearchApplications('');
                        setSortBy('newest');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                {/* Bulk Actions */}
                <BulkActions 
                  selectedApplications={selectedApplications}
                  onBulkApprove={handleBulkApprove}
                  onBulkReject={handleBulkReject}
                  onSelectAll={() => setSelectedApplications(filteredApplications.map(app => app.id))}
                  onClearSelection={() => setSelectedApplications([])}
                />

                {/* Applications List */}
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📝</div>
                    <h4 className="text-lg font-bold text-white mb-2">
                      {pendingApplications.length === 0 ? 'No pending applications' : 'No applications match your filters'}
                    </h4>
                    <p className="text-gray-300">
                      {pendingApplications.length === 0 
                        ? 'Applications will appear here when people request to join.'
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {filteredApplications.map((application) => (
                      <ApplicationReviewCard
                        key={application.id}
                        application={application}
                        onApprove={approveMember}
                        onReject={rejectMember}
                        onRequestInterview={handleRequestInterview}
                        approvingMember={approvingMember}
                        rejectingMember={rejectingMember}
                        eventGroup={eventGroup}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other tabs remain the same... */}
            
          </section>
        </div>
      </main>
    </div>
  );
};

export default EventGroupDashboard;
