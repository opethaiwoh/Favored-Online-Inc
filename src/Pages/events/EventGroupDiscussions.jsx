// src/components/EventGroupDiscussions.jsx
// Complete Discussion functionality for Event Groups

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  increment,
  getDocs 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const EventGroupDiscussions = ({ eventGroupId, eventGroup, isAdmin, userMembership }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState('discussion');
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts
  useEffect(() => {
    if (!eventGroupId) return;

    const postsQuery = query(
      collection(db, 'event_group_posts'),
      where('eventGroupId', '==', eventGroupId),
      where('status', '==', 'published'),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const postsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      });
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [eventGroupId]);

  // Fetch comments for a specific post
  const fetchComments = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'event_group_comments'),
        where('postId', '==', postId),
        where('status', '==', 'published'),
        orderBy('createdAt', 'asc')
      );

      const commentsSnapshot = await getDocs(commentsQuery);
      const commentsData = commentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate()
        };
      });

      setComments(prev => ({
        ...prev,
        [postId]: commentsData
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Create new post
  const createPost = async (e) => {
    e.preventDefault();
    
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error('Please fill in both title and content');
      return;
    }

    if (!userMembership || userMembership.status !== 'active') {
      toast.error('You must be an active member to post');
      return;
    }

    setSubmitting(true);

    try {
      const postData = {
        eventGroupId,
        eventId: eventGroup.eventId,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        authorRole: userMembership.role || 'member',
        
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        postType: newPostType,
        
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'published',
        isPinned: false,
        isAnnouncement: newPostType === 'announcement',
        
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        
        category: 'general',
        threadLevel: 0,
        tags: [],
        mentionedUsers: [],
        attachments: [],
        links: []
      };

      await addDoc(collection(db, 'event_group_posts'), postData);

      // Update group stats
      await updateDoc(doc(db, 'event_groups', eventGroupId), {
        'stats.totalPosts': increment(1),
        'stats.lastActivity': serverTimestamp()
      });

      // Reset form
      setNewPostTitle('');
      setNewPostContent('');
      setNewPostType('discussion');
      setShowNewPostForm(false);

      toast.success('Post created successfully!');
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Error creating post: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add comment to post
  const addComment = async (postId) => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!userMembership || userMembership.status !== 'active') {
      toast.error('You must be an active member to comment');
      return;
    }

    try {
      const commentData = {
        postId,
        eventGroupId,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName || currentUser.email,
        authorId: currentUser.uid,
        authorPhoto: currentUser.photoURL || null,
        authorRole: userMembership.role || 'member',
        
        content: newComment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'published',
        
        likesCount: 0,
        replyToComment: null,
        threadLevel: 0,
        mentionedUsers: []
      };

      await addDoc(collection(db, 'event_group_comments'), commentData);

      // Update post comment count
      await updateDoc(doc(db, 'event_group_posts', postId), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp()
      });

      // Update group stats
      await updateDoc(doc(db, 'event_groups', eventGroupId), {
        'stats.totalComments': increment(1),
        'stats.lastActivity': serverTimestamp()
      });

      setNewComment('');
      
      // Refresh comments for this post
      fetchComments(postId);

      toast.success('Comment added!');
      
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error adding comment: ' + error.message);
    }
  };

  // Toggle post details
  const togglePostDetails = (post) => {
    if (selectedPost?.id === post.id) {
      setSelectedPost(null);
    } else {
      setSelectedPost(post);
      if (!comments[post.id]) {
        fetchComments(post.id);
      }
    }
  };

  // Pin/unpin post (admin only)
  const togglePinPost = async (postId, currentPinned) => {
    if (!isAdmin) return;
    
    try {
      await updateDoc(doc(db, 'event_group_posts', postId), {
        isPinned: !currentPinned,
        updatedAt: serverTimestamp()
      });
      
      toast.success(currentPinned ? 'Post unpinned' : 'Post pinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Error updating post');
    }
  };

  // Delete post (admin or author only)
  const deletePost = async (postId, authorEmail) => {
    if (!isAdmin && currentUser.email !== authorEmail) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;
    
    try {
      await updateDoc(doc(db, 'event_group_posts', postId), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        deletedBy: currentUser.email
      });
      
      toast.success('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting post');
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'Unknown time';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getPostIcon = (postType) => {
    switch (postType) {
      case 'announcement': return '📢';
      case 'question': return '❓';
      case 'resource': return '📚';
      case 'poll': return '📊';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading discussions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Create New Post Button/Form */}
      {userMembership?.status === 'active' && (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          {!showNewPostForm ? (
            <button
              onClick={() => setShowNewPostForm(true)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center"
            >
              ✍️ Start a Discussion
            </button>
          ) : (
            <form onSubmit={createPost} className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-white">Create New Post</h4>
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Post title..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                  required
                />
                
                <select
                  value={newPostType}
                  onChange={(e) => setNewPostType(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="discussion">💬 Discussion</option>
                  <option value="question">❓ Question</option>
                  <option value="resource">📚 Resource</option>
                  {isAdmin && <option value="announcement">📢 Announcement</option>}
                </select>
              </div>
              
              <textarea
                placeholder="What would you like to discuss?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows="4"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none resize-none"
                required
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewPostForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">💬</div>
          <h4 className="text-lg font-bold text-white mb-2">No discussions yet</h4>
          <p className="text-gray-300">
            {userMembership?.status === 'active' 
              ? "Be the first to start a discussion!"
              : "Discussions will appear here once members start posting."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              
              {/* Post Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {post.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-semibold">{post.authorName}</span>
                        {post.authorRole === 'admin' && (
                          <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded text-xs font-semibold">
                            👑 Admin
                          </span>
                        )}
                        {post.isPinned && (
                          <span className="bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded text-xs font-semibold">
                            📌 Pinned
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatTimeAgo(post.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getPostIcon(post.postType)}</span>
                    {(isAdmin || currentUser.email === post.authorEmail) && (
                      <div className="flex space-x-1">
                        {isAdmin && (
                          <button
                            onClick={() => togglePinPost(post.id, post.isPinned)}
                            className="text-gray-400 hover:text-yellow-400 p-1"
                            title={post.isPinned ? 'Unpin post' : 'Pin post'}
                          >
                            📌
                          </button>
                        )}
                        <button
                          onClick={() => deletePost(post.id, post.authorEmail)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Delete post"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Post Title & Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
                  <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </div>
                </div>
                
                {/* Post Stats & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>👍 {post.likesCount}</span>
                    <span>💬 {post.commentsCount}</span>
                    <span>👁️ {post.viewsCount}</span>
                  </div>
                  
                  <button
                    onClick={() => togglePostDetails(post)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors"
                  >
                    {selectedPost?.id === post.id ? 'Hide Comments' : 'View Comments'}
                  </button>
                </div>
              </div>
              
              {/* Comments Section */}
              {selectedPost?.id === post.id && userMembership?.status === 'active' && (
                <div className="border-t border-white/10 bg-white/3">
                  
                  {/* Add Comment Form */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 flex space-x-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addComment(post.id)}
                          className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                        />
                        <button
                          onClick={() => addComment(post.id)}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Comments List */}
                  <div className="p-4 space-y-3">
                    {comments[post.id]?.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      comments[post.id]?.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {comment.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white/10 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium text-sm">{comment.authorName}</span>
                                {comment.authorRole === 'admin' && (
                                  <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-xs font-semibold">
                                    👑
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs">{formatTimeAgo(comment.createdAt)}</span>
                              </div>
                              <p className="text-gray-200 text-sm">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventGroupDiscussions;
