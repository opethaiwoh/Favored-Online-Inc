// src/Pages/companies/CompanyView.jsx - COMPLETE ENHANCED WITH END COMPANY FEATURE

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { safeFirestoreOperation } from '../../utils/errorHandler';

// Image upload utilities
import { 
  uploadToImgur, 
  validateImageFile, 
  formatFileSize, 
  createFilePreview, 
  cleanupPreviews 
} from '../../utils/imgurUpload';

// Notification utilities
import NotificationBell from '../../components/NotificationBell';
import { 
  createCompanyPostNotification, 
  createCompanyCommentNotification 
} from '../../utils/notificationHelpers';

// 🔥 Enhanced Reaction Avatars Component (from CommunityPosts)
const ReactionAvatars = ({ postId, userIds = [], reactionCount, onClick }) => {
  const [avatarUsers, setAvatarUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const MAX_AVATARS = 5;

  useEffect(() => {
    const fetchAvatarUsers = async () => {
      if (!userIds || userIds.length === 0) {
        setAvatarUsers([]);
        return;
      }

      setLoading(true);
      try {
        const userIdsToFetch = userIds.slice(0, MAX_AVATARS);
        
        if (userIdsToFetch.length === 0) {
          setAvatarUsers([]);
          setLoading(false);
          return;
        }

        const usersQuery = query(
          collection(db, 'users'),
          where('uid', 'in', userIdsToFetch)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          return {
            uid: doc.id,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            displayName: userData.displayName || '',
            photoURL: userData.photoURL || null,
            initials: userData.initials || '',
            profile: userData.profile || {}
          };
        });

        // Fill in missing users with professional placeholders (no email)
        const foundUserIds = users.map(user => user.uid);
        const missingUserIds = userIdsToFetch.filter(id => !foundUserIds.includes(id));
        
        const missingUsers = missingUserIds.map(id => ({
          uid: id,
          firstName: '',
          lastName: '',
          displayName: 'Professional User',
          photoURL: null,
          initials: 'PU',
          profile: {}
        }));

        setAvatarUsers([...users, ...missingUsers]);
      } catch (error) {
        console.error('Error fetching avatar users:', error);
        setAvatarUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvatarUsers();
  }, [userIds]);

  if (reactionCount === 0) return null;

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {/* Profile Pictures Stack */}
      <div className="flex -space-x-1 sm:-space-x-2">
        {loading ? (
          Array.from({ length: Math.min(3, reactionCount) }).map((_, index) => (
            <div
              key={index}
              className="w-5 h-5 sm:w-7 sm:h-7 bg-gray-600 rounded-full border-1 sm:border-2 border-gray-800 animate-pulse"
            />
          ))
        ) : (
          avatarUsers.slice(0, MAX_AVATARS).map((user, index) => (
            <div
              key={user.uid || index}
              className="relative group"
              style={{ zIndex: MAX_AVATARS - index }}
            >
              <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-1 sm:border-2 border-gray-800 overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center hover:scale-110 transition-transform duration-200 cursor-pointer">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {user.firstName && user.lastName 
                      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                      : user.initials || user.displayName?.charAt(0)?.toUpperCase() || 'U'
                    }
                  </span>
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 sm:mb-2 px-1 sm:px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 max-w-32 sm:max-w-none">
                <div className="truncate">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.displayName || 'Professional User'
                  }
                </div>
                {user.profile?.title && (
                  <div className="text-lime-400 text-xs truncate hidden sm:block">
                    {user.profile.title}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {reactionCount > MAX_AVATARS && (
          <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-1 sm:border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:scale-110 transition-transform duration-200">
            +{reactionCount - MAX_AVATARS}
          </div>
        )}
      </div>

      {/* Like count and text */}
      <button
        onClick={onClick}
        className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors cursor-pointer flex items-center space-x-1 group"
      >
        <span className="text-red-400">❤️</span>
        <span className="group-hover:underline hidden sm:inline">
          {reactionCount} {reactionCount === 1 ? 'like' : 'likes'}
        </span>
        <span className="group-hover:underline sm:hidden">
          {reactionCount}
        </span>
      </button>
    </div>
  );
};

// 🔥 Enhanced Reactions Modal Component (from CommunityPosts)
const ReactionsModal = ({ isOpen, onClose, postId, reactions, reactionCount }) => {
  if (!isOpen || !postId) return null;

  const reactionUsers = reactions[postId] || [];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] sm:max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
            <span className="text-red-400 mr-2">❤️</span>
            <span className="hidden sm:inline">Liked by {reactionCount} {reactionCount === 1 ? 'person' : 'people'}</span>
            <span className="sm:hidden">{reactionCount} {reactionCount === 1 ? 'like' : 'likes'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 sm:p-2 rounded-lg hover:bg-white/10 flex items-center justify-center group"
            title="Close"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-60 sm:max-h-80">
          {reactionUsers.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm">Loading reactions...</p>
            </div>
          ) : (
            <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
              {reactionUsers.map((user, index) => (
                <div key={user.uid || index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center flex-shrink-0">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-black font-bold text-xs sm:text-sm">
                        {user.firstName && user.lastName 
                          ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                          : user.initials || user.displayName?.charAt(0)?.toUpperCase() || 'U'
                        }
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm sm:text-base">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.displayName || 'Professional User'
                      }
                    </p>
                    {user.profile?.title && (
                      <p className="text-lime-400 text-xs sm:text-sm truncate">{user.profile.title}</p>
                    )}
                  </div>
                  <div className="text-red-400 text-sm">❤️</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-black/20">
          <p className="text-gray-400 text-xs text-center">
            Company community engagement
          </p>
        </div>
      </div>
    </div>
  );
};

// Enhanced Image Gallery Component - Ultra Responsive
const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (imageUrl, index) => {
    if (!imageUrl || !images || !images[index]) return;
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction) => {
    if (!images || images.length === 0) return;
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % images.length
      : (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]?.url);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') navigateImage('next');
      if (e.key === 'ArrowLeft') navigateImage('prev');
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, currentImageIndex]);

  if (!images || images.length === 0) return null;

  const validImages = images.filter(img => img && img.url);
  if (validImages.length === 0) return null;

  return (
    <>
      {/* Ultra-responsive image grid */}
      <div className="mt-2 sm:mt-3 md:mt-4 lg:mt-5 xl:mt-6 mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6">
        {validImages.length === 1 ? (
          <div className="relative group">
            <img 
              src={validImages[0].url} 
              alt={validImages[0].filename || "Post image"}
              className="w-full h-32 sm:h-40 md:h-48 lg:h-56 xl:h-64 2xl:h-72 object-cover rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.01]"
              onClick={() => openLightbox(validImages[0].url, 0)}
              loading="lazy"
            />
          </div>
        ) : validImages.length === 2 ? (
          <div className="grid grid-cols-2 gap-1 sm:gap-2 md:gap-3">
            {validImages.map((image, index) => (
              <img 
                key={index}
                src={image.url} 
                alt={image.filename || `Post image ${index + 1}`}
                className="w-full h-20 sm:h-24 md:h-32 lg:h-40 xl:h-48 2xl:h-56 object-cover rounded-md sm:rounded-lg md:rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.01]"
                onClick={() => openLightbox(image.url, index)}
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-2 md:gap-3 h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56 2xl:h-64">
            {validImages.slice(0, 4).map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename || `Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-md sm:rounded-lg md:rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.01]"
                  onClick={() => openLightbox(image.url, index)}
                  loading="lazy"
                />
                {index === 3 && validImages.length > 4 && (
                  <div 
                    className="absolute inset-0 bg-black/60 rounded-md sm:rounded-lg md:rounded-xl flex items-center justify-center cursor-pointer hover:bg-black/50 transition-colors"
                    onClick={() => openLightbox(image.url, index)}
                  >
                    <div className="text-white text-center">
                      <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1">+{validImages.length - 4}</div>
                      <div className="text-xs sm:text-sm">more</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-md sm:rounded-lg md:rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold transition-colors"
              aria-label="Close image"
            >
              ×
            </button>

            {/* Navigation buttons */}
            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold transition-colors"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold transition-colors"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}

            {/* Image counter */}
            {validImages.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
                {currentImageIndex + 1} of {validImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const CompanyView = () => {
  const { companyId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [company, setCompany] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [comments, setComments] = useState({});
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Post creation state (admin only)
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    type: 'announcement',
    images: []
  });
  const [submittingPost, setSubmittingPost] = useState(false);

  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Comment states
  const [commentingOn, setCommentingOn] = useState(null);
  const [commentContent, setCommentContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Post editing states
  const [editingPost, setEditingPost] = useState(null);
  const [editPostData, setEditPostData] = useState({ title: '', content: '', type: 'announcement' });

  // Join/Leave/End states
  const [joiningCompany, setJoiningCompany] = useState(false);
  const [leavingCompany, setLeavingCompany] = useState(false);
  const [endingCompany, setEndingCompany] = useState(false); // NEW: End company state

  // Enhanced Reactions state (from CommunityPosts)
  const [postReactions, setPostReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const [showReactionsModal, setShowReactionsModal] = useState(null);
  const [reactionsData, setReactionsData] = useState({});
  const [submittingReaction, setSubmittingReaction] = useState({});

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const MAX_IMAGES = 2;

  // Enhanced viewport detection with more breakpoints
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isXs: typeof window !== 'undefined' ? window.innerWidth < 475 : false,
    isSm: typeof window !== 'undefined' ? window.innerWidth >= 475 && window.innerWidth < 640 : false,
    isMd: typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 768 : false,
    isLg: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isXl: typeof window !== 'undefined' ? window.innerWidth >= 1024 && window.innerWidth < 1280 : false,
    is2Xl: typeof window !== 'undefined' ? window.innerWidth >= 1280 : false,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({
        width,
        height,
        isXs: width < 475,
        isSm: width >= 475 && width < 640,
        isMd: width >= 640 && width < 768,
        isLg: width >= 768 && width < 1024,
        isXl: width >= 1024 && width < 1280,
        is2Xl: width >= 1280,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      });
    };

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviews(previewUrls);
    };
  }, [previewUrls]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch company data
  useEffect(() => {
    if (!companyId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'companies', companyId), 
      (doc) => {
        if (doc.exists()) {
          const companyData = { id: doc.id, ...doc.data() };
          setCompany(companyData);
        } else {
          navigate('/companies');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching company:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [companyId, navigate]);

  // Check user membership
  useEffect(() => {
    if (!currentUser || !companyId) return;

    const memberQuery = query(
      collection(db, 'company_members'),
      where('companyId', '==', companyId),
      where('userEmail', '==', currentUser.email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(memberQuery, (snapshot) => {
      if (!snapshot.empty) {
        const membershipData = snapshot.docs[0].data();
        setUserMembership(membershipData);
      } else {
        setUserMembership(null);
      }
    });

    return unsubscribe;
  }, [currentUser, companyId]);

  // Fetch members
  useEffect(() => {
    if (!companyId) return;

    const membersQuery = query(
      collection(db, 'company_members'),
      where('companyId', '==', companyId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(membersQuery, async (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate()
      }));

      membersData.sort((a, b) => {
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return (a.joinedAt || new Date(0)) - (b.joinedAt || new Date(0));
      });

      setMembers(membersData);

      // Update member count in company document
      if (company && membersData.length !== company.memberCount) {
        try {
          await updateDoc(doc(db, 'companies', companyId), {
            memberCount: membersData.length,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating member count:', error);
        }
      }
    });

    return unsubscribe;
  }, [companyId, company]);

  // Enhanced fetch company posts with reactions
  useEffect(() => {
    if (!companyId) return;

    setPostsLoading(true);
    const postsQuery = query(
      collection(db, 'company_posts'),
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        setPosts(postsData);
        setPostsLoading(false);
        
        // Load reactions for these posts
        loadPostReactions(postsData);
      },
      (error) => {
        console.error('Error fetching posts:', error);
        setPostsLoading(false);
      }
    );

    return unsubscribe;
  }, [companyId]);

  // Fetch comments for posts
  useEffect(() => {
    if (!companyId || posts.length === 0) return;

    const postIds = posts.map(post => post.id);
    const commentsQuery = query(
      collection(db, 'company_comments'),
      where('companyId', '==', companyId),
      where('postId', 'in', postIds.slice(0, 10))
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const commentsData = {};
        snapshot.docs.forEach(doc => {
          const comment = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          };
          
          if (!commentsData[comment.postId]) {
            commentsData[comment.postId] = [];
          }
          commentsData[comment.postId].push(comment);
        });

        Object.keys(commentsData).forEach(postId => {
          commentsData[postId].sort((a, b) => a.createdAt - b.createdAt);
        });

        setComments(commentsData);
      },
      (error) => {
        console.error('Error fetching comments:', error);
      }
    );

    return unsubscribe;
  }, [companyId, posts]);

  // Load post reactions
  const loadPostReactions = (posts) => {
    const reactions = {};
    const counts = {};
    
    posts.forEach(post => {
      reactions[post.id] = post.likes || [];
      counts[post.id] = post.likeCount || 0;
    });
    
    setPostReactions(prev => ({ ...prev, ...reactions }));
    setReactionCounts(prev => ({ ...prev, ...counts }));
  };

  // Handle post reactions
  const handlePostReaction = async (postId, isCurrentlyLiked) => {
    if (!currentUser) {
      toast.warning('Please login to react to posts');
      return;
    }

    setSubmittingReaction(prev => ({ ...prev, [postId]: true }));

    try {
      await safeFirestoreOperation(async () => {
        const postRef = doc(db, 'company_posts', postId);
        
        if (isCurrentlyLiked) {
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid),
            likeCount: increment(-1),
            updatedAt: serverTimestamp()
          });
          
          setPostReactions(prev => ({
            ...prev,
            [postId]: (prev[postId] || []).filter(uid => uid !== currentUser.uid)
          }));
          setReactionCounts(prev => ({
            ...prev,
            [postId]: Math.max(0, (prev[postId] || 0) - 1)
          }));
        } else {
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid),
            likeCount: increment(1),
            updatedAt: serverTimestamp()
          });
          
          setPostReactions(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), currentUser.uid]
          }));
          setReactionCounts(prev => ({
            ...prev,
            [postId]: (prev[postId] || 0) + 1
          }));
          
          toast.success('Post liked! ❤️', { autoClose: 1500 });
        }
      }, isCurrentlyLiked ? 'unliking post' : 'liking post');

    } catch (error) {
      console.error('❌ Error reacting to post:', error);
    } finally {
      setSubmittingReaction(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Check if post is liked by user
  const isPostLikedByUser = (postId) => {
    return currentUser && postReactions[postId] && postReactions[postId].includes(currentUser.uid);
  };

  // Open reactions modal
  const openReactionsModal = async (postId, userIds) => {
    if (!userIds || userIds.length === 0) {
      setShowReactionsModal(postId);
      return;
    }

    setShowReactionsModal(postId);
    
    if (reactionsData[postId]) {
      return;
    }

    try {
      // Fetch user data with professional fields only (NO EMAIL)
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', 'in', userIds.slice(0, 10))
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        return {
          uid: doc.id,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || null,
          initials: userData.initials || '',
          profile: userData.profile || {}
        };
      });

      // For missing users, create professional placeholders (NO EMAIL)
      const foundUserIds = users.map(user => user.uid);
      const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
      
      const missingUsers = missingUserIds.map(id => ({
        uid: id,
        firstName: '',
        lastName: '',
        displayName: 'Professional User',
        photoURL: null,
        initials: 'PU',
        profile: {}
      }));

      const allUsers = [...users, ...missingUsers];

      setReactionsData(prev => ({
        ...prev,
        [postId]: allUsers
      }));

    } catch (error) {
      console.error('Error fetching users who reacted to post:', error);
      setReactionsData(prev => ({
        ...prev,
        [postId]: []
      }));
    }
  };

  // Close reactions modal
  const closeReactionsModal = () => {
    setShowReactionsModal(null);
  };

  // Get author name function
  const getAuthorName = () => {
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    if (currentUser?.displayName && currentUser.displayName.trim()) {
      return currentUser.displayName.trim();
    }
    if (userMembership?.userName && userMembership.userName.trim()) {
      return userMembership.userName.trim();
    }
    if (currentUser?.email) {
      const emailName = currentUser.email.split('@')[0];
      if (emailName && emailName.trim() && emailName !== 'user') {
        return emailName
          .replace(/[._]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
    return 'Team Member';
  };

  const getAuthorInfo = () => {
    const displayName = getAuthorName();
    return {
      authorDisplayName: displayName,
      authorName: displayName,
      authorFirstName: currentUser?.firstName || '',
      authorLastName: currentUser?.lastName || '',
      authorPhoto: currentUser?.photoURL || null,
      authorId: currentUser?.uid,
      authorEmail: currentUser?.email
    };
  };

  // NEW: Handle ending company (for admins/owners)
  const handleEndCompany = async () => {
    if (!isAdmin()) {
      toast.warning('Only company admins can end the company');
      return;
    }

    // Show confirmation dialog
    const confirmMessage = `Are you sure you want to permanently end "${company.companyName}"? This action cannot be undone. All members will be notified and will be able to leave the company.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setEndingCompany(true);

    try {
      await safeFirestoreOperation(async () => {
        // Update company status to ended
        const companyRef = doc(db, 'companies', companyId);
        await updateDoc(companyRef, {
          status: 'ended',
          endedAt: serverTimestamp(),
          endedBy: currentUser.uid,
          endedByName: getAuthorName(),
          updatedAt: serverTimestamp()
        });

        // Create system announcement post
        const systemPostData = {
          companyId: companyId,
          authorId: 'system',
          authorName: 'System Announcement',
          authorEmail: 'system@company.local',
          authorPhoto: null,
          title: '🚨 Company Operations Ended',
          content: `This company has been permanently ended by ${getAuthorName()}.\n\nAll company operations have ceased. Members can now leave the company.\n\nThank you for your participation.`,
          type: 'announcement',
          images: [],
          companyName: company?.companyName || 'Unknown Company',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          commentCount: 0,
          likes: [],
          likeCount: 0,
          isSystemPost: true, // Mark as system post
          authorDisplayName: 'System Announcement',
          authorFirstName: 'System',
          authorLastName: 'Announcement'
        };

        await addDoc(collection(db, 'company_posts'), systemPostData);

        // Optional: Send notifications to all members
        try {
          await createCompanyPostNotification(
            systemPostData,
            members,
            'system' // system as the author
          );
        } catch (notificationError) {
          console.error('Notification error (non-blocking):', notificationError);
        }

      }, 'ending company');

      toast.success(`${company.companyName} has been ended. All members have been notified.`);
      
    } catch (error) {
      console.error('Error ending company:', error);
      toast.error('Failed to end company. Please try again.');
    } finally {
      setEndingCompany(false);
    }
  };

  // Handle joining company
  const handleJoinCompany = async () => {
    if (!currentUser) {
      toast.warning('You must be logged in to join companies');
      return;
    }

    setJoiningCompany(true);

    try {
      await safeFirestoreOperation(async () => {
        const membershipData = {
          companyId: companyId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email,
          userPhoto: currentUser.photoURL || null,
          role: 'member',
          status: 'active',
          joinedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'company_members'), membershipData);
      }, 'joining company');

      toast.success(`Successfully joined ${company.companyName}!`);
    } catch (error) {
      console.error('Error joining company:', error);
    } finally {
      setJoiningCompany(false);
    }
  };

  // Modified: Handle leaving company (only for non-admins or when company is ended)
  const handleLeaveCompany = async () => {
    if (!userMembership) return;

    // Prevent admins from leaving active companies
    if (isAdmin() && company?.status !== 'ended') {
      toast.warning('Company admins cannot leave an active company. You must end the company first.');
      return;
    }

    const actionText = company?.status === 'ended' ? 'leave this ended company' : 'leave this company';
    
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }

    setLeavingCompany(true);

    try {
      await safeFirestoreOperation(async () => {
        // Find and delete the membership
        const memberQuery = query(
          collection(db, 'company_members'),
          where('companyId', '==', companyId),
          where('userEmail', '==', currentUser.email)
        );
        
        const memberSnapshot = await getDocs(memberQuery);
        memberSnapshot.docs.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
      }, 'leaving company');

      const message = company?.status === 'ended' 
        ? `You have left the ended company: ${company.companyName}`
        : `You have left ${company.companyName}`;
      
      toast.success(message);
    } catch (error) {
      console.error('Error leaving company:', error);
    } finally {
      setLeavingCompany(false);
    }
  };

  // Image upload functions
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    processSelectedFiles(files);
  };

  const processSelectedFiles = (files) => {
    const validFiles = [];
    const errors = [];
    const newPreviewUrls = [];

    files.forEach(file => {
      const error = validateImageFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
        newPreviewUrls.push(createFilePreview(file));
      }
    });

    if (errors.length > 0) {
      toast.warning(`Some files were skipped: ${errors.join(', ')}`);
    }

    const currentImageCount = newPost.images.length;
    const currentSelectedCount = selectedFiles.length;
    const totalCurrent = currentImageCount + currentSelectedCount;
    const maxNewImages = MAX_IMAGES - totalCurrent;
    
    if (validFiles.length > maxNewImages) {
      toast.warning(`Only ${maxNewImages} more image(s) can be added (maximum ${MAX_IMAGES} total)`);
      const filesToAdd = validFiles.slice(0, maxNewImages);
      const urlsToAdd = newPreviewUrls.slice(0, maxNewImages);
      
      cleanupPreviews(newPreviewUrls.slice(maxNewImages));
      
      setSelectedFiles(prev => [...prev, ...filesToAdd]);
      setPreviewUrls(prev => [...prev, ...urlsToAdd]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return;

    setUploadingImages(true);
    const uploadedImages = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setImageUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'uploading', progress: 0, filename: file.name }
        }));

        try {
          const result = await uploadToImgur(file);
          uploadedImages.push({
            url: result.url,
            deleteHash: result.deleteHash,
            filename: file.name,
            size: file.size,
            id: result.id
          });
          
          setImageUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'success', progress: 100, filename: file.name }
          }));
        } catch (error) {
          setImageUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'error', error: error.message, filename: file.name }
          }));
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      if (uploadedImages.length > 0) {
        setNewPost(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }));
        
        toast.success(`${uploadedImages.length} image(s) uploaded successfully!`);
      }

      cleanupPreviews(previewUrls);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setImageUploadProgress({});
      
    } catch (error) {
      toast.error('Failed to upload images. Please try again.');
      console.error('Image upload error:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const removeSelectedFile = (index) => {
    const urlToCleanup = previewUrls[index];
    if (urlToCleanup) {
      URL.revokeObjectURL(urlToCleanup);
    }

    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setImageUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[index];
      return newProgress;
    });
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      processSelectedFiles(imageFiles);
    } else {
      toast.warning('Please drop image files only');
    }
  };

  // Handle post creation
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.warning('Please fill in both title and content');
      return;
    }

    if (!isAdmin()) {
      toast.warning('Only company admins can create posts');
      return;
    }

    if (selectedFiles.length > 0) {
      toast.warning('Please upload your selected images before submitting');
      return;
    }

    if (submittingPost) {
      return;
    }

    setSubmittingPost(true);
    let postCreatedSuccessfully = false;

    try {
      const authorInfo = getAuthorInfo();
      
      const postData = {
        companyId: companyId,
        authorId: currentUser.uid,
        authorName: authorInfo.authorDisplayName,
        authorEmail: currentUser.email,
        authorPhoto: currentUser.photoURL || null,
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        type: newPost.type,
        images: newPost.images || [],
        companyName: company?.companyName || 'Unknown Company',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentCount: 0,
        likes: [],
        likeCount: 0,
        ...authorInfo
      };

      const docRef = await addDoc(collection(db, 'company_posts'), postData);
      postCreatedSuccessfully = true;
      
      setNewPost({ title: '', content: '', type: 'announcement', images: [] });
      setShowNewPostForm(false);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setImageUploadProgress({});
      
      toast.success('Post created successfully!');

      try {
        await createCompanyPostNotification(
          { 
            ...postData, 
            id: docRef.id,
            companyName: company?.companyName || 'Unknown Company'
          },
          members,
          currentUser.uid
        );
      } catch (notificationError) {
        console.error('Post notification error (non-blocking):', notificationError);
      }
      
    } catch (error) {
      console.error('Error creating post:', error);
      
      if (!postCreatedSuccessfully) {
        toast.error('Failed to create post. Please try again.');
      }
    } finally {
      setSubmittingPost(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async (postId) => {
    if (!commentContent.trim()) {
      toast.warning('Please enter a comment');
      return;
    }

    if (!isMember()) {
      toast.warning('You must be a member to comment');
      return;
    }

    if (submittingComment) {
      return;
    }

    setSubmittingComment(true);
    let commentPostedSuccessfully = false;

    try {
      const authorInfo = getAuthorInfo();
      
      const commentData = {
        postId: postId,
        companyId: companyId,
        authorId: currentUser.uid,
        authorName: authorInfo.authorDisplayName,
        authorEmail: currentUser.email,
        authorPhoto: currentUser.photoURL || null,
        content: commentContent.trim(),
        companyName: company?.companyName || 'Unknown Company',
        createdAt: serverTimestamp(),
        ...authorInfo
      };

      await addDoc(collection(db, 'company_comments'), commentData);
      commentPostedSuccessfully = true;
      
      setCommentContent('');
      setCommentingOn(null);
      toast.success('Comment posted successfully!');

      try {
        const postRef = doc(db, 'company_posts', postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const currentCommentCount = postDoc.data().commentCount || 0;
          await updateDoc(postRef, {
            commentCount: currentCommentCount + 1,
            updatedAt: serverTimestamp()
          });
        }
      } catch (countError) {
        console.error('Failed to update comment count (non-critical):', countError);
      }

      try {
        const originalPost = posts.find(p => p.id === postId);
        if (originalPost && originalPost.authorId !== currentUser.uid) {
          await createCompanyCommentNotification(
            { 
              ...commentData, 
              id: 'temp-id',
              companyName: company?.companyName || 'Unknown Company'
            },
            members,
            originalPost.authorId,
            originalPost.title
          );
        }
      } catch (notificationError) {
        console.error('Failed to send notification (non-critical):', notificationError);
      }

    } catch (error) {
      console.error('Error posting comment:', error);
      
      if (!commentPostedSuccessfully) {
        toast.error('Failed to post comment. Please try again.');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle comment editing
  const handleEditComment = async (commentId) => {
    if (!editCommentContent.trim()) {
      toast.warning('Please enter comment content');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const authorInfo = getAuthorInfo();
        
        const commentRef = doc(db, 'company_comments', commentId);
        await updateDoc(commentRef, {
          content: editCommentContent.trim(),
          authorName: authorInfo.authorDisplayName,
          updatedAt: serverTimestamp(),
          isEdited: true,
          ...authorInfo
        });
      }, 'updating comment');

      setEditingComment(null);
      setEditCommentContent('');
      toast.success('Comment updated successfully!');

    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        await deleteDoc(doc(db, 'company_comments', commentId));

        const postRef = doc(db, 'company_posts', postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const currentCommentCount = postDoc.data().commentCount || 0;
          await updateDoc(postRef, {
            commentCount: Math.max(0, currentCommentCount - 1),
            updatedAt: serverTimestamp()
          });
        }
      }, 'deleting comment');

      toast.success('Comment deleted successfully!');

    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Helper functions
  const isAdmin = () => userMembership?.role === 'admin';
  const isMember = () => userMembership && userMembership.status === 'active';
  const canEditPost = (post) => isAdmin() && post.authorId === currentUser?.uid && company?.status !== 'ended';
  const canEditComment = (comment) => comment.authorId === currentUser?.uid && company?.status !== 'ended';
  const canDeleteComment = (comment) => (isAdmin() || comment.authorId === currentUser?.uid) && company?.status !== 'ended';
  const isCompanyEnded = () => company?.status === 'ended';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base md:text-lg">Loading company...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4">Company Not Found</h2>
          <Link 
            to="/companies" 
            className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 text-sm sm:text-base inline-block"
          >
            ← Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  const totalImages = newPost.images.length + selectedFiles.length;
  const canAddMoreImages = totalImages < MAX_IMAGES;

  return (
    <div 
      className="min-h-screen overflow-hidden flex flex-col relative"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: viewport?.isMobile ? 'scroll' : 'fixed'
      }}
    >
      {/* Animated background overlay */}
      <div 
        className="fixed inset-0 opacity-20 sm:opacity-25 md:opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(${viewport.isMobile ? '150px' : viewport.isTablet ? '200px' : '300px'} circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

      {/* Responsive Header */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-3 sm:mr-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-white tracking-wide" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  <span className="hidden sm:inline">Favored Online</span>
                  <span className="sm:hidden">Favored</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser && (
                <>
                  <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/companies" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Companies
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}
              
              {currentUser ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-sm text-white font-medium truncate max-w-32" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <NotificationBell />
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-6 py-3 rounded-full text-sm xl:text-base font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
                >
                  <span className="mr-2">🚀</span>
                  Get Started
                </button>
              )}
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
                aria-label="Toggle menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 rounded-xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 p-4">
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>
                    <Link to="/companies" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Companies
                    </Link>
                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                {currentUser ? (
                  <div className="flex flex-col space-y-3 pt-3 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-full px-4 py-3">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full mr-3 ring-2 ring-lime-400/50" />
                      )}
                      <span className="text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <NotificationBell />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }} 
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center shadow-xl"
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

      {/* Main Content */}
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl">
          
          {/* Company Header with End Company Feature */}
          <section className="mb-6 sm:mb-8 md:mb-10">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 border border-white/20">
              
              {/* NEW: Company Ended Banner */}
              {isCompanyEnded() && (
                <div className="mb-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center justify-center text-center">
                    <div>
                      <div className="text-3xl sm:text-4xl mb-2">🚨</div>
                      <h3 className="text-lg sm:text-xl font-bold text-red-400 mb-2">Company Operations Ended</h3>
                      <p className="text-red-300 text-sm sm:text-base">
                        This company has been permanently ended. No new posts or comments can be created.
                      </p>
                      {company.endedAt && (
                        <p className="text-red-400/80 text-xs sm:text-sm mt-2">
                          Ended on {company.endedAt.toDate?.()?.toLocaleDateString() || 'Unknown date'}
                          {company.endedByName && ` by ${company.endedByName}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                <div className="mb-6 xl:mb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-black font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-0 sm:mr-6 mx-auto sm:mx-0">
                      {company.companyName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start mb-2">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                          {company.companyName}
                        </h1>
                        {isCompanyEnded() && (
                          <span className="ml-3 text-red-400 text-lg sm:text-xl">🚨</span>
                        )}
                      </div>
                      {company.industry && (
                        <div className="text-orange-400 text-sm sm:text-base md:text-lg font-medium mb-1">
                          🏭 {company.industry}
                        </div>
                      )}
                      {company.location && (
                        <div className="text-blue-400 text-sm sm:text-base md:text-lg font-medium">
                          📍 {company.location}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-200 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 line-clamp-3 text-center sm:text-left">{company.description}</p>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm bg-lime-500/20 text-lime-400 px-3 sm:px-4 py-2 rounded-full border border-lime-500/30">
                      👥 {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-xs sm:text-sm bg-blue-500/20 text-blue-400 px-3 sm:px-4 py-2 rounded-full border border-blue-500/30">
                      📝 {posts.length} post{posts.length !== 1 ? 's' : ''}
                    </span>
                    {isAdmin() && (
                      <span className="text-xs sm:text-sm bg-yellow-500/20 text-yellow-400 px-3 sm:px-4 py-2 rounded-full border border-yellow-500/30">
                        👑 Admin
                      </span>
                    )}
                    {company.isVerified && (
                      <span className="text-xs sm:text-sm bg-blue-500/20 text-blue-400 px-3 sm:px-4 py-2 rounded-full border border-blue-500/30">
                        ✓ Verified
                      </span>
                    )}
                    {isCompanyEnded() && (
                      <span className="text-xs sm:text-sm bg-red-500/20 text-red-400 px-3 sm:px-4 py-2 rounded-full border border-red-500/30">
                        🚨 Ended
                      </span>
                    )}
                  </div>
                </div>
                
                {/* MODIFIED: Action buttons with End Company feature */}
                <div className="flex flex-col sm:flex-row xl:flex-col space-y-3 sm:space-y-0 sm:space-x-3 xl:space-x-0 xl:space-y-3 w-full sm:w-auto">
                  {isMember() ? (
                    <>
                      {/* Show New Post button only for active companies and admins */}
                      {isAdmin() && !isCompanyEnded() && (
                        <button
                          onClick={() => setShowNewPostForm(!showNewPostForm)}
                          className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg text-sm sm:text-base"
                        >
                          + New Post
                        </button>
                      )}
                      
                      {/* NEW: Show End Company button for admins of active companies */}
                      {isAdmin() && !isCompanyEnded() ? (
                        <button
                          onClick={handleEndCompany}
                          disabled={endingCompany}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg text-sm sm:text-base disabled:opacity-50"
                        >
                          {endingCompany ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              <span className="hidden sm:inline">Ending...</span>
                              <span className="sm:hidden">...</span>
                            </div>
                          ) : (
                            <>
                              <span className="mr-2">🚨</span>
                              <span className="hidden sm:inline">End Company</span>
                              <span className="sm:hidden">End</span>
                            </>
                          )}
                        </button>
                      ) : (
                        /* Show Leave button for non-admins or ended companies */
                        <button
                          onClick={handleLeaveCompany}
                          disabled={leavingCompany}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg text-sm sm:text-base disabled:opacity-50"
                        >
                          {leavingCompany ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              <span className="hidden sm:inline">Leaving...</span>
                              <span className="sm:hidden">...</span>
                            </div>
                          ) : (
                            <>
                              <span className="mr-2">🚪</span>
                              <span className="hidden sm:inline">Leave Company</span>
                              <span className="sm:hidden">Leave</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  ) : (
                    /* Join button for non-members (only for active companies) */
                    !isCompanyEnded() && (
                      <button
                        onClick={handleJoinCompany}
                        disabled={joiningCompany}
                        className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg text-sm sm:text-base disabled:opacity-50"
                      >
                        {joiningCompany ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Joining...</span>
                            <span className="sm:hidden">...</span>
                          </div>
                        ) : (
                          <>
                            <span className="mr-2">🤝</span>
                            <span className="hidden sm:inline">Join Company</span>
                            <span className="sm:hidden">Join</span>
                          </>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* MODIFIED: Grid Layout with ended company logic */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            
            {/* Members Sidebar */}
            <div className="xl:col-span-1 order-2 xl:order-1">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 border border-white/20 xl:sticky xl:top-24">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6 text-center xl:text-left">
                  Company Members
                </h3>
                
                {/* Show ended company message in sidebar */}
                {isCompanyEnded() && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <p className="text-red-400 text-sm">
                      🚨 Company Ended
                    </p>
                    <p className="text-red-300 text-xs mt-1">
                      Members can leave
                    </p>
                  </div>
                )}
                
                <div className="space-y-3 sm:space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 hover:bg-white/5 rounded-lg p-3 transition-colors"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm sm:text-base flex-shrink-0">
                        {member.userName?.charAt(0).toUpperCase() || member.userEmail?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white transition-colors truncate text-sm sm:text-base">
                          {member.userName || member.userEmail}
                        </p>
                        <div className="flex items-center text-gray-400 text-xs sm:text-sm">
                          {member.role === 'admin' ? (
                            <span className="flex items-center">
                              👑 <span className="ml-1">Admin</span>
                            </span>
                          ) : (
                            <span className="flex items-center">
                              👤 <span className="ml-1">Member</span>
                            </span>
                          )}
                          {member.joinedAt && (
                            <span className="ml-2 text-xs hidden sm:inline">
                              • {member.joinedAt.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Posts Area */}
            <div className="xl:col-span-3 order-1 xl:order-2">
              
              {/* MODIFIED: New Post Form (only for active companies and admins) */}
              {showNewPostForm && isAdmin() && !isCompanyEnded() && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/20 mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4 sm:mb-6">Create New Post</h3>
                  <form onSubmit={handleSubmitPost} className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Post Type</label>
                      <select
                        value={newPost.type}
                        onChange={(e) => setNewPost({...newPost, type: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                      >
                        <option value="announcement">📢 Announcement</option>
                        <option value="news">📰 News</option>
                        <option value="event">📅 Event</option>
                        <option value="job">💼 Job Opening</option>
                        <option value="update">📊 Update</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Title</label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                        placeholder="Enter post title..."
                        maxLength={100}
                        required
                      />
                      <div className="text-right text-gray-400 text-xs mt-1">
                        {newPost.title.length}/100 characters
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Content</label>
                      <textarea
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 h-24 sm:h-32 resize-vertical text-sm sm:text-base"
                        placeholder="Share company updates, announcements, or news..."
                        maxLength={2000}
                        required
                      />
                      <div className="text-right text-gray-400 text-xs mt-1">
                        {newPost.content.length}/2000 characters
                      </div>
                    </div>

                    {/* Image Upload Section */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-3 text-sm sm:text-base">
                        Images (Optional) - {totalImages} / {MAX_IMAGES}
                      </label>
                      
                      {/* Current Uploaded Images */}
                      {newPost.images.length > 0 && (
                        <div className="mb-4 sm:mb-6">
                          <h4 className="text-white text-sm font-medium mb-3 flex items-center">
                            <span className="text-green-400 mr-2">✓</span>
                            Uploaded Images ({newPost.images.length}):
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                            {newPost.images.map((image, index) => (
                              <div key={index} className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10">
                                <img 
                                  src={image.url} 
                                  alt={image.filename || `Upload ${index + 1}`}
                                  className="w-full h-16 sm:h-20 md:h-24 object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-sm font-bold transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                                  {image.filename}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected Files (before upload) */}
                      {selectedFiles.length > 0 && (
                        <div className="mb-4 sm:mb-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2 sm:gap-0">
                            <h4 className="text-white text-sm font-medium flex items-center">
                              <span className="text-yellow-400 mr-2">⏳</span>
                              Selected Files ({selectedFiles.length}):
                            </h4>
                            <button
                              type="button"
                              onClick={uploadImages}
                              disabled={uploadingImages}
                              className="bg-lime-500 hover:bg-lime-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center sm:justify-start"
                            >
                              {uploadingImages ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  <span className="hidden sm:inline">Uploading...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <span className="mr-2">📤</span>
                                  <span className="hidden sm:inline">Upload All</span>
                                  <span className="sm:hidden">Upload</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                          <div className="space-y-2 sm:space-y-3">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3 border border-white/20">
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                  <img 
                                    src={previewUrls[index]} 
                                    alt={file.name}
                                    className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border border-white/20 flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                                  {/* Upload Progress */}
                                  {imageUploadProgress[index] && (
                                    <div className="text-xs">
                                      {imageUploadProgress[index].status === 'uploading' && (
                                        <span className="text-yellow-400 flex items-center">
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 mr-1"></div>
                                          <span className="hidden sm:inline">Uploading...</span>
                                        </span>
                                      )}
                                      {imageUploadProgress[index].status === 'success' && (
                                        <span className="text-green-400 flex items-center">
                                          <span className="mr-1">✓</span>
                                          <span className="hidden sm:inline">Uploaded</span>
                                        </span>
                                      )}
                                      {imageUploadProgress[index].status === 'error' && (
                                        <span 
                                          className="text-red-400 flex items-center cursor-help" 
                                          title={imageUploadProgress[index].error}
                                        >
                                          <span className="mr-1">✗</span>
                                          <span className="hidden sm:inline">Failed</span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  
                                  <button
                                    type="button"
                                    onClick={() => removeSelectedFile(index)}
                                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                                    disabled={uploadingImages}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* File Input / Drop Zone */}
                      {canAddMoreImages && (
                        <div 
                          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all duration-300 ${
                            dragActive 
                              ? 'border-lime-400 bg-lime-400/10' 
                              : 'border-white/20 hover:border-lime-400/50'
                          }`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <input
                            type="file"
                            id="image-upload-company"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <label htmlFor="image-upload-company" className="cursor-pointer block">
                            <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">
                              {dragActive ? '📥' : '📸'}
                            </div>
                            <p className="text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                              {dragActive ? 'Drop images here' : (
                                <>
                                  <span className="hidden sm:inline">Click to select images or drag & drop</span>
                                  <span className="sm:hidden">Tap to select images</span>
                                </>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm mb-3">
                              JPEG, PNG, GIF, WebP • Max 10MB each • Up to {MAX_IMAGES} images total
                            </p>
                            <div className="inline-flex items-center bg-lime-500/20 border border-lime-400/40 rounded-lg px-3 sm:px-4 py-2 text-lime-300 text-xs sm:text-sm">
                              <span className="mr-2">⚡</span>
                              {MAX_IMAGES - totalImages} more image{MAX_IMAGES - totalImages !== 1 ? 's' : ''} allowed
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                      <button
                        type="submit"
                        disabled={!newPost.title.trim() || !newPost.content.trim() || selectedFiles.length > 0 || submittingPost}
                        className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 text-sm sm:text-base flex items-center justify-center"
                      >
                        {submittingPost ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            <span className="hidden sm:inline">Publishing...</span>
                            <span className="sm:hidden">...</span>
                          </>
                        ) : selectedFiles.length > 0 ? (
                          <>
                            <span className="mr-2">📤</span>
                            <span className="hidden sm:inline">Upload Images First</span>
                            <span className="sm:hidden">Upload First</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2">📝</span>
                            <span className="hidden sm:inline">Publish Post</span>
                            <span className="sm:hidden">Publish</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewPostForm(false);
                          setNewPost({ title: '', content: '', type: 'announcement', images: [] });
                          setSelectedFiles([]);
                          setPreviewUrls([]);
                          setImageUploadProgress({});
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-300 text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* MODIFIED: Non-member/ended company messages */}
              {!isMember() && !isCompanyEnded() && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 border border-blue-500/20 mb-6 sm:mb-8 text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">🔒</div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Join to View Posts</h3>
                  <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                    You need to be a member of this company to view and interact with posts.
                  </p>
                  <button
                    onClick={handleJoinCompany}
                    disabled={joiningCompany}
                    className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 text-sm sm:text-base inline-block disabled:opacity-50"
                  >
                    {joiningCompany ? 'Joining...' : '🤝 Join Company'}
                  </button>
                </div>
              )}

              {!isMember() && isCompanyEnded() && (
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 border border-red-500/20 mb-6 sm:mb-8 text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">🚨</div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">Company Has Ended</h3>
                  <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                    This company has permanently ended operations. No new members can join.
                  </p>
                </div>
              )}

              {/* MODIFIED: Posts List (show for members, with ended company styling) */}
              {isMember() && (
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  {postsLoading ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
                      <p className="text-gray-400 text-sm sm:text-base">Loading posts...</p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-8 sm:p-12 md:p-16 border border-white/20 text-center">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">
                        {isCompanyEnded() ? '🚨' : '📢'}
                      </div>
                      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">
                        {isCompanyEnded() ? 'Company Has Ended' : 'No posts yet'}
                      </h3>
                      <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
                        {isCompanyEnded() 
                          ? 'This company has ended operations. No new posts can be created.'
                          : isAdmin() 
                            ? 'Be the first to post an announcement for your company!' 
                            : 'No announcements from this company yet.'
                        }
                      </p>
                      {isAdmin() && !isCompanyEnded() && (
                        <button
                          onClick={() => setShowNewPostForm(true)}
                          className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 text-sm sm:text-base"
                        >
                          Create First Post
                        </button>
                      )}
                    </div>
                  ) : (
                    posts.map((post) => {
                      const reactionCount = reactionCounts[post.id] || 0;
                      const isLiked = isPostLikedByUser(post.id);
                      const isSystemPost = post.isSystemPost === true;
                      
                      return (
                        <div 
                          key={post.id} 
                          className={`backdrop-blur-2xl rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border transition-all duration-300 ${
                            isSystemPost 
                              ? 'bg-gradient-to-br from-red-500/20 via-orange-500/20 to-red-500/20 border-red-500/30' 
                              : isCompanyEnded()
                                ? 'bg-gradient-to-br from-gray-800/40 via-gray-900/40 to-black/40 border-gray-600/30'
                                : 'bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 border-white/20 hover:border-lime-400/30'
                          }`}
                        >
                          
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4 sm:mb-6">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                isSystemPost 
                                  ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                                  : 'bg-gradient-to-r from-lime-500 to-green-500'
                              }`}>
                                {isSystemPost ? (
                                  <span className="text-white font-bold text-sm sm:text-base">🚨</span>
                                ) : post.authorPhoto ? (
                                  <img src={post.authorPhoto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                                ) : (
                                  <span className="text-black font-bold text-sm sm:text-base">
                                    {post.authorName?.charAt(0)?.toUpperCase() || '?'}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-semibold text-sm sm:text-base truncate ${
                                  isSystemPost ? 'text-red-300' : 'text-white'
                                }`}>
                                  {post.authorName}
                                </p>
                                <p className="text-gray-400 text-xs sm:text-sm">
                                  {post.createdAt?.toLocaleDateString()} at {post.createdAt?.toLocaleTimeString()}
                                  {post.isEdited && (
                                    <span className="ml-2 text-xs text-gray-500 italic">(edited)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className={`text-xs px-3 py-1 rounded-full flex items-center ${
                                isSystemPost 
                                  ? 'bg-red-700/50 text-red-300' 
                                  : 'bg-gray-700/50 text-gray-300'
                              }`}>
                                <span className="mr-2">
                                  {isSystemPost && '🚨'}
                                  {!isSystemPost && post.type === 'announcement' && '📢'}
                                  {!isSystemPost && post.type === 'news' && '📰'}
                                  {!isSystemPost && post.type === 'event' && '📅'}
                                  {!isSystemPost && post.type === 'job' && '💼'}
                                  {!isSystemPost && post.type === 'update' && '📊'}
                                </span>
                                <span className="hidden sm:inline">
                                  {isSystemPost ? 'system' : post.type}
                                </span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Post Content */}
                          <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 ${
                            isSystemPost ? 'text-red-300' : 'text-white'
                          }`}>
                            {post.title}
                          </h3>
                          <p className={`leading-relaxed mb-4 sm:mb-6 whitespace-pre-wrap text-sm sm:text-base ${
                            isSystemPost ? 'text-red-200' : 'text-gray-300'
                          }`}>
                            {post.content}
                          </p>
                          
                          {/* Image Gallery (only for non-system posts) */}
                          {!isSystemPost && <ImageGallery images={post.images} />}
                          
                          {/* Enhanced Like Section (disabled for ended companies and system posts) */}
                          {!isSystemPost && (
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                              <button
                                onClick={() => handlePostReaction(post.id, isLiked)}
                                disabled={submittingReaction[post.id] || isCompanyEnded()}
                                className={`flex items-center space-x-2 px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                                  isLiked
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                    : 'bg-white/5 text-gray-400 border border-white/20 hover:bg-white/10 hover:text-white'
                                } ${submittingReaction[post.id] || isCompanyEnded() ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span className="text-base sm:text-lg">
                                  {isLiked ? '❤️' : '🤍'}
                                </span>
                                <span className="hidden sm:inline">Like</span>
                                {submittingReaction[post.id] && (
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current"></div>
                                )}
                                {reactionCount > 0 && (
                                  <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
                                    {reactionCount}
                                  </span>
                                )}
                              </button>
                              
                              {/* Show reaction avatars */}
                              <ReactionAvatars
                                postId={post.id}
                                userIds={postReactions[post.id] || []}
                                reactionCount={reactionCount}
                                onClick={() => openReactionsModal(post.id, postReactions[post.id] || [])}
                              />
                            </div>
                          )}
                          
                          {/* Comments Section (disabled for system posts and ended companies) */}
                          {!isSystemPost && (
                            <div className="border-t border-gray-700 pt-4 sm:pt-6">
                              
                              {/* Display existing comments */}
                              {comments[post.id] && comments[post.id].length > 0 && (
                                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                                  <h4 className="text-sm sm:text-base font-semibold text-gray-400">Comments:</h4>
                                  {comments[post.id].map((comment) => (
                                    <div key={comment.id} className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center text-black text-xs sm:text-sm font-bold flex-shrink-0">
                                            {comment.authorName?.charAt(0)?.toUpperCase() || '?'}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-white truncate">{comment.authorName}</p>
                                            <p className="text-xs text-gray-400">
                                              {comment.createdAt?.toLocaleDateString()} at {comment.createdAt?.toLocaleTimeString()}
                                              {comment.isEdited && (
                                                <span className="ml-1 text-xs text-gray-500 italic">(edited)</span>
                                              )}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {/* Comment actions */}
                                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                          {canEditComment(comment) && (
                                            <button
                                              onClick={() => {
                                                setEditingComment(comment.id);
                                                setEditCommentContent(comment.content);
                                              }}
                                              className="text-gray-400 hover:text-lime-400 transition-colors text-xs p-1"
                                              title="Edit comment"
                                            >
                                              ✏️
                                            </button>
                                          )}
                                          {canDeleteComment(comment) && (
                                            <button
                                              onClick={() => handleDeleteComment(comment.id, post.id)}
                                              className="text-gray-400 hover:text-red-400 transition-colors text-xs p-1"
                                              title="Delete comment"
                                            >
                                              🗑️
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Comment content or edit form */}
                                      {editingComment === comment.id ? (
                                        <div className="space-y-3">
                                          <textarea
                                            value={editCommentContent}
                                            onChange={(e) => setEditCommentContent(e.target.value)}
                                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none text-xs sm:text-sm h-20 resize-vertical"
                                            placeholder="Edit your comment..."
                                            maxLength={500}
                                          />
                                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                            <div className="text-xs text-gray-400">
                                              {editCommentContent.length}/500 characters
                                            </div>
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() => handleEditComment(comment.id)}
                                                disabled={!editCommentContent.trim()}
                                                className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                              >
                                                💾 Save
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setEditingComment(null);
                                                  setEditCommentContent('');
                                                }}
                                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors duration-300"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap">{comment.content}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* New comment form (only for active companies) */}
                              {!isCompanyEnded() && (
                                <>
                                  {commentingOn === post.id ? (
                                    <div className="space-y-3 sm:space-y-4">
                                      <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 h-20 sm:h-24 resize-vertical text-sm sm:text-base"
                                        placeholder="Write your comment..."
                                        maxLength={500}
                                      />
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                        <div className="text-xs sm:text-sm text-gray-400">
                                          {commentContent.length}/500 characters
                                        </div>
                                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                          <button
                                            onClick={() => handleSubmitComment(post.id)}
                                            disabled={!commentContent.trim() || submittingComment}
                                            className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-300 flex items-center justify-center"
                                          >
                                            {submittingComment ? (
                                              <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                <span className="hidden sm:inline">Posting...</span>
                                                <span className="sm:hidden">...</span>
                                              </>
                                            ) : (
                                              '💬 Comment'
                                            )}
                                          </button>
                                          <button
                                            onClick={() => {
                                              setCommentingOn(null);
                                              setCommentContent('');
                                            }}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-colors duration-300"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setCommentingOn(post.id);
                                        setEditingComment(null);
                                        setEditCommentContent('');
                                      }}
                                      className="text-lime-400 hover:text-lime-300 text-sm sm:text-base font-medium transition-colors duration-300 flex items-center"
                                    >
                                      💬 Add a comment
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Show message for ended companies */}
                              {isCompanyEnded() && (
                                <div className="text-center py-4">
                                  <p className="text-gray-500 text-sm">
                                    💬 Comments are disabled - Company has ended
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Post Footer */}
                          <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-gray-700">
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-wrap gap-y-1">
                              {!isSystemPost && (
                                <div className="text-gray-400 text-xs sm:text-sm">
                                  💬 {post.commentCount || 0} {(post.commentCount || 0) === 1 ? 'comment' : 'comments'}
                                </div>
                              )}
                              {/* Image indicator */}
                              {!isSystemPost && post.images && post.images.length > 0 && (
                                <div className="text-gray-400 text-xs sm:text-sm flex items-center">
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {post.images.length}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Reactions Modal */}
      <ReactionsModal 
        isOpen={!!showReactionsModal}
        onClose={closeReactionsModal}
        postId={showReactionsModal}
        reactions={reactionsData}
        reactionCount={showReactionsModal ? (reactionCounts[showReactionsModal] || 0) : 0}
      />

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        /* Enhanced responsive utilities */
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Enhanced breakpoints for better responsive design */
        @media (max-width: 374px) {
          /* Extra small phones */
          .text-xs { font-size: 0.7rem; line-height: 1rem; }
          .text-sm { font-size: 0.8rem; line-height: 1.1rem; }
        }

        /* Image Gallery Enhanced Responsive CSS */
        .image-gallery img {
          pointer-events: auto !important;
          cursor: pointer !important;
          position: relative;
          z-index: 1;
        }

        .cursor-pointer {
          cursor: pointer !important;
          pointer-events: auto !important;
        }

        /* Enhanced touch targets for all devices */
        @media (max-width: 374px) {
          button, a, input, textarea, select, [role="button"] {
            min-height: 44px;
            min-width: 44px;
            touch-action: manipulation;
          }
        }

        @media (min-width: 375px) and (max-width: 639px) {
          button, a, input, textarea, select, [role="button"] {
            min-height: 48px;
            touch-action: manipulation;
          }
        }

        @media (min-width: 640px) {
          button, a, input, textarea, select, [role="button"] {
            min-height: 52px;
            touch-action: manipulation;
          }
        }

        /* Enhanced mobile optimizations */
        @media (max-width: 639px) {
          /* Better spacing for mobile */
          .mobile-spacing {
            padding: 0.75rem;
            margin: 0.5rem 0;
          }
          
          /* Improved text rendering on mobile */
          .mobile-text {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          
          /* Better tap targets */
          .tap-target {
            min-height: 44px;
            min-width: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
          }

          /* Prevent zoom on input focus */
          input, textarea, select {
            font-size: 16px;
          }

          /* Optimize background attachment for mobile */
          .mobile-bg-scroll {
            background-attachment: scroll !important;
          }
        }

        /* Enhanced tablet optimizations */
        @media (min-width: 640px) and (max-width: 1023px) {
          .tablet-spacing {
            padding: 1rem;
            margin: 0.75rem 0;
          }
          
          /* Better grid layouts for tablets */
          .tablet-grid-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .tablet-grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Enhanced desktop optimizations */
        @media (min-width: 1024px) {
          .desktop-spacing {
            padding: 1.5rem;
            margin: 1rem 0;
          }
          
          /* Sticky positioning for desktop */
          .xl\\:sticky {
            position: sticky;
            top: 6rem;
          }
        }

        /* Enhanced large screen optimizations */
        @media (min-width: 1536px) {
          .ultra-wide-spacing {
            padding: 2rem;
            margin: 1.5rem 0;
          }
        }

        /* Enhanced accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }

        @media (prefers-contrast: high) {
          .border-white\\/20 {
            border-color: rgba(255, 255, 255, 0.8);
          }
          
          .bg-white\\/10 {
            background-color: rgba(255, 255, 255, 0.2);
          }
          
          .text-gray-400 {
            color: #d1d5db;
          }
        }

        /* Enhanced focus states for keyboard navigation */
        .focus-visible:focus-visible {
          outline: 3px solid #4ade80;
          outline-offset: 2px;
        }

        /* Enhanced high DPI display support */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          img {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        }

        /* Enhanced performance optimizations */
        .will-change-transform {
          will-change: transform;
        }

        .will-change-opacity {
          will-change: opacity;
        }

        .gpu-accelerated {
          transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Enhanced custom scrollbars */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(76, 175, 80, 0.5);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 175, 80, 0.7);
        }

        /* Enhanced animation utilities */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        /* Enhanced utility classes */
        .text-shadow-sm {
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .text-shadow {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .text-shadow-lg {
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }

        .backdrop-blur-xs {
          backdrop-filter: blur(2px);
        }

        .backdrop-blur-3xl {
          backdrop-filter: blur(64px);
        }

        /* Enhanced loading states */
        .loading-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyView;
