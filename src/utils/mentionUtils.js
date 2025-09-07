// utils/mentionUtils.js - Updated for Professional Names (Clean Version)
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';

// Helper function to get professional display name
export const getProfessionalDisplayName = (user) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.displayName || 'Professional User';
};

// Helper function to get professional initials
export const getProfessionalInitials = (user) => {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
  return user.initials || user.displayName?.charAt(0)?.toUpperCase() || 'U';
};

// Helper function to get mention handle (for @username display)
export const getMentionHandle = (user) => {
  // Use firstName + lastName for handle if available, otherwise fall back to displayName or email
  if (user.firstName && user.lastName) {
    return `${user.firstName}${user.lastName}`.replace(/\s+/g, ''); // Remove spaces
  }
  return user.displayName?.replace(/\s+/g, '') || user.email?.split('@')[0] || 'user';
};

// Format user for mention in text
export const formatUserForMention = (user) => {
  const handle = getMentionHandle(user);
  // If the handle contains spaces or special characters, wrap in quotes
  if (handle.includes(' ') || /[^a-zA-Z0-9_]/.test(handle)) {
    return `@"${handle}"`;
  }
  return `@${handle}`;
};

// Search users function - searches by professional names and email
export const searchUsers = async (query) => {
  try {
    if (!query || query.trim() === '') {
      // Return recent users or popular users when no query
      const recentUsersQuery = query(
        collection(db, 'users'),
        orderBy('lastActive', 'desc'),
        limit(5)
      );
      const snapshot = await getDocs(recentUsersQuery);
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
    }

    const searchTerm = query.toLowerCase().trim();
    const users = [];
    
    // Search by firstName
    const firstNameQuery = query(
      collection(db, 'users'),
      where('firstName', '>=', searchTerm),
      where('firstName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    // Search by lastName  
    const lastNameQuery = query(
      collection(db, 'users'),
      where('lastName', '>=', searchTerm),
      where('lastName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    // Search by displayName
    const displayNameQuery = query(
      collection(db, 'users'),
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    // Search by email
    const emailQuery = query(
      collection(db, 'users'),
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );

    // Execute all queries
    const [firstNameSnapshot, lastNameSnapshot, displayNameSnapshot, emailSnapshot] = await Promise.all([
      getDocs(firstNameQuery),
      getDocs(lastNameQuery), 
      getDocs(displayNameQuery),
      getDocs(emailQuery)
    ]);

    // Combine results and remove duplicates
    const userMap = new Map();
    
    [firstNameSnapshot, lastNameSnapshot, displayNameSnapshot, emailSnapshot].forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        const userData = { uid: doc.id, ...doc.data() };
        userMap.set(doc.id, userData);
      });
    });

    return Array.from(userMap.values()).slice(0, 10);
    
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Extract mentions from text
export const extractMentions = (text) => {
  if (!text) return [];
  
  // Match both quoted and unquoted mentions: @username or @"display name"
  const mentionRegex = /@(?:"([^"]+)"|(\w+))/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionText = match[1] || match[2]; // Quoted or unquoted
    mentions.push(mentionText);
  }
  
  return mentions;
};

// Validate mentions against actual users
export const validateMentions = async (text, taggedUsers = []) => {
  const mentions = extractMentions(text);
  const validMentions = [];
  
  for (const mention of mentions) {
    const user = taggedUsers.find(user => 
      getMentionHandle(user) === mention ||
      getProfessionalDisplayName(user) === mention
    );
    
    if (user) {
      validMentions.push(user);
    }
  }
  
  return validMentions;
};

// Format mentions for display with professional names
export const formatMentions = (text, taggedUsers = []) => {
  if (!text || !taggedUsers.length) return text;
  
  let formattedText = text;
  
  taggedUsers.forEach(user => {
    const handle = getMentionHandle(user);
    const displayName = getProfessionalDisplayName(user);
    
    // Replace both quoted and unquoted mentions
    const quotedPattern = new RegExp(`@"${handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'gi');
    const unquotedPattern = new RegExp(`@${handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    
    const replacement = `<span class="text-lime-400 hover:text-lime-300 cursor-pointer font-medium" title="${displayName}">@${handle}</span>`;
    
    formattedText = formattedText.replace(quotedPattern, replacement);
    formattedText = formattedText.replace(unquotedPattern, replacement);
  });
  
  return formattedText;
};

// Legacy function for backward compatibility
export const getUserDisplayText = (user) => {
  return getProfessionalDisplayName(user);
};
