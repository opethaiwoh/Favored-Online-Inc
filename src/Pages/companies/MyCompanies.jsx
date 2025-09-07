// src/Pages/companies/MyCompanies.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc,
  orderBy
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import NotificationBell from '../../components/NotificationBell';

const MyCompanies = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userCompanies, setUserCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  // Fetch user's companies
  useEffect(() => {
    if (!currentUser) return;

    const memberQuery = query(
      collection(db, 'company_members'),
      where('userEmail', '==', currentUser.email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(memberQuery, async (snapshot) => {
      const membershipData = snapshot.docs.map(doc => doc.data());
      
      // Fetch company details for each membership
      const companyPromises = membershipData.map(async (membership) => {
        try {
          const companyDoc = await getDoc(doc(db, 'companies', membership.companyId));
          if (companyDoc.exists()) {
            return {
              ...companyDoc.data(),
              id: membership.companyId,
              userRole: membership.role,
              joinedAt: membership.joinedAt?.toDate()
            };
          }
        } catch (error) {
          console.error('Error fetching company:', error);
        }
        return null;
      });

      const companies = await Promise.all(companyPromises);
      const validCompanies = companies.filter(company => company !== null);
      
      // Sort companies: admin companies first, then by creation date
      validCompanies.sort((a, b) => {
        if (a.userRole === 'admin' && b.userRole !== 'admin') return -1;
        if (b.userRole === 'admin' && a.userRole !== 'admin') return 1;
        return (b.createdAt?.toDate() || new Date()) - (a.createdAt?.toDate() || new Date());
      });
      
      setUserCompanies(validCompanies);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Check if user is an admin of any companies
  const isCompanyOwner = userCompanies.some(company => company.userRole === 'admin');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading your companies...</p>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
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
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 lg:space-x-10">
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser && (
                <>
                  <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/companies" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Companies
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}
              
              {currentUser ? (
                <div className="flex items-center space-x-2 lg:space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs sm:text-sm text-white font-medium truncate max-w-20 sm:max-w-none" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </div>
                  <NotificationBell />
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
                >
                  <span className="mr-1 sm:mr-2 text-sm sm:text-lg">🚀</span>
                  Get Started
                </button>
              )}
            </nav>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 sm:mt-6 pb-4 sm:pb-6 rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-3 sm:space-y-5 p-4 sm:p-6">
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>
                    <Link to="/companies" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Companies
                    </Link>
                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                {currentUser ? (
                  <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                      )}
                      <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <NotificationBell />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('/login')} 
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm font-bold transition-all flex items-center justify-center shadow-xl"
                  >
                    <span className="mr-2">🚀</span>
                    Get Started
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 animate-pulse">
              <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                   style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                    style={{
                      textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif',
                      letterSpacing: '0.1em'
                    }}>
                🏢 Company Network
              </span>
              <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                   style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                }}>
              My{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                    style={{
                      textShadow: 'none',
                      filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                      animation: 'glow 2s ease-in-out infinite alternate'
                    }}>
                Companies
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed" 
               style={{
                 textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                 fontFamily: '"Inter", sans-serif'
               }}>
              Manage your company memberships and stay connected with the latest updates from companies you follow.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 flex-wrap">
              <Link 
                to="/companies/create" 
                className="inline-flex items-center bg-gradient-to-r from-lime-500 to-green-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-base sm:text-lg"
                style={{
                  boxShadow: '0 0 30px rgba(76, 175, 80, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="mr-2 sm:mr-3 text-xl">🏢</span>
                Create Company Page
                <span className="ml-2 sm:ml-3 text-xl">✨</span>
              </Link>

              <Link 
                to="/companies" 
                className="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-base sm:text-lg"
                style={{
                  boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="mr-2 sm:mr-3 text-xl">🔍</span>
                Browse Companies
                <span className="ml-2 sm:ml-3 text-xl">→</span>
              </Link>

              {/* Current page indicator */}
              <span className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg opacity-60 cursor-default"
                style={{
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="mr-2 sm:mr-3 text-xl">👤</span>
                My Companies
                <span className="ml-2 sm:ml-3 text-xl">⭐</span>
              </span>
            </div>

            <div className="h-1 w-24 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-12"
                 style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
          </section>

          {/* Companies Content */}
          <section>
            {userCompanies.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-12 border border-white/20 max-w-2xl mx-auto">
                  <div className="text-8xl mb-8">🏢</div>
                  <h3 className="text-3xl font-black text-white mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    No Company Memberships Yet
                  </h3>
                  <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                    You haven't joined any companies yet. Explore companies in your industry or create your own company page.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      to="/companies" 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                      style={{
                        boxShadow: '0 0 30px rgba(59, 130, 246, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      Browse Companies
                    </Link>
                    <Link 
                      to="/companies/create" 
                      className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg transform hover:scale-105"
                      style={{
                        boxShadow: '0 0 30px rgba(76, 175, 80, 0.4), 0 15px 30px rgba(0,0,0,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      Create Company Page
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-lime-400 mb-2">{userCompanies.length}</div>
                    <div className="text-gray-300 font-semibold">Total Companies</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-yellow-400 mb-2">
                      {userCompanies.filter(c => c.userRole === 'admin').length}
                    </div>
                    <div className="text-gray-300 font-semibold">Companies I Own</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-blue-400 mb-2">
                      {userCompanies.filter(c => c.userRole === 'member').length}
                    </div>
                    <div className="text-gray-300 font-semibold">Member Of</div>
                  </div>
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                    <div className="text-4xl font-black text-purple-400 mb-2">
                      {userCompanies.reduce((sum, company) => sum + (company.postCount || 0), 0)}
                    </div>
                    <div className="text-gray-300 font-semibold">Total Posts</div>
                  </div>
                </div>

                {/* Enhanced Quick Actions for Company Owners */}
                {isCompanyOwner && (
                  <div className="bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-red-900/20 backdrop-blur-2xl rounded-2xl p-6 border border-purple-500/30 mb-12">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center">
                          <span className="mr-3 text-2xl">👑</span>
                          Company Owner Tools
                        </h3>
                        <p className="text-gray-400">Manage your companies and create engaging content for your audience</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link 
                          to="/companies/create" 
                          className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-center"
                        >
                          🏢 Create New Company
                        </Link>
                        <Link 
                          to="/submit-event" 
                          className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg transform hover:scale-105 text-center"
                        >
                          🎯 Host Company Event
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Companies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {userCompanies.map((company) => (
                    <div 
                      key={company.id} 
                      className="group bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:border-lime-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                      style={{
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                      }}
                    >
                      {/* Company Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl flex items-center justify-center text-black font-bold text-lg transform group-hover:scale-110 transition-transform duration-300">
                            {company.companyName.charAt(0).toUpperCase()}
                          </div>
                          {company.userRole === 'admin' && (
                            <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30 animate-pulse">
                              👑 Owner
                            </span>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-gray-400 text-xs">Members</div>
                          <div className="text-white font-bold">{company.memberCount || 0}</div>
                        </div>
                      </div>
                      
                      {/* Company Content */}
                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-lime-400 transition-colors duration-300">
                          {company.companyName}
                        </h3>
                        {company.industry && (
                          <div className="text-orange-400 text-sm font-medium mb-2">
                            🏭 {company.industry}
                          </div>
                        )}
                        {company.location && (
                          <div className="text-blue-400 text-sm font-medium mb-3">
                            📍 {company.location}
                          </div>
                        )}
                        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
                          {company.description}
                        </p>
                      </div>
                      
                      {/* Company Stats */}
                      <div className="space-y-3 border-t border-gray-700 pt-4 mb-6">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <span className="text-gray-400 flex items-center">
                              📝 <span className="ml-1">{company.postCount || 0} posts</span>
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            📅 Joined {company.joinedAt?.toLocaleDateString() || 'Recently'}
                          </span>
                          {company.createdAt && (
                            <span>
                              Founded {company.createdAt.toDate?.()?.toLocaleDateString() || 'Recently'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3">
                        {/* Main Company Link */}
                        <Link 
                          to={`/companies/${company.id}`}
                          className="block w-full bg-gradient-to-r from-lime-500 to-green-500 text-white text-center px-4 py-3 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                        >
                          View Company →
                        </Link>

                        {/* Owner-specific actions */}
                        {company.userRole === 'admin' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Link 
                              to="/submit-event"
                              className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center px-3 py-2 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all duration-300 text-sm"
                            >
                              🎯 Host Event
                            </Link>
                            <button
                              onClick={() => navigate(`/companies/${company.id}`)}
                              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center px-3 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 text-sm"
                            >
                              📊 Manage
                            </button>
                          </div>
                        )}

                        {/* Company website link */}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-gray-600 hover:bg-gray-700 text-white text-center px-4 py-2 rounded-xl font-semibold transition-all duration-300 text-sm"
                          >
                            🌐 Visit Website
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <span className="text-lime-400 text-xl">🚀</span>
              <span className="text-gray-300 text-sm font-medium" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Connecting Professionals with Leading Companies
              </span>
              <span className="text-lime-400 text-xl">✨</span>
            </div>
            <p className="text-gray-400 text-sm" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              © {new Date().getFullYear()} Favored Online. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default MyCompanies;
