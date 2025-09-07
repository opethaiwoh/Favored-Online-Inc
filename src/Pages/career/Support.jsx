// src/Pages/career/Support.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Support = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [formStatus, setFormStatus] = useState({
    message: '',
    isError: false,
    isSubmitting: false,
    isSuccess: false
  });
  const formRef = useRef(null);
  const { currentUser, isAuthorized } = useAuth();

  // Form field values
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Honeypot field for bot detection
  
  // Math captcha states
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, operation: '+', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');

  // Google Form entry IDs (same as contact form)
  const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd3rlMMv45Bco1flqMeqet8hLzu4kxFMyBBrBaNQbXaHW4ANg/formResponse';
  const FIRST_NAME_ID = 'entry.1967055698';
  const LAST_NAME_ID = 'entry.505850385';
  const EMAIL_ID = 'entry.1357128031';
  const CONTACT_NO_ID = 'entry.1028687531';
  const MESSAGE_ID = 'entry.474983796';

  // Generate new math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const operations = ['+', '-', '*'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let correctAnswer;
    switch (operation) {
      case '+':
        correctAnswer = num1 + num2;
        break;
      case '-':
        correctAnswer = num1 - num2;
        break;
      case '*':
        correctAnswer = num1 * num2;
        break;
      default:
        correctAnswer = num1 + num2;
    }

    setCaptcha({
      num1,
      num2,
      operation,
      answer: correctAnswer
    });
    setUserAnswer('');
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Generate initial captcha
    generateCaptcha();
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Honeypot check - if filled, it's likely a bot
    if (honeypot) {
      setFormStatus({
        message: 'There was an error sending your message. Please try again later.',
        isError: true,
        isSubmitting: false,
        isSuccess: false
      });
      generateCaptcha();
      return;
    }

    // Math captcha validation
    const userAnswerNumber = parseInt(userAnswer.trim(), 10);
    if (isNaN(userAnswerNumber) || userAnswerNumber !== captcha.answer) {
      setFormStatus({
        message: 'Please solve the math problem correctly to verify you are human.',
        isError: true,
        isSubmitting: false,
        isSuccess: false
      });
      generateCaptcha();
      return;
    }

    setFormStatus({
      message: '',
      isError: false,
      isSubmitting: true,
      isSuccess: false
    });

    // Create form data for submission
    const formData = new FormData();
    formData.append(FIRST_NAME_ID, firstName);
    formData.append(LAST_NAME_ID, lastName);
    formData.append(EMAIL_ID, email);
    formData.append(CONTACT_NO_ID, contactNo);
    formData.append(MESSAGE_ID, `[SUPPORT REQUEST] ${message}`); // Prefix to distinguish from hiring inquiries

    // Submit the form using an iframe to avoid CORS issues
    try {
      // Create a hidden iframe for submission
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Wait for iframe to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        // Set up the form within the iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const iframeForm = iframeDoc.createElement('form');
        iframeForm.action = FORM_URL;
        iframeForm.method = 'POST';
        
        // Add form fields
        Object.entries({
          [FIRST_NAME_ID]: firstName,
          [LAST_NAME_ID]: lastName,
          [EMAIL_ID]: email,
          [CONTACT_NO_ID]: contactNo,
          [MESSAGE_ID]: `[SUPPORT REQUEST] ${message}`
        }).forEach(([name, value]) => {
          const input = iframeDoc.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          iframeForm.appendChild(input);
        });
        
        iframeDoc.body.appendChild(iframeForm);
        iframeForm.submit();
      });
      
      // Success state
      setFormStatus({
        message: 'Your support request has been submitted successfully! We aim to respond to all queries within 5 business days. Thank you for your patience.',
        isError: false,
        isSubmitting: false,
        isSuccess: true
      });
      
      // Reset form fields
      setFirstName('');
      setLastName('');
      setEmail('');
      setContactNo('');
      setMessage('');
      setHoneypot('');
      setUserAnswer('');
      
      // Generate new captcha for next submission
      generateCaptcha();
      
      // Remove iframe after submission
      document.body.removeChild(iframe);
    } catch (error) {
      setFormStatus({
        message: 'There was an error sending your message. Please try again later.',
        isError: true,
        isSubmitting: false,
        isSuccess: false
      });
      generateCaptcha();
      console.error('Form submission error:', error);
    }
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
          
          {/* Hero Section */}
          <section className="relative mb-16 sm:mb-24 md:mb-32 pt-8 sm:pt-12 md:pt-20">
            <div className="max-w-6xl mx-auto text-center">
              
              {/* Animated Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-pulse">
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em sm:0.2em'
                      }}>
                  🛠️ We're Here to Help You Succeed
                </span>
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Get the{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Support You Need
                </span>
              </h1>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
              
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-8 sm:mb-12 md:mb-16 text-gray-100 max-w-5xl mx-auto leading-relaxed font-light px-4"
                 style={{
                   textShadow: '0 0 20px rgba(255,255,255,0.1), 2px 2px 8px rgba(0,0,0,0.9)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                We value your feedback and are here to help with any issues you encounter on your 
                <span className="text-lime-300 font-semibold"> tech career journey</span>. Whether you need technical assistance, 
                <span className="text-green-300 font-semibold"> have questions about our badge system</span>, or want to report a bug, 
                <span className="text-emerald-300 font-semibold"> our team is ready to assist</span>.
              </p>
              
              {/* Floating Elements - Hidden on very small screens */}
              <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-lime-400/20 rounded-full blur-xl animate-bounce"></div>
              <div className="hidden sm:block absolute bottom-20 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="hidden sm:block absolute top-1/2 left-1/4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl animate-ping"></div>
            </div>
          </section>

          {/* Support Categories Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                  style={{
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                How Can We{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Help You Today?
                </span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
              {[
                {
                  icon: "🐛",
                  title: "Bug Reports",
                  description: "Found a technical issue? Report bugs, glitches, or unexpected behavior to help us improve your experience.",
                  gradient: "from-red-400 to-pink-500"
                },
                {
                  icon: "❓",
                  title: "General Questions",
                  description: "Have questions about our platform, badge system, or how to get started? We're here to guide you.",
                  gradient: "from-blue-400 to-purple-500"
                },
                {
                  icon: "🚀",
                  title: "Project Assistance",
                  description: "Need help with project submissions, team collaboration, or understanding project requirements? We've got you covered.",
                  gradient: "from-lime-400 to-green-500"
                },
                {
                  icon: "🏆",
                  title: "Badge System Support",
                  description: "Questions about earning badges, skill validation, or tracking your progress? Learn more about our certification process.",
                  gradient: "from-yellow-400 to-orange-500"
                },
                {
                  icon: "🔧",
                  title: "Technical Issues",
                  description: "Experiencing login problems, dashboard issues, or other technical difficulties? We'll troubleshoot with you.",
                  gradient: "from-green-400 to-emerald-500"
                },
                {
                  icon: "💡",
                  title: "Feature Requests",
                  description: "Have ideas for new features or improvements? Share your suggestions to help us build a better platform.",
                  gradient: "from-purple-400 to-indigo-500"
                }
              ].map((category, index) => (
                <div key={index} 
                     className="group transform hover:scale-105 transition-all duration-500 cursor-pointer">
                  
                  <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl h-full flex flex-col">
                    
                    {/* Icon */}
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6 text-center transform group-hover:scale-125 transition-all duration-500"
                         style={{filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.8))'}}>
                      {category.icon}
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-xl sm:text-2xl font-black mb-4 sm:mb-6 text-white group-hover:text-lime-300 transition-colors duration-500 text-center" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      {category.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-200 leading-relaxed text-center text-sm sm:text-base flex-grow" 
                       style={{
                         textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      {category.description}
                    </p>
                    
                    {/* Animated Underline */}
                    <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${category.gradient} transition-all duration-700 mt-6 rounded-full`}
                         style={{boxShadow: `0 0 20px rgba(76, 175, 80, 0.8)`}}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Response Time Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl overflow-hidden transform hover:scale-105 transition-all duration-500">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 p-6 sm:p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 animate-pulse"></div>
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 md:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Our Commitment to You
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 font-light leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    We understand that timely support is crucial for your learning journey:
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8 md:p-12">
                <div className="max-w-2xl mx-auto">
                  
                  {/* Response Time */}
                  <div className="group transform hover:scale-105 transition-all duration-500">
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-blue-500/20 h-full">
                      <div className="flex items-center mb-4 sm:mb-6 md:mb-8 justify-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl md:text-3xl mr-3 sm:mr-4 md:mr-6 shadow-2xl transform group-hover:rotate-12 transition-transform duration-500">
                          ⏰
                        </div>
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white" 
                            style={{
                              textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          Response Time
                        </h3>
                      </div>
                      
                      <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-4 sm:mb-5 md:mb-6 leading-relaxed font-light text-center" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        We aim to respond to all support queries within <span className="text-blue-400 font-bold">5 business days</span>.
                      </p>
                      
                      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-white/20">
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg text-center" 
                           style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                          <span className="font-bold text-blue-300">Priority Support:</span> Critical issues and bugs are addressed within 24-48 hours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Support Form Section */}
          <section className="mb-16 sm:mb-24 md:mb-32">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500">
              
              <div className="text-center mb-8 sm:mb-10 md:mb-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6 md:mb-8" 
                    style={{
                      textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Submit Your{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                    Support Request
                  </span>
                </h2>
                <p className="text-gray-200 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed" 
                   style={{
                     textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                     fontFamily: '"Inter", sans-serif'
                   }}>
                  Describe the issue you're experiencing or the assistance you need. Be as detailed as possible to help us provide the best support.
                </p>
              </div>
              
              {formStatus.message && (
                <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl sm:rounded-2xl backdrop-blur-sm border transition-all duration-500 ${
                  formStatus.isError 
                    ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                    : 'bg-green-500/20 text-green-300 border-green-500/30'
                }`}>
                  <p className="text-base sm:text-lg md:text-xl font-medium" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    {formStatus.message}
                  </p>
                </div>
              )}
              
              <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Honeypot field - hidden from users, catches bots */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    opacity: 0,
                    pointerEvents: 'none',
                    tabIndex: -1
                  }}
                  tabIndex="-1"
                  autoComplete="off"
                />
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="group">
                    <label htmlFor="firstName" className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg"
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-300 text-base sm:text-lg font-medium"
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                      placeholder="Your first name"
                      required
                    />
                  </div>
                  
                  <div className="group">
                    <label htmlFor="lastName" className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg"
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-300 text-base sm:text-lg font-medium"
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                      placeholder="Your last name"
                      required
                    />
                  </div>
                  
                  <div className="group">
                    <label htmlFor="email" className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg"
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-300 text-base sm:text-lg font-medium"
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  
                  <div className="group">
                    <label htmlFor="contactNo" className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg"
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                      Contact Number (Optional)
                    </label>
                    <input
                      type="tel"
                      id="contactNo"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-300 text-base sm:text-lg font-medium"
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                      placeholder="Your contact number"
                    />
                  </div>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="group">
                    <label htmlFor="message" className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg"
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                      Describe Your Issue or Question <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full h-[150px] sm:h-[180px] md:h-[200px] px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-300 text-base sm:text-lg font-medium resize-none"
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                      placeholder="Please provide as much detail as possible about the issue you're experiencing, the steps you've taken, what you expected to happen, and what actually happened. If it's a bug, include any error messages you've seen."
                      required
                    ></textarea>
                  </div>
                  
                  {/* Math Captcha */}
                  <div className="group">
                    <label htmlFor="captcha" className="block text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg"
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                      Verify you are human <span className="text-red-400">*</span>
                    </label>
                    
                    {/* Math Problem Display */}
                    <div className="bg-gradient-to-r from-lime-500/10 to-green-500/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-lime-500/20 mb-3 sm:mb-4">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-4 flex-wrap">
                        <span className="text-2xl sm:text-3xl font-black text-white"
                              style={{
                                textShadow: '0 0 10px rgba(255,255,255,0.3)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                          {captcha.num1}
                        </span>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-lime-400"
                              style={{
                                textShadow: '0 0 15px rgba(76, 175, 80, 0.8)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                          {captcha.operation}
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-white"
                              style={{
                                textShadow: '0 0 10px rgba(255,255,255,0.3)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                          {captcha.num2}
                        </span>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-lime-400"
                              style={{
                                textShadow: '0 0 15px rgba(76, 175, 80, 0.8)',
                                fontFamily: '"Inter", sans-serif'
                              }}>
                          =
                        </span>
                        <span className="text-2xl sm:text-3xl font-black text-gray-400">
                          ?
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9-]*"
                        id="captcha"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all duration-300 text-base sm:text-lg font-medium text-center"
                        style={{
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          fontFamily: '"Inter", sans-serif'
                        }}
                        placeholder="Your answer"
                        maxLength="4"
                        autoComplete="off"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateCaptcha}
                        className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-yellow-400 px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 border border-yellow-500/30 font-semibold backdrop-blur-sm text-lg sm:text-xl"
                        title="Generate new problem"
                      >
                        🔄
                      </button>
                    </div>
                    
                    <p className="text-gray-400 text-xs sm:text-sm mt-2" 
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Solve the math problem above to verify you are human
                    </p>
                  </div>
                </div>
                
                <div className="lg:col-span-2 flex justify-center mt-6 sm:mt-8">
                  <button
                    type="submit"
                    disabled={formStatus.isSubmitting}
                    className={`group relative bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-full font-black text-lg sm:text-xl md:text-2xl transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden w-full sm:w-auto ${
                      formStatus.isSubmitting ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''
                    }`}
                    style={{
                      boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="relative flex items-center justify-center">
                      {formStatus.isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2 sm:mr-4 text-xl sm:text-2xl md:text-3xl">⟳</span>
                          Submitting Request...
                        </>
                      ) : (
                        <>
                          Submit Support Request
                          <span className="ml-2 sm:ml-4 group-hover:translate-x-2 transition-transform text-xl sm:text-2xl md:text-3xl">🛠️</span>
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              </form>
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
                <li>
                  <Link to="/career/contact" className="text-gray-300 hover:text-lime-400 transition-colors duration-300 text-sm sm:text-base font-medium"
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Hire Talents
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
      `}</style>
    </div>
  );
};

export default Support;
