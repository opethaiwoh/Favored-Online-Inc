// src/Pages/user/UserProfile.jsx - FIXED VERSION - Handle both UID and Email
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const UserProfile = () => {
  const { userEmail } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // 🔥 FIX 1: Handle both UID and Email parameters
  const userParam = userEmail ? decodeURIComponent(userEmail).trim() : '';
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    photoURL: null,
    joinedDate: null,
    certificatesEarned: 0,
    badgesEarned: 0,
    projectsCompleted: 0,
    ongoingProjects: 0,
    followerCount: 0,
    followingCount: 0,
    firstName: '',
    lastName: '',
    displayName: '',
    initials: '',
    profile: {}
  });
  const [recentBadges, setRecentBadges] = useState([]);
  const [recentCertificates, setRecentCertificates] = useState([]);
  const [projectHistory, setProjectHistory] = useState([]);
  const [badgesByCategory, setBadgesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(true);
  const [debugInfo, setDebugInfo] = useState([]); 
  
  // Follow functionality
  const [followedUsers, setFollowedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(`followedUsers_${currentUser?.uid}`);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading followed users:', error);
      return [];
    }
  });
  
  const [followLoading, setFollowLoading] = useState(false);

  // 🔥 FIX 2: Enhanced detection for UID vs Email
  const isValidEmail = (str) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  };

  const isUID = (str) => {
    // Firebase UIDs are typically 28 characters long and alphanumeric
    return str && str.length > 20 && !str.includes('@') && !str.includes('.');
  };

  // 🔥 FIX 3: Enhanced user search that handles both UID and Email
  const searchUserInFirestore = async (param) => {
    const normalizedParam = param.toLowerCase().trim();
    
    try {
      console.log('🔍 Starting search for parameter:', param);
      setDebugInfo([`Starting search for: ${param}`]);

      // Strategy 1: If it looks like a UID, search by UID first
      if (isUID(param)) {
        console.log('🔍 Detected UID format, searching users by UID:', param);
        setDebugInfo(prev => [...prev, `Detected UID format: ${param}`]);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', param));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ Found user by UID:', userData);
            setDebugInfo(prev => [...prev, `Found user by UID`]);
            return { found: true, source: 'users_by_uid', data: { ...userData, uid: param } };
          }
        } catch (error) {
          console.log('❌ UID search failed:', error.message);
          setDebugInfo(prev => [...prev, `UID search failed: ${error.message}`]);
        }

        // If UID search fails, try searching in other collections
        console.log('🔍 UID direct search failed, trying users collection query');
        const uidQuery = query(
          collection(db, 'users'),
          where('uid', '==', param),
          limit(1)
        );
        const uidSnapshot = await getDocs(uidQuery);
        
        if (!uidSnapshot.empty) {
          const userData = uidSnapshot.docs[0].data();
          console.log('✅ Found user by UID query:', userData);
          setDebugInfo(prev => [...prev, `Found user by UID query`]);
          return { found: true, source: 'users_uid_query', data: userData };
        }
      }

      // Strategy 2: If it looks like an email, search by email
      if (isValidEmail(param)) {
        console.log('🔍 Detected email format, searching by email:', param);
        setDebugInfo(prev => [...prev, `Detected email format: ${param}`]);
        
        const emailQuery = query(
          collection(db, 'users'),
          where('email', '==', normalizedParam),
          limit(1)
        );
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const userData = emailSnapshot.docs[0].data();
          console.log('✅ Found user by email:', userData);
          setDebugInfo(prev => [...prev, `Found user by email`]);
          return { found: true, source: 'users_by_email', data: userData };
        }
      }

      // Strategy 3: Fallback - search all collections for any match
      console.log('🔍 Fallback search in all collections');
      setDebugInfo(prev => [...prev, `Fallback search starting`]);
      
      // Search in users collection (case-insensitive)
      const allUsersQuery = query(collection(db, 'users'));
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      for (const docSnapshot of allUsersSnapshot.docs) {
        const userData = docSnapshot.data();
        const docId = docSnapshot.id;
        
        // Check if matches UID, email, or displayName
        if (docId === param || 
            userData.uid === param ||
            (userData.email && userData.email.toLowerCase() === normalizedParam) ||
            (userData.displayName && userData.displayName.toLowerCase() === normalizedParam.toLowerCase())) {
          console.log('✅ Found user in fallback search:', userData);
          setDebugInfo(prev => [...prev, `Found user in fallback search`]);
          return { found: true, source: 'users_fallback', data: { ...userData, uid: docId } };
        }
      }

      // Strategy 4: Search in group_members
      console.log('🔍 Searching group_members collection');
      const memberQueries = [
        query(collection(db, 'group_members'), where('userEmail', '==', normalizedParam), limit(1)),
        query(collection(db, 'group_members'), where('userId', '==', param), limit(1))
      ];
      
      for (const memberQuery of memberQueries) {
        try {
          const memberSnapshot = await getDocs(memberQuery);
          if (!memberSnapshot.empty) {
            const memberData = memberSnapshot.docs[0].data();
            console.log('✅ Found in group_members:', memberData);
            setDebugInfo(prev => [...prev, `Found in group_members`]);
            return { found: true, source: 'group_members', data: memberData };
          }
        } catch (error) {
          console.log('Group members search error:', error);
        }
      }

      // Strategy 5: Search in member_badges
      console.log('🔍 Searching member_badges collection');
      const badgeQueries = [
        query(collection(db, 'member_badges'), where('memberEmail', '==', normalizedParam), limit(1)),
        query(collection(db, 'member_badges'), where('memberId', '==', param), limit(1))
      ];
      
      for (const badgeQuery of badgeQueries) {
        try {
          const badgeSnapshot = await getDocs(badgeQuery);
          if (!badgeSnapshot.empty) {
            const badgeData = badgeSnapshot.docs[0].data();
            console.log('✅ Found in member_badges:', badgeData);
            setDebugInfo(prev => [...prev, `Found in member_badges`]);
            return { found: true, source: 'member_badges', data: badgeData };
          }
        } catch (error) {
          console.log('Member badges search error:', error);
        }
      }

      console.log('❌ User not found in any collection');
      setDebugInfo(prev => [...prev, `User not found in any collection`]);
      return { found: false, source: null, data: null };

    } catch (error) {
      console.error('Error searching for user:', error);
      setDebugInfo(prev => [...prev, `Search error: ${error.message}`]);
      throw error;
    }
  };

  // Save followed users to localStorage
  useEffect(() => {
    if (currentUser?.uid) {
      try {
        localStorage.setItem(
          `followedUsers_${currentUser.uid}`, 
          JSON.stringify(followedUsers)
        );
      } catch (error) {
        console.error('Error saving followed users:', error);
      }
    }
  }, [followedUsers, currentUser?.uid]);

  // 🔥 FIX 4: Use email for follow status, not the original parameter
  const userEmailForFollow = userProfile.email?.toLowerCase() || '';
  const isFollowing = followedUsers.includes(userEmailForFollow);

  // Follow/Unfollow functions
  const handleFollow = () => {
    if (!followedUsers.includes(userEmailForFollow)) {
      const newFollowedUsers = [...followedUsers, userEmailForFollow];
      setFollowedUsers(newFollowedUsers);
      toast.success(`Following ${userProfile.displayName || userProfile.name}! 👥`);
    }
  };

  const handleUnfollow = () => {
    const newFollowedUsers = followedUsers.filter(email => email !== userEmailForFollow);
    setFollowedUsers(newFollowedUsers);
    toast.success(`Unfollowed ${userProfile.displayName || userProfile.name}`);
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast.error('Please login to follow users');
      return;
    }

    if (currentUser.email === userEmailForFollow) {
      toast.error("You can't follow yourself! 😊");
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        handleUnfollow();
      } else {
        handleFollow();
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Unable to update follow status. Please try again.');
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // ProfileStats Component
  const ProfileStats = ({ userEmail, followerCount, followingCount }) => {
    const navigate = useNavigate();
    
    return (
      <div className="flex items-center space-x-6">
        <button 
          onClick={() => navigate(`/profile/${encodeURIComponent(userEmail)}/followers`)}
          className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors group"
        >
          <div className="text-2xl font-bold text-lime-400 group-hover:text-lime-300">
            {followerCount || 0}
          </div>
          <div className="text-sm text-gray-400 group-hover:text-white">
            Followers
          </div>
        </button>
        
        <button 
          onClick={() => navigate(`/profile/${encodeURIComponent(userEmail)}/following`)}
          className="text-center hover:bg-white/10 p-3 rounded-lg transition-colors group"
        >
          <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300">
            {followingCount || 0}
          </div>
          <div className="text-sm text-gray-400 group-hover:text-white">
            Following
          </div>
        </button>
      </div>
    );
  };

  // Badge categories mapping
  const badgeCategories = {
    'mentorship': { name: 'TechMO', icon: '🏆', color: 'text-yellow-400', bgColor: 'from-yellow-500/20 to-yellow-600/20', borderColor: 'border-yellow-500/30' },
    'quality-assurance': { name: 'TechQA', icon: '🔍', color: 'text-blue-400', bgColor: 'from-blue-500/20 to-blue-600/20', borderColor: 'border-blue-500/30' },
    'development': { name: 'TechDev', icon: '💻', color: 'text-green-400', bgColor: 'from-green-500/20 to-green-600/20', borderColor: 'border-green-500/30' },
    'leadership': { name: 'TechLeads', icon: '👑', color: 'text-purple-400', bgColor: 'from-purple-500/20 to-purple-600/20', borderColor: 'border-purple-500/30' },
    'design': { name: 'TechArchs', icon: '🎨', color: 'text-orange-400', bgColor: 'from-orange-500/20 to-orange-600/20', borderColor: 'border-orange-500/30' },
    'security': { name: 'TechGuard', icon: '🛡️', color: 'text-red-400', bgColor: 'from-red-500/20 to-red-600/20', borderColor: 'border-red-500/30' }
  };

  const getBadgeLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'novice': return 'text-orange-400';
      case 'beginners': return 'text-blue-400';
      case 'intermediate': return 'text-purple-400';
      case 'expert': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  // 🔥 FIX 5: Enhanced user profile fetching with both UID and Email support
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setDebugInfo([`Starting search for parameter: ${userParam}`]);

        // Validate parameter
        if (!userParam) {
          console.error('❌ No parameter provided in URL');
          setDebugInfo(prev => [...prev, 'No parameter provided in URL']);
          setUserExists(false);
          setLoading(false);
          return;
        }

        // Search for user using enhanced strategy
        const searchResult = await searchUserInFirestore(userParam);
        
        if (!searchResult.found) {
          console.log('❌ User not found anywhere');
          setDebugInfo(prev => [...prev, 'User not found in any collection']);
          setUserExists(false);
          setLoading(false);
          return;
        }

        // Set user profile based on found data
        const userData = searchResult.data;
        const emailToUse = userData.email || userData.userEmail || userData.memberEmail || '';
        const uidToUse = userData.uid || userParam;
        
        setUserProfile(prev => ({
          ...prev,
          name: userData.displayName || 
                userData.userName ||
                (userData.firstName && userData.lastName 
                  ? `${userData.firstName} ${userData.lastName}` 
                  : emailToUse.split('@')[0] || 'Unknown User'),
          email: emailToUse,
          photoURL: userData.photoURL || userData.userPhoto || null,
          joinedDate: userData.createdAt?.toDate() || userData.joinedAt?.toDate() || null,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || userData.userName || '',
          initials: userData.initials || '',
          profile: userData.profile || {},
          uid: uidToUse
        }));

        setDebugInfo(prev => [...prev, `Found user via: ${searchResult.source}`]);

        // Use email for queries if available, otherwise use UID
        const queryIdentifier = emailToUse || uidToUse;
        const queryType = emailToUse ? 'email' : 'uid';

        // Fetch user badges with real-time updates
        let badgesQuery;
        if (queryType === 'email') {
          badgesQuery = query(
            collection(db, 'member_badges'),
            where('memberEmail', '==', queryIdentifier),
            orderBy('awardedAt', 'desc')
          );
        } else {
          badgesQuery = query(
            collection(db, 'member_badges'),
            where('memberId', '==', queryIdentifier),
            orderBy('awardedAt', 'desc')
          );
        }

        const badgesUnsubscribe = onSnapshot(badgesQuery, (snapshot) => {
          const badges = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            awardedAt: doc.data().awardedAt?.toDate() || new Date()
          }));
          
          console.log(`🏆 Found ${badges.length} badges for user`);
          setDebugInfo(prev => [...prev, `Found ${badges.length} badges`]);
          setRecentBadges(badges.slice(0, 5));
          
          const categoryCount = badges.reduce((acc, badge) => {
            const category = badge.badgeCategory || 'other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {});
          setBadgesByCategory(categoryCount);
          
          setUserProfile(prev => ({
            ...prev,
            badgesEarned: badges.length,
            projectsCompleted: new Set(badges.map(b => b.groupId)).size
          }));
        }, (error) => {
          console.error('Error fetching badges:', error);
          setDebugInfo(prev => [...prev, `Badge fetch error: ${error.message}`]);
        });

        // Fetch certificates
        let certificatesQuery;
        if (queryType === 'email') {
          certificatesQuery = query(
            collection(db, 'certificates'),
            where('recipientEmail', '==', queryIdentifier),
            orderBy('generatedAt', 'desc')
          );
        } else {
          certificatesQuery = query(
            collection(db, 'certificates'),
            where('recipientId', '==', queryIdentifier),
            orderBy('generatedAt', 'desc')
          );
        }

        const certificatesUnsubscribe = onSnapshot(certificatesQuery, (snapshot) => {
          const certificates = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            generatedAt: doc.data().generatedAt?.toDate() || new Date()
          }));
          
          console.log(`📜 Found ${certificates.length} certificates for user`);
          setDebugInfo(prev => [...prev, `Found ${certificates.length} certificates`]);
          setRecentCertificates(certificates.slice(0, 3));
          setUserProfile(prev => ({
            ...prev,
            certificatesEarned: certificates.length
          }));
        }, (error) => {
          console.error('Error fetching certificates:', error);
          setDebugInfo(prev => [...prev, `Certificate fetch error: ${error.message}`]);
        });

        // Fetch project history
        let projectMembersQuery;
        if (queryType === 'email') {
          projectMembersQuery = query(
            collection(db, 'group_members'),
            where('userEmail', '==', queryIdentifier),
            orderBy('joinedAt', 'desc')
          );
        } else {
          projectMembersQuery = query(
            collection(db, 'group_members'),
            where('userId', '==', queryIdentifier),
            orderBy('joinedAt', 'desc')
          );
        }

        const projectMembersUnsubscribe = onSnapshot(projectMembersQuery, async (snapshot) => {
          const memberships = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            joinedAt: doc.data().joinedAt?.toDate() || new Date()
          }));

          console.log(`🚀 Found ${memberships.length} project memberships for user`);
          setDebugInfo(prev => [...prev, `Found ${memberships.length} project memberships`]);

          const projectsWithDetails = await Promise.all(
            memberships.map(async (membership) => {
              try {
                const groupDoc = await getDoc(doc(db, 'groups', membership.groupId));
                
                if (groupDoc.exists()) {
                  const groupData = groupDoc.data();
                  return {
                    ...membership,
                    projectTitle: groupData.projectTitle || 'Untitled Project',
                    projectDescription: groupData.description || '',
                    projectStatus: groupData.status || 'active',
                    memberCount: groupData.memberCount || 0
                  };
                }
                return {
                  ...membership,
                  projectTitle: 'Project',
                  projectDescription: '',
                  projectStatus: 'unknown',
                  memberCount: 0
                };
              } catch (error) {
                console.error('Error fetching group details:', error);
                return {
                  ...membership,
                  projectTitle: 'Project',
                  projectDescription: '',
                  projectStatus: 'unknown',
                  memberCount: 0
                };
              }
            })
          );

          setProjectHistory(projectsWithDetails);
          
          const ongoingCount = projectsWithDetails.filter(
            p => p.status === 'active' && (p.projectStatus === 'active' || p.projectStatus === 'completing')
          ).length;
          
          setUserProfile(prev => ({
            ...prev,
            ongoingProjects: ongoingCount
          }));
        }, (error) => {
          console.error('Error fetching project memberships:', error);
          setDebugInfo(prev => [...prev, `Project fetch error: ${error.message}`]);
        });

        setLoading(false);

        return () => {
          badgesUnsubscribe();
          certificatesUnsubscribe();
          projectMembersUnsubscribe();
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setDebugInfo(prev => [...prev, `Profile fetch error: ${error.message}`]);
        toast.error('Failed to load user profile');
        setUserExists(false);
        setLoading(false);
      }
    };

    if (userParam) {
      fetchUserProfile();
    }
  }, [userParam]);

  // Loading state
  if (loading) {
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
          <p className="text-white text-lg">Loading profile...</p>
          <div className="text-sm text-gray-400 mt-4">
            Searching for: {userParam}
            <br />
            <span className="text-xs">
              {isUID(userParam) ? '(User ID detected)' : isValidEmail(userParam) ? '(Email detected)' : '(Unknown format)'}
            </span>
          </div>
          {/* Debug info display (remove in production) */}
          {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
            <div className="mt-4 text-xs text-left bg-black/20 p-3 rounded-lg max-w-md">
              <div className="text-gray-300 font-bold mb-2">Debug Info:</div>
              {debugInfo.map((info, index) => (
                <div key={index} className="text-gray-400">{info}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User not found state with better debugging
  if (!userExists) {
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
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-6">👤</div>
          <h2 className="text-2xl font-bold text-white mb-4">User Not Found</h2>
          <p className="text-gray-300 mb-6">
            The user profile you're looking for doesn't exist in our system. They may not have created an account yet.
          </p>
          <div className="text-sm text-gray-400 mb-2">
            Searched for: <span className="font-mono bg-black/20 px-2 py-1 rounded">{userParam}</span>
          </div>
          <div className="text-xs text-gray-500 mb-6">
            Parameter type: {isUID(userParam) ? 'User ID' : isValidEmail(userParam) ? 'Email Address' : 'Unknown Format'}
          </div>
          
          {/* Debug info in error state (remove in production) */}
          {process.env.NODE_ENV === 'development' && debugInfo.length > 0 && (
            <div className="mb-6 text-xs text-left bg-red-500/10 p-3 rounded-lg border border-red-500/20 max-w-md">
              <div className="text-red-300 font-bold mb-2">Debug Info:</div>
              {debugInfo.map((info, index) => (
                <div key={index} className="text-red-400">{info}</div>
              ))}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
            >
              ← Go Back
            </button>
            <button 
              onClick={() => navigate('/members')}
              className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
            >
              Browse Members
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Rest of the component remains the same...
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
      {/* Mouse tracking effect */}
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
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors"
              >
                ← Back
              </button>
              <Link 
                to="/dashboard" 
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                to="/members" 
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors"
              >
                Members
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Profile Header and Details */}
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
          
          {/* Profile Header */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0 mb-6 lg:mb-0">
                  <div className="relative flex-shrink-0">
                    {userProfile.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="Profile" 
                        className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-lime-400/50 shadow-2xl"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-lime-500 to-green-500 flex items-center justify-center ring-4 ring-lime-400/50 shadow-2xl">
                        <span className="text-3xl sm:text-4xl md:text-5xl text-black font-bold">
                          {userProfile.firstName && userProfile.lastName 
                            ? `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase()
                            : userProfile.initials || userProfile.name?.charAt(0)?.toUpperCase() || '?'
                          }
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      {userProfile.name}
                    </h1>
                    <p className="text-gray-300 text-lg font-medium mb-3" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {userProfile.email || 'No email available'}
                    </p>
                    {userProfile.joinedDate && (
                      <p className="text-gray-400 text-sm mb-4">
                        Member since {userProfile.joinedDate.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                    
                    {/* Follow Button */}
                    {currentUser && currentUser.email !== userEmailForFollow && userEmailForFollow && (
                      <div className="mb-4">
                        <button
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 ${
                            isFollowing
                              ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                              : 'bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white'
                          }`}
                        >
                          {followLoading ? (
                            <span className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              ...
                            </span>
                          ) : (
                            <span className="flex items-center">
                              {isFollowing ? (
                                <>
                                  <span>Following</span>
                                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span className="mr-2">+</span>
                                  <span>Follow</span>
                                </>
                              )}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                    
                    <ProfileStats 
                      userEmail={userProfile.email}
                      followerCount={userProfile.followerCount}
                      followingCount={userProfile.followingCount}
                    />
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-yellow-500/10 backdrop-blur-xl rounded-xl p-4 border border-yellow-500/20 text-center">
                    <div className="text-2xl font-black text-yellow-400">{userProfile.badgesEarned}</div>
                    <div className="text-xs text-yellow-300 font-bold uppercase">Badges</div>
                  </div>
                  <div className="bg-purple-500/10 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20 text-center">
                    <div className="text-2xl font-black text-purple-400">{userProfile.certificatesEarned}</div>
                    <div className="text-xs text-purple-300 font-bold uppercase">Certificates</div>
                  </div>
                  <div className="bg-green-500/10 backdrop-blur-xl rounded-xl p-4 border border-green-500/20 text-center">
                    <div className="text-2xl font-black text-green-400">{userProfile.projectsCompleted}</div>
                    <div className="text-xs text-green-300 font-bold uppercase">Completed</div>
                  </div>
                  <div className="bg-blue-500/10 backdrop-blur-xl rounded-xl p-4 border border-blue-500/20 text-center">
                    <div className="text-2xl font-black text-blue-400">{userProfile.ongoingProjects}</div>
                    <div className="text-xs text-blue-300 font-bold uppercase">Ongoing</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Achievements */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* No Activity State for Users Without Projects/Badges */}
              {recentBadges.length === 0 && recentCertificates.length === 0 && projectHistory.length === 0 && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 text-center">
                  <div className="text-6xl mb-6">🌟</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Getting Started</h3>
                  <p className="text-gray-300 mb-6">
                    {userProfile.name} is new to the platform and hasn't participated in any projects yet. 
                    Their journey is just beginning!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-2xl mb-2">🚀</div>
                      <div className="text-sm text-gray-400">Ready for projects</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-2xl mb-2">🎯</div>
                      <div className="text-sm text-gray-400">Eager to learn</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="text-2xl mb-2">👥</div>
                      <div className="text-sm text-gray-400">Available to connect</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recent Badges */}
              {recentBadges.length > 0 && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    🏆 Recent Badges
                    <span className="ml-3 text-sm bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full">
                      {userProfile.badgesEarned} total
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {recentBadges.map((badge) => {
                      const categoryInfo = badgeCategories[badge.badgeCategory] || badgeCategories['development'];
                      return (
                        <div key={badge.id} className={`bg-gradient-to-r ${categoryInfo.bgColor} backdrop-blur-xl rounded-xl p-4 border ${categoryInfo.borderColor}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className={`text-3xl ${categoryInfo.color}`}>
                                {categoryInfo.icon}
                              </div>
                              <div>
                                <div className="font-bold text-white">
                                  {categoryInfo.name} - {badge.badgeLevel?.charAt(0).toUpperCase() + badge.badgeLevel?.slice(1)}
                                </div>
                                <div className="text-gray-300 text-sm">
                                  {badge.projectTitle}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  Awarded {badge.awardedAt?.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeLevelColor(badge.badgeLevel)} bg-black/20`}>
                              {badge.badgeLevel?.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Certificates */}
              {recentCertificates.length > 0 && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    📜 Certificates
                    <span className="ml-3 text-sm bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full">
                      {userProfile.certificatesEarned} earned
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {recentCertificates.map((certificate) => (
                      <div key={certificate.id} className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
                        <div className="flex items-center space-x-4">
                          <div className="text-3xl text-purple-400">📜</div>
                          <div className="flex-grow">
                            <div className="font-bold text-white">
                              Project Completion Certificate
                            </div>
                            <div className="text-gray-300 text-sm">
                              {certificate.projectTitle}
                            </div>
                            <div className="text-gray-400 text-xs">
                              Generated {certificate.generatedAt?.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project History */}
              {projectHistory.length > 0 && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                  <h3 className="text-xl font-bold text-white mb-6">🚀 Project History</h3>
                  <div className="space-y-4">
                    {projectHistory.map((project) => (
                      <div key={project.id} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-white">
                            {project.projectTitle || 'Untitled Project'}
                          </div>
                          <div className="flex items-center space-x-2">
                            {project.role === 'admin' && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                                👑 Admin
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              project.projectStatus === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : project.projectStatus === 'completing'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {project.projectStatus === 'completed' ? '✅ Completed' : 
                               project.projectStatus === 'completing' ? '⏳ Completing' : '🔄 Active'}
                            </span>
                          </div>
                        </div>
                        {project.projectDescription && (
                          <p className="text-gray-400 text-sm mb-2">{project.projectDescription}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            Joined {project.joinedAt?.toLocaleDateString()}
                          </span>
                          {project.memberCount && (
                            <span>
                              👥 {project.memberCount} members
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Badge Categories & Stats */}
            <div className="space-y-8">
              
              {/* Badge Categories Breakdown */}
              {Object.keys(badgesByCategory).length > 0 && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 sticky top-28">
                  <h3 className="text-xl font-bold text-white mb-6">📊 Badge Categories</h3>
                  <div className="space-y-4">
                    {Object.entries(badgesByCategory).map(([category, count]) => {
                      const categoryInfo = badgeCategories[category] || { 
                        name: category, 
                        icon: '🏆', 
                        color: 'text-gray-400',
                        bgColor: 'from-gray-500/20 to-gray-600/20',
                        borderColor: 'border-gray-500/30'
                      };
                      return (
                        <div key={category} className={`bg-gradient-to-r ${categoryInfo.bgColor} backdrop-blur-xl rounded-xl p-4 border ${categoryInfo.borderColor}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`text-xl ${categoryInfo.color}`}>
                                {categoryInfo.icon}
                              </div>
                              <div>
                                <div className="font-bold text-white text-sm">
                                  {categoryInfo.name}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </div>
                              </div>
                            </div>
                            <div className={`text-xl font-black ${categoryInfo.color}`}>
                              {count}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Profile Stats Summary */}
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-6">📈 Profile Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300">Total Projects</span>
                    <span className="text-white font-bold">{projectHistory.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300">Success Rate</span>
                    <span className="text-green-400 font-bold">
                      {projectHistory.length > 0 
                        ? Math.round((userProfile.projectsCompleted / projectHistory.length) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300">Admin Projects</span>
                    <span className="text-yellow-400 font-bold">
                      {projectHistory.filter(p => p.role === 'admin').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-gray-300">Profile Score</span>
                    <span className="text-lime-400 font-bold">
                      {Math.min(100, (userProfile.badgesEarned * 10) + (userProfile.certificatesEarned * 15) + (userProfile.projectsCompleted * 5))}
                    </span>
                  </div>
                  
                  {/* Follow Status */}
                  {currentUser && currentUser.email !== userEmailForFollow && userEmailForFollow && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                      <span className="text-gray-300">Follow Status</span>
                      <span className={`font-bold ${isFollowing ? 'text-lime-400' : 'text-gray-400'}`}>
                        {isFollowing ? '✅ Following' : '➕ Not Following'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default UserProfile;
