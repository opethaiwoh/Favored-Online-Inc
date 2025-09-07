// src/Pages/admin/DirectoryAccessManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const DirectoryAccessManager = () => {
  const { currentUser } = useAuth();
  const [accessRequests, setAccessRequests] = useState([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, paid, expired

  // Real-time listener for access requests
  useEffect(() => {
    const accessQuery = query(
      collection(db, 'directory_access'),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(accessQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        requestedAt: doc.data().requestedAt?.toDate(),
        expiryDate: doc.data().expiryDate?.toDate(),
        purchasedAt: doc.data().purchasedAt?.toDate()
      }));
      
      setAccessRequests(requests);
      
      // Filter active subscriptions
      const active = requests.filter(req => 
        req.accessType === 'paid' && 
        req.approved && 
        req.expiryDate && 
        req.expiryDate > new Date()
      );
      setActiveSubscriptions(active);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Approve manual access request
  const approveAccess = async (userEmail, userName) => {
    try {
      await updateDoc(doc(db, 'directory_access', userEmail), {
        approved: true,
        approvedAt: serverTimestamp(),
        approvedBy: currentUser.email,
        status: 'active'
      });

      toast.success(`Access approved for ${userName}`);
    } catch (error) {
      console.error('Error approving access:', error);
      toast.error('Failed to approve access');
    }
  };

  // Deny access request
  const denyAccess = async (userEmail, userName) => {
    try {
      await updateDoc(doc(db, 'directory_access', userEmail), {
        approved: false,
        deniedAt: serverTimestamp(),
        deniedBy: currentUser.email,
        status: 'denied'
      });

      toast.success(`Access denied for ${userName}`);
    } catch (error) {
      console.error('Error denying access:', error);
      toast.error('Failed to deny access');
    }
  };

  // Revoke access
  const revokeAccess = async (userEmail, userName) => {
    try {
      await updateDoc(doc(db, 'directory_access', userEmail), {
        approved: false,
        revokedAt: serverTimestamp(),
        revokedBy: currentUser.email,
        status: 'revoked'
      });

      toast.success(`Access revoked for ${userName}`);
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
  };

  // Delete access record
  const deleteAccess = async (userEmail, userName) => {
    if (!window.confirm(`Are you sure you want to delete access record for ${userName}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'directory_access', userEmail));
      toast.success(`Access record deleted for ${userName}`);
    } catch (error) {
      console.error('Error deleting access:', error);
      toast.error('Failed to delete access record');
    }
  };

  // Filter requests based on selected filter
  const filteredRequests = accessRequests.filter(request => {
    switch (filter) {
      case 'pending':
        return request.accessType === 'manual_approval' && !request.approved && request.status !== 'denied';
      case 'approved':
        return request.approved && request.status === 'active';
      case 'paid':
        return request.accessType === 'paid' && request.approved;
      case 'expired':
        return request.accessType === 'paid' && request.expiryDate && request.expiryDate < new Date();
      case 'denied':
        return request.status === 'denied' || request.status === 'revoked';
      default:
        return true;
    }
  });

  const getStatusBadge = (request) => {
    if (request.accessType === 'paid' && request.approved && request.expiryDate > new Date()) {
      return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">Active Paid</span>;
    }
    if (request.accessType === 'paid' && request.expiryDate && request.expiryDate < new Date()) {
      return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">Expired</span>;
    }
    if (request.accessType === 'manual_approval' && request.approved) {
      return <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">Manually Approved</span>;
    }
    if (request.status === 'denied' || request.status === 'revoked') {
      return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">Denied</span>;
    }
    if (request.accessType === 'manual_approval' && !request.approved) {
      return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">Pending Approval</span>;
    }
    return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">Unknown</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading directory access data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Directory Access Manager</h1>
          <p className="text-gray-400">Manage user access to the Members Directory</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-lime-400">{accessRequests.length}</div>
            <div className="text-gray-400 text-sm">Total Requests</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">
              {accessRequests.filter(r => r.accessType === 'manual_approval' && !r.approved && r.status !== 'denied').length}
            </div>
            <div className="text-gray-400 text-sm">Pending Approval</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{activeSubscriptions.length}</div>
            <div className="text-gray-400 text-sm">Active Subscriptions</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              ${(activeSubscriptions.length * 29.99).toFixed(2)}
            </div>
            <div className="text-gray-400 text-sm">Monthly Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Requests' },
              { key: 'pending', label: 'Pending Approval' },
              { key: 'approved', label: 'Approved' },
              { key: 'paid', label: 'Paid Subscriptions' },
              { key: 'expired', label: 'Expired' },
              { key: 'denied', label: 'Denied/Revoked' }
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                  filter === filterOption.key
                    ? 'bg-lime-500 text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="text-left p-4 font-semibold text-gray-300">User</th>
                  <th className="text-left p-4 font-semibold text-gray-300">Type</th>
                  <th className="text-left p-4 font-semibold text-gray-300">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-300">Requested</th>
                  <th className="text-left p-4 font-semibold text-gray-300">Expires</th>
                  <th className="text-left p-4 font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request, index) => (
                  <tr key={request.id} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}>
                    <td className="p-4">
                      <div className="flex items-center">
                        {request.userPhoto ? (
                          <img 
                            src={request.userPhoto} 
                            alt={request.userName}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center mr-3">
                            <span className="text-black font-bold">
                              {request.userName?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{request.userName || 'Unknown'}</div>
                          <div className="text-gray-400 text-sm font-mono">{request.userEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.accessType === 'paid' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {request.accessType === 'paid' ? 'Paid' : 'Manual Approval'}
                      </span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(request)}
                    </td>
                    <td className="p-4 text-gray-300 text-sm">
                      {request.requestedAt?.toLocaleDateString()} <br />
                      <span className="text-gray-500">{request.requestedAt?.toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4 text-gray-300 text-sm">
                      {request.expiryDate ? (
                        <>
                          {request.expiryDate.toLocaleDateString()} <br />
                          <span className={request.expiryDate < new Date() ? 'text-red-400' : 'text-green-400'}>
                            {request.expiryDate < new Date() ? 'Expired' : 'Active'}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        {request.accessType === 'manual_approval' && !request.approved && request.status !== 'denied' && (
                          <>
                            <button
                              onClick={() => approveAccess(request.userEmail, request.userName)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => denyAccess(request.userEmail, request.userName)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                            >
                              Deny
                            </button>
                          </>
                        )}
                        
                        {request.approved && request.status === 'active' && (
                          <button
                            onClick={() => revokeAccess(request.userEmail, request.userName)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteAccess(request.userEmail, request.userName)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No requests found for the selected filter</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryAccessManager;
