// src/Pages/career/ProjectEnrollmentPage.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // FIXED: Added missing imports

const ProjectEnrollmentPage = () => {
  const navigate = useNavigate(); // FIXED: Added missing navigate hook
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock user data for demo purposes
  const currentUser = null; // Set to null for demo, or use: { displayName: "Demo User", photoURL: null, email: "demo@example.com" }
  const isAuthorized = false;

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Define project categories
  const categories = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'join', name: 'Join Projects', icon: '🤝' },
    { id: 'ongoing', name: 'Ongoing Projects', icon: '🚀' },
    { id: 'completed', name: 'Completed Projects', icon: '✅' },
    { id: 'repository', name: 'Project Repository', icon: '📁' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ongoing':
        return (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 animate-bounce" 
                   style={{filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))'}}>
                🚀
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8" 
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Are You Currently{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-500">
                  Enrolled?
                </span>
              </h3>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-12 leading-relaxed font-light" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Choose your next step based on your current project status
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                {/* YES - Already Enrolled */}
                <div className="group transform hover:scale-105 transition-all duration-500">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-green-500/30 shadow-2xl h-full">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl mb-6 group-hover:scale-110 transition-transform duration-500"
                           style={{filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.8))'}}>
                        ✅
                      </div>
                      
                      <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-6 group-hover:text-green-300 transition-colors duration-500" 
                          style={{
                            textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        YES, I'm Enrolled!
                      </h4>
                      
                      <p className="text-gray-200 text-base sm:text-lg mb-8 leading-relaxed" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        Perfect! Join your team on Discord and start collaborating with your project members.
                      </p>
                      
                      <a
                        href="https://discord.gg/529vW5DaNh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group-inner relative inline-flex items-center px-6 sm:px-8 py-4 sm:py-5 border border-transparent text-base sm:text-lg font-black rounded-full text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden w-full"
                        style={{
                          boxShadow: '0 0 40px rgba(34, 197, 94, 0.6)',
                          fontFamily: '"Inter", sans-serif'
                        }}
                      >
                        <svg className="w-5 h-5 mr-3 relative" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <span className="relative">Join Your Team</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* NO - Not Enrolled */}
                <div className="group transform hover:scale-105 transition-all duration-500">
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-blue-500/30 shadow-2xl h-full">
                    <div className="text-center">
                      <div className="text-5xl sm:text-6xl mb-6 group-hover:scale-110 transition-transform duration-500"
                           style={{filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))'}}>
                        📝
                      </div>
                      
                      <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-6 group-hover:text-blue-300 transition-colors duration-500" 
                          style={{
                            textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        NO, I'm Not Enrolled
                      </h4>
                      
                      <p className="text-gray-200 text-base sm:text-lg mb-8 leading-relaxed" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        No problem! Apply for a project or submit your own project idea to get started.
                      </p>
                      
                      <Link
                        to="/projects"
                        className="group-inner relative inline-flex items-center px-6 sm:px-8 py-4 sm:py-5 border border-transparent text-base sm:text-lg font-black rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden w-full"
                        style={{
                          boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)',
                          fontFamily: '"Inter", sans-serif'
                        }}
                      >
                        <svg className="w-5 h-5 mr-3 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="relative">Apply or Submit Project</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'completed':
        return (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 animate-bounce" 
                   style={{filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.6))'}}>
                🎉
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8" 
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Project{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-green-500">
                  Completed?
                </span>
              </h3>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-12 leading-relaxed font-light" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Are you done with your project and have uploaded all necessary files to the repository?
              </p>

              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-amber-500/30 shadow-2xl mb-8 sm:mb-12">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-5xl mr-4" 
                       style={{filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))'}}>
                    📋
                  </div>
                  <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Ready to Submit?
                  </h4>
                </div>
                
                <p className="text-gray-200 text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed text-center" 
                   style={{
                     textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                     fontFamily: '"Inter", sans-serif'
                   }}>
                  If yes, click here to submit your project for final review and completion.
                </p>

                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfAXo-wxu42mqatBk5WKkBlcqxNph2PVV2HMtQZVJf6oOP2gA/viewform?usp=sharing&ouid=109164778386207080679"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center px-8 sm:px-12 py-4 sm:py-6 border border-transparent text-lg sm:text-xl font-black rounded-full text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 0 60px rgba(34, 197, 94, 0.6)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <svg className="w-6 h-6 mr-3 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="relative">Click Here to Submit Your Project</span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </a>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-blue-500/20">
                <p className="text-gray-300 text-sm sm:text-base" 
                   style={{
                     textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                     fontFamily: '"Inter", sans-serif'
                   }}>
                  <strong className="text-blue-300">Note:</strong> Make sure all your code, documentation, and project files are uploaded to your assigned repository before submitting.
                </p>
              </div>

              {/* Badge Reward Section */}
              <div className="mt-6 sm:mt-8">
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-amber-500/30 shadow-xl">
                  <div className="flex items-center justify-center mb-4 sm:mb-6">
                    <div className="text-3xl sm:text-4xl mr-3 sm:mr-4" 
                         style={{filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))'}}>
                      🏆
                    </div>
                    <h5 className="text-xl sm:text-2xl md:text-3xl font-black text-white" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Achievement Reward
                    </h5>
                  </div>
                  
                  <p className="text-center text-gray-200 text-base sm:text-lg leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    <span className="font-bold text-amber-300">🎖️ Once your contribution is verified</span>, you will receive your 
                    <span className="font-bold text-yellow-300"> achievement badge via email</span> as recognition for your successful project completion!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'repository':
        return (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 animate-bounce" 
                   style={{filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.6))'}}>
                📁
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8" 
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Project{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-purple-500">
                  Repository
                </span>
              </h3>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-12 leading-relaxed font-light" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Access your project repository on GitHub
              </p>

              <div className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-purple-500/30 shadow-2xl mb-8 sm:mb-12">
                <div className="flex items-center justify-center mb-6 sm:mb-8">
                  <div className="text-4xl sm:text-5xl mr-4" 
                       style={{filter: 'drop-shadow(0 0 20px rgba(168, 85, 247, 0.8))'}}>
                    🚀
                  </div>
                  <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Find Your Repository
                  </h4>
                </div>
                
                <p className="text-gray-200 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed text-center" 
                   style={{
                     textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                     fontFamily: '"Inter", sans-serif'
                   }}>
                  Click the link below to find your project repository. If not found, reach out to your product lead to create the repository and add you to the project. If the project is yet to start, wait till then.
                </p>

                <a
                  href="https://github.com/FavoredOnlineInc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center px-8 sm:px-12 py-4 sm:py-6 border border-transparent text-lg sm:text-xl font-black rounded-full text-white bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 0 60px rgba(168, 85, 247, 0.6)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <svg className="w-6 h-6 mr-3 relative" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="relative">Visit GitHub Repository</span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-blue-500/20">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">❓</span>
                    <h5 className="text-lg font-black text-white">Repository Not Found?</h5>
                  </div>
                  <p className="text-gray-300 text-sm" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Contact your product lead to create the repository and add you to the project.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-amber-500/20">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">⏳</span>
                    <h5 className="text-lg font-black text-white">Project Not Started?</h5>
                  </div>
                  <p className="text-gray-300 text-sm" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    If the project hasn't started yet, please wait until the project kickoff.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'join':
        return (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 animate-bounce" 
                   style={{filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))'}}>
                🤝
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8" 
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Join{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-400 to-blue-500">
                  Projects
                </span>
              </h3>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-12 leading-relaxed font-light" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Ready to dive into exciting projects and make an impact?
              </p>

              <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-blue-500/30 shadow-2xl mb-8 sm:mb-12">
                <div className="flex items-center justify-center mb-6 sm:mb-8">
                  <div className="text-4xl sm:text-5xl mr-4" 
                       style={{filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8))'}}>
                    💡
                  </div>
                  <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-white" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Two Amazing Opportunities
                  </h4>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">🎯</span>
                      <h5 className="text-lg sm:text-xl font-black text-white">Join a Project</h5>
                    </div>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed" 
                       style={{
                         textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      Looking for a project to join? Browse available opportunities and collaborate with talented teams on innovative solutions.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                    <div className="flex items-center mb-4">
                      <span className="text-3xl mr-3">👑</span>
                      <h5 className="text-lg sm:text-xl font-black text-white">Become a Product Owner</h5>
                    </div>
                    <p className="text-gray-300 text-sm sm:text-base leading-relaxed" 
                       style={{
                         textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      Have an amazing project idea? Submit your project proposal and lead a team of skilled developers to bring your vision to life.
                    </p>
                  </div>
                </div>

                <p className="text-gray-200 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed text-center" 
                   style={{
                     textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                     fontFamily: '"Inter", sans-serif'
                   }}>
                  Whether you're looking to contribute your skills to an existing project or lead your own initiative, we have the perfect opportunity for you. Join our community of innovators and builders!
                </p>

                <Link
                  to="/projects"
                  className="group relative inline-flex items-center px-8 sm:px-12 py-4 sm:py-6 border border-transparent text-lg sm:text-xl font-black rounded-full text-white bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-500 transform hover:scale-110 shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: '0 0 60px rgba(59, 130, 246, 0.6)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <svg className="w-6 h-6 mr-3 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="relative">Get Started - Explore Projects</span>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </Link>
              </div>

              {/* Tech Badges Section */}
              <div className="mb-8 sm:mb-12">
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-amber-500/30 shadow-2xl">
                  <div className="flex items-center justify-center mb-6 sm:mb-8">
                    <div className="text-4xl sm:text-5xl mr-4" 
                         style={{filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.8))'}}>
                      🏆
                    </div>
                    <h4 className="text-2xl sm:text-3xl md:text-4xl font-black text-white" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Tech Talent Badges
                    </h4>
                  </div>
                  
                  <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed text-center" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Our <span className="font-bold text-amber-300">tech badges</span> help you build an impressive portfolio, enhance your technical skills, and position yourself for greater career opportunities. Badges are awarded based on successfully completed projects - 
                    <span className="font-bold text-yellow-300"> showcase your achievements</span> and 
                    <span className="font-bold text-orange-300"> build your professional reputation</span> in the tech industry.
                  </p>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 mb-6 sm:mb-8">
                    <div className="flex items-center justify-center mb-4 sm:mb-6">
                      <span className="text-3xl mr-3">💡</span>
                      <h5 className="text-lg sm:text-xl md:text-2xl font-black text-white">
                        Before You Enroll
                      </h5>
                    </div>
                    
                    <p className="text-gray-200 text-sm sm:text-base md:text-lg leading-relaxed text-center mb-6 sm:mb-8" 
                       style={{
                         textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      Take time to understand how our tech badge system works, explore the different badge categories tailored to your specific career path, and learn about the progressive badge advancement system that grows with your expertise.
                    </p>

                    <Link
                      to="/tech-badges"
                      className="group relative inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 border border-transparent text-base sm:text-lg font-bold rounded-full text-white bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-500 transform hover:scale-105 shadow-xl overflow-hidden mx-auto"
                      style={{
                        boxShadow: '0 0 40px rgba(245, 158, 11, 0.5)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      <svg className="w-5 h-5 mr-2 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="relative">Learn About Tech Badges</span>
                      <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">🎯</span>
                        <h6 className="text-sm sm:text-base font-black text-white">Career Focused</h6>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        Badges tailored to specific career paths and skill tracks.
                      </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">📈</span>
                        <h6 className="text-sm sm:text-base font-black text-white">Progressive System</h6>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        Advance through badge levels as your skills develop.
                      </p>
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                      <div className="flex items-center mb-3">
                        <span className="text-2xl mr-3">🌟</span>
                        <h6 className="text-sm sm:text-base font-black text-white">Industry Recognition</h6>
                      </div>
                      <p className="text-gray-300 text-xs sm:text-sm" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                        Showcase verified achievements to potential employers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-green-500/20">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🌟</span>
                    <h5 className="text-base sm:text-lg font-black text-white">Skill Growth</h5>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Learn new technologies and enhance your portfolio with real-world projects.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-purple-500/20">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🤝</span>
                    <h5 className="text-base sm:text-lg font-black text-white">Team Collaboration</h5>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Work with diverse, talented teams and build lasting professional connections.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-xl p-4 sm:p-6 border border-amber-500/20">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-3">🚀</span>
                    <h5 className="text-base sm:text-lg font-black text-white">Innovation</h5>
                  </div>
                  <p className="text-gray-300 text-xs sm:text-sm" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Turn your innovative ideas into reality with our supportive ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'overview':
      default:
        return (
          <div className="text-center py-16 sm:py-20">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
              <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 animate-bounce" 
                   style={{filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.6))'}}>
                🎯
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-6 sm:mb-8" 
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Project{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Overview
                </span>
              </h3>
              
              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-8 sm:mb-12 leading-relaxed font-light" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Welcome to your project dashboard. Navigate through different sections to manage your project journey.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[
                  {
                    icon: '🤝',
                    title: 'Join Projects',
                    description: 'Browse available projects or submit your own project idea to become a product owner.',
                    color: 'from-blue-500/20 to-purple-500/20',
                    borderColor: 'border-blue-500/30'
                  },
                  {
                    icon: '🚀',
                    title: 'Ongoing Projects',
                    description: 'Check your current enrollment status and join your team on Discord.',
                    color: 'from-indigo-500/20 to-blue-500/20',
                    borderColor: 'border-indigo-500/30'
                  },
                  {
                    icon: '✅',
                    title: 'Completed Projects',
                    description: 'Submit your finished project for final review and completion.',
                    color: 'from-green-500/20 to-emerald-500/20',
                    borderColor: 'border-green-500/30'
                  },
                  {
                    icon: '📁',
                    title: 'Project Repository',
                    description: 'Access your GitHub repository for code collaboration and version control.',
                    color: 'from-purple-500/20 to-pink-500/20',
                    borderColor: 'border-purple-500/30'
                  },
                  {
                    icon: '📊',
                    title: 'Project Overview',
                    description: 'Get a comprehensive view of all your project activities and progress.',
                    color: 'from-lime-500/20 to-green-500/20',
                    borderColor: 'border-lime-500/30'
                  }
                ].map((item, index) => (
                  <div key={index} className={`group transform hover:scale-105 transition-all duration-500`}>
                    <div className={`bg-gradient-to-br ${item.color} backdrop-blur-xl rounded-2xl p-6 sm:p-8 border ${item.borderColor} shadow-2xl h-full`}>
                      <div className="text-center">
                        <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">
                          {item.icon}
                        </div>
                        
                        <h4 className="text-xl sm:text-2xl font-black text-white mb-4 group-hover:text-lime-300 transition-colors duration-500" 
                            style={{
                              textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          {item.title}
                        </h4>
                        
                        <p className="text-gray-200 text-sm sm:text-base leading-relaxed" 
                           style={{
                             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                             fontFamily: '"Inter", sans-serif'
                           }}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
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
      
      {/* Enhanced Header */}
      <div className="relative z-20 pt-16 sm:pt-20 md:pt-24">
        <div 
          className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl border-b border-white/20 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, transparent 100%)'
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
            
            {/* Hero Section */}
            <div className="text-center mb-8 sm:mb-12 md:mb-16">
              {/* Animated Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 animate-pulse">
                <div className="h-2 w-2 sm:h-3 sm:w-3 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em'
                      }}>
                  📋 Project Management Hub
                </span>
                <div className="h-2 w-2 sm:h-3 sm:w-3 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>

              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-4 sm:mb-6 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Project{' '}
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Dashboard
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light max-w-4xl mx-auto mb-8 sm:mb-10" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Manage your projects, track progress, and collaborate with your team
              </p>

              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-grow relative z-10">
        <div className="container mx-auto py-8 sm:py-12 px-4 sm:px-6 max-w-7xl">
          
          {/* Back to Dashboard Button */}
          <div className="mb-6 sm:mb-8">
            <Link
              to="/career/dashboard"
              className="group inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
              style={{
                boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                fontFamily: '"Inter", sans-serif'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Enhanced Category Tabs */}
          <div className="mb-12 sm:mb-16">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/20 shadow-2xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-6 sm:mb-8 text-center" 
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Navigate Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500">
                  Projects
                </span>
              </h2>
              
              <div className="overflow-x-auto">
                <div className="flex space-x-3 sm:space-x-4 min-w-max justify-center px-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.id)}
                      className={`group relative px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-500 transform hover:scale-105 min-w-max ${
                        activeTab === category.id
                          ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white shadow-2xl'
                          : 'bg-white/10 backdrop-blur-sm text-gray-200 hover:bg-white/20 border border-white/20'
                      }`}
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                        boxShadow: activeTab === category.id ? '0 0 30px rgba(76, 175, 80, 0.4)' : 'none'
                      }}
                    >
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <span className="text-lg sm:text-xl md:text-2xl transform group-hover:scale-125 transition-transform duration-300">
                          {category.icon}
                        </span>
                        <span className="text-sm sm:text-base md:text-lg font-black whitespace-nowrap">
                          {category.name}
                        </span>
                      </div>
                      
                      {activeTab === category.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl sm:rounded-2xl animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </main>

      {/* Footer */}
      <footer style={{background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)'}} 
              className="text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
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
          <p className="text-gray-300 text-sm sm:text-base md:text-lg" 
             style={{
               textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
               fontFamily: '"Inter", sans-serif'
             }}>
            © {new Date().getFullYear()} Favored Online. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Custom Styles */}
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

export default ProjectEnrollmentPage;
