//src/Pages/community/CommunityPosts.jsx - COMPLETE WITH FOLLOW SUGGESTIONS SIDEBAR

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { safeMentionNotification } from '../../utils/emailNotifications';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  limit, 
  startAfter, 
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// Import error handling utilities
import { 
  safeFirestoreOperation, 
  showSuccessMessage, 
  showWarningMessage,
  handleFirebaseError 
} from '../../utils/errorHandler';

// Import tagging and reposting utilities
import { extractMentions, validateMentions } from '../../utils/mentionUtils';
import { createRepost, hasUserReposted } from '../../utils/repostUtils';

// 🔥 NEW: Import unified follow system
import { 
  followUser, 
  unfollowUser, 
  getFollowingStatusForUsers, 
  handleFollowToggle,
  getUserCounts
} from '../../utils/followSystem';

// 🔥 NEW: Import notification system
import NotificationBell from '../../components/NotificationBell';

// 🔥 NEW: Import ClickableUser components
import { 
  ClickableUserAvatar, 
  ClickableUserName
} from '../../components/ClickableUser';

// 🔥 ENHANCED: Clickable User Name Component with proper navigation
const EnhancedClickableUserName = ({ user, className = "", children, showTitle = true }) => {
  const navigate = useNavigate();
  
  const handleUserClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      // Navigate to user profile using email (URL encoded)
      if (user?.email) {
        const encodedEmail = encodeURIComponent(user.email);
        navigate(`/profile/${encodedEmail}`);
      } else if (user?.uid) {
        // Fallback to uid if email is not available
        navigate(`/profile/${user.uid}`);
      } else {
        console.warn('User object missing both email and uid:', user);
        showWarningMessage('Unable to view user profile - missing user information');
      }
    } catch (error) {
      console.error('Error navigating to user profile:', error);
      showWarningMessage('Unable to view user profile');
    }
  };

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.displayName || user?.name || 'Unknown User';

  return (
    <button
      onClick={handleUserClick}
      className={`${className} clickable-username hover:underline cursor-pointer transition-all duration-200 text-left`}
      title={showTitle ? `View profile of ${displayName}` : undefined}
    >
      {children || displayName}
    </button>
  );
};

// 🎥 NEW: Video Validation Utilities
const validateVideoFile = (file) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
  const maxSize = 200 * 1024 * 1024; // 200MB max file size
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only MP4, WebM, MOV, and AVI video formats are supported');
  }
  
  if (file.size > maxSize) {
    throw new Error('Video file must be under 200MB');
  }
  
  return true;
};

const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      
      if (duration > 60) { // 5 minutes = 300 seconds
        reject(new Error('Video must be 5 minutes or shorter to comply with hosting limits'));
      } else {
        resolve(duration);
      }
    };
    
    video.onerror = () => {
      window.URL.revokeObjectURL(video.src);
      reject(new Error('Could not load video file'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

// 🎥 NEW: Enhanced MediaGallery Component (replaces ImageGallery)
const MediaGallery = ({ media }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef(null);

  const openLightbox = (mediaItem, index) => {
    console.log('🖼️ Opening lightbox:', { mediaItem, index, media });
    if (!mediaItem || !media || !media[index]) {
      console.error('❌ Invalid media data:', { mediaItem, index, media });
      return;
    }
    
    setSelectedMedia(mediaItem);
    setCurrentMediaIndex(index);
    setIsVideoPlaying(false);
  };

  const closeLightbox = () => {
    console.log('🔒 Closing lightbox');
    setSelectedMedia(null);
    setCurrentMediaIndex(0);
    setIsVideoPlaying(false);
  };

  const navigateMedia = (direction) => {
    if (!media || media.length === 0) return;
    
    const newIndex = direction === 'next' 
      ? (currentMediaIndex + 1) % media.length
      : (currentMediaIndex - 1 + media.length) % media.length;
    
    console.log('📍 Navigating to media:', { direction, newIndex, total: media.length });
    setCurrentMediaIndex(newIndex);
    setSelectedMedia(media[newIndex]);
    setIsVideoPlaying(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') navigateMedia('next');
    if (e.key === 'ArrowLeft') navigateMedia('prev');
    if (e.key === ' ' && selectedMedia?.type === 'video') {
      e.preventDefault();
      toggleVideoPlay();
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  useEffect(() => {
    if (selectedMedia) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedMedia, currentMediaIndex, isVideoPlaying]);

  // Add validation
  if (!media || media.length === 0) {
    console.log('📷 No media provided');
    return null;
  }

  // Ensure media items have proper structure
  const validMedia = media.filter(item => item && item.url && (item.type === 'image' || item.type === 'video'));
  if (validMedia.length === 0) {
    console.log('📷 No valid media found');
    return null;
  }

  console.log('📷 Rendering gallery with', validMedia.length, 'media items');

  const displayMedia = validMedia.slice(0, 4); // Show up to 4 items in grid

  const renderMediaThumbnail = (mediaItem, index) => {
    if (mediaItem.type === 'video') {
      return (
        <div className="relative group">
          <video 
            src={mediaItem.url}
            className="w-full h-32 sm:h-48 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🖱️ Video thumbnail clicked:', { url: mediaItem.url, index });
              openLightbox(mediaItem, index);
            }}
            preload="metadata"
            style={{ 
              pointerEvents: 'auto',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1
            }}
          />
          {/* Video Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors duration-300 rounded-lg pointer-events-none">
            <div className="bg-black/70 text-white rounded-full p-2 sm:p-3">
              <svg className="h-4 w-4 sm:h-6 sm:w-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          {/* Duration Badge */}
          {mediaItem.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded video-duration-badge">
              {Math.floor(mediaItem.duration / 60)}:{String(Math.floor(mediaItem.duration % 60)).padStart(2, '0')}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <img 
          src={mediaItem.url} 
          alt={mediaItem.filename || `Media ${index + 1}`}
          className="w-full h-32 sm:h-48 object-cover rounded-lg border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Image clicked:', { url: mediaItem.url, index });
            openLightbox(mediaItem, index);
          }}
          loading="lazy"
          style={{ 
            pointerEvents: 'auto',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 1
          }}
        />
      );
    }
  };

  return (
    <>
      <div className="mt-3 sm:mt-4 mb-3 sm:mb-4">
        {displayMedia.length === 1 ? (
          <div className="relative group">
            {displayMedia[0].type === 'video' ? (
              <>
                <video 
                  src={displayMedia[0].url}
                  className="w-full max-h-64 sm:max-h-96 object-cover rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Single video clicked:', displayMedia[0].url);
                    openLightbox(displayMedia[0], 0);
                  }}
                  preload="metadata"
                  style={{ 
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
                {/* Video Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors duration-300 rounded-xl pointer-events-none video-play-overlay">
                  <div className="bg-black/70 text-white rounded-full p-4 sm:p-6">
                    <svg className="h-8 w-8 sm:h-12 sm:w-12 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                {/* Duration Badge */}
                {displayMedia[0].duration && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-2 py-1 rounded video-duration-badge">
                    {Math.floor(displayMedia[0].duration / 60)}:{String(Math.floor(displayMedia[0].duration % 60)).padStart(2, '0')}
                  </div>
                )}
              </>
            ) : (
              <img 
                src={displayMedia[0].url} 
                alt={displayMedia[0].filename || "Post media"}
                className="w-full max-h-64 sm:max-h-96 object-cover rounded-xl border border-white/20 cursor-pointer hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Single image clicked:', displayMedia[0].url);
                  openLightbox(displayMedia[0], 0);
                }}
                loading="lazy"
                style={{ 
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
              <div className="bg-black/50 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                Click to view full size
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            {displayMedia.map((mediaItem, index) => (
              <div key={index} className="relative group">
                {renderMediaThumbnail(mediaItem, index)}
                {/* More Items Indicator */}
                {index === 3 && validMedia.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg text-white font-bold text-lg sm:text-xl cursor-pointer hover:bg-black/50 transition-colors"
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         openLightbox(mediaItem, index);
                       }}>
                    +{validMedia.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🎥 ENHANCED: Lightbox with Video Support */}
      {selectedMedia && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-2 sm:p-4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Lightbox overlay clicked');
            closeLightbox();
          }}
          style={{ 
            pointerEvents: 'auto',
            zIndex: 201
          }}
        >
          <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
            {selectedMedia.type === 'video' ? (
              <video 
                ref={videoRef}
                src={selectedMedia.url}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                controls
                autoPlay={false}
                preload="metadata"
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onError={(e) => {
                  console.error('❌ Failed to load video:', selectedMedia.url);
                  closeLightbox();
                }}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 201
                }}
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt="Full size"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('🖱️ Lightbox image clicked (no action)');
                }}
                onError={(e) => {
                  console.error('❌ Failed to load image:', selectedMedia.url);
                  closeLightbox();
                }}
                style={{ 
                  pointerEvents: 'auto',
                  zIndex: 201
                }}
              />
            )}
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Close button clicked');
                closeLightbox();
              }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors z-10"
              title="Close (Esc)"
              style={{ 
                pointerEvents: 'auto',
                zIndex: 201
              }}
            >
              ×
            </button>

            {validMedia.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Previous button clicked');
                    navigateMedia('prev');
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors"
                  title="Previous media (←)"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 201
                  }}
                >
                  ‹
                </button>
                
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🖱️ Next button clicked');
                    navigateMedia('next');
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold transition-colors"
                  title="Next media (→)"
                  style={{ 
                    pointerEvents: 'auto',
                    zIndex: 201
                  }}
                >
                  ›
                </button>
              </>
            )}

            {/* Media Counter */}
            {validMedia.length > 1 && (
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm">
                {currentMediaIndex + 1} of {validMedia.length}
              </div>
            )}

            {/* Media Info */}
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 bg-black/50 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm max-w-32 sm:max-w-64">
              <div className="truncate">
                {selectedMedia.type === 'video' ? '🎥' : '🖼️'} {validMedia[currentMediaIndex]?.filename || `${selectedMedia.type} ${currentMediaIndex + 1}`}
              </div>
              {selectedMedia.type === 'video' && selectedMedia.duration && (
                <div className="text-lime-400 text-xs">
                  Duration: {Math.floor(selectedMedia.duration / 60)}:{String(Math.floor(selectedMedia.duration % 60)).padStart(2, '0')}
                </div>
              )}
            </div>

            {/* Video Play/Pause Hint */}
            {selectedMedia.type === 'video' && (
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-black/50 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm">
                Press Space to {isVideoPlaying ? 'pause' : 'play'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// 🔗 ENHANCED: Link Rendering Utilities - Handles both markdown links AND plain URLs
const parseLinksAndUrls = (text) => {
  if (!text) return [];
  
  const parts = [];
  let currentIndex = 0;
  
  // Combined regex for markdown links and plain URLs
  const combinedRegex = /(\[([^\]]+)\]\(([^)]+)\))|(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    const [fullMatch, markdownFull, markdownText, markdownUrl, plainUrl] = match;
    const matchIndex = match.index;
    
    // Add text before the current match
    if (matchIndex > currentIndex) {
      const beforeText = text.substring(currentIndex, matchIndex);
      if (beforeText.trim()) {
        parts.push({
          type: 'text',
          content: beforeText,
          key: `text-${currentIndex}-${matchIndex}`
        });
      }
    }
    
    if (markdownFull) {
      // Handle markdown link [text](url)
      parts.push({
        type: 'link',
        content: markdownText,
        url: markdownUrl,
        key: `link-${matchIndex}-${markdownText}`,
        isMarkdown: true
      });
    } else if (plainUrl) {
      // Handle plain URL https://example.com
      const displayUrl = plainUrl.length > 50 ? 
        plainUrl.substring(0, 47) + '...' : plainUrl;
      
      parts.push({
        type: 'link',
        content: displayUrl,
        url: plainUrl,
        key: `link-${matchIndex}-${plainUrl}`,
        isMarkdown: false
      });
    }
    
    currentIndex = matchIndex + fullMatch.length;
  }
  
  // Add remaining text after the last match
  if (currentIndex < text.length) {
    const remainingText = text.substring(currentIndex);
    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText,
        key: `text-${currentIndex}-end`
      });
    }
  }
  
  // If no links were found, return the original text as a single text part
  if (parts.length === 0) {
    return [{
      type: 'text',
      content: text,
      key: 'text-only'
    }];
  }
  
  return parts;
};

/**
 * Enhanced URL validation and sanitization
 */
const sanitizeUrl = (url) => {
  if (!url) return '#';
  
  try {
    // Add protocol if missing (for markdown links only)
    let sanitizedUrl = url.trim();
    if (!/^https?:\/\//i.test(sanitizedUrl)) {
      sanitizedUrl = 'https://' + sanitizedUrl;
    }
    
    // Validate URL
    const urlObj = new URL(sanitizedUrl);
    
    // Security checks
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.warn('Blocked non-HTTP(S) URL:', url);
      return '#';
    }
    
    // Block potentially dangerous URLs
    const hostname = urlObj.hostname.toLowerCase();
    const dangerousPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1'
    ];
    
    if (dangerousPatterns.some(pattern => hostname.includes(pattern))) {
      console.warn('Blocked potentially dangerous URL:', url);
      return '#';
    }
    
    return sanitizedUrl;
  } catch (error) {
    console.warn('Invalid URL provided:', url, error);
    return '#';
  }
};

/**
 * Enhanced component to render text with clickable links
 * Now handles both markdown links and plain URLs
 */
const RichTextContent = ({ content, className = "", style = {} }) => {
  const parts = parseLinksAndUrls(content);
  
  return (
    <span className={className} style={style}>
      {parts.map((part) => {
        if (part.type === 'link') {
          const sanitizedUrl = sanitizeUrl(part.url);
          
          return (
            <a
              key={part.key}
              href={sanitizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-blue-400 hover:text-blue-300 underline hover:no-underline transition-all duration-200 font-medium break-words ${
                part.isMarkdown ? 'bg-blue-500/10 px-1 rounded' : ''
              }`}
              onClick={(e) => {
                // Additional safety check
                if (sanitizedUrl === '#') {
                  e.preventDefault();
                  console.warn('Blocked unsafe URL click');
                  return;
                }
                
                // Analytics tracking (optional)
                console.log('Link clicked:', {
                  url: sanitizedUrl,
                  isMarkdown: part.isMarkdown,
                  displayText: part.content
                });
              }}
              title={`Visit: ${part.content} (${sanitizedUrl})`}
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {part.content}
            </a>
          );
        } else {
          return (
            <span key={part.key} style={{ whiteSpace: 'pre-wrap' }}>
              {part.content}
            </span>
          );
        }
      })}
    </span>
  );
};

/**
 * Enhanced component for truncated content with link support
 * Now handles both types of links
 */
const TruncatedRichContent = ({ content, postId, limit = 300, expandedPosts, onToggleExpansion }) => {
  if (!content) return null;
  
  const isExpanded = expandedPosts.has(postId);
  const shouldTruncate = content.length > limit;
  
  let displayContent = content;
  if (shouldTruncate && !isExpanded) {
    // Be careful not to truncate in the middle of a URL or markdown link
    let truncateAt = limit;
    
    // Find a safe place to truncate (not in the middle of a URL)
    const urlPattern = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)|(\[([^\]]+)\]\(([^)]+)\))/g;
    let match;
    
    while ((match = urlPattern.exec(content)) !== null) {
      const matchStart = match.index;
      const matchEnd = matchStart + match[0].length;
      
      // If truncation point is in the middle of a URL/link, move it before the URL
      if (matchStart < truncateAt && truncateAt < matchEnd) {
        truncateAt = matchStart;
        break;
      }
    }
    
    displayContent = content.substring(0, truncateAt) + '...';
  }
  
  return (
    <div>
      <RichTextContent 
        content={displayContent}
        className="text-gray-200 leading-relaxed whitespace-pre-wrap text-sm sm:text-base"
      />
      
      {shouldTruncate && (
        <button
          onClick={() => onToggleExpansion(postId)}
          className="inline-flex items-center mt-2 sm:mt-3 text-lime-400 hover:text-lime-300 font-semibold text-xs sm:text-sm transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </>
          ) : (
            <>
              <span>Read more</span>
              <svg className="ml-1 h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>
      )}
    </div>
  );
};

// 🔥 NEW: Share functionality helper
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// 🔥 RESPONSIVE: Mobile Sidebar Toggle Component - Updated for only left sidebar
const MobileSidebarToggle = ({ leftSidebarOpen, onToggleLeftSidebar }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col space-y-2 lg:hidden">
      {/* Quick Actions Button */}
      <button
        onClick={onToggleLeftSidebar}
        className={`w-12 h-12 rounded-full shadow-2xl border-2 transition-all duration-300 flex items-center justify-center group ${
          leftSidebarOpen 
            ? 'bg-lime-500 border-lime-400 text-white' 
            : 'bg-black/80 backdrop-blur-xl border-white/20 text-lime-400 hover:bg-lime-500 hover:text-white'
        }`}
        title="Quick Actions"
      >
        <svg className="h-6 w-6 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </button>
    </div>
  );
};

// 🔥 RESPONSIVE: Mobile Sidebar Drawer Component
const MobileSidebarDrawer = ({ isOpen, onClose, children, title, position = 'left' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const slideClass = position === 'left' 
    ? 'transform translate-x-0' 
    : 'transform translate-x-0';
    
  const hiddenClass = position === 'left' 
    ? 'transform -translate-x-full' 
    : 'transform translate-x-full';

  return (
    <div className="fixed inset-0 z-[90] lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className={`absolute top-0 ${position}-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-gray-900/98 via-black/98 to-gray-900/98 backdrop-blur-xl border-${position === 'left' ? 'r' : 'l'} border-white/20 shadow-2xl transition-transform duration-300 overflow-hidden ${slideClass}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <h3 className="text-white font-bold text-lg flex items-center">
            <span className="mr-2">⚡</span>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// 🔥 NEW: Enhanced Follow Button Component (same as member directory)
const FollowButton = ({ targetUser, currentUser, size = 'sm', onCountUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});
  const [followingLoading, setFollowingLoading] = useState({});
  
  // Load initial following status
  useEffect(() => {
    const loadFollowingStatus = async () => {
      if (!currentUser || !targetUser?.uid) return;
      
      try {
        const statusMap = await getFollowingStatusForUsers(currentUser, [targetUser.uid]);
        setFollowingStatus(statusMap);
      } catch (error) {
        console.error('Error loading following status:', error);
      }
    };

    loadFollowingStatus();
  }, [currentUser, targetUser]);
  
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
        // Count update callback
        (countData) => {
          console.log('📊 Count update received:', countData);
          
          // If there's a parent callback, call it
          if (onCountUpdate) {
            onCountUpdate(countData);
          }
        }
      );
      
      if (!success) {
        console.log('❌ Follow/unfollow operation failed');
      } else {
        showSuccessMessage(
          isCurrentlyFollowing ? 'Unfollowed successfully' : 'Following! ✅',
          { autoClose: 2000 }
        );
      }
      
    } catch (error) {
      console.error('❌ Error in follow toggle:', error);
      showWarningMessage('Unable to update follow status. Please try again.');
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

// 🔥 NEW: Follow Suggestions Sidebar Component
// Shows users that the current user is NOT following (people to discover and follow)
const FollowSuggestionsSidebar = ({ currentUser, isMobile = false }) => {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState({});
  const [userCounts, setUserCounts] = useState({
    followers: 0,
    following: 0
  });

  // Load suggested users to follow (excluding users already being followed)
  useEffect(() => {
    const loadSuggestedUsers = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        
        // Get more users to filter from (increase limit to account for filtering)
        const usersQuery = query(
          collection(db, 'users'),
          limit(20) // Get more users to filter from since we'll exclude those already followed
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        const allUsers = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        
        // Get users with project participation and badges
        const badgesQuery = query(collection(db, 'member_badges'));
        const badgesSnapshot = await getDocs(badgesQuery);
        
        const userActivityMap = {};
        badgesSnapshot.docs.forEach(doc => {
          const badge = doc.data();
          if (badge.memberEmail) {
            if (!userActivityMap[badge.memberEmail]) {
              userActivityMap[badge.memberEmail] = { badges: 0, lastActivity: null };
            }
            userActivityMap[badge.memberEmail].badges++;
            
            const badgeDate = badge.awardedAt && typeof badge.awardedAt.toDate === 'function' 
              ? badge.awardedAt.toDate() 
              : new Date();
            
            if (!userActivityMap[badge.memberEmail].lastActivity || 
                badgeDate > userActivityMap[badge.memberEmail].lastActivity) {
              userActivityMap[badge.memberEmail].lastActivity = badgeDate;
            }
          }
        });
        
        // Filter and enrich users (excluding current user)
        const candidateUsers = allUsers
          .filter(user => 
            user.uid !== currentUser.uid && 
            user.email && 
            user.email.includes('@')
          )
          .map(user => {
            const activity = userActivityMap[user.email] || { badges: 0, lastActivity: null };
            return {
              uid: user.uid,
              email: user.email,
              name: user.displayName || user.email.split('@')[0],
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              displayName: user.displayName || user.email.split('@')[0],
              photoURL: user.photoURL || null,
              badges: activity.badges,
              lastActivity: activity.lastActivity,
              followerCount: 0, // Will be updated by follow actions
              userStatus: activity.badges >= 5 ? 'veteran' : 
                         activity.badges >= 1 ? 'achiever' : 'newcomer'
            };
          });
        
        // Get following status for all candidate users
        const userIds = candidateUsers.map(user => user.uid);
        const statusMap = await getFollowingStatusForUsers(currentUser, userIds);
        
        // Filter out users that are already being followed
        const unfollowedUsers = candidateUsers.filter(user => 
          !statusMap[user.uid] // Only include users that are NOT being followed
        );
        
        // Sort and limit the unfollowed users
        const suggestedUsersList = unfollowedUsers
          .sort((a, b) => {
            // Sort by badges first, then by last activity
            if (a.badges !== b.badges) return b.badges - a.badges;
            if (a.lastActivity && b.lastActivity) {
              return b.lastActivity - a.lastActivity;
            }
            return a.lastActivity ? -1 : 1;
          })
          .slice(0, 5); // Show top 5 suggestions
        
        setSuggestedUsers(suggestedUsersList);
        
        // Set following status (should all be false for unfollowed users)
        const finalStatusMap = {};
        suggestedUsersList.forEach(user => {
          finalStatusMap[user.uid] = false;
        });
        setFollowingStatus(finalStatusMap);
        
      } catch (error) {
        console.error('Error loading suggested users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestedUsers();
  }, [currentUser]);

  // Load current user's follow counts
  useEffect(() => {
    const loadUserCounts = async () => {
      if (currentUser && currentUser.uid) {
        try {
          const counts = await getUserCounts(currentUser.uid);
          setUserCounts(counts);
        } catch (error) {
          console.error('Failed to load user counts:', error);
        }
      }
    };

    loadUserCounts();
  }, [currentUser]);

  // Handle follow count updates and refresh suggestions
  const handleCountUpdate = (countData) => {
    // Update current user's counts
    setUserCounts(countData.currentUser);
    
    // Update target user's follower count in the suggestions list
    setSuggestedUsers(prev => prev.map(user => 
      user.uid === countData.targetUserId 
        ? { ...user, followerCount: countData.targetUser.followers }
        : user
    ));

    // If user was followed, remove them from suggestions and update following status
    if (countData.targetUserId && followingStatus[countData.targetUserId] === false) {
      // Remove the followed user from suggestions
      setSuggestedUsers(prev => prev.filter(user => user.uid !== countData.targetUserId));
      
      // Update following status
      setFollowingStatus(prev => ({
        ...prev,
        [countData.targetUserId]: true
      }));
    }
  };

  // Get user status styling
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
      newcomer: { 
        label: 'Newcomer', 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20', 
        border: 'border-blue-500/30',
        icon: '🌟'
      }
    };
    return statusInfo[userStatus] || statusInfo.newcomer;
  };

  if (!currentUser) return null;

  const containerClass = isMobile 
    ? "p-4 h-full" 
    : "h-fit";

  const contentClass = isMobile
    ? "h-full flex flex-col"
    : "bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl sidebar-content h-full flex flex-col";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center">
              <span className="text-lime-400 mr-2">👥</span>
              <span className="hidden sm:inline">Discover People</span>
              <span className="sm:hidden">Discover</span>
            </h3>
            <p className="text-gray-400 text-xs mt-1 hidden sm:block">New connections to follow</p>
          </div>
        </div>
        
        {/* Your Follow Stats */}
        <div className="mb-4 p-3 bg-gradient-to-r from-lime-500/10 to-green-500/10 rounded-lg border border-lime-500/20 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-lime-400">{userCounts.following}</div>
              <div className="text-xs text-lime-300">Following</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">{userCounts.followers}</div>
              <div className="text-xs text-blue-300">Followers</div>
            </div>
          </div>
        </div>
        
        {/* Suggested Users List */}
        <div className={`space-y-3 ${isMobile ? 'flex-1 overflow-y-auto' : 'flex-1'}`}>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400 mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Finding people...</p>
            </div>
          ) : suggestedUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">👥</div>
              <p className="text-gray-400 text-sm">
                All caught up! You're following everyone we can suggest right now.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Check back later for new members to connect with.
              </p>
            </div>
          ) : (
            suggestedUsers.map((user) => {
              const statusInfo = getUserStatusInfo(user.userStatus);
              
              return (
                <div
                  key={user.uid}
                  className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                >
                  {/* User Avatar */}
                  <ClickableUserAvatar 
                    user={user}
                    size="md"
                    className="flex-shrink-0 ring-2 ring-lime-400/30"
                  />
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <EnhancedClickableUserName
                        user={user}
                        className="font-semibold text-white text-sm group-hover:text-lime-300 transition-colors truncate"
                      />
                      <span className={`${statusInfo.color} text-xs`}>
                        {statusInfo.icon}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        {user.badges > 0 ? (
                          <span>{user.badges} badge{user.badges !== 1 ? 's' : ''}</span>
                        ) : (
                          <span>New member</span>
                        )}
                      </div>
                      
                      {/* Follower count */}
                      <div className="text-xs text-blue-400">
                        {user.followerCount > 0 && `${user.followerCount} followers`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Follow Button */}
                  <div className="flex-shrink-0">
                    <FollowButton
                      targetUser={user}
                      currentUser={currentUser}
                      size="xs"
                      onCountUpdate={handleCountUpdate}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
          <p className="text-gray-400 text-center text-xs">
            Expand your professional network
          </p>
        </div>
      </div>
    </div>
  );
};

// 🔥 RESPONSIVE: Enhanced User Quick Links Sidebar Component
const UserQuickLinksSidebar = ({ currentUser, onNavigate, isMobile = false }) => {
  const quickLinks = [
    {
      icon: '🏆',
      title: 'Achievements',
      description: 'View badges & certificates',
      path: '/my-badges',
      gradient: 'from-yellow-500 to-orange-600'
    },
    {
      icon: '📚',
      title: 'My Career',
      description: 'Learning resources & AI guidance',
      path: '/career/dashboard',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: '💻',
      title: 'Projects',
      description: 'Submit & join projects',
      path: '/projects',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: '📅',
      title: 'Events',
      description: 'Host & attend events',
      path: '/events',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: '🏢',
      title: 'Companies',
      description: 'Create & manage companies',
      path: '/companies',
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  const handleLinkClick = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // Fallback navigation
      window.location.href = path;
    }
  };

  if (!currentUser) return null;

  const containerClass = isMobile 
    ? "p-4 h-full" 
    : "sticky top-[5.5rem] lg:top-[5.5rem] xl:top-24 h-fit max-h-[calc(100vh-6.5rem)] lg:max-h-[calc(100vh-6.5rem)] xl:max-h-[calc(100vh-7rem)] overflow-hidden";

  const contentClass = isMobile
    ? "h-full flex flex-col"
    : "bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl sidebar-content h-full flex flex-col";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {!isMobile && (
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-white font-bold text-lg flex items-center">
              <span className="text-lime-400 mr-2">⚡</span>
              Quick Actions
            </h3>
          </div>
        )}
        
        <div className={`space-y-3 ${isMobile ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto sidebar-scrollable'}`} style={{
          maxHeight: isMobile ? '100%' : 'calc(100vh - 16rem)'
        }}>
          {quickLinks.map((link, index) => (
            <button
              key={index}
              onClick={() => handleLinkClick(link.path)}
              className={`flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer w-full text-left group hover:scale-105 hover:shadow-lg sidebar-item ${
                isMobile ? 'py-4' : ''
              }`}
            >
              <div className={`w-10 h-10 bg-gradient-to-r ${link.gradient} rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <span className="text-sm">{link.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-white group-hover:text-lime-300 transition-colors truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
                  {link.title}
                </p>
                <p className={`text-gray-400 truncate ${isMobile ? 'text-sm' : 'text-xs'}`}>
                  {link.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* User Stats */}
        <div className="mt-6 pt-4 border-t border-white/10 flex-shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div className={`text-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors ${isMobile ? 'py-4' : ''}`}>
              <div className={`text-lime-400 font-bold ${isMobile ? 'text-xl' : 'text-lg'}`}>0</div>
              <div className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-xs'}`}>Posts</div>
            </div>
            <div className={`text-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors ${isMobile ? 'py-4' : ''}`}>
              <div className={`text-blue-400 font-bold ${isMobile ? 'text-xl' : 'text-lg'}`}>0</div>
              <div className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-xs'}`}>Following</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className={`text-gray-400 text-center ${isMobile ? 'text-sm' : 'text-xs'}`}>
            Quick access to all your tools
          </p>
        </div>
      </div>
    </div>
  );
};

// 🔥 NEW: Company Information Sidebar Component - LinkedIn Style
const CompanyInfoSidebar = ({ isMobile = false }) => {
  const companyLinks = [
    {
      title: 'Support',
      url: 'https://www.favoredonline.com/career/support'
    },
    {
      title: 'About',
      url: 'https://www.favoredonline.com/career/about'
    },
    {
      title: 'Terms of Service',
      url: 'https://www.favoredonline.com/career/terms'
    },
    {
      title: 'Privacy Policy',
      url: 'https://www.favoredonline.com/career/privacy'
    }
  ];

  const containerClass = isMobile 
    ? "p-4 h-full" 
    : "h-fit";

  const contentClass = isMobile
    ? "h-full flex flex-col"
    : "bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 shadow-2xl sidebar-content h-full flex flex-col";

  return (
    <div className={containerClass}>
      <div className={contentClass}>
        {/* Company Header with Logo */}
        <div className="flex items-center justify-center mb-4 sm:mb-6 flex-shrink-0">
          <div className="text-center">
            <img 
              src="/Images/512X512.png" 
              alt="Favored Online Logo" 
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-xl shadow-lg"
            />
            <h3 className="text-white font-bold text-sm sm:text-lg">
              Favored Online Inc.
            </h3>
          </div>
        </div>
        
        {/* Company Description */}
        <div className="mb-4 sm:mb-6 flex-shrink-0">
          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed text-center">
            AI-powered career transformation through real-world projects, personalized tech career recommendations, and validated skill achievements.
          </p>
        </div>

        {/* Company Links - LinkedIn Style Grid */}
        <div className={`grid grid-cols-2 gap-2 sm:gap-3 ${isMobile ? 'flex-1' : ''}`}>
          {companyLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer text-center group hover:scale-105 hover:shadow-lg sidebar-item ${
                isMobile ? 'min-h-[60px]' : 'min-h-[50px]'
              }`}
            >
              <div className="flex-1 min-w-0 flex items-center justify-center">
                <p className={`font-medium text-white group-hover:text-lime-300 transition-colors text-center leading-tight ${isMobile ? 'text-sm' : 'text-xs sm:text-sm'}`}>
                  {link.title}
                </p>
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/10 flex-shrink-0">
          <p className={`text-gray-400 text-center font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
            Building the future of tech careers
          </p>
        </div>
      </div>
    </div>
  );
};

// 🔥 RESPONSIVE: Enhanced Tagged Users Component
const TaggedUsersSmall = ({ taggedUsers = [], onRemoveTag }) => {
  if (!taggedUsers.length) return null;
  
  return (
    <div className="mt-3 p-2 sm:p-3 bg-lime-500/10 border border-lime-500/30 rounded-lg">
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <h4 className="text-lime-300 font-medium text-xs sm:text-sm flex items-center">
          <span className="mr-1">🏷️</span>
          Tagged ({taggedUsers.length}):
        </h4>
        <button
          type="button"
          onClick={() => onRemoveTag('all')}
          className="text-gray-400 hover:text-white text-xs transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-1 sm:gap-2">
        {taggedUsers.map((user, index) => (
          <div 
            key={user.uid || index} 
            className="flex items-center space-x-1 bg-lime-500/20 border border-lime-500/40 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 text-lime-300"
          >
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[8px] sm:text-xs">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-xs font-medium truncate max-w-20 sm:max-w-24">
              @{user.displayName || user.email?.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={() => onRemoveTag(index)}
              className="text-lime-400 hover:text-lime-200 ml-1 font-bold text-xs transition-colors flex-shrink-0"
              title="Remove tag"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 🔥 RESPONSIVE: Enhanced Reaction Avatars Component
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
              
              {/* 🔥 RESPONSIVE: Tooltip positioning */}
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

// 🔥 Fully Responsive Reactions Modal Component
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
            Professional learning community
          </p>
        </div>
      </div>
    </div>
  );
};

// 🔥 RESPONSIVE: Enhanced Tagged Users Component with Clickable Names
const TaggedUsers = ({ taggedUsers = [] }) => {
  const navigate = useNavigate();
  
  const handleUserClick = (user) => {
    try {
      // Navigate to user profile using email (URL encoded)
      if (user.email) {
        const encodedEmail = encodeURIComponent(user.email);
        navigate(`/profile/${encodedEmail}`);
      } else if (user.uid) {
        // Fallback to uid if email is not available
        navigate(`/profile/${user.uid}`);
      } else {
        console.warn('User object missing both email and uid:', user);
        showWarningMessage('Unable to view user profile - missing user information');
      }
    } catch (error) {
      console.error('Error navigating to user profile:', error);
      showWarningMessage('Unable to view user profile');
    }
  };

  if (!taggedUsers.length) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2 sm:mt-3 text-xs sm:text-sm">
      <span className="text-gray-400">Tagged:</span>
      {taggedUsers.map((user, index) => (
        <span key={user.uid || index} className="flex items-center">
          <EnhancedClickableUserName
            user={user}
            className="text-lime-400 hover:text-lime-300 transition-colors tagged-user-link px-1 py-0.5 rounded"
            showTitle={true}
          >
            @{user.displayName || user.email?.split('@')[0]}
          </EnhancedClickableUserName>
          {index < taggedUsers.length - 1 && <span className="text-gray-400 ml-1">,</span>}
        </span>
      ))}
    </div>
  );
};

// Updated RepostDisplay Component with Video Support
const RepostDisplay = ({ post }) => {
  if (!post.isRepost || !post.originalPost) return null;

  return (
    <div className="mb-3 sm:mb-4">
      <div className="flex items-center space-x-2 mb-2 sm:mb-3 text-green-400">
        <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span className="text-xs sm:text-sm font-medium">
          <EnhancedClickableUserName
            user={{
              uid: post.authorId,
              email: post.authorEmail,
              firstName: post.authorFirstName,
              lastName: post.authorLastName,
              displayName: post.authorName
            }}
            className="hover:text-green-300 transition-colors"
          >
            {post.authorName}
          </EnhancedClickableUserName>
          {' reposted'}
        </span>
      </div>

      {post.repostComment && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-black/20 rounded-lg border border-white/10">
          <RichTextContent 
            content={post.repostComment}
            className="text-gray-200 leading-relaxed text-sm sm:text-base"
          />
        </div>
      )}

      <div className="bg-black/30 border border-white/20 rounded-xl p-3 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          <ClickableUserAvatar 
            user={{
              uid: post.originalPost.authorId,
              email: post.originalPost.authorEmail,
              firstName: post.originalPost.authorFirstName,
              lastName: post.originalPost.authorLastName,
              displayName: post.originalPost.authorName,
              photoURL: post.originalPost.authorPhoto
            }}
            size="md"
            className="shadow-lg"
          />
          <div>
            <EnhancedClickableUserName
              user={{
                uid: post.originalPost.authorId,
                email: post.originalPost.authorEmail,
                firstName: post.originalPost.authorFirstName,
                lastName: post.originalPost.authorLastName,
                displayName: post.originalPost.authorName
              }}
              className="font-semibold text-white text-xs sm:text-sm hover:text-lime-300 transition-colors"
            />
            <div className="text-gray-400 text-xs">
              {formatDate(post.originalPost.createdAt)}
            </div>
          </div>
        </div>
        
        <h4 className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-lg">
          {post.originalPost.title}
        </h4>
        <RichTextContent 
          content={post.originalPost.content}
          className="text-gray-300 leading-relaxed text-xs sm:text-base"
        />
        
        {/* 🎥 UPDATED: Replace images with media gallery */}
        {post.originalPost.media && post.originalPost.media.length > 0 && (
          <MediaGallery media={post.originalPost.media} />
        )}
        
        {/* Legacy support for posts with images field */}
        {!post.originalPost.media && post.originalPost.images && post.originalPost.images.length > 0 && (
          <MediaGallery media={post.originalPost.images.map(img => ({ ...img, type: 'image' }))} />
        )}
      </div>
    </div>
  );
};

// 🔥 RESPONSIVE: Enhanced Repost Modal Component
const RepostModal = ({ isOpen, onClose, post, onRepost, isSubmitting }) => {
  const [repostComment, setRepostComment] = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]);

  // Handle mention selection
  const handleMentionSelect = (user) => {
    setTaggedUsers(prev => {
      const exists = prev.find(u => u.uid === user.uid);
      if (!exists) {
        return [...prev, user];
      }
      return prev;
    });
  };

  // Remove tagged user
  const handleRemoveTag = (indexOrAll) => {
    if (indexOrAll === 'all') {
      setTaggedUsers([]);
    } else {
      setTaggedUsers(prev => prev.filter((_, i) => i !== indexOrAll));
    }
  };

  const handleRepost = () => {
    onRepost({
      originalPost: post,
      comment: repostComment.trim(),
      taggedUsers: taggedUsers
    });
  };

  const handleClose = () => {
    setRepostComment('');
    setTaggedUsers([]);
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-2 sm:p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
            <span className="text-green-400 mr-2">🔄</span>
            Repost
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-1 sm:p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-6 max-h-80 sm:max-h-96 overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <label className="block text-white font-medium mb-2 sm:mb-3 text-sm sm:text-base">
              Add your thoughts (optional)
            </label>
            <MentionTextarea
              value={repostComment}
              onChange={setRepostComment}
              onMentionSelect={handleMentionSelect}
              placeholder="What do you think about this post? Use @username to tag users..."
              className="w-full p-3 sm:p-4 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 resize-none min-h-[80px] sm:min-h-[100px] transition-colors text-sm sm:text-base"
              rows="4"
            />
          </div>

          {/* Tagged Users Display */}
          <TaggedUsersSmall 
            taggedUsers={taggedUsers} 
            onRemoveTag={handleRemoveTag} 
          />

          <div className="bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 mt-3 sm:mt-4">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
              <ClickableUserAvatar 
                user={{
                  uid: post.authorId,
                  email: post.authorEmail,
                  firstName: post.authorFirstName,
                  lastName: post.authorLastName,
                  displayName: post.authorName,
                  photoURL: post.authorPhoto
                }}
                size="md"
                className="shadow-lg"
              />
              <div>
                <EnhancedClickableUserName
                  user={{
                    uid: post.authorId,
                    email: post.authorEmail,
                    firstName: post.authorFirstName,
                    lastName: post.authorLastName,
                    displayName: post.authorName
                  }}
                  className="font-semibold text-white text-sm sm:text-base hover:text-lime-300 transition-colors"
                />
                <div className="text-gray-400 text-xs sm:text-sm">
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </div>
            
            <h4 className="text-white font-bold mb-1 sm:mb-2 text-sm sm:text-base">{post.title}</h4>
            <RichTextContent 
              content={post.content?.length > 200 
                ? `${post.content.substring(0, 200)}...` 
                : post.content
              }
              className="text-gray-300 text-xs sm:text-sm leading-relaxed"
            />
            
            {/* Media count indicator */}
            {((post.media && post.media.length > 0) || (post.images && post.images.length > 0)) && (
              <div className="mt-2 sm:mt-3 text-gray-400 text-xs sm:text-sm flex items-center">
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                </svg>
                {(post.media?.length || post.images?.length || 0)} media item{(post.media?.length || post.images?.length || 0) !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-white/10 bg-black/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="text-gray-400 text-xs sm:text-sm">
              This will be shared with your followers
              {taggedUsers.length > 0 && (
                <span className="text-lime-300 ml-1">
                  • {taggedUsers.length} user{taggedUsers.length !== 1 ? 's' : ''} will be notified
                </span>
              )}
            </div>
            <div className="flex space-x-2 sm:space-x-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium disabled:opacity-50 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleRepost}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                    Reposting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-1 sm:mr-2">🔄</span>
                    Repost
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🔥 RESPONSIVE: Enhanced MentionTextarea Component
const MentionTextarea = ({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  className = "",
  onMentionSelect,
  rows = 3,
  ...props 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const textareaRef = useRef(null);

  // Search users for autocomplete
  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    try {
      // Search by display name and email
      const displayNameQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff')
      );
      
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '>=', searchTerm),
        where('email', '<=', searchTerm + '\uf8ff')
      );
      
      const [displayNameSnapshot, emailSnapshot] = await Promise.all([
        getDocs(displayNameQuery),
        getDocs(emailQuery)
      ]);
      
      const users = new Map();
      
      // Combine results and deduplicate
      [...displayNameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        users.set(doc.id, {
          uid: doc.id,
          ...doc.data()
        });
      });
      
      return Array.from(users.values()).slice(0, 5); // Limit to 5 results
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Handle text changes and detect @ mentions
  const handleTextChange = async (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check if user is typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setMentionStartIndex(mentionMatch.index);
      
      if (query.length >= 1) {
        try {
          const users = await searchUsers(query);
          setSuggestions(users);
          setShowSuggestions(users.length > 0);
          setSelectedSuggestionIndex(0);
        } catch (error) {
          console.error('Error fetching user suggestions:', error);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (user, index = selectedSuggestionIndex) => {
    if (!suggestions[index]) return;
    
    const selectedUser = suggestions[index];
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textareaRef.current.selectionStart);
    const newValue = beforeMention + `@${selectedUser.displayName || selectedUser.email.split('@')[0]} ` + afterMention;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Notify parent component about the mention
    if (onMentionSelect) {
      onMentionSelect(selectedUser);
    }
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPosition = beforeMention.length + `@${selectedUser.displayName || selectedUser.email.split('@')[0]} `.length;
      textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (suggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
        {...props}
      />
      
      {/* 🔥 RESPONSIVE: Enhanced Mention Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 w-full max-w-xs sm:max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-48 overflow-y-auto"
          style={{
            top: '100%',
            left: 0,
            marginTop: '4px'
          }}
        >
          {suggestions.map((user, index) => (
            <button
              key={user.uid}
              onClick={() => selectSuggestion(user, index)}
              className={`flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-white/10 transition-colors ${
                index === selectedSuggestionIndex ? 'bg-lime-500/20 text-lime-300' : 'text-white'
              }`}
            >
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-sm sm:text-base">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                {user.displayName && user.email && (
                  <div className="text-xs text-gray-400 truncate hidden sm:block">{user.email}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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

// Helper function to safely format time
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

// 🔥 MAIN COMPONENT: Enhanced Community Posts with Follow Suggestions Sidebar
const CommunityPosts = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [lastDoc, setLastDoc] = useState(null);
  const [indexError, setIndexError] = useState(false);

  // 🔥 RESPONSIVE: Mobile Sidebar State - Updated for only left sidebar
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);

  // View mode with mentions
  const [viewMode, setViewMode] = useState('all');
  const [showViewMenu, setShowViewMenu] = useState(false);

  // Reply-related state
  const [showReplies, setShowReplies] = useState(new Set());
  const [replies, setReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [editingReply, setEditingReply] = useState(null);
  const [editReplyContent, setEditReplyContent] = useState('');
  const [savingReplyEdit, setSavingReplyEdit] = useState(false);
  const [replyCounts, setReplyCounts] = useState({});

  // Reply tagging state
  const [replyTaggedUsers, setReplyTaggedUsers] = useState({});

  // Edit state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deletingPost, setDeletingPost] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Reactions state
  const [postReactions, setPostReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({});
  const [showReactionsModal, setShowReactionsModal] = useState(null);
  const [reactionsData, setReactionsData] = useState({});
  const [submittingReaction, setSubmittingReaction] = useState({});

  // Repost state
  const [showRepostModal, setShowRepostModal] = useState(null);
  const [submittingRepost, setSubmittingRepost] = useState(false);

  const CONTENT_LIMIT = 300;
  const POSTS_PER_PAGE = 10;

  // 🔥 RESPONSIVE: Mobile Sidebar Handlers - Updated for only left sidebar
  const handleToggleLeftSidebar = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const handleCloseSidebars = () => {
    setLeftSidebarOpen(false);
  };

  // 🔥 NEW: Handle share post functionality
  const handleSharePost = async (postId) => {
    try {
      // Generate the post URL (modify this based on your routing structure)
      const postUrl = `${window.location.origin}/community/post/${postId}`;
      
      const success = await copyToClipboard(postUrl);
      
      if (success) {
        showSuccessMessage('📋 Post link copied to clipboard!', { autoClose: 2000 });
      } else {
        // Fallback: show the URL in a prompt for manual copying
        prompt('Copy this link to share the post:', postUrl);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      showWarningMessage('Unable to copy link. Please try again.');
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.view-menu-container')) {
        setShowViewMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeReactionsModal = () => {
    setShowReactionsModal(null);
  };

  // Open reactions modal and fetch user data with professional info only
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

  // Handle post reactions (like/unlike)
  const handlePostReaction = async (postId, isCurrentlyLiked) => {
    if (!currentUser) {
      showWarningMessage('Please login to react to posts');
      return;
    }

    setSubmittingReaction(prev => ({ ...prev, [postId]: true }));

    try {
      await safeFirestoreOperation(async () => {
        const postRef = doc(db, 'posts', postId);
        
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
          
          showSuccessMessage('Post liked! ❤️', { autoClose: 1500 });
        }
      }, isCurrentlyLiked ? 'unliking post' : 'liking post');

    } catch (error) {
      console.error('❌ Error reacting to post:', error);
    } finally {
      setSubmittingReaction(prev => ({ ...prev, [postId]: false }));
    }
  };

  const isPostLikedByUser = (postId) => {
    return currentUser && postReactions[postId] && postReactions[postId].includes(currentUser.uid);
  };

  // Handle repost with tagging support
  const handleRepost = async (repostData) => {
    if (!currentUser) {
      showWarningMessage('Please login to repost');
      return;
    }

    setSubmittingRepost(true);
    try {
      await safeFirestoreOperation(async () => {
        // Extract mentions from repost comment if provided
        let allTaggedUsers = repostData.taggedUsers || [];
        
        if (repostData.comment) {
          const mentions = extractMentions(repostData.comment);
          const mentionedUsers = await validateMentions(mentions);
          
          // Combine explicitly tagged users with mentioned users
          mentionedUsers.forEach(user => {
            const exists = allTaggedUsers.find(u => u.uid === user.uid);
            if (!exists) {
              allTaggedUsers.push(user);
            }
          });
        }

        // Create the repost with tagging data
        const repostDataWithTags = {
          ...repostData,
          taggedUsers: allTaggedUsers,
          taggedUserIds: allTaggedUsers.map(user => user.uid) // Add UID array for easier querying
        };

        await createRepost(currentUser, repostDataWithTags);

        // Create enhanced notifications for tagged users
        if (allTaggedUsers.length > 0) {
          const notifications = allTaggedUsers.map(user => ({
            userId: user.uid,
            type: 'repost_mention',
            postId: repostData.originalPost.id,
            postTitle: repostData.originalPost.title,
            mentionedBy: currentUser.uid,
            mentionedByName: currentUser.displayName || currentUser.email,
            mentionedByFirstName: currentUser.firstName || '',
            mentionedByLastName: currentUser.lastName || '',
            mentionedByPhoto: currentUser.photoURL || null,
            repostComment: repostData.comment || '',
            isRead: false,
            createdAt: serverTimestamp()
          }));
          
          // Add notifications
          for (const notification of notifications) {
            await addDoc(collection(db, 'notifications'), notification);
            
            // Use existing email notification system
            const taggedUser = allTaggedUsers.find(user => user.uid === notification.userId);
            
            if (taggedUser) {
              try {
                await safeMentionNotification(
                  notification,
                  taggedUser,
                  {
                    ...currentUser,
                    firstName: currentUser.firstName || '',
                    lastName: currentUser.lastName || '',
                    profile: currentUser.profile || {}
                  },
                  {
                    id: repostData.originalPost.id,
                    title: repostData.originalPost.title,
                    content: repostData.originalPost.content,
                    type: 'repost'
                  },
                  false // Don't show toast to avoid spam
                );
              } catch (emailError) {
                console.error('Email notification failed:', emailError);
                // Don't block the main operation if email fails
              }
            }
          }
        }
      }, 'creating repost');

      setShowRepostModal(null);
      const tagMessage = repostData.taggedUsers?.length > 0 
        ? ` ${repostData.taggedUsers.length} user${repostData.taggedUsers.length !== 1 ? 's' : ''} will be notified.`
        : '';
      showSuccessMessage(`Post reposted successfully! 🔄${tagMessage}`);
    } catch (error) {
      console.error('Error reposting:', error);
    } finally {
      setSubmittingRepost(false);
    }
  };

  const loadPostReactions = (posts) => {
    const reactions = {};
    const counts = {};
    
    posts.forEach(post => {
      reactions[post.id] = post.likes || [];
      counts[post.id] = post.likeCount || 0;
      
      if (!post.repostCount) post.repostCount = 0;
      if (!post.reposts) post.reposts = [];
    });
    
    setPostReactions(prev => ({ ...prev, ...reactions }));
    setReactionCounts(prev => ({ ...prev, ...counts }));
  };

  // Enhanced Post Author Check
  const isPostAuthor = (post) => {
    const isAuthor = currentUser && (post.authorId === currentUser.uid);
    
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('Post author check:', {
        postId: post.id,
        postAuthorId: post.authorId,
        currentUserId: currentUser?.uid,
        isAuthor: isAuthor,
        isRepost: post.isRepost
      });
    }
    
    return isAuthor;
  };

  // Fetch posts with corrected authorId handling
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let q;
        
        if (viewMode === 'myPosts' && currentUser) {
          q = query(
            collection(db, 'posts'),
            where('authorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
        } else if (viewMode === 'mentions' && currentUser) {
          // Query for posts where user is mentioned using UID array
          q = query(
            collection(db, 'posts'),
            where('taggedUserIds', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
        } else {
          q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            limit(POSTS_PER_PAGE)
          );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
          // Remove the authorId override that was causing the bug
          const postsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()),
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : null,
            // Always use the actual authorId from the document
            authorId: doc.data().authorId
          }));
          
          setPosts(postsData);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
          setLoading(false);

          loadPostReactions(postsData);
          loadReplyCounts(postsData);
        }, (error) => {
          console.error('Error fetching posts:', error);
          
          if (error.code === 'failed-precondition' && error.message.includes('index')) {
            setIndexError(true);
            showWarningMessage('Unable to load posts at the moment. Please try again in a few minutes.');
            console.error('Database index required - contact development team');
          } else {
            showWarningMessage('Unable to load posts. Please check your connection and try again.');
          }
          
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up posts listener:', error);
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          setIndexError(true);
          showWarningMessage('Service temporarily unavailable. Please try again later.');
        } else {
          showWarningMessage('Unable to connect. Please check your internet connection.');
        }
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser, viewMode]);

  const loadReplyCounts = async (posts) => {
    const counts = {};
    
    for (const post of posts) {
      try {
        await safeFirestoreOperation(async () => {
          const repliesQuery = query(collection(db, 'posts', post.id, 'replies'));
          const snapshot = await getDocs(repliesQuery);
          counts[post.id] = snapshot.size;
        }, `loading reply count for post ${post.id}`);
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log(`Permission denied for replies in post ${post.id} - setting count to 0`);
          counts[post.id] = 0;
        } else {
          console.error(`Error loading reply count for post ${post.id}:`, error);
          counts[post.id] = 0;
        }
      }
    }
    
    setReplyCounts(prev => ({ ...prev, ...counts }));
  };

  const changeViewMode = (mode) => {
    if (mode !== viewMode) {
      setViewMode(mode);
      setShowViewMenu(false);
      setPosts([]);
      setLoading(true);
      setHasMore(true);
      setLastDoc(null);
      setIndexError(false);
      setReplyCounts({});
      setPostReactions({});
      setReactionCounts({});
    }
  };

  const loadReplies = async (postId) => {
    setLoadingReplies(prev => ({ ...prev, [postId]: true }));
    
    try {
      const repliesQuery = query(
        collection(db, 'posts', postId, 'replies'),
        orderBy('createdAt', 'asc')
      );

      const unsubscribe = onSnapshot(repliesQuery, (snapshot) => {
        const repliesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : null
        }));
        
        setReplies(prev => ({
          ...prev,
          [postId]: repliesData
        }));
        setLoadingReplies(prev => ({ ...prev, [postId]: false }));
      }, (error) => {
        console.error('Error fetching replies:', error);
        showWarningMessage('Unable to load replies. Please try again.');
        setLoadingReplies(prev => ({ ...prev, [postId]: false }));
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up replies listener:', error);
      showWarningMessage('Unable to load replies. Please try again.');
      setLoadingReplies(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleReplies = (postId) => {
    setShowReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        if (!replies[postId]) {
          loadReplies(postId);
        }
      }
      return newSet;
    });
  };

  // Handle mention selection for replies
  const handleReplyMentionSelect = (postId, user) => {
    setReplyTaggedUsers(prev => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []).filter(u => u.uid !== user.uid),
        user
      ]
    }));
  };

  // Remove tagged user from reply
  const handleReplyRemoveTag = (postId, indexOrAll) => {
    setReplyTaggedUsers(prev => {
      if (indexOrAll === 'all') {
        return {
          ...prev,
          [postId]: []
        };
      } else {
        return {
          ...prev,
          [postId]: (prev[postId] || []).filter((_, i) => i !== indexOrAll)
        };
      }
    });
  };

  // Better mention notifications in community
  const submitReply = async (postId) => {
    if (!currentUser || !replyText[postId]?.trim()) return;

    setSubmittingReply(prev => ({ ...prev, [postId]: true }));

    const mentions = extractMentions(replyText[postId]);
    
    try {
      const allTaggedUsers = await safeFirestoreOperation(async () => {
        const mentionedUsers = await validateMentions(mentions);
        const explicitlyTagged = replyTaggedUsers[postId] || [];
        const combined = [...explicitlyTagged];
        
        mentionedUsers.forEach(user => {
          const exists = combined.find(u => u.uid === user.uid);
          if (!exists) {
            combined.push(user);
          }
        });

        // Create reply document with enhanced data
        await addDoc(collection(db, 'posts', postId, 'replies'), {
          content: replyText[postId].trim(),
          authorName: currentUser.displayName || currentUser.email,
          authorId: currentUser.uid,
          authorPhoto: currentUser.photoURL || null,
          authorFirstName: currentUser.firstName || '',
          authorLastName: currentUser.lastName || '',
          authorInitials: currentUser.initials || '',
          authorTitle: currentUser.profile?.title || '',
          taggedUsers: combined,
          taggedUserIds: combined.map(user => user.uid),
          mentions: combined.map(user => `@${user.displayName || user.email.split('@')[0]}`),
          createdAt: serverTimestamp()
        });

        // Create detailed notifications for mentioned users
        if (combined.length > 0) {
          const notifications = combined.map(user => ({
            userId: user.uid,
            type: 'reply_mention',
            postId: postId,
            replyContent: replyText[postId].trim(),
            mentionedBy: currentUser.uid,
            mentionedByName: currentUser.displayName || currentUser.email,
            mentionedByFirstName: currentUser.firstName || '',
            mentionedByLastName: currentUser.lastName || '',
            mentionedByPhoto: currentUser.photoURL || null,
            message: `${currentUser.displayName || currentUser.email} mentioned you in a reply`,
            isRead: false,
            createdAt: serverTimestamp()
          }));
          
          // Add notifications to Firestore
          for (const notification of notifications) {
            await addDoc(collection(db, 'notifications'), notification);
            
            // Keep existing email notification system
            const taggedUser = combined.find(user => user.uid === notification.userId);
            if (taggedUser) {
              try {
                await safeMentionNotification(
                  notification,
                  taggedUser,
                  {
                    ...currentUser,
                    firstName: currentUser.firstName || '',
                    lastName: currentUser.lastName || '',
                    profile: currentUser.profile || {}
                  },
                  {
                    id: postId,
                    content: replyText[postId].trim(),
                    type: 'reply'
                  },
                  false // Don't show toast to avoid spam
                );
              } catch (emailError) {
                console.error('Email notification failed:', emailError);
                // Don't block the main operation if email fails
              }
            }
          }
        }

        return combined;
      }, 'posting reply');

      setReplyText(prev => ({ ...prev, [postId]: '' }));
      setReplyTaggedUsers(prev => ({ ...prev, [postId]: [] }));
      
      setReplyCounts(prev => ({
        ...prev,
        [postId]: (prev[postId] || 0) + 1
      }));
      
      // Enhanced success message with notification info
      const tagMessage = allTaggedUsers.length > 0 
        ? ` ${allTaggedUsers.length} user${allTaggedUsers.length !== 1 ? 's' : ''} will be notified.`
        : '';
      showSuccessMessage(`Reply posted successfully!${tagMessage}`);
      
    } catch (error) {
      console.error('Error submitting reply:', error);
      showWarningMessage('Failed to post reply. Please try again.');
    } finally {
      setSubmittingReply(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleReplyChange = (postId, text) => {
    setReplyText(prev => ({ ...prev, [postId]: text }));
  };

  const startEditReply = (replyId, currentContent) => {
    setEditingReply(replyId);
    setEditReplyContent(currentContent);
  };

  const cancelReplyEdit = () => {
    setEditingReply(null);
    setEditReplyContent('');
  };

  const saveReplyEdit = async (postId, replyId) => {
    if (!editReplyContent.trim()) {
      showWarningMessage('Reply content cannot be empty');
      return;
    }

    setSavingReplyEdit(true);
    try {
      await safeFirestoreOperation(async () => {
        await updateDoc(doc(db, 'posts', postId, 'replies', replyId), {
          content: editReplyContent.trim(),
          updatedAt: serverTimestamp()
        });
      }, 'updating reply');

      setReplies(prevReplies => ({
        ...prevReplies,
        [postId]: (prevReplies[postId] || []).map(reply => 
          reply.id === replyId 
            ? { ...reply, content: editReplyContent.trim(), updatedAt: new Date() }
            : reply
        )
      }));

      setEditingReply(null);
      setEditReplyContent('');
      
      showSuccessMessage('Reply updated successfully!');

    } catch (error) {
      console.error('Error updating reply:', error);
    } finally {
      setSavingReplyEdit(false);
    }
  };

  const isReplyAuthor = (reply) => {
    return currentUser && (reply.authorId === currentUser.uid);
  };

  const startEditPost = (postId, currentTitle, currentContent) => {
    setEditingPost(postId);
    setEditContent({
      title: currentTitle || '',
      content: currentContent || ''
    });
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent({});
  };

  const saveEdit = async (postId) => {
    if (!editContent.title?.trim() || !editContent.content?.trim()) {
      showWarningMessage('Title and content cannot be empty');
      return;
    }

    setSavingEdit(true);
    try {
      await safeFirestoreOperation(async () => {
        await updateDoc(doc(db, 'posts', postId), {
          title: editContent.title.trim(),
          content: editContent.content.trim(),
          updatedAt: serverTimestamp()
        });
      }, 'updating post');

      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return { 
              ...post, 
              title: editContent.title.trim(), 
              content: editContent.content.trim(),
              updatedAt: new Date()
            };
          }
          return post;
        })
      );

      setEditingPost(null);
      setEditContent({});
      
      showSuccessMessage('Post updated successfully!');

    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setSavingEdit(false);
    }
  };

  const deletePost = async (postId) => {
    setDeletingPost(prev => ({ ...prev, [postId]: true }));
    try {
      await safeFirestoreOperation(async () => {
        await deleteDoc(doc(db, 'posts', postId));
      }, 'deleting post');

      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      showSuccessMessage('Post deleted successfully!');
      setShowDeleteConfirm(null);
      
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setDeletingPost(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Load more posts with corrected authorId handling
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore || !lastDoc) return;
    
    setLoadingMore(true);
    
    try {
      await safeFirestoreOperation(async () => {
        let q;
        
        if (viewMode === 'myPosts' && currentUser) {
          q = query(
            collection(db, 'posts'),
            where('authorId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(POSTS_PER_PAGE)
          );
        } else if (viewMode === 'mentions' && currentUser) {
          q = query(
            collection(db, 'posts'),
            where('taggedUserIds', 'array-contains', currentUser.uid),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(POSTS_PER_PAGE)
          );
        } else {
          q = query(
            collection(db, 'posts'),
            orderBy('createdAt', 'desc'),
            startAfter(lastDoc),
            limit(POSTS_PER_PAGE)
          );
        }

        const snapshot = await getDocs(q);
        // Remove authorId override here too
        const newPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt || Date.now()),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : null,
          // Always use the actual authorId from the document
          authorId: doc.data().authorId
        }));

        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
        
        loadPostReactions(newPosts);
        loadReplyCounts(newPosts);
      }, 'loading more posts');
    } catch (error) {
      console.error('Error loading more posts:', error);
      
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        showWarningMessage('Unable to load more posts. Please refresh the page and try again.');
      } else {
        showWarningMessage('Failed to load more posts. Please try again.');
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
    handleCloseSidebars(); // Close mobile sidebars on navigation
  };

  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div 
      className="min-h-screen overflow-x-hidden flex flex-col relative prevent-overflow"
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
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

      {/* 🔥 RESPONSIVE: Enhanced Header with Notification Bell */}
      <header className="fixed top-0 left-0 right-0 z-[100]" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 mr-2 sm:mr-3 lg:mr-4 transform group-hover:scale-110 transition-transform duration-300"
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
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 xl:space-x-10">
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser ? (
                <>
                  <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/members" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    👥 Connect
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              ) : (
                <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              {/* 🔥 RESPONSIVE: USER AUTHENTICATION SECTION WITH NOTIFICATION BELL */}
              {currentUser ? (
                <div className="flex items-center space-x-2 lg:space-x-3 xl:space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 lg:px-3 xl:px-4 py-1 lg:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-full mr-2 lg:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <EnhancedClickableUserName
                      user={{
                        uid: currentUser.uid,
                        email: currentUser.email,
                        firstName: currentUser.firstName,
                        lastName: currentUser.lastName,
                        displayName: currentUser.displayName
                      }}
                      className="text-xs lg:text-sm text-white font-medium truncate max-w-16 lg:max-w-20 xl:max-w-none hover:text-lime-300 transition-colors clickable-username"
                    >
                      <span style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                        {currentUser.firstName && currentUser.lastName 
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : currentUser.displayName || currentUser.email
                        }
                      </span>
                    </EnhancedClickableUserName>
                  </div>
                  
                  {/* 🔥 RESPONSIVE: Notification Bell with proper sizing */}
                  <div className="flex items-center justify-center">
                    <NotificationBell />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 lg:px-6 xl:px-8 py-2 lg:py-3 rounded-full text-xs lg:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
                >
                  <span className="mr-1 lg:mr-2 text-sm lg:text-lg">🚀</span>
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                </button>
              )}
            </nav>

            {/* 🔥 RESPONSIVE: Enhanced Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Mobile Notification Bell */}
              {currentUser && (
                <div className="flex items-center">
                  <NotificationBell />
                </div>
              )}
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 🔥 RESPONSIVE: Enhanced Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 sm:mt-4 pb-3 sm:pb-4 rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-4 sm:space-y-5 p-4 sm:p-6">
                
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🏠 Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      📚 My Career
                    </Link>

                    <Link to="/members" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      👥 Connect
                    </Link>

                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      📊 Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg py-2" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    🚀 Career
                  </Link>
                )}
                
                {currentUser && (
                  <div className="pt-4 sm:pt-6 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-xl px-4 py-3">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-3 sm:mr-4 ring-2 ring-lime-400/50" />
                      )}
                      <div className="flex-1 min-w-0">
                        <EnhancedClickableUserName
                          user={{
                            uid: currentUser.uid,
                            email: currentUser.email,
                            firstName: currentUser.firstName,
                            lastName: currentUser.lastName,
                            displayName: currentUser.displayName
                          }}
                          className="text-sm sm:text-base text-white font-medium truncate block hover:text-lime-300 transition-colors clickable-username"
                        >
                          {currentUser.firstName && currentUser.lastName 
                            ? `${currentUser.firstName} ${currentUser.lastName}`
                            : currentUser.displayName || currentUser.email
                          }
                        </EnhancedClickableUserName>
                        <span className="text-xs text-gray-400 truncate block">{currentUser.email}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 🔥 RESPONSIVE: Mobile Sidebar Toggle Button - Updated for only left sidebar */}
      {currentUser && (
        <MobileSidebarToggle
          leftSidebarOpen={leftSidebarOpen}
          onToggleLeftSidebar={handleToggleLeftSidebar}
        />
      )}

      {/* 🔥 RESPONSIVE: Mobile Sidebar Drawer - Updated for only left sidebar */}
      {currentUser && (
        <MobileSidebarDrawer
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          title="Quick Actions"
          position="left"
        >
          <UserQuickLinksSidebar 
            currentUser={currentUser}
            onNavigate={handleNavigation}
            isMobile={true}
          />
        </MobileSidebarDrawer>
      )}

      {/* 🔥 ENHANCED: Main Content with THREE-Column Layout */}
      <main className="flex-grow pt-16 sm:pt-20 lg:pt-24">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1600px]">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 max-w-full">
            
            {/* 🔥 STICKY: Left Sidebar - Quick Actions */}
            <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 sidebar-container sidebar-left">
              <UserQuickLinksSidebar 
                currentUser={currentUser}
                onNavigate={handleNavigation}
              />
            </div>
            
            {/* 🔥 RESPONSIVE: Main Feed */}
            <div className="flex-1 w-full lg:max-w-2xl lg:mx-0 main-content min-w-0">
              
              {/* View Mode Controls and Start Post Component */}
              {currentUser && (
                <div className="mb-4 sm:mb-6 relative z-10">
                  <div className="bg-gradient-to-r from-black/30 via-gray-900/20 to-black/30 backdrop-blur-xl rounded-xl sm:rounded-2xl border-2 border-lime-400/20 p-3 sm:p-4 lg:p-6 shadow-2xl hover:shadow-lime-500/10 transition-all duration-300 overflow-visible">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-lime-400 rounded-full animate-pulse shadow-lg flex-shrink-0"></div>
                        <h2 className="text-white font-bold text-sm sm:text-base lg:text-lg xl:text-xl bg-gradient-to-r from-white to-lime-200 bg-clip-text text-transparent truncate">
                          {viewMode === 'all' ? '🌟 All Posts' : 
                           viewMode === 'myPosts' ? '📝 My Posts' : 
                           '🏷️ Mentions'}
                        </h2>
                        <div className="px-1.5 sm:px-2 lg:px-3 py-0.5 sm:py-1 bg-lime-400/20 border border-lime-400/40 rounded-full text-lime-300 text-xs font-semibold whitespace-nowrap">
                          {viewMode === 'all' ? 'Community' : 
                           viewMode === 'myPosts' ? 'Personal' : 
                           'Tagged'}
                        </div>
                      </div>
                      
                      {/* View Mode Dropdown */}
                      <div className="relative view-menu-container z-40 flex-shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => setShowViewMenu(!showViewMenu)}
                          className="flex items-center justify-center sm:justify-start space-x-1 sm:space-x-2 bg-gradient-to-r from-lime-500/20 to-green-500/20 hover:from-lime-500/30 hover:to-green-500/30 border-2 border-lime-400/40 hover:border-lime-400/60 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-lime-300 hover:text-lime-200 transition-all duration-300 font-semibold shadow-lg hover:shadow-lime-500/25 w-full sm:w-auto"
                        >
                          <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                          </svg>
                          <span>Filter Posts</span>
                          <svg className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 ${showViewMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {showViewMenu && (
                          <div className="absolute right-0 sm:right-0 top-full mt-2 sm:mt-3 w-full sm:w-56 lg:w-64 bg-gray-900/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border-2 border-lime-400/30 shadow-2xl z-40 overflow-hidden">
                            <div className="py-2">
                              <button
                                onClick={() => changeViewMode('all')}
                                className={`flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 lg:px-5 py-3 sm:py-4 text-left transition-all duration-300 group ${
                                  viewMode === 'all' 
                                    ? 'text-lime-300 bg-gradient-to-r from-lime-500/20 to-green-500/20 border-r-4 border-lime-400 shadow-lg' 
                                    : 'text-gray-200 hover:text-lime-300 hover:bg-lime-400/10 hover:shadow-md'
                                }`}
                              >
                                <span className="text-lg sm:text-xl">🌟</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base group-hover:text-lime-200 truncate">All Posts</div>
                                  <div className="text-xs text-gray-400 group-hover:text-lime-400/70">Community feed</div>
                                </div>
                                {viewMode === 'all' && (
                                  <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse flex-shrink-0"></div>
                                )}
                              </button>
                              
                              <div className="h-px bg-white/10 mx-3"></div>
                              
                              <button
                                onClick={() => changeViewMode('myPosts')}
                                className={`flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 lg:px-5 py-3 sm:py-4 text-left transition-all duration-300 group ${
                                  viewMode === 'myPosts' 
                                    ? 'text-lime-300 bg-gradient-to-r from-lime-500/20 to-green-500/20 border-r-4 border-lime-400 shadow-lg' 
                                    : 'text-gray-200 hover:text-lime-300 hover:bg-lime-400/10 hover:shadow-md'
                                }`}
                                >
                                <span className="text-lg sm:text-xl">📝</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base group-hover:text-lime-200 truncate">My Posts</div>
                                  <div className="text-xs text-gray-400 group-hover:text-lime-400/70">Posts you've created</div>
                                </div>
                                {viewMode === 'myPosts' && (
                                  <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse flex-shrink-0"></div>
                                )}
                              </button>

                              <div className="h-px bg-white/10 mx-3"></div>

                              <button
                                onClick={() => changeViewMode('mentions')}
                                className={`flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 lg:px-5 py-3 sm:py-4 text-left transition-all duration-300 group ${
                                  viewMode === 'mentions' 
                                    ? 'text-lime-300 bg-gradient-to-r from-lime-500/20 to-green-500/20 border-r-4 border-lime-400 shadow-lg' 
                                    : 'text-gray-200 hover:text-lime-300 hover:bg-lime-400/10 hover:shadow-md'
                                }`}
                              >
                                <span className="text-lg sm:text-xl">🏷️</span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-sm sm:text-base group-hover:text-lime-200 truncate">Mentions</div>
                                  <div className="text-xs text-gray-400 group-hover:text-lime-400/70">Posts where you're tagged</div>
                                </div>
                                {viewMode === 'mentions' && (
                                  <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse flex-shrink-0"></div>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Start a Post Component */}
              {currentUser && viewMode === 'all' && (
                <div className="mb-3 sm:mb-4 lg:mb-6">
                  <div className="bg-black/20 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-4 lg:p-6 shadow-2xl">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 mb-2 sm:mb-3 lg:mb-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden ring-2 ring-lime-400/30 flex-shrink-0">
                        {currentUser.photoURL ? (
                          <img 
                            src={currentUser.photoURL} 
                            alt="Your Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-lime-400 to-green-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm lg:text-lg">
                            {currentUser.firstName && currentUser.lastName 
                              ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
                              : currentUser.initials || currentUser.displayName?.charAt(0)?.toUpperCase() || '👤'
                            }
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleNavigation('/community/submit')}
                        className="flex-1 text-left px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-black/30 hover:bg-black/40 border border-white/20 rounded-full text-gray-300 placeholder-gray-400 transition-all duration-300 hover:border-lime-400/50 focus:border-lime-400 focus:outline-none text-xs sm:text-sm lg:text-base"
                      >
                        <span className="hidden sm:inline">Start a post...</span>
                        <span className="sm:hidden">What's on your mind?</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-center pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleNavigation('/community/submit')}
                        className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 text-gray-300 hover:text-lime-400 hover:bg-lime-400/10 rounded-lg transition-all duration-300 group w-full sm:w-auto justify-center sm:justify-start"
                      >
                        <svg className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-lime-400 group-hover:text-lime-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium">
                          <span className="hidden sm:inline">Write article</span>
                          <span className="sm:hidden">Write</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="text-center py-16 sm:py-20">
                  <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-lime-400 mx-auto mb-4"></div>
                  <p className="text-gray-300 text-base sm:text-lg">Loading your feed...</p>
                </div>
              ) : indexError ? (
                <div className="text-center py-16 sm:py-20">
                  <div className="text-4xl sm:text-5xl mb-6">😔</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Unable to Load Posts</h3>
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 sm:p-6 max-w-md mx-auto mb-6 sm:mb-8">
                    <p className="text-gray-300 mb-4 text-sm sm:text-base">
                      We're experiencing technical difficulties loading the community posts.
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      Our team has been notified and is working to resolve this issue.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIndexError(false);
                      setLoading(true);
                      window.location.reload();
                    }}
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105"
                  >
                    Try Again
                  </button>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 sm:py-20">
                  <div className="text-4xl sm:text-5xl mb-6">
                    {viewMode === 'myPosts' ? '✍️' : 
                     viewMode === 'mentions' ? '🏷️' : '📝'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    {viewMode === 'myPosts' ? 'No posts created yet' : 
                     viewMode === 'mentions' ? 'No mentions yet' : 
                     'No posts yet'}
                  </h3>
                  <p className="text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base px-4">
                    {viewMode === 'myPosts' 
                      ? 'Start sharing your knowledge with the community!' 
                      : viewMode === 'mentions'
                      ? 'When someone tags you in a post, it will appear here!'
                      : 'Be the first to share something with the hub!'
                    }
                  </p>
                  {currentUser && viewMode !== 'mentions' && (
                    <button
                      onClick={() => handleNavigation('/community/submit')}
                      className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base transition-all duration-300 transform hover:scale-105"
                    >
                      {viewMode === 'myPosts' ? 'Create Your First Post' : 'Write First Post'}
                    </button>
                  )}
                </div>

              ) : (
                /* Feed Posts */
                <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-24 lg:pb-32">
                  {posts.map((post) => {
                    const isExpanded = expandedPosts.has(post.id);
                    const showPostReplies = showReplies.has(post.id);
                    const postReplies = replies[post.id] || [];
                    const replyCount = replyCounts[post.id] || 0;
                    const reactionCount = reactionCounts[post.id] || 0;
                    const isLiked = isPostLikedByUser(post.id);
                    const postTaggedUsers = replyTaggedUsers[post.id] || [];
                    
                    return (
                      <article key={post.id} className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-lime-500/20 hover:scale-[1.01] sm:hover:scale-[1.02] hover:border-lime-400/30">
                        
                        {/* Post Header */}
                        <div className="p-4 sm:p-6 border-b border-white/10">
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                              <ClickableUserAvatar 
                                user={{
                                  uid: post.authorId,
                                  email: post.authorEmail,
                                  firstName: post.authorFirstName,
                                  lastName: post.authorLastName,
                                  displayName: post.authorName,
                                  photoURL: post.authorPhoto
                                }}
                                size="lg"
                                className="ring-2 ring-lime-400/30 shadow-lg flex-shrink-0"
                              />
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <EnhancedClickableUserName
                                    user={{
                                      uid: post.authorId,
                                      email: post.authorEmail,
                                      firstName: post.authorFirstName,
                                      lastName: post.authorLastName,
                                      displayName: post.authorName
                                    }}
                                    className="font-bold text-white text-sm sm:text-lg truncate hover:text-lime-300 transition-colors"
                                  />
                                </div>
                                <div className="flex flex-col">
                                  {post.authorTitle && (
                                    <p className="text-lime-400 text-xs sm:text-sm font-medium truncate">
                                      {post.authorTitle}
                                    </p>
                                  )}
                                  <p className="text-gray-300 text-xs sm:text-sm">
                                    {formatDate(post.createdAt)} • {formatTime(post.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Edit/Delete Menu for Post Owner Only */}
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                              {isPostAuthor(post) && !post.isRepost && (
                                <div className="relative group">
                                  <button 
                                    className="p-1 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 group-hover:scale-110"
                                    title="Post options (Edit/Delete)"
                                  >
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                  
                                  <div className="absolute right-0 top-full mt-2 w-40 sm:w-48 bg-black/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                                    <div className="py-2">
                                      <div className="px-3 sm:px-4 py-2 border-b border-white/10">
                                        <span className="text-xs text-lime-400 font-semibold flex items-center">
                                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727z" clipRule="evenodd" />
                                          </svg>
                                          Your Post
                                        </span>
                                      </div>
                                      
                                      <button
                                        onClick={() => startEditPost(post.id, post.title, post.content)}
                                        className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-gray-300 hover:text-lime-400 hover:bg-lime-400/10 transition-colors text-xs sm:text-sm group/item"
                                      >
                                        <svg className="h-3 w-3 sm:h-4 sm:w-4 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span className="font-medium">Edit post</span>
                                      </button>
                                      
                                      <div className="h-px bg-white/10 mx-2 my-1"></div>
                                      
                                      <button
                                        onClick={() => setShowDeleteConfirm(post.id)}
                                        className="flex items-center space-x-2 sm:space-x-3 w-full px-3 sm:px-4 py-2 sm:py-3 text-gray-300 hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs sm:text-sm group/item"
                                      >
                                        <svg className="h-3 w-3 sm:h-4 sm:w-4 group-hover/item:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span className="font-medium">Delete post</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Post Title - Edit Mode or Display Mode */}
                          {editingPost === post.id ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={editContent.title || ''}
                                onChange={(e) => setEditContent(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Post title..."
                                className="w-full p-2 sm:p-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 font-bold text-base sm:text-xl"
                              />
                            </div>
                          ) : (
                            <h2 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                              {post.title}
                            </h2>
                          )}
                        </div>

                        {/* Post Content and Actions */}
                        <div className="p-4 sm:p-6 pt-0">
                          {post.isRepost && <RepostDisplay post={post} />}
                          
                          {editingPost === post.id ? (
                            /* Edit Mode */
                            <div className="space-y-3 sm:space-y-4">
                              <textarea
                                value={editContent.content || ''}
                                onChange={(e) => setEditContent(prev => ({ ...prev, content: e.target.value }))}
                                placeholder="What's on your mind?"
                                className="w-full p-3 sm:p-4 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 resize-none min-h-[100px] sm:min-h-[120px] text-sm sm:text-base"
                                rows="6"
                              />
                              
                              <div className="flex items-center justify-end space-x-2 sm:space-x-3">
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 sm:px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => saveEdit(post.id)}
                                  disabled={savingEdit || !editContent.title?.trim() || !editContent.content?.trim()}
                                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                >
                                  {savingEdit ? (
                                    <span className="flex items-center">
                                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                      Saving...
                                    </span>
                                  ) : (
                                    'Save Changes'
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Display Mode with Link Support */
                            <div className="mb-3 sm:mb-4">
                              {!post.isRepost && (
                                <TruncatedRichContent
                                  content={post.content}
                                  postId={post.id}
                                  limit={CONTENT_LIMIT}
                                  expandedPosts={expandedPosts}
                                  onToggleExpansion={togglePostExpansion}
                                />
                              )}
                              
                              {/* Media Gallery with video support */}
                              {!post.isRepost && post.media && post.media.length > 0 && (
                                <MediaGallery media={post.media} />
                              )}
                              
                              {/* Legacy support for posts with images field */}
                              {!post.isRepost && !post.media && post.images && post.images.length > 0 && (
                                <MediaGallery media={post.images.map(img => ({ ...img, type: 'image' }))} />
                              )}
                              
                              <TaggedUsers taggedUsers={post.taggedUsers} />
                            </div>
                          )}

                          {/* Post Actions Bar */}
                          {editingPost !== post.id && (
                            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-white/10">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                {/* Like Button */}
                                <button
                                  onClick={() => handlePostReaction(post.id, isLiked)}
                                  disabled={submittingReaction[post.id]}
                                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 group ${
                                    isLiked 
                                      ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20' 
                                      : 'text-gray-400 hover:text-red-400 hover:bg-red-500/10'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  <span className={`transition-transform duration-300 ${isLiked ? 'scale-110' : 'group-hover:scale-110'}`}>
                                    {isLiked ? '❤️' : '🤍'}
                                  </span>
                                  <span className="hidden sm:inline">{isLiked ? 'Liked' : 'Like'}</span>
                                  {reactionCount > 0 && (
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-xs">
                                      {reactionCount}
                                    </span>
                                  )}
                                </button>

                                {/* Reply Button */}
                                <button
                                  onClick={() => toggleReplies(post.id)}
                                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all duration-300 group"
                                >
                                  <svg className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="hidden sm:inline">Reply</span>
                                  {replyCount > 0 && (
                                    <span className="bg-white/10 px-1.5 py-0.5 rounded-full text-xs">
                                      {replyCount}
                                    </span>
                                  )}
                                </button>

                                {/* Repost Button */}
                                <button
                                  onClick={() => setShowRepostModal(post)}
                                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-300 group"
                                >
                                  <svg className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  <span className="hidden sm:inline">Repost</span>
                                </button>

                                {/* Share Button */}
                                <button
                                  onClick={() => handleSharePost(post.id)}
                                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-lime-400 hover:bg-lime-500/10 transition-all duration-300 group"
                                >
                                  <svg className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                  </svg>
                                  <span className="hidden sm:inline">Share</span>
                                </button>
                              </div>

                              {/* Reactions Summary */}
                              {reactionCount > 0 && (
                                <ReactionAvatars
                                  postId={post.id}
                                  userIds={postReactions[post.id] || []}
                                  reactionCount={reactionCount}
                                  onClick={() => openReactionsModal(post.id, postReactions[post.id] || [])}
                                />
                              )}
                            </div>
                          )}

                          {/* Replies Section */}
                          {showPostReplies && (
                            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/10">
                              {/* Reply Input */}
                              <div className="mb-4 sm:mb-6">
                                <div className="flex space-x-2 sm:space-x-3 mb-3">
                                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center flex-shrink-0">
                                    {currentUser?.photoURL ? (
                                      <img 
                                        src={currentUser.photoURL} 
                                        alt="Your Profile" 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-white font-bold text-xs sm:text-sm">
                                        {currentUser?.firstName && currentUser?.lastName 
                                          ? `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase()
                                          : currentUser?.initials || currentUser?.displayName?.charAt(0)?.toUpperCase() || '👤'
                                        }
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <MentionTextarea
                                      value={replyText[post.id] || ''}
                                      onChange={(text) => handleReplyChange(post.id, text)}
                                      onMentionSelect={(user) => handleReplyMentionSelect(post.id, user)}
                                      placeholder="Write a reply... Use @username to tag users"
                                      className="w-full p-2 sm:p-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 resize-none text-xs sm:text-sm"
                                      rows="2"
                                    />
                                  </div>
                                </div>

                                {/* Reply Tagged Users */}
                                <TaggedUsersSmall 
                                  taggedUsers={postTaggedUsers} 
                                  onRemoveTag={(indexOrAll) => handleReplyRemoveTag(post.id, indexOrAll)} 
                                />

                                <div className="flex justify-end mt-2 sm:mt-3">
                                  <button
                                    onClick={() => submitReply(post.id)}
                                    disabled={submittingReply[post.id] || !replyText[post.id]?.trim()}
                                    className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                                  >
                                    {submittingReply[post.id] ? (
                                      <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 sm:mr-2"></div>
                                        Posting...
                                      </span>
                                    ) : (
                                      'Post Reply'
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Replies List */}
                              {loadingReplies[post.id] ? (
                                <div className="text-center py-4">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-400 mx-auto mb-2"></div>
                                  <p className="text-gray-400 text-xs sm:text-sm">Loading replies...</p>
                                </div>
                              ) : postReplies.length === 0 ? (
                                <div className="text-center py-6 sm:py-8">
                                  <div className="text-2xl sm:text-3xl mb-2">💬</div>
                                  <p className="text-gray-400 text-sm">Be the first to reply!</p>
                                </div>
                              ) : (
                                <div className="space-y-3 sm:space-y-4">
                                  {postReplies.map((reply) => (
                                    <div key={reply.id} className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
                                      <div className="flex items-start space-x-2 sm:space-x-3">
                                        <ClickableUserAvatar 
                                          user={{
                                            uid: reply.authorId,
                                            firstName: reply.authorFirstName,
                                            lastName: reply.authorLastName,
                                            displayName: reply.authorName,
                                            photoURL: reply.authorPhoto
                                          }}
                                          size="sm"
                                          className="flex-shrink-0"
                                        />
                                        
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                                            <div className="flex items-center space-x-2">
                                              <EnhancedClickableUserName
                                                user={{
                                                  uid: reply.authorId,
                                                  firstName: reply.authorFirstName,
                                                  lastName: reply.authorLastName,
                                                  displayName: reply.authorName
                                                }}
                                                className="font-semibold text-white text-xs sm:text-sm hover:text-lime-300 transition-colors"
                                              />
                                              {reply.authorTitle && (
                                                <span className="text-lime-400 text-xs hidden sm:inline">
                                                  • {reply.authorTitle}
                                                </span>
                                              )}
                                            </div>
                                            
                                            {/* Reply Actions */}
                                            {isReplyAuthor(reply) && (
                                              <div className="flex items-center space-x-1">
                                                <button
                                                  onClick={() => startEditReply(reply.id, reply.content)}
                                                  className="text-gray-400 hover:text-lime-400 p-1 rounded transition-colors"
                                                  title="Edit reply"
                                                >
                                                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                  </svg>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                          
                                          <div className="text-gray-400 text-xs mb-2">
                                            {formatDate(reply.createdAt)} • {formatTime(reply.createdAt)}
                                          </div>

                                          {/* Reply Content */}
                                          {editingReply === reply.id ? (
                                            <div className="space-y-2 sm:space-y-3">
                                              <textarea
                                                value={editReplyContent}
                                                onChange={(e) => setEditReplyContent(e.target.value)}
                                                className="w-full p-2 sm:p-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 resize-none text-xs sm:text-sm"
                                                rows="3"
                                              />
                                              <div className="flex justify-end space-x-2">
                                                <button
                                                  onClick={cancelReplyEdit}
                                                  className="px-2 sm:px-3 py-1 text-gray-300 hover:text-white hover:bg-white/10 rounded text-xs transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  onClick={() => saveReplyEdit(post.id, reply.id)}
                                                  disabled={savingReplyEdit || !editReplyContent.trim()}
                                                  className="px-2 sm:px-3 py-1 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white rounded text-xs font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  {savingReplyEdit ? (
                                                    <span className="flex items-center">
                                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                                      Saving...
                                                    </span>
                                                  ) : (
                                                    'Save'
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <RichTextContent 
                                                content={reply.content}
                                                className="text-gray-200 leading-relaxed text-xs sm:text-sm"
                                              />
                                              <TaggedUsers taggedUsers={reply.taggedUsers} />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {!loading && posts.length > 0 && hasMore && (
                <div className="text-center pb-16 sm:pb-20">
                  <button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    className="bg-black/40 hover:bg-black/60 border border-white/20 text-white hover:text-lime-400 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold text-sm sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none backdrop-blur-xl"
                  >
                    {loadingMore ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-lime-400 mr-2 sm:mr-3"></div>
                        <span className="hidden sm:inline">Loading more posts...</span>
                        <span className="sm:hidden">Loading...</span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="hidden sm:inline">Load More Posts</span>
                        <span className="sm:hidden">Load More</span>
                        <svg className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* End of Feed Message */}
              {!loading && posts.length > 0 && !hasMore && (
                <div className="text-center pb-16 sm:pb-20">
                  <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-lg max-w-md mx-auto">
                    <p className="text-gray-300 font-medium text-sm sm:text-base">
                      {viewMode === 'myPosts' 
                        ? "You've seen all your posts!"
                        : viewMode === 'mentions'
                        ? "You've seen all posts where you're mentioned!"
                        : "You've reached the end! You've seen all hub posts."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 🔥 NEW: Right Sidebar Container with Follow Suggestions + Company Info */}
            <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 sidebar-container sidebar-right lg:max-w-[320px] xl:max-w-[320px]">
              <div className="sticky top-[5.5rem] lg:top-[5.5rem] xl:top-24 space-y-6 max-h-[calc(100vh-6.5rem)] lg:max-h-[calc(100vh-6.5rem)] xl:max-h-[calc(100vh-7rem)] overflow-y-auto">
                {/* 🔥 NEW: Follow Suggestions Sidebar */}
                <div className="flex-shrink-0">
                  <FollowSuggestionsSidebar currentUser={currentUser} />
                </div>
                
                {/* 🔥 EXISTING: Company Info Sidebar */}
                <div className="flex-shrink-0">
                  <CompanyInfoSidebar />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-sm sm:max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 bg-red-500/20 rounded-full">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <h3 className="text-base sm:text-lg font-bold text-white text-center mb-2">Delete Post</h3>
              <p className="text-gray-300 text-center mb-4 sm:mb-6 text-sm sm:text-base">
                Are you sure you want to delete this post? This action cannot be undone.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletePost(showDeleteConfirm)}
                  disabled={deletingPost[showDeleteConfirm]}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {deletingPost[showDeleteConfirm] ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reactions Modal */}
      <ReactionsModal 
        isOpen={!!showReactionsModal}
        onClose={closeReactionsModal}
        postId={showReactionsModal}
        reactions={reactionsData}
        reactionCount={showReactionsModal ? (reactionCounts[showReactionsModal] || 0) : 0}
      />

      {/* Repost Modal with Tagging Support */}
      <RepostModal
        isOpen={!!showRepostModal}
        onClose={() => setShowRepostModal(null)}
        post={showRepostModal}
        onRepost={handleRepost}
        isSubmitting={submittingRepost}
      />

      {/* Enhanced Responsive Styles with Fixed Sidebar Overflow */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
        }
        
        .backdrop-blur-2xl {
          backdrop-filter: blur(40px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        article {
          animation: fadeIn 0.6s ease-out;
        }

        /* CSS FIXES for Media Gallery Click Issues */
        .media-gallery img,
        .media-gallery video {
          pointer-events: auto !important;
          cursor: pointer !important;
          position: relative;
          z-index: 1;
        }

        .cursor-pointer {
          cursor: pointer !important;
          pointer-events: auto !important;
        }

        /* Video styling */
        video {
          background: #000;
          border-radius: inherit;
        }

        video::-webkit-media-controls-panel {
          background-color: rgba(0, 0, 0, 0.8);
        }

        video::-webkit-media-controls-play-button,
        video::-webkit-media-controls-volume-slider,
        video::-webkit-media-controls-timeline {
          filter: brightness(1.2);
        }

        /* Video duration badge styling */
        .video-duration-badge {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          font-family: 'Inter', monospace;
        }

        /* Video play button overlay */
        .video-play-overlay {
          transition: all 0.3s ease;
          backdrop-filter: blur(2px);
        }

        .video-play-overlay:hover {
          backdrop-filter: blur(1px);
        }

        /* FIXED: Enhanced Responsive Sidebar Styles with Overflow Constraints */
        .sidebar-container {
          position: relative;
          z-index: 10;
          box-sizing: border-box;
        }

        @media (min-width: 1024px) {
          .sidebar-left {
            position: sticky;
            top: 5.5rem;
            height: fit-content;
            max-height: calc(100vh - 6.5rem);
            overflow: hidden;
          }
          
          .sidebar-right {
            /* Positioning handled by parent container */
            overflow: visible;
          }
        }

        @media (min-width: 1280px) {
          .sidebar-left {
            top: 6rem;
            max-height: calc(100vh - 7rem);
          }
        }

        /* Fixed sidebar content overflow */
        .sidebar-content {
          max-height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
        }

        .sidebar-scrollable {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Enhanced scrollbar for sidebar content - Better visibility */
        .sidebar-scrollable::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scrollable::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .sidebar-scrollable::-webkit-scrollbar-thumb {
          background: rgba(76, 175, 80, 0.4);
          border-radius: 3px;
          transition: background 0.3s ease;
        }

        .sidebar-scrollable::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 175, 80, 0.6);
        }

        /* Enhanced hover effects for sidebar items */
        .sidebar-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-item:hover {
          transform: translateY(-1px) scale(1.01);
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
        }

        /* Enhanced clickable user name styles */
        .clickable-username {
          transition: all 0.2s ease;
          border-radius: 4px;
          padding: 2px 4px;
          margin: -2px -4px;
          position: relative;
        }

        .clickable-username:hover {
          background-color: rgba(76, 175, 80, 0.1);
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
        }

        .clickable-username:active {
          transform: translateY(0);
        }

        /* Add subtle indicator that names are clickable */
        .clickable-username::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(76, 175, 80, 0.6), transparent);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .clickable-username:hover::after {
          width: 100%;
        }

        /* Mobile-specific user name styles */
        @media (max-width: 768px) {
          .clickable-username {
            min-height: 44px;
            display: flex;
            align-items: center;
            padding: 8px 6px;
            margin: -8px -6px;
          }
          
          .clickable-username:hover {
            background-color: rgba(76, 175, 80, 0.15);
            transform: none;
          }
        }

        /* Tagged user hover effects */
        .tagged-user-link {
          transition: all 0.2s ease;
          border-radius: 6px;
        }

        .tagged-user-link:hover {
          background-color: rgba(76, 175, 80, 0.15);
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .tagged-user-link:hover {
            transform: none;
            background-color: rgba(76, 175, 80, 0.2);
          }
        }

        /* Link styling enhancements */
        .text-blue-400 {
          word-break: break-word;
          hyphens: auto;
        }

        .text-blue-400:hover {
          text-decoration: none;
          text-shadow: 0 0 8px rgba(96, 165, 250, 0.5);
        }

        .text-blue-400:after {
          content: ' ↗';
          font-size: 0.75em;
          opacity: 0.6;
          margin-left: 2px;
        }

        @media (hover: hover) and (pointer: fine) {
          .text-blue-400:hover:after {
            opacity: 1;
            transform: translateX(2px);
            transition: all 0.2s ease;
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

        /* FIXED: Container max-width to prevent overall page overflow */
        .container {
          max-width: 1600px; /* Prevent ultra-wide layouts */
        }

        @media (min-width: 1920px) {
          .container {
            max-width: 1800px;
          }
        }

        /* FIXED: Ensure main layout doesn't exceed viewport */
        .main-content {
          min-width: 0; /* Allow flex shrinking */
          flex: 1 1 0%; /* Proper flex behavior */
        }

        /* Fix specific overflow issues */
        .prevent-overflow {
          max-width: 100vw;
          overflow-x: hidden;
          box-sizing: border-box;
        }

        .prevent-overflow * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default CommunityPosts;
