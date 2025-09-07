// src/Pages/career/ProjectGroupView.jsx - Enhanced with Link Insertion and Pin Functionality

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
  arrayUnion,
  arrayRemove,
  increment,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { safeFirestoreOperation } from '../../utils/errorHandler';

// 🖼️ Import image upload utilities
import { 
  uploadToImgur, 
  validateImageFile, 
  formatFileSize, 
  createFilePreview, 
  cleanupPreviews 
} from '../../utils/imgurUpload';

// 🔥 NEW: Import notification utilities
import NotificationBell from '../../components/NotificationBell';
import { 
  createGroupPostNotification, 
  createGroupReplyNotification 
} from '../../utils/notificationHelpers';

// 🔗 NEW: Link insertion utilities
const urlRegex = /(https?:\/\/[^\s]+)/g;

const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const formatUrl = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
};

// 🔗 NEW: Link Insertion Modal Component
const LinkInsertModal = ({ isOpen, onClose, onInsert }) => {
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const handleInsert = () => {
    if (!linkUrl.trim()) {
      toast.warning('Please enter a URL');
      return;
    }

    const formattedUrl = formatUrl(linkUrl.trim());
    
    if (!validateUrl(formattedUrl)) {
      toast.warning('Please enter a valid URL');
      return;
    }

    const displayText = linkText.trim() || formattedUrl;
    const linkMarkdown = `[${displayText}](${formattedUrl})`;
    
    onInsert(linkMarkdown);
    setLinkText('');
    setLinkUrl('');
    onClose();
  };

  const handleCancel = () => {
    setLinkText('');
    setLinkUrl('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
            <span className="mr-2 text-xl sm:text-2xl">🔗</span>
            Insert Link
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">
                Link Text (Optional)
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                placeholder="Display text for the link"
                maxLength={100}
              />
              <p className="text-gray-400 text-xs mt-1">
                Leave empty to use the URL as display text
              </p>
            </div>
            
            <div>
              <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">
                URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base"
                placeholder="https://example.com"
                required
              />
              <p className="text-gray-400 text-xs mt-1">
                Enter the full URL including https://
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleInsert}
              disabled={!linkUrl.trim()}
              className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-300 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
            >
              🔗 Insert Link
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 sm:py-3 rounded-lg font-semibold transition-colors duration-300 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔗 NEW: Function to render content with clickable links
const renderContentWithLinks = (content) => {
  if (!content) return content;

  // First, handle markdown-style links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let processedContent = content.replace(markdownLinkRegex, (match, text, url) => {
    const formattedUrl = formatUrl(url);
    if (validateUrl(formattedUrl)) {
      return `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-lime-400 hover:text-lime-300 underline transition-colors font-medium">${text}</a>`;
    }
    return match; // Return original if URL is invalid
  });

  // Then handle plain URLs that aren't already in markdown links
  processedContent = processedContent.replace(urlRegex, (url) => {
    // Don't convert URLs that are already part of HTML links
    if (processedContent.includes(`href="${url}"`)) {
      return url;
    }
    
    if (validateUrl(url)) {
      const displayText = url.length > 50 ? url.substring(0, 47) + '...' : url;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-lime-400 hover:text-lime-300 underline transition-colors font-medium">${displayText}</a>`;
    }
    return url;
  });

  return <span dangerouslySetInnerHTML={{ __html: processedContent }} />;
};

// 🔗 NEW: Text Editor Component with Link Insertion
const TextEditorWithLinks = ({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  maxLength = 2000,
  label,
  required = false
}) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [textAreaRef, setTextAreaRef] = useState(null);

  const insertLink = (linkMarkdown) => {
    if (!textAreaRef) return;

    const start = textAreaRef.selectionStart;
    const end = textAreaRef.selectionEnd;
    const newValue = value.substring(0, start) + linkMarkdown + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after the inserted link
    setTimeout(() => {
      textAreaRef.focus();
      textAreaRef.setSelectionRange(start + linkMarkdown.length, start + linkMarkdown.length);
    }, 10);
  };

  return (
    <div>
      {label && (
        <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          ref={setTextAreaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={className}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
        />
        
        {/* Link Insert Button */}
        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className="absolute top-2 right-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 hover:text-lime-300 p-2 rounded-lg transition-all duration-300 border border-lime-500/30 group"
          title="Insert Link"
        >
          <span className="text-sm">🔗</span>
        </button>
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <p className="text-gray-400 text-xs">
          Use 🔗 button to insert links or type [text](url) format
        </p>
        <div className="text-right text-gray-400 text-xs">
          {value.length}/{maxLength} characters
        </div>
      </div>

      <LinkInsertModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={insertLink}
      />
    </div>
  );
};

// 🔥 Responsive Likes Preview Component
const LikesPreview = ({ post, onOpenModal, previewUsers = [] }) => {
  const likeCount = post.likeCount || 0;
  const likes = post.likes || [];
  
  if (likeCount === 0) return null;

  return (
    <button
      onClick={() => onOpenModal(post.id, likes)}
      className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-white text-xs sm:text-sm transition-colors cursor-pointer group"
    >
      {/* Profile Pictures Stack - Responsive */}
      <div className="flex -space-x-1 sm:-space-x-2">
        {previewUsers.slice(0, 3).map((user, index) => (
          <div
            key={user?.uid || index}
            className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full border-1 sm:border-2 border-gray-800 group-hover:border-gray-600 transition-colors overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center"
            style={{ zIndex: 10 - index }}
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-black font-bold text-xs">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        ))}
        
        {/* Show count bubble if more than 3 likes */}
        {likeCount > 3 && (
          <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full border-1 sm:border-2 border-gray-800 group-hover:border-gray-600 bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
            +{likeCount - 3}
          </div>
        )}
      </div>

      {/* Like text - Responsive */}
      <div className="flex items-center space-x-1">
        <span className="text-sm sm:text-base">❤️</span>
        <span className="text-xs sm:text-sm">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
      </div>
    </button>
  );
};

// 🔥 Fully Responsive Likes Modal Component
const LikesModal = ({ postId, isOpen, onClose, likesData, likeCount }) => {
  if (!isOpen || !postId) return null;

  const users = likesData[postId] || [];

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl w-full max-w-xs sm:max-w-md max-h-[90vh] sm:max-h-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Responsive */}
        <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-white/10">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white flex items-center">
            <span className="text-red-400 mr-1 sm:mr-2">❤️</span>
            <span className="hidden sm:inline">Liked by {likeCount} {likeCount === 1 ? 'person' : 'people'}</span>
            <span className="sm:hidden">{likeCount} like{likeCount !== 1 ? 's' : ''}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 text-lg sm:text-xl font-bold min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Users List - Responsive */}
        <div className="overflow-y-auto max-h-[60vh] sm:max-h-80">
          {users.length === 0 ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-lime-400 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-400 text-sm">Loading users...</p>
            </div>
          ) : (
            <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3">
              {users.map((user, index) => (
                <div key={user.uid || index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center flex-shrink-0">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-black font-bold text-xs sm:text-sm">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate text-sm sm:text-base">
                      {user.displayName || user.email || 'Unknown User'}
                    </p>
                  </div>
                  <div className="text-red-400 text-sm">❤️</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Responsive */}
        <div className="p-2 sm:p-3 md:p-4 border-t border-white/10 bg-black/20">
          <p className="text-gray-400 text-xs text-center">
            Tap outside to close
          </p>
        </div>
      </div>
    </div>
  );
};

// 🖼️ FIXED: Fully Responsive Image Gallery Component
const ImageGallery = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (imageUrl, index) => {
    // Add error checking
    console.log('🖼️ Opening lightbox:', { imageUrl, index, images });
    if (!imageUrl || !images || !images[index]) {
      console.error('❌ Invalid image data:', { imageUrl, index, images });
      return;
    }
    
    setSelectedImage(imageUrl);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    console.log('🔒 Closing lightbox');
    setSelectedImage(null);
    setCurrentImageIndex(0);
  };

  const navigateImage = (direction) => {
    if (!images || images.length === 0) return;
    
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % images.length
      : (currentImageIndex - 1 + images.length) % images.length;
    
    console.log('📍 Navigating to image:', { direction, newIndex, total: images.length });
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

  // Add validation
  if (!images || images.length === 0) {
    console.log('📷 No images provided');
    return null;
  }

  // Ensure images have proper structure
  const validImages = images.filter(img => img && img.url);
  if (validImages.length === 0) {
    console.log('📷 No valid images found');
    return null;
  }

  console.log('📷 Rendering gallery with', validImages.length, 'images');

  return (
    <>
      <div className="mt-3 sm:mt-4 mb-3 sm:mb-4">
        {validImages.length === 1 ? (
          <div className="relative group">
            <img 
              src={validImages[0].url} 
              alt={validImages[0].filename || "Post image"}
              className="w-full max-h-48 sm:max-h-64 md:max-h-96 object-cover rounded-lg sm:rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Single image clicked:', validImages[0].url);
                openLightbox(validImages[0].url, 0);
              }}
              loading="lazy"
              style={{ 
                pointerEvents: 'auto',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 1
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-lg sm:rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <div className="bg-black/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Click to view full size</span>
                <span className="sm:hidden">Tap to enlarge</span>
              </div>
            </div>
          </div>
        ) : validImages.length === 2 ? (
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            {validImages.map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename || `Post image ${index + 1}`}
                  className="w-full h-24 sm:h-32 md:h-48 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Grid image clicked:', { url: image.url, index });
                    openLightbox(image.url, index);
                  }}
                  loading="lazy"
                  style={{ 
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg pointer-events-none"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-2 h-32 sm:h-48 md:h-64">
            {validImages.slice(0, 4).map((image, index) => (
              <div key={index} className="relative group">
                <img 
                  src={image.url} 
                  alt={image.filename || `Post image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Multiple grid image clicked:', { url: image.url, index });
                    openLightbox(image.url, index);
                  }}
                  loading="lazy"
                  style={{ 
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-lg pointer-events-none"></div>
                
                {index === 3 && validImages.length > 4 && (
                  <div 
                    className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center cursor-pointer group-hover:bg-black/50 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖱️ More images overlay clicked:', { url: image.url, index });
                      openLightbox(image.url, index);
                    }}
                    style={{ 
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  >
                    <div className="text-white text-center">
                      <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1">+{validImages.length - 4}</div>
                      <div className="text-xs sm:text-sm">more</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔥 ENHANCED: Lightbox with better error handling */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Lightbox overlay clicked');
            closeLightbox();
          }}
          style={{ 
            pointerEvents: 'auto',
            zIndex: 9999
          }}
        >
          <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => {
                e.stopPropagation();
                console.log('🖱️ Lightbox image clicked (no action)');
              }}
              onError={(e) => {
                console.error('❌ Failed to load image:', selectedImage);
                toast.error('Failed to load image');
                closeLightbox();
              }}
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10000
              }}
            />
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Close button clicked');
                closeLightbox();
              }}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors z-10"
              title="Close (Esc)"
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10001
              }}
            >
              ×
            </button>

            {validImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Previous button clicked');
                    navigateImage('prev');
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors"
                  title="Previous image (←)"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10001
                  }}
                >
                  ‹
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Next button clicked');
                    navigateImage('next');
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors"
                  title="Next image (→)"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 10001
                  }}
                >
                  ›
                </button>
              </>
            )}

            {validImages.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
                {currentImageIndex + 1} of {validImages.length}
              </div>
            )}

            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/50 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm max-w-32 sm:max-w-48 md:max-w-64">
              <div className="truncate">
                {validImages[currentImageIndex]?.filename || `Image ${currentImageIndex + 1}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const ProjectGroupView = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [userMembership, setUserMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newPost, setNewPost] = useState({ 
    title: '', 
    content: '', 
    type: 'discussion',
    images: []
  });
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [showAdminInstructions, setShowAdminInstructions] = useState(false);
  const [showRepositoryInfo, setShowRepositoryInfo] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Post and reply editing state
  const [editingPost, setEditingPost] = useState(null);
  const [editPostData, setEditPostData] = useState({ title: '', content: '', type: 'discussion' });
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [replies, setReplies] = useState({});

  // Image upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState({});
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Likes Modal states
  const [showLikesModal, setShowLikesModal] = useState(null);
  const [likesData, setLikesData] = useState({});
  const [likesPreviewData, setLikesPreviewData] = useState({});

  // Constants
  const MAX_IMAGES = 2;

  // 🔥 ENHANCED AUTHOR NAME RESOLUTION FUNCTION
  const getAuthorName = () => {
    // 1. Try full name from currentUser
    if (currentUser?.firstName && currentUser?.lastName) {
      return `${currentUser.firstName} ${currentUser.lastName}`;
    }
    
    // 2. Try currentUser.displayName first
    if (currentUser?.displayName && currentUser.displayName.trim()) {
      return currentUser.displayName.trim();
    }
    
    // 3. Try userMembership.userName (from group membership data)
    if (userMembership?.userName && userMembership.userName.trim()) {
      return userMembership.userName.trim();
    }
    
    // 4. Try extracting name from email
    if (currentUser?.email) {
      const emailName = currentUser.email.split('@')[0];
      if (emailName && emailName.trim() && emailName !== 'user') {
        // Capitalize first letter and replace dots/underscores with spaces
        return emailName
          .replace(/[._]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
    
    // 5. Try getting from members list (current user's entry)
    const currentMember = members.find(member => 
      member.userId === currentUser?.uid || 
      member.userEmail === currentUser?.email
    );
    
    if (currentMember?.userName && currentMember.userName.trim()) {
      return currentMember.userName.trim();
    }
    
    // 6. Fallback to a more descriptive name instead of 'Unknown User'
    return 'Team Member';
  };

  // 🔥 ENHANCED: Get comprehensive author information for notifications
  const getAuthorInfo = () => {
    const displayName = getAuthorName();
    
    return {
      authorDisplayName: displayName,
      authorName: displayName, // Legacy compatibility
      authorFirstName: currentUser?.firstName || '',
      authorLastName: currentUser?.lastName || '',
      authorPhoto: currentUser?.photoURL || null,
      authorId: currentUser?.uid,
      authorEmail: currentUser?.email
    };
  };

  // Close likes modal
  const closeLikesModal = () => {
    setShowLikesModal(null);
  };

  // Fetch likes preview data (first 3 users)
  const fetchLikesPreview = async (postId, userIds) => {
    if (!userIds || userIds.length === 0) return;
    
    // If we already have preview data, don't fetch again
    if (likesPreviewData[postId]) return;

    try {
      const previewUserIds = userIds.slice(0, 3);
      
      // Fetch user data for the first 3 likes
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', 'in', previewUserIds)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      // Also include users from group members if not found in users collection
      const memberUsers = members.filter(member => previewUserIds.includes(member.userId || member.uid))
        .map(member => ({
          uid: member.userId || member.uid,
          displayName: member.userName,
          email: member.userEmail,
          photoURL: member.photoURL || null
        }));

      // Combine and deduplicate
      const allUsers = [...users];
      memberUsers.forEach(memberUser => {
        if (!allUsers.find(user => user.uid === memberUser.uid)) {
          allUsers.push(memberUser);
        }
      });

      // Sort to match the order of userIds
      const sortedUsers = previewUserIds.map(userId => 
        allUsers.find(user => user.uid === userId)
      ).filter(Boolean);

      setLikesPreviewData(prev => ({
        ...prev,
        [postId]: sortedUsers
      }));

    } catch (error) {
      console.error('Error fetching likes preview:', error);
    }
  };

  // Open likes modal and fetch user data
  const openLikesModal = async (postId, userIds) => {
    if (!userIds || userIds.length === 0) {
      setShowLikesModal(postId);
      return;
    }

    setShowLikesModal(postId);
    
    // If we already have the data, don't fetch again
    if (likesData[postId]) {
      return;
    }

    try {
      // Fetch user data for the likes
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', 'in', userIds.slice(0, 10)) // Firestore 'in' query limit is 10
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));

      // Also include users from group members if not found in users collection
      const memberUsers = members.filter(member => userIds.includes(member.userId || member.uid))
        .map(member => ({
          uid: member.userId || member.uid,
          displayName: member.userName,
          email: member.userEmail,
          photoURL: member.photoURL || null
        }));

      // Combine and deduplicate
      const allUsers = [...users];
      memberUsers.forEach(memberUser => {
        if (!allUsers.find(user => user.uid === memberUser.uid)) {
          allUsers.push(memberUser);
        }
      });

      setLikesData(prev => ({
        ...prev,
        [postId]: allUsers
      }));

    } catch (error) {
      console.error('Error fetching users who liked post:', error);
      // Set empty array to prevent loading state
      setLikesData(prev => ({
        ...prev,
        [postId]: []
      }));
    }
  };

  // 📌 NEW: Handle post pinning/unpinning
  const handleTogglePin = async (postId, isCurrentlyPinned) => {
    // Only admins should be able to pin/unpin posts
    if (userMembership?.role !== 'admin') {
      toast.warning('Only admins can pin/unpin posts');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const postRef = doc(db, 'group_posts', postId);
        await updateDoc(postRef, {
          isPinned: !isCurrentlyPinned,
          updatedAt: serverTimestamp()
        });
      }, isCurrentlyPinned ? 'unpinning post' : 'pinning post');

      toast.success(isCurrentlyPinned ? 'Post unpinned' : 'Post pinned to top');

    } catch (error) {
      console.error('❌ Error toggling pin status:', error);
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviews(previewUrls);
    };
  }, [previewUrls]);

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

  // Fetch group data with real-time updates
  useEffect(() => {
    if (!groupId) return;

    console.log('🔍 Setting up group listener for:', groupId);

    const unsubscribe = onSnapshot(
      doc(db, 'groups', groupId), 
      (doc) => {
        if (doc.exists()) {
          const groupData = { id: doc.id, ...doc.data() };
          console.log('📊 Group data updated:', groupData);
          setGroup(groupData);
        } else {
          console.error('❌ Group not found');
          navigate('/my-groups');
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error fetching group:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [groupId]);

  // Fetch replies for posts
  useEffect(() => {
    if (!groupId || posts.length === 0) return;

    const postIds = posts.map(post => post.id);
    const repliesQuery = query(
      collection(db, 'post_replies'),
      where('groupId', '==', groupId),
      where('postId', 'in', postIds.slice(0, 10))
    );

    const unsubscribe = onSnapshot(
      repliesQuery,
      (snapshot) => {
        const repliesData = {};
        snapshot.docs.forEach(doc => {
          const reply = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          };
          
          if (!repliesData[reply.postId]) {
            repliesData[reply.postId] = [];
          }
          repliesData[reply.postId].push(reply);
        });

        Object.keys(repliesData).forEach(postId => {
          repliesData[postId].sort((a, b) => a.createdAt - b.createdAt);
        });

        setReplies(repliesData);
      },
      (error) => {
        console.error('❌ Error fetching replies:', error);
      }
    );
  }, [groupId, navigate]);

  // Check user membership
  useEffect(() => {
    if (!currentUser || !groupId) return;

    console.log('👤 Checking membership for:', currentUser.email);

    const memberQuery = query(
      collection(db, 'group_members'),
      where('groupId', '==', groupId),
      where('userEmail', '==', currentUser.email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(memberQuery, (snapshot) => {
      if (!snapshot.empty) {
        const membershipData = snapshot.docs[0].data();
        console.log('✅ User membership found:', membershipData);
        setUserMembership(membershipData);
      } else {
        console.log('❌ No membership found');
        setUserMembership(null);
        if (!loading) {
          navigate('/my-groups');
        }
      }
    });

    return unsubscribe;
  }, [currentUser, groupId, loading, navigate]);

  // Fetch members
  useEffect(() => {
    if (!groupId) return;

    console.log('👥 Setting up members listener for:', groupId);

    const membersQuery = query(
      collection(db, 'group_members'),
      where('groupId', '==', groupId),
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

      console.log('👥 Members updated:', membersData.length, 'members');
      setMembers(membersData);

      if (group && membersData.length !== group.memberCount) {
        console.log('🔄 Syncing member count:', membersData.length);
        try {
          await updateDoc(doc(db, 'groups', groupId), {
            memberCount: membersData.length,
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          console.error('❌ Error updating member count:', error);
        }
      }
    });

    return unsubscribe;
  }, [groupId, group]);

  // Fetch group posts
  useEffect(() => {
    if (!groupId) return;

    console.log('📝 Setting up posts listener for:', groupId);
    setPostsLoading(true);

    const postsQuery = query(
      collection(db, 'group_posts'),
      where('groupId', '==', groupId)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        postsData.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (b.isPinned && !a.isPinned) return 1;
          return b.createdAt - a.createdAt;
        });

        console.log('📝 Posts updated:', postsData.length, 'posts found');
        setPosts(postsData);
        setPostsLoading(false);

        // Fetch preview data for posts with likes
        postsData.forEach(post => {
          if (post.likes && post.likes.length > 0) {
            fetchLikesPreview(post.id, post.likes);
          }
        });
      },
      (error) => {
        console.error('❌ Error fetching posts:', error);
        setPostsLoading(false);
        toast.error('Failed to load posts');
      }
    );

    return unsubscribe;
  }, [groupId, members]);

  // Handle file selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    processSelectedFiles(files);
  };

  // Process selected files
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

  // Upload selected images to Imgur
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

  // Remove an uploaded image from the post
  const removeImage = (index) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Remove a selected file before upload
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
      const reindexed = {};
      Object.keys(newProgress).forEach(key => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          reindexed[keyIndex - 1] = newProgress[key];
        } else {
          reindexed[key] = newProgress[key];
        }
      });
      return reindexed;
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

  // 🔥 FIXED: Enhanced post creation function with proper name resolution
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.warning('Please fill in both title and content');
      return;
    }

    if (!currentUser || !userMembership) {
      toast.warning('You must be an active member to create posts');
      return;
    }

    // Check if there are unuploaded images
    if (selectedFiles.length > 0) {
      toast.warning('Please upload your selected images before submitting');
      return;
    }

    try {
      console.log('📝 Creating new post:', newPost);

      await safeFirestoreOperation(async () => {
        const authorInfo = getAuthorInfo();
        
        // Debug logging
        console.log('👤 Author info for post:', authorInfo);

        const postData = {
          groupId: groupId,
          authorId: currentUser.uid,
          authorName: authorInfo.authorDisplayName, // Using the enhanced name resolution
          authorEmail: currentUser.email,
          authorPhoto: currentUser.photoURL || null,
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          type: newPost.type,
          images: newPost.images || [],
          groupTitle: group?.projectTitle,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          replyCount: 0,
          isPinned: false,
          likes: [],
          likeCount: 0,
          replies: [],
          
          // Enhanced author information for notifications
          ...authorInfo
        };

        console.log('💾 Saving post data with enhanced author info:', {
          authorName: postData.authorName,
          authorDisplayName: postData.authorDisplayName,
          authorFirstName: postData.authorFirstName,
          authorLastName: postData.authorLastName
        });

        const docRef = await addDoc(collection(db, 'group_posts'), postData);
        
        // Create notifications for group members with enhanced author info
        await createGroupPostNotification(
          { 
            ...postData, 
            id: docRef.id
          },
          members,
          currentUser.uid
        );
        
        console.log('✅ Post created successfully with ID:', docRef.id);
        return docRef;
      }, 'creating post');
      
      // Clear form and close
      setNewPost({ title: '', content: '', type: 'discussion', images: [] });
      setShowNewPostForm(false);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setImageUploadProgress({});
      
      toast.success('Post created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating post:', error);
    }
  };

  // 🔥 FIXED: Reply submission with enhanced name resolution
  const handleSubmitReply = async (postId) => {
    if (!replyContent.trim()) {
      toast.warning('Please enter a reply');
      return;
    }

    if (!currentUser || !userMembership) {
      toast.warning('You must be an active member to reply');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const authorInfo = getAuthorInfo();
        
        console.log('👤 Reply author info:', authorInfo);

        const replyData = {
          postId: postId,
          groupId: groupId,
          authorId: currentUser.uid,
          authorName: authorInfo.authorDisplayName, // Using the enhanced name resolution
          authorEmail: currentUser.email,
          authorPhoto: currentUser.photoURL || null,
          content: replyContent.trim(),
          createdAt: serverTimestamp(),
          
          // Enhanced author information for notifications
          ...authorInfo
        };

        await addDoc(collection(db, 'post_replies'), replyData);

        // Get the original post info
        const originalPost = posts.find(p => p.id === postId);

        // Create reply notification with enhanced author info
        if (originalPost) {
          await createGroupReplyNotification(
            { 
              ...replyData, 
              id: 'temp-id'
            },
            members,
            originalPost.authorId,
            originalPost.title
          );
        }

        const postRef = doc(db, 'group_posts', postId);
        const postDoc = await getDoc(postRef);
        if (postDoc.exists()) {
          const currentReplyCount = postDoc.data().replyCount || 0;
          await updateDoc(postRef, {
            replyCount: currentReplyCount + 1,
            updatedAt: serverTimestamp()
          });
        }
      }, 'posting reply');

      setReplyContent('');
      setReplyingTo(null);
      toast.success('Reply posted successfully!');

    } catch (error) {
      console.error('❌ Error posting reply:', error);
    }
  };

  // 🔥 FIXED: Post editing functions with enhanced name resolution
  const handleEditPost = async (postId) => {
    if (!editPostData.title.trim() || !editPostData.content.trim()) {
      toast.warning('Please fill in both title and content');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const authorInfo = getAuthorInfo();
        
        const postRef = doc(db, 'group_posts', postId);
        await updateDoc(postRef, {
          title: editPostData.title.trim(),
          content: editPostData.content.trim(),
          type: editPostData.type,
          authorName: authorInfo.authorDisplayName, // Update author name in case it was previously 'Unknown User'
          updatedAt: serverTimestamp(),
          isEdited: true,
          
          // Update enhanced author information
          ...authorInfo
        });
      }, 'updating post');

      setEditingPost(null);
      setEditPostData({ title: '', content: '', type: 'discussion' });
      toast.success('Post updated successfully!');

    } catch (error) {
      console.error('❌ Error updating post:', error);
    }
  };

  // Function to start editing post
  const startEditingPost = (post) => {
    setEditingPost(post.id);
    setEditPostData({
      title: post.title,
      content: post.content,
      type: post.type
    });
    setEditingReply(null);
    setEditReplyContent('');
    setReplyingTo(null);
    setReplyContent('');
  };

  // Function to cancel post editing
  const cancelEdit = () => {
    setEditingPost(null);
    setEditPostData({ title: '', content: '', type: 'discussion' });
  };

  // 🔥 FIXED: Reply editing functions with enhanced name resolution
  const handleEditReply = async (replyId) => {
    if (!editReplyContent.trim()) {
      toast.warning('Please enter reply content');
      return;
    }

    try {
      await safeFirestoreOperation(async () => {
        const authorInfo = getAuthorInfo();
        
        const replyRef = doc(db, 'post_replies', replyId);
        await updateDoc(replyRef, {
          content: editReplyContent.trim(),
          authorName: authorInfo.authorDisplayName, // Update author name in case it was previously 'Unknown User'
          updatedAt: serverTimestamp(),
          isEdited: true,
          
          // Update enhanced author information
          ...authorInfo
        });
      }, 'updating reply');

      setEditingReply(null);
      setEditReplyContent('');
      toast.success('Reply updated successfully!');

    } catch (error) {
      console.error('❌ Error updating reply:', error);
    }
  };

  // Function to start editing reply
  const startEditingReply = (reply) => {
    setEditingReply(reply.id);
    setEditReplyContent(reply.content);
    setReplyingTo(null);
    setReplyContent('');
  };

  // Function to cancel reply editing
  const cancelReplyEdit = () => {
    setEditingReply(null);
    setEditReplyContent('');
  };

  // Check if user can edit post
  const canEditPost = (post) => {
    const canEdit = currentUser && (
      post.authorId === currentUser.uid || 
      post.authorEmail === currentUser.email
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Edit Permission Check:', {
        postId: post.id,
        postAuthorId: post.authorId,
        postAuthorEmail: post.authorEmail,
        currentUserId: currentUser?.uid,
        currentUserEmail: currentUser?.email,
        canEdit: canEdit,
        userMembership: userMembership?.role,
        groupStatus: group?.status
      });
    }
    
    return canEdit;
  };

  // Check if user can edit reply
  const canEditReply = (reply) => {
    return currentUser && (
      reply.authorId === currentUser.uid || 
      reply.authorEmail === currentUser.email
    );
  };

  // Handle post liking/unliking
  const handleLikePost = async (postId, isCurrentlyLiked) => {
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

      // Clear preview data to force refresh
      setLikesPreviewData(prev => {
        const updated = { ...prev };
        delete updated[postId];
        return updated;
      });

      // Optional: Show subtle feedback
      if (!isCurrentlyLiked) {
        toast.success('Post liked! ❤️', { autoClose: 1500 });
      }

    } catch (error) {
      console.error('❌ Error liking/unliking post:', error);
    }
  };

  // Check if current user liked a post
  const isPostLikedByUser = (post) => {
    return currentUser && post.likes && post.likes.includes(currentUser.uid);
  };

  // Helper functions for status
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completing':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completing':
        return '🟡';
      case 'completed':
        return '🎉';
      default:
        return '⚪';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completing':
        return 'Completing';
      case 'completed':
        return 'Completed';
      default:
        return status || 'active';
    }
  };

  // Check if user can interact
  const canUserInteract = () => {
    return userMembership && userMembership.status === 'active' && group?.status !== 'completed';
  };

  // Generate profile URL for a member
  const getMemberProfileUrl = (member) => {
    return `/profile/${encodeURIComponent(member.userEmail)}`;
  };

  // Fully Responsive Repository Information Component
  const RepositoryInfo = () => (
    <div className="bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-purple-900/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-purple-500/30 mb-4 sm:mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
          <span className="mr-2 text-lg sm:text-xl md:text-2xl">📁</span>
          <span className="hidden sm:inline">Project Repository</span>
          <span className="sm:hidden">Repository</span>
        </h3>
        <button
          onClick={() => setShowRepositoryInfo(!showRepositoryInfo)}
          className="text-purple-400 hover:text-purple-300 transition-colors text-base sm:text-lg p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
        >
          {showRepositoryInfo ? '▼' : '▶'}
        </button>
      </div>

      <div className="mb-3 sm:mb-4">
        <a
          href="https://github.com/FavoredOnlineInc"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-gradient-to-r from-gray-800 to-black text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-lg transform hover:scale-105 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start min-h-[44px]"
        >
          <span className="mr-2 text-base sm:text-lg md:text-xl">📁</span>
          <span className="hidden sm:inline">View Favored Online Repository</span>
          <span className="sm:hidden">View Repository</span>
          <span className="ml-1 sm:ml-2 md:ml-3">↗</span>
        </a>
      </div>

      {showRepositoryInfo && (
        <div className="space-y-3 sm:space-y-4 text-sm">
          <div className="bg-black/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="text-purple-400 font-semibold mb-2 text-sm sm:text-base">📋 Repository Requirements</h4>
            <ul className="text-gray-300 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>• All project code must be submitted to the Favored Online repository</li>
              <li>• Code must be well-documented with clear README files</li>
              <li>• Include setup instructions and dependencies</li>
              <li>• Follow proper Git commit practices</li>
              <li>• Ensure code is production-ready and tested</li>
            </ul>
          </div>

          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="text-orange-400 font-semibold mb-2 text-sm sm:text-base">📧 First Week Submission</h4>
            <p className="text-orange-300 mb-2 text-xs sm:text-sm">
              <strong>Product Owner:</strong> Within the first week, submit the following via email:
            </p>
            <ul className="text-gray-300 space-y-1 mb-3 text-xs sm:text-sm">
              <li>• GitHub username of each team member</li>
              <li>• GitHub profile URL of each team member</li>
              <li>• Project title and brief description</li>
              <li>• Expected completion timeline</li>
            </ul>
            <div className="bg-black/30 rounded-lg p-2 sm:p-3">
              <p className="text-orange-400 font-semibold text-xs sm:text-sm">📧 Email to:</p>
              <a
                href="mailto:info.favoredonline@gmail.com"
                className="text-lime-400 hover:text-lime-300 font-semibold transition-colors text-xs sm:text-sm break-all"
              >
                info.favoredonline@gmail.com
              </a>
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
            <h4 className="text-green-400 font-semibold mb-2 text-sm sm:text-base">🤝 Repository Setup</h4>
            <p className="text-green-300 text-xs sm:text-sm">
              A Favored Online representative will contact you within 2-3 business days after receiving your 
              submission to set up your project repository and provide access credentials.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Fully Responsive Admin Instructions Component
  const AdminInstructions = () => {
    if (userMembership?.role !== 'admin') return null;

    return (
      <div className="bg-gradient-to-br from-red-900/40 via-orange-900/40 to-red-900/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-red-500/30 mb-4 sm:mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center">
            <span className="mr-2 text-lg sm:text-xl md:text-2xl">👑</span>
            <span className="hidden sm:inline">Admin Instructions</span>
            <span className="sm:hidden">Admin Guide</span>
          </h3>
          <button
            onClick={() => setShowAdminInstructions(!showAdminInstructions)}
            className="text-red-400 hover:text-red-300 transition-colors text-base sm:text-lg p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            {showAdminInstructions ? '▼' : '▶'}
          </button>
        </div>

        {showAdminInstructions && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h4 className="text-yellow-400 font-semibold mb-2 text-sm sm:text-base">⚠️ Badge Verification</h4>
              <div className="text-yellow-300 text-xs sm:text-sm space-y-1">
                <div>• Click member profiles to view their complete project history</div>
                <div>• Verify code quality, documentation, and participation level</div>
                <div>• Match badge level to actual performance and contributions</div>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                <h4 className="text-blue-400 font-semibold text-sm sm:text-base">📊 Badge Levels</h4>
                <Link 
                  to="/tech-badges" 
                  target="_blank"
                  className="text-lime-400 hover:text-lime-300 font-semibold text-xs sm:text-sm transition-colors mt-1 sm:mt-0"
                >
                  Full Guide →
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 text-xs">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2">
                  <div className="text-orange-400 font-semibold">🔰 Novice</div>
                  <div className="text-orange-300">First project</div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                  <div className="text-blue-400 font-semibold">📈 Beginners</div>
                  <div className="text-blue-300">5+ projects</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2">
                  <div className="text-purple-400 font-semibold">⭐ Intermediate</div>
                  <div className="text-purple-300">10+ projects</div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                  <div className="text-green-400 font-semibold">🏆 Expert</div>
                  <div className="text-green-300">15+ projects</div>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <h4 className="text-green-400 font-semibold mb-2 text-sm sm:text-base">✅ Completion Checklist</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-green-300 text-xs sm:text-sm">
                <div>□ Code in repository</div>
                <div>□ Documentation complete</div>
                <div>□ Contributions verified</div>
                <div>□ Quality standards met</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading project group...</p>
        </div>
      </div>
    );
  }

  if (!userMembership) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: `url('/Images/backg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 border border-white/20 text-center max-w-sm sm:max-w-md w-full">
          <div className="text-3xl sm:text-4xl md:text-6xl mb-4 sm:mb-6">🔒</div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6 text-sm sm:text-base">You don't have permission to view this project group.</p>
          <Link 
            to="/my-groups" 
            className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 inline-block text-sm sm:text-base min-h-[44px] flex items-center justify-center"
          >
            ← My Groups
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
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Animated background overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

      {/* 🔥 Fully Responsive Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-2 sm:mr-3 md:mr-4 transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-base sm:text-lg md:text-2xl font-black text-white tracking-wide" 
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
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-10">
              {/* HOME LINK */}
             <Link 
               to={currentUser ? "/community" : "/"}
               className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 text-sm lg:text-base"
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
               >
               Home
             </Link>
              
              {/* MY CAREER LINK */}
              {currentUser && (
                <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 text-sm lg:text-base"
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  My Career
                </Link>
              )}
              
              {/* MY GROUPS LINK */}
             <Link to="/my-groups" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 text-sm lg:text-base"
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
               Groups
             </Link>
              
              {/* DASHBOARD LINK */}
              {currentUser && (
                <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 text-sm lg:text-base"
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Dashboard
                </Link>
              )}
              
              {/* USER AUTHENTICATION SECTION */}
              {currentUser ? (
                <div className="flex items-center space-x-2 lg:space-x-3 xl:space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 sm:px-3 lg:px-4 py-1 sm:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs sm:text-sm text-white font-medium truncate max-w-16 sm:max-w-20 lg:max-w-none" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  {/* Notification Bell */}
                  <NotificationBell />
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25 min-h-[44px]"
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
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Enhanced Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 sm:mt-4 md:mt-6 pb-3 sm:pb-4 md:pb-6 rounded-xl sm:rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 sm:space-y-4 md:space-y-5 p-3 sm:p-4 md:p-6">
                
                {/* HOME LINK FOR MOBILE */}
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg min-h-[44px] flex items-center" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {/* LOGGED IN USER MOBILE NAVIGATION */}
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg min-h-[44px] flex items-center" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>

                    <Link to="/my-groups" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg min-h-[44px] flex items-center" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Groups
                    </Link>

                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg min-h-[44px] flex items-center" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg min-h-[44px] flex items-center" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                {/* MOBILE USER AUTHENTICATION SECTION */}
                {currentUser ? (
                  <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3 min-h-[44px]">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                      )}
                      <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
                    </div>
                    {/* Mobile Notifications */}
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
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center shadow-xl min-h-[44px]"
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
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-7xl">
          
          {/* Group Header - Fully Responsive */}
          <section className="mb-6 sm:mb-8 md:mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 sm:mb-6 lg:mb-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-3 sm:mb-4 leading-tight">{group?.projectTitle}</h1>
                  <p className="text-gray-200 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 line-clamp-3">{group?.description}</p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
                    <span className="text-xs sm:text-sm bg-lime-500/20 text-lime-400 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full border border-lime-500/30">
                      👥 {members.length} members
                    </span>
                    <span className="text-xs sm:text-sm bg-blue-500/20 text-blue-400 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full border border-blue-500/30">
                      📝 {posts.length} posts
                    </span>
                    {userMembership?.role === 'admin' && (
                      <span className="text-xs sm:text-sm bg-yellow-500/20 text-yellow-400 px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full border border-yellow-500/30">
                        👑 Admin
                      </span>
                    )}
                    <span className={`text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-full border flex items-center ${getStatusColor(group?.status)}`}>
                      {getStatusIcon(group?.status)} {getStatusLabel(group?.status)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 sm:space-y-3">
                  {/* Completion Actions for Admins */}
                  {userMembership?.role === 'admin' && (
                    <>
                      {group?.status === 'active' && (
                        <Link 
                          to={`/groups/${groupId}/complete`}
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-center shadow-lg transform hover:scale-105 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                        >
                          🏁 Complete Project
                        </Link>
                      )}
                      
                      {group?.status === 'completing' && (
                        <Link 
                          to={`/groups/${groupId}/complete`}
                          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 text-center shadow-lg animate-pulse text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                        >
                          ⏳ Continue Completion
                        </Link>
                      )}
                      
                      {group?.status === 'completed' && (
                        <Link 
                          to={`/groups/${groupId}/complete`}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-center shadow-lg text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                        >
                          🎉 View Completion
                        </Link>
                      )}
                    </>
                  )}

                  {/* Project Status for Members */}
                  {userMembership?.role !== 'admin' && group?.status === 'completed' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center">
                      <div className="text-blue-400 font-semibold text-sm sm:text-base">🎉 Project Completed!</div>
                      <div className="text-gray-400 text-xs sm:text-sm mt-1">Check your dashboard for badges</div>
                    </div>
                  )}

                  {/* Post button available to ALL active members */}
                  {canUserInteract() && (
                    <button
                      onClick={() => setShowNewPostForm(!showNewPostForm)}
                      className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                    >
                      + New Post
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Repository Information */}
          <RepositoryInfo />

          {/* Admin Instructions */}
          <AdminInstructions />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            
            {/* Members Sidebar - Responsive */}
            <div className="lg:col-span-1 order-2 lg:order-1">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 lg:sticky lg:top-24">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 md:mb-6">
                  Team Members
                  <span className="block text-xs text-gray-400 font-normal mt-1">
                    <span className="hidden sm:inline">Click to view member profiles</span>
                    <span className="sm:hidden">Tap to view profiles</span>
                  </span>
                </h3>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  {members.map((member) => (
                    <Link
                      key={member.id}
                      to={getMemberProfileUrl(member)}
                      className="flex items-center space-x-2 sm:space-x-3 hover:bg-white/5 rounded-lg p-2 transition-colors cursor-pointer group min-h-[44px]"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center text-black font-bold text-xs sm:text-sm md:text-base flex-shrink-0">
                        {member.userName?.charAt(0).toUpperCase() || member.userEmail?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white group-hover:text-lime-400 transition-colors truncate text-sm sm:text-base">
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
                      <div className="text-gray-400 group-hover:text-lime-400 transition-colors text-sm">
                        →
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Project Completion Status Widget - Responsive */}
                {(group?.status === 'completing' || group?.status === 'completed') && (
                  <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/10">
                    <h4 className="text-lime-400 font-semibold mb-3 flex items-center text-sm sm:text-base">
                      {group?.status === 'completed' ? '🎉 Project Completed!' : '⏳ Completion in Progress'}
                    </h4>
                    
                    {group?.status === 'completed' ? (
                      <div className="space-y-2 text-xs sm:text-sm text-gray-300">
                        <div className="flex items-center justify-between">
                          <span>Team Members:</span>
                          <span className="text-lime-400 font-semibold">{members.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Badges Awarded:</span>
                          <span className="text-yellow-400 font-semibold">{Math.max(0, members.length - 1)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Certificate:</span>
                          <span className="text-blue-400 font-semibold">Generated</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs sm:text-sm text-gray-300">
                        <p>The project admin is evaluating team member contributions and awarding badges.</p>
                        {userMembership?.role === 'admin' && (
                          <Link
                            to={`/groups/${groupId}/complete`}
                            className="inline-block mt-3 text-lime-400 hover:text-lime-300 font-semibold"
                          >
                            Continue Evaluation →
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Posts Area - Fully Responsive */}
            <div className="lg:col-span-3 order-1 lg:order-2">
              
              {/* New Post Form - Fully Responsive with Link Support */}
              {showNewPostForm && canUserInteract() && (
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 mb-4 sm:mb-6 md:mb-8">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4 md:mb-6">Create New Post</h3>
                  <form onSubmit={handleSubmitPost} className="space-y-3 sm:space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Post Type</label>
                      <select
                        value={newPost.type}
                        onChange={(e) => setNewPost({...newPost, type: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                      >
                        <option value="discussion">💬 Discussion</option>
                        <option value="announcement">📢 Announcement</option>
                        <option value="task">✅ Task</option>
                        <option value="update">📊 Update</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Title</label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-sm sm:text-base min-h-[44px]"
                        placeholder="Enter post title..."
                        maxLength={100}
                        required
                      />
                      <div className="text-right text-gray-400 text-xs mt-1">
                        {newPost.title.length}/100 characters
                      </div>
                    </div>
                    
                    {/* 🔗 Enhanced Content Field with Link Support */}
                    <TextEditorWithLinks
                      label="Content"
                      value={newPost.content}
                      onChange={(value) => setNewPost({...newPost, content: value})}
                      placeholder="Share your thoughts, updates, or questions... Use the 🔗 button to insert links!"
                      className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 h-20 sm:h-24 md:h-32 resize-vertical text-sm sm:text-base"
                      maxLength={2000}
                      required
                    />

                    {/* Image Upload Section - Fully Responsive */}
                    <div>
                      <label className="block text-lime-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                        Images (Optional) - {totalImages} / {MAX_IMAGES}
                      </label>
                      
                      {/* Current Uploaded Images */}
                      {newPost.images.length > 0 && (
                        <div className="mb-3 sm:mb-4 md:mb-6">
                          <h4 className="text-white text-sm font-medium mb-2 sm:mb-3 flex items-center">
                            <span className="text-green-400 mr-2">✓</span>
                            Uploaded Images ({newPost.images.length}):
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold transition-colors min-w-[24px] min-h-[24px]"
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
                        <div className="mb-3 sm:mb-4 md:mb-6">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h4 className="text-white text-sm font-medium flex items-center">
                              <span className="text-yellow-400 mr-2">⏳</span>
                              Selected Files ({selectedFiles.length}):
                            </h4>
                            <button
                              type="button"
                              onClick={uploadImages}
                              disabled={uploadingImages}
                              className="bg-lime-500 hover:bg-lime-600 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-h-[32px]"
                            >
                              {uploadingImages ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                                  <span className="hidden sm:inline">Uploading...</span>
                                  <span className="sm:hidden">...</span>
                                </>
                              ) : (
                                <>
                                  <span className="mr-1 sm:mr-2">📤</span>
                                  <span className="hidden sm:inline">Upload All</span>
                                  <span className="sm:hidden">Upload</span>
                                </>
                              )}
                            </button>
                          </div>
                          
                          <div className="space-y-2 sm:space-y-3">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-2 sm:p-3 border border-white/20">
                                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                                  <img 
                                    src={previewUrls[index]} 
                                    alt={file.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover rounded border border-white/20 flex-shrink-0"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white text-xs sm:text-sm font-medium truncate">{file.name}</p>
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
                                    className="text-red-400 hover:text-red-300 text-xs sm:text-sm px-2 py-1 rounded hover:bg-red-400/10 transition-colors min-h-[32px]"
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

                      {/* File Input / Drop Zone - Fully Responsive */}
                      {canAddMoreImages && (
                        <div 
                          className={`border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-center transition-all duration-300 ${
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
                            id="image-upload-group"
                            multiple
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          <label htmlFor="image-upload-group" className="cursor-pointer block">
                            <div className="text-3xl sm:text-4xl md:text-5xl mb-2 sm:mb-3 md:mb-4">
                              {dragActive ? '📥' : '📸'}
                            </div>
                            <p className="text-white font-medium mb-2 text-sm sm:text-base md:text-lg">
                              {dragActive ? 'Drop images here' : (
                                <>
                                  <span className="hidden sm:inline">Click to select images or drag & drop</span>
                                  <span className="sm:hidden">Tap to select images</span>
                                </>
                              )}
                            </p>
                            <p className="text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 md:mb-4">
                              JPEG, PNG, GIF, WebP • Max 10MB each • Up to {MAX_IMAGES} images total
                            </p>
                            <div className="inline-flex items-center bg-lime-500/20 border border-lime-400/40 rounded-lg px-2 sm:px-3 md:px-4 py-1 sm:py-2 text-lime-300 text-xs sm:text-sm">
                              <span className="mr-1 sm:mr-2">⚡</span>
                              {MAX_IMAGES - totalImages} more image{MAX_IMAGES - totalImages !== 1 ? 's' : ''} allowed
                            </div>
                          </label>
                        </div>
                      )}
                      
                      <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-3 flex items-center">
                        <span className="text-blue-400 mr-2">ℹ️</span>
                        Images will be hosted on Imgur and displayed with your post. They help make your content more engaging!
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        type="submit"
                        disabled={!newPost.title.trim() || !newPost.content.trim() || selectedFiles.length > 0}
                        className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-colors duration-300 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                      >
                        {selectedFiles.length > 0 ? (
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
                          setNewPost({ title: '', content: '', type: 'discussion', images: [] });
                          setSelectedFiles([]);
                          setPreviewUrls([]);
                          setImageUploadProgress({});
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-colors duration-300 text-sm sm:text-base min-h-[44px] flex items-center justify-center"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Project Completed Message - Responsive */}
              {group?.status === 'completed' && (
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-500/20 mb-4 sm:mb-6 md:mb-8 text-center">
                  <div className="text-3xl sm:text-4xl md:text-6xl mb-3 sm:mb-4">🎉</div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">Project Successfully Completed!</h3>
                  <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                    This project has been completed and all team members have been evaluated. 
                    {userMembership?.role === 'admin' 
                      ? ' Your certificate is ready for download.' 
                      : ' Check your dashboard for your earned badge!'}
                  </p>
                  {userMembership?.role === 'admin' && (
                    <Link
                      to={`/groups/${groupId}/complete`}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm sm:text-base inline-block min-h-[44px] flex items-center justify-center"
                    >
                      📜 View Completion Details
                    </Link>
                  )}
                </div>
              )}

              {/* Posts List - Fully Responsive with Link Support and Pin Functionality */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {postsLoading ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-lime-400 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-gray-400 text-sm sm:text-base">Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12 border border-white/20 text-center">
                    <div className="text-3xl sm:text-4xl md:text-6xl mb-3 sm:mb-4 md:mb-6">💬</div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4">No posts yet</h3>
                    <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Be the first to start a discussion in this project group!</p>
                    {canUserInteract() && (
                      <button
                        onClick={() => setShowNewPostForm(true)}
                        className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold hover:from-lime-600 hover:to-green-600 transition-all duration-300 text-sm sm:text-base min-h-[44px] flex items-center justify-center mx-auto"
                      >
                        Create First Post
                      </button>
                    )}
                  </div>
                ) : (
                  posts.map((post) => (
                    <div key={post.id} className={`bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-white/20 hover:border-lime-400/30 transition-all duration-300 ${post.isPinned ? 'ring-2 ring-yellow-500/50' : ''}`}>
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            {post.authorPhoto ? (
                              <img src={post.authorPhoto} alt="" className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full" />
                            ) : (
                              <span className="text-black font-bold text-xs sm:text-sm md:text-base">
                                {post.authorName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white text-sm sm:text-base truncate">{post.authorName}</p>
                            <p className="text-gray-400 text-xs sm:text-sm">
                              {post.createdAt?.toLocaleDateString()} at {post.createdAt?.toLocaleTimeString()}
                              {post.isEdited && (
                                <span className="ml-2 text-xs text-gray-500 italic">(edited)</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                          {/* 📌 NEW: Pin/Unpin Button for Admins */}
                          {userMembership?.role === 'admin' && canUserInteract() && (
                            <button
                              onClick={() => handleTogglePin(post.id, post.isPinned)}
                              className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 border min-h-[32px] ${
                                post.isPinned 
                                  ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 hover:text-yellow-300 border-yellow-500/30' 
                                  : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 hover:text-gray-300 border-gray-500/30'
                              }`}
                              title={post.isPinned ? "Unpin post" : "Pin post to top"}
                            >
                              <span className="hidden sm:inline">
                                {post.isPinned ? '📌 Unpin' : '📌 Pin'}
                              </span>
                              <span className="sm:hidden">
                                {post.isPinned ? '📌' : '📍'}
                              </span>
                            </button>
                          )}

                          {/* Edit button - only show for post author */}
                          {canEditPost(post) && canUserInteract() && (
                            <button
                              onClick={() => startEditingPost(post)}
                              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 border border-blue-500/30 min-h-[32px]"
                              title="Edit post"
                            >
                              <span className="hidden sm:inline">✏️ Edit</span>
                              <span className="sm:hidden">✏️</span>
                            </button>
                          )}
                          {post.isPinned && (
                            <span className="text-yellow-500 text-sm sm:text-lg" title="Pinned Post">📌</span>
                          )}
                          <span className="text-xs bg-gray-700/50 text-gray-300 px-2 sm:px-3 py-1 rounded-full flex items-center">
                            <span className="mr-1">
                              {post.type === 'discussion' && '💬'}
                              {post.type === 'announcement' && '📢'}
                              {post.type === 'task' && '✅'}
                              {post.type === 'update' && '📊'}
                            </span>
                            <span className="hidden sm:inline">{post.type}</span>
                          </span>
                        </div>
                      </div>
                      
                      {editingPost === post.id ? (
                        /* Edit Mode - Responsive with Link Support */
                        <div className="space-y-3 sm:space-y-4 mb-3 sm:mb-4">
                          <div>
                            <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Post Type</label>
                            <select
                              value={editPostData.type}
                              onChange={(e) => setEditPostData({...editPostData, type: e.target.value})}
                              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-white focus:border-lime-400 focus:outline-none text-sm sm:text-base min-h-[44px]"
                            >
                              <option value="discussion">💬 Discussion</option>
                              <option value="announcement">📢 Announcement</option>
                              <option value="task">✅ Task</option>
                              <option value="update">📊 Update</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Title</label>
                            <input
                              type="text"
                              value={editPostData.title}
                              onChange={(e) => setEditPostData({...editPostData, title: e.target.value})}
                              className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none text-sm sm:text-base min-h-[44px]"
                              placeholder="Enter post title..."
                              maxLength={100}
                            />
                            <div className="text-right text-gray-400 text-xs mt-1">
                              {editPostData.title.length}/100 characters
                            </div>
                          </div>
                          
                          {/* 🔗 Enhanced Edit Content Field with Link Support */}
                          <TextEditorWithLinks
                            label="Content"
                            value={editPostData.content}
                            onChange={(value) => setEditPostData({...editPostData, content: value})}
                            placeholder="Share your thoughts, updates, or questions... Use the 🔗 button to insert links!"
                            className="w-full bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none h-20 sm:h-24 md:h-32 resize-vertical text-sm sm:text-base"
                            maxLength={2000}
                            required
                          />
                          
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <button
                              onClick={() => handleEditPost(post.id)}
                              disabled={!editPostData.title.trim() || !editPostData.content.trim()}
                              className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-colors duration-300 text-sm min-h-[44px] flex items-center justify-center"
                            >
                              💾 Save Changes
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl font-semibold transition-colors duration-300 text-sm min-h-[44px] flex items-center justify-center"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">{post.title}</h3>
                          {/* 🔗 Enhanced Content Display with Clickable Links */}
                          <div className="text-gray-300 leading-relaxed mb-3 sm:mb-4 whitespace-pre-wrap text-sm sm:text-base">
                            {renderContentWithLinks(post.content)}
                          </div>
                          
                          {/* Display Images */}
                          <ImageGallery images={post.images} />
                          
                          {/* Like Button and Preview Section - Responsive */}
                          {canUserInteract() && editingPost !== post.id && (
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                              <button
                                onClick={() => handleLikePost(post.id, isPostLikedByUser(post))}
                                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base min-h-[36px] sm:min-h-[40px] ${
                                  isPostLikedByUser(post)
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                    : 'bg-white/5 text-gray-400 border border-white/20 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span className="text-sm sm:text-base md:text-lg">
                                  {isPostLikedByUser(post) ? '❤️' : '🤍'}
                                </span>
                                <span className="hidden sm:inline">Like</span>
                              </button>
                              
                              {/* Likes Preview with Profile Pictures */}
                              <LikesPreview 
                                post={post}
                                onOpenModal={openLikesModal}
                                previewUsers={likesPreviewData[post.id] || []}
                              />
                            </div>
                          )}

                          {/* Show likes preview for non-interactive users too */}
                          {!canUserInteract() && post.likeCount > 0 && (
                            <div className="mb-3 sm:mb-4">
                              <LikesPreview 
                                post={post}
                                onOpenModal={openLikesModal}
                                previewUsers={likesPreviewData[post.id] || []}
                              />
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Reply Section - Fully Responsive with Link Support */}
                      {canUserInteract() && editingPost !== post.id && (
                        <div className="border-t border-gray-700 pt-3 sm:pt-4 mb-3 sm:mb-4">
                          
                          {/* Display existing replies */}
                          {replies[post.id] && replies[post.id].length > 0 && (
                            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                              <h4 className="text-sm font-semibold text-gray-400">Replies:</h4>
                              {replies[post.id].map((reply) => (
                                <div key={reply.id} className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center text-black text-xs font-bold flex-shrink-0">
                                        {reply.authorName?.charAt(0)?.toUpperCase() || '?'}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs sm:text-sm font-medium text-white truncate">{reply.authorName}</p>
                                        <p className="text-xs text-gray-400">
                                          {reply.createdAt?.toLocaleDateString()} at {reply.createdAt?.toLocaleTimeString()}
                                          {reply.isEdited && (
                                            <span className="ml-1 text-xs text-gray-500 italic">(edited)</span>
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* Edit button for reply author */}
                                    {canEditReply(reply) && (
                                      <button
                                        onClick={() => startEditingReply(reply)}
                                        className="text-gray-400 hover:text-lime-400 transition-colors text-xs flex-shrink-0 min-w-[32px] min-h-[32px] flex items-center justify-center"
                                        title="Edit reply"
                                      >
                                        ✏️
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Reply content or edit form */}
                                  {editingReply === reply.id ? (
                                    <div className="space-y-2">
                                      {/* 🔗 Enhanced Reply Edit with Link Support */}
                                      <TextEditorWithLinks
                                        value={editReplyContent}
                                        onChange={setEditReplyContent}
                                        placeholder="Edit your reply... Use the 🔗 button to insert links!"
                                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none text-sm h-16 sm:h-20 resize-vertical"
                                        maxLength={1000}
                                      />
                                      <div className="flex items-center justify-between">
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => handleEditReply(reply.id)}
                                            disabled={!editReplyContent.trim()}
                                            className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-xs font-semibold transition-colors duration-300 min-h-[32px]"
                                          >
                                            💾 Save
                                          </button>
                                          <button
                                            onClick={cancelReplyEdit}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-semibold transition-colors duration-300 min-h-[32px]"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    /* 🔗 Enhanced Reply Display with Clickable Links */
                                    <div className="text-gray-300 text-xs sm:text-sm whitespace-pre-wrap">
                                      {renderContentWithLinks(reply.content)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* New reply form - Responsive with Link Support */}
                          {replyingTo === post.id ? (
                            <div className="space-y-3">
                              {/* 🔗 Enhanced Reply Input with Link Support */}
                              <TextEditorWithLinks
                                value={replyContent}
                                onChange={setReplyContent}
                                placeholder="Write your reply... Use the 🔗 button to insert links!"
                                className="w-full bg-white/5 border border-white/20 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 h-16 sm:h-20 md:h-24 resize-vertical text-sm sm:text-base"
                                maxLength={1000}
                              />
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                  <button
                                    onClick={() => handleSubmitReply(post.id)}
                                    disabled={!replyContent.trim()}
                                    className="bg-lime-600 hover:bg-lime-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 min-h-[36px] flex items-center justify-center"
                                  >
                                    💬 Reply
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyContent('');
                                    }}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-300 min-h-[36px] flex items-center justify-center"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyingTo(post.id);
                                setEditingReply(null);
                                setEditReplyContent('');
                              }}
                              className="text-lime-400 hover:text-lime-300 text-sm font-medium transition-colors duration-300 min-h-[32px] flex items-center"
                            >
                              💬 Reply to this post
                            </button>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-700">
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap gap-y-1">
                          <div className="text-gray-400 text-xs sm:text-sm">
                            💬 {post.replyCount || 0} {(post.replyCount || 0) === 1 ? 'reply' : 'replies'}
                          </div>
                          {/* Image indicator */}
                          {post.images && post.images.length > 0 && (
                            <div className="text-gray-400 text-xs sm:text-sm flex items-center">
                              <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {post.images.length}
                            </div>
                          )}
                          {/* Alternative Edit Button */}
                          {canEditPost(post) && canUserInteract() && editingPost !== post.id && (
                            <button
                              onClick={() => startEditingPost(post)}
                              className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center space-x-1 min-h-[32px]"
                            >
                              <span>✏️</span>
                              <span className="hidden sm:inline">Edit Post</span>
                            </button>
                          )}
                        </div>
                        <Link 
                          to={`/groups/${groupId}/posts/${post.id}`}
                          className="text-lime-400 hover:text-lime-300 text-xs sm:text-sm font-medium transition-colors duration-300 flex items-center min-h-[32px]"
                        >
                          <span className="hidden sm:inline">View Discussion</span>
                          <span className="sm:hidden">View</span>
                          <span className="ml-1 sm:ml-2">→</span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Likes Modal - Responsive */}
      <LikesModal 
        postId={showLikesModal}
        isOpen={!!showLikesModal}
        onClose={closeLikesModal}
        likesData={likesData}
        likeCount={showLikesModal ? (posts.find(p => p.id === showLikesModal)?.likeCount || 0) : 0}
      />

      {/* Custom Styles with Link Enhancement */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { 
          font-family: 'Inter', sans-serif; 
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* 🔥 CSS FIXES for Image Gallery Click Issues */
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

        /* Ensure images are clickable */
        img[style*="pointer-events: auto"] {
          pointer-events: auto !important;
          cursor: pointer !important;
        }

        /* Fix for any overlay elements that might block clicks */
        .absolute.inset-0 {
          pointer-events: none;
        }

        .absolute.inset-0.cursor-pointer {
          pointer-events: auto;
        }

        /* Ensure lightbox is properly clickable */
        .lightbox-overlay {
          pointer-events: auto !important;
          z-index: 9999 !important;
        }

        .lightbox-overlay img {
          pointer-events: auto !important;
        }

        .lightbox-overlay button {
          pointer-events: auto !important;
          z-index: 10000 !important;
        }

       /* 🔗 Enhanced Link Styles - Only for content within posts */
        .text-gray-300 a[href], .whitespace-pre-wrap a[href] {
          color: #a3e635 !important;
          text-decoration: underline;
          transition: color 0.3s ease;
          font-weight: 500;
        }

        .text-gray-300 a[href]:hover, .whitespace-pre-wrap a[href]:hover {
          color: #bef264 !important;
          text-decoration: underline;
        }

        /* Link button in text editor */
        .relative textarea + button {
          pointer-events: auto;
          z-index: 10;
        }

        /* Ensure proper text sizing for mobile */
        @media (max-width: 640px) {
          button, a, input, textarea, select {
            min-height: 44px;
          }
          
          /* Better text sizing for mobile */
          .text-xs { font-size: 0.75rem; }
          .text-sm { font-size: 0.875rem; }
          .text-base { font-size: 1rem; }
          
          /* Fix for mobile touch events */
          .image-gallery img {
            touch-action: manipulation;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
          
          /* Ensure touch targets are large enough */
          .image-gallery .relative {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        /* Enhanced responsive breakpoints */
        @media (min-width: 640px) and (max-width: 767px) {
          /* Tablet portrait optimizations */
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        @media (min-width: 768px) {
          /* Tablet landscape and desktop optimizations */
          .lg\\:sticky {
            position: sticky;
          }
        }
        
        /* High DPI display optimizations */
        @media (-webkit-min-device-pixel-ratio: 2) {
          img {
            image-rendering: -webkit-optimize-contrast;
          }
        }

        /* Remove hover effects that might interfere on mobile */
        @media (hover: none) and (pointer: coarse) {
          .group:hover .opacity-0 {
            opacity: 0 !important;
          }
          
          .hover\\:scale-105:hover,
          .hover\\:scale-110:hover,
          .hover\\:scale-\\[1\\.02\\]:hover {
            transform: none;
          }
        }

        /* 🔗 Link Preview Enhancement */
        .whitespace-pre-wrap a {
          word-break: break-word;
          max-width: 100%;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default ProjectGroupView;
