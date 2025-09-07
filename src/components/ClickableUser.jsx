// src/components/ClickableUser.jsx - Clickable User Avatar and Name Components
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { showWarningMessage } from '../utils/errorHandler';

/**
 * ClickableUserAvatar Component
 * Renders a clickable user avatar that navigates to the user's profile
 */
export const ClickableUserAvatar = ({ 
  user, 
  size = "md", 
  className = "", 
  showOnlineStatus = false,
  onClick,
  ...props 
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If custom onClick is provided, use it
    if (onClick) {
      onClick(user);
      return;
    }

    // Navigate to user profile
    try {
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

  // Size configurations
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  };

  // Generate initials
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    } else if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      return user.displayName.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center cursor-pointer hover:scale-110 hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-lime-400/50 ${className}`}
      title={`View profile of ${user.displayName || user.firstName + ' ' + user.lastName || user.email?.split('@')[0] || 'user'}`}
      {...props}
    >
      {user.photoURL ? (
        <img 
          src={user.photoURL} 
          alt="Profile" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show initials
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <span className={`text-black font-bold ${textSizeClasses[size]}`}>
          {getInitials()}
        </span>
      )}
      
      {/* Online status indicator */}
      {showOnlineStatus && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      )}
    </button>
  );
};

/**
 * ClickableUserName Component
 * Renders a clickable user name that navigates to the user's profile
 */
export const ClickableUserName = ({ 
  user, 
  className = "", 
  showTitle = true,
  maxLength = null,
  onClick,
  ...props 
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If custom onClick is provided, use it
    if (onClick) {
      onClick(user);
      return;
    }

    // Navigate to user profile
    try {
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

  // Get display name
  const getDisplayName = () => {
    let name = '';
    
    if (user.firstName && user.lastName) {
      name = `${user.firstName} ${user.lastName}`;
    } else if (user.displayName) {
      name = user.displayName;
    } else if (user.email) {
      name = user.email.split('@')[0];
    } else {
      name = 'Unknown User';
    }

    // Truncate if maxLength is specified
    if (maxLength && name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }

    return name;
  };

  // Get user title/role
  const getUserTitle = () => {
    if (user.profile?.title) {
      return user.profile.title;
    } else if (user.role) {
      return user.role;
    }
    return null;
  };

  return (
    <div className="flex flex-col min-w-0">
      <button
        onClick={handleClick}
        className={`text-left cursor-pointer hover:underline focus:outline-none focus:underline transition-colors duration-200 truncate ${className}`}
        title={`View profile of ${getDisplayName()}`}
        {...props}
      >
        {getDisplayName()}
      </button>
      
      {showTitle && getUserTitle() && (
        <span className="text-xs text-lime-400 truncate">
          {getUserTitle()}
        </span>
      )}
    </div>
  );
};

/**
 * ClickableUserCard Component
 * A combination of avatar and name in a card format
 */
export const ClickableUserCard = ({ 
  user, 
  size = "md", 
  className = "",
  showTitle = true,
  showOnlineStatus = false,
  horizontal = true,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If custom onClick is provided, use it
    if (onClick) {
      onClick(user);
      return;
    }

    // Navigate to user profile
    try {
      if (user.email) {
        const encodedEmail = encodeURIComponent(user.email);
        navigate(`/profile/${encodedEmail}`);
      } else if (user.uid) {
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

  return (
    <button
      onClick={handleClick}
      className={`flex ${horizontal ? 'flex-row items-center space-x-3' : 'flex-col items-center space-y-2'} p-2 rounded-lg hover:bg-white/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-lime-400/50 cursor-pointer ${className}`}
    >
      <ClickableUserAvatar 
        user={user}
        size={size}
        showOnlineStatus={showOnlineStatus}
        onClick={(e) => e.stopPropagation()} // Prevent double click
      />
      
      <ClickableUserName
        user={user}
        showTitle={showTitle}
        className="text-white hover:text-lime-300"
        onClick={(e) => e.stopPropagation()} // Prevent double click
      />
    </button>
  );
};

export default { ClickableUserAvatar, ClickableUserName, ClickableUserCard };
