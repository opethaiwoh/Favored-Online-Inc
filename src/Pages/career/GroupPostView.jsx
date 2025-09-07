// src/Pages/career/GroupPostView.jsx - Updated with Image Display
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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { safeFirestoreOperation } from '../../utils/errorHandler';

// 🔥 NEW: Likes Modal Component for Single Post View
const LikesModal = ({ isOpen, onClose, likesData, likeCount }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center">
            <span className="text-red-400 mr-2">❤️</span>
            Liked by {likeCount} {likeCount === 1 ? 'person' : 'people'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6m0 0l-6-6m6 6l-6 6" />
            </svg>
          </button>
        </div>

        {/* Users List */}
        <div className="overflow-y-auto max-h-80">
          {likesData.length === 0 ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {likesData.map((user, index) => (
                <div key={user.uid || index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center flex-shrink-0">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-black font-bold text-sm">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {user.displayName || user.email || 'Unknown User'}
                    </p>
                    {user.email && user.displayName && (
                      <p className="text-gray-400 text-sm truncate">{user.email}</p>
                    )}
                  </div>
                  <div className="text-red-400 text-sm">❤️</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <p className="text-gray-400 text-xs text-center">
            Click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

// 🖼️ Image Gallery Component for Group Posts
const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (imageUrl, index) => {
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction) => {
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % images.length
      : (currentImageIndex - 1 + images.length) % images.length;
    
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex].url);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateImage('next');
    if (e.key === 'ArrowLeft') navigateImage('prev');
  };

  useEffect(() => {
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

  return (
    <>
      <div className="mt-4 mb-4">
        {images.length === 1 ? (
          <div className="relative group">
            <img 
              src={images[0].url} 
              alt={images[0].filename || "Post image"}
              className="w-full max-h-96 object-cover rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
              onClick={() => openLightbox(images[0].url, 0)}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm font-medium">
                Click to view full size
              </div>
            </div>
          </div>
        ) : images.length === 2 ? (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename || `Post image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => openLightbox(image.url, index)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 h-64">
            {images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename || `Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={() => openLightbox(image.url, index)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg"></div>
                
                {index === 3 && images.length > 4 && (
                  <div 
                    className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer group-hover:bg-black/50 transition-colors"
                    onClick={() => openLightbox(image.url, index)}
                  >
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold mb-1">+{images.length - 4}</div>
                      <div className="text-sm">more images</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors z-10"
              title="Close (Esc)"
            >
              ×
            </button>

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors"
                  title="Previous image (←)"
                >
                  ‹
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors"
                  title="Next image (→)"
                >
                  ›
                </button>
              </>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} of {images.length}
              </div>
            )}

            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm max-w-64">
              <div className="truncate">
                {images[currentImageIndex]?.filename || `Image ${currentImageIndex + 1}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const GroupPostView = () => {
  const { groupId, postId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [newReply, setNewReply] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Reply editing state
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  
  // 🔥 NEW: Like-related state
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [likesData, setLikesData] = useState([]);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcuts for reply editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && editingReply) {
        cancelReplyEdit();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && editingReply && editReplyContent.trim()) {
        e.preventDefault();
        handleEditReply(editingReply);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingReply, editReplyContent]);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Fetch group data
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = onSnapshot(doc(db, 'groups', groupId), (doc) => {
      if (doc.exists()) {
        setGroup({ id: doc.id, ...doc.data() });
      } else {
        navigate('/my-groups');
      }
    });

    return unsubscribe;
  }, [groupId, navigate]);

  // Check user membership
  useEffect(() => {
    if (!currentUser || !groupId) return;

    const memberQuery = query(
      collection(db, 'group_members'),
      where('groupId', '==', groupId),
      where('userEmail', '==', currentUser.email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(memberQuery, (snapshot) => {
      if (!snapshot.empty) {
        setUserMembership(snapshot.docs[0].data());
      } else {
        setUserMembership(null);
        if (!loading) {
          navigate('/my-groups');
        }
      }
    });

    return unsubscribe;
  }, [currentUser, groupId, loading, navigate]);

  // Fetch post data
  useEffect(() => {
    if (!postId || !userMembership) return;

    const unsubscribe = onSnapshot(doc(db, 'group_posts', postId), (doc) => {
      if (doc.exists()) {
        const postData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        };
        setPost(postData);
      } else {
        navigate(`/groups/${groupId}`);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [postId, userMembership, groupId, navigate]);

  // Fetch replies with improved error handling
  useEffect(() => {
    if (!postId || !userMembership) return;

    console.log('💬 Setting up replies listener for post:', postId);
    setRepliesLoading(true);

    const repliesQuery = query(
      collection(db, 'post_replies'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      repliesQuery,
      (snapshot) => {
        const repliesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        console.log('💬 Replies updated:', repliesData.length, 'replies');
        setReplies(repliesData);
        setRepliesLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching replies:', error);
        
        if (error.code === 'failed-precondition') {
          console.log('🔄 Retrying replies query without orderBy...');
          
          const simpleRepliesQuery = query(
            collection(db, 'post_replies'),
            where('postId', '==', postId)
          );
          
          const unsubscribeSimple = onSnapshot(simpleRepliesQuery, (snapshot) => {
            const repliesData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
            
            repliesData.sort((a, b) => a.createdAt - b.createdAt);
            
            console.log('💬 Replies updated (simple query):', repliesData.length, 'replies');
            setReplies(repliesData);
            setRepliesLoading(false);
          });
          
          return unsubscribeSimple;
        } else {
          setRepliesLoading(false);
          toast.error('Failed to load replies');
        }
      }
    );

    return unsubscribe;
  }, [postId, userMembership]);

  // Reply editing functions
  const canEditReply = (reply) => {
    return currentUser && (
      reply.authorId === currentUser.uid || 
      reply.authorEmail === currentUser.email
    );
  };

  const startEditingReply = (reply) => {
    setEditingReply(reply.id);
    setEditReplyContent(reply.content);
  };

  const cancelReplyEdit = () => {
    setEditingReply(null);
    setEditReplyContent('');
  };

  const handleEditReply = async (replyId) => {
    if (!editReplyContent.trim()) {
      toast.warning('Please enter reply content');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const replyRef = doc(db, 'post_replies', replyId);
        await updateDoc(replyRef, {
          content: editReplyContent.trim(),
          updatedAt: serverTimestamp(),
          isEdited: true
        });
      }, 'updating reply');

      setEditingReply(null);
      setEditReplyContent('');
      toast.success('Reply updated successfully!');

    } catch (error) {
      console.error('❌ Error updating reply:', error);
    }
  };

  // 🔥 NEW: Handle post liking/unliking
  const handleLikePost = async (isCurrentlyLiked) => {
    if (!currentUser || !userMembership) {
      toast.warning('You must be logged in to like posts');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const postRef = doc(db, 'group_posts', postId);
        
        if (isCurrentlyLiked) {
          // Unlike the post
          await updateDoc(postRef, {
            likes: arrayRemove(currentUser.uid),
            likeCount: increment(-1),
            updatedAt: serverTimestamp()
          });
        } else {
          // Like the post
          await updateDoc(postRef, {
            likes: arrayUnion(currentUser.uid),
            likeCount: increment(1),
            updatedAt: serverTimestamp()
          });
        }
      }, isCurrentlyLiked ? 'unliking post' : 'liking post');

      // Optional: Show subtle feedback
      if (!isCurrentlyLiked) {
        toast.success('Post liked! ❤️', { autoClose: 1500 });
      }

    } catch (error) {
      console.error('❌ Error liking/unliking post:', error);
    }
  };

  // 🔥 NEW: Check if current user liked the post
  const isPostLikedByUser = () => {
    return currentUser && post && post.likes && post.likes.includes(currentUser.uid);
  };

  // Reply submission with error handling
  const handleSubmitReply = async (e) => {
    e.preventDefault();
    
    if (!newReply.trim() || submittingReply) {
      toast.warning('Please enter a reply message');
      return;
    }

    if (newReply.length > 1000) {
      toast.warning('Reply must be less than 1000 characters');
      return;
    }

    setSubmittingReply(true);

    try {
      console.log('💬 Creating reply for post:', postId);

      await safeFirestoreOperation(async () => {
        const replyData = {
          postId: postId,
          groupId: groupId,
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown User',
          authorEmail: currentUser.email,
          authorPhoto: currentUser.photoURL || null,
          content: newReply.trim(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        console.log('💾 Saving reply data:', replyData);

        const docRef = await addDoc(collection(db, 'post_replies'), replyData);

        await updateDoc(doc(db, 'group_posts', postId), {
          replyCount: increment(1),
          updatedAt: serverTimestamp()
        });

        console.log('✅ Reply created successfully with ID:', docRef.id);
        return docRef;
      }, 'posting reply');

      setNewReply('');
      toast.success('Reply posted successfully!');

    } catch (error) {
      console.error('❌ Reply submission failed:', error);
    } finally {
      setSubmittingReply(false);
    }
  };

  // 🔥 NEW: Close likes modal
  const closeLikesModal = () => {
    setShowLikesModal(false);
    setLikesData([]); // Clear cached data when closing
  };

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'task': return '✅';
      case 'update': return '📊';
      default: return '💬';
    }
  };

  const getPostTypeColor = (type) => {
    switch (type) {
      case 'announcement': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'task': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'update': return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (!userMembership || !post) {
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
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-6">❓</div>
          <h2 className="text-2xl font-bold text-white mb-4">Post Not Found</h2>
          <p className="text-gray-300 mb-6">This post may have been deleted or you don't have access to it.</p>
          <Link 
            to={`/groups/${groupId}`} 
            className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
          >
            ← Back to Group
          </Link>
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
        {/* HOME LINK - Different destinations for logged in vs logged out users */}
        <Link 
          to={currentUser ? "/community" : "/"} 
          className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
        >
          Home
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
        </Link>
        
        {/* LOGGED IN USER NAVIGATION */}
        {currentUser ? (
          <>
            {/* MY CAREER LINK - Only for logged in users */}
            <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              My Career
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* DASHBOARD LINK - Only for logged in users */}
            <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </>
        ) : (
          /* LOGGED OUT USER NAVIGATION */
          <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Career
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
        )}
        
        {/* USER AUTHENTICATION SECTION */}
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
            <button 
              onClick={() => navigate('/logout')} 
              className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-300 backdrop-blur-sm border border-white/20 font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => navigate('/login')} 
            className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
          >
            <span className="mr-1 sm:mr-2 text-sm sm:text-lg">🚀</span>
            Get Started
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
          
          {/* HOME LINK FOR MOBILE - Different for logged in vs out */}
          <Link 
            to={currentUser ? "/community" : "/"} 
            className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          {/* LOGGED IN USER MOBILE NAVIGATION */}
          {currentUser ? (
            <>
              {/* MY CAREER LINK FOR MOBILE */}
              <Link to="/career/dashboard" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                My Career
              </Link>

              {/* DASHBOARD LINK FOR MOBILE */}
              <Link to="/dashboard" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            </>
          ) : (
            /* LOGGED OUT USER MOBILE NAVIGATION */
            <Link to="/career" 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}>
              Career
            </Link>
          )}
          
          {/* MOBILE USER AUTHENTICATION SECTION */}
          {currentUser ? (
            <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
              <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                {currentUser.photoURL && (
                  <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                )}
                <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
              </div>
              <button 
                onClick={() => navigate('/logout')} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm transition-colors w-full font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center shadow-xl"
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
      <main className="flex-grow pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link 
              to={`/groups/${groupId}`}
              className="text-lime-400 hover:text-lime-300 font-semibold transition-colors duration-300 flex items-center"
            >
              ← Back to {group?.projectTitle}
            </Link>
          </div>
          
          {/* 🖼️ UPDATED: Main Post with Image Display */}
          <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 mb-8">
            
            {/* Post Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-lime-500 to-green-500">
                  {post.authorPhoto ? (
                    <img src={post.authorPhoto} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-black font-bold text-lg">
                      {post.authorName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{post.authorName}</p>
                  <p className="text-gray-400 text-sm">
                    {post.createdAt?.toLocaleDateString()} at {post.createdAt?.toLocaleTimeString()}
                  </p>
                  {userMembership?.role === 'admin' && post.authorEmail === userMembership.userEmail && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-semibold border border-yellow-500/30 mt-1 inline-block">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {post.isPinned && (
                  <span className="text-yellow-500 text-lg" title="Pinned Post">📌</span>
                )}
                <span className={`px-3 py-2 rounded-full text-sm font-semibold border ${getPostTypeColor(post.type)}`}>
                  {getPostTypeIcon(post.type)} {post.type}
                </span>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-4">{post.title}</h1>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                  {post.content}
                </p>
              </div>
              
              {/* 🖼️ Display Images */}
              <ImageGallery images={post.images} />
            </div>

            {/* Post Stats */}
            <div className="flex items-center space-x-6 pt-6 border-t border-gray-700">
              <span className="text-gray-400 text-sm">
                💬 {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </span>
              {post.updatedAt && post.updatedAt > post.createdAt && (
                <span className="text-gray-400 text-sm">
                  ✏️ Edited {post.updatedAt?.toLocaleDateString()}
                </span>
              )}
              <span className="text-gray-400 text-sm">
                👁️ Discussion
              </span>
              {/* 🖼️ Image indicator */}
              {post.images && post.images.length > 0 && (
                <span className="text-gray-400 text-sm flex items-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {post.images.length} image{post.images.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Reply Form */}
          {group?.status !== 'completed' && (
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Add a Reply</h3>
              <form onSubmit={handleSubmitReply} className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-lime-500 to-green-500 flex-shrink-0">
                    {currentUser?.photoURL ? (
                      <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-black font-bold">
                        {(currentUser?.displayName || currentUser?.email)?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newReply}
                      onChange={(e) => setNewReply(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 min-h-[100px] resize-vertical"
                      placeholder="Write your reply..."
                      maxLength={1000}
                      required
                    />
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-gray-400 text-sm">
                        {newReply.length}/1000 characters
                      </span>
                      <button
                        type="submit"
                        disabled={!newReply.trim() || submittingReply || newReply.length > 1000}
                        className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-300"
                      >
                        {submittingReply ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Posting...
                          </span>
                        ) : (
                          '📤 Post Reply'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* UPDATED: Replies with Edit Functionality */}
          <div className="space-y-6">
            {repliesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading replies...</p>
              </div>
            ) : replies.length === 0 ? (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-12 border border-white/20 text-center">
                <div className="text-6xl mb-6">💬</div>
                <h3 className="text-2xl font-bold text-white mb-4">No replies yet</h3>
                <p className="text-gray-400">Be the first to respond to this post!</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-white mb-4">
                  {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h3>
                {replies.map((reply, index) => (
                  <div 
                    key={reply.id} 
                    className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:border-lime-400/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 flex-shrink-0">
                          {reply.authorPhoto ? (
                            <img src={reply.authorPhoto} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <span className="text-white font-bold">
                              {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-3 mb-1">
                            <p className="font-bold text-white">{reply.authorName}</p>
                            <p className="text-gray-400 text-sm">
                              {reply.createdAt?.toLocaleDateString()} at {reply.createdAt?.toLocaleTimeString()}
                              {reply.isEdited && (
                                <span className="ml-2 text-xs text-gray-500 italic">(edited)</span>
                              )}
                            </p>
                            {reply.authorEmail === post.authorEmail && (
                              <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-semibold border border-blue-500/30">
                                OP
                              </span>
                            )}
                            {userMembership?.role === 'admin' && reply.authorEmail === userMembership.userEmail && (
                              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-semibold border border-yellow-500/30">
                                Admin
                              </span>
                            )}
                            <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Edit button for reply authors */}
                      {canEditReply(reply) && editingReply !== reply.id && (
                        <button
                          onClick={() => startEditingReply(reply)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 border border-blue-500/30 flex items-center space-x-1"
                          title="Edit this reply"
                        >
                          <span>✏️</span>
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                    
                    {/* Reply content or edit form */}
                    {editingReply === reply.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-lime-300 font-semibold mb-2">Edit Reply</label>
                          <textarea
                            value={editReplyContent}
                            onChange={(e) => setEditReplyContent(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 h-32 resize-vertical"
                            placeholder="Edit your reply..."
                            maxLength={1000}
                          />
                          <div className="text-right text-gray-400 text-xs mt-1">
                            {editReplyContent.length}/1000 characters
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            💡 Press Escape to cancel, Ctrl+Enter to save
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEditReply(reply.id)}
                              disabled={!editReplyContent.trim() || editReplyContent === reply.content}
                              className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-300 flex items-center space-x-1"
                            >
                              <span>💾</span>
                              <span>Save Changes</span>
                            </button>
                            <button
                              onClick={cancelReplyEdit}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="prose prose-invert max-w-none">
                          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {reply.content}
                          </p>
                        </div>
                        {/* Alternative edit option at bottom */}
                        {canEditReply(reply) && (
                          <div className="flex items-center justify-end mt-4 pt-3 border-t border-gray-700">
                            <button
                              onClick={() => startEditingReply(reply)}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-300 flex items-center space-x-1"
                            >
                              <span>✏️</span>
                              <span>Edit Reply</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* 🔥 NEW: Likes Modal */}
      <LikesModal 
        isOpen={showLikesModal}
        onClose={closeLikesModal}
        likesData={likesData}
        likeCount={post?.likeCount || 0}
      />

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default GroupPostView;
