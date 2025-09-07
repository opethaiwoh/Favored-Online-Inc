// src/Pages/companies/CompanyList.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';
import { safeFirestoreOperation } from '../../utils/errorHandler';
import NotificationBell from '../../components/NotificationBell';

const CompanyList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [userMemberships, setUserMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [joiningCompany, setJoiningCompany] = useState(null);

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

  // Fetch companies
  useEffect(() => {
    const companiesQuery = query(
      collection(db, 'companies'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(companiesQuery, (snapshot) => {
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));
      
      setCompanies(companiesData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Fetch user memberships
  useEffect(() => {
    if (!currentUser) return;

    const membershipQuery = query(
      collection(db, 'company_members'),
      where('userEmail', '==', currentUser.email),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(membershipQuery, (snapshot) => {
      const memberships = snapshot.docs.map(doc => doc.data().companyId);
      setUserMemberships(memberships);
    });

    return unsubscribe;
  }, [currentUser]);

  // Handle joining company
  const handleJoinCompany = async (companyId, companyName) => {
    if (!currentUser) {
      toast.warning('You must be logged in to join companies');
      return;
    }

    setJoiningCompany(companyId);

    try {
      await safeFirestoreOperation(async () => {
        const membershipData = {
          companyId: companyId,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email,
          userPhoto: currentUser.photoURL || null,
          role: 'member',
          status: 'active',
          joinedAt: serverTimestamp()
        };

        await addDoc(collection(db, 'company_members'), membershipData);
      }, 'joining company');

      toast.success(`Successfully joined ${companyName}!`);
    } catch (error) {
      console.error('Error joining company:', error);
    } finally {
      setJoiningCompany(null);
    }
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !industryFilter || company.industry === industryFilter;
    return matchesSearch && matchesIndustry;
  });

  // Get unique industries for filter
  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];

  const isUserMember = (companyId) => userMemberships.includes(companyId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base">Loading companies...</p>
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
      {/* Background overlay */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

      {/* Enhanced Responsive Header */}
      <header className="fixed top-0 left-0 right-0 z-[100]" 
              style={{background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 50%, transparent 100%)'}}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3 lg:py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center group">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 mr-2 sm:mr-3 transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-black text-white tracking-wide" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  <span className="hidden sm:inline">Favored Online</span>
                  <span className="sm:hidden">Favored</span>
                </span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-4 xl:space-x-8">
              <Link 
                to={currentUser ? "/community" : "/"} 
                className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
              >
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser ? (
                <>
                  <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/my-groups" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    My Groups
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  
                  <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              ) : (
                <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm xl:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              {/* User Authentication Section */}
              {currentUser ? (
                <div className="flex items-center space-x-2 xl:space-x-4">
                  <div className="flex items-center bg-black/30 backdrop-blur-sm rounded-full px-2 xl:px-4 py-1 xl:py-2 border border-white/20">
                    {currentUser.photoURL && (
                      <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 xl:w-8 xl:h-8 rounded-full mr-2 xl:mr-3 ring-2 ring-lime-400/50" />
                    )}
                    <span className="text-xs xl:text-sm text-white font-medium truncate max-w-20 xl:max-w-none" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      {currentUser.firstName && currentUser.lastName 
                        ? `${currentUser.firstName} ${currentUser.lastName}`
                        : currentUser.displayName || currentUser.email
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <NotificationBell />
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')} 
                  className="bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white px-4 xl:px-8 py-2 xl:py-3 rounded-full text-xs xl:text-sm font-bold transition-all duration-300 transform hover:scale-105 flex items-center shadow-2xl hover:shadow-lime-500/25"
                >
                  <span className="mr-1 xl:mr-2 text-sm xl:text-lg">🚀</span>
                  Get Started
                </button>
              )}
            </nav>
            
            {/* Mobile/Tablet Menu Button */}
            <div className="lg:hidden flex items-center space-x-2 sm:space-x-3">
              {currentUser && (
                <div className="flex items-center">
                  <NotificationBell />
                </div>
              )}
              
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
                className="text-white hover:text-lime-400 focus:outline-none p-2 rounded-lg bg-black/30 backdrop-blur-sm border border-white/20 transition-all duration-300"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Enhanced Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-3 sm:mt-4 pb-3 sm:pb-4 rounded-2xl" 
                 style={{background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
              <div className="flex flex-col space-y-2 sm:space-y-3 p-3 sm:p-4">
                
                <Link 
                  to={currentUser ? "/community" : "/"} 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-base py-2" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                
                {currentUser ? (
                  <>
                    <Link to="/career/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-base py-2" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Career
                    </Link>

                    <Link to="/my-groups" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-base py-2" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      My Groups
                    </Link>

                    <Link to="/dashboard" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-base py-2" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <Link to="/career" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-sm sm:text-base py-2" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                {currentUser ? (
                  <div className="flex flex-col space-y-3 pt-3 border-t border-white/20">
                    <div className="flex items-center bg-black/40 rounded-full px-3 py-2 sm:py-3">
                      {currentUser.photoURL && (
                        <img src={currentUser.photoURL} alt="Profile" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-3 ring-2 ring-lime-400/50" />
                      )}
                      <span className="text-sm sm:text-base text-white font-medium truncate">
                        {currentUser.firstName && currentUser.lastName 
                          ? `${currentUser.firstName} ${currentUser.lastName}`
                          : currentUser.displayName || currentUser.email
                        }
                      </span>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }} 
                    className="bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all flex items-center justify-center shadow-xl mt-4"
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
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 lg:pt-28">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 max-w-7xl">
          
          {/* Responsive Hero Section */}
          <section className="relative mb-8 sm:mb-12 md:mb-16 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6 leading-tight text-white">
              Company Directory
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-4">
              Connect with leading companies in the tech industry. Join company pages to stay updated.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
              <Link 
                to="/companies/create" 
                className="w-full sm:w-auto bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all text-sm sm:text-base"
              >
                🏢 <span className="hidden xs:inline">Create Company Page</span><span className="xs:hidden">Create Company</span>
              </Link>
              <Link 
                to="/my-companies" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all text-sm sm:text-base"
              >
                👤 My Companies
              </Link>
            </div>
          </section>

          {/* Responsive Search and Filter */}
          <section className="mb-8 sm:mb-12">
            <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Search Companies</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none transition-colors"
                    placeholder="Search by company name or description..."
                  />
                </div>
                <div>
                  <label className="block text-lime-300 font-semibold mb-2 text-sm sm:text-base">Industry</label>
                  <select
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white focus:border-lime-400 focus:outline-none transition-colors"
                  >
                    <option value="">All Industries</option>
                    {industries.map(industry => (
                      <option key={industry} value={industry} className="bg-gray-800">{industry}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Responsive Companies Grid */}
          <section>
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 sm:py-12 md:py-16">
                <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 md:p-12 border border-white/20 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
                  <div className="text-4xl sm:text-6xl md:text-8xl mb-4 sm:mb-6 md:mb-8">🏢</div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4 sm:mb-6">No Companies Found</h3>
                  <Link 
                    to="/companies/create" 
                    className="inline-block bg-gradient-to-r from-lime-500 to-green-500 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all text-sm sm:text-base"
                  >
                    Create Company Page
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {filteredCompanies.map((company) => (
                  <div 
                    key={company.id} 
                    className="bg-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 border border-white/20 hover:border-lime-400/50 transition-all transform hover:scale-105 flex flex-col h-full"
                  >
                    {/* Company Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-lime-500 to-green-500 rounded-xl flex items-center justify-center text-black font-bold text-sm sm:text-base md:text-lg flex-shrink-0">
                          {company.companyName.charAt(0).toUpperCase()}
                        </div>
                        {company.isVerified && (
                          <span className="bg-blue-500/20 text-blue-400 px-2 sm:px-3 py-1 rounded-full text-xs font-bold border border-blue-500/30 whitespace-nowrap">
                            ✓ <span className="hidden sm:inline">Verified</span>
                          </span>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-gray-400 text-xs">Members</div>
                        <div className="text-white font-bold text-sm sm:text-base">{company.memberCount || 0}</div>
                      </div>
                    </div>
                    
                    {/* Company Content */}
                    <div className="mb-4 sm:mb-6 flex-grow">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 hover:text-lime-400 transition-colors line-clamp-2">
                        {company.companyName}
                      </h3>
                      {company.industry && (
                        <div className="text-orange-400 text-xs sm:text-sm font-medium mb-2">
                          🏭 {company.industry}
                        </div>
                      )}
                      {company.location && (
                        <div className="text-blue-400 text-xs sm:text-sm font-medium mb-2 sm:mb-3">
                          📍 {company.location}
                        </div>
                      )}
                      <p className="text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-3">
                        {company.description}
                      </p>
                    </div>
                    
                    {/* Company Stats */}
                    <div className="space-y-2 sm:space-y-3 border-t border-gray-700 pt-3 sm:pt-4 mb-4 sm:mb-6">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-gray-400">Founded</span>
                        <span className="text-white">{company.foundedYear || 'N/A'}</span>
                      </div>
                      {company.website && (
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Website</span>
                          <a 
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lime-400 hover:text-lime-300 transition-colors"
                          >
                            Visit →
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 mt-auto">
                      <Link 
                        to={`/companies/${company.id}`}
                        className="block w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">View Company →</span>
                        <span className="sm:hidden">View →</span>
                      </Link>

                      {isUserMember(company.id) ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 sm:p-3 text-center">
                          <div className="text-green-400 font-semibold text-xs sm:text-sm">✓ Member</div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleJoinCompany(company.id, company.companyName)}
                          disabled={joiningCompany === company.id}
                          className="w-full bg-gradient-to-r from-lime-500 to-green-500 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all disabled:opacity-50 text-xs sm:text-sm"
                        >
                          {joiningCompany === company.id ? (
                            <>
                              <span className="hidden sm:inline">Joining...</span>
                              <span className="sm:hidden">...</span>
                            </>
                          ) : (
                            <>
                              🤝 <span className="hidden sm:inline">Join Company</span><span className="sm:hidden">Join</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default CompanyList;
