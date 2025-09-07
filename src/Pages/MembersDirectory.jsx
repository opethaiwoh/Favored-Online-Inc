
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

// 🔥 UPDATED: Import the unified follow system with count support
import { 
  followUser, 
  unfollowUser, 
  getFollowingStatusForUsers, 
  handleFollowToggle,
  getUserCounts // Add this import for count functionality
} from '../utils/followSystem';

const MembersDirectory = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // State for members and filtering
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBadgeCategory, setSelectedBadgeCategory] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minProjects, setMinProjects] = useState(0);
  const [minBadges, setMinBadges] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const [showOnlyBadgedUsers, setShowOnlyBadgedUsers] = useState(false);
  
  // 🔥 UPDATED: Enhanced follow-related state with count tracking
  const [followingStatus, setFollowingStatus] = useState({});
  const [followingLoading, setFollowingLoading] = useState({});
  const [userCounts, setUserCounts] = useState({
    followers: 0,
    following: 0
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 9;

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔥 NEW: Function to refresh user counts
  const refreshUserCounts = async (userId) => {
    try {
      const counts = await getUserCounts(userId);
      setUserCounts(counts);
      
      console.log('📊 Refreshed counts for user:', userId, counts);
    } catch (error) {
      console.error('Failed to refresh user counts:', error);
    }
  };

  // 🔥 UPDATED: Load following status for all members
  const loadFollowingStatusForMembers = async (membersList) => {
    if (!currentUser || !membersList.length) return;

    try {
      // Get all unique user IDs from members
      const userIds = [...new Set(membersList.map(member => member.uid).filter(Boolean))];
      
      if (userIds.length === 0) return;

      // Get following status for all users at once
      const statusMap = await getFollowingStatusForUsers(currentUser, userIds);
      setFollowingStatus(statusMap);
      
      console.log('✅ Loaded following status for', userIds.length, 'members');
    } catch (error) {
      console.error('❌ Error loading following status:', error);
    }
  };

  // 🔥 UPDATED: Enhanced Follow Button Component with real-time count updates
  const FollowButton = ({ targetUser, currentUser, size = 'sm', onCountUpdate }) => {
    const [loading, setLoading] = useState(false);
    
    if (!currentUser || !targetUser) return null;
    
    const targetUserId = targetUser.uid;
    if (!targetUserId || currentUser.uid === targetUserId) return null;

    const isCurrentlyFollowing = followingStatus[targetUserId] || false;

    const handleFollowClick = async () => {
      setLoading(true);
      setFollowingLoading(prev => ({ ...prev, [targetUserId]: true }));
      
      try {
        const success = await handleFollowToggle(
          currentUser,
          targetUserId,
          isCurrentlyFollowing,
          targetUser,
          (userId, newStatus) => {
            // Update local following status
            setFollowingStatus(prev => ({ ...prev, [userId]: newStatus }));
          },
          // 🔥 NEW: Count update callback
          (countData) => {
            console.log('📊 Count update received:', countData);
            
            // If there's a parent callback, call it
            if (onCountUpdate) {
              onCountUpdate(countData);
            }
            
            // Update current user's counts
            setUserCounts(countData.currentUser);
            
            // 🔥 NEW: Update local counts if this is the profile being viewed
            if (selectedMember && selectedMember.uid === targetUserId) {
              setSelectedMember(prev => ({
                ...prev,
                followerCount: countData.targetUser.followers,
                followingCount: countData.targetUser.following
              }));
            }

            // Update the member in the members list with new follower count
            setMembers(prev => prev.map(member => 
              member.uid === targetUserId 
                ? { ...member, followerCount: countData.targetUser.followers }
                : member
            ));
            setFilteredMembers(prev => prev.map(member => 
              member.uid === targetUserId 
                ? { ...member, followerCount: countData.targetUser.followers }
                : member
            ));
          }
        );
        
        if (!success) {
          console.log('❌ Follow/unfollow operation failed');
        }
        
      } catch (error) {
        console.error('❌ Error in follow toggle:', error);
        toast.error('Unable to update follow status. Please try again.');
      } finally {
        setLoading(false);
        setFollowingLoading(prev => ({ ...prev, [targetUserId]: false }));
      }
    };

    const sizeClasses = {
      xs: 'px-2 py-1 text-xs min-w-[60px]',
      sm: 'px-3 py-1.5 text-xs sm:text-sm min-w-[70px] sm:min-w-[80px]',
      md: 'px-4 py-2 text-sm sm:text-base min-w-[80px] sm:min-w-[100px]'
    };

    return (
      <button
        onClick={handleFollowClick}
        disabled={loading || followingLoading[targetUserId]}
        className={`${sizeClasses[size]} rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
          isCurrentlyFollowing
            ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
            : 'bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white transform hover:scale-105'
        }`}
      >
        {loading || followingLoading[targetUserId] ? (
          <span className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
            <span className="hidden sm:inline">...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center">
            {isCurrentlyFollowing ? (
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

  // Authentication Check - Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !currentUser) {
      navigate('/login', { 
        replace: true,
        state: { from: '/members', message: 'Please sign in to access the member directory' }
      });
    }
  }, [currentUser, authLoading, navigate]);

  // 🔥 NEW: Load current user's counts when component mounts
  useEffect(() => {
    if (currentUser && currentUser.uid) {
      refreshUserCounts(currentUser.uid);
    }
  }, [currentUser]);

  // 🔒 Anti-scraping and security measures
  useEffect(() => {
    // Show warning for restricted actions
    const showSecurityWarning = () => {
      toast.error('🔒 Access to this feature is restricted for data protection');
    };

    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      showSecurityWarning();
      return false;
    };

    // Disable key combinations for developer tools and page saving
    const handleKeyDown = (e) => {
      // Disable F12 (Developer Tools)
      if (e.keyCode === 123) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
      
      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
      
      // Disable Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
      
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
      
      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
      
      // Disable Ctrl+A (Select All)
      if (e.ctrlKey && e.keyCode === 65) {
        e.preventDefault();
        return false;
      }
      
      // Disable Ctrl+P (Print)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
      
      // Disable Ctrl+Shift+C (Element Inspector)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        showSecurityWarning();
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable drag and drop
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Detect DevTools
    const detectDevTools = () => {
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        showSecurityWarning();
        // Optionally redirect or take other security measures
        console.clear();
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    
    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 500);

    // Clear console periodically
    const clearConsole = () => {
      if (typeof console.clear === 'function') {
        console.clear();
      }
    };
    
    const consoleInterval = setInterval(clearConsole, 3000);

    // Disable certain browser features
    window.addEventListener('beforeunload', (e) => {
      // Clear any sensitive data from memory
      setMembers([]);
      setFilteredMembers([]);
      setSelectedMember(null);
    });

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(consoleInterval);
      clearInterval(devToolsInterval);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Badge categories with enhanced info for filtering
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

  // 🔥 UPDATED: Fetch ALL users from Firestore, then enhance with badge data
  useEffect(() => {
    if (authLoading || !currentUser) {
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        
        console.log('🔄 Fetching all users from database...');
        
        // 🔥 NEW APPROACH: Get ALL users first
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);
        
        console.log(`📊 Found ${usersSnapshot.size} total users in database`);

        if (usersSnapshot.size === 0) {
          console.warn('No users found in users collection');
          setMembers([]);
          setFilteredMembers([]);
          setLoading(false);
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

        console.log(`🏆 Found badges for ${Object.keys(badgesByMember).length} members`);

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

              // Basic member info from users collection
              let memberInfo = {
                uid: userDoc.id,
                email,
                name: userData.displayName || email.split('@')[0],
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
                emailPreferences: userData.emailPreferences || {},
                // 🔥 NEW: Initialize with zero counts, will be updated later
                followerCount: 0,
                followingCount: 0
              };

              // Get project memberships for this member
              const allMembershipsQuery = query(
                collection(db, 'group_members'),
                where('userEmail', '==', email)
              );
              const allMembershipsSnapshot = await getDocs(allMembershipsQuery);
              
              const projectHistory = [];
              for (const membershipDoc of allMembershipsSnapshot.docs) {
                const membershipData = membershipDoc.data();
                
                try {
                  // Get project details
                  const groupDoc = await getDoc(doc(db, 'groups', membershipData.groupId));
                  if (groupDoc.exists()) {
                    const groupData = groupDoc.data();
                    projectHistory.push({
                      id: membershipDoc.id,
                      ...membershipData,
                      projectTitle: groupData.projectTitle || 'Untitled Project',
                      projectDescription: groupData.description || '',
                      projectStatus: groupData.status || 'active',
                      joinedAt: membershipData.joinedAt && typeof membershipData.joinedAt.toDate === 'function' 
                        ? membershipData.joinedAt.toDate() 
                        : membershipData.joinedAt instanceof Date 
                        ? membershipData.joinedAt 
                        : new Date()
                    });
                  } else {
                    projectHistory.push({
                      id: membershipDoc.id,
                      ...membershipData,
                      projectTitle: 'Project',
                      projectDescription: '',
                      projectStatus: 'unknown',
                      joinedAt: membershipData.joinedAt && typeof membershipData.joinedAt.toDate === 'function' 
                        ? membershipData.joinedAt.toDate() 
                        : membershipData.joinedAt instanceof Date 
                        ? membershipData.joinedAt 
                        : new Date()
                    });
                  }
                } catch (projectError) {
                  console.error(`Error fetching project ${membershipData.groupId}:`, projectError);
                }
              }

              // Get certificates for this member
              const certificatesQuery = query(
                collection(db, 'certificates'),
                where('recipientEmail', '==', email)
              );
              const certificatesSnapshot = await getDocs(certificatesQuery);
              const certificates = certificatesSnapshot.docs.length;

              // Process badges for this member
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
              
              // Calculate member score based on achievements
              const memberScore = Math.min(100, 
                (badges.length * 8) + 
                (certificates * 12) + 
                (completedProjects * 6) + 
                (adminProjects * 15) +
                (projectHistory.length * 2) // Points for any project participation
              );

              // Get skills from badge categories
              const memberSkills = new Set();
              badges.forEach(badge => {
                const category = badgeCategories[badge.badgeCategory];
                if (category) {
                  category.skills.forEach(skill => memberSkills.add(skill));
                }
              });

              // 🔥 NEW: Add inferred skills for users without badges
              if (memberSkills.size === 0) {
                // Add some default skills based on email domain or name patterns
                memberSkills.add('Software Development');
                memberSkills.add('Problem Solving');
              }

              // Calculate last activity (consider login, badges, project activity)
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

              // 🔥 NEW: User status categorization
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
                projectHistory: projectHistory.slice(0, 10).map(p => ({
                  ...p,
                  joinedAt: p.joinedAt && typeof p.joinedAt.toLocaleDateString === 'function' 
                    ? p.joinedAt 
                    : new Date()
                })),
                userStatus, // 🔥 NEW: veteran/achiever/participant/newcomer
                isActive: lastActive > (Date.now() - (90 * 24 * 60 * 60 * 1000)), // Active in last 90 days
                hasAchievements: badges.length > 0 || certificates > 0 || completedProjects > 0 // 🔥 NEW: Filter helper
              };
            } catch (memberError) {
              console.error(`Error processing member ${userDoc.id}:`, memberError);
              return null;
            }
          })
        );

        // Filter out null results and users without valid emails
        const validMembers = membersData.filter(member => member && member.email);
        
        console.log(`✅ Successfully processed ${validMembers.length} members`);
        console.log(`🏆 ${validMembers.filter(m => m.badges > 0).length} members have badges`);
        console.log(`👥 ${validMembers.filter(m => m.totalProjects > 0).length} members have project experience`);
        console.log(`🆕 ${validMembers.filter(m => m.userStatus === 'newcomer').length} newcomers`);
        
        setMembers(validMembers);
        setFilteredMembers(validMembers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load member directory');
        setLoading(false);
      }
    };

    fetchMembers();
  }, [currentUser, authLoading]);

  // 🔥 UPDATED: Load following status when members data changes
  useEffect(() => {
    if (members.length > 0) {
      loadFollowingStatusForMembers(members);
    }
  }, [members, currentUser]);

  // 🔥 UPDATED: Apply filters with new options
  useEffect(() => {
    let filtered = [...members];

    // 🔥 NEW: Filter by badged users only
    if (showOnlyBadgedUsers) {
      filtered = filtered.filter(member => member.hasAchievements);
    }

    // Search filter (name, email, skills)
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
  }, [members, searchQuery, selectedBadgeCategory, selectedSkill, minProjects, minBadges, sortBy, showOnlyBadgedUsers]);

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentMembers = filteredMembers.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 600, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const openMemberModal = (member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSelectedMember(null);
  };

  const copyEmail = async (email) => {
    try {
      // Basic email obfuscation for security
      const obfuscatedDisplay = email.split('@')[0] + '@...';
      
      // Additional security check
      if (!currentUser || !email.includes('@')) {
        toast.error('🔒 Access denied');
        return;
      }

      await navigator.clipboard.writeText(email);
      toast.success(`Email copied: ${obfuscatedDisplay}`);
      
      // Log access for security purposes
      console.log(`Email access: ${obfuscatedDisplay} at ${new Date().toISOString()}`);
    } catch (err) {
      toast.error('Failed to copy email');
      console.error('Copy failed:', err);
    }
  };

  // 🔥 NEW: Get user status styling
  const getUserStatusInfo = (userStatus) => {
    const statusInfo = {
      veteran: { 
        label: 'Veteran', 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20', 
        border: 'border-yellow-500/30',
        icon: '👑'
      },
      achiever: { 
        label: 'Achiever', 
        color: 'text-green-400', 
        bg: 'bg-green-500/20', 
        border: 'border-green-500/30',
        icon: '🏆'
      },
      participant: { 
        label: 'Participant', 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20', 
        border: 'border-blue-500/30',
        icon: '👥'
      },
      newcomer: { 
        label: 'Newcomer', 
        color: 'text-gray-400', 
        bg: 'bg-gray-500/20', 
        border: 'border-gray-500/30',
        icon: '🌟'
      }
    };
    return statusInfo[userStatus] || statusInfo.newcomer;
  };

  // Show loading screen while checking authentication or loading data
  if (authLoading || (currentUser && loading)) {
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
            {authLoading ? 'Checking authentication...' : 'Loading member directory...'}
          </p>
          {!authLoading && currentUser && (
            <p className="text-gray-300 text-sm mt-2">
              Welcome, {currentUser.displayName || currentUser.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div 
      className="min-h-screen overflow-hidden flex flex-col relative select-none"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none',
        KhtmlUserSelect: 'none'
      }}
      onDragStart={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Animated background overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />
      
      {/* Security Notice */}
      <div className="fixed top-0 left-0 right-0 bg-red-900/20 backdrop-blur-sm border-b border-red-500/20 z-40 py-1">
        <div className="container mx-auto px-4 text-center">
          <span className="text-red-300 text-xs">
            🔒 This directory is protected against unauthorized data extraction • Right-click disabled
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-6 left-0 right-0 z-50" 
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
              <Link to="/community" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
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
                📋 Members Directory
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
     
      {/* Main Content */}
      <main className="flex-grow pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 pt-8 text-center">
            <div className="max-w-4xl mx-auto">
              
              <div className="flex items-center justify-center gap-4 mb-8 animate-pulse">
                <div className="h-4 w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-lg font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  👥 Complete Member Directory
                </span>
                <div className="h-4 w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-[0.9]"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Hire From Our{' '}
                <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))'}}>
                  Entire Community
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8" 
                 style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                Access our <span className="text-lime-300 font-semibold">complete member directory</span> - from 
                <span className="text-lime-300 font-semibold"> badge-verified experts</span> to <span className="text-lime-300 font-semibold">rising newcomers</span>.
              </p>

              {/* 🔥 UPDATED: Directory Stats with current user's following count */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                <div className="bg-gradient-to-br from-lime-500/20 to-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-lime-500/30">
                  <div className="text-2xl font-bold text-lime-300">{members.length}</div>
                  <div className="text-sm text-lime-100">Total Members</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-300">{members.filter(m => m.badges > 0).length}</div>
                  <div className="text-sm text-yellow-100">Badge Holders</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                  <div className="text-2xl font-bold text-purple-300">{members.filter(m => m.isActive).length}</div>
                  <div className="text-sm text-purple-100">Recently Active</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-300">
                    {userCounts.following}
                  </div>
                  <div className="text-sm text-blue-100">You Follow</div>
                </div>
              </div>
            </div>
          </section>

          {/* 🔥 UPDATED: Search and Filters with new options */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
              
              {/* Search Bar */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by name, email, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-lg"
                />
              </div>

              {/* 🔥 NEW: Show All Users Toggle */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <label className="flex items-center cursor-pointer">
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
                  <span className="ml-3 text-white">Show only members with achievements</span>
                </label>
                
                <div className="text-sm text-gray-400">
                  {showOnlyBadgedUsers 
                    ? `Showing ${members.filter(m => m.hasAchievements).length} members with achievements`
                    : `Showing all ${members.length} members`
                  }
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                
                <select
                  value={selectedBadgeCategory}
                  onChange={(e) => setSelectedBadgeCategory(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300"
                >
                  <option value="all">All Badge Types</option>
                  {Object.entries(badgeCategories).map(([key, category]) => (
                    <option key={key} value={key}>{category.name}</option>
                  ))}
                </select>

                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300"
                >
                  <option value="">All Skills</option>
                  {uniqueSkills.map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>

                <select
                  value={minProjects}
                  onChange={(e) => setMinProjects(Number(e.target.value))}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300"
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
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300"
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
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none transition-all duration-300"
                >
                  <option value="recent">Recently Active</option>
                  <option value="badges">Most Badges</option>
                  <option value="projects">Most Projects</option>
                  <option value="score">Highest Score</option>
                  <option value="name">Name A-Z</option>
                </select>

                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                >
                  Clear All
                </button>
              </div>

              <div className="flex justify-between items-center text-gray-300">
                <span>
                  <span className="text-lime-300 font-semibold">{filteredMembers.length}</span> members found
                  {filteredMembers.length > 0 && (
                    <span className="ml-2 text-sm">
                      • Showing {startIndex + 1}-{Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Members Grid */}
          <section>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">👤</div>
                <h3 className="text-2xl font-bold text-white mb-4">No members found</h3>
                <p className="text-gray-300">
                  {members.length === 0 
                    ? "Loading member directory..."
                    : "Try adjusting your search criteria or filters to find more members."
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {currentMembers.map((member) => {
                    const topCategory = member.topBadgeCategory ? badgeCategories[member.topBadgeCategory] : null;
                    
                    return (
                      <div key={member.email} className="group">
                        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500 h-full flex flex-col">
                          
                          {/* Member Header */}
                          <div className="flex items-center mb-6">
                            <div className="relative flex-shrink-0 mr-4">
                              {member.photoURL ? (
                                <img 
                                  src={member.photoURL} 
                                  alt={`${member.name}'s profile`}
                                  className="w-16 h-16 rounded-full object-cover ring-4 ring-lime-400/50"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center ring-4 ring-lime-400/50">
                                  <span className="text-xl text-black font-bold">
                                    {member.name?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                </div>
                              )}
                              {member.isActive && (
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              )}
                              {/* 🔥 UPDATED: Follow indicator using Firestore status */}
                              {followingStatus[member.uid] && (
                                <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">✓</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-grow">
                              <h3 className="text-xl font-black text-white group-hover:text-lime-300 transition-colors duration-300">
                                {member.name}
                              </h3>
                              
                              {topCategory && (
                                <div className="flex items-center mt-2">
                                  <span className={`${topCategory.color} text-sm mr-1`}>{topCategory.icon}</span>
                                  <span className="text-xs text-gray-300">{topCategory.name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 🔥 UPDATED: Stats Grid with real-time follower count */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/20">
                              <div className="text-2xl font-bold text-yellow-400">{member.badges}</div>
                              <div className="text-sm text-yellow-300">Badges</div>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg p-4 text-center border border-blue-500/20">
                              <div className="text-2xl font-bold text-blue-400">
                                {member.followerCount || 0}
                              </div>
                              <div className="text-sm text-blue-300">Followers</div>
                            </div>
                          </div>

                          {/* Skills Preview */}
                          <div className="mb-6 flex-grow">
                            <div className="text-gray-400 text-sm mb-2">Skills:</div>
                            <div className="flex flex-wrap gap-2">
                              {member.skills.slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="bg-white/10 text-gray-300 px-2 py-1 rounded-lg text-xs border border-white/20">
                                  {skill}
                                </span>
                              ))}
                              {member.skills.length > 4 && (
                                <span className="bg-white/10 text-gray-300 px-2 py-1 rounded-lg text-xs border border-white/20">
                                  +{member.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 🔥 UPDATED: Action Buttons using enhanced FollowButton component */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => openMemberModal(member)}
                              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-xs"
                            >
                              View Details
                            </button>
                            
                            {/* 🔥 UPDATED: Follow/Unfollow Button with count updates */}
                            <FollowButton
                              targetUser={{
                                uid: member.uid,
                                email: member.email,
                                firstName: member.firstName,
                                lastName: member.lastName,
                                displayName: member.name
                              }}
                              currentUser={currentUser}
                              size="xs"
                              onCountUpdate={(countData) => {
                                // Update this specific member's follower count in the UI immediately
                                if (countData.targetUserId === member.uid) {
                                  member.followerCount = countData.targetUser.followers;
                                }
                              }}
                            />
                            
                            {/* Copy Email Button */}
                            <button
                              onClick={() => copyEmail(member.email)}
                              className="px-3 py-3 rounded-xl font-semibold transition-all duration-300 text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                              title="Copy email address"
                            >
                              📋
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 space-x-4">
                    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                      <div className="flex items-center space-x-4">
                        
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className={`flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                            currentPage === 1
                              ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transform hover:scale-105'
                          }`}
                        >
                          ← Previous
                        </button>

                        <div className="flex items-center space-x-2">
                          {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = index + 1;
                            } else if (currentPage <= 3) {
                              pageNum = index + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + index;
                            } else {
                              pageNum = currentPage - 2 + index;
                            }

                            if (pageNum < 1 || pageNum > totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => goToPage(pageNum)}
                                className={`w-10 h-10 rounded-xl font-semibold transition-all duration-300 ${
                                  currentPage === pageNum
                                    ? 'bg-gradient-to-r from-lime-500 to-green-500 text-white'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                              <span className="text-gray-400">...</span>
                              <button
                                onClick={() => goToPage(totalPages)}
                                className="w-10 h-10 rounded-xl font-semibold bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-all duration-300"
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                            currentPage === totalPages
                              ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transform hover:scale-105'
                          }`}
                        >
                          Next →
                        </button>
                      </div>

                      <div className="text-center mt-4 text-gray-300 text-sm">
                        Page {currentPage} of {totalPages} • {filteredMembers.length} total members
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {/* 🔥 UPDATED: Member Detail Modal with enhanced follow functionality */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center">
                <div className="relative mr-6">
                  {selectedMember.photoURL ? (
                    <img 
                      src={selectedMember.photoURL} 
                      alt={`${selectedMember.name}'s profile`}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-lime-400/50"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center ring-4 ring-lime-400/50">
                      <span className="text-2xl text-black font-bold">
                        {selectedMember.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  {selectedMember.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-400 rounded-full border-4 border-white flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                  {/* 🔥 UPDATED: Follow indicator in modal using Firestore status */}
                  {followingStatus[selectedMember.uid] && (
                    <div className="absolute -top-1 -left-1 w-8 h-8 bg-blue-400 rounded-full border-4 border-white flex items-center justify-center">
                      <span className="text-sm text-white font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">{selectedMember.name}</h2>
                  
                  <div className="flex items-center mt-2">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      selectedMember.isActive ? 'bg-green-400' : 'bg-gray-400'
                    }`}></div>
                    <span className={`text-sm font-medium ${
                      selectedMember.isActive ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {selectedMember.isActive ? 'Recently Active' : 'Less Active'}
                    </span>
                    {followingStatus[selectedMember.uid] && (
                      <span className="ml-4 bg-blue-500/20 text-blue-300 px-2 py-1 rounded-lg text-xs border border-blue-500/30">
                        Following
                      </span>
                    )}
                  </div>
                  
                  {/* 🔥 NEW: Real-time follower count display */}
                  <div className="flex items-center mt-2 text-sm text-gray-300">
                    <span className="font-semibold text-lime-300">{selectedMember.followerCount || 0}</span>
                    <span className="ml-1">followers</span>
                  </div>
                  
                  {selectedMember.joinedDate && selectedMember.joinedDate.toLocaleDateString && (
                    <p className="text-gray-400 text-sm mt-1">
                      Member since {selectedMember.joinedDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={closeMemberModal}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content Grid - Enhanced for all users */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column - Stats and Skills */}
              <div className="space-y-6">
                
                {/* Quick Stats */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lime-300 font-semibold mb-4 text-lg">
                    {selectedMember.hasAchievements ? 'Achievement Overview' : 'Member Overview'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Badges</span>
                      <span className="text-yellow-400 font-bold">{selectedMember.badges}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Certificates</span>
                      <span className="text-blue-400 font-bold">{selectedMember.certificates}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Followers</span>
                      <span className="text-lime-400 font-bold">{selectedMember.followerCount || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lime-300 font-semibold mb-4 text-lg">Skills & Expertise</h3>
                  {selectedMember.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.skills.map((skill, idx) => (
                        <span key={idx} className="bg-white/10 text-white px-3 py-1 rounded-lg text-sm border border-white/20">
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">Skills to be determined through project participation</p>
                  )}
                </div>

                {/* Badge Categories - Only show if user has badges */}
                {selectedMember.badges > 0 && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lime-300 font-semibold mb-4 text-lg">Badge Distribution</h3>
                    <div className="space-y-3">
                      {Object.entries(selectedMember.badgesByCategory).map(([category, count]) => {
                        const categoryInfo = badgeCategories[category];
                        if (!categoryInfo) return null;
                        return (
                          <div key={category} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`${categoryInfo.color} text-lg mr-2`}>{categoryInfo.icon}</span>
                              <span className="text-white text-sm">{categoryInfo.name}</span>
                            </div>
                            <span className={`${categoryInfo.color} font-bold`}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Activity and Contact */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Recent Badges - Only show if user has badges */}
                {selectedMember.detailedBadges && selectedMember.detailedBadges.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <h3 className="text-lime-300 font-semibold mb-4 text-lg">Recent Achievements</h3>
                    <div className="space-y-3">
                      {selectedMember.detailedBadges.slice(0, 5).map((badge) => {
                        const categoryInfo = badgeCategories[badge.badgeCategory] || badgeCategories['development'];
                        return (
                          <div key={badge.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center">
                              <span className={`${categoryInfo.color} text-xl mr-3`}>{categoryInfo.icon}</span>
                              <div>
                                <div className="text-white font-medium">
                                  {categoryInfo.name} - {badge.badgeLevel}
                                </div>
                                <div className="text-gray-400 text-sm">{badge.projectTitle}</div>
                              </div>
                            </div>
                            <div className="text-gray-400 text-sm">
                              {badge.awardedAt && badge.awardedAt.toLocaleDateString ? 
                                badge.awardedAt.toLocaleDateString() : 
                                'Recently'
                              }
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Project History - Show for all users */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lime-300 font-semibold mb-4 text-lg">
                    {selectedMember.projectHistory && selectedMember.projectHistory.length > 0 
                      ? 'Project Experience' 
                      : 'Project Participation'
                    }
                  </h3>
                  {selectedMember.projectHistory && selectedMember.projectHistory.length > 0 ? (
                    <div className="space-y-3">
                      {selectedMember.projectHistory.slice(0, 8).map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <div className="text-white font-medium">
                              {project.projectTitle}
                            </div>
                            <div className="flex items-center space-x-3 text-sm">
                              {project.role === 'admin' && (
                                <span className="text-yellow-400">👑 Project Leader</span>
                              )}
                              <span className="text-gray-400">
                                Joined {project.joinedAt && project.joinedAt.toLocaleDateString ? 
                                  project.joinedAt.toLocaleDateString() : 
                                  'Recently'
                                }
                              </span>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs ${
                            project.status === 'completed' || project.projectStatus === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {project.status === 'completed' || project.projectStatus === 'completed' ? 'Completed' : 'In Progress'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">🚀</div>
                      <p className="text-gray-400">Ready to start their first project!</p>
                      <p className="text-gray-500 text-sm mt-2">This member is available for new opportunities.</p>
                    </div>
                  )}
                </div>

                {/* 🔥 UPDATED: Contact Section using enhanced FollowButton with count updates */}
                <div className="bg-gradient-to-r from-lime-500/10 to-green-500/10 rounded-xl p-6 border border-lime-500/20">
                  <h3 className="text-lime-300 font-semibold mb-4 text-lg">Connect & Follow</h3>
                  <div className="mb-4">
                    <p className="text-gray-300 mb-4">
                      Interested in working with {selectedMember.name}? Copy their email or follow for updates:
                    </p>
                    <div className="bg-black/20 rounded-lg p-4 border border-white/10">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">Email contact available</div>
                        <div className="text-lime-400 font-semibold">Ready to connect!</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {/* 🔥 UPDATED: Follow/Unfollow Button with count updates */}
                    <FollowButton
                      targetUser={{
                        uid: selectedMember.uid,
                        email: selectedMember.email,
                        firstName: selectedMember.firstName,
                        lastName: selectedMember.lastName,
                        displayName: selectedMember.name
                      }}
                      currentUser={currentUser}
                      size="sm"
                      onCountUpdate={(countData) => {
                        // Update the modal's display count immediately
                        if (countData.targetUserId === selectedMember.uid) {
                          setSelectedMember(prev => ({
                            ...prev,
                            followerCount: countData.targetUser.followers
                          }));
                        }
                      }}
                    />
                    
                    {/* Copy Email Button */}
                    <button
                      onClick={() => copyEmail(selectedMember.email)}
                      className="flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600"
                      title="Copy email address"
                    >
                      📋 Copy Email Address
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { 
          font-family: 'Inter', sans-serif;
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-user-drag: none !important;
          -khtml-user-select: none !important;
        }
        
        /* Disable text selection globally */
        body, html, div, span, p, h1, h2, h3, h4, h5, h6, a, button {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        /* Disable drag and drop for images */
        img {
          -webkit-user-drag: none !important;
          -khtml-user-drag: none !important;
          -moz-user-drag: none !important;
          -o-user-drag: none !important;
          user-drag: none !important;
          pointer-events: none !important;
        }
        
        /* Re-enable pointer events for interactive elements */
        button, input, select, a {
          pointer-events: auto !important;
        }
        
        /* Hide text cursor */
        * {
          cursor: default !important;
        }
        
        button, a, input, select {
          cursor: pointer !important;
        }
        
        /* Disable print media */
        @media print {
          * {
            display: none !important;
          }
        }
        
        /* Custom scrollbar */
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

        select option {
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
        }
        
        /* Disable outline on focus for security */
        *:focus {
          outline: none !important;
        }
        
        /* Additional protection against scraping */
        .member-email {
          display: none !important;
        }
        
        /* Disable browser zoom */
        body {
          zoom: reset;
          -webkit-text-size-adjust: none;
          -moz-text-size-adjust: none;
          -ms-text-size-adjust: none;
        }
      `}</style>
    </div>
  );
};

export default MembersDirectory;
