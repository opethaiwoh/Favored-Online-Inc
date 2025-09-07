// components/RepostModal.jsx - Updated for Google Login with Mentions
import React, { useState } from 'react';
import { MentionTextarea } from './MentionTextarea';
import { getUserDisplayText } from '../utils/mentionUtils';

export const RepostModal = ({ isOpen, onClose, post, onRepost, isSubmitting }) => {
  const [repostComment, setRepostComment] = useState('');
  const [taggedUsers, setTaggedUsers] = useState([]);

  const handleMentionSelect = (user) => {
    setTaggedUsers(prev => {
      const exists = prev.find(u => u.uid === user.uid);
      if (!exists) {
        return [...prev, user];
      }
      return prev;
    });
  };

  const handleRepost = () => {
    onRepost({
      originalPost: post,
      comment: repostComment.trim(),
      taggedUsers
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="text-green-400 mr-2">🔄</span>
            Repost
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Repost Comment Input with Mentions */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-3">
              Add your thoughts (optional)
            </label>
            <MentionTextarea
              value={repostComment}
              onChange={setRepostComment}
              onMentionSelect={handleMentionSelect}
              placeholder="What do you think about this post? Use @ to mention someone..."
              className="w-full p-4 bg-black/30 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 resize-none min-h-[100px] transition-colors"
              rows="4"
            />
            
            {/* Show Tagged Users */}
            {taggedUsers.length > 0 && (
              <div className="mt-3 p-3 bg-black/20 border border-white/10 rounded-lg">
                <div className="text-sm text-gray-300 mb-2">People you mentioned:</div>
                <div className="flex flex-wrap gap-2">
                  {taggedUsers.map((user) => (
                    <div key={user.uid} className="flex items-center space-x-2 bg-lime-400/10 rounded-full px-3 py-1">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-xs">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={getUserDisplayText(user)} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>
                            {getUserDisplayText(user).charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-lime-300 text-sm">
                        {getUserDisplayText(user)}
                      </span>
                      <button
                        onClick={() => setTaggedUsers(prev => prev.filter(u => u.uid !== user.uid))}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Original Post Preview */}
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-lime-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {post.authorPhoto ? (
                  <img 
                    src={post.authorPhoto} 
                    alt={post.authorName} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (post.authorName?.charAt(0).toUpperCase() || '👤')
                )}
              </div>
              <div>
                <div className="font-semibold text-white">{post.authorName}</div>
                <div className="text-gray-400 text-sm">
                  {post.createdAt?.toLocaleDateString ? 
                    post.createdAt.toLocaleDateString() : 
                    'Unknown date'
                  }
                </div>
              </div>
            </div>
            
            <h4 className="text-white font-bold mb-2">{post.title}</h4>
            <p className="text-gray-300 text-sm leading-relaxed">
              {post.content?.length > 200 
                ? `${post.content.substring(0, 200)}...` 
                : post.content
              }
            </p>
            
            {post.images && post.images.length > 0 && (
              <div className="mt-3 text-gray-400 text-sm flex items-center">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {post.images.length} image{post.images.length > 1 ? 's' : ''}
              </div>
            )}

            {/* Show original post's tagged users if any */}
            {post.taggedUsers && post.taggedUsers.length > 0 && (
              <div className="mt-3 text-sm">
                <span className="text-gray-400">Originally tagged: </span>
                {post.taggedUsers.map((user, index) => (
                  <span key={user.uid || index} className="text-lime-400/70">
                    @{getUserDisplayText(user)}
                    {index < post.taggedUsers.length - 1 && ', '}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {taggedUsers.length > 0 && (
                <span>Will notify {taggedUsers.length} mentioned user{taggedUsers.length > 1 ? 's' : ''} • </span>
              )}
              This will be shared with your followers
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRepost}
                disabled={isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Reposting...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">🔄</span>
                    Repost{taggedUsers.length > 0 && ` & Notify ${taggedUsers.length}`}
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
