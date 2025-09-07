// src/Pages/user/dashboard.jsx - Enhanced Responsive Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePWA } from '../../hooks/usePWA';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// PWA Debug Component import
import PWADebugger from '../../components/PWADebugger';

// ProfileStats Component for clickable followers/following
const ProfileStats = ({ userEmail, followerCount, followingCount, className = "", size = "normal" }) => {
  const navigate = useNavigate();
  
  const sizeClasses = {
    small: {
      container: "space-x-2",
      button: "p-2 rounded-lg",
      count: "text-lg font-bold",
      label: "text-xs"
    },
    normal: {
      container: "space-x-6",
      button: "p-3 rounded-lg",
      count: "text-2xl font-bold",
      label: "text-sm"
    },
    large: {
      container: "space-x-8",
      button: "p-4 rounded-xl",
      count: "text-3xl font-bold",
      label: "text-base"
    }
  };
  
  const styles = sizeClasses[size];
  
  return (
    <div className={`flex items-center ${styles.container} ${className}`}>
      {/* Clickable Followers Count */}
      <button 
        onClick={() => navigate(`/profile/${encodeURIComponent(userEmail)}/followers`)}
        className={`text-center hover:bg-white/10 ${styles.button} transition-colors group min-h-[44px]`}
      >
        <div className={`${styles.count} text-cyan-400 group-hover:text-cyan-300`}>
          {followerCount || 0}
        </div>
        <div className={`${styles.label} text-gray-400 group-hover:text-white`}>
          Followers
        </div>
      </button>
      
      {/* Clickable Following Count */}
      <button 
        onClick={() => navigate(`/profile/${encodeURIComponent(userEmail)}/following`)}
        className={`text-center hover:bg-white/10 ${styles.button} transition-colors group min-h-[44px]`}
      >
        <div className={`${styles.count} text-teal-400 group-hover:text-teal-300`}>
          {followingCount || 0}
        </div>
        <div className={`${styles.label} text-gray-400 group-hover:text-white`}>
          Following
        </div>
      </button>
    </div>
  );
};

const UserDashboard = ({ currentUser, onNavigate }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  
  // PWA Install functionality
  const { isInstallable, isInstalled, installing, installApp } = usePWA();
  
  // PWA Debug state
  const [showPWADebug, setShowPWADebug] = useState(process.env.NODE_ENV === 'development');
  
  const [userProfile, setUserProfile] = useState({
    name: 'Loading...',
    email: '',
    certificatesEarned: 0,
    badgesEarned: 0,
    projectsCompleted: 0,
    ongoingProjects: 0,
    companiesOwned: 0,
    eventsHosted: 0,
    eventsAttended: 0,
    followersCount: 0,
    followingCount: 0,
    photoURL: null
  });
  const [recentBadges, setRecentBadges] = useState([]);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // PWA Debug keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowPWADebug(prev => !prev);
        console.log('PWA Debug toggled:', !showPWADebug);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPWADebug]);

  // Enhanced mobile sidebar handling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        const menuButton = document.getElementById('menu-button');
        if (sidebar && !sidebar.contains(event.target) && !menuButton?.contains(event.target)) {
          setSidebarOpen(false);
        }
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);

  // PWA Install Button Component - Enhanced for mobile
  const PWAInstallButton = ({ className = "", mobile = false }) => {
    console.log('PWA Button Render:', { isInstallable, isInstalled, installing });
    
    if (isInstalled || !isInstallable) return null;

    return (
      <button
        onClick={installApp}
        disabled={installing}
        className={`bg-gradient-to-r from-lime-500 to-green-600 text-white font-semibold disabled:opacity-50 flex items-center justify-center shadow-lg transition-all duration-200 hover:from-lime-600 hover:to-green-700 active:scale-95 ${className} ${
          mobile 
            ? 'px-4 py-3 rounded-lg text-sm w-full min-h-[48px]' 
            : 'px-3 py-2 rounded-lg text-xs min-h-[40px]'
        }`}
      >
        {installing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {mobile ? 'Installing App...' : 'Installing...'}
          </>
        ) : (
          <>
            <span className="mr-2 text-base">📱</span>
            {mobile ? 'Install App' : 'Install'}
          </>
        )}
      </button>
    );
  };

  // Enhanced sidebar navigation items - REMOVED 'Hire Talent'
  const sidebarItems = [
    { id: 'home', label: 'Home', icon: '🏠', isNavigation: true, path: '/community' },
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' },
    { id: 'learning', label: 'My Career', icon: '📚' },
    { id: 'projects', label: 'Projects', icon: '💻' },
    { id: 'events', label: 'Events', icon: '📅' },
  ];

  // Badge categories mapping for display
  const badgeCategories = {
    'mentorship': { name: 'TechMO', icon: '🏆', color: 'text-yellow-400' },
    'quality-assurance': { name: 'TechQA', icon: '🔍', color: 'text-blue-400' },
    'development': { name: 'TechDev', icon: '💻', color: 'text-green-400' },
    'leadership': { name: 'TechLeads', icon: '👑', color: 'text-purple-400' },
    'design': { name: 'TechArchs', icon: '🎨', color: 'text-orange-400' },
    'security': { name: 'TechGuard', icon: '🛡️', color: 'text-red-400' }
  };

  // Enhanced dashboard cards with better responsive layouts - REMOVED 'hiring' section
  const dashboardCards = {
    achievements: [
      {
        title: 'My Achievements',
        description: 'View all your earned badges and certificates',
        path: '/my-badges',
        stats: `${userProfile.badgesEarned} Badges`,
        icon: '🏆',
        gradient: 'from-amber-500 to-orange-500',
        bgGradient: 'from-amber-500/20 to-orange-500/20',
        borderGradient: 'from-amber-500/40 to-orange-500/40'
      },
      {
        title: 'TechTalent Badges',
        description: 'Discover all available tech badges and learn how to earn them',
        path: '/tech-badges',
        stats: '6 Categories',
        icon: '📚',
        gradient: 'from-cyan-500 to-blue-500',
        bgGradient: 'from-cyan-500/20 to-blue-500/20',
        borderGradient: 'from-cyan-500/40 to-blue-500/40'
      }
    ],
    learning: [
      {
        title: 'Learning Resources Hub',
        description: 'Access 200+ free courses, tutorials, and certifications for every tech career',
        path: '/career/resources',
        stats: '12+ Career Tracks',
        icon: '🚀',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-500/20 to-pink-500/20',
        borderGradient: 'from-purple-500/40 to-pink-500/40'
      },
      {
        title: 'AI Career Recommendations',
        description: 'Get personalized career paths and learning plans powered by AI',
        path: '/career/dashboard',
        stats: 'AI Powered',
        icon: '🤖',
        gradient: 'from-indigo-500 to-purple-500',
        bgGradient: 'from-indigo-500/20 to-purple-500/20',
        borderGradient: 'from-indigo-500/40 to-purple-500/40'
      }
    ],
    projects: [
      {
        title: 'Submit Project',
        description: 'Share your work and build your portfolio',
        path: '/submit-project',
        stats: 'Create New',
        icon: '✨',
        gradient: 'from-rose-500 to-purple-500',
        bgGradient: 'from-rose-500/20 to-purple-500/20',
        borderGradient: 'from-rose-500/40 to-purple-500/40'
      },
      {
        title: 'Join Projects',
        description: 'Discover and apply to exciting opportunities',
        path: '/projects',
        stats: 'Browse All',
        icon: '🔍',
        gradient: 'from-indigo-500 to-cyan-500',
        bgGradient: 'from-indigo-500/20 to-cyan-500/20',
        borderGradient: 'from-indigo-500/40 to-cyan-500/40'
      },
      {
        title: 'Ongoing Projects',
        description: 'Manage your active project groups and track progress',
        path: '/my-groups',
        stats: `${userProfile.ongoingProjects} Active`,
        icon: '🚀',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-500/20 to-teal-500/20',
        borderGradient: 'from-emerald-500/40 to-teal-500/40'
      }
    ],
    events: [
      {
        title: 'Browse Events',
        description: 'Discover workshops, webinars, and tech events happening now',
        path: '/events',
        stats: 'Explore All',
        icon: '🔍',
        gradient: 'from-blue-500 to-indigo-500',
        bgGradient: 'from-blue-500/20 to-indigo-500/20',
        borderGradient: 'from-blue-500/40 to-indigo-500/40'
      },
      {
        title: 'Host Event',
        description: 'Create and manage your own workshops, webinars, or tech meetups',
        path: '/submit-event',
        stats: 'Create Now',
        icon: '🎯',
        gradient: 'from-purple-500 to-pink-500',
        bgGradient: 'from-purple-500/20 to-pink-500/20',
        borderGradient: 'from-purple-500/40 to-pink-500/40'
      },
      {
        title: 'My Events',
        description: 'Manage events you\'re hosting and track your attendance',
        path: '/events',
        stats: `${userProfile.eventsHosted} Hosted`,
        icon: '📋',
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-500/20 to-teal-500/20',
        borderGradient: 'from-emerald-500/40 to-teal-500/40'
      }
    ],
    companies: [
      {
        title: 'Browse Companies',
        description: 'Explore all companies and discover opportunities',
        path: '/companies',
        stats: 'Explore All',
        icon: '🏢',
        gradient: 'from-blue-500 to-purple-500',
        bgGradient: 'from-blue-500/20 to-purple-500/20',
        borderGradient: 'from-blue-500/40 to-purple-500/40'
      },
      {
        title: 'Create Company',
        description: 'Start your own company and build your team',
        path: '/companies/create',
        stats: 'Start Now',
        icon: '🏗️',
        gradient: 'from-green-500 to-teal-500',
        bgGradient: 'from-green-500/20 to-teal-500/20',
        borderGradient: 'from-green-500/40 to-teal-500/40'
      },
      {
        title: 'My Companies',
        description: 'Manage your owned companies and team members',
        path: '/my-companies',
        stats: `${userProfile.companiesOwned} Owned`,
        icon: '🏛️',
        gradient: 'from-orange-500 to-pink-500',
        bgGradient: 'from-orange-500/20 to-pink-500/20',
        borderGradient: 'from-orange-500/40 to-pink-500/40'
      }
    ]
  };

  // Fetch followers and following data
  const fetchFollowersData = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          followersCount: userData.followerCount || 0,
          followingCount: userData.followingCount || 0
        };
      }
      return { followersCount: 0, followingCount: 0 };
    } catch (error) {
      console.error('Error fetching followers data:', error);
      return { followersCount: 0, followingCount: 0 };
    }
  };

  // Fetch user data from Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Fetch followers/following data
        const followData = await fetchFollowersData(currentUser.uid);
        
        // Fetch user badges
        const badgesQuery = query(
          collection(db, 'member_badges'),
          where('memberEmail', '==', currentUser.email),
          orderBy('awardedAt', 'desc'),
          limit(3)
        );

        const badgesUnsubscribe = onSnapshot(badgesQuery, (snapshot) => {
          const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRecentBadges(badges);
        });

        // Fetch user certificates
        const certificatesQuery = query(
          collection(db, 'certificates'),
          where('recipientEmail', '==', currentUser.email),
          orderBy('generatedAt', 'desc'),
          limit(2)
        );

        const certificatesUnsubscribe = onSnapshot(certificatesQuery, (snapshot) => {
          const certificates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRecentCertificates(certificates);
        });

        // Fetch user events (hosted events)
        const eventsQuery = query(
          collection(db, 'events'),
          where('hostEmail', '==', currentUser.email),
          orderBy('createdAt', 'desc'),
          limit(3)
        );

        const eventsUnsubscribe = onSnapshot(eventsQuery, (snapshot) => {
          const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setRecentEvents(events);
          
          setUserProfile(prev => ({
            ...prev,
            eventsHosted: snapshot.docs.length
          }));
        });

        // Get events attended count
        const eventAttendeesQuery = query(
          collection(db, 'event_attendees'),
          where('userEmail', '==', currentUser.email)
        );

        const eventAttendeesUnsubscribe = onSnapshot(eventAttendeesQuery, (snapshot) => {
          setUserProfile(prev => ({
            ...prev,
            eventsAttended: snapshot.docs.length
          }));
        });

        // Get total counts for badges
        const allBadgesQuery = query(
          collection(db, 'member_badges'),
          where('memberEmail', '==', currentUser.email)
        );

        const allBadgesUnsubscribe = onSnapshot(allBadgesQuery, (snapshot) => {
          const totalBadges = snapshot.docs.length;
          const completedProjects = new Set(snapshot.docs.map(doc => doc.data().groupId)).size;
          
          setUserProfile(prev => ({
            ...prev,
            badgesEarned: totalBadges,
            projectsCompleted: completedProjects
          }));
        });

        // Get total certificates
        const allCertificatesQuery = query(
          collection(db, 'certificates'),
          where('recipientEmail', '==', currentUser.email)
        );

        const allCertificatesUnsubscribe = onSnapshot(allCertificatesQuery, (snapshot) => {
          setUserProfile(prev => ({
            ...prev,
            certificatesEarned: snapshot.docs.length
          }));
        });

        // Get ongoing projects count
        const groupMembersQuery = query(
          collection(db, 'group_members'),
          where('userEmail', '==', currentUser.email),
          where('status', '==', 'active')
        );

        const groupMembersUnsubscribe = onSnapshot(groupMembersQuery, (snapshot) => {
          setUserProfile(prev => ({
            ...prev,
            ongoingProjects: snapshot.docs.length
          }));
        });

        // Get user's companies count
        const userCompaniesQuery = query(
          collection(db, 'companies'),
          where('ownerId', '==', currentUser.uid)
        );

        const userCompaniesUnsubscribe = onSnapshot(userCompaniesQuery, (snapshot) => {
          setUserProfile(prev => ({
            ...prev,
            companiesOwned: snapshot.docs.length
          }));
        });

        // Real-time listener for followers/following changes
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userUnsubscribe = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setUserProfile(prev => ({
              ...prev,
              followersCount: userData.followerCount || 0,
              followingCount: userData.followingCount || 0
            }));
          }
        });
        
        setUserProfile(prev => ({
          ...prev,
          name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || '/Images/512X512.png',
          followersCount: followData.followersCount,
          followingCount: followData.followingCount
        }));
        
        setLoading(false);

        return () => {
          badgesUnsubscribe();
          certificatesUnsubscribe();
          eventsUnsubscribe();
          eventAttendeesUnsubscribe();
          allBadgesUnsubscribe();
          allCertificatesUnsubscribe();
          groupMembersUnsubscribe();
          userCompaniesUnsubscribe();
          userUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  const handleCardClick = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  // Handle sidebar item clicks
  const handleSidebarItemClick = (item) => {
    if (item.isNavigation) {
      if (onNavigate) {
        onNavigate(item.path);
      } else {
        navigate(item.path);
      }
    } else {
      setActiveSection(item.id);
    }
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Welcome Section - Enhanced for mobile */}
            <div className="mb-4 md:mb-6 lg:mb-8 text-center px-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 md:mb-3 leading-tight"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Welcome back, {userProfile.name.split(' ')[0]}!
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Here's what's happening with your account today.
              </p>
            </div>

            {/* Enhanced Stats Overview Grid - Better mobile layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-4 lg:gap-6">
              {/* Badges Earned */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">🏆</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-yellow-400" 
                          style={{textShadow: '0 0 15px rgba(234, 179, 8, 0.8)'}}>{userProfile.badgesEarned}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-yellow-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Badges
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Certificates */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">📜</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-purple-400" 
                          style={{textShadow: '0 0 15px rgba(168, 85, 247, 0.8)'}}>{userProfile.certificatesEarned}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-purple-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Certificates
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Projects Completed */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">🎯</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-green-400" 
                          style={{textShadow: '0 0 15px rgba(34, 197, 94, 0.8)'}}>{userProfile.projectsCompleted}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-green-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Completed
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Ongoing Projects */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">🚀</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-blue-400" 
                          style={{textShadow: '0 0 15px rgba(59, 130, 246, 0.8)'}}>{userProfile.ongoingProjects}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-blue-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Ongoing
                    </h3>
                  </div>
                </div>
              </div>

              {/* Followers Count - Clickable */}
              <button
                onClick={() => navigate(`/profile/${encodeURIComponent(userProfile.email)}/followers`)}
                className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl hover:scale-105 hover:border-cyan-400/50 transition-all duration-200 active:scale-95"
              >
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">👥</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-cyan-400" 
                          style={{textShadow: '0 0 15px rgba(6, 182, 212, 0.8)'}}>{userProfile.followersCount}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-cyan-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Followers
                    </h3>
                  </div>
                </div>
              </button>

              {/* Following Count */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">🔗</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-teal-400" 
                          style={{textShadow: '0 0 15px rgba(20, 184, 166, 0.8)'}}>{userProfile.followingCount}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-teal-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Following
                    </h3>
                  </div>
                </div>
              </div>

              {/* Events Hosted */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">📅</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-pink-400" 
                          style={{textShadow: '0 0 15px rgba(236, 72, 153, 0.8)'}}>{userProfile.eventsHosted}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-pink-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Events
                    </h3>
                  </div>
                </div>
              </div>
              
              {/* Companies Owned */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-3 md:p-4 lg:p-6 border border-white/20 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-2 md:space-y-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <span className="text-lg md:text-xl lg:text-2xl">🏢</span>
                  </div>
                  <div>
                    <span className="block text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-indigo-400" 
                          style={{textShadow: '0 0 15px rgba(99, 102, 241, 0.8)'}}>{userProfile.companiesOwned}</span>
                    <h3 className="text-xs md:text-sm lg:text-base font-bold text-indigo-300 uppercase tracking-wider leading-tight" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Companies
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA Install Section - Enhanced mobile layout */}
            {isInstallable && !isInstalled && (
              <div className="bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-blue-900/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <img src="/Images/512X512.png" alt="App" className="w-12 h-12 md:w-16 md:h-16 rounded-xl shadow-md mx-auto sm:mx-0 ring-4 ring-purple-400/50" />
                      <div className="text-center sm:text-left">
                        <h3 className="text-base md:text-lg lg:text-xl font-black text-white mb-2" 
                            style={{textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)'}}>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-blue-300 to-indigo-300">
                            Install Favored Online App
                          </span>
                        </h3>
                        <p className="text-sm md:text-base text-gray-300 mb-3" 
                           style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                          Get instant access, push notifications, and offline capabilities
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-start items-center text-sm text-purple-200 gap-4">
                          <span className="flex items-center"><span className="text-purple-400 mr-1">🚀</span> Faster loading</span>
                          <span className="flex items-center"><span className="text-blue-400 mr-1">📱</span> Native experience</span>
                          <span className="flex items-center"><span className="text-indigo-400 mr-1">🔔</span> Push notifications</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <PWAInstallButton className="w-full sm:w-auto" mobile={true} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Network and Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {/* TechTalent Badges Info */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                      style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                    <span className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <span className="text-base md:text-lg text-white">🏆</span>
                    </span>
                    TechTalent Badges
                  </h3>
                  <button 
                    onClick={() => handleCardClick('/tech-badges')}
                    className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                  >
                    Learn More →
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-gray-200 text-sm leading-relaxed">
                    Earn professional badges by completing collaborative projects. Each badge validates your expertise in specific tech areas.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
                      <div className="text-yellow-400 text-lg mb-1">🏆</div>
                      <div className="text-white text-xs font-semibold">TechMO</div>
                      <div className="text-gray-400 text-xs">Mentorship</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                      <div className="text-blue-400 text-lg mb-1">🔍</div>
                      <div className="text-white text-xs font-semibold">TechQA</div>
                      <div className="text-gray-400 text-xs">Quality Assurance</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                      <div className="text-green-400 text-lg mb-1">💻</div>
                      <div className="text-white text-xs font-semibold">TechDev</div>
                      <div className="text-gray-400 text-xs">Development</div>
                    </div>
                    <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                      <div className="text-purple-400 text-lg mb-1">👑</div>
                      <div className="text-white text-xs font-semibold">TechLeads</div>
                      <div className="text-gray-400 text-xs">Leadership</div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-3 border-t border-white/10">
                    <p className="text-gray-400 text-xs mb-3">
                      6 badge categories • 4 levels each • Project-based validation
                    </p>
                    <button
                      onClick={() => handleCardClick('/tech-badges')}
                      className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                    >
                      Discover All Badges →
                    </button>
                  </div>
                </div>
              </div>

              {/* Network Stats */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                      style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                    <span className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                      <span className="text-base md:text-lg text-white">🌐</span>
                    </span>
                    Your Network
                  </h3>
                  <button 
                    onClick={() => handleCardClick('/members')}
                    className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                  >
                    Explore →
                  </button>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => navigate(`/profile/${encodeURIComponent(userProfile.email)}/followers`)}
                    className="w-full flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white">
                        👥
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white text-sm md:text-base">Followers</p>
                        <p className="text-cyan-400 text-xs md:text-sm">People following you</p>
                      </div>
                    </div>
                    <div className="text-cyan-400 font-bold text-lg md:text-xl">
                      {userProfile.followersCount}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate(`/profile/${encodeURIComponent(userProfile.email)}/following`)}
                    className="w-full flex items-center justify-between p-4 bg-teal-500/10 rounded-xl border border-teal-500/30 hover:bg-teal-500/20 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center text-white">
                        🔗
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white text-sm md:text-base">Following</p>
                        <p className="text-teal-400 text-xs md:text-sm">People you follow</p>
                      </div>
                    </div>
                    <div className="text-teal-400 font-bold text-lg md:text-xl">
                      {userProfile.followingCount}
                    </div>
                  </button>
                  
                  <div className="text-center pt-3 border-t border-white/10">
                    <p className="text-gray-400 text-sm">
                      Connect with fellow developers and build your professional network
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Badges */}
              {recentBadges.length > 0 && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                        <span className="text-base md:text-lg text-white">🏆</span>
                      </span>
                      Recent Badges
                    </h3>
                    <button 
                      onClick={() => handleCardClick('/my-badges')}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {recentBadges.map((badge) => {
                      const categoryInfo = badgeCategories[badge.badgeCategory];
                      return (
                        <div key={badge.id} className="flex items-center p-3 md:p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mr-3 md:mr-4 flex-shrink-0 ${categoryInfo?.color || 'text-gray-400'}`}>
                            <span className="text-base md:text-lg">{categoryInfo?.icon || '🏆'}</span>
                          </div>
                          <div className="flex-grow min-w-0">
                            <div className="font-semibold text-white text-sm md:text-base truncate" 
                                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              {categoryInfo?.name || 'Badge'} - {badge.badgeLevel?.charAt(0).toUpperCase() + badge.badgeLevel?.slice(1)}
                            </div>
                            <div className="text-gray-400 text-xs md:text-sm truncate">{badge.projectTitle}</div>
                          </div>
                          <div className="text-gray-500 text-xs flex-shrink-0 ml-2 hidden sm:block">
                            {badge.awardedAt?.toDate?.()?.toLocaleDateString() || 'Recent'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Events or Growth Tips */}
              {recentEvents.length > 0 ? (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                        <span className="text-base md:text-lg text-white">📅</span>
                      </span>
                      My Events
                    </h3>
                    <button 
                      onClick={() => handleCardClick('/events')}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {recentEvents.map((event) => (
                      <div key={event.id} className="flex items-center p-3 md:p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mr-3 md:mr-4 flex-shrink-0 text-white">
                          <span className="text-base md:text-lg">
                            {event.eventType === 'workshop' ? '🛠️' : 
                             event.eventType === 'webinar' ? '🎥' : 
                             event.eventType === 'networking' ? '🤝' : '📅'}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="font-semibold text-white text-sm md:text-base truncate" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            {event.title}
                          </div>
                          <div className="text-gray-400 text-xs md:text-sm truncate capitalize">{event.eventType || 'Event'}</div>
                        </div>
                        <div className="text-gray-500 text-xs flex-shrink-0 ml-2 hidden sm:block">
                          {event.eventDate?.toDate?.()?.toLocaleDateString() || 'Upcoming'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                        <span className="text-base md:text-lg text-white">💡</span>
                      </span>
                      Growth Tips
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                      <h4 className="font-semibold text-emerald-300 text-sm md:text-base mb-2">Build Your Network</h4>
                      <p className="text-emerald-200/80 text-xs md:text-sm">Connect with other developers in our member directory to grow your professional network.</p>
                    </div>
                    
                    <div className="p-4 bg-teal-500/10 rounded-xl border border-teal-500/30">
                      <h4 className="font-semibold text-teal-300 text-sm md:text-base mb-2">Follow & Connect</h4>
                      <p className="text-teal-200/80 text-xs md:text-sm">Follow talented members and stay updated with their projects and achievements.</p>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleCardClick('/members')}
                        className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                      >
                        Explore Members →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions - Enhanced mobile layout */}
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
              <h3 className="text-base md:text-lg lg:text-xl font-black text-white mb-4 md:mb-6" 
                  style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 xs:gap-3 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
                <button 
                  onClick={() => handleCardClick('/submit-project')}
                  className="p-2 xs:p-3 sm:p-3 md:p-4 lg:p-5 text-center bg-white/5 rounded-lg xs:rounded-xl sm:rounded-xl cursor-pointer min-h-[70px] xs:min-h-[80px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-95 touch-manipulation"
                >
                  <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-2 sm:mb-2 md:mb-3 shadow-lg flex-shrink-0">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-white">✨</span>
                  </div>
                  <div className="text-xs xs:text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-white break-words px-1" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Submit Project
                  </div>
                </button>
                <button 
                  onClick={() => handleCardClick('/projects')}
                  className="p-2 xs:p-3 sm:p-3 md:p-4 lg:p-5 text-center bg-white/5 rounded-lg xs:rounded-xl sm:rounded-xl cursor-pointer min-h-[70px] xs:min-h-[80px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-95 touch-manipulation"
                >
                  <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-2 sm:mb-2 md:mb-3 shadow-lg flex-shrink-0">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-white">🔍</span>
                  </div>
                  <div className="text-xs xs:text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-white break-words px-1" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Browse Projects
                  </div>
                </button>
                <button 
                  onClick={() => handleCardClick('/career/resources')}
                  className="p-2 xs:p-3 sm:p-3 md:p-4 lg:p-5 text-center bg-white/5 rounded-lg xs:rounded-xl sm:rounded-xl cursor-pointer min-h-[70px] xs:min-h-[80px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-95 touch-manipulation"
                >
                  <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-2 sm:mb-2 md:mb-3 shadow-lg flex-shrink-0">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-white">📚</span>
                  </div>
                  <div className="text-xs xs:text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-white break-words px-1" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Learning Hub
                  </div>
                </button>
                <button 
                  onClick={() => handleCardClick('/events')}
                  className="p-2 xs:p-3 sm:p-3 md:p-4 lg:p-5 text-center bg-white/5 rounded-lg xs:rounded-xl sm:rounded-xl cursor-pointer min-h-[70px] xs:min-h-[80px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-95 touch-manipulation"
                >
                  <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-2 sm:mb-2 md:mb-3 shadow-lg flex-shrink-0">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-white">📅</span>
                  </div>
                  <div className="text-xs xs:text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-white break-words px-1" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Events
                  </div>
                </button>
                <button 
                  onClick={() => handleCardClick('/companies')}
                  className="p-2 xs:p-3 sm:p-3 md:p-4 lg:p-5 text-center bg-white/5 rounded-lg xs:rounded-xl sm:rounded-xl cursor-pointer min-h-[70px] xs:min-h-[80px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] xl:min-h-[120px] border border-white/10 hover:bg-white/10 transition-all duration-200 active:scale-95 touch-manipulation"
                >
                  <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg xs:rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-1 xs:mb-2 sm:mb-2 md:mb-3 shadow-lg flex-shrink-0">
                    <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl text-white">🏢</span>
                  </div>
                  <div className="text-xs xs:text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-white break-words px-1" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Companies
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'achievements':
        return (
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="mb-4 md:mb-6 lg:mb-8 text-center px-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 md:mb-3 leading-tight"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500">
                  Your Achievements
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Manage your badges, certificates, and showcase your accomplishments.
              </p>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {dashboardCards.achievements?.map((card, index) => (
                <div key={index} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center mr-3 shadow-lg`}>
                        <span className="text-base md:text-lg text-white">{card.icon}</span>
                      </span>
                      {card.title.split(' ')[0]} {card.title.split(' ')[1]}
                    </h3>
                    <button 
                      onClick={() => handleCardClick(card.path)}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      View →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white`}>
                            {card.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm md:text-base">{card.title}</p>
                            <p className="text-gray-400 text-xs md:text-sm">{card.stats}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleCardClick(card.path)}
                        className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                      >
                        Get Started →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'learning':
        return (
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="mb-4 md:mb-6 lg:mb-8 text-center px-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 md:mb-3 leading-tight"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-indigo-500">
                  My Career Hub
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Access career resources and AI-powered guidance for your professional growth.
              </p>
            </div>

            {/* Career Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {dashboardCards.learning?.map((card, index) => (
                <div key={index} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center mr-3 shadow-lg`}>
                        <span className="text-base md:text-lg text-white">{card.icon}</span>
                      </span>
                      {card.title.split(' ')[0]} {card.title.split(' ')[1]}
                    </h3>
                    <button 
                      onClick={() => handleCardClick(card.path)}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      Access →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white`}>
                            {card.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm md:text-base">{card.title}</p>
                            <p className="text-gray-400 text-xs md:text-sm">{card.stats}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleCardClick(card.path)}
                        className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                      >
                        Explore Resources →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="mb-4 md:mb-6 lg:mb-8 text-center px-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 md:mb-3 leading-tight"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-500">
                  Project Management
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Submit, join, and manage your collaborative projects and build your portfolio.
              </p>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {dashboardCards.projects?.map((card, index) => (
                <div key={index} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center mr-3 shadow-lg`}>
                        <span className="text-base md:text-lg text-white">{card.icon}</span>
                      </span>
                      {card.title.split(' ')[0]} {card.title.split(' ')[1] || ''}
                    </h3>
                    <button 
                      onClick={() => handleCardClick(card.path)}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      Go →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white`}>
                            {card.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm md:text-base">{card.title}</p>
                            <p className="text-gray-400 text-xs md:text-sm">{card.stats}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleCardClick(card.path)}
                        className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                      >
                        Start Building →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="mb-4 md:mb-6 lg:mb-8 text-center px-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 md:mb-3 leading-tight"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-400 to-red-500">
                  Events & Workshops
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Host workshops, attend webinars, and join tech events to expand your knowledge.
              </p>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {dashboardCards.events?.map((card, index) => (
                <div key={index} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center mr-3 shadow-lg`}>
                        <span className="text-base md:text-lg text-white">{card.icon}</span>
                      </span>
                      {card.title.split(' ')[0]} {card.title.split(' ')[1] || ''}
                    </h3>
                    <button 
                      onClick={() => handleCardClick(card.path)}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      Join →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white`}>
                            {card.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm md:text-base">{card.title}</p>
                            <p className="text-gray-400 text-xs md:text-sm">{card.stats}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleCardClick(card.path)}
                        className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                      >
                        Participate →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'companies':
        return (
          <div className="space-y-4 md:space-y-6 lg:space-y-8">
            {/* Welcome Section */}
            <div className="mb-4 md:mb-6 lg:mb-8 text-center px-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-2 md:mb-3 leading-tight"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-yellow-400 to-green-500">
                  Company Hub
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 px-2" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Create, manage, and explore companies to build your entrepreneurial journey.
              </p>
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {dashboardCards.companies?.map((card, index) => (
                <div key={index} className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl p-4 md:p-6 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h3 className="text-base md:text-lg lg:text-xl font-black text-white flex items-center" 
                        style={{textShadow: '0 0 15px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                      <span className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center mr-3 shadow-lg`}>
                        <span className="text-base md:text-lg text-white">{card.icon}</span>
                      </span>
                      {card.title.split(' ')[0]} {card.title.split(' ')[1] || ''}
                    </h3>
                    <button 
                      onClick={() => handleCardClick(card.path)}
                      className="text-lime-400 text-sm font-semibold min-h-[44px] px-3 py-2 rounded-lg hover:bg-lime-400/10 transition-colors"
                    >
                      Enter →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-gray-200 text-sm leading-relaxed">
                      {card.description}
                    </p>
                    
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white`}>
                            {card.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm md:text-base">{card.title}</p>
                            <p className="text-gray-400 text-xs md:text-sm">{card.stats}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center pt-3 border-t border-white/10">
                      <button
                        onClick={() => handleCardClick(card.path)}
                        className="text-lime-400 hover:text-lime-300 text-sm font-semibold transition-colors min-h-[44px] px-4 py-2 rounded-lg hover:bg-lime-400/10"
                      >
                        Build Business →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading || !currentUser) {
    return (
      <div 
        className="min-h-screen overflow-hidden flex items-center justify-center relative px-4"
        style={{
          backgroundImage: `url('/Images/backg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl max-w-md w-full">
          <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white text-center font-medium text-sm md:text-base" 
             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            {!currentUser ? 'Please log in to view dashboard...' : 'Loading your dashboard...'}
          </p>
        </div>
        
        {showPWADebug && <PWADebugger />}
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-hidden flex"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Enhanced Sidebar */}
      <div 
        id="sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-72 md:w-80 lg:w-72 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition-transform duration-300 ease-in-out`}
        style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.6) 100%)', backdropFilter: 'blur(20px)'}}
      >
        <div className="flex items-center justify-between h-16 md:h-18 px-4 md:px-6 border-b border-white/20">
          <Link to="/" className="flex items-center">
            <img src="/Images/512X512.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 mr-3" />
            <span className="text-lg md:text-xl font-black text-white tracking-wide" 
                  style={{
                    textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
              Favored Online
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Enhanced User Profile in Sidebar */}
        <div className="p-4 md:p-6 border-b border-white/20 bg-black/30">
          <div className="flex items-center">
            <img 
              src={userProfile.photoURL || '/Images/512X512.png'} 
              alt="Profile" 
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover mr-3 md:mr-4 ring-2 ring-lime-400/50 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <Link 
                to={`/profile/${encodeURIComponent(userProfile.email)}`}
                className="font-medium text-white text-sm md:text-base truncate hover:text-lime-400 transition-colors duration-300 cursor-pointer block" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                title="View your profile"
              >
                {userProfile.name}
              </Link>
              <div className="text-gray-400 text-xs md:text-sm truncate">{userProfile.email}</div>
              {/* Clickable Followers/Following Stats */}
              <div className="mt-2">
                <ProfileStats 
                  userEmail={userProfile.email}
                  followerCount={userProfile.followersCount}
                  followingCount={userProfile.followingCount}
                  size="small"
                  className="justify-start"
                />
              </div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-400/20 text-green-300 mt-2 border border-green-400/30">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <nav className="p-3 md:p-4 space-y-2 overflow-y-auto flex-1">
          {sidebarItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSidebarItemClick(item)}
          className={`w-full flex items-center px-3 md:px-4 py-3 md:py-4 text-left rounded-xl min-h-[52px] transition-all duration-200 ${
            item.isNavigation
            ? 'text-gray-300 hover:bg-white/5 hover:text-white'
            : activeSection === item.id
            ? 'bg-lime-400/20 text-lime-400 border-r-4 border-lime-400 font-medium backdrop-blur-sm'
            : 'text-gray-300 hover:bg-white/5 hover:text-white'
          }`}
             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
            >
              <span className="text-lg md:text-xl mr-3">{item.icon}</span>
              <span className="font-medium text-sm md:text-base">{item.label}</span>
              {item.isNavigation && (
                <span className="ml-auto text-xs bg-lime-400/20 text-lime-300 px-2 py-1 rounded-full border border-lime-400/30">
                  Go
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Enhanced Bottom Section */}
        <div className="p-3 md:p-4 space-y-3 border-t border-white/10">
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => setShowPWADebug(!showPWADebug)}
              className="w-full bg-purple-600 text-white px-3 py-3 rounded-xl text-sm font-medium min-h-[48px] shadow-lg hover:bg-purple-700 transition-colors"
              title="Toggle PWA Debug (Ctrl+Shift+D)"
            >
              🔍 Debug Panel
            </button>
          )}
          <button 
            onClick={() => navigate('/logout')} 
            className="w-full bg-white/10 text-white px-3 py-3 rounded-xl text-sm font-medium min-h-[48px] backdrop-blur-sm border border-white/20 shadow-lg hover:bg-white/20 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 min-w-0">
        {/* Enhanced Top Header */}
        <header 
          className="h-16 md:h-18 flex items-center justify-between px-4 md:px-6 relative z-10"
          style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}
        >
          <div className="flex items-center min-w-0">
            <button
              id="menu-button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 mr-4 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-black text-white capitalize truncate" 
                style={{
                  textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                  fontFamily: '"Inter", sans-serif'
                }}>
              {activeSection}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <PWAInstallButton />
          </div>
        </header>

        {/* Enhanced Main Content Area */}
        <main className="p-4 md:p-6 lg:p-8 xl:p-10 relative z-10">
          {renderContent()}
        </main>
      </div>

      {/* Enhanced Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* PWA Debug Panel */}
      {showPWADebug && <PWADebugger />}

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(76, 175, 80, 0.1);
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        /* Enhanced mobile touch targets */
        @media (max-width: 768px) {
          button, a, [role="button"] {
            min-height: 48px;
            min-width: 48px;
          }
        }
        
        /* Custom breakpoint for xs screens */
        @media (min-width: 475px) {
          .xs\\:grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
          .xs\\:w-9 { width: 2.25rem; }
          .xs\\:h-9 { height: 2.25rem; }
          .xs\\:text-xs { font-size: 0.75rem; }
          .xs\\:text-sm { font-size: 0.875rem; }
          .xs\\:text-base { font-size: 1rem; }
          .xs\\:text-lg { font-size: 1.125rem; }
          .xs\\:mb-2 { margin-bottom: 0.5rem; }
          .xs\\:mb-4 { margin-bottom: 1rem; }
          .xs\\:pt-3 { padding-top: 0.75rem; }
          .xs\\:px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
          .xs\\:min-h-\\[170px\\] { min-height: 170px; }
        }
        
        /* Touch manipulation for better mobile performance */
        .touch-manipulation {
          touch-action: manipulation;
        }
        
        /* Better mobile text rendering */
        @media (max-width: 640px) {
          * {
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
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
        
        /* Prevent horizontal scroll on mobile */
        body {
          overflow-x: hidden;
        }
        
        /* Enhanced responsive grid spacing */
        @media (max-width: 475px) {
          .grid {
            gap: 0.75rem;
          }
        }
        
        @media (min-width: 476px) and (max-width: 640px) {
          .grid {
            gap: 1rem;
          }
        }
        
        @media (min-width: 641px) and (max-width: 768px) {
          .grid {
            gap: 1.25rem;
          }
        }
        
        @media (min-width: 769px) and (max-width: 1024px) {
          .grid {
            gap: 1.5rem;
          }
        }
        
        @media (min-width: 1025px) {
          .grid {
            gap: 2rem;
          }
        }
        
        /* Better responsive typography */
        @media (max-width: 640px) {
          h1, h2, h3 {
            line-height: 1.2;
          }
        }
        
        /* Enhanced mobile animations */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Safe areas for mobile devices */
        @supports (padding: max(0px)) {
          .safe-top {
            padding-top: max(env(safe-area-inset-top), 1rem);
          }
          
          .safe-bottom {
            padding-bottom: max(env(safe-area-inset-bottom), 1rem);
          }
          
          .safe-left {
            padding-left: max(env(safe-area-inset-left), 1rem);
          }
          
          .safe-right {
            padding-right: max(env(safe-area-inset-right), 1rem);
          }
        }
        
        /* Responsive card improvements */
        @media (max-width: 475px) {
          .grid > div {
            min-width: 0;
            flex: 1;
          }
        }
        
        /* Better hover states for touch devices */
        @media (hover: hover) {
          .group:hover .group-hover\\:scale-105 {
            transform: scale(1.05);
          }
          
          .group:hover .group-hover\\:shadow-3xl {
            box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25), 0 0 60px rgba(76, 175, 80, 0.1);
          }
        }
        
        /* Active states for touch devices */
        @media (hover: none) {
          .group:active .group-active\\:scale-95 {
            transform: scale(0.95);
          }
        }
        
        /* Ensure cards fill container properly */
        .grid > * {
          width: 100%;
          max-width: 100%;
        }
        
        /* Fix flexbox issues on older browsers */
        .flex-grow {
          flex: 1 1 0%;
        }
        
        /* Better text wrapping */
        .break-words {
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
          overflow-wrap: break-word;
        }
      `}</style>
    </div>
  );
};

// Wrapper component that connects to auth context
const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  console.log('Dashboard Debug - currentUser:', currentUser);
  console.log('PWA Environment Check:', {
    nodeEnv: process.env.NODE_ENV,
    protocol: window.location.protocol,
    host: window.location.host,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasManifest: !!document.querySelector('link[rel="manifest"]')
  });

  return (
    <UserDashboard 
      currentUser={currentUser} 
      onNavigate={navigate} 
    />
  );
};

export default Dashboard;
