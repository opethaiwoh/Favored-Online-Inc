// components/TaggedUsers.jsx - Updated for Professional Names (firstName/lastName)
import React from 'react';

export const TaggedUsers = ({ taggedUsers = [] }) => {
  if (!taggedUsers.length) return null;
  
  // Helper function to get professional display name
  const getProfessionalDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.displayName || 'Professional User';
  };

  // Helper function to get professional initials
  const getProfessionalInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return user.initials || user.displayName?.charAt(0)?.toUpperCase() || 'U';
  };

  // Helper function to get mention handle (for @username display)
  const getMentionHandle = (user) => {
    // Use firstName + lastName for handle if available, otherwise fall back to displayName or email
    if (user.firstName && user.lastName) {
      return `${user.firstName}${user.lastName}`.replace(/\s+/g, ''); // Remove spaces
    }
    return user.displayName || user.email?.split('@')[0] || 'user';
  };
  
  return (
    <div className="flex items-center space-x-2 mt-3 text-sm">
      <span className="text-gray-400">Tagged:</span>
      <div className="flex items-center space-x-2 flex-wrap">
        {taggedUsers.map((user, index) => (
          <div key={user.uid || index} className="flex items-center">
            <div className="flex items-center space-x-1 bg-lime-400/10 hover:bg-lime-400/20 rounded-full px-2 py-1 transition-colors group cursor-pointer">
              {/* User Avatar with Professional Initials */}
              <div className="w-4 h-4 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-xs">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={getProfessionalDisplayName(user)} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {getProfessionalInitials(user)}
                  </span>
                )}
              </div>
              
              {/* Professional Display Name with @ handle */}
              <span className="text-lime-400 hover:text-lime-300 transition-colors text-sm">
                @{getMentionHandle(user)}
              </span>
            </div>
            
            {/* Comma separator */}
            {index < taggedUsers.length - 1 && (
              <span className="text-gray-400 ml-1">,</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
