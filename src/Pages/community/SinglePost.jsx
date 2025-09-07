// src/Pages/community/SinglePost.jsx - Individual Post View for Shared Links

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

// Helper function to safely format dates
const formatDate = (dateValue) => {
  if (!dateValue) return 'Unknown date';
  
  let date;
  if (dateValue && typeof dateValue.toDate === 'function') {
    date = dateValue.toDate();
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else {
    return 'Unknown date';
  }
  
  if (isNaN(date.getTime())) {
    return 'Unknown date';
  }
  
  return date.toLocaleDateString();
};

const formatTime = (dateValue) => {
  if (!dateValue) return '';
  
  let date;
  if (dateValue && typeof dateValue.toDate === 'function') {
    date = dateValue.toDate();
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    date = new Date(dateValue);
  } else {
    return '';
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
};

// Enhanced Tagged Users Display Component
const TaggedUsers = ({ taggedUsers = [] }) => {
  const navigate = useNavigate();
  
  const handleUserClick = (user) => {
    try {
      if (user.email) {
        const encodedEmail = encodeURIComponent(user.email);
        navigate(`/profile/${encodedEmail}`);
      } else if (user.uid) {
        navigate(`/profile/${user.uid}`);
      }
    } catch (error) {
      console.error('Error navigating to user profile:', error);
    }
  };

  if (!taggedUsers.length) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
      <span className="text-gray-400">Tagged:</span>
      {taggedUsers.map((user, index) => (
        <button
          key={user.uid || index}
          onClick={() => handleUserClick(user)}
          className="text-lime-400 hover:text-lime-300 cursor-pointer transition-colors hover:underline flex items-center group"
          title={`View profile of ${user.displayName || user.email?.split('@')[0] || 'user'}`}
        >
          <span className="group-hover:bg-lime-400/10 px-1 py-0.5 rounded transition-colors">
            @{user.displayName || user.email?.split('@')[0]}
          </span>
          {index < taggedUsers.length - 1 && <span className="text-gray-400 ml-1">,</span>}
        </button>
      ))}
    </div>
  );
};

// Image Gallery Component for Single Post
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
    if (!images || images.length === 0) return;
    
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % images.length
      : (currentImageIndex - 1 + images.length) % images.length;
    
    setCurrentImageIndex(newIndex);
    setSelectedImage(images[newIndex]?.url);
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

  const validImages = images.filter(img => img && img.url);
  if (validImages.length === 0) return null;

  return (
    <>
      <div className="mt-4 mb-4">
        {validImages.length === 1 ? (
          <div className="relative group">
            <img 
              src={validImages[0].url} 
              alt={validImages[0].filename || "Post image"}
              className="w-full max-h-96 object-cover rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300"
              onClick={() => openLightbox(validImages[0].url, 0)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {validImages.slice(0, 4).map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename || `Post image ${index + 1}`}
                  className="w-full h-64 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300"
                  onClick={() => openLightbox(image.url, index)}
                />
                {index === 3 && validImages.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <span className="text-white text-2xl font-bold">
                      +{validImages.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors"
            >
              ×
            </button>

            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors"
                >
                  ‹
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold transition-colors"
                >
                  ›
                </button>
              </>
            )}

            {validImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} of {validImages.length}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

const SinglePost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', postId));
        
        if (postDoc.exists()) {
          const postData = {
            id: postDoc.id,
            ...postDoc.data(),
            createdAt: postDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: postDoc.data().updatedAt?.toDate() || null
          };
          setPost(postData);
        } else {
          setError('Post not found');
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    } else {
      setError('No post ID provided');
      setLoading(false);
    }
  }, [postId]);

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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
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
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-6">😔</div>
          <h1 className="text-3xl font-bold text-white mb-4">Post Not Found</h1>
          <p className="text-gray-400 mb-8">The post you're looking for doesn't exist or has been removed.</p>
          <div className="space-y-3">
            <Link
              to="/community"
              className="block w-full bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
            >
              🏠 Back to Community
            </Link>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Header */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/community" 
              className="flex items-center text-lime-400 hover:text-lime-300 transition-colors font-semibold"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Community
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="text-lime-400 font-bold">🌟 Community Post</span>
              {!currentUser && (
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300"
                >
                  Join Community
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          
          {/* Post Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-lime-400/30 bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
                  {post.authorPhoto ? (
                    <img 
                      src={post.authorPhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {post.authorFirstName && post.authorLastName 
                        ? `${post.authorFirstName.charAt(0)}${post.authorLastName.charAt(0)}`.toUpperCase()
                        : post.authorInitials || post.authorName?.charAt(0)?.toUpperCase() || '👤'
                      }
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-white text-lg">
                      {post.authorFirstName && post.authorLastName 
                        ? `${post.authorFirstName} ${post.authorLastName}`
                        : post.authorName || 'Professional User'
                      }
                    </h3>
                  </div>
                  <div className="flex flex-col">
                    {post.authorTitle && (
                      <p className="text-lime-400 text-sm font-medium">
                        {post.authorTitle}
                      </p>
                    )}
                    <p className="text-gray-300 text-sm">
                      {formatDate(post.createdAt)} • {formatTime(post.createdAt)}
                      {post.updatedAt && post.updatedAt > post.createdAt && (
                        <span className="text-lime-400 ml-2">(edited)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Post Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
              {post.title}
            </h1>
          </div>

          {/* Post Content */}
          <div className="p-6">
            {/* Main Content */}
            <div className="mb-6">
              <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-lg">
                {post.content}
              </div>
              
              {/* Images */}
              <ImageGallery images={post.images} />
              
              {/* Tagged Users */}
              <TaggedUsers taggedUsers={post.taggedUsers} />
            </div>

            {/* Post Stats */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-gray-400">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-400">❤️</span>
                    <span className="text-sm font-medium">
                      {post.likeCount || 0} {(post.likeCount || 0) === 1 ? 'like' : 'likes'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">💬</span>
                    <span className="text-sm font-medium">
                      {post.replyCount || 0} {(post.replyCount || 0) === 1 ? 'reply' : 'replies'}
                    </span>
                  </div>
                  {post.repostCount > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400">🔄</span>
                      <span className="text-sm font-medium">
                        {post.repostCount} {post.repostCount === 1 ? 'repost' : 'reposts'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <span className="text-lime-400 mr-1">🌟</span>
                    Hub Post
                  </span>
                  {post.images && post.images.length > 0 && (
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                      </svg>
                      {post.images.length} {post.images.length === 1 ? 'image' : 'images'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action for Non-Users */}
          {!currentUser && (
            <div className="border-t border-white/10 p-6 bg-gradient-to-r from-lime-500/10 to-green-500/10">
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-2">Join the Community Discussion</h3>
                <p className="text-gray-300 mb-4">Like, reply, and share your own insights with fellow developers</p>
                <Link
                  to="/login"
                  className="inline-block bg-gradient-to-r from-lime-500 to-green-600 text-white px-8 py-3 rounded-full font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                >
                  Join Favored Online
                </Link>
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
};

export default SinglePost;
