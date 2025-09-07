// src/Pages/projects/ProjectEditView.jsx - FIXED VERSION
// Edit Project Component for Project Owners

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { toast } from 'react-toastify';

const ProjectEditView = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // FIXED: Added missing state

  // Form data state
  const [formData, setFormData] = useState({
    projectTitle: '',
    projectDescription: '',
    projectType: '',
    timeline: '',
    experienceLevel: '',
    requiredSkills: '',
    projectGoals: '',
    budget: '',
    contactName: '',
    contactEmail: ''
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      console.log('🔍 Fetching project for editing:', projectId);
      
      const projectDoc = await getDoc(doc(db, 'client_projects', projectId));
      
      if (projectDoc.exists()) {
        const projectData = { id: projectDoc.id, ...projectDoc.data() };
        
        // Check if current user is the project owner
        if (currentUser?.email !== projectData.contactEmail) {
          console.error('❌ User is not project owner');
          setError('You do not have permission to edit this project');
          setLoading(false);
          return;
        }
        
        console.log('📊 Project data loaded for editing:', projectData);
        setProject(projectData);
        
        // Pre-populate form with existing data
        setFormData({
          projectTitle: projectData.projectTitle || '',
          projectDescription: projectData.projectDescription || '',
          projectType: projectData.projectType || '',
          timeline: projectData.timeline || '',
          experienceLevel: projectData.experienceLevel || '',
          requiredSkills: projectData.requiredSkills || '',
          projectGoals: projectData.projectGoals || '',
          budget: projectData.budget || '',
          contactName: projectData.contactName || '',
          contactEmail: projectData.contactEmail || ''
        });
      } else {
        console.error('❌ Project not found');
        setError('Project not found');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      setError('Failed to load project details');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('You must be logged in to edit projects');
      return;
    }

    // Validation
    if (!formData.projectTitle.trim() || !formData.projectDescription.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      console.log('💾 Updating project:', projectId);

      const updateData = {
        ...formData,
        projectTitle: formData.projectTitle.trim(),
        projectDescription: formData.projectDescription.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.email
      };

      await updateDoc(doc(db, 'client_projects', projectId), updateData);

      console.log('✅ Project updated successfully');
      toast.success('Project updated successfully!');
      
      // Redirect back to project details
      navigate(`/projects/${projectId}`);
      
    } catch (error) {
      console.error('❌ Error updating project:', error);
      toast.error('Failed to update project: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
          <p>Loading project data...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Cannot Edit Project</h2>
          <p className="text-gray-300 mb-6">{error || 'Project not found or access denied.'}</p>
          <div className="space-y-4">
            <Link 
              to="/projects/owner-dashboard"
              className="block bg-lime-500 hover:bg-lime-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              ← Back to My Projects
            </Link>
          </div>
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
      <main className="flex-grow pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
          
          {/* Back Navigation */}
          <div className="mb-6">
            <Link 
              to={`/projects/${projectId}`}
              className="text-lime-400 hover:text-lime-300 font-semibold transition-colors flex items-center"
            >
              ← Back to Project Details
            </Link>
          </div>

          {/* Edit Form */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 border border-white/20">
              
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
                  ✏️ Edit Project
                </h1>
                <p className="text-gray-300">
                  Update your project details to attract the right team members
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Project Title */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    name="projectTitle"
                    value={formData.projectTitle}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                    placeholder="Enter a compelling project title..."
                    required
                    maxLength={100}
                  />
                  <div className="text-right text-gray-400 text-xs mt-1">
                    {formData.projectTitle.length}/100 characters
                  </div>
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Project Description *
                  </label>
                  <textarea
                    name="projectDescription"
                    value={formData.projectDescription}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Describe your project in detail..."
                    required
                    maxLength={2000}
                  />
                  <div className="text-right text-gray-400 text-xs mt-1">
                    {formData.projectDescription.length}/2000 characters
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Project Type */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Project Type *
                    </label>
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      required
                    >
                      <option value="">Select project type</option>
                      <option value="Web Development">Web Development</option>
                      <option value="Mobile App">Mobile App</option>
                      <option value="AI/Machine Learning">AI/Machine Learning</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Game Development">Game Development</option>
                      <option value="Blockchain">Blockchain</option>
                      <option value="DevOps">DevOps</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Timeline */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Project Timeline *
                    </label>
                    <select
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      required
                    >
                      <option value="">Select timeline</option>
                      <option value="1-2 weeks">1-2 weeks</option>
                      <option value="3-4 weeks">3-4 weeks</option>
                      <option value="1-2 months">1-2 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6+ months">6+ months</option>
                    </select>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Experience Level *
                    </label>
                    <select
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      required
                    >
                      <option value="">Select experience level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Mixed Team">Mixed Team</option>
                    </select>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Budget (Optional)
                    </label>
                    <select
                      name="budget"
                      value={formData.budget}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                    >
                      <option value="">Select budget range</option>
                      <option value="$0 - Free Project">$0 - Free Project</option>
                    </select>
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Required Skills
                  </label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                    placeholder="e.g., React, Node.js, Python, UI/UX Design..."
                    maxLength={200}
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Separate skills with commas
                  </p>
                </div>

                {/* Project Goals */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Project Goals
                  </label>
                  <textarea
                    name="projectGoals"
                    value={formData.projectGoals}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="What do you hope to achieve with this project?"
                    maxLength={1000}
                  />
                  <div className="text-right text-gray-400 text-xs mt-1">
                    {formData.projectGoals.length}/1000 characters
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="Your name"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-4 pt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-lime-500 to-green-500 text-white px-8 py-4 rounded-xl font-bold hover:from-lime-600 hover:to-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                  >
                    {saving ? '💾 Updating...' : '💾 Update Project'}
                  </button>
                  
                  <Link 
                    to={`/projects/${projectId}`}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-bold transition-colors text-center"
                  >
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>

      {/* Custom Styles */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        * {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default ProjectEditView;
