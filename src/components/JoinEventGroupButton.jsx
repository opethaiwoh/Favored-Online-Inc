// components/JoinEventGroupButton.jsx
// 🔥 Component for requesting to join an event group with email notifications

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  requestToJoinEventGroup, 
  getUserEventGroupStatus 
} from '../utils/eventGroupNotifications';

const JoinEventGroupButton = ({ eventGroup, onStatusChange }) => {
  const { currentUser } = useAuth();
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('Attendee');

  const availableRoles = [
    'Attendee',
    'Speaker',
    'Volunteer',
    'Organizer Assistant',
    'Technical Support',
    'Content Creator'
  ];

  // Check user's current status with this event group
  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (!currentUser || !eventGroup.id) return;
      
      try {
        const status = await getUserEventGroupStatus(eventGroup.id, currentUser.email);
        setMembershipStatus(status);
      } catch (error) {
        console.error('Error checking membership status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkMembershipStatus();
  }, [currentUser, eventGroup.id]);

  const handleJoinRequest = async () => {
    if (!currentUser) {
      toast.error('Please login to join this event group');
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestToJoinEventGroup(
        eventGroup.id,
        currentUser,
        selectedRole,
        applicationMessage
      );

      if (result.success) {
        setMembershipStatus('pending');
        setShowApplicationModal(false);
        setApplicationMessage('');
        
        // Notify parent component of status change
        if (onStatusChange) {
          onStatusChange('pending');
        }
        
        toast.success('🎉 Join request submitted! Group admins will review your application.');
      } else {
        if (result.reason === 'already_member') {
          setMembershipStatus('active');
        } else if (result.reason === 'already_pending') {
          setMembershipStatus('pending');
        }
      }
    } catch (error) {
      console.error('Error submitting join request:', error);
      toast.error('Failed to submit join request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusButton = () => {
    if (loading) {
      return (
        <button 
          disabled 
          className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 opacity-50 cursor-not-allowed"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Checking...</span>
        </button>
      );
    }

    switch (membershipStatus) {
      case 'active':
        return (
          <button 
            disabled 
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 cursor-not-allowed"
          >
            <span>✅</span>
            <span>Group Member</span>
          </button>
        );

      case 'pending':
        return (
          <button 
            disabled 
            className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 cursor-not-allowed"
          >
            <span>⏳</span>
            <span>Request Pending</span>
          </button>
        );

      case 'rejected':
        return (
          <button 
            onClick={() => setShowApplicationModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Reapply to Join</span>
          </button>
        );

      default:
        return (
          <button 
            onClick={() => setShowApplicationModal(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          >
            <span>🎪</span>
            <span>Request to Join Group</span>
          </button>
        );
    }
  };

  return (
    <>
      {getStatusButton()}

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Join Event Group</h3>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-cyan-300 mb-2">
                    🎪 {eventGroup.eventTitle || eventGroup.title}
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {eventGroup.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  >
                    {availableRoles.map(role => (
                      <option key={role} value={role} className="bg-gray-800">
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Application Message (Optional)
                  </label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Tell the group admins why you'd like to join and what you hope to contribute..."
                    rows="4"
                    className="w-full p-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 resize-none"
                  />
                  <p className="text-gray-400 text-xs mt-1">
                    This helps group admins understand your interest and goals.
                  </p>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <h5 className="text-cyan-300 font-semibold mb-2">📧 What happens next?</h5>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• Group admins will receive an email notification</li>
                    <li>• They'll review your application and message</li>
                    <li>• You'll get notified once they make a decision</li>
                    <li>• If approved, you'll gain access to group features</li>
                  </ul>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowApplicationModal(false)}
                    className="flex-1 px-4 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinRequest}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transform hover:scale-105"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JoinEventGroupButton;
