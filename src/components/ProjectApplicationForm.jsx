// STEP 3: src/components/ProjectApplicationForm.jsx
// Updated to route applications to project owners instead of admin

import React, { useState } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

// UPDATED: Application submission that routes to PROJECT OWNER
const submitApplicationToProject = async (applicationData, projectId, applicantUser) => {
  try {
    console.log('📝 Submitting application to project owner...');
    
    // Get project data to find project owner
    const projectDoc = await getDoc(doc(db, 'client_projects', projectId));
    if (!projectDoc.exists()) {
      throw new Error('Project not found');
    }
    
    const projectData = projectDoc.data();
    console.log('📋 Project owner:', projectData.contactEmail);
    
    // Validate project is still accepting applications
    if (projectData.status === 'completed' || projectData.status === 'rejected') {
      throw new Error('This project is no longer accepting applications');
    }
    
    // Create application that routes to PROJECT OWNER (not admin)
    const applicationRef = await addDoc(collection(db, 'project_applications'), {
      // Application details
      applicantId: applicantUser.uid,
      applicantEmail: applicantUser.email,
      applicantName: applicantUser.displayName || applicationData.applicantName,
      
      // Project information
      projectId: projectId,
      projectTitle: projectData.projectTitle,
      projectOwnerEmail: projectData.contactEmail,  // Route to project owner
      projectOwnerName: projectData.contactName,
      
      // Application content
      experience: applicationData.experience,
      portfolio: applicationData.portfolio || '',
      interestedRole: applicationData.interestedRole || 'Developer',
      availableStart: applicationData.availableStart,
      motivation: applicationData.motivation || '',
      skills: applicationData.skills || [],
      
      // Status and routing
      status: 'submitted',
      submittedAt: serverTimestamp(),
      routedTo: 'project_owner',  // NOT admin
      requiresAdminApproval: false,  // Project owner handles this
      
      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Send notification to PROJECT OWNER (not admin)
    await addDoc(collection(db, 'notifications'), {
      recipientEmail: projectData.contactEmail,  // PROJECT OWNER gets notification
      recipientName: projectData.contactName,
      type: 'new_application',
      title: 'New Application to Your Project! 📝',
      message: `${applicantUser.displayName || applicationData.applicantName} has applied to join your project "${projectData.projectTitle}".`,
      projectId: projectId,
      projectTitle: projectData.projectTitle,
      applicationId: applicationRef.id,
      applicantName: applicantUser.displayName || applicationData.applicantName,
      applicantEmail: applicantUser.email,
      createdAt: serverTimestamp(),
      read: false,
      priority: 'normal'
    });

    // Optional: Send confirmation email to applicant
    await addDoc(collection(db, 'notifications'), {
      recipientEmail: applicantUser.email,
      recipientName: applicantUser.displayName || applicationData.applicantName,
      type: 'application_submitted',
      title: 'Application Submitted Successfully! ✅',
      message: `Your application to join "${projectData.projectTitle}" has been submitted to ${projectData.contactName}. You'll receive a notification when they respond.`,
      projectId: projectId,
      projectTitle: projectData.projectTitle,
      applicationId: applicationRef.id,
      createdAt: serverTimestamp(),
      read: false,
      priority: 'low'
    });

    console.log('✅ Application submitted to project owner (not admin)');
    toast.success(`Application submitted! ${projectData.contactName} will review your application.`);
    
    return { success: true, applicationId: applicationRef.id };
    
  } catch (error) {
    console.error('❌ Error submitting application:', error);
    toast.error('Error submitting application: ' + error.message);
    throw error;
  }
};

// Updated Application Form Component
const ProjectApplicationForm = ({ projectId, projectData, onClose, currentUser }) => {
  const [formData, setFormData] = useState({
    applicantName: currentUser?.displayName || '',
    experience: '',
    portfolio: '',
    interestedRole: 'Developer',
    availableStart: '',
    motivation: '',
    skills: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('Please log in to submit an application');
      return;
    }

    // Validation
    if (!formData.experience.trim()) {
      toast.error('Please describe your experience');
      return;
    }

    if (!formData.applicantName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    try {
      setSubmitting(true);
      
      // Submit application to project owner
      await submitApplicationToProject(formData, projectId, currentUser);
      
      // Close form on success
      onClose();
      
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Apply to Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        {/* Project Info */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h3 className="text-blue-400 font-semibold mb-2">📋 Applying to:</h3>
          <p className="text-white font-medium">{projectData.projectTitle}</p>
          <p className="text-gray-300 text-sm">by {projectData.contactName || projectData.companyName}</p>
          <div className="mt-2 text-sm text-gray-400 flex flex-wrap gap-4">
            <span>💼 {projectData.projectType}</span>
            <span>⏰ {projectData.timeline}</span>
            <span>👥 {projectData.experienceLevel}</span>
            {projectData.budget && <span>💰 {projectData.budget}</span>}
          </div>
        </div>

        {/* ENHANCED: Application routing info */}
        <div className="mb-6 p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl">
          <div className="flex items-center mb-2">
            <span className="text-lime-400 mr-2">📬</span>
            <h4 className="text-lime-300 font-semibold">Application Review Process</h4>
          </div>
          <div className="text-sm text-gray-300 space-y-1">
            <p>• Your application will be sent directly to <strong className="text-lime-300">{projectData.contactName}</strong></p>
            <p>• They will review and respond to your application</p>
            <p>• You'll receive a notification when they make a decision</p>
            <p>• No admin approval required - direct communication with project owner</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-white font-semibold mb-2">Your Name *</label>
            <input
              type="text"
              value={formData.applicantName}
              onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
              required
            />
          </div>

          {/* Role Interest */}
          <div>
            <label className="block text-white font-semibold mb-2">Interested Role *</label>
            <select
              value={formData.interestedRole}
              onChange={(e) => setFormData({...formData, interestedRole: e.target.value})}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
            >
              <option value="Developer">Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Quality Assurance">Quality Assurance</option>
              <option value="DevOps Engineer">DevOps Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Mobile Developer">Mobile Developer</option>
              <option value="Database Administrator">Database Administrator</option>
              <option value="Security Specialist">Security Specialist</option>
              <option value="Business Analyst">Business Analyst</option>
              <option value="Technical Writer">Technical Writer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Experience & Skills *
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: e.target.value})}
              placeholder="Describe your relevant experience, technical skills, and what you can contribute to this project..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
              rows={4}
              required
            />
            <p className="text-gray-400 text-sm mt-1">Include technologies, frameworks, and relevant project experience</p>
          </div>

          {/* Skills Tags */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Technical Skills (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a skill and press Enter"
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-lime-400 transition-colors"
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-lime-500/20 text-lime-300 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-lime-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Portfolio/GitHub URL (Optional)
            </label>
            <input
              type="url"
              value={formData.portfolio}
              onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
              placeholder="https://github.com/yourprofile or https://yourportfolio.com"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>

          {/* Availability */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Available Start Date
            </label>
            <input
              type="date"
              value={formData.availableStart}
              onChange={(e) => setFormData({...formData, availableStart: e.target.value})}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
            />
          </div>

          {/* Motivation */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Why are you interested in this project? (Optional)
            </label>
            <textarea
              value={formData.motivation}
              onChange={(e) => setFormData({...formData, motivation: e.target.value})}
              placeholder="What excites you about this project? How does it align with your goals?"
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400 transition-colors"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                '📝 Submit Application'
              )}
            </button>
          </div>
        </form>

        {/* Info footer */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
          <h4 className="text-gray-300 font-semibold mb-2">📋 What happens next?</h4>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Your application is sent directly to {projectData.contactName}</li>
            <li>• They'll review your experience and portfolio</li>
            <li>• You'll receive a notification when they respond</li>
            <li>• If approved, you'll be added to their project team</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// ALSO UPDATE: Project card component to show application routing info
const ProjectInfoCard = ({ project, onApply }) => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
      {/* Project content */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{project.projectTitle}</h3>
        <p className="text-gray-300 mb-4">{project.projectDescription}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
            {project.projectType}
          </span>
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
            {project.timeline}
          </span>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
            {project.experienceLevel}
          </span>
        </div>
      </div>

      {/* NEW: Application routing info */}
      <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex items-center mb-2">
          <span className="text-blue-400 mr-2">📬</span>
          <h4 className="text-blue-300 font-semibold text-sm">Application Process</h4>
        </div>
        <div className="text-gray-300 text-sm">
          <p><strong>Reviewed by:</strong> {project.contactName || project.companyName}</p>
          <p><strong>Response:</strong> Direct from project owner</p>
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={() => setShowApplicationForm(true)}
        className="w-full bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
      >
        Apply to Join Project
      </button>

      {/* Application form modal */}
      {showApplicationForm && (
        <ProjectApplicationForm
          projectId={project.id}
          projectData={project}
          onClose={() => setShowApplicationForm(false)}
          currentUser={null} // Pass actual currentUser here
        />
      )}
    </div>
  );
};

export default ProjectApplicationForm;
export { ProjectInfoCard, submitApplicationToProject };
