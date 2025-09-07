// src/Pages/user/FollowersFollowing.jsx - Updated with Unified Follow System
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

// 🔥 UPDATED: Import the unified follow system
import { 
  followUser, 
  unfollowUser, 
  getFollowingStatusForUsers, 
  handleFollowToggle 
} from '../../utils/followSystem';

const FollowersFollowing = () => {
  const { userEmail } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab from URL
  const isFollowersPage = location.pathname.includes('/followers');
  const isFollowingPage = location.pathname.includes('/following');
  const isMembersPage = !userEmail || location.pathname.includes('/members');
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState(
    isFollowersPage ? 'followers' : 
    isFollowingPage ? 'following' : 
    'members'
  );
  
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [followingStatus, setFollowingStatus] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  // Mobile-specific states
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Members directory filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minProjects, setMinProjects] = useState(0);
  const [minBadges, setMinBadges] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [showOnlyBadgedUsers, setShowOnlyBadgedUsers] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [totalFollowing, setTotalFollowing] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const USERS_PER_PAGE = 20;
  const usersPerPage = 9;
  
  // Decode email from URL
  const decodedEmail = userEmail ? decodeURIComponent(userEmail) : null;

  // Badge categories for members directory
  const badgeCategories = {
    'mentorship': { 
      name: 'TechMO', 
      icon: '🏆', 
      color: 'text-yellow-400', 
      bgColor: 'from-yellow-500/20 to-yellow-600/20',
      skills: ['Mentorship', 'Leadership', 'Technical Coaching', 'Team Development']
    },
    'quality-assurance': { 
      name: 'TechQA', 
      icon: '🔍', 
      color: 'text-blue-400', 
      bgColor: 'from-blue-500/20 to-blue-600/20',
      skills: ['Quality Assurance', 'Testing', 'Bug Detection', 'Test Automation']
    },
    'development': { 
      name: 'TechDev', 
      icon: '💻', 
      color: 'text-green-400', 
      bgColor: 'from-green-500/20 to-green-600/20',
      skills: ['Programming', 'Software Development', 'Code Review', 'Debugging']
    },
    'leadership': { 
      name: 'TechLeads', 
      icon: '👑', 
      color: 'text-purple-400', 
      bgColor: 'from-purple-500/20 to-purple-600/20',
      skills: ['Project Management', 'Leadership', 'Strategic Planning', 'Team Coordination']
    },
    'design': { 
      name: 'TechArchs', 
      icon: '🎨', 
      color: 'text-orange-400', 
      bgColor: 'from-orange-500/20 to-orange-600/20',
      skills: ['No-Code Development', 'UI/UX Design', 'Visual Design', 'Platform Architecture']
    },
    'security': { 
      name: 'TechGuard', 
      icon: '🛡️', 
      color: 'text-red-400', 
      bgColor: 'from-red-500/20 to-red-600/20',
      skills: ['Cybersecurity', 'Network Security', 'Cloud Administration', 'DevOps']
    }
  };

  // Get all unique skills from badge categories
  const allSkills = Object.values(badgeCategories).flatMap(cat => cat.skills);
  const uniqueSkills = [...new Set(allSkills)].sort();

  // Helper functions for user feedback
  const showSuccessMessage = (message) => toast.success(message);
  const showWarningMessage = (message) => toast.warn(message);
  const showErrorMessage = (message) => toast.error(message);

  // 🔥 UPDATED: Update the handleFollowToggle function to use the unified system
  const handleFollowToggleLocal = async (userId, isCurrentlyFollowing) => {
    if (!currentUser) {
      showWarningMessage('Please log in to follow users');
      return;
    }

    if (currentUser.uid === userId) {
      showWarningMessage("You can't follow yourself! 😊");
      return;
    }

    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      // Find user data for better feedback
      const user = [...followers, ...following, ...members].find(u => u.uid === userId);
      
      const success = await handleFollowToggle(
        currentUser,
        userId,
        isCurrentlyFollowing,
        user,
        (targetUserId, newStatus) => {
          // Update local following status
          setFollowingStatus(prev => ({ ...prev, [targetUserId]: newStatus }));
          
          // Update local state for following tab
          if (activeTab === 'following' && !newStatus) {
            setFollowing(prev => prev.filter(user => user.uid !== targetUserId));
            setTotalFollowing(prev => Math.max(0, prev - 1));
          }
        }
      );
      
      if (!success) {
        console.log('❌ Follow/unfollow operation failed');
      }
      
    } catch (error) {
      console.error('❌ Error in follow toggle:', error);
      showWarningMessage('Unable to update follow status. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // 🔥 UPDATED: Update loadFollowingStatus to use the unified function
  const loadFollowingStatus = async () => {
    if (!currentUser) {
      setFollowingStatus({});
      return;
    }

    try {
      // Get all user IDs that need status checking
      const allUserIds = [
        ...followers.map(user => user.uid),
        ...following.map(user => user.uid),
        ...members.map(member => member.uid)
      ].filter(Boolean);

      if (allUserIds.length > 0) {
        const statusMap = await getFollowingStatusForUsers(currentUser, allUserIds);
        setFollowingStatus(statusMap);
      }
    } catch (error) {
      console.error('Error loading following status:', error);
    }
  };

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Navigate to user profile
  const handleUserClick = (user) => {
    try {
      if (user.email) {
        const encodedEmail = encodeURIComponent(user.email);
        navigate(`/profile/${encodedEmail}`);
      } else {
        toast.warn('Unable to view profile - missing user information');
      }
    } catch (error) {
      console.error('Error navigating to user profile:', error);
      toast.error('Unable to view user profile');
    }
  };

  // Fetch full members directory with enhanced data
  const fetchMembersDirectory = async () => {
    if (!currentUser) return;

    setLoadingPage(true);
    console.log('🔍 Fetching complete members directory...');
    
    try {
      // Get ALL users first
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      
      console.log(`📊 Found ${usersSnapshot.size} total users in database`);

      if (usersSnapshot.size === 0) {
        setMembers([]);
        setFilteredMembers([]);
        setLoadingPage(false);
        return;
      }

      // Get all badges data for efficient lookup
      const badgesQuery = query(collection(db, 'member_badges'));
      const badgesSnapshot = await getDocs(badgesQuery);
      
      const badgesByMember = {};
      badgesSnapshot.docs.forEach(doc => {
        try {
          const badge = { id: doc.id, ...doc.data() };
          const email = badge.memberEmail;
          
          if (email) {
            if (!badgesByMember[email]) {
              badgesByMember[email] = [];
            }
            badgesByMember[email].push({
              ...badge,
              awardedAt: badge.awardedAt && typeof badge.awardedAt.toDate === 'function' 
                ? badge.awardedAt.toDate() 
                : badge.awardedAt instanceof Date 
                ? badge.awardedAt 
                : new Date()
            });
          }
        } catch (badgeError) {
          console.warn('Error processing badge:', doc.id, badgeError);
        }
      });

      // Process all users and enhance with badge/project data
      const membersData = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          try {
            const userData = userDoc.data();
            const email = userData.email;
            
            // Skip users without email
            if (!email || !email.includes('@')) {
              return null;
            }

            // Skip current user
            if (userDoc.id === currentUser.uid) {
              return null;
            }

            // Basic member info
            let memberInfo = {
              uid: userDoc.id,
              email,
              name: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || email.split('@')[0],
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              displayName: userData.displayName || '',
              photoURL: userData.photoURL || null,
              joinedDate: userData.createdAt && typeof userData.createdAt.toDate === 'function' 
                ? userData.createdAt.toDate() 
                : userData.createdAt instanceof Date 
                ? userData.createdAt 
                : null,
              lastLogin: userData.lastLogin && typeof userData.lastLogin.toDate === 'function'
                ? userData.lastLogin.toDate()
                : userData.lastLogin instanceof Date
                ? userData.lastLogin
                : null,
              profile: userData.profile || {}
            };

            // Get project memberships
            const projectsQuery = query(
              collection(db, 'group_members'),
              where('userEmail', '==', email)
            );
            const projectsSnapshot = await getDocs(projectsQuery);
            
            const projectHistory = [];
            for (const membershipDoc of projectsSnapshot.docs) {
              const membershipData = membershipDoc.data();
              
              try {
                const groupDoc = await getDoc(doc(db, 'groups', membershipData.groupId));
                if (groupDoc.exists()) {
                  const groupData = groupDoc.data();
                  projectHistory.push({
                    id: membershipDoc.id,
                    ...membershipData,
                    projectTitle: groupData.projectTitle || 'Untitled Project',
                    projectDescription: groupData.description || '',
                    projectStatus: groupData.status || 'active'
                  });
                }
              } catch (projectError) {
                console.error(`Error fetching project ${membershipData.groupId}:`, projectError);
              }
            }

            // Get certificates
            const certificatesQuery = query(
              collection(db, 'certificates'),
              where('recipientEmail', '==', email)
            );
            const certificatesSnapshot = await getDocs(certificatesQuery);
            const certificates = certificatesSnapshot.docs.length;

            // Process badges
            const badges = badgesByMember[email] || [];
            const badgesByCategory = badges.reduce((acc, badge) => {
              const category = badge.badgeCategory || 'other';
              acc[category] = (acc[category] || 0) + 1;
              return acc;
            }, {});

            // Calculate statistics
            const completedProjects = projectHistory.filter(p => 
              p.status === 'completed' || p.projectStatus === 'completed'
            ).length;
            
            const adminProjects = projectHistory.filter(p => p.role === 'admin').length;
            
            // Calculate member score
            const memberScore = Math.min(100, 
              (badges.length * 8) + 
              (certificates * 12) + 
              (completedProjects * 6) + 
              (adminProjects * 15) +
              (projectHistory.length * 2)
            );

            // Get skills from badge categories
            const memberSkills = new Set();
            badges.forEach(badge => {
              const category = badgeCategories[badge.badgeCategory];
              if (category) {
                category.skills.forEach(skill => memberSkills.add(skill));
              }
            });

            // Add default skills for users without badges
            if (memberSkills.size === 0) {
              memberSkills.add('Software Development');
              memberSkills.add('Problem Solving');
            }

            // Calculate last activity
            const lastActive = Math.max(
              memberInfo.lastLogin ? memberInfo.lastLogin.getTime() : 0,
              badges.length > 0 ? Math.max(...badges.map(b => {
                if (b.awardedAt && typeof b.awardedAt.getTime === 'function') {
                  return b.awardedAt.getTime();
                }
                return 0;
              })) : 0,
              projectHistory.length > 0 ? Math.max(...projectHistory.map(p => {
                if (p.joinedAt && typeof p.joinedAt.getTime === 'function') {
                  return p.joinedAt.getTime();
                }
                return 0;
              })) : 0,
              memberInfo.joinedDate ? memberInfo.joinedDate.getTime() : Date.now() - (365 * 24 * 60 * 60 * 1000)
            );

            // Determine top badge category
            const topBadgeCategory = Object.entries(badgesByCategory)
              .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

            // User status categorization
            const getUserStatus = () => {
              if (badges.length >= 5) return 'veteran';
              if (badges.length >= 1) return 'achiever';
              if (projectHistory.length >= 1) return 'participant';
              return 'newcomer';
            };

            const userStatus = getUserStatus();

            return {
              ...memberInfo,
              badges: badges.length,
              certificates,
              totalProjects: projectHistory.length,
              completedProjects,
              adminProjects,
              badgesByCategory,
              memberScore,
              skills: Array.from(memberSkills),
              lastActive,
              topBadgeCategory,
              detailedBadges: badges.slice(0, 10),
              projectHistory: projectHistory.slice(0, 10),
              userStatus,
              isActive: lastActive > (Date.now() - (90 * 24 * 60 * 60 * 1000)),
              hasAchievements: badges.length > 0 || certificates > 0 || completedProjects > 0
            };
          } catch (memberError) {
            console.error(`Error processing member ${userDoc.id}:`, memberError);
            return null;
          }
        })
      );

      // Filter out null results
      const validMembers = membersData.filter(member => member && member.email);
      
      console.log(`✅ Successfully processed ${validMembers.length} members`);
      
      setMembers(validMembers);
      setFilteredMembers(validMembers);
    } catch (error) {
      console.error('❌ Error fetching members directory:', error);
      toast.error('Failed to load members directory');
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setLoadingPage(false);
    }
  };

  // Fetch user data for followers/following tabs
  const fetchUserData = async () => {
    if (!decodedEmail) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching user data for:', decodedEmail);

      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', decodedEmail)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        console.log('❌ User not found:', decodedEmail);
        toast.error('User not found');
        navigate('/community');
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      setUserProfile({
        uid: userId,
        ...userData
      });

      const followersIds = userData.followers || [];
      const followingIds = userData.following || [];
      
      setTotalFollowers(followersIds.length);
      setTotalFollowing(followingIds.length);

      // Load current user's following status
      if (currentUser) {
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (currentUserDoc.exists()) {
          const currentUserData = currentUserDoc.data();
          const currentUserFollowing = currentUserData.following || [];
          
          const statusMap = {};
          [...followersIds, ...followingIds].forEach(userId => {
            statusMap[userId] = currentUserFollowing.includes(userId);
          });
          setFollowingStatus(statusMap);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch paginated users for followers/following
  const fetchPaginatedUsers = async (tab, page) => {
    if (!userProfile || tab === 'members') return;

    setLoadingPage(true);
    
    try {
      const isFollowersTab = tab === 'followers';
      const userIds = isFollowersTab 
        ? (userProfile.followers || [])
        : (userProfile.following || []);

      const startIndex = (page - 1) * USERS_PER_PAGE;
      const endIndex = startIndex + USERS_PER_PAGE;
      const paginatedUserIds = userIds.slice(startIndex, endIndex);

      if (paginatedUserIds.length === 0) {
        if (isFollowersTab) {
          setFollowers([]);
        } else {
          setFollowing([]);
        }
        setLoadingPage(false);
        return;
      }

      const allUsers = [];
      const batchSize = 10;
      
      for (let i = 0; i < paginatedUserIds.length; i += batchSize) {
        const batch = paginatedUserIds.slice(i, i + batchSize);
        
        try {
          const usersQuery = query(
            collection(db, 'users'),
            where('uid', 'in', batch)
          );
          
          const usersSnapshot = await getDocs(usersQuery);
          const batchUsers = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          }));
          
          allUsers.push(...batchUsers);
        } catch (batchError) {
          console.error('❌ Error fetching user batch:', batchError);
        }
      }

      const sortedUsers = paginatedUserIds.map(id => 
        allUsers.find(user => user.uid === id)
      ).filter(Boolean);

      if (isFollowersTab) {
        setFollowers(sortedUsers);
      } else {
        setFollowing(sortedUsers);
      }

    } catch (error) {
      console.error('❌ Error fetching paginated users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingPage(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (activeTab === 'members') {
      // For members tab, load full directory and following status
      loadFollowingStatus().then(() => {
        fetchMembersDirectory();
      });
      setLoading(false);
    } else if (decodedEmail) {
      // For followers/following tabs, load specific user data
      fetchUserData();
    }
  }, [decodedEmail, currentUser, activeTab]);

  // Load paginated data when tab or page changes
  useEffect(() => {
    if (activeTab === 'members') {
      // No pagination for members - it's handled in the directory
      return;
    } else if (userProfile) {
      fetchPaginatedUsers(activeTab, currentPage);
    }
  }, [userProfile, activeTab, currentPage]);

  // 🔥 UPDATED: Load following status when data changes
  useEffect(() => {
    loadFollowingStatus();
  }, [followers, following, members, currentUser]);

  // Apply filters for members directory
  useEffect(() => {
    if (activeTab === 'members') {
      let filtered = [...members];

      // Filter by badged users only
      if (showOnlyBadgedUsers) {
        filtered = filtered.filter(member => member.hasAchievements);
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(member => 
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          member.skills.some(skill => skill.toLowerCase().includes(query))
        );
      }

      // Badge category filter
      if (selectedBadgeCategory !== 'all') {
        filtered = filtered.filter(member => 
          member.badgesByCategory[selectedBadgeCategory] > 0
        );
      }

      // Skill filter
      if (selectedSkill) {
        filtered = filtered.filter(member => 
          member.skills.includes(selectedSkill)
        );
      }

      // Minimum projects filter
      if (minProjects > 0) {
        filtered = filtered.filter(member => 
          member.totalProjects >= minProjects
        );
      }

      // Minimum badges filter
      if (minBadges > 0) {
        filtered = filtered.filter(member => 
          member.badges >= minBadges
        );
      }

      // Sort results
      switch (sortBy) {
        case 'badges':
          filtered.sort((a, b) => b.badges - a.badges);
          break;
        case 'projects':
          filtered.sort((a, b) => b.totalProjects - a.totalProjects);
          break;
        case 'recent':
          filtered.sort((a, b) => b.lastActive - a.lastActive);
          break;
        case 'name':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'score':
          filtered.sort((a, b) => b.memberScore - a.memberScore);
          break;
        default:
          break;
      }

      setFilteredMembers(filtered);
      setCurrentPage(1);
    } else {
      // Search for followers/following
      const users = activeTab === 'followers' ? followers : following;
      
      if (!searchTerm.trim()) {
        setFilteredUsers(users);
        return;
      }

      const filtered = users.filter(user => {
        const name = user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.displayName || '';
        const email = user.email || '';
        const title = user.profile?.title || '';
        
        const searchLower = searchTerm.toLowerCase();
        return (
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          title.toLowerCase().includes(searchLower)
        );
      });

      setFilteredUsers(filtered);
    }
  }, [members, followers, following, activeTab, searchQuery, selectedBadgeCategory, selectedSkill, minProjects, minBadges, sortBy, showOnlyBadgedUsers, searchTerm]);

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    setSearchQuery('');
    setShowFilters(false);
    
    // Clear all filters when switching tabs
    if (tab === 'members') {
      setSelectedBadgeCategory('all');
      setSelectedSkill('');
      setMinProjects(0);
      setMinBadges(0);
      setSortBy('recent');
      setShowOnlyBadgedUsers(false);
    }
    
    if (tab === 'members') {
      navigate('/members', { replace: true });
    } else if (decodedEmail) {
      const newPath = `/profile/${encodeURIComponent(decodedEmail)}/${tab}`;
      navigate(newPath, { replace: true });
    }
  };

  // Clear filters for members directory
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedBadgeCategory('all');
    setSelectedSkill('');
    setMinProjects(0);
    setMinBadges(0);
    setSortBy('recent');
    setShowOnlyBadgedUsers(false);
    setCurrentPage(1);
  };

  // Pagination for followers/following only
  const handlePageChange = (newPage) => {
    if (activeTab === 'members') return;
    
    const totalPages = getTotalPages();
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSearchTerm('');
    }
  };

  const getTotalPages = () => {
    if (activeTab === 'members') return Math.ceil(filteredMembers.length / usersPerPage);
    const total = activeTab === 'followers' ? totalFollowers : totalFollowing;
    return Math.ceil(total / USERS_PER_PAGE);
  };

  const getCurrentUsers = () => {
    if (activeTab === 'members') {
      return filteredMembers;
    }
    return searchTerm.trim() ? filteredUsers : (activeTab === 'followers' ? followers : following);
  };

  // 🔥 UPDATED: Enhanced FollowButton component
  const FollowButton = ({ targetUser, isFollowing, size = 'sm' }) => {
    const loading = actionLoading[targetUser.uid];

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs min-w-[60px]',
      sm: 'px-3 py-1.5 text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]',
      md: 'px-4 py-2 text-sm sm:text-base min-w-[80px] sm:min-w-[100px]'
    };

    if (!currentUser || currentUser.uid === targetUser.uid) return null;

    return (
      <button
        onClick={() => handleFollowToggleLocal(targetUser.uid, isFollowing)}
        disabled={loading}
        className={`${sizeClasses[size]} rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
          isFollowing
            ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white transform hover:scale-105'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
            <span className="hidden sm:inline">...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center">
            {isFollowing ? (
              <>
                <span className="hidden sm:inline">Following</span>
                <span className="sm:hidden">✓</span>
              </>
            ) : (
              <>
                <span className="mr-1">+</span>
                <span className="hidden sm:inline">Follow</span>
                <span className="sm:hidden">Follow</span>
              </>
            )}
          </span>
        )}
      </button>
    );
  };

  // Enhanced User Card Component for mobile responsiveness
  const UserCard = ({ user }) => (
    <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-3 sm:p-4 lg:p-6 hover:bg-black/30 transition-all duration-300 hover:border-lime-400/30">
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={() => handleUserClick(user)}
          className="relative flex-shrink-0 group touch-manipulation"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 cursor-pointer">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm sm:text-base md:text-lg font-bold">
                {user.firstName && user.lastName 
                  ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                  : user.initials || user.displayName?.charAt(0)?.toUpperCase() || 'U'
                }
              </span>
            )}
          </div>
          
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
        </button>
        
        <div className="flex-1 min-w-0">
          <button
            onClick={() => handleUserClick(user)}
            className="text-left w-full group touch-manipulation"
          >
            <h3 className="font-bold text-white text-sm sm:text-base lg:text-lg truncate group-hover:text-lime-300 transition-colors">
              {user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user.displayName || 'Professional User'
              }
            </h3>
            {user.profile?.title && (
              <p className="text-lime-400 text-xs sm:text-sm truncate">
                {user.profile.title}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-400 mt-1">
              {user.followerCount > 0 && (
                <span>{user.followerCount} followers</span>
              )}
              {user.postCount > 0 && (
                <>
                  {user.followerCount > 0 && <span>•</span>}
                  <span>{user.postCount} posts</span>
                </>
              )}
              {user.profile?.company && (
                <>
                  {(user.followerCount > 0 || user.postCount > 0) && <span className="hidden sm:inline">•</span>}
                  <span className="truncate max-w-[100px] sm:max-w-none">{user.profile.company}</span>
                </>
              )}
            </div>
          </button>
        </div>
        
        <div className="flex-shrink-0">
          <FollowButton
            targetUser={user}
            isFollowing={followingStatus[user.uid] || false}
            size={isMobile ? "xs" : "sm"}
          />
        </div>
      </div>
    </div>
  );

  // Enhanced Member Card Component for mobile responsiveness
  const MemberCard = ({ member }) => {
    const topCategory = member.topBadgeCategory ? badgeCategories[member.topBadgeCategory] : null;
    
    return (
      <div className="group">
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500 h-full flex flex-col">
          
          {/* Member Header */}
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="relative flex-shrink-0 mr-3 sm:mr-4">
              <button
                onClick={() => handleUserClick(member)}
                className="relative group touch-manipulation"
              >
                {member.photoURL ? (
                  <img 
                    src={member.photoURL} 
                    alt={`${member.name}'s profile`}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover ring-2 sm:ring-4 ring-lime-400/50 group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center ring-2 sm:ring-4 ring-lime-400/50 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-lg sm:text-xl text-black font-bold">
                      {member.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                {member.isActive && (
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-6 sm:h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            </div>
            
            <div className="flex-grow min-w-0">
              <button
                onClick={() => handleUserClick(member)}
                className="text-left group w-full touch-manipulation"
              >
                <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-lime-300 transition-colors duration-300 truncate">
                  {member.name}
                </h3>
                
                {topCategory && (
                  <div className="flex items-center mt-1 sm:mt-2">
                    <span className={`${topCategory.color} text-sm mr-1`}>{topCategory.icon}</span>
                    <span className="text-xs text-gray-300 truncate">{topCategory.name}</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="bg-yellow-500/10 rounded-lg p-2 sm:p-3 text-center border border-yellow-500/20">
              <div className="text-base sm:text-lg font-bold text-yellow-400">{member.badges}</div>
              <div className="text-xs text-yellow-300">Badges</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2 sm:p-3 text-center border border-blue-500/20">
              <div className="text-base sm:text-lg font-bold text-blue-400">{member.totalProjects}</div>
              <div className="text-xs text-blue-300">Projects</div>
            </div>
            <div className="bg-purple-500/10 rounded-lg p-2 sm:p-3 text-center border border-purple-500/20">
              <div className="text-base sm:text-lg font-bold text-purple-400">{member.memberScore}</div>
              <div className="text-xs text-purple-300">Score</div>
            </div>
          </div>

          {/* Skills Preview */}
          <div className="mb-4 sm:mb-6 flex-grow">
            <div className="text-gray-400 text-sm mb-2">Skills:</div>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {member.skills.slice(0, isMobile ? 2 : 3).map((skill, idx) => (
                <span key={idx} className="bg-white/10 text-gray-300 px-2 py-1 rounded-md sm:rounded-lg text-xs border border-white/20 truncate">
                  {skill}
                </span>
              ))}
              {member.skills.length > (isMobile ? 2 : 3) && (
                <span className="bg-white/10 text-gray-300 px-2 py-1 rounded-md sm:rounded-lg text-xs border border-white/20">
                  +{member.skills.length - (isMobile ? 2 : 3)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleUserClick(member)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-lg sm:rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-xs touch-manipulation"
            >
              <span className="hidden sm:inline">View Profile</span>
              <span className="sm:hidden">View</span>
            </button>
            <FollowButton
              targetUser={member}
              isFollowing={followingStatus[member.uid] || false}
              size={isMobile ? "xs" : "sm"}
            />
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Pagination Controls Component
  const PaginationControls = () => {
    if (activeTab === 'members') return null;
    
    const totalPages = getTotalPages();
    const total = activeTab === 'followers' ? totalFollowers : totalFollowing;
    
    if (totalPages <= 1) return null;

    return (
      <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-4">
        <div className="text-gray-400 text-xs sm:text-sm text-center px-4">
          Showing {((currentPage - 1) * USERS_PER_PAGE) + 1} - {Math.min(currentPage * USERS_PER_PAGE, total)} of {total} users
        </div>
        
        <div className="flex items-center space-x-2 px-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loadingPage}
            className="px-3 py-2 bg-black/20 border border-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/30 transition-colors touch-manipulation text-sm"
          >
            <span className="hidden sm:inline">← Previous</span>
            <span className="sm:hidden">←</span>
          </button>
          
          <span className="px-2 sm:px-4 py-2 text-white text-sm">
            <span className="hidden sm:inline">Page </span>{currentPage}<span className="hidden sm:inline"> of {totalPages}</span>
            <span className="sm:hidden">/{totalPages}</span>
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loadingPage}
            className="px-3 py-2 bg-black/20 border border-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/30 transition-colors touch-manipulation text-sm"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>
      </div>
    );
  };

  // Members Directory Pagination
  const getMembersPageData = () => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const currentMembers = filteredMembers.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredMembers.length / usersPerPage);
    
    return { currentMembers, totalPages, startIndex, endIndex };
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
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
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white text-base sm:text-lg">Loading...</p>
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

      {/* Enhanced Mobile-First Header */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-5">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center group touch-manipulation">
              <img 
                src="/Images/512X512.png" 
                alt="Favored Online Logo" 
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mr-2 sm:mr-4 transform group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-base sm:text-lg lg:text-2xl font-black text-white tracking-wide" 
                    style={{
                      textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                <span className="hidden sm:inline">Favored Online</span>
                <span className="sm:hidden">Favored</span>
              </span>
            </Link>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors touch-manipulation text-sm sm:text-base"
              >
                <span className="hidden sm:inline">← Back</span>
                <span className="sm:hidden">←</span>
              </button>
              <Link 
                to="/community" 
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors touch-manipulation text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">Com</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16 sm:pt-20 lg:pt-24 pb-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
          
          {/* Enhanced Profile Header - Only show for specific user pages */}
          {userProfile && activeTab !== 'members' && (
            <section className="mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 mb-4 sm:mb-6">
                  <button
                    onClick={() => handleUserClick(userProfile)}
                    className="relative flex-shrink-0 group touch-manipulation"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 cursor-pointer">
                      {userProfile?.photoURL ? (
                        <img 
                          src={userProfile.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg sm:text-xl lg:text-2xl font-bold">
                          {userProfile?.firstName && userProfile?.lastName 
                            ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase()
                            : userProfile?.initials || userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'
                          }
                        </span>
                      )}
                    </div>
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleUserClick(userProfile)}
                      className="text-left group w-full touch-manipulation"
                    >
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1 sm:mb-2 group-hover:text-lime-300 transition-colors truncate" 
                          style={{
                            textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        {userProfile?.firstName && userProfile?.lastName 
                          ? `${userProfile.firstName} ${userProfile.lastName}`
                          : userProfile?.displayName || 'Professional User'
                        }
                      </h1>
                    </button>
                    {userProfile?.profile?.title && (
                      <p className="text-lime-400 text-sm sm:text-base lg:text-lg font-medium mb-1 sm:mb-2 truncate">
                        {userProfile.profile.title}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 sm:space-x-4 text-gray-300 text-sm sm:text-base">
                      <span>{totalFollowers} followers</span>
                      <span>•</span>
                      <span>{totalFollowing} following</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Enhanced Mobile-First Tabs */}
          <div className="mb-6 sm:mb-8">
            <div className="bg-black/20 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-1 sm:p-2">
              <div className="flex">
                {userProfile && (
                  <>
                    <button
                      onClick={() => handleTabChange('followers')}
                      className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 touch-manipulation text-xs sm:text-sm lg:text-base ${
                        activeTab === 'followers'
                          ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <span>👥</span>
                        <span className="hidden xs:inline">Followers</span>
                        <span className="xs:hidden">F</span>
                        <span className="text-xs opacity-80">({totalFollowers})</span>
                      </span>
                    </button>
                    <button
                      onClick={() => handleTabChange('following')}
                      className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 touch-manipulation text-xs sm:text-sm lg:text-base ${
                        activeTab === 'following'
                          ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <span>🔗</span>
                        <span className="hidden xs:inline">Following</span>
                        <span className="xs:hidden">F</span>
                        <span className="text-xs opacity-80">({totalFollowing})</span>
                      </span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleTabChange('members')}
                  className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 touch-manipulation text-xs sm:text-sm lg:text-base ${
                    activeTab === 'members'
                      ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-1 sm:space-x-2">
                    <span>📋</span>
                    <span className="hidden sm:inline">Members</span>
                    <span className="sm:hidden">M</span>
                    <span className="text-xs opacity-80">
                      ({members.length > 0 ? members.length : 'All'})
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Members Directory Filters - Mobile-First Design */}
          {activeTab === 'members' && (
            <section className="mb-6 sm:mb-8">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                
                {/* Search Bar */}
                <div className="mb-4 sm:mb-6">
                  <input
                    type="text"
                    placeholder="Search by name, email, or skills..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                  />
                </div>

                {/* Show Badge Holders Toggle */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="flex items-center cursor-pointer touch-manipulation">
                    <input
                      type="checkbox"
                      checked={showOnlyBadgedUsers}
                      onChange={(e) => setShowOnlyBadgedUsers(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showOnlyBadgedUsers ? 'bg-lime-500' : 'bg-gray-600'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showOnlyBadgedUsers ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                    <span className="ml-3 text-white text-sm sm:text-base">Show only members with achievements</span>
                  </label>
                  
                  <div className="text-xs sm:text-sm text-gray-400">
                    {showOnlyBadgedUsers 
                      ? `Showing ${members.filter(m => m.hasAchievements).length} members with achievements`
                      : `Showing all ${members.length} members`
                    }
                  </div>
                </div>

                {/* Mobile Filter Toggle */}
                <div className="mb-4 sm:hidden">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 touch-manipulation"
                  >
                    <span>🔧</span>
                    <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                  </button>
                </div>

                {/* Filters Grid - Responsive */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6 ${!showFilters && isMobile ? 'hidden' : ''}`}>
                  
                  <select
                    value={selectedBadgeCategory}
                    onChange={(e) => setSelectedBadgeCategory(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  >
                    <option value="all">All Badge Types</option>
                    {Object.entries(badgeCategories).map(([key, category]) => (
                      <option key={key} value={key}>{category.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  >
                    <option value="">All Skills</option>
                    {uniqueSkills.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>

                  <select
                    value={minProjects}
                    onChange={(e) => setMinProjects(Number(e.target.value))}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  >
                    <option value={0}>Any Projects</option>
                    <option value={1}>1+ Projects</option>
                    <option value={3}>3+ Projects</option>
                    <option value={5}>5+ Projects</option>
                    <option value={10}>10+ Projects</option>
                  </select>

                  <select
                    value={minBadges}
                    onChange={(e) => setMinBadges(Number(e.target.value))}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  >
                    <option value={0}>Any Badges</option>
                    <option value={1}>1+ Badges</option>
                    <option value={5}>5+ Badges</option>
                    <option value={10}>10+ Badges</option>
                    <option value={15}>15+ Badges</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                  >
                    <option value="recent">Recently Active</option>
                    <option value="badges">Most Badges</option>
                    <option value="projects">Most Projects</option>
                    <option value="score">Highest Score</option>
                    <option value="name">Name A-Z</option>
                  </select>

                  <button
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300 text-sm sm:text-base touch-manipulation"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex justify-between items-center text-gray-300 text-sm sm:text-base">
                  <span>
                    <span className="text-lime-300 font-semibold">{filteredMembers.length}</span> members found
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Enhanced Search Bar for followers/following */}
          {activeTab !== 'members' && getCurrentUsers().length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-black/20 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 text-sm sm:text-base"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <p className="text-gray-400 text-xs sm:text-sm mt-2 px-2">
                  {getCurrentUsers().length} result{getCurrentUsers().length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          )}

          {/* Enhanced Content Section */}
          <section>
            {loadingPage ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
                <p className="text-white text-base sm:text-lg">Loading users...</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
                  <span>
                    {activeTab === 'followers' ? '👥 Followers' : 
                     activeTab === 'following' ? '🔗 Following' : 
                     '📋 Members Directory'}
                  </span>
                  {!searchTerm && !searchQuery && activeTab !== 'members' && (
                    <span className="text-xs sm:text-sm bg-gray-500/20 text-gray-400 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                      Page {currentPage} of {getTotalPages()}
                    </span>
                  )}
                </h2>
                
                {getCurrentUsers().length === 0 ? (
                  <div className="text-center py-12 sm:py-16 px-4">
                    <div className="text-3xl sm:text-4xl mb-4">
                      {searchTerm || searchQuery ? '🔍' : 
                       activeTab === 'followers' ? '👥' : 
                       activeTab === 'following' ? '🔗' : '📋'}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      {searchTerm || searchQuery
                        ? 'No users found' 
                        : activeTab === 'followers' 
                        ? 'No followers yet' 
                        : activeTab === 'following'
                        ? 'Not following anyone yet'
                        : 'No members found'
                      }
                    </h3>
                    <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto">
                      {searchTerm || searchQuery
                        ? 'Try adjusting your search terms'
                        : activeTab === 'members'
                        ? 'Loading members directory...'
                        : userProfile?.uid === currentUser?.uid 
                        ? (activeTab === 'followers' 
                          ? "Share great content to attract followers!"
                          : "Discover and follow other developers in the community!"
                        )
                        : (activeTab === 'followers'
                          ? "This user doesn't have any followers yet."
                          : "This user isn't following anyone yet."
                        )
                      }
                    </p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'members' ? (
                      /* Enhanced Members Directory Grid */
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                          {(() => {
                            const { currentMembers } = getMembersPageData();
                            return currentMembers.map((member) => (
                              <MemberCard key={member.uid} member={member} />
                            ));
                          })()}
                        </div>
                        
                        {/* Enhanced Members Directory Pagination */}
                        {(() => {
                          const { totalPages, startIndex, endIndex } = getMembersPageData();
                          
                          if (totalPages > 1) {
                            return (
                              <div className="flex justify-center items-center mt-8 sm:mt-12 px-4">
                                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 w-full max-w-lg">
                                  <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
                                    
                                    <button
                                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                      disabled={currentPage === 1}
                                      className={`flex items-center px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-300 touch-manipulation text-sm ${
                                        currentPage === 1
                                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transform hover:scale-105'
                                      }`}
                                    >
                                      <span className="hidden sm:inline">← Previous</span>
                                      <span className="sm:hidden">←</span>
                                    </button>

                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                      {[...Array(Math.min(totalPages, isMobile ? 3 : 5))].map((_, index) => {
                                        let pageNum;
                                        const maxPages = isMobile ? 3 : 5;
                                        if (totalPages <= maxPages) {
                                          pageNum = index + 1;
                                        } else if (currentPage <= Math.ceil(maxPages/2)) {
                                          pageNum = index + 1;
                                        } else if (currentPage >= totalPages - Math.floor(maxPages/2)) {
                                          pageNum = totalPages - maxPages + 1 + index;
                                        } else {
                                          pageNum = currentPage - Math.floor(maxPages/2) + index;
                                        }

                                        if (pageNum < 1 || pageNum > totalPages) return null;

                                        return (
                                          <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl font-semibold transition-all duration-300 touch-manipulation text-sm ${
                                              currentPage === pageNum
                                                ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white'
                                                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                            }`}
                                          >
                                            {pageNum}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    <button
                                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                      disabled={currentPage === totalPages}
                                      className={`flex items-center px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-300 touch-manipulation text-sm ${
                                        currentPage === totalPages
                                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transform hover:scale-105'
                                      }`}
                                    >
                                      <span className="hidden sm:inline">Next →</span>
                                      <span className="sm:hidden">→</span>
                                    </button>
                                  </div>

                                  <div className="text-center text-gray-300 text-xs sm:text-sm">
                                    Page {currentPage} of {totalPages} • {filteredMembers.length} total members
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </>
                    ) : (
                      /* Enhanced Followers/Following Grid */
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                          {getCurrentUsers().map((user) => (
                            <UserCard key={user.uid} user={user} />
                          ))}
                        </div>
                        
                        {/* Enhanced Pagination Controls for followers/following */}
                        {!searchTerm && <PaginationControls />}
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        select option {
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
        }

        /* Touch optimization */
        @media (max-width: 640px) {
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
        }

        /* Extra small breakpoint */
        @media (min-width: 475px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
};

export default FollowersFollowing;
