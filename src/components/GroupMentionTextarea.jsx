// components/GroupMentionTextarea.jsx - For Google Login
import React, { useState, useRef, useEffect } from 'react';
import { 
  getProfessionalDisplayName, 
  getProfessionalInitials, 
  formatUserForMention, 
  getMentionHandle 
} from '../utils/mentionUtils';

export const GroupMentionTextarea = ({ 
  value, 
  onChange, 
  placeholder = "Write something...",
  className = "",
  onMentionSelect,
  groupMembers = [], // Array of group members
  currentUserId,
  ...props 
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const textareaRef = useRef(null);

  // Convert group member to user object format
  const memberToUser = (member) => ({
    uid: member.userId || member.uid,
    email: member.userEmail || member.email,
    displayName: member.userName || member.displayName,
    photoURL: member.photoURL || null,
    profile: member.profile || {}
  });

  // Filter group members based on search query
  const searchGroupMembers = (query) => {
    if (!groupMembers || groupMembers.length === 0) return [];
    
    // Exclude current user from suggestions
    const availableMembers = groupMembers.filter(member => 
      (member.userId || member.uid) !== currentUserId
    );
    
    if (!query || query.trim() === '') {
      return availableMembers.slice(0, 8);
    }

    const searchTerm = query.toLowerCase().trim();
    
    const filtered = availableMembers.filter(member => {
      const user = memberToUser(member);
      const searchableFields = [
        user.displayName?.toLowerCase(),
        user.email?.toLowerCase(),
        user.email?.split('@')[0]?.toLowerCase()
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field && field.includes(searchTerm)
      );
    });

    return filtered.slice(0, 10);
  };

  // Handle text changes and detect @ mentions
  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(?:"([^"]*)"|(\S*))$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1] || mentionMatch[2] || '';
      setMentionQuery(query);
      setMentionStartIndex(mentionMatch.index);
      
      const memberResults = searchGroupMembers(query);
      setSuggestions(memberResults);
      setShowSuggestions(memberResults.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = (member, index = selectedSuggestionIndex) => {
    if (!suggestions[index]) return;
    
    const selectedMember = suggestions[index];
    const selectedUser = memberToUser(selectedMember);
    
    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textareaRef.current.selectionStart);
    
    const mentionText = formatUserForMention(selectedUser);
    const newValue = beforeMention + mentionText + ' ' + afterMention;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    if (onMentionSelect) {
      onMentionSelect(selectedUser);
    }
    
    setTimeout(() => {
      textareaRef.current?.focus();
      const newCursorPosition = beforeMention.length + mentionText.length + 1;
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
      case 'Tab':
        if (suggestions[selectedSuggestionIndex]) {
          e.preventDefault();
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
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
        {...props}
      />
      
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
          style={{
            top: '100%',
            left: 0,
            marginTop: '4px'
          }}
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 px-2 py-1 border-b border-white/10 mb-1 flex items-center justify-between">
              <span>Mention team member</span>
              <span className="text-lime-400">
                {suggestions.length} available
              </span>
            </div>
            {suggestions.map((member, index) => {
              const user = memberToUser(member);
              return (
                <button
                  key={member.id || member.userId || index}
                  onClick={() => selectSuggestion(member, index)}
                  className={`flex items-center space-x-3 w-full px-3 py-3 text-left hover:bg-white/10 rounded-lg transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-lime-500/20 text-lime-300' : 'text-white'
                  }`}
                >
                  {/* Member Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
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
                  
                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {getProfessionalDisplayName(user)}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {member.role === 'admin' ? (
                        <span className="text-yellow-400 flex items-center">
                          👑 <span className="ml-1">Admin</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          👤 <span className="ml-1">Member</span>
                        </span>
                      )}
                      {user.email && (
                        <span className="ml-2">• {user.email}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Mention Preview */}
                  <div className="text-xs text-lime-400 bg-lime-400/10 px-2 py-1 rounded flex-shrink-0">
                    {formatUserForMention(user)}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Helper Text */}
          <div className="px-3 py-2 border-t border-white/10 bg-black/20">
            <div className="text-xs text-gray-400">
              ↑↓ Navigate • Enter/Tab to select • Esc to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupMentionTextarea;
