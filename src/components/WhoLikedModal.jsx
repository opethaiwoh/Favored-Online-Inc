// WhoLikedModal.jsx - Component to show who liked a post

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

const WhoLikedModal = ({ isOpen, onClose, postId, userIds = [], postTitle }) => {
  const [likedUsers, setLikedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userIds || userIds.length === 0) {
      setLikedUsers([]);
      return;
    }

    const fetchLikedUsers = async () => {
      setLoading(true);
      try {
        // Split userIds into chunks of 10 (Firestore 'in' query limit)
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 10) {
          chunks.push(userIds.slice(i, i + 10));
        }

        const allUsers = [];
        
        for (const chunk of chunks) {
          if (chunk.length === 0) continue;
          
          const usersQuery = query(
            collection(db, 'users'),
            where('uid', 'in', chunk)
          );
          
          const usersSnapshot = await getDocs(usersQuery);
          const users = usersSnapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
          }));
          
          allUsers.push(...users);
        }

        // Handle users not found in the users collection
        const foundUserIds = allUsers.map(user => user.uid);
        const missingUserIds = userIds.filter(id => !foundUserIds.includes(id));
        
        const missingUsers = missingUserIds.map(id => ({
          uid: id,
          displayName: 'Unknown User',
          email: 'user@example.com',
          photoURL: null
        }));

        setLikedUsers([...allUsers, ...missingUsers]);
      } catch (error) {
        console.error('Error fetching liked users:', error);
        setLikedUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedUsers();
  }, [isOpen, userIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center">
                <span className="text-red-400 mr-2">❤️</span>
                Liked by {userIds.length} {userIds.length === 1 ? 'person' : 'people'}
              </h3>
              {postTitle && (
                <p className="text-gray-400 text-sm mt-1 truncate">
                  "{postTitle}"
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading who liked this post...</p>
            </div>
          ) : likedUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💔</div>
              <p className="text-gray-300">No likes yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {likedUsers.map((user, index) => (
                <div key={user.uid || index} className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg transition-colors">
                  <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-red-400/30 flex-shrink-0">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {user.displayName || user.email || 'Unknown User'}
                    </div>
                    {user.email && user.displayName && (
                      <div className="text-gray-400 text-sm truncate">
                        {user.email}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-red-400 text-sm">
                    ❤️
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhoLikedModal;
