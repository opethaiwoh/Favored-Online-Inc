// src/Pages/career/CareerHome.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Constants
const FEATURES = [
  {
    title: "AI Career Recommendations",
    description: "Get personalized career paths with match percentages based on AI analysis of your complete profile",
    color: "from-lime-400 to-green-500",
    icon: "🤖",
    glow: "lime"
  },
  {
    title: "Personalized Roadmaps",
    description: "AI-generated phase-by-phase career transition plans with specific timelines and milestones",
    color: "from-green-400 to-emerald-500",
    icon: "🗺️",
    glow: "green"
  },
  {
    title: "Market Intelligence",
    description: "Real-time salary data, job market trends, and demand analysis powered by AI for your target careers",
    color: "from-blue-400 to-purple-500",
    icon: "📊",
    glow: "blue"
  },
  {
    title: "Learning Plans",
    description: "Comprehensive learning paths with specific courses, certifications, and practice projects",
    color: "from-purple-400 to-pink-500",
    icon: "📚",
    glow: "purple"
  },
  {
    title: "Interview Preparation",
    description: "Career-specific interview questions with sample answers, including technical and behavioral questions",
    color: "from-emerald-400 to-teal-500",
    icon: "💬",
    glow: "emerald"
  },
  {
    title: "Downloadable Reports",
    description: "Professional PDF downloads of all AI-generated content for offline reference and sharing",
    color: "from-orange-400 to-red-500",
    icon: "📄",
    glow: "orange"
  }
];

const PLATFORM_FEATURES = [
  {
    title: "AI-Powered Dashboard",
    description: "Comprehensive overview with AI-generated career recommendations, personalized roadmaps, and market insights",
    features: ["Career match percentages", "Timeline tracking", "Progress monitoring", "AI insights"],
    icon: "🎯",
    gradient: "from-lime-400 via-green-500 to-emerald-600"
  },
  {
    title: "Learning Plan Hub",
    description: "AI-generated learning plans with courses, certifications, and practice projects specifically matched to your career transition goals",
    features: ["AI-generated learning tracks", "Certification recommendations", "Practice projects", "Interview preparation"],
    icon: "🎓",
    gradient: "from-green-400 via-emerald-500 to-teal-600"
  },
  {
    title: "Real Projects Portfolio",
    description: "Build powerful portfolios through real-world projects with our badge system and industry collaboration",
    features: ["Real-world projects", "Badge progression system", "Industry simulation", "Portfolio building"],
    icon: "🚀",
    gradient: "from-purple-400 via-pink-500 to-red-600"
  },
  {
    title: "Market Intelligence Suite",
    description: "Complete market analysis with AI-powered insights for informed career decisions",
    features: ["Salary data analysis", "Job market trends", "Industry demand metrics", "Career opportunity mapping"],
    icon: "📊",
    gradient: "from-blue-400 via-purple-500 to-pink-600"
  }
];

const PROJECT_BENEFITS = [
  {
    title: "Build a Powerful Portfolio with Real Projects",
    description: "Gain hands-on experience by contributing to real-world tech projects. Create or participate in free projects to grow your badges and showcase your work, giving you an edge for opportunities beyond TechTalents City.",
    icon: "💼",
    gradient: "from-lime-400 to-green-500",
    features: ["Real-world project experience", "Portfolio showcase", "Badge advancement", "Professional networking"]
  },
  {
    title: "Simulate Industry Experience", 
    description: "Collaborate as though you're part of a real organization, building essential soft skills like communication, problem-solving, and analytical thinking.",
    icon: "🏢",
    gradient: "from-green-400 to-emerald-500",
    features: ["Team collaboration", "Professional communication", "Problem-solving skills", "Analytical thinking"]
  },
  {
    title: "Grow with Our Badge System",
    description: "Advance from Novice to Expert through a structured badge system that tracks your progress and unlocks new levels of learning and achievements.",
    icon: "🏆",
    gradient: "from-emerald-400 to-teal-500", 
    features: ["Structured progression", "Achievement tracking", "Skill validation", "Expert recognition"]
  }
];

const PROCESS_STEPS = [
  {
    step: "1",
    title: "Complete Assessment",
    description: "Comprehensive questionnaire covering your education, experience, skills, and career aspirations",
    icon: "📝",
    gradient: "from-lime-400 to-green-500",
    delay: "0s"
  },
  {
    step: "2",
    title: "AI Analysis",
    description: "Our AI analyzes 50+ factors from your profile to identify optimal career matches and transition paths",
    icon: "🤖",
    gradient: "from-green-400 to-emerald-500",
    delay: "0.2s"
  },
  {
    step: "3",
    title: "Personalized Results",
    description: "Receive detailed recommendations with match scores, learning plans, and market insights",
    icon: "📊",
    gradient: "from-emerald-400 to-teal-500",
    delay: "0.4s"
  },
  {
    step: "4",
    title: "Build Real Projects",
    description: "Access real projects, build your portfolio, and advance through our badge system",
    icon: "🚀",
    gradient: "from-teal-400 to-blue-500",
    delay: "0.6s"
  }
];

const FAQs = [
  {
    question: "How does the AI analysis work?",
    answer: "Our system uses AI to analyze your complete profile including education, experience, skills, and goals. It compares this against thousands of successful career transitions to provide personalized recommendations with match scores.",
    icon: "🤖"
  },
  {
    question: "What makes this different from other career assessments?",
    answer: "Unlike generic tests, our AI creates fully personalized content including specific learning plans, interview questions for your target role, market salary data, and downloadable PDF reports. Plus, you get access to real projects to build your portfolio.",
    icon: "⚡"
  },
  {
    question: "How does the project system work?",
    answer: "Browse real projects posted by companies, apply to work on them, and build your portfolio while earning badges. You can also submit your own projects. This gives you practical experience and showcases your skills to potential employers.",
    icon: "💼"
  },
  {
    question: "How long does the assessment take?",
    answer: "The initial assessment takes 15-20 minutes, but the AI continues generating personalized content throughout your access period, including roadmaps, learning plans, and interview preparation materials.",
    icon: "⏰"
  },
  {
    question: "What if I don't have any tech experience?",
    answer: "Perfect! Our AI specializes in identifying transferable skills from any background. Many successful users started with zero tech experience and used our personalized transition plans and real projects to break into the industry.",
    icon: "🌟"
  },
  {
    question: "Can I download my results?",
    answer: "Yes! All AI-generated content can be downloaded as professional PDF reports, including your career recommendations, learning plan, interview questions, and market insights.",
    icon: "📄"
  },
  {
    question: "What ongoing support do I get?",
    answer: "You can generate new AI content, access our comprehensive learning plans, interview preparation tools, career development guides, and real projects. Additionally, you'll have access to our badge system and professional portfolio building resources.",
    icon: "🤝"
  }
];

const TESTIMONIALS = [
  {
    name: "Temitope Ajibola",
    role: "Tech Entrepreneur",
    initial: "TA",
    quote: "As a tech entrepreneur, I'm excited about Favored Online and its potential for innovative tech solutions across various domains. The platform's approach to connecting AI-powered career guidance with real-world projects creates endless possibilities for breakthrough innovations.",
    gradient: "from-lime-400 to-green-500",
    company: "Tech Innovator",
    timeframe: "Entrepreneur"
  },
  {
    name: "Peter Adeniran",
    role: "Accountant → Tech Transition",
    initial: "PA",
    quote: "As a professional accountant and analyst, I'm excited about Favored Online and its potential for transitioning into technology. The platform bridges the gap between traditional finance skills and modern tech careers, opening new pathways I never thought possible.",
    gradient: "from-green-400 to-emerald-500",
    company: "Finance Professional",
    timeframe: "Transitioning"
  },
  {
    name: "Suma Movva",
    role: "AI/ML Researcher",
    initial: "SM",
    quote: "As an AI/ML researcher, I'm intrigued by how Favored Online will connect the right talent to skill-customized AI projects. The platform's intelligent matching system has the potential to revolutionize how we approach talent acquisition in the AI space.",
    gradient: "from-emerald-400 to-teal-500",
    company: "AI Research",
    timeframe: "Researcher"
  }
];

// Component
const CareerHome = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const projectBenefitsRef = useRef(null);
  const { currentUser, isAuthorized } = useAuth();

  useEffect(() => {
    setIsVisible(true);
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleStartTest = () => {
    if (currentUser) {
      // Always go to dashboard for logged-in users
      // Dashboard will handle test status and direct appropriately
      navigate('/career/dashboard');
    } else {
      // User not logged in, go to login
      navigate('/login');
    }
  };

  const handleViewProjects = () => {
    navigate('/projects');
  };

  // Determine button text based on user status - with fallback for completed users
  const getButtonText = () => {
    if (!currentUser) {
      return "Start Free AI Assessment";
    }
    // Always show "Continue to Dashboard" for logged-in users
    // Dashboard will handle directing them appropriately
    return "Continue to Dashboard";
  };

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
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl">
          
          {/* Hero Section - Ultra Enhanced */}
          <section className="relative mb-16 sm:mb-24 md:mb-32 pt-8 sm:pt-12 md:pt-20">
            <div className="max-w-6xl mx-auto text-center">
              
              {/* Animated Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-pulse">
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black px-2 text-center" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em sm:0.2em'
                      }}>
                  🤖 Free AI-Powered Career Intelligence + Real Projects
                </span>
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              {/* Main Title with Enhanced Typography */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Discover Your Perfect
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Tech Career Path
                </span>
              </h1>
              
              {/* Enhanced Description */}
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 sm:mb-12 md:mb-16 text-gray-100 max-w-5xl mx-auto leading-relaxed font-light px-4"
                 style={{
                   textShadow: '0 0 20px rgba(255,255,255,0.1), 2px 2px 8px rgba(0,0,0,0.9)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Get comprehensive <span className="text-lime-300 font-semibold">FREE AI analysis</span> with personalized career recommendations, learning roadmaps, 
                <span className="text-green-300 font-semibold"> real projects to build your portfolio</span>, and downloadable reports - all powered by <span className="text-green-300 font-semibold">advanced AI technology</span>.
              </p>
              
              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 md:gap-8 justify-center">
                <button
                  onClick={handleStartTest}
                  className="group relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-full font-black text-lg sm:text-xl md:text-2xl transition-all duration-500 transform hover:scale-110 hover:rotate-1 shadow-2xl overflow-hidden w-full sm:w-auto"
                  style={{
                    boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="relative flex items-center justify-center">
                    {getButtonText()}
                    <span className="ml-2 sm:ml-4 group-hover:translate-x-2 transition-transform text-xl sm:text-2xl md:text-3xl">
                      {currentUser ? "📊" : "🚀"}
                    </span>
                  </span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                <button
                  onClick={handleViewProjects}
                  className="group relative border-2 sm:border-4 border-white text-white px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-full font-black text-lg sm:text-xl md:text-2xl transition-all duration-500 transform hover:scale-110 hover:-rotate-1 shadow-2xl overflow-hidden backdrop-blur-sm w-full sm:w-auto"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    boxShadow: '0 0 40px rgba(255,255,255,0.2), 0 20px 40px rgba(0,0,0,0.3)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-lime-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="relative flex items-center justify-center">
                    Explore Real Projects
                    <span className="ml-2 sm:ml-4 group-hover:translate-x-2 transition-transform text-xl sm:text-2xl md:text-3xl">💼</span>
                  </span>
                </button>
              </div>
              
              {/* Free Badge */}
              <div className="mt-8 sm:mt-12 md:mt-16">
                <div className="inline-flex items-center bg-gradient-to-r from-lime-500/20 to-green-500/20 backdrop-blur-xl rounded-full px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-6 border border-lime-500/30 shadow-2xl">
                  <span className="text-2xl sm:text-3xl md:text-4xl mr-3 sm:mr-4 animate-bounce">🎉</span>
                  <span className="text-lime-300 font-black text-lg sm:text-xl md:text-2xl" 
                        style={{
                          textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                    Completely FREE - No Hidden Costs
                  </span>
                  <span className="text-2xl sm:text-3xl md:text-4xl ml-3 sm:ml-4 animate-bounce">✨</span>
                </div>
              </div>
              
              {/* Floating Elements - Hidden on very small screens */}
              <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-lime-400/20 rounded-full blur-xl animate-bounce"></div>
              <div className="hidden sm:block absolute bottom-20 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="hidden sm:block absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </section>

          {/* Tech Badges Overview Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Tech Badges
                </span>{' '}
                System
              </h2>
              <p className="text-gray-200 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light px-4" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Advance your career with our innovative TechTalents badges, awarded based on the number of completed projects, 
                showcasing your achievements and problem-solving skills. <span className="text-lime-300 font-semibold">Everything you need to grow from beginner to expert</span> - 
                with validation that employers trust.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              {[
                {
                  name: "TechMO",
                  image: "/Images/TechMO.png",
                  title: "Tech Mentors",
                  description: "Awarded to Tech Mentors after the successful completion of each collaborative project.",
                  gradient: "from-purple-500 to-indigo-600"
                },
                {
                  name: "TechQA", 
                  image: "/Images/TechQA.png",
                  title: "Quality Testers",
                  description: "Awarded to Quality Testers after the successful completion of each collaborative project.",
                  gradient: "from-green-500 to-emerald-600"
                },
                {
                  name: "TechDev",
                  image: "/Images/TechDev.png", 
                  title: "Coding Developers",
                  description: "Awarded to Coding Developers after the successful completion of each collaborative project.",
                  gradient: "from-red-500 to-pink-600"
                },
                {
                  name: "TechLeads",
                  image: "/Images/TechLeads.png",
                  title: "Non-Technical Professionals", 
                  description: "Awarded to Non-Technical Professionals after the successful completion of each collaborative project.",
                  gradient: "from-yellow-500 to-orange-600"
                },
                {
                  name: "TechArchs",
                  image: "/Images/TechArchs.png",
                  title: "No-Code Developers & Designers",
                  description: "Awarded to no-code developers and designers after the successful completion of each collaborative project.",
                  gradient: "from-blue-500 to-cyan-600"
                },
                {
                  name: "TechGuard",
                  image: "/Images/TechGuard.png",
                  title: "Network & Cybersecurity Professionals",
                  description: "Awarded to Network and Cybersecurity professionals after the successful completion of each collaborative project.",
                  gradient: "from-gray-700 to-gray-900"
                }
              ].map((badge, index) => (
                <div key={index} 
                     className="group transform hover:scale-105 transition-all duration-500 cursor-pointer">
                  
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl h-full flex flex-col hover:border-lime-400/30 transition-all duration-300">
                    
                    {/* Badge Icon and Name */}
                    <div className="text-center mb-6">
                      <div className={`p-4 rounded-2xl bg-gradient-to-br ${badge.gradient} shadow-2xl mx-auto w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <img 
                          src={badge.image} 
                          alt={`${badge.name} Badge`}
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                      <h3 className="text-2xl font-black text-white group-hover:text-lime-300 transition-colors duration-300 mb-2"
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        {badge.name}
                      </h3>
                      <span className={`bg-gradient-to-r ${badge.gradient} text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg`}>
                        {badge.title}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-200 text-center leading-relaxed text-sm sm:text-base flex-grow" 
                       style={{
                         textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      {badge.description}
                    </p>
                    
                    {/* Progress Levels Indicator */}
                    <div className="mt-6 flex justify-center space-x-2">
                      {['Novice', 'Beginners', 'Intermediate', 'Expert'].map((level, idx) => {
                        const colors = ['#FFC107', '#2196F3', '#9C27B0', '#4CAF50'];
                        return (
                          <div 
                            key={idx}
                            className="w-3 h-3 rounded-full border-2 border-white/20"
                            style={{
                              backgroundColor: colors[idx],
                              boxShadow: `0 0 10px ${colors[idx]}50`
                            }}
                            title={level}
                          ></div>
                        );
                      })}
                    </div>
                    
                    {/* Animated Underline */}
                    <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${badge.gradient} transition-all duration-700 mt-4 rounded-full`}
                         style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Learn More CTA */}
            <div className="text-center mt-12 sm:mt-16 md:mt-20">
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
                <h3 className="text-2xl md:text-3xl font-black text-white mb-4"
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Learn More About Badge Progression
                </h3>
                <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto"
                   style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                  Discover the complete badge progression system with <span className="text-lime-300 font-semibold">Novice, Beginners, Intermediate, and Expert</span> levels.
                </p>
                <button
                  onClick={() => navigate('/tech-badges')}
                  className="group relative bg-gradient-to-r from-orange-500 via-yellow-500 to-amber-600 text-white px-8 py-4 rounded-full font-black text-lg transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 0 40px rgba(251, 146, 60, 0.4)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  <span className="relative flex items-center justify-center">
                    Explore Badge System
                    <span className="ml-3 group-hover:translate-x-2 transition-transform text-2xl">🏆</span>
                  </span>
                </button>
              </div>
            </div>
          </section>

          {/* NEW: Project Benefits Section */}
          <section ref={projectBenefitsRef} className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Build Your Portfolio with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Real Projects
                </span>
              </h2>
              <p className="text-gray-200 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light px-4" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Bridge the gap between learning and employment with real-world project experience. <span className="text-lime-300 font-semibold">We provide everything you need</span> - 
                from skills development to portfolio building to professional validation.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 md:gap-16">
              {PROJECT_BENEFITS.map((benefit, index) => (
                <div key={index} 
                     className="group transform hover:scale-105 transition-all duration-500 cursor-pointer">
                  
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/20 shadow-2xl h-full flex flex-col">
                    
                    {/* Icon and Badge */}
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="text-4xl sm:text-5xl md:text-6xl mb-4 transform group-hover:scale-125 transition-all duration-500"
                           style={{filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.8))'}}>
                        {benefit.icon}
                      </div>
                      <span className={`bg-gradient-to-r ${benefit.gradient} text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg`}>
                        Portfolio Building
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-4 sm:mb-6 text-white group-hover:text-lime-300 transition-colors duration-500 text-center" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      {benefit.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-200 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed font-light text-center flex-grow" 
                       style={{
                         textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      {benefit.description}
                    </p>
                    
                    {/* Features */}
                    <ul className="space-y-3 sm:space-y-4">
                      {benefit.features.map((feature, idx) => (
                        <li key={idx} 
                            className="flex items-center text-gray-200 text-sm sm:text-base group-hover:text-white transition-colors duration-300" 
                            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                          <span className="text-lime-400 mr-3 text-lg transform group-hover:scale-125 transition-transform duration-300 flex-shrink-0"
                                style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
                            ✓
                          </span>
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    {/* Animated Underline */}
                    <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${benefit.gradient} transition-all duration-700 mt-6 rounded-full`}
                         style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* CTA for Projects */}
            <div className="text-center mt-12 sm:mt-16 md:mt-20">
              <button
                onClick={handleViewProjects}
                className="group relative bg-gradient-to-r from-purple-500 via-pink-500 to-red-600 text-white px-8 sm:px-12 py-4 sm:py-5 rounded-full font-black text-lg sm:text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden"
                style={{
                  boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                <span className="relative flex items-center justify-center">
                  Browse Real Projects
                  <span className="ml-3 group-hover:translate-x-2 transition-transform text-2xl">💼</span>
                </span>
              </button>
            </div>
          </section>

          {/* Enhanced Trust Indicators */}
          <section className="mb-16 sm:mb-20 md:mb-28 text-center">
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
              <div className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-12 lg:gap-20">
                {[
                  { icon: "🤖", text: "AI-Powered Growth", glow: "lime" },
                  { icon: "💼", text: "Real Projects", glow: "green" },
                  { icon: "🏆", text: "Badge Validation", glow: "emerald" },
                  { icon: "📄", text: "Professional Reports", glow: "blue" },
                  { icon: "🆓", text: "Everything FREE", glow: "teal" }
                ].map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 group cursor-pointer">
                    <span className="text-3xl sm:text-4xl md:text-5xl transform group-hover:scale-125 transition-transform duration-300 group-hover:rotate-12"
                          style={{filter: `drop-shadow(0 0 20px rgba(76, 175, 80, 0.6))`}}>
                      {item.icon}
                    </span>
                    <span className="text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl group-hover:text-lime-300 transition-colors duration-300 text-center sm:text-left" 
                          style={{
                            textShadow: '0 0 10px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.8)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Ultra Enhanced Features Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Complete Growth
                </span>{' '}
                Ecosystem
              </h2>
              <p className="text-gray-200 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light px-4" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Everything you need for career transformation: AI-powered guidance, real projects for experience, 
                and badge validation for credibility - all in one comprehensive platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
              {FEATURES.map((feature, index) => (
                <div key={index} 
                     className="group cursor-pointer transform hover:scale-105 transition-all duration-500 hover:-rotate-1"
                     style={{animationDelay: `${index * 0.1}s`}}>
                  
                  {/* Icon with Enhanced Glow */}
                  <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 sm:mb-6 md:mb-8 transform group-hover:scale-125 transition-all duration-500 text-center relative">
                    <div className={`absolute inset-0 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 bg-${feature.glow}-400 rounded-full`}></div>
                    <span className="relative" 
                          style={{
                            filter: `drop-shadow(0 0 20px rgba(76, 175, 80, 0.8))`,
                            textShadow: '0 0 40px rgba(76, 175, 80, 0.6)'
                          }}>
                      {feature.icon}
                    </span>
                  </div>
                  
                  {/* Title with Gradient */}
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 sm:mb-4 md:mb-6 text-center group-hover:text-lime-300 transition-colors duration-500"
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        color: 'white'
                      }}>
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-200 leading-relaxed text-center text-sm sm:text-base md:text-lg font-light mb-4 sm:mb-6 md:mb-8"
                     style={{
                       textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    {feature.description}
                  </p>
                  
                  {/* Animated Underline */}
                  <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${feature.color} transition-all duration-700 mx-auto rounded-full`}
                       style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                </div>
              ))}
            </div>
          </section>



          {/* FAQ Section - Enhanced */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Frequently Asked{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Questions
                </span>
              </h2>
            </div>
            
            <div className="max-w-5xl mx-auto">
              {FAQs.map((faq, index) => (
                <div key={index} className="mb-4 sm:mb-6">
                  <button
                    className="w-full text-left p-6 sm:p-8 md:p-10 transition-all duration-500 rounded-xl sm:rounded-2xl group hover:scale-105"
                    style={{
                      background: expandedFAQ === index 
                        ? 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(76, 175, 80, 0.1) 100%)' 
                        : 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(76, 175, 80, 0.05) 100%)',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      boxShadow: expandedFAQ === index 
                        ? '0 20px 40px rgba(0,0,0,0.3), 0 0 40px rgba(76, 175, 80, 0.1)' 
                        : '0 10px 20px rgba(0,0,0,0.2)'
                    }}
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <span className="text-2xl sm:text-3xl">{faq.icon}</span>
                        <h3 className="font-black text-base sm:text-lg md:text-xl text-white pr-2 sm:pr-4 group-hover:text-lime-300 transition-colors duration-300" 
                            style={{
                              textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          {faq.question}
                        </h3>
                      </div>
                      <span className={`transform transition-transform text-2xl sm:text-3xl md:text-4xl text-lime-400 flex-shrink-0 ${expandedFAQ === index ? 'rotate-180' : ''}`}
                            style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
                        ⌄
                      </span>
                    </div>
                    {expandedFAQ === index && (
                      <p className="mt-4 sm:mt-6 md:mt-8 text-gray-200 leading-relaxed text-sm sm:text-base md:text-lg pl-8 sm:pl-12 md:pl-16 font-light" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        {faq.answer}
                      </p>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Success Stories - Enhanced */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Success{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Stories
                </span>
              </h2>
              <p className="text-gray-200 text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed font-light px-4" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Real career transitions powered by our AI analysis and real project experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
              {TESTIMONIALS.map((testimonial, index) => (
                <div key={index} 
                     className="group transform hover:scale-105 transition-all duration-500 cursor-pointer">
                  
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl h-full flex flex-col">
                    
                    {/* Header */}
                    <div className="flex items-center mb-6 sm:mb-8">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${testimonial.gradient} flex items-center justify-center mr-4 sm:mr-6 shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-white font-black text-lg sm:text-xl" 
                              style={{fontFamily: '"Inter", sans-serif'}}>
                          {testimonial.initial}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-black text-white text-lg sm:text-xl group-hover:text-lime-300 transition-colors duration-300" 
                            style={{
                              textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          {testimonial.name}
                        </h4>
                        <p className="text-gray-300 text-sm sm:text-base font-semibold" 
                           style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                          {testimonial.role}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-lime-400 font-bold text-xs sm:text-sm">{testimonial.company}</span>
                          <span className="text-gray-400 text-xs sm:text-sm">• {testimonial.timeframe}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quote */}
                    <blockquote className="text-gray-200 leading-relaxed text-sm sm:text-base flex-grow" 
                                style={{
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                  fontFamily: '"Inter", sans-serif'
                                }}>
                      "{testimonial.quote}"
                    </blockquote>
                    
                    {/* Success Indicators */}
                    <div className="mt-6 sm:mt-8 flex items-center justify-between">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-yellow-400 text-lg sm:text-xl"
                                style={{filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.8))'}}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-lime-400 font-bold text-sm sm:text-base"
                            style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
                        ✓ Successful Transition
                      </span>
                    </div>
                    
                    {/* Animated Underline */}
                    <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${testimonial.gradient} transition-all duration-700 mt-4 rounded-full`}
                         style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA - Ultra Enhanced */}
          <section className="relative text-center mb-12 sm:mb-16 md:mb-20">
            <div className="relative">
              
              {/* Floating Elements - Hidden on very small screens */}
              <div className="hidden sm:block absolute top-0 left-1/4 w-32 h-32 bg-lime-400/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="hidden sm:block absolute bottom-0 right-1/4 w-40 h-40 bg-green-400/20 rounded-full blur-2xl animate-bounce"></div>
              
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl mb-6 sm:mb-8 md:mb-12 animate-bounce"
                   style={{filter: 'drop-shadow(0 0 40px rgba(76, 175, 80, 0.8))'}}>
                🆓
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 sm:mb-8 md:mb-12 text-white" 
                  style={{
                    textShadow: '0 0 50px rgba(255,255,255,0.4), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Ready for{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Complete Career
                </span>
                <br />Transformation + Professional Growth?
              </h2>
              
              <p className="mb-8 sm:mb-12 md:mb-16 text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-5xl mx-auto leading-relaxed font-light px-4" 
                 style={{
                   textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Everything you need for career success: comprehensive AI analysis, personalized learning plans, real projects for portfolio building, 
                and badge validation for credibility.
              </p>
              
              {/* Ultimate CTA Button */}
              <button
                onClick={handleStartTest}
                className="group relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 sm:px-12 md:px-16 lg:px-20 py-4 sm:py-6 md:py-8 rounded-full font-black text-lg sm:text-xl md:text-2xl lg:text-3xl transition-all duration-700 transform hover:scale-115 shadow-2xl overflow-hidden mb-6 sm:mb-8 md:mb-12 w-full sm:w-auto"
                style={{
                  boxShadow: '0 0 80px rgba(76, 175, 80, 0.6), 0 40px 80px rgba(0,0,0,0.4)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></span>
                <span className="relative flex items-center justify-center">
                  {getButtonText()}
                  <span className="ml-3 sm:ml-4 md:ml-6 group-hover:translate-x-3 transition-transform text-xl sm:text-2xl md:text-3xl lg:text-4xl">
                    {currentUser ? "📊" : "🚀"}
                  </span>
                </span>
                <div className="absolute inset-0 bg-white/30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="absolute -inset-2 sm:-inset-4 bg-lime-400/30 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-700"></div>
              </button>
              
              <p className="text-lime-300 text-lg sm:text-xl md:text-2xl font-semibold" 
                 style={{
                   textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Join professionals who've successfully transformed their careers with our complete growth ecosystem: AI guidance + real projects + badge validation ✨
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer - Enhanced */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mb-8 sm:mb-12">
            
            {/* Logo and Description */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start mb-4 sm:mb-6">
                <img 
                  src="/Images/512X512.png" 
                  alt="Favored Online Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mr-2 sm:mr-3 md:mr-4 transform hover:scale-110 transition-transform duration-300"
                />
                <span className="text-xl sm:text-2xl md:text-3xl font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                  Favored Online
                </span>
              </div>
              <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-sm mx-auto md:mx-0"
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                AI-powered career transformation with real projects and badge validation - completely free.
              </p>
            </div>

            {/* Quick Links */}
            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-lime-400 mb-4 sm:mb-6"
                  style={{
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to="/tech-badges" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Tech Badges
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-black text-lime-400 mb-4 sm:mb-6"
                  style={{
                    textShadow: '0 0 15px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Support & Legal
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link to="/career/support" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Support
                  </Link>
                </li>
                <li>
                  <Link to="/career/about" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/career/terms" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/career/privacy" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 sm:pt-8 text-center">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              
              {/* Copyright */}
              <p className="text-gray-300 text-sm sm:text-base" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                © {new Date().getFullYear()} Favored Online. All rights reserved.
              </p>

              {/* Social or Additional Info */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">🚀</span>
                <span className="text-gray-300 text-sm font-medium"
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Transforming Careers with AI
                </span>
                <span className="text-lime-400 text-lg sm:text-xl animate-pulse">✨</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
        @keyframes glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(76, 175, 80, 0.5)); }
          50% { filter: drop-shadow(0 0 40px rgba(76, 175, 80, 0.8)); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(76, 175, 80, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 175, 80, 0.7);
        }

        /* Enhanced touch targets for mobile */
        @media (max-width: 768px) {
          button, a, input, textarea {
            min-height: 44px;
          }
        }
        
        /* Gradient animations */
        @keyframes gradient-x {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(76, 175, 80, 0.6);
          }
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        /* Responsive text sizing improvements */
        @media (max-width: 640px) {
          .text-responsive {
            font-size: clamp(0.875rem, 2.5vw, 1rem);
          }
          .text-responsive-lg {
            font-size: clamp(1rem, 3vw, 1.25rem);
          }
          .text-responsive-xl {
            font-size: clamp(1.25rem, 4vw, 1.5rem);
          }
        }
        
        /* Enhanced button hover effects */
        .btn-enhanced:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        
        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }
        
        /* Focus styles for accessibility */
        button:focus,
        a:focus {
          outline: 2px solid rgba(76, 175, 80, 0.5);
          outline-offset: 2px;
        }
        
        /* Improved text shadow for better readability */
        .text-shadow-strong {
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
        }
        
        /* Card hover effects */
        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .card-hover:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        /* Glassmorphism effects */
        .glass {
          backdrop-filter: blur(20px);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Loading animations */
        @keyframes skeleton-loading {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200px 100%;
          animation: skeleton-loading 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default CareerHome;
