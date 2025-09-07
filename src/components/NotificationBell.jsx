// components/NotificationBell.jsx - COMPLETE FIX FOR VIEW ALL NOTIFICATIONS

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [navigating, setNavigating] = useState(null);

  // Fetch notifications
  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
      }));

      setNotifications(notificationsData);
      setUnreadCount(notificationsData.filter(n => !n.isRead).length);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            isRead: true
          })
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // 🔥 NEW: Handle View All Notifications - FIXED NAVIGATION
  const handleViewAllNotifications = () => {
    setShowDropdown(false); // Close the dropdown first
    navigate('/notifications'); // Navigate to notifications page
  };

  // 🔥 ENHANCED: Handle notification click with navigation
  const handleNotificationClick = async (notification) => {
    try {
      setNavigating(notification.id);

      // Mark notification as read when clicked
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Close the dropdown
      setShowDropdown(false);

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 150));

      // Navigate based on notification type
      switch (notification.type) {
        case 'group_post':
          // Navigate to the specific group
          if (notification.groupId) {
            navigate(`/groups/${notification.groupId}`);
          }
          break;

        case 'group_reply':
          // Navigate to the specific group
          if (notification.groupId) {
            navigate(`/groups/${notification.groupId}`);
          }
          break;

        case 'group_member_joined':
          // Navigate to the group
          if (notification.groupId) {
            navigate(`/groups/${notification.groupId}`);
          }
          break;

        case 'group_completed':
          // Navigate to the completed group
          if (notification.groupId) {
            navigate(`/groups/${notification.groupId}`);
          }
          break;

        case 'reply_mention':
        case 'repost_mention':
        case 'like':
          // Navigate to community posts
          navigate('/community');
          break;

        case 'follow':
          // Navigate to the follower's profile (if you have profile pages)
          if (notification.mentionedByEmail) {
            navigate(`/profile/${encodeURIComponent(notification.mentionedByEmail)}`);
          } else {
            navigate('/community');
          }
          break;

        case 'badge_awarded':
          // Navigate to dashboard to see badges
          navigate('/dashboard');
          break;

        default:
          // Default fallback - go to community
          navigate('/community');
          break;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      // Still close dropdown on error
      setShowDropdown(false);
    } finally {
      setNavigating(null);
    }
  };

  // Format time ago
  const timeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reply_mention':
        return '💬';
      case 'repost_mention':
        return '🔄';
      case 'like':
        return '❤️';
      case 'follow':
        return '👥';
      case 'group_post':
        return '📝';
      case 'group_reply':
        return '💬';
      case 'group_member_joined':
        return '👥';
      case 'badge_awarded':
        return '🏆';
      case 'group_completed':
        return '🎉';
      default:
        return '🔔';
    }
  };

  // Get notification action text
  const getNotificationAction = (type) => {
    switch (type) {
      case 'reply_mention':
        return 'mentioned you in a reply';
      case 'repost_mention':
        return 'mentioned you in a repost';
      case 'like':
        return 'liked your post';
      case 'follow':
        return 'started following you';
      case 'group_post':
        return 'posted in';
      case 'group_reply':
        return 'replied to your post';
      case 'group_member_joined':
        return 'joined';
      case 'badge_awarded':
        return 'awarded you a badge';
      case 'group_completed':
        return 'project completed';
      default:
        return 'sent you a notification';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="relative">
      {/* 🔔 NOTIFICATION BELL BUTTON - Clean Direct Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-white hover:text-lime-400 transition-all duration-300 group"
        title={`${unreadCount} unread notifications`}
      >
        {/* 🔔 CLEAN BELL ICON - Direct display without container */}
        <svg 
          className="w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300 group-hover:scale-110 group-hover:text-lime-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>

        {/* 🔴 NOTIFICATION BADGE - Positioned on top-right of bell */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center animate-pulse shadow-lg border-2 border-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* 🔔 SUBTLE GLOW EFFECT for notifications */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-lime-400/10 animate-pulse"></span>
        )}
      </button>

      {/* 📋 NOTIFICATIONS DROPDOWN - ENHANCED WITH NAVIGATION */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[9999] max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
            <h3 className="text-white font-bold text-sm sm:text-base flex items-center">
              <span className="mr-2">🔔</span>
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors hidden sm:block"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Mark All Read Button */}
          {unreadCount > 0 && (
            <div className="sm:hidden px-3 py-2 border-b border-white/10">
              <button
                onClick={markAllAsRead}
                className="text-lime-400 hover:text-lime-300 text-xs font-medium transition-colors"
              >
                Mark all read
              </button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-60 sm:max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 sm:p-6 text-center">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-lime-400 mx-auto mb-2"></div>
                <p className="text-gray-400 text-xs sm:text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl mb-2">🔔</div>
                <p className="text-gray-400 text-xs sm:text-sm">No notifications yet</p>
                <p className="text-gray-500 text-xs mt-1">You'll see updates about mentions, likes, and replies here</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.slice(0, 20).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 sm:p-4 hover:bg-white/5 cursor-pointer transition-all duration-200 group ${
                      !notification.isRead ? 'bg-lime-400/5 border-l-2 border-lime-400' : ''
                    } ${navigating === notification.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-start space-x-2 sm:space-x-3">
                      {/* Notification Icon */}
                      <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-lime-500/20 rounded-full flex items-center justify-center group-hover:bg-lime-500/30 transition-colors">
                        <span className="text-xs sm:text-sm">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      {/* Notification Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {notification.mentionedByPhoto ? (
                            <img 
                              src={notification.mentionedByPhoto} 
                              alt="Profile" 
                              className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                            />
                          ) : (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {(notification.mentionedByFirstName || notification.mentionedByName || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-white font-medium text-xs sm:text-sm truncate">
                            {notification.mentionedByFirstName && notification.mentionedByLastName 
                              ? `${notification.mentionedByFirstName} ${notification.mentionedByLastName}`
                              : notification.mentionedByName || 'Someone'
                            }
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-lime-400 rounded-full flex-shrink-0"></div>
                          )}
                        </div>

                        <p className="text-gray-300 text-xs sm:text-sm mb-2 line-clamp-2">
                          {getNotificationAction(notification.type)}
                          {notification.groupTitle && (notification.type === 'group_post' || notification.type === 'group_member_joined') && (
                            <span className="text-lime-400 font-medium"> {notification.groupTitle}</span>
                          )}
                          {notification.badgeLevel && notification.type === 'badge_awarded' && (
                            <span className="text-yellow-400 font-medium"> {notification.badgeLevel}</span>
                          )}
                        </p>

                        {/* Preview content */}
                        {(notification.replyContent || notification.repostComment) && (
                          <p className="text-gray-400 text-xs bg-black/20 rounded p-2 mb-2 line-clamp-2">
                            "{notification.replyContent || notification.repostComment}"
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">
                            {timeAgo(notification.createdAt)}
                          </span>
                          
                          {/* Enhanced click indicator */}
                          <div className="flex items-center space-x-2">
                            {notification.postTitle && (
                              <span className="text-lime-400 text-xs truncate max-w-16 sm:max-w-24">
                                "{notification.postTitle}"
                              </span>
                            )}
                            
                            {/* Loading indicator */}
                            {navigating === notification.id ? (
                              <div className="w-3 h-3 border border-lime-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <div className="text-gray-400 group-hover:text-lime-400 transition-colors opacity-0 group-hover:opacity-100 flex items-center text-xs">
                                <span className="hidden sm:inline mr-1">Click to view</span>
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🔥 FIXED FOOTER - Now navigates to notifications page */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 bg-black/20">
              <button
                onClick={handleViewAllNotifications} // ✅ FIXED: Now navigates instead of just closing
                className="w-full text-center text-lime-400 hover:text-lime-300 text-xs sm:text-sm font-medium transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-[9998]" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
