// src/Pages/community/SubmitPost.jsx - COMPLETE with Fixed Video Upload Support (60s max)

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { safeMentionNotification } from '../../utils/emailNotifications';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

// 🔥 Import error handling utilities
import { 
  safeFirestoreOperation, 
  showSuccessMessage, 
  showWarningMessage 
} from '../../utils/errorHandler';

// 🔥 Import tagging utilities
import { extractMentions, validateMentions } from '../../utils/mentionUtils';

// 🎥 FIXED: Enhanced Media Upload Utilities - Imgur Only
const uploadImageToImgur = async (file) => {
  const clientId = process.env.REACT_APP_IMGUR_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Imgur Client ID not configured. Please add REACT_APP_IMGUR_CLIENT_ID to your environment variables.');
  }
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'file');
    
    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${clientId}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.data?.error || 'Upload failed');
    }
    
    return {
      url: result.data.link,
      deleteHash: result.data.deletehash,
      id: result.data.id,
      title: result.data.title || file.name,
      type: result.data.type
    };
  } catch (error) {
    console.error('Imgur upload error:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

// 🎥 FIXED: Imgur Video Upload (Proper Implementation)
const uploadVideoToImgur = async (file) => {
  const clientId = process.env.REACT_APP_IMGUR_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Imgur Client ID not configured. Please add REACT_APP_IMGUR_CLIENT_ID to your environment variables.');
  }
  
  try {
    const formData = new FormData();
    formData.append('video', file);  // Use 'video' parameter for video files
    formData.append('type', 'file');
    formData.append('title', file.name);
    formData.append('description', `Video uploaded via Favored Online - Duration: ${Math.floor(file.duration || 0)}s`);
    
    const response = await fetch('https://api.imgur.com/3/upload', {  // Use the general upload endpoint
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${clientId}`,
        'Accept': 'application/json'
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imgur API Error:', errorText);
      throw new Error(`Imgur upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success || !result.data) {
      console.error('Imgur Response Error:', result);
      throw new Error(result.data?.error?.message || 'Imgur upload failed - no data returned');
    }
    
    return {
      url: result.data.link,
      deleteHash: result.data.deletehash,
      id: result.data.id,
      title: result.data.title || file.name,
      type: result.data.type || 'video/mp4',
      width: result.data.width || null,
      height: result.data.height || null,
      size: result.data.size || file.size,
      animated: result.data.animated || false
    };
  } catch (error) {
    console.error('Imgur video upload error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('413')) {
      throw new Error('Video file too large for Imgur. Please use a video under 200MB.');
    } else if (error.message.includes('415')) {
      throw new Error('Video format not supported by Imgur. Please use MP4, WebM, or MOV format.');
    } else if (error.message.includes('429')) {
      throw new Error('Upload rate limit exceeded. Please wait a moment and try again.');
    } else {
      throw new Error(`Failed to upload video to Imgur: ${error.message}`);
    }
  }
};

// 🎥 Video duration validation utility
const getVideoDuration = (file) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = video.duration;
      
      if (isNaN(duration)) {
        reject(new Error('Could not determine video duration'));
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

// 🎥 FIXED: Universal Media Upload Function (Updated for Community Structure)
const uploadMedia = async (file, onProgress) => {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  
  if (!isVideo && !isImage) {
    throw new Error('Unsupported file type. Please upload images or videos only.');
  }
  
  try {
    let result;
    let duration = null;
    
    if (isVideo) {
      // Validate video duration FIRST (as seen in CommunityPosts.jsx)
      try {
        duration = await getVideoDuration(file);
        if (duration > 60) {
          throw new Error('Video must be 60 seconds or shorter to comply with community guidelines');
        }
      } catch (durationError) {
        if (durationError.message.includes('60 seconds')) {
          throw durationError;
        }
        console.warn('Could not determine video duration:', durationError);
        // Continue upload but warn user
      }
      
      if (onProgress) onProgress(25, 'Uploading video to Imgur...');
      
      try {
        result = await uploadVideoToImgur(file);
        
        if (onProgress) onProgress(100, 'Video uploaded successfully!');
        
        // Return data structure that matches CommunityPosts.jsx expectations
        return {
          ...result,
          type: 'video',
          filename: file.name,
          size: file.size,
          duration: duration, // This is crucial for the community display
          isVideo: true,
          // Additional metadata for community display
          uploadedAt: new Date().toISOString(),
          service: 'imgur'
        };
        
      } catch (imgurError) {
        console.error('Imgur video upload failed:', imgurError);
        
        // If Imgur fails, provide helpful error messages
        if (imgurError.message.includes('format not supported')) {
          throw new Error('Video format not supported by Imgur. Please try converting to MP4 format and ensure it\'s under 60 seconds.');
        } else if (imgurError.message.includes('too large')) {
          throw new Error('Video file too large. Please compress your video or use a shorter clip (max 60 seconds).');
        } else {
          throw new Error('Video upload failed. Please check your internet connection and try again with a smaller file.');
        }
      }
    } else {
      // Images still use the existing Imgur image upload
      if (onProgress) onProgress(25, 'Uploading image to Imgur...');
      result = await uploadImageToImgur(file);
      if (onProgress) onProgress(100, 'Image uploaded successfully!');
      
      // Return data structure that matches CommunityPosts.jsx expectations
      return {
        ...result,
        type: 'image',
        filename: file.name,
        size: file.size,
        isImage: true,
        uploadedAt: new Date().toISOString(),
        service: 'imgur'
      };
    }
  } catch (error) {
    if (onProgress) onProgress(0, `Upload failed: ${error.message}`);
    throw error;
  }
};

// 🎥 UPDATED: Enhanced Video Validation (Matches Community Standards)
const validateMediaFile = async (file) => {
  const maxImageSize = 10 * 1024 * 1024; // 10MB for images (Imgur limit)
  const maxVideoSize = 200 * 1024 * 1024; // 200MB for videos (Imgur limit)
  
  if (file.type.startsWith('image/')) {
    if (file.size > maxImageSize) {
      return 'Image must be under 10MB to upload to Imgur';
    }
    
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedImageTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are supported by Imgur';
    }
    
    return null;
  } else if (file.type.startsWith('video/')) {
    if (file.size > maxVideoSize) {
      return 'Video must be under 200MB to upload to Imgur';
    }
    
    // Imgur supports these video formats
    const allowedVideoTypes = [
      'video/mp4', 
      'video/webm', 
      'video/mov', 
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/mpeg',
      'video/3gpp'
    ];
    
    if (!allowedVideoTypes.includes(file.type)) {
      return 'Imgur supports MP4, WebM, MOV, AVI, and MPEG video formats. Please convert your video.';
    }
    
    try {
      const duration = await getVideoDuration(file);
      if (duration > 60) {
        return 'Video must be 60 seconds or shorter (community guideline)';
      }
    } catch (error) {
      console.warn('Could not validate video duration:', error);
      return 'Could not validate video. Please ensure it\'s a valid video file under 60 seconds.';
    }
    
    return null;
  } else {
    return 'Only image and video files are supported';
  }
};

// 🎥 Utility functions
const createMediaPreview = (file) => URL.createObjectURL(file);

const cleanupMediaPreviews = (previewUrls) => {
  previewUrls.forEach(url => {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatVideoDuration = (seconds) => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getMediaType = (file) => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'unknown';
};

const getMediaIcon = (type) => {
  switch (type) {
    case 'video': return '🎥';
    case 'image': return '🖼️';
    default: return '📁';
  }
};

// 🔗 Link Insertion Modal Component
const LinkInsertModal = ({ isOpen, onClose, onInsert }) => {
  const [linkData, setLinkData] = useState({
    url: '',
    text: '',
    openInNewTab: true
  });

  const [validating, setValidating] = useState(false);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (url) => {
    if (!url.trim()) return 'URL is required';
    
    try {
      let fullUrl = url.trim();
      if (!/^https?:\/\//i.test(fullUrl)) {
        fullUrl = 'https://' + fullUrl;
      }
      
      const urlObj = new URL(fullUrl);
      
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return 'Only HTTP and HTTPS URLs are allowed';
      }
      
      return null;
    } catch (error) {
      return 'Please enter a valid URL';
    }
  };

  const handleUrlChange = (url) => {
    setLinkData(prev => ({ ...prev, url }));
    setUrlError('');
    
    if (!linkData.text && url) {
      try {
        let displayUrl = url.trim();
        if (!/^https?:\/\//i.test(displayUrl)) {
          displayUrl = 'https://' + displayUrl;
        }
        const urlObj = new URL(displayUrl);
        const domain = urlObj.hostname.replace(/^www\./, '');
        setLinkData(prev => ({ ...prev, text: domain }));
      } catch (error) {
        // Ignore error, keep existing text
      }
    }
  };

  const handleInsert = async () => {
    const error = validateUrl(linkData.url);
    if (error) {
      setUrlError(error);
      return;
    }

    setValidating(true);
    
    try {
      let finalUrl = linkData.url.trim();
      if (!/^https?:\/\//i.test(finalUrl)) {
        finalUrl = 'https://' + finalUrl;
      }

      const finalText = linkData.text.trim() || finalUrl;
      const markdownLink = `[${finalText}](${finalUrl})`;
      
      onInsert(markdownLink);
      handleClose();
    } catch (error) {
      setUrlError('Failed to process URL');
    } finally {
      setValidating(false);
    }
  };

  const handleClose = () => {
    setLinkData({ url: '', text: '', openInNewTab: true });
    setUrlError('');
    setValidating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center">
            <span className="text-blue-400 mr-2">🔗</span>
            Insert Link
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">URL *</label>
            <input
              type="url"
              value={linkData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com or example.com"
              className={`w-full p-3 bg-black/30 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                urlError 
                  ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' 
                  : 'border-white/20 focus:border-blue-400 focus:ring-blue-400/20'
              }`}
              autoFocus
            />
            {urlError && <p className="text-red-400 text-sm mt-1">{urlError}</p>}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Display Text</label>
            <input
              type="text"
              value={linkData.text}
              onChange={(e) => setLinkData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Link text (optional - will use domain if empty)"
              className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-colors"
            />
            <p className="text-gray-400 text-xs mt-1">Leave empty to auto-generate from URL</p>
          </div>

          {linkData.url && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm font-medium mb-1">Preview:</p>
              <div className="text-blue-400 hover:text-blue-300 underline cursor-pointer text-sm">
                {linkData.text || linkData.url}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={validating}
              className="flex-1 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!linkData.url.trim() || validating}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {validating ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <span className="mr-2">🔗</span>
                  Insert Link
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced MentionTextarea Component with Link Toolbar
const MentionTextarea = ({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  className = "",
  onMentionSelect,
  rows = 12,
  showLinkButton = false,
  ...props 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const textareaRef = useRef(null);

  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    try {
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
      
      [...displayNameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        users.set(doc.id, {
          uid: doc.id,
          ...doc.data()
        });
      });
      
      return Array.from(users.values()).slice(0, 5);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const handleTextChange = async (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
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

  const selectSuggestion = (user, index = selectedSuggestionIndex) => {
    if (!suggestions[index]) return;
    
    const selectedUser = suggestions[index];
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textareaRef.current.selectionStart);
    const newValue = beforeMention + `@${selectedUser.displayName || selectedUser.email.split('@')[0]} ` + afterMention;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    if (onMentionSelect) {
      onMentionSelect(selectedUser);
    }
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPosition = beforeMention.length + `@${selectedUser.displayName || selectedUser.email.split('@')[0]} `.length;
      textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleLinkInsert = (markdownLink) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeSelection = value.substring(0, start);
    const afterSelection = value.substring(end);
    
    const newValue = beforeSelection + markdownLink + afterSelection;
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = start + markdownLink.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

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
      {showLinkButton && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm">Formatting:</span>
            <button
              type="button"
              onClick={() => setShowLinkModal(true)}
              className="flex items-center space-x-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded text-blue-300 hover:text-blue-200 transition-colors text-xs"
              title="Insert Link"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span>Link</span>
            </button>
          </div>
          <div className="text-gray-400 text-xs">
            Use @username to mention • Add links with the link button
          </div>
        </div>
      )}

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
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 w-full max-w-xs bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-48 overflow-y-auto"
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
              className={`flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                index === selectedSuggestionIndex ? 'bg-lime-500/20 text-lime-300' : 'text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
                <div className="font-medium truncate">
                  {user.displayName || user.email?.split('@')[0]}
                </div>
                {user.displayName && user.email && (
                  <div className="text-xs text-gray-400 truncate">{user.email}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <LinkInsertModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onInsert={handleLinkInsert}
      />
    </div>
  );
};

// Tagged Users Display Component
const TaggedUsers = ({ taggedUsers = [], onRemoveTag }) => {
  if (!taggedUsers.length) return null;
  
  return (
    <div className="mt-4 p-4 bg-lime-500/10 border border-lime-500/30 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lime-300 font-medium text-sm flex items-center">
          <span className="mr-2">🏷️</span>
          Tagged Users ({taggedUsers.length}):
        </h4>
        <button
          type="button"
          onClick={() => onRemoveTag('all')}
          className="text-gray-400 hover:text-white text-xs transition-colors"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {taggedUsers.map((user, index) => (
          <div 
            key={user.uid || index} 
            className="flex items-center space-x-2 bg-lime-500/20 border border-lime-500/40 rounded-lg px-3 py-2 text-lime-300"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-xs">
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
            <span className="text-sm font-medium">
              @{user.displayName || user.email?.split('@')[0]}
            </span>
            <button
              type="button"
              onClick={() => onRemoveTag(index)}
              className="text-lime-400 hover:text-lime-200 ml-1 font-bold text-sm transition-colors"
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

const SubmitPost = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Form state with media (images and videos) and tagging
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    media: []
  });
  
  // Tagging state
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUploadProgress, setMediaUploadProgress] = useState({});
  const [previewUrls, setPreviewUrls] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Constants for 2-media limit (images + videos)
  const MAX_MEDIA = 2;
  const SUPPORTED_IMAGE_FORMATS = ['JPEG', 'PNG', 'GIF', 'WebP'];
  const SUPPORTED_VIDEO_FORMATS = ['MP4', 'WebM', 'MOV', 'AVI'];
  const SUPPORTED_FORMATS = [...SUPPORTED_IMAGE_FORMATS, ...SUPPORTED_VIDEO_FORMATS];

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupMediaPreviews(previewUrls);
    };
  }, [previewUrls]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (newContent) => {
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));
  };

  const handleMentionSelect = (user) => {
    setTaggedUsers(prev => {
      const exists = prev.find(u => u.uid === user.uid);
      if (!exists) {
        return [...prev, user];
      }
      return prev;
    });
  };

  const handleRemoveTag = (indexOrAll) => {
    if (indexOrAll === 'all') {
      setTaggedUsers([]);
    } else {
      setTaggedUsers(prev => prev.filter((_, i) => i !== indexOrAll));
    }
  };

  // Media handling functions
  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    processSelectedFiles(files);
  };

  const processSelectedFiles = async (files) => {
    const validFiles = [];
    const errors = [];
    const newPreviewUrls = [];

    for (const file of files) {
      try {
        const error = await validateMediaFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
          newPreviewUrls.push(createMediaPreview(file));
        }
      } catch (error) {
        errors.push(`${file.name}: Failed to validate file`);
      }
    }

    if (errors.length > 0) {
      showWarningMessage(`Some files were skipped: ${errors.join(', ')}`);
    }

    const currentMediaCount = formData.media.length;
    const currentSelectedCount = selectedFiles.length;
    const totalCurrent = currentMediaCount + currentSelectedCount;
    const maxNewMedia = MAX_MEDIA - totalCurrent;
    
    if (validFiles.length > maxNewMedia) {
      if (maxNewMedia === 0) {
        showWarningMessage(`Maximum ${MAX_MEDIA} media files already reached. Remove existing files to add new ones.`);
        cleanupMediaPreviews(newPreviewUrls);
        return;
      } else if (maxNewMedia === 1) {
        showWarningMessage(`Only 1 more media file can be added (maximum ${MAX_MEDIA} total)`);
      } else {
        showWarningMessage(`Only ${maxNewMedia} more media file(s) can be added (maximum ${MAX_MEDIA} total)`);
      }
      
      const filesToAdd = validFiles.slice(0, maxNewMedia);
      const urlsToAdd = newPreviewUrls.slice(0, maxNewMedia);
      
      cleanupMediaPreviews(newPreviewUrls.slice(maxNewMedia));
      
      setSelectedFiles(prev => [...prev, ...filesToAdd]);
      setPreviewUrls(prev => [...prev, ...urlsToAdd]);
    } else {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  // 🎥 FIXED: Upload media using Imgur only with retry logic
  const uploadMediaFiles = async () => {
    if (selectedFiles.length === 0) return;

    setUploadingMedia(true);
    const uploadedMedia = [];
    
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const mediaType = getMediaType(file);
        const mediaIcon = getMediaIcon(mediaType);
        
        setMediaUploadProgress(prev => ({
          ...prev,
          [i]: { status: 'uploading', progress: 0, filename: file.name, type: mediaType }
        }));

        try {
          // Use the fixed upload function
          const result = await uploadMedia(file, (progress, message) => {
            setMediaUploadProgress(prev => ({
              ...prev,
              [i]: { 
                status: 'uploading', 
                progress, 
                filename: file.name, 
                type: mediaType,
                message 
              }
            }));
          });
          
          uploadedMedia.push(result);
          
          setMediaUploadProgress(prev => ({
            ...prev,
            [i]: { status: 'success', progress: 100, filename: file.name, type: mediaType }
          }));
          
        } catch (error) {
          setMediaUploadProgress(prev => ({
            ...prev,
            [i]: { 
              status: 'error', 
              error: error.message, 
              filename: file.name, 
              type: mediaType 
            }
          }));
          console.error(`Failed to upload ${file.name}:`, error);
          
          // Show specific error to user
          showWarningMessage(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      if (uploadedMedia.length > 0) {
        setFormData(prev => ({
          ...prev,
          media: [...prev.media, ...uploadedMedia]
        }));
        
        const videoCount = uploadedMedia.filter(item => item.type === 'video').length;
        const imageCount = uploadedMedia.filter(item => item.type === 'image').length;
        
        let successMessage = '';
        if (videoCount > 0 && imageCount > 0) {
          successMessage = `${uploadedMedia.length} files uploaded to Imgur successfully! (${imageCount} image${imageCount !== 1 ? 's' : ''}, ${videoCount} video${videoCount !== 1 ? 's' : ''})`;
        } else if (videoCount > 0) {
          successMessage = videoCount === 1 ? 'Video uploaded to Imgur successfully! ✅' : `${videoCount} videos uploaded to Imgur successfully! ✅`;
        } else {
          successMessage = imageCount === 1 ? 'Image uploaded to Imgur successfully! ✅' : `${imageCount} images uploaded to Imgur successfully! ✅`;
        }
        
        showSuccessMessage(successMessage);
      }

      cleanupMediaPreviews(previewUrls);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setMediaUploadProgress({});
      
    } catch (error) {
      showWarningMessage('Failed to upload media files. Please try again.');
      console.error('Media upload error:', error);
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = (index) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
    showSuccessMessage('Media file removed successfully');
  };

  const removeSelectedFile = (index) => {
    const urlToCleanup = previewUrls[index];
    if (urlToCleanup) {
      URL.revokeObjectURL(urlToCleanup);
    }

    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setMediaUploadProgress(prev => {
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
    const mediaFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (mediaFiles.length > 0) {
      processSelectedFiles(mediaFiles);
    } else {
      showWarningMessage('Please drop image or video files only');
    }
  };

  // Enhanced form submission with media support and tagging
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    // Form validation
    if (!formData.title.trim()) {
      showWarningMessage('Please enter a title for your post');
      return;
    }

    if (!formData.content.trim()) {
      showWarningMessage('Please enter content for your post');
      return;
    }

    if (formData.title.trim().length < 5) {
      showWarningMessage('Title must be at least 5 characters long');
      return;
    }

    if (formData.content.trim().length < 20) {
      showWarningMessage('Content must be at least 20 characters long');
      return;
    }

    if (selectedFiles.length > 0) {
      showWarningMessage('Please upload your selected media files before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract and validate mentions from content
      const mentions = extractMentions(formData.content);
      const mentionedUsers = await validateMentions(mentions);
      
      // Combine explicitly tagged users with mentioned users
      const allTaggedUsers = [...taggedUsers];
      mentionedUsers.forEach(user => {
        const exists = allTaggedUsers.find(u => u.uid === user.uid);
        if (!exists) {
          allTaggedUsers.push(user);
        }
      });

      // Create post document with media support
      await safeFirestoreOperation(async () => {
        const postData = {
          title: formData.title.trim(),
          content: formData.content.trim(),
          media: formData.media || [],
          images: formData.media ? formData.media.filter(item => item.type === 'image') : [],
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.email,
          authorPhoto: currentUser.photoURL || null,
          
          // Tagging fields for mentions filter
          taggedUsers: allTaggedUsers,
          taggedUserIds: allTaggedUsers.map(user => user.uid),
          mentions: allTaggedUsers.map(user => `@${user.displayName || user.email.split('@')[0]}`),
          
          // Standard fields
          likes: [],
          likeCount: 0,
          repostCount: 0,
          reposts: [],
          
          // Repost fields (not applicable for new posts)
          isRepost: false,
          originalPostId: null,
          originalPost: null,
          repostComment: null,
          
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'posts'), postData);

        // Create notifications for tagged users
        if (allTaggedUsers.length > 0) {
          for (const taggedUser of allTaggedUsers) {
            const notification = {
              userId: taggedUser.uid,
              type: 'mention',
              postId: docRef.id,
              postTitle: formData.title.trim(),
              mentionedBy: currentUser.uid,
              mentionedByName: currentUser.displayName || currentUser.email,
              isRead: false,
              createdAt: serverTimestamp()
            };
            
            await addDoc(collection(db, 'notifications'), notification);
            
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
                title: formData.title.trim(),
                content: formData.content.trim(),
                media: formData.media || []
              },
              false
            );
          }
        }
        return docRef;
      }, 'submitting post');

      const tagMessage = taggedUsers.length > 0 
        ? ` ${taggedUsers.length} user${taggedUsers.length !== 1 ? 's' : ''} will be notified about your mention.`
        : '';
      showSuccessMessage(`Post published successfully! 🎉 Your knowledge is now live in the community.${tagMessage}`);

      // Reset form
      setFormData({
        title: '',
        content: '',
        media: []
      });
      setTaggedUsers([]);
      setSelectedFiles([]);
      setPreviewUrls([]);
      setMediaUploadProgress({});

      // Redirect to community after a delay
      setTimeout(() => {
        navigate('/community');
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  if (!currentUser) {
    return null;
  }

  const totalMedia = formData.media.length + selectedFiles.length;
  const canAddMoreMedia = totalMedia < MAX_MEDIA;
  const remainingSlots = MAX_MEDIA - totalMedia;

  const getMediaStatusMessage = () => {
    if (totalMedia === 0) {
      return `Add up to ${MAX_MEDIA} images or videos (60s max) to make your post more engaging`;
    } else if (totalMedia === 1) {
      return `1 media file added - you can add 1 more`;
    } else if (totalMedia === 2) {
      return `Maximum ${MAX_MEDIA} media files reached`;
    }
    return '';
  };

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
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-10">
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
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 sm:mt-6 pb-4 sm:pb-6 rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 sm:space-y-5 p-4 sm:p-6">
                
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>

                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                {currentUser ? (
                  <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                      )}
                      <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
                    </div>
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
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-6xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 sm:mb-24 md:mb-32 pt-8 sm:pt-12 md:pt-20">
            <div className="max-w-4xl mx-auto text-center">
              
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-pulse">
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em'
                      }}>
                  ✍️ Share Your Knowledge
                </span>
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Create a{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Community Post
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Share your insights, ask questions, or start a discussion with links, images, videos, and tags.
              </p>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Submission Form */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl">
              
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Post Title */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-3 text-lg">
                    Post Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-lg"
                    placeholder="Enter a clear and descriptive title..."
                  />
                  <p className="text-gray-400 text-sm mt-2">Make it engaging and informative (minimum 5 characters)</p>
                </div>

                {/* Post Content with Link Support */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-3 text-lg">
                    Content *
                  </label>
                  <MentionTextarea
                    value={formData.content}
                    onChange={handleContentChange}
                    onMentionSelect={handleMentionSelect}
                    required
                    rows={12}
                    showLinkButton={true}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Share your knowledge, insights, or ask a question...

Examples:
- Tutorial or how-to guide with helpful links
- Industry insights or trends  
- Technical questions or discussions
- Career advice or experiences
- Code snippets with explanations

💡 Pro tips: 
• Type @username to mention and notify other users!
• Use the link button to add relevant resources
• Be detailed and provide value to the community"
                  />
                  <p className="text-gray-400 text-sm mt-2 flex items-center">
                    <span className="mr-2">💡</span>
                    Be detailed and helpful (minimum 20 characters). Use <strong>@username</strong> to tag users and the link button to add resources!
                  </p>
                </div>

                {/* Tagged Users Display */}
                <TaggedUsers 
                  taggedUsers={taggedUsers} 
                  onRemoveTag={handleRemoveTag} 
                />

                {/* Media Upload Section (Images + Videos) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-lime-300 font-semibold text-lg">
                      Media (Optional)
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(MAX_MEDIA)].map((_, index) => (
                          <div 
                            key={index}
                            className={`w-3 h-3 rounded-full ${
                              index < totalMedia 
                                ? 'bg-lime-400 shadow-sm shadow-lime-400/50' 
                                : 'bg-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lime-300 text-sm font-medium">
                        {totalMedia} / {MAX_MEDIA}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-4 flex items-center">
                    <span className="mr-2">
                      {totalMedia === 0 ? '📱' : totalMedia === 1 ? '📸' : '🎬'}
                    </span>
                    {getMediaStatusMessage()}
                  </p>
                  
                  {/* Current Uploaded Media */}
                  {formData.media.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-white text-sm font-medium mb-3 flex items-center">
                        <span className="text-green-400 mr-2">✓</span>
                        Uploaded Media ({formData.media.length}):
                      </h4>
                      <div className={`grid gap-4 ${
                        formData.media.length === 1 
                          ? 'grid-cols-1 max-w-md' 
                          : 'grid-cols-2'
                      }`}>
                        {formData.media.map((mediaItem, index) => (
                          <div key={index} className="relative group bg-white/5 rounded-lg overflow-hidden border border-white/10">
                            {mediaItem.type === 'video' ? (
                              <div className="relative">
                                <video 
                                  src={mediaItem.url} 
                                  className="w-full h-32 object-cover"
                                  controls={false}
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <div className="bg-black/70 text-white rounded-full p-2 flex items-center justify-center">
                                    <svg className="h-6 w-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                                {mediaItem.duration && (
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                    {formatVideoDuration(mediaItem.duration)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <img 
                                src={mediaItem.url} 
                                alt={mediaItem.filename || `Media ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeMedia(index)}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold transition-colors"
                                title="Remove media"
                              >
                                ×
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                              {getMediaIcon(mediaItem.type)} {mediaItem.filename}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Files (before upload) */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white text-sm font-medium flex items-center">
                          <span className="text-yellow-400 mr-2">⏳</span>
                          Selected Files ({selectedFiles.length}):
                        </h4>
                        <button
                          type="button"
                          onClick={uploadMediaFiles}
                          disabled={uploadingMedia}
                          className="bg-lime-500 hover:bg-lime-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {uploadingMedia ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">📤</span>
                              Upload {selectedFiles.length === 1 ? 'File' : 'All'}
                            </>
                          )}
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {selectedFiles.map((file, index) => {
                          const mediaType = getMediaType(file);
                          const mediaIcon = getMediaIcon(mediaType);
                          const progressInfo = mediaUploadProgress[index];
                          
                          return (
                            <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3 border border-white/20">
                              <div className="flex items-center space-x-3">
                                {mediaType === 'video' ? (
                                  <div className="relative">
                                    <video 
                                      src={previewUrls[index]} 
                                      className="w-12 h-12 object-cover rounded border border-white/20"
                                      muted
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                                      <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                      </svg>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    src={previewUrls[index]} 
                                    alt={file.name}
                                    className="w-12 h-12 object-cover rounded border border-white/20"
                                  />
                                )}
                                <div>
                                  <p className="text-white text-sm font-medium truncate max-w-48 flex items-center">
                                    {mediaIcon} {file.name}
                                  </p>
                                  <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                                  {mediaType === 'video' && (
                                    <p className="text-lime-400 text-xs">Video - Max 60 seconds (Imgur)</p>
                                  )}
                                  {progressInfo?.message && (
                                    <p className="text-blue-400 text-xs">{progressInfo.message}</p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {progressInfo && (
                                  <div className="text-xs">
                                    {progressInfo.status === 'uploading' && (
                                      <span className="text-yellow-400 flex items-center">
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400 mr-1"></div>
                                        {progressInfo.progress}%
                                      </span>
                                    )}
                                    {progressInfo.status === 'success' && (
                                      <span className="text-green-400 flex items-center">
                                        <span className="mr-1">✓</span>
                                        Uploaded
                                      </span>
                                    )}
                                    {progressInfo.status === 'error' && (
                                      <span 
                                        className="text-red-400 flex items-center cursor-help" 
                                        title={progressInfo.error}
                                      >
                                        <span className="mr-1">✗</span>
                                        Failed
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => removeSelectedFile(index)}
                                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
                                  disabled={uploadingMedia}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* File Input / Drop Zone */}
                  {canAddMoreMedia && (
                    <div 
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
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
                        id="media-upload"
                        multiple
                        accept="image/*,video/*"
                        onChange={handleMediaSelect}
                        className="hidden"
                      />
                      <label htmlFor="media-upload" className="cursor-pointer block">
                        <div className="text-5xl mb-4">
                          {dragActive ? '📥' : totalMedia === 0 ? '📱' : '📸'}
                        </div>
                        <p className="text-white font-medium mb-2 text-lg">
                          {dragActive 
                            ? 'Drop files here' 
                            : totalMedia === 0 
                              ? 'Add up to 2 images or videos to enhance your post'
                              : `Add ${remainingSlots} more file${remainingSlots !== 1 ? 's' : ''}`
                          }
                        </p>
                        <p className="text-gray-400 text-sm mb-4">
                          {SUPPORTED_FORMATS.join(', ')} • Images: Max 10MB • Videos: Max 200MB, 60s duration (Imgur)
                        </p>
                        <div className="inline-flex items-center bg-lime-500/20 border border-lime-400/40 rounded-lg px-4 py-2 text-lime-300 text-sm">
                          <span className="mr-2">⚡</span>
                          {remainingSlots} more file{remainingSlots !== 1 ? 's' : ''} allowed
                        </div>
                      </label>
                    </div>
                  )}
                  
                  <p className="text-gray-400 text-sm mt-3 flex items-center">
                    <span className="text-blue-400 mr-2">ℹ️</span>
                    All media will be uploaded to Imgur and displayed with your post. Videos are limited to 60 seconds for optimal community performance!
                  </p>
                </div>

                {/* Community Guidelines */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
                  <h3 className="text-blue-300 font-bold text-lg mb-4">📋 Community Guidelines</h3>
                  <ul className="text-gray-300 space-y-2 text-sm">
                    <li>• <strong>Be helpful:</strong> Share knowledge that benefits others</li>
                    <li>• <strong>Stay professional:</strong> Keep content appropriate and respectful</li>
                    <li>• <strong>No spam:</strong> Avoid promotional or repetitive content</li>
                    <li>• <strong>Quality media:</strong> Use up to 2 relevant images or videos (60s max) that add value</li>
                    <li>• <strong>Tag responsibly:</strong> Only mention users when it adds value to the discussion</li>
                    <li>• <strong>Share valuable links:</strong> Include helpful resources and references when relevant</li>
                    <li>• <strong>Video best practices:</strong> Keep videos short, clear, and relevant to your content</li>
                    <li>• <strong>Quality over quantity:</strong> Well-written posts build stronger communities</li>
                    <li>• <strong>Be authentic:</strong> Share genuine experiences and insights</li>
                  </ul>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-8">
                  <div className="flex gap-4 justify-center">
                    <button
                      type="button"
                      onClick={() => handleNavigation('/community')}
                      className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 border border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.title.trim() || !formData.content.trim() || selectedFiles.length > 0}
                      className="group relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-12 py-4 rounded-full font-black text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                      <span className="relative flex items-center">
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                            Publishing Post...
                          </>
                        ) : selectedFiles.length > 0 ? (
                          <>
                            Upload Media First
                            <span className="ml-4 text-xl">📤</span>
                          </>
                        ) : (
                          <>
                            Publish Post
                            <span className="ml-4 group-hover:translate-x-2 transition-transform text-xl">🚀</span>
                          </>
                        )}
                      </span>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </div>
                  
                  <p className="text-gray-400 text-sm mt-6" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    * Your post will be published instantly. Tagged users will receive notifications, links will be clickable, and media will be displayed via Imgur. 
                    {taggedUsers.length > 0 && (
                      <span className="text-lime-300 font-medium"> {taggedUsers.length} user{taggedUsers.length !== 1 ? 's' : ''} will be notified.</span>
                    )}
                  </p>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mb-8 sm:mb-12">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4 sm:mb-6">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-2 sm:mr-3 md:mr-4 transform hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xl sm:text-2xl md:text-3xl font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  Favored Online
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto md:mx-0"
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                AI-powered career transformation with real projects and badge validation - completely free.
              </p>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-lime-400 mb-4 sm:mb-6"
                  style={{
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Community
                  </Link>
                </li>
                <li>
                  <Link to="/career/contact" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Hire Talents
                  </Link>
                </li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-lime-400 mb-4 sm:mb-6"
                  style={{
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Support & Legal
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/career/support" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Support
                  </Link>
                </li>
                <li>
                  <Link to="/career/about" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/career/terms" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/career/privacy" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-300 text-sm sm:text-base" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                © {new Date().getFullYear()} Favored Online. All rights reserved.
              </p>

              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">🚀</span>
                <span className="text-gray-300 text-sm font-medium"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Transforming Careers with AI
                </span>
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">✨</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }

        /* Video preview styles */
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

        /* Touch-friendly video interactions */
        @media (hover: none) and (pointer: coarse) {
          video {
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
          }
        }

        /* Enhanced upload progress animations */
        @keyframes uploadPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        .upload-progress {
          animation: uploadPulse 2s ease-in-out infinite;
        }

        /* Better mobile responsiveness for form elements */
        @media (max-width: 768px) {
          .form-input {
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          .media-preview {
            max-height: 120px;
          }
          
          .upload-button {
            padding: 12px 16px;
            font-size: 14px;
          }
        }

        /* File upload drag and drop styling */
        .drag-active {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(34, 197, 94, 0.1));
          border-color: rgba(76, 175, 80, 0.8);
          transform: scale(1.02);
        }

        .drag-active::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, transparent 25%, rgba(76, 175, 80, 0.1) 25%, rgba(76, 175, 80, 0.1) 50%, transparent 50%, transparent 75%, rgba(76, 175, 80, 0.1) 75%);
          background-size: 20px 20px;
          animation: dragPattern 0.5s linear infinite;
        }

        @keyframes dragPattern {
          0% { background-position: 0 0; }
          100% { background-position: 20px 20px; }
        }

        /* Success/Error state animations */
        .upload-success {
          animation: successBounce 0.6s ease-out;
        }

        .upload-error {
          animation: errorShake 0.5s ease-out;
        }

        @keyframes successBounce {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Enhanced button hover effects */
        .submit-button:hover {
          box-shadow: 
            0 0 60px rgba(76, 175, 80, 0.6),
            0 25px 50px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .submit-button:active {
          transform: scale(0.98);
        }

        /* Better form focus states */
        .form-input:focus,
        .form-textarea:focus {
          box-shadow: 
            0 0 0 3px rgba(76, 175, 80, 0.2),
            0 0 20px rgba(76, 175, 80, 0.1);
        }

        /* Loading spinner improvements */
        .spinner {
          border-top-color: transparent;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Media gallery responsive grid */
        .media-grid {
          display: grid;
          gap: 1rem;
        }

        .media-grid.single {
          grid-template-columns: 1fr;
          max-width: 400px;
          margin: 0 auto;
        }

        .media-grid.double {
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 640px) {
          .media-grid.double {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
        }

        /* Enhanced accessibility */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Focus indicators for keyboard navigation */
        button:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          outline: 2px solid rgba(76, 175, 80, 0.8);
          outline-offset: 2px;
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-black\\/20 {
            background-color: rgba(0, 0, 0, 0.9);
          }
          
          .border-white\\/20 {
            border-color: rgba(255, 255, 255, 0.8);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
          
          .bg-gradient-to-br {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SubmitPost;
