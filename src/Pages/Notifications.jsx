// src/Pages/NotificationsPage.jsx - Complete Working Version

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc,
  doc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'mentions', 'replies'
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // Fetch notifications for current user
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
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, navigate]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      setProcessing(true);
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setProcessing(true);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(db, 'notifications', notification.id), {
            isRead: true
          })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      setProcessing(true);
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        setProcessing(true);
        await Promise.all(
          notifications.map(notification =>
            deleteDoc(doc(db, 'notifications', notification.id))
          )
        );
      } catch (error) {
        console.error('Error clearing notifications:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'mentions') return notification.type?.includes('mention');
    if (filter === 'replies') return notification.type?.includes('reply');
    return true; // 'all'
  });

  // Format notification time
  const formatNotificationTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mention':
      case 'post_mention':
      case 'reply_mention':
      case 'repost_mention':
        return '🏷️';
      case 'reply':
        return '💬';
      case 'like':
        return '❤️';
      case 'repost':
        return '🔄';
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

  // Handle notification click - navigate to relevant page
  const handleNotificationClick = async (notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'group_post':
      case 'group_reply':
      case 'group_member_joined':
      case 'group_completed':
        if (notification.groupId) {
          navigate(`/groups/${notification.groupId}`);
        }
        break;
      case 'reply_mention':
      case 'repost_mention':
      case 'like':
        navigate('/community');
        break;
      case 'follow':
        if (notification.mentionedByEmail) {
          navigate(`/profile/${encodeURIComponent(notification.mentionedByEmail)}`);
        } else {
          navigate('/community');
        }
        break;
      case 'badge_awarded':
        navigate('/dashboard');
        break;
      default:
        navigate('/community');
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                to="/community"
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Back to Community"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <p className="text-lime-400 text-sm">
                    {notifications.filter(n => !n.isRead).length} unread notifications
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {notifications.filter(n => !n.isRead).length > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={processing}
                  className="bg-lime-500 hover:bg-lime-600 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Mark all read'}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  disabled={processing}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-black/30 p-2 rounded-lg">
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: notifications.filter(n => !n.isRead).length },
            { key: 'mentions', label: 'Mentions', count: notifications.filter(n => n.type?.includes('mention')).length },
            { key: 'replies', label: 'Replies', count: notifications.filter(n => n.type?.includes('reply')).length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 min-w-0 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-lime-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="truncate">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  filter === tab.key ? 'bg-black/20' : 'bg-white/20'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {filter === 'all' ? 'No notifications yet' : 
               filter === 'unread' ? 'No unread notifications' :
               `No ${filter} notifications`}
            </h3>
            <p className="text-gray-400">
              {filter === 'all' 
                ? "You'll see notifications here when someone interacts with your posts"
                : 'All caught up!'
              }
            </p>
            <Link
              to="/community"
              className="inline-block mt-4 bg-lime-500 hover:bg-lime-600 text-black px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Community
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-black/20 backdrop-blur-xl rounded-xl border transition-all hover:bg-black/30 cursor-pointer group ${
                  notification.isRead 
                    ? 'border-white/10' 
                    : 'border-lime-400/30 bg-lime-500/5'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Notification Icon */}
                    <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <span className="text-xl">
                        {getNotificationIcon(notification.type)}
                      </span>
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {notification.mentionedByPhoto && (
                              <img 
                                src={notification.mentionedByPhoto} 
                                alt="Profile" 
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <p className="text-white font-semibold">
                              {notification.mentionedByFirstName && notification.mentionedByLastName 
                                ? `${notification.mentionedByFirstName} ${notification.mentionedByLastName}`
                                : notification.mentionedByName || 'Someone'
                              }
                            </p>
                          </div>
                          
                          <p className="text-gray-300 mb-2">
                            {notification.message || 
                             `${notification.mentionedByName || 'Someone'} ${
                               notification.type?.includes('mention') ? 'mentioned you' :
                               notification.type?.includes('reply') ? 'replied to your post' :
                               notification.type?.includes('like') ? 'liked your post' :
                               'interacted with your post'
                             }`}
                          </p>
                          
                          {/* Additional Details */}
                          {notification.postTitle && (
                            <p className="text-lime-400 text-sm mb-2 truncate">
                              📝 "{notification.postTitle}"
                            </p>
                          )}
                          
                          {notification.replyContent && (
                            <div className="mt-2 p-3 bg-white/5 rounded-lg border-l-4 border-lime-400">
                              <p className="text-gray-300 text-sm italic">
                                "{notification.replyContent.length > 100 
                                  ? notification.replyContent.substring(0, 100) + '...'
                                  : notification.replyContent}"
                              </p>
                            </div>
                          )}

                          {notification.groupTitle && (
                            <p className="text-blue-400 text-sm">
                              👥 {notification.groupTitle}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-lime-400 hover:text-lime-300 text-sm transition-colors p-1 rounded hover:bg-lime-400/10"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-400/10"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <p className="text-gray-400 text-sm">
                          {formatNotificationTime(notification.createdAt)}
                        </p>
                        
                        <div className="text-gray-400 group-hover:text-lime-400 transition-colors opacity-0 group-hover:opacity-100 flex items-center text-sm">
                          <span className="mr-1">Click to view</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="w-3 h-3 bg-lime-400 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
