// src/components/DirectoryAccessControl.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import MembersDirectory from '../Pages/MembersDirectory';

const DirectoryAccessControl = () => {
  const { currentUser } = useAuth();
  const [accessStatus, setAccessStatus] = useState('loading');
  const [userAccess, setUserAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check user access permissions
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setAccessStatus('unauthorized');
        setLoading(false);
        return;
      }

      try {
        // Check if user has directory access
        const accessDoc = await getDoc(doc(db, 'directory_access', currentUser.email));
        
        if (accessDoc.exists()) {
          const accessData = accessDoc.data();
          const now = new Date();
          
          // Check if access is still valid
          if (accessData.accessType === 'manual_approval' && accessData.approved) {
            setAccessStatus('granted');
            setUserAccess(accessData);
          } else if (accessData.accessType === 'paid' && accessData.expiryDate?.toDate() > now) {
            setAccessStatus('granted');
            setUserAccess(accessData);
          } else if (accessData.accessType === 'paid' && accessData.expiryDate?.toDate() <= now) {
            setAccessStatus('expired');
            setUserAccess(accessData);
          } else if (accessData.accessType === 'manual_approval' && !accessData.approved) {
            setAccessStatus('pending');
            setUserAccess(accessData);
          } else {
            setAccessStatus('denied');
            setUserAccess(accessData);
          }
        } else {
          // No access record exists
          setAccessStatus('no_access');
        }
      } catch (error) {
        console.error('Error checking directory access:', error);
        setAccessStatus('error');
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [currentUser]);

  // Request manual approval
  const requestManualApproval = async () => {
    try {
      // Create access request
      await setDoc(doc(db, 'directory_access', currentUser.email), {
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Unknown',
        userPhoto: currentUser.photoURL || null,
        accessType: 'manual_approval',
        approved: false,
        requestedAt: serverTimestamp(),
        status: 'pending'
      });

      // Create admin notification
      await addDoc(collection(db, 'admin_notifications'), {
        type: 'directory_access_request',
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Unknown',
        message: `${currentUser.displayName || currentUser.email} has requested access to the Members Directory`,
        createdAt: serverTimestamp(),
        read: false
      });

      setAccessStatus('pending');
      toast.success('Access request submitted! We\'ll review your request within 24 hours.');
    } catch (error) {
      console.error('Error requesting access:', error);
      toast.error('Failed to submit access request. Please try again.');
    }
  };

  // Initialize payment process
  const initializePayment = async () => {
    try {
      // Create pending payment record
      await setDoc(doc(db, 'directory_access', currentUser.email), {
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Unknown',
        userPhoto: currentUser.photoURL || null,
        accessType: 'paid',
        approved: false,
        paymentStatus: 'pending',
        requestedAt: serverTimestamp(),
        status: 'payment_pending'
      });

      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error initializing payment:', error);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  // Simulate payment completion (integrate with Stripe)
  const completePayment = async () => {
    try {
      const now = new Date();
      const expiryDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now

      // Update access record with payment completion
      await setDoc(doc(db, 'directory_access', currentUser.email), {
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Unknown',
        userPhoto: currentUser.photoURL || null,
        accessType: 'paid',
        approved: true,
        paymentStatus: 'completed',
        purchasedAt: serverTimestamp(),
        expiryDate: expiryDate,
        status: 'active'
      });

      // Create payment record
      await addDoc(collection(db, 'payments'), {
        userEmail: currentUser.email,
        amount: 29.99, // Monthly fee
        currency: 'USD',
        purpose: 'directory_access',
        paymentMethod: 'stripe', // Replace with actual payment method
        status: 'completed',
        createdAt: serverTimestamp()
      });

      setAccessStatus('granted');
      setShowPaymentModal(false);
      toast.success('Payment successful! You now have access to the Members Directory.');
    } catch (error) {
      console.error('Error completing payment:', error);
      toast.error('Payment processing failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('/Images/backg.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div 
          className="fixed inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
          }}
        />
        <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // If user has access, show the Members Directory
  if (accessStatus === 'granted') {
    return <MembersDirectory />;
  }

  // Show access control UI for all other cases
  return (
    <div 
      className="min-h-screen overflow-hidden flex flex-col relative"
      style={{
        backgroundImage: `url('/Images/backg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Animated background overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center group cursor-pointer" onClick={() => window.location.href = '/'}>
              <img 
                src="/Images/512X512.png" 
                alt="Favored Online Logo" 
                className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4 transform group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-lg sm:text-2xl font-black text-white tracking-wide" 
                    style={{
                      textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                Favored Online
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => window.location.href = '/tech-badges'}
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors"
              >
                Badges
              </button>
              <button 
                onClick={() => window.location.href = '/projects'}
                className="text-white/90 hover:text-lime-400 font-semibold transition-colors"
              >
                Projects
              </button>
              {currentUser && (
                <button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="text-white/90 hover:text-lime-400 font-semibold transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
          
          {/* Access Control Content */}
          <div className="text-center">
            
            {/* Hero Section */}
            <div className="mb-12">
              <div className="text-6xl mb-6">🔐</div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-6"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Premium Members Directory
              </h1>
              <p className="text-xl text-gray-200 leading-relaxed mb-8"
                 style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                Access our curated directory of verified tech professionals with proven project experience.
              </p>
            </div>

            {/* Status-specific Content */}
            {accessStatus === 'unauthorized' && (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
                <p className="text-gray-300 mb-6">Please log in to access the Members Directory.</p>
                <button 
                  onClick={() => window.location.href = '/login'}
                  className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                >
                  Login to Continue
                </button>
              </div>
            )}

            {accessStatus === 'no_access' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Request Manual Approval */}
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Request Access</h3>
                  <p className="text-gray-300 mb-6">
                    Submit a request for manual approval. Perfect for verified recruiters and hiring managers.
                  </p>
                  <div className="mb-6">
                    <div className="text-lime-400 text-lg font-semibold">Free</div>
                    <div className="text-gray-400 text-sm">Subject to approval</div>
                  </div>
                  <button 
                    onClick={requestManualApproval}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                  >
                    Request Access
                  </button>
                </div>

                {/* Purchase Monthly Access */}
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-lime-500 to-green-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                      POPULAR
                    </span>
                  </div>
                  <div className="text-4xl mb-4">💳</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Monthly Access</h3>
                  <p className="text-gray-300 mb-6">
                    Get instant access to the complete directory with contact information and advanced filtering.
                  </p>
                  <div className="mb-6">
                    <div className="text-lime-400 text-3xl font-black">$29.99</div>
                    <div className="text-gray-400 text-sm">per month</div>
                  </div>
                  <button 
                    onClick={initializePayment}
                    className="w-full bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                  >
                    Get Instant Access
                  </button>
                </div>
              </div>
            )}

            {accessStatus === 'pending' && (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold text-white mb-4">Request Under Review</h2>
                <p className="text-gray-300 mb-6">
                  Your access request is being reviewed by our team. You'll receive an email notification once approved.
                </p>
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
                  <p className="text-yellow-300 text-sm">
                    <strong>Need immediate access?</strong> Purchase monthly access below for instant activation.
                  </p>
                </div>
                <button 
                  onClick={initializePayment}
                  className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                >
                  Get Instant Access - $29.99/month
                </button>
              </div>
            )}

            {accessStatus === 'expired' && (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🔄</div>
                <h2 className="text-2xl font-bold text-white mb-4">Access Expired</h2>
                <p className="text-gray-300 mb-6">
                  Your monthly access has expired. Renew now to continue accessing the Members Directory.
                </p>
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-red-300 text-sm">
                    <strong>Expired:</strong> {userAccess?.expiryDate?.toDate()?.toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={initializePayment}
                  className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                >
                  Renew Access - $29.99/month
                </button>
              </div>
            )}

            {/* Features Section */}
            <div className="mt-16 bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-8">What's Included</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">📧</div>
                  <h4 className="text-white font-semibold mb-2">Direct Contact</h4>
                  <p className="text-gray-400 text-sm">Email addresses of all verified members</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🔍</div>
                  <h4 className="text-white font-semibold mb-2">Advanced Search</h4>
                  <p className="text-gray-400 text-sm">Filter by skills, badges, and experience</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📊</div>
                  <h4 className="text-white font-semibold mb-2">Verified Profiles</h4>
                  <p className="text-gray-400 text-sm">Badge-verified professionals with proven experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 shadow-2xl max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-2xl font-bold text-white mb-4">Complete Payment</h3>
              <p className="text-gray-300 mb-6">
                Monthly access to the Members Directory
              </p>
              <div className="bg-white/10 rounded-xl p-4 mb-6">
                <div className="text-lime-400 text-2xl font-bold">$29.99</div>
                <div className="text-gray-400 text-sm">per month</div>
              </div>
              
              {/* Payment Form Placeholder */}
              <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
                <p className="text-yellow-300 text-sm mb-4">
                  🔧 <strong>Integration Note:</strong> Replace this with Stripe payment form
                </p>
                <button 
                  onClick={completePayment}
                  className="w-full bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 py-3 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                >
                  Complete Payment (Demo)
                </button>
              </div>
              
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default DirectoryAccessControl;
