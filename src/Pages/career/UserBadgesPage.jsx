// src/Pages/career/UserBadgesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const UserBadgesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userBadges, setUserBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // FIXED: Added missing state

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

  // Badge categories mapping
  const badgeCategories = {
    'mentorship': { 
      id: 'techmo', 
      name: 'TechMO Badges', 
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-500/10 to-yellow-600/10',
      borderColor: 'border-yellow-500/30',
      image: '/Images/TechMO.png'
    },
    'quality-assurance': { 
      id: 'techqa', 
      name: 'TechQA Badges', 
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-500/10 to-blue-600/10',
      borderColor: 'border-blue-500/30',
      image: '/Images/TechQA.png'
    },
    'development': { 
      id: 'techdev', 
      name: 'TechDev Badges', 
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-500/10 to-green-600/10',
      borderColor: 'border-green-500/30',
      image: '/Images/TechDev.png'
    },
    'leadership': { 
      id: 'techleads', 
      name: 'TechLeads Badges', 
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-500/10 to-purple-600/10',
      borderColor: 'border-purple-500/30',
      image: '/Images/TechLeads.png'
    },
    'design': { 
      id: 'techarchs', 
      name: 'TechArchs Badges', 
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-500/10 to-orange-600/10',
      borderColor: 'border-orange-500/30',
      image: '/Images/TechArchs.png'
    },
    'security': { 
      id: 'techguard', 
      name: 'TechGuard Badges', 
      color: 'from-red-500 to-red-600',
      bgColor: 'from-red-500/10 to-red-600/10',
      borderColor: 'border-red-500/30',
      image: '/Images/TechGuard.png'
    }
  };

  const badgeLevels = {
    'novice': { name: 'Novice', color: '#FFC107', weight: 1 },
    'beginners': { name: 'Beginners', color: '#2196F3', weight: 2 },
    'intermediate': { name: 'Intermediate', color: '#9C27B0', weight: 3 },
    'expert': { name: 'Expert', color: '#4CAF50', weight: 4 }
  };

  // Fetch user badges and certificates
  useEffect(() => {
    if (!currentUser) return;

    // Fetch badges
    const badgesQuery = query(
      collection(db, 'member_badges'),
      where('memberEmail', '==', currentUser.email),
      orderBy('awardedAt', 'desc')
    );

    const badgesUnsubscribe = onSnapshot(badgesQuery, (snapshot) => {
      const badges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserBadges(badges);
    });

    // Fetch certificates
    const certificatesQuery = query(
      collection(db, 'certificates'),
      where('recipientEmail', '==', currentUser.email),
      orderBy('generatedAt', 'desc')
    );

    const certificatesUnsubscribe = onSnapshot(certificatesQuery, (snapshot) => {
      const certs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCertificates(certs);
      setLoading(false);
    });

    return () => {
      badgesUnsubscribe();
      certificatesUnsubscribe();
    };
  }, [currentUser]);

  // Generate and download certificate
  const downloadCertificate = async (certificate) => {
    try {
      // Create certificate HTML content
      const certificateHTML = generateCertificateHTML(certificate);
      
      // Create a new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(certificateHTML);
      printWindow.document.close();
      
      // Focus the window and trigger print dialog
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please try again.');
    }
  };

  // Generate and download badge certificate
  const downloadBadge = async (badge) => {
    try {
      // Create badge certificate HTML content
      const badgeHTML = generateBadgeHTML(badge);
      
      // Create a new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      printWindow.document.write(badgeHTML);
      printWindow.document.close();
      
      // Focus the window and trigger print dialog
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error generating badge certificate:', error);
      alert('Error generating badge certificate. Please try again.');
    }
  };

  // Generate badge certificate HTML
  const generateBadgeHTML = (badge) => {
    const categoryInfo = badgeCategories[badge.badgeCategory];
    const levelInfo = badgeLevels[badge.badgeLevel];
    const formattedDate = badge.awardedAt?.toDate?.()?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) || 'Recently';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TechTalent Badge Certificate</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0.3in;
        }
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .certificate {
          background: white;
          border: 6px solid ${levelInfo.color};
          border-radius: 15px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 15px 30px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 650px;
          height: auto;
          position: relative;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 2px solid ${levelInfo.color};
          border-radius: 8px;
        }
        .header-logos {
          margin-bottom: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .company-logo {
          height: 80px;
          width: auto;
        }
        .badge-logo {
          height: 100px;
          width: auto;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }
        .badge-title {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2C3E50;
        }
        .badge-category {
          font-size: 28px;
          color: ${levelInfo.color};
          margin-bottom: 8px;
          font-weight: bold;
        }
        .badge-level {
          font-size: 20px;
          color: ${levelInfo.color};
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .recipient {
          font-size: 26px;
          color: #2C3E50;
          margin: 20px 0;
          font-style: italic;
          font-weight: bold;
        }
        .project-title {
          font-size: 22px;
          color: #4A90E2;
          margin: 15px 0;
          font-weight: bold;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 25px auto;
          text-align: center;
          max-width: 500px;
        }
        .detail-item {
          font-size: 14px;
          color: #5A6C7D;
          text-align: center;
        }
        .skills-section {
          margin: 20px 0;
          text-align: center;
        }
        .skills-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 10px;
        }
        .skill-tag {
          background: ${levelInfo.color}20;
          color: ${levelInfo.color};
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          border: 1px solid ${levelInfo.color}40;
        }
        .signature-section {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .signature {
          text-align: center;
          min-width: 150px;
        }
        .signature-line {
          border-top: 2px solid ${levelInfo.color};
          margin-bottom: 8px;
          width: 120px;
          margin-left: auto;
          margin-right: auto;
        }
        .verification-seal {
          text-align: center;
        }
        .seal {
          width: 80px;
          height: 80px;
          border: 3px solid ${levelInfo.color};
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: ${levelInfo.color};
          margin-bottom: 5px;
          background: ${levelInfo.color}10;
        }
        .small-text {
          font-size: 12px;
          color: #7F8C8D;
        }
        .cert-text {
          font-size: 16px;
          color: #7F8C8D;
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="header-logos">
          <img src="/Images/FavO.png" alt="Favored Online" class="company-logo" onerror="this.style.display='none';" />
          <img src="${categoryInfo.image}" alt="${categoryInfo.name}" class="badge-logo" onerror="this.style.display='none';" />
        </div>
        
        <div class="badge-title">TechTalent Badge</div>
        <div class="badge-category">${categoryInfo.name}</div>
        <div class="badge-level">${levelInfo.name} Level</div>
        
        <div style="margin: 25px 0;">
          <div class="cert-text">This badge is awarded to</div>
          <div class="recipient">${badge.memberName || badge.memberEmail}</div>
          <div class="cert-text">for ${badge.contribution} contribution in</div>
          <div class="project-title">"${badge.projectTitle}"</div>
        </div>
        
        <div class="details-grid">
          <div class="detail-item">
            <strong>Badge Category:</strong><br>
            ${categoryInfo.name}
          </div>
          <div class="detail-item">
            <strong>Achievement Level:</strong><br>
            ${levelInfo.name}
          </div>
          <div class="detail-item">
            <strong>Awarded Date:</strong><br>
            ${formattedDate}
          </div>
          <div class="detail-item">
            <strong>Badge ID:</strong><br>
            ${badge.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
        
        ${badge.skillsDisplayed && badge.skillsDisplayed.length > 0 ? `
        <div class="skills-section">
          <div style="font-size: 14px; color: #5A6C7D; margin-bottom: 10px;"><strong>Skills Demonstrated:</strong></div>
          <div class="skills-list">
            ${badge.skillsDisplayed.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
        ` : ''}
        
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line"></div>
            <div style="font-weight: bold; font-size: 14px;">Favored Online Inc.</div>
            <div class="small-text">Platform Authority</div>
          </div>
          <div class="verification-seal">
            <div class="seal">BADGE</div>
            <div class="small-text">Verified Achievement</div>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <div style="font-weight: bold; font-size: 14px;">TechTalent Program</div>
            <div class="small-text">Skill Verification</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  // Generate certificate HTML
  const generateCertificateHTML = (certificate) => {
    const formattedDate = certificate.generatedAt?.toDate?.()?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) || 'Recent';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Project Completion Certificate</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0.3in;
        }
        body {
          font-family: 'Times New Roman', serif;
          margin: 0;
          padding: 15px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .certificate {
          background: white;
          border: 6px solid #4A90E2;
          border-radius: 15px;
          padding: 30px;
          text-align: center;
          box-shadow: 0 15px 30px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 650px;
          height: auto;
          position: relative;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 15px;
          left: 15px;
          right: 15px;
          bottom: 15px;
          border: 2px solid #4A90E2;
          border-radius: 8px;
        }
        .logo {
          margin-bottom: 15px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo img {
          height: 60px;
          width: auto;
        }
        .title {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
          color: #2C3E50;
        }
        .subtitle {
          font-size: 18px;
          color: #7F8C8D;
          margin-bottom: 25px;
        }
        .recipient {
          font-size: 26px;
          color: #2C3E50;
          margin: 20px 0;
          font-style: italic;
          font-weight: bold;
        }
        .project-title {
          font-size: 22px;
          color: #4A90E2;
          margin: 15px 0;
          font-weight: bold;
        }
        .details {
          margin: 25px 0;
          line-height: 1.6;
          font-size: 14px;
          color: #5A6C7D;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin: 25px auto;
          text-align: center;
          max-width: 500px;
        }
        .detail-item {
          font-size: 14px;
          color: #5A6C7D;
          text-align: center;
        }
        .signature-section {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .signature {
          text-align: center;
          min-width: 150px;
        }
        .signature-line {
          border-top: 2px solid #4A90E2;
          margin-bottom: 8px;
          width: 120px;
          margin-left: auto;
          margin-right: auto;
        }
        .verification-seal {
          text-align: center;
        }
        .seal {
          width: 70px;
          height: 70px;
          border: 3px solid #4A90E2;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: #4A90E2;
          margin-bottom: 5px;
        }
        .small-text {
          font-size: 12px;
          color: #7F8C8D;
        }
        .medium-text {
          font-size: 14px;
          color: #7F8C8D;
        }
        .cert-text {
          font-size: 16px;
          color: #7F8C8D;
          margin: 8px 0;
        }
        .description {
          font-style: italic;
          font-size: 13px;
          color: #666;
          margin-top: 15px;
          line-height: 1.4;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="logo">
          <img src="/Images/FavO.png" alt="Favored Online" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <div style="display: none; font-size: 28px; color: #4CAF50; font-weight: bold;">Favored Online Inc.</div>
        </div>
        
        <div class="title">Certificate of Completion</div>
        <div class="subtitle">Project Leadership Excellence</div>
        
        <div style="margin: 25px 0;">
          <div class="cert-text">This is to certify that</div>
          <div class="recipient">${certificate.recipientName || certificate.recipientEmail}</div>
          <div class="cert-text">has successfully completed the project</div>
          <div class="project-title">"${certificate.projectTitle}"</div>
        </div>
        
        <div class="details-grid">
          <div class="detail-item">
            <strong>Project Type:</strong><br>
            ${certificate.type.replace('_', ' ').toUpperCase()}
          </div>
          <div class="detail-item">
            <strong>Team Size:</strong><br>
            ${certificate.certificateData?.teamSize || 1} member(s)
          </div>
          <div class="detail-item">
            <strong>Completion Date:</strong><br>
            ${formattedDate}
          </div>
          <div class="detail-item">
            <strong>Certificate ID:</strong><br>
            ${certificate.id.substring(0, 8).toUpperCase()}
          </div>
        </div>
        
        ${certificate.certificateData?.projectDescription && certificate.certificateData.projectDescription !== 'tesrt' ? `
        <div class="description">
          "${certificate.certificateData.projectDescription}"
        </div>
        ` : ''}
        
        <div class="signature-section">
          <div class="signature">
            <div class="signature-line"></div>
            <div style="font-weight: bold; font-size: 14px;">Favored Online Inc.</div>
            <div class="small-text">Platform Authority</div>
          </div>
          <div class="verification-seal">
            <div class="seal">CERT</div>
            <div class="small-text">Verified Achievement</div>
          </div>
          <div class="signature">
            <div class="signature-line"></div>
            <div style="font-weight: bold; font-size: 14px;">Digital Certificate</div>
            <div class="small-text">Blockchain Verified</div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  // Filter badges
  const filteredBadges = userBadges.filter(badge => {
    if (selectedFilter === 'all') return true;
    return badge.badgeCategory === selectedFilter;
  });

  // Get badge statistics
  const badgeStats = Object.keys(badgeCategories).map(category => {
    const categoryBadges = userBadges.filter(badge => badge.badgeCategory === category);
    const totalCount = categoryBadges.length;
    const levelCounts = Object.keys(badgeLevels).reduce((acc, level) => {
      acc[level] = categoryBadges.filter(badge => badge.badgeLevel === level).length;
      return acc;
    }, {});
    
    return {
      category,
      totalCount,
      levelCounts,
      ...badgeCategories[category]
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading your achievements...</p>
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

      {/* Header - Enhanced with glassmorphism effect */}
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
        {/* HOME LINK - Different destinations for logged in vs logged out users */}
        <Link 
          to={currentUser ? "/community" : "/"} 
          className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
        >
          Home
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
        </Link>
        
        {/* LOGGED IN USER NAVIGATION */}
        {currentUser ? (
          <>
            {/* MY CAREER LINK - Only for logged in users */}
            <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              My Career
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            
            {/* DASHBOARD LINK - Only for logged in users */}
            <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              Dashboard
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
          </>
        ) : (
          /* LOGGED OUT USER NAVIGATION */
          <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Career
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
          </Link>
        )}
        
        {/* USER AUTHENTICATION SECTION */}
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
            <button 
              onClick={() => navigate('/logout')} 
              className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-xs sm:text-sm transition-all duration-300 backdrop-blur-sm border border-white/20 font-medium"
            >
              Logout
            </button>
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
    
    {/* Enhanced Mobile Menu */}
    {mobileMenuOpen && (
      <div className="md:hidden mt-4 sm:mt-6 pb-4 sm:pb-6 rounded-2xl" 
           style={{background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'}}>
        <div className="flex flex-col space-y-3 sm:space-y-5 p-4 sm:p-6">
          
          {/* HOME LINK FOR MOBILE - Different for logged in vs out */}
          <Link 
            to={currentUser ? "/community" : "/"} 
            className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          {/* LOGGED IN USER MOBILE NAVIGATION */}
          {currentUser ? (
            <>
              {/* MY CAREER LINK FOR MOBILE */}
              <Link to="/career/dashboard" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                My Career
              </Link>

              {/* DASHBOARD LINK FOR MOBILE */}
              <Link to="/dashboard" 
                    className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                    onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            </>
          ) : (
            /* LOGGED OUT USER MOBILE NAVIGATION */
            <Link to="/career" 
                  className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                  onClick={() => setMobileMenuOpen(false)}>
              Career
            </Link>
          )}
          
          {/* MOBILE USER AUTHENTICATION SECTION */}
          {currentUser ? (
            <div className="flex flex-col space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-white/20">
              <div className="flex items-center bg-black/40 rounded-full px-3 sm:px-4 py-2 sm:py-3">
                {currentUser.photoURL && (
                  <img src={currentUser.photoURL} alt="Profile" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 sm:mr-3 ring-2 ring-lime-400/50" />
                )}
                <span className="text-xs sm:text-sm text-white font-medium truncate">{currentUser.displayName || currentUser.email}</span>
              </div>
              <button 
                onClick={() => navigate('/logout')} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm transition-colors w-full font-medium"
              >
                Logout
              </button>
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
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          
          {/* Hero Section */}
          <section className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-8 animate-pulse">
              <div className="h-4 w-4 bg-lime-400 rounded-full animate-ping shadow-lg"></div>
              <span className="text-lime-300 uppercase tracking-widest text-lg font-black">
                My Achievements
              </span>
              <div className="h-4 w-4 bg-lime-400 rounded-full animate-ping shadow-lg"></div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6"
                style={{
                  fontFamily: '"Inter", sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255,255,255,0.3)',
                  filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                }}>
              My{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                Badges & Certificates
              </span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
              Your professional achievements and project completion certificates
            </p>
          </section>

          {/* Important Notice */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-2xl rounded-2xl p-6 border border-amber-500/30 shadow-2xl">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-amber-500 text-black rounded-full p-2 mr-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-amber-300">⚠️ Important Notice</h3>
              </div>
              <div className="text-center">
                <p className="text-lg text-white leading-relaxed">
                  <span className="font-semibold text-amber-200">Please download and keep copies of your certificates.</span> 
                  <br />
                  System updates may erase important data needed for your certificates.
                </p>
                <div className="mt-4 text-gray-300 text-sm">
                  We recommend saving certificates in multiple locations for safekeeping.
                </div>
              </div>
            </div>
          </section>

          {/* Summary Statistics */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-lime-400 mb-2">{userBadges.length}</div>
                <div className="text-gray-300 font-semibold">Total Badges</div>
              </div>
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-blue-400 mb-2">{certificates.length}</div>
                <div className="text-gray-300 font-semibold">Certificates</div>
              </div>
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-purple-400 mb-2">
                  {badgeStats.filter(stat => stat.totalCount > 0).length}
                </div>
                <div className="text-gray-300 font-semibold">Badge Categories</div>
              </div>
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 text-center">
                <div className="text-4xl font-black text-yellow-400 mb-2">
                  {userBadges.filter(badge => badge.badgeLevel === 'expert').length}
                </div>
                <div className="text-gray-300 font-semibold">Expert Badges</div>
              </div>
            </div>
          </section>

          {/* Badge Categories Overview */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Badge Categories Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badgeStats.map((stat) => (
                <div 
                  key={stat.category}
                  className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-2xl rounded-2xl p-6 border ${stat.borderColor} transform hover:scale-105 transition-all duration-300`}
                >
                  <div className="flex items-center mb-4">
                    <img 
                      src={stat.image} 
                      alt={stat.name}
                      className="w-12 h-12 mr-4 object-contain"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-white">{stat.name}</h3>
                      <p className="text-gray-300 text-sm">{stat.totalCount} badges earned</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(stat.levelCounts).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm capitalize">{level}</span>
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: badgeLevels[level].color }}
                          ></div>
                          <span className="text-white font-semibold">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Filter Tabs */}
          <section className="mb-8">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedFilter === 'all' 
                    ? 'bg-lime-500 text-black' 
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                All Badges ({userBadges.length})
              </button>
              {Object.entries(badgeCategories).map(([category, info]) => {
                const count = userBadges.filter(badge => badge.badgeCategory === category).length;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedFilter(category)}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      selectedFilter === category 
                        ? 'bg-lime-500 text-black' 
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {info.name} ({count})
                  </button>
                );
              })}
            </div>
          </section>

          {/* Badges Grid */}
          <section className="mb-16">
            {filteredBadges.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {selectedFilter === 'all' ? 'No badges earned yet' : `No ${badgeCategories[selectedFilter]?.name} earned yet`}
                </h3>
                <p className="text-gray-300 mb-8">
                  Complete projects to earn your first badges!
                </p>
                <Link 
                  to="/projects"
                  className="bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300"
                >
                  Join a Project
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBadges.map((badge) => {
                  const categoryInfo = badgeCategories[badge.badgeCategory];
                  const levelInfo = badgeLevels[badge.badgeLevel];
                  
                  return (
                    <div 
                      key={badge.id}
                      className={`bg-gradient-to-br ${categoryInfo.bgColor} backdrop-blur-2xl rounded-2xl p-6 border ${categoryInfo.borderColor} transform hover:scale-105 transition-all duration-300 shadow-2xl`}
                    >
                      {/* Badge Header */}
                      <div className="flex items-center mb-4">
                        <img 
                          src={categoryInfo.image} 
                          alt={categoryInfo.name}
                          className="w-16 h-16 mr-4 object-contain"
                        />
                        <div>
                          <h3 className="text-xl font-bold text-white">{categoryInfo.name}</h3>
                          <div 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border"
                            style={{
                              backgroundColor: `${levelInfo.color}20`,
                              borderColor: `${levelInfo.color}50`,
                              color: levelInfo.color
                            }}
                          >
                            {levelInfo.name}
                          </div>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold text-white mb-2">{badge.projectTitle}</h4>
                        <p className="text-gray-300 text-sm">
                          Awarded for: <span className="capitalize">{badge.contribution}</span> contribution
                        </p>
                      </div>

                      {/* Skills */}
                      {badge.skillsDisplayed && badge.skillsDisplayed.length > 0 && (
                        <div className="mb-4">
                          <div className="text-gray-400 text-sm mb-2">Skills Demonstrated:</div>
                          <div className="flex flex-wrap gap-2">
                            {badge.skillsDisplayed.slice(0, 3).map((skill, index) => (
                              <span 
                                key={index}
                                className="bg-white/10 text-gray-300 px-2 py-1 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {badge.skillsDisplayed.length > 3 && (
                              <span className="bg-white/10 text-gray-300 px-2 py-1 rounded text-xs">
                                +{badge.skillsDisplayed.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Date */}
                      <div className="text-gray-400 text-sm mb-4">
                        Earned: {badge.awardedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                      </div>

                      {/* Download Button */}
                      <button 
                        onClick={() => downloadBadge(badge)}
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:from-gray-500 hover:to-gray-600 transition-all duration-300 text-sm"
                      >
                        Download Badge Certificate
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Certificates Section */}
          {certificates.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-white mb-8 text-center">My Certificates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {certificates.map((certificate) => (
                  <div 
                    key={certificate.id}
                    className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 transform hover:scale-105 transition-all duration-300 shadow-2xl"
                  >
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-white mb-2">Project Completion Certificate</h3>
                      <p className="text-lime-400 font-semibold text-lg">{certificate.projectTitle}</p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white font-semibold capitalize">
                          {certificate.type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Issued:</span>
                        <span className="text-white font-semibold">
                          {certificate.generatedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </span>
                      </div>
                      {certificate.certificateData?.teamSize && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Team Size:</span>
                          <span className="text-white font-semibold">
                            {certificate.certificateData.teamSize} members
                          </span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => downloadCertificate(certificate)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                    >
                      Download Certificate
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
};

export default UserBadgesPage;
