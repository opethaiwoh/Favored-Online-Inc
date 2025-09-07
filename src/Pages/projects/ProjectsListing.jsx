// src/Pages/projects/ProjectsListing.jsx - PREVIEW MODE WITH WORKING MODAL
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

// EMAIL NOTIFICATION HELPER FUNCTION
const sendEmailNotification = async (endpoint, data) => {
  try {
    console.log(`📧 Sending email notification via ${endpoint}...`);
    
    const response = await fetch(`/api/notifications/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Email notification sent successfully:`, result.results);
      return { success: true, results: result.results };
    } else {
      console.error(`❌ Email notification failed:`, result.error);
      return { success: false, error: result.error };
    }
    
  } catch (error) {
    console.error(`💥 Error sending email notification:`, error);
    return { success: false, error: error.message };
  }
};

const ProjectsListing = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [appliedProjects, setAppliedProjects] = useState(new Set());
  const [selectedFilters, setSelectedFilters] = useState({
    projectType: '',
    timeline: '',
    status: '',
    experienceLevel: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [applicationData, setApplicationData] = useState({
    applicantName: '',
    applicantEmail: '',
    experience: '',
    portfolio: '',
    proposal: ''
  });
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [selectedProjectForDetails, setSelectedProjectForDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Create URL slug from project title and company name
  const createProjectSlug = (project) => {
    const projectTitle = project.projectTitle || '';
    const companyName = project.companyName || project.contactName || '';
    
    const combined = `${projectTitle} ${companyName}`.trim();
    
    if (!combined) {
      return `project-${project.id}`;
    }
    
    const slug = combined
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return slug || `project-${project.id}`;
  };

  // Helper function to check if current user owns the project
  const isProjectOwner = (project) => {
    if (!currentUser || !project) return false;
    
    if (project.submitterId && currentUser.uid === project.submitterId) {
      return true;
    }
    
    if (project.submitterEmail && currentUser.email === project.submitterEmail) {
      return true;
    }
    
    if (project.contactEmail && currentUser.email === project.contactEmail) {
      return true;
    }
    
    return false;
  };

  // Show project details in modal
  const handleViewProject = (project) => {
    setSelectedProjectForDetails(project);
    setShowDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProjectForDetails(null);
  };

  // Helper function to validate and format project URLs
  const formatProjectUrl = (url) => {
    if (!url) return null;
    
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  // Handle external project URL click
  const handleProjectUrlClick = (url, e) => {
    e.stopPropagation();
    const formattedUrl = formatProjectUrl(url);
    if (formattedUrl) {
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper function to get project type icon
  const getProjectTypeIcon = (projectType) => {
    switch(projectType) {
      case 'web-development': return '🌐';
      case 'mobile-app': return '📱';
      case 'ai-ml': return '🤖';
      case 'blockchain': return '⛓️';
      case 'game-development': return '🎮';
      case 'data-analysis': return '📊';
      case 'desktop-software': return '💻';
      default: return '🚀';
    }
  };

  // Helper function to get status badge info
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return { 
          label: '✅ APPROVED', 
          className: 'bg-green-500/90 text-green-100 border-green-400/30',
          textColor: 'text-green-300'
        };
      case 'pending_approval':
        return { 
          label: '⏳ PENDING', 
          className: 'bg-yellow-500/90 text-yellow-100 border-yellow-400/30',
          textColor: 'text-yellow-300'
        };
      case 'rejected':
        return { 
          label: '❌ REJECTED', 
          className: 'bg-red-500/90 text-red-100 border-red-400/30',
          textColor: 'text-red-300'
        };
      case 'draft':
        return { 
          label: '📝 DRAFT', 
          className: 'bg-gray-500/90 text-gray-100 border-gray-400/30',
          textColor: 'text-gray-300'
        };
      default:
        return { 
          label: '❓ UNKNOWN', 
          className: 'bg-gray-500/90 text-gray-100 border-gray-400/30',
          textColor: 'text-gray-300'
        };
    }
  };

  // Helper function to check if project is valid
  const isValidProject = (item) => {
    if (!item) return false;
    
    const hasProjectTitle = item.projectTitle && item.projectTitle.trim().length > 0;
    const hasProjectDescription = item.projectDescription && item.projectDescription.trim().length > 0;
    
    if (!hasProjectTitle && !hasProjectDescription) return false;
    
    if (item.type === 'event') return false;
    
    if (item.eventTitle && !hasProjectTitle) return false;
    
    return true;
  };

  // Enhanced text content formatter
  const formatTextContent = (content) => {
    if (!content) return content;
    
    return content
      // Convert *bold text* to <strong>bold text</strong>
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      // Convert **bold text** to <strong>bold text</strong>
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Add line breaks for better readability
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      // Format bullet points
      .replace(/^- /gm, '• ')
      .replace(/^\* /gm, '• ');
  };

  // Function for formatting skills
  const formatSkillsContent = (skillsText) => {
    if (!skillsText) return [];
    
    // Split skills by various delimiters and clean them up
    const skills = skillsText
      .split(/[,;|\n]|(?:\s+\/\s+)|(?:\s+\|\s+)|(?:\)\s+[A-Z])/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)
      .map(skill => {
        // Clean up common formatting issues
        skill = skill.replace(/^\(/, '').replace(/\)$/, '');
        skill = skill.replace(/^[-•]\s*/, '');
        return skill.trim();
      })
      .filter(skill => skill.length > 2); // Remove very short entries
    
    return skills;
  };

  // Enhanced section renderer
  const renderEnhancedSection = (title, content, icon = '📄', isRequired = false, contentType = 'text') => {
    if (!content || content.trim() === '') {
      if (!isRequired) return null;
      return (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-lime-300 mb-4 flex items-center">
            <span className="mr-3 text-2xl">{icon}</span>
            {title}
          </h3>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <p className="text-gray-400 italic">No {title.toLowerCase()} provided</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-lime-300 mb-4 flex items-center">
          <span className="mr-3 text-2xl">{icon}</span>
          {title}
        </h3>
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          {contentType === 'skills' ? (
            <div>
              {(() => {
                const skills = formatSkillsContent(content);
                if (skills.length === 0) {
                  return <p className="text-gray-400 italic">No skills information available</p>;
                }
                
                return (
                  <div className="space-y-4">
                    {/* Primary Skills (first few, likely most important) */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">🔧 Core Technologies & Skills</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {skills.slice(0, 6).map((skill, index) => (
                          <div key={index} className="bg-gradient-to-r from-lime-500/20 to-green-500/20 border border-lime-400/30 rounded-lg p-3">
                            <span className="text-lime-200 font-medium">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Additional Skills */}
                    {skills.length > 6 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-3">💡 Additional Skills & Knowledge</h4>
                        <div className="flex flex-wrap gap-2">
                          {skills.slice(6).map((skill, index) => (
                            <span key={index} className="bg-white/10 text-gray-300 px-3 py-1.5 rounded-full text-sm font-medium border border-white/20 hover:bg-white/20 transition-colors">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Skills Summary */}
                    <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                      <p className="text-gray-300 text-sm">
                        <strong>Total Skills Required:</strong> {skills.length} • 
                        <strong className="ml-2">Complexity:</strong> {skills.length > 10 ? 'High' : skills.length > 5 ? 'Medium' : 'Low'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : contentType === 'description' ? (
            <div className="space-y-4">
              <div 
                className="text-gray-100 leading-relaxed text-lg"
                dangerouslySetInnerHTML={{ 
                  __html: formatTextContent(content) 
                }}
              />
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <p className="text-gray-400 text-sm">
                  <strong>Word Count:</strong> {content.split(/\s+/).length} words • 
                  <strong className="ml-2">Reading Time:</strong> ~{Math.ceil(content.split(/\s+/).length / 200)} min
                </p>
              </div>
            </div>
          ) : contentType === 'list' ? (
            <div>
              {(() => {
                const items = content
                  .split(/\n|;|,/)
                  .map(item => item.trim())
                  .filter(item => item.length > 0);
                
                return (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <span className="text-lime-400 mr-3 mt-1">•</span>
                        <span className="text-gray-100 leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div 
              className="text-gray-100 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: formatTextContent(content) 
              }}
            />
          )}
        </div>
      </div>
    );
  };

  // Function to render COMPLETE project details in beautiful format
  const renderCompleteProjectDetails = (project) => {
    return (
      <div className="space-y-6">
        {/* Project Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-4"
              style={{
                textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                fontFamily: '"Inter", sans-serif'
              }}>
            {project.projectTitle}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-lg text-gray-300">
            <span>🏢 {project.companyName || project.contactName || 'Individual Project'}</span>
            <span>📅 {formatTimeline(project.timeline)}</span>
            <span className={getStatusBadge(project.status).textColor}>
              {getStatusBadge(project.status).label}
            </span>
          </div>
        </div>

        {/* Project Banner */}
        {project.bannerImageUrl && (
          <div className="mb-8">
            <img 
              src={project.bannerImageUrl} 
              alt={`${project.projectTitle} banner`}
              className="w-full h-64 object-cover rounded-2xl shadow-2xl"
            />
          </div>
        )}

        {/* Enhanced Content Sections */}
        {renderEnhancedSection('Project Overview', project.projectDescription, '📖', true, 'description')}
        {renderEnhancedSection('Project Goals & Objectives', project.projectGoals, '🎯', false, 'list')}
        {renderEnhancedSection('Required Skills & Technologies', project.requiredSkills, '🛠️', true, 'skills')}
        {renderEnhancedSection('Project Deliverables', project.deliverables, '📦', false, 'list')}
        {renderEnhancedSection('Additional Information', project.additionalInfo, '📝')}
        {renderEnhancedSection('Communication Preferences', project.communicationPreferences, '💬')}
        {renderEnhancedSection('Additional Notes', project.additionalNotes, '📓')}

        {/* Enhanced Project Specifications */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-lime-300 mb-4 flex items-center">
            <span className="mr-3 text-2xl">⚙️</span>
            Project Specifications
          </h3>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Basic Information */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">📋</span> Basic Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Project Type:</span>
                    <span className="text-white font-medium text-sm">{project.projectType ? project.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Timeline:</span>
                    <span className="text-white font-medium text-sm">{formatTimeline(project.timeline) || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Experience Level:</span>
                    <span className="text-white font-medium text-sm">{project.experienceLevel ? project.experienceLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Budget:</span>
                    <span className="text-white font-medium text-sm">{project.budget || 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              {/* Project Status */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">📊</span> Project Status
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium text-sm ${getStatusBadge(project.status).textColor}`}>{project.status || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Submitted:</span>
                    <span className="text-white font-medium text-sm">{new Date(project.submissionDate || project.postedDate || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Complexity:</span>
                    <span className="text-white font-medium text-sm">{project.projectComplexity || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Views:</span>
                    <span className="text-white font-medium text-sm">{project.viewCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* Team Information */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">👥</span> Team & Resources
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Team Size:</span>
                    <span className="text-white font-medium text-sm">{project.maxTeamSize ? `Max ${project.maxTeamSize} members` : 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Applications:</span>
                    <span className="text-white font-medium text-sm">{project.applicationCount || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Contact:</span>
                    <span className="text-white font-medium text-sm">{project.contactName || 'Available'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Contact Information */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-lime-300 mb-4 flex items-center">
            <span className="mr-3 text-2xl">📞</span>
            Contact Information
          </h3>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center"><span className="mr-2">👤</span>Contact Name:</span>
                  <span className="text-white font-medium">{project.contactName || project.submitterName || 'Not provided'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center"><span className="mr-2">📧</span>Email:</span>
                  <span className="text-white font-medium">{project.contactEmail || project.submitterEmail || 'Available after application'}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                  <span className="text-gray-400 flex items-center"><span className="mr-2">🏢</span>Company:</span>
                  <span className="text-white font-medium">{project.companyName || 'Individual Project'}</span>
                </div>
                {project.projectUrl && (
                  <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                    <span className="text-gray-400 flex items-center"><span className="mr-2">🔗</span>Project URL:</span>
                    <a 
                      href={formatProjectUrl(project.projectUrl)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-lime-300 hover:text-lime-200 transition-colors font-medium"
                    >
                      Visit Website ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Function to render PREVIEW content only (for listing page)
  const renderPreviewContent = (project) => {
    return (
      <div className="space-y-4">
        {/* Project description preview */}
        {project.projectDescription && (
          <div>
            <h4 className="text-lime-300 font-semibold text-sm mb-2">📖 Project Description:</h4>
            <div className="text-gray-200 leading-relaxed text-sm bg-black/20 rounded p-3">
              <div className="line-clamp-3 whitespace-pre-line break-words">
                {project.projectDescription.length > 200 
                  ? `${project.projectDescription.substring(0, 200)}...`
                  : project.projectDescription
                }
              </div>
              {project.projectDescription.length > 200 && (
                <p className="text-gray-400 text-xs mt-2 italic">
                  Click "View Full Details" to see complete description
                </p>
              )}
            </div>
          </div>
        )}

        {/* Skills preview */}
        {project.requiredSkills && (
          <div>
            <h4 className="text-lime-300 font-semibold text-sm mb-2">🛠️ Required Skills:</h4>
            <div className="flex flex-wrap gap-2 mb-2">
              {project.requiredSkills.split(/[,;|\n]/).filter(skill => skill.trim()).slice(0, 5).map((skill, index) => (
                <span key={index} className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                  {skill.trim()}
                </span>
              ))}
              {project.requiredSkills.split(/[,;|\n]/).filter(skill => skill.trim()).length > 5 && (
                <span className="bg-white/10 text-gray-400 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                  +{project.requiredSkills.split(/[,;|\n]/).filter(skill => skill.trim()).length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Project goals preview */}
        {project.projectGoals && (
          <div>
            <h4 className="text-lime-300 font-semibold text-sm mb-2">🎯 Project Goals:</h4>
            <div className="text-gray-300 text-sm bg-black/20 rounded p-3">
              <div className="line-clamp-2 leading-relaxed">
                {project.projectGoals.length > 150 
                  ? `${project.projectGoals.substring(0, 150)}...`
                  : project.projectGoals
                }
              </div>
              {project.projectGoals.length > 150 && (
                <p className="text-gray-400 text-xs mt-2 italic">
                  View full details for complete goals
                </p>
              )}
            </div>
          </div>
        )}

        {/* Additional info preview */}
        {project.additionalInfo && (
          <div>
            <h4 className="text-lime-300 font-semibold text-sm mb-2">📋 Additional Information:</h4>
            <div className="text-gray-300 text-sm bg-black/20 rounded p-3">
              <div className="line-clamp-2 leading-relaxed">
                {project.additionalInfo.length > 120 
                  ? `${project.additionalInfo.substring(0, 120)}...`
                  : project.additionalInfo
                }
              </div>
              {project.additionalInfo.length > 120 && (
                <p className="text-gray-400 text-xs mt-2 italic">
                  More details available in full view
                </p>
              )}
            </div>
          </div>
        )}

        {/* Summary of what's available but not shown */}
        <div className="bg-black/20 rounded p-3 border border-white/10">
          <div className="text-xs text-gray-400">
            <div className="flex items-center justify-between mb-2">
              <span>📊 Click "View Full Details" to see:</span>
              <span className="text-lime-300 font-semibold">
                Complete project information
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {project.deliverables && <span>• Complete deliverables</span>}
              {project.communicationPreferences && <span>• Communication preferences</span>}
              {project.additionalNotes && <span>• Additional notes</span>}
              {project.projectUrl && <span>• Project website</span>}
              {project.budget && <span>• Budget information</span>}
              {project.timeline && <span>• Timeline details</span>}
              {project.experienceLevel && <span>• Experience requirements</span>}
              {project.maxTeamSize && <span>• Team size details</span>}
              {project.projectComplexity && <span>• Complexity information</span>}
              {project.workflowStage && <span>• Workflow details</span>}
              {project.contentAnalysis && <span>• Content analysis</span>}
              {Object.keys(project).filter(key => 
                ![
                  'id', 'projectTitle', 'projectDescription', 'projectType', 'timeline', 'requiredSkills',
                  'projectGoals', 'additionalInfo', 'experienceLevel', 'contactEmail', 'contactName', 
                  'companyName', 'budget', 'maxTeamSize', 'bannerImageUrl', 'bannerImageId', 'bannerDeleteHash',
                  'submissionDate', 'postedDate', 'createdAt', 'updatedAt', 'status', 'workflowStage',
                  'submitterId', 'submitterEmail', 'submitterName', 'submitterPhoto', 'groupAutoCreated',
                  'projectOwnerCanManageApplications', 'isActive', 'adminNotifiedOfSubmission', 'adminNotificationSentAt',
                  'adminNotificationMessageId', 'submissionSource', 'requiresTeamCreation', 'projectComplexity',
                  'viewCount', 'applicationCount', 'deliverables', 'communicationPreferences', 'additionalNotes',
                  'projectUrl', 'contentAnalysis'
                ].includes(key) && 
                project[key] !== null && 
                project[key] !== undefined && 
                project[key] !== ''
              ).length > 0 && <span>• Additional custom fields</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check for existing applications when user logs in
  useEffect(() => {
    const checkAppliedProjects = async () => {
      if (!currentUser) {
        setAppliedProjects(new Set());
        return;
      }

      try {
        const q = query(
          collection(db, 'project_applications'),
          where('applicantId', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const appliedProjectIds = new Set();
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            appliedProjectIds.add(data.projectId);
          });
          setAppliedProjects(appliedProjectIds);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error checking applied projects:', error);
      }
    };

    checkAppliedProjects();
  }, [currentUser]);

  // FETCH ALL PROJECTS from Firebase
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        console.log('🔍 Fetching ALL projects from Firebase...');
        
        const q = query(
          collection(db, 'client_projects'),
          orderBy('submissionDate', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log('📊 Raw Firebase documents found:', snapshot.docs.length);
          
          if (snapshot.docs.length === 0) {
            console.log('📭 No projects found in Firebase');
            setProjects([]);
            setFilteredProjects([]);
            setLoading(false);
            return;
          }

          const rawData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              postedDate: data.submissionDate?.toDate?.()?.toISOString() || 
                         data.postedDate?.toDate?.()?.toISOString() || 
                         data.createdAt?.toDate?.()?.toISOString() || 
                         new Date().toISOString(),
              submissionDate: data.submissionDate?.toDate?.()?.toISOString() || new Date().toISOString()
            };
          });

          const validProjects = rawData.filter(item => {
            if (!isValidProject(item)) {
              console.log('🚫 Filtered out invalid item:', item.projectTitle || item.eventTitle || item.id);
              return false;
            }
            return true;
          });

          console.log('✅ Valid projects after filtering:', validProjects.length);
          setProjects(validProjects);
          setFilteredProjects(validProjects);
          setLoading(false);

        }, (error) => {
          console.error('❌ Error fetching from Firebase:', error);
          setProjects([]);
          setFilteredProjects([]);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
        setProjects([]);
        setFilteredProjects([]);
        setLoading(false);
      }
    };

    fetchAllProjects();
  }, []);

  // Filter projects based on search and filters
  useEffect(() => {
    let filtered = projects.filter(project => {
      if (!isValidProject(project)) return false;
      
      const searchFields = [
        'projectTitle', 'projectDescription', 'requiredSkills', 'companyName', 
        'contactName', 'submitterName', 'submitterEmail', 'contactEmail',
        'projectGoals', 'additionalInfo', 'deliverables', 'communicationPreferences',
        'additionalNotes', 'projectUrl', 'projectType', 'timeline', 'experienceLevel',
        'budget', 'status', 'workflowStage', 'submissionSource', 'projectComplexity'
      ];
      
      const matchesSearch = searchQuery === '' || searchFields.some(field => {
        const value = project[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      });
      
      const additionalFieldsMatch = Object.keys(project).some(key => {
        if (!searchFields.includes(key) && typeof project[key] === 'string') {
          return project[key].toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      });
      
      const totalSearchMatch = matchesSearch || additionalFieldsMatch;
      
      const matchesType = !selectedFilters.projectType || project.projectType === selectedFilters.projectType;
      const matchesTimeline = !selectedFilters.timeline || project.timeline === selectedFilters.timeline;
      const matchesStatus = !selectedFilters.status || project.status === selectedFilters.status;
      const matchesExperience = !selectedFilters.experienceLevel || project.experienceLevel === selectedFilters.experienceLevel;

      return totalSearchMatch && matchesType && matchesTimeline && matchesStatus && matchesExperience;
    });

    console.log('🔍 Filtered projects count:', filtered.length);
    setFilteredProjects(filtered);
  }, [projects, searchQuery, selectedFilters]);

  // Navigation helper function
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  // Handle edit project navigation
  const handleEditProject = (project) => {
    navigate(`/projects/${project.id}/edit`);
  };
 
  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setSelectedFilters({
      projectType: '',
      timeline: '',
      status: '',
      experienceLevel: ''
    });
    setSearchQuery('');
  };

  const openApplicationModal = (project) => {
    if (project.status !== 'approved') {
      console.log('🚫 Cannot apply to non-approved project');
      return;
    }
    
    if (!isValidProject(project)) {
      console.error('🚫 Attempted to apply to non-project item:', project);
      return;
    }
    
    if (!currentUser) {
      handleNavigation('/login');
      return;
    }

    if (appliedProjects.has(project.id)) {
      return;
    }
    
    setSelectedProject(project);
    setShowApplicationModal(true);
    setApplicationStatus(null);
    
    setApplicationData(prev => ({
      ...prev,
      applicantName: currentUser.displayName || '',
      applicantEmail: currentUser.email || ''
    }));
  };

  const closeApplicationModal = () => {
    setShowApplicationModal(false);
    setSelectedProject(null);
    setUrlError('');
    setApplicationData({
      applicantName: '',
      applicantEmail: '',
      experience: '',
      portfolio: '',
      proposal: ''
    });
  };
  
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      setUrlError('Portfolio/LinkedIn URL is required');
      return false;
    }
    
    try {
      const urlPattern = /^https?:\/\/(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
      if (!urlPattern.test(url)) {
        setUrlError('Please enter a valid URL (e.g., https://linkedin.com/in/yourprofile)');
        return false;
      }
      setUrlError('');
      return true;
    } catch (error) {
      setUrlError('Please enter a valid URL');
      return false;
    }
  };

  const handlePortfolioChange = (e) => {
    const url = e.target.value;
    setApplicationData(prev => ({ ...prev, portfolio: url }));
    validateUrl(url);
  };

  // APPLICATION SUBMIT WITH EMAIL NOTIFICATIONS
  const handleApplicationSubmit = async () => {
    if (!applicationData.applicantName || !applicationData.applicantEmail ||
        !applicationData.experience || !applicationData.proposal || !applicationData.portfolio) {
      setApplicationStatus('error');
      return;
    }

    if (applicationData.portfolio && !validateUrl(applicationData.portfolio)) {
      return;
    }

    setApplicationStatus('submitting');
    
    try {
      const applicationRef = await addDoc(collection(db, 'project_applications'), {
        projectId: selectedProject.id,
        projectTitle: selectedProject.projectTitle,
        applicantId: currentUser.uid,
        applicantName: applicationData.applicantName,
        applicantEmail: applicationData.applicantEmail,
        experience: applicationData.experience,
        portfolio: applicationData.portfolio,
        proposal: applicationData.proposal,
        status: 'submitted',
        submittedAt: serverTimestamp(),
        contactEmail: selectedProject.contactEmail || selectedProject.companyEmail,
        motivation: applicationData.proposal,
        skills: applicationData.experience,
        interestedRole: 'Developer',
        projectOwnerEmail: selectedProject.contactEmail || selectedProject.companyEmail
      });

      // Send email notification
      try {
        const projectOwnerEmail = selectedProject.contactEmail || selectedProject.companyEmail;
        
        if (projectOwnerEmail) {
          const emailData = {
            applicationData: {
              applicantName: applicationData.applicantName,
              applicantEmail: applicationData.applicantEmail,
              applicantId: currentUser.uid,
              experience: applicationData.experience || 'Not provided',
              motivation: applicationData.proposal || 'Not provided',
              skills: applicationData.experience || 'Not provided',
              portfolio: applicationData.portfolio || '',
              phone: '',
              availability: '',
              interestedRole: 'Developer'
            },
            projectData: {
              projectTitle: selectedProject.projectTitle,
              projectDescription: selectedProject.projectDescription,
              projectType: selectedProject.projectType,
              timeline: selectedProject.timeline,
              experienceLevel: selectedProject.experienceLevel,
              budget: selectedProject.budget,
              contactName: selectedProject.contactName || selectedProject.companyName,
              companyName: selectedProject.companyName || selectedProject.contactName
            },
            projectOwnerData: {
              name: selectedProject.contactName || selectedProject.companyName || 'Project Owner',
              email: projectOwnerEmail
            }
          };

          await sendEmailNotification('send-project-application', emailData);
        }
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError);
      }

      // Create notification for applicant
      try {
        await addDoc(collection(db, 'notifications'), {
          recipientEmail: currentUser.email,
          recipientName: applicationData.applicantName,
          recipientId: currentUser.uid,
          type: 'application_submitted',
          title: 'Application Submitted! 📝',
          message: `Your application for "${selectedProject.projectTitle}" has been submitted successfully. The project owner will review it soon.`,
          projectId: selectedProject.id,
          projectTitle: selectedProject.projectTitle,
          applicationId: applicationRef.id,
          createdAt: serverTimestamp(),
          read: false,
          priority: 'normal'
        });
      } catch (notificationError) {
        console.error('❌ Failed to create applicant notification:', notificationError);
      }

      setApplicationStatus('success');
      setAppliedProjects(prev => new Set(prev.add(selectedProject.id)));
      
      setTimeout(() => {
        closeApplicationModal();
      }, 2000);

    } catch (error) {
      console.error('❌ Error in project application submission:', error);
      setApplicationStatus('error');
    }
  };

  const formatTimeline = (timeline) => {
    const timelineMap = {
      '1-week': '1 Week',
      '2-weeks': '2 Weeks',
      '1-month': '1 Month',
      '2-3-months': '2-3 Months',
      '3-6-months': '3-6 Months',
      '6-months-plus': '6+ Months',
      'flexible': 'Flexible'
    };
    return timelineMap[timeline] || timeline;
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
              <Link to="/" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              
              {currentUser && (
                <Link to="/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              {currentUser && (
                <Link to="/career/dashboard" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  Career
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                </Link>
              )}
              
              <Link to="/projects" className="text-lime-400 font-bold transition-all duration-300 hover:text-lime-300 relative group text-sm lg:text-base" 
                    style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5), 1px 1px 2px rgba(0,0,0,0.8)'}}>
                All Projects
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-lime-400 to-green-500"></span>
              </Link>
              
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
                  <span className="mr-1 sm:mr-2 text-sm sm:text-lg">G</span>
                  Login
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
                <Link to="/" 
                      className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                      style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                      onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                
                {currentUser && (
                  <Link to="/dashboard" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                )}

                {currentUser && (
                  <Link to="/career/dashboard" 
                        className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                        onClick={() => setMobileMenuOpen(false)}>
                    Career
                  </Link>
                )}
                
                <Link to="/projects" 
                      className="text-lime-400 font-bold transition-all duration-300 hover:text-lime-300 text-base sm:text-lg" 
                      style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.5), 1px 1px 2px rgba(0,0,0,0.8)'}}
                      onClick={() => setMobileMenuOpen(false)}>
                  All Projects
                </Link>
                
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
                    <span className="mr-2">G</span>
                    Login with Google
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16 sm:pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 max-w-7xl">
          
          {/* Hero Section */}
          <section className="relative mb-16 sm:mb-24 pt-8 sm:pt-12 md:pt-20">
            <div className="max-w-4xl mx-auto text-center">
              
              {/* Animated Badge */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8 md:mb-10 animate-pulse">
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
                <span className="text-lime-300 uppercase tracking-widest text-xs sm:text-sm md:text-lg font-black" 
                      style={{
                        textShadow: '0 0 20px rgba(76, 175, 80, 0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif',
                        letterSpacing: '0.1em'
                      }}>
                  🚀 Project Previews - Click for Complete Details
                </span>
                <div className="h-2 w-2 sm:h-4 sm:w-4 bg-lime-400 rounded-full animate-ping shadow-lg" 
                     style={{boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}></div>
              </div>
              
              {/* Main Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 md:mb-12 leading-[0.9] tracking-tight"
                  style={{
                    fontFamily: '"Inter", sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, #e8f5e8 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(76, 175, 80, 0.2)',
                    filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.9))'
                  }}>
                Browse All{' '}
                <span className="block mt-2 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-green-400 to-emerald-500"
                      style={{
                        textShadow: 'none',
                        filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))',
                        animation: 'glow 2s ease-in-out infinite alternate'
                      }}>
                  Projects
                </span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed font-light mb-8 sm:mb-10 md:mb-12" 
                 style={{
                   textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Discover exciting projects with 
                <span className="text-lime-300 font-semibold"> preview summaries</span>. 
                Click "View Full Details" to see complete project information, requirements, and apply directly.
              </p>
              
              <div className="h-1 sm:h-2 w-16 sm:w-24 md:w-32 bg-gradient-to-r from-lime-400 to-green-500 mx-auto rounded-full shadow-2xl mb-8 sm:mb-12 md:mb-16"
                   style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.6)'}}></div>
            </div>
          </section>

          {/* Enhanced Search and Filters */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
              
              {/* Search Bar */}
              <div className="mb-6">
                <label className="block text-lime-300 font-semibold mb-3 text-sm">
                  🔍 Search Projects:
                </label>
                <input
                  type="text"
                  placeholder="Search by project title, description, skills, company, or any project details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 text-lg"
                />
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                
                {/* Project Type Filter */}
                <select
                  value={selectedFilters.projectType}
                  onChange={(e) => handleFilterChange('projectType', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Project Types</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="desktop-software">Desktop Software</option>
                  <option value="ai-ml">AI/Machine Learning</option>
                  <option value="data-analysis">Data Analysis</option>
                  <option value="blockchain">Blockchain</option>
                  <option value="game-development">Game Development</option>
                  <option value="other">Other</option>
                </select>

                {/* Timeline Filter */}
                <select
                  value={selectedFilters.timeline}
                  onChange={(e) => handleFilterChange('timeline', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Timelines</option>
                  <option value="1-week">1 Week</option>
                  <option value="2-weeks">2 Weeks</option>
                  <option value="1-month">1 Month</option>
                  <option value="2-3-months">2-3 Months</option>
                  <option value="3-6-months">3-6 Months</option>
                  <option value="6-months-plus">6+ Months</option>
                  <option value="flexible">Flexible</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">✅ Approved</option>
                  <option value="pending_approval">⏳ Pending</option>
                  <option value="rejected">❌ Rejected</option>
                  <option value="draft">📝 Draft</option>
                </select>

                {/* Experience Level Filter */}
                <select
                  value={selectedFilters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                >
                  <option value="">All Experience Levels</option>
                  <option value="junior-level">Junior Level</option>
                  <option value="mid-level">Mid Level</option>
                  <option value="senior-level">Senior Level</option>
                  <option value="expert-level">Expert Level</option>
                  <option value="any-level">Any Level</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={clearFilters}
                  className="text-lime-300 hover:text-white font-semibold transition-colors duration-300"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </section>

          {/* Projects Grid */}
          <section>
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lime-400 mx-auto mb-4"></div>
                <p className="text-gray-300 text-xl">Loading project previews...</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-6">📋</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {projects.length === 0 ? 'No projects found' : 'No projects match your search criteria'}
                </h3>
                <p className="text-gray-300 mb-8">
                  {projects.length === 0 
                    ? 'Be the first to submit a project!'
                    : 'Try adjusting your search terms or filters to see more results.'
                  }
                </p>
                
                {projects.length === 0 && (
                  <button 
                    onClick={() => handleNavigation('/submit-project')}
                    className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-500 transform hover:scale-105 shadow-2xl"
                    style={{
                      boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    Submit the First Project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProjects.map((project) => {
                  const statusBadge = getStatusBadge(project.status);
                  
                  return (
                    <div key={project.id} className="group">
                      <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl transform hover:scale-105 transition-all duration-500 h-full flex flex-col relative">
                        
                        {/* Project Banner Image */}
                        <div className="relative h-48 sm:h-56 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                          {project.bannerImageUrl ? (
                            <img 
                              src={project.bannerImageUrl} 
                              alt={`${project.projectTitle} banner`}
                              className="project-banner-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          <div 
                            className={`project-placeholder w-full h-full bg-gradient-to-br from-lime-500/20 via-green-500/20 to-emerald-500/20 flex items-center justify-center ${project.bannerImageUrl ? 'hidden' : 'flex'}`}
                            style={{ display: project.bannerImageUrl ? 'none' : 'flex' }}
                          >
                            <div className="text-center">
                              <div className="text-4xl sm:text-5xl mb-3 opacity-60">
                                {getProjectTypeIcon(project.projectType)}
                              </div>
                              <p className="text-gray-400 font-semibold text-sm">
                                {project.projectType ? project.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tech Project'}
                              </p>
                            </div>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
                          
                          {/* Status badges */}
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            <div className={`backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold border shadow-lg ${statusBadge.className}`}>
                              {statusBadge.label}
                            </div>
                            <div className="backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold border bg-purple-500/90 text-purple-100 border-purple-400/30 shadow-lg">
                              📋 PREVIEW
                            </div>
                          </div>

                          {/* Project Owner Indicator */}
                          {isProjectOwner(project) && (
                            <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur-sm text-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-400/30 shadow-lg">
                              👑 YOUR PROJECT
                            </div>
                          )}

                          {/* Project Type Badge */}
                          <div className="absolute bottom-3 left-3">
                            <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/20">
                              {project.projectType ? project.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tech Project'}
                            </div>
                          </div>
                        </div>

                        {/* Project Content - PREVIEW ONLY */}
                        <div className="p-6 sm:p-8 flex flex-col flex-grow">
                          
                          {/* Project Header */}
                          <div className="mb-6">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-lime-300 transition-colors duration-300 flex-1 pr-4" 
                                  style={{
                                    textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                                    fontFamily: '"Inter", sans-serif'
                                  }}>
                                {project.projectTitle}
                              </h3>
                            </div>
                            
                            {/* Project summary info */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center text-gray-400 flex-wrap gap-4">
                                <span>🏢 {project.companyName || project.contactName || 'Individual Project'}</span>
                                <span>📅 {formatTimeline(project.timeline)}</span>
                                <span>📊 {project.status || 'Unknown Status'}</span>
                              </div>
                              
                              <div className="flex items-center text-gray-400 flex-wrap gap-4">
                                <span>📅 {new Date(project.submissionDate || project.postedDate).toLocaleDateString()}</span>
                                {project.budget && <span>💰 {project.budget}</span>}
                                {project.experienceLevel && <span>👨‍💻 {project.experienceLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>}
                                {project.maxTeamSize && <span>👥 Max {project.maxTeamSize} members</span>}
                              </div>
                            </div>

                            {/* Project URL Display */}
                            {project.projectUrl && (
                              <div className="mt-4">
                                <button
                                  onClick={(e) => handleProjectUrlClick(project.projectUrl, e)}
                                  className="flex items-center text-lime-300 hover:text-lime-200 transition-colors duration-300 text-sm font-medium"
                                  title="Visit project website"
                                >
                                  <span className="mr-2">🔗</span>
                                  <span className="truncate max-w-xs">
                                    {project.projectUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                  </span>
                                  <span className="ml-1 text-xs">↗</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* PREVIEW CONTENT SECTION */}
                          <div className="mb-6 flex-grow">
                            {renderPreviewContent(project)}
                          </div>

                          {/* Project Summary */}
                          <div className="mb-6 bg-black/20 rounded-lg p-4 border border-white/10">
                            <h4 className="text-gray-300 font-semibold text-sm mb-3">📊 Project Summary:</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Submitted:</span>
                                <span className="text-gray-300">{new Date(project.submissionDate || project.postedDate || project.createdAt || Date.now()).toLocaleDateString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Status:</span>
                                <span className={statusBadge.textColor}>{project.status || 'Unknown'}</span>
                              </div>
                              {project.projectType && (
                                <div className="flex justify-between col-span-2">
                                  <span className="text-gray-400">Type:</span>
                                  <span className="text-gray-300">{project.projectType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                </div>
                              )}
                              
                              <div className="flex justify-between col-span-2 pt-2 border-t border-white/10">
                                <span className="text-gray-400">View Mode:</span>
                                <span className="text-purple-300">📋 Preview Summary</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons Section */}
                          <div className="space-y-3">
                            {/* Primary Action: View Full Details Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProject(project);
                              }}
                              className="w-full group/view bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-all duration-500 transform hover:scale-105 shadow-xl overflow-hidden"
                              style={{
                                boxShadow: '0 0 20px rgba(147, 51, 234, 0.4)',
                                fontFamily: '"Inter", sans-serif'
                              }}
                              title="View complete project details in modal"
                            >
                              <span className="absolute inset-0 bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 opacity-0 group-hover/view:opacity-100 transition-opacity duration-500"></span>
                              <span className="relative flex items-center justify-center">
                                View Full Details
                                <span className="ml-2 group-hover/view:translate-x-1 transition-transform text-lg">📄</span>
                              </span>
                              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/view:translate-x-full transition-transform duration-700"></div>
                            </button>

                            {/* Edit Button (Only for Project Owner) */}
                            {isProjectOwner(project) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditProject(project);
                                }}
                                className="w-full group/edit bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-6 py-3 rounded-full font-bold text-sm transition-all duration-500 transform hover:scale-105 shadow-xl overflow-hidden"
                                style={{
                                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                                  fontFamily: '"Inter", sans-serif'
                                }}
                              >
                                <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 opacity-0 group-hover/edit:opacity-100 transition-opacity duration-500"></span>
                                <span className="relative flex items-center justify-center">
                                  Edit Project
                                  <span className="ml-2 group-hover/edit:translate-x-1 transition-transform text-lg">✏️</span>
                                </span>
                                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/edit:translate-x-full transition-transform duration-700"></div>
                              </button>
                            )}

                            {/* Apply Button (Hidden for Project Owner, Only for Approved Projects) */}
                            {!isProjectOwner(project) && project.status === 'approved' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openApplicationModal(project);
                                }}
                                disabled={!currentUser || appliedProjects.has(project.id)}
                                className={`group/btn relative w-full ${
                                  appliedProjects.has(project.id) 
                                    ? 'bg-gray-600 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 hover:scale-105'
                                } text-white px-6 py-3 rounded-full font-bold text-sm transition-all duration-500 transform shadow-xl overflow-hidden disabled:transform-none`}
                                style={{
                                  boxShadow: appliedProjects.has(project.id) 
                                    ? '0 0 20px rgba(107, 114, 128, 0.4)' 
                                    : '0 0 20px rgba(76, 175, 80, 0.4)',
                                  fontFamily: '"Inter", sans-serif'
                                }}
                              >
                                {!appliedProjects.has(project.id) && (
                                  <span className="absolute inset-0 bg-gradient-to-r from-lime-400 via-green-400 to-emerald-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></span>
                                )}
                                <span className="relative flex items-center justify-center">
                                  {appliedProjects.has(project.id) ? (
                                    <>
                                      Already Applied
                                      <span className="ml-2 text-lg">✅</span>
                                    </>
                                  ) : !currentUser ? (
                                    <>
                                      Login to Apply
                                      <span className="ml-2 group-hover/btn:translate-x-1 transition-transform text-lg">🔐</span>
                                    </>
                                  ) : (
                                    <>
                                      Apply Now
                                      <span className="ml-2 group-hover/btn:translate-x-1 transition-transform text-lg">🚀</span>
                                    </>
                                  )}
                                </span>
                                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                              </button>
                            )}

                            {/* Status Information for Non-Approved Projects */}
                            {!isProjectOwner(project) && project.status !== 'approved' && (
                              <div className="w-full bg-gray-600/50 text-gray-300 px-6 py-3 rounded-full text-sm text-center border border-gray-500/30">
                                {project.status === 'pending_approval' && '⏳ Pending Admin Approval'}
                                {project.status === 'rejected' && '❌ Project Rejected'}
                                {project.status === 'draft' && '📝 Draft - Not Published'}
                                {!project.status && '❓ Status Unknown'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Call to Action for Posting Projects */}
          <section className="mt-16 text-center">
            <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6"
                  style={{
                    textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Have a Project to Submit?
              </h2>
              <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
                 style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                Submit your project and connect with talented developers ready to bring your vision to life. 
                Your project will get its own dedicated page with SEO-friendly URL.
              </p>
              <button 
                onClick={() => handleNavigation('/submit-project')}
                className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-12 py-4 rounded-full font-black text-xl transition-all duration-500 transform hover:scale-110 shadow-2xl"
                style={{
                  boxShadow: '0 0 40px rgba(76, 175, 80, 0.4), 0 20px 40px rgba(0,0,0,0.3)',
                  fontFamily: '"Inter", sans-serif'
                }}
              >
                Submit Your Project
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Project Details Modal */}
      {showDetailsModal && selectedProjectForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-2xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl p-6 border-b border-white/20 flex justify-between items-center z-10">
              <div className="flex items-center">
                <div className="text-3xl mr-4">{getProjectTypeIcon(selectedProjectForDetails.projectType)}</div>
                <div>
                  <h2 className="text-2xl font-black text-white"
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Complete Project Details
                  </h2>
                  <p className="text-lime-300 font-semibold">{selectedProjectForDetails.projectTitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {/* Action Buttons in Header */}
                {!isProjectOwner(selectedProjectForDetails) && selectedProjectForDetails.status === 'approved' && (
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      openApplicationModal(selectedProjectForDetails);
                    }}
                    disabled={!currentUser || appliedProjects.has(selectedProjectForDetails.id)}
                    className={`px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                      appliedProjects.has(selectedProjectForDetails.id) 
                        ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                        : 'bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white'
                    }`}
                  >
                    {appliedProjects.has(selectedProjectForDetails.id) ? 'Applied ✅' : 'Apply Now 🚀'}
                  </button>
                )}
                
                {isProjectOwner(selectedProjectForDetails) && (
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      handleEditProject(selectedProjectForDetails);
                    }}
                    className="px-6 py-2 rounded-full font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300"
                  >
                    Edit Project ✏️
                  </button>
                )}
                
                <button
                  onClick={closeDetailsModal}
                  className="text-gray-400 hover:text-white transition-colors text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
              {renderCompleteProjectDetails(selectedProjectForDetails)}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-900/95 to-black/95 backdrop-blur-xl p-6 border-t border-white/20">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    onClick={closeDetailsModal}
                    className="px-6 py-2 rounded-full font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                  >
                    Close
                  </button>
                  {selectedProjectForDetails.projectUrl && (
                    <button
                      onClick={() => window.open(formatProjectUrl(selectedProjectForDetails.projectUrl), '_blank')}
                      className="px-6 py-2 rounded-full font-semibold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-300"
                    >
                      Visit Project Website 🔗
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-black/90 via-gray-900/90 to-black/90 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Apply to Project
                </h2>
                <p className="text-lime-300 font-semibold">{selectedProject.projectTitle}</p>
              </div>
              <button
                onClick={closeApplicationModal}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>

            {/* Application Status Messages */}
            {applicationStatus === 'success' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
                <div className="flex items-center">
                  <div className="text-green-400 text-xl mr-3">✅</div>
                  <div>
                    <h3 className="text-green-400 font-bold">Application Submitted Successfully! 🎉</h3>
                    <p className="text-gray-200 text-sm">📧 The project owner has been notified via email and will review your application soon.</p>
                  </div>
                </div>
              </div>
            )}

            {applicationStatus === 'error' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl">
                <div className="flex items-center">
                  <div className="text-red-400 text-xl mr-3">❌</div>
                  <div>
                    <h3 className="text-red-400 font-bold">Application Failed</h3>
                    <p className="text-gray-200 text-sm">There was an error submitting your application. Please try again.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Application Form */}
            {applicationStatus !== 'success' && (
              <div className="space-y-6">
                
                {/* Personal Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={applicationData.applicantName}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, applicantName: e.target.value }))}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-lime-300 font-semibold mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={applicationData.applicantEmail}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, applicantEmail: e.target.value }))}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Relevant Experience *
                  </label>
                  <textarea
                    value={applicationData.experience}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, experience: e.target.value }))}
                    rows={4}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Describe your relevant experience and skills for this project..."
                  />
                </div>

                {/* Portfolio */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Portfolio/LinkedIn URL *
                  </label>
                  <input
                    type="url"
                    value={applicationData.portfolio}
                    onChange={handlePortfolioChange}
                    className={`w-full bg-white/10 backdrop-blur-sm border ${urlError ? 'border-red-500' : 'border-white/20'} rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300`}
                    placeholder="https://linkedin.com/in/yourprofile (required)"
                  />
                  {urlError && (
                    <p className="text-red-400 text-sm mt-2 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {urlError}
                    </p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    Required: LinkedIn profile, portfolio website, or GitHub profile
                  </p>
                </div>

                {/* Proposal */}
                <div>
                  <label className="block text-lime-300 font-semibold mb-2">
                    Project Proposal *
                  </label>
                  <textarea
                    value={applicationData.proposal}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, proposal: e.target.value }))}
                    rows={5}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all duration-300 resize-vertical"
                    placeholder="Explain your approach to this project, timeline, and what makes you the right fit..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={closeApplicationModal}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplicationSubmit}
                    disabled={applicationStatus === 'submitting' || urlError}
                    className="flex-1 bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-bold transition-all duration-500 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{
                      boxShadow: '0 0 20px rgba(76, 175, 80, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {applicationStatus === 'submitting' ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
        
        /* Custom scrollbar */
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

        /* Line clamp utilities */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        input:focus, textarea:focus, select:focus {
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
        }
        
        select option {
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
        }

        /* Image loading and animation styles */
        .project-banner-image {
          transition: all 0.5s ease;
          background: linear-gradient(45deg, #1f2937, #374151);
        }

        .project-banner-image:hover {
          filter: brightness(1.1) contrast(1.05);
        }

        /* Placeholder animation */
        @keyframes placeholderPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.8; }
        }

        .project-placeholder {
          animation: placeholderPulse 2s ease-in-out infinite;
        }

        /* Enhanced touch targets for mobile */
        @media (max-width: 768px) {
          button, a, input, textarea {
            min-height: 44px;
          }
        }

        /* Card hover effects */
        .group:hover .project-banner-image {
          transform: scale(1.05);
        }

        .whitespace-pre-line {
          white-space: pre-line;
        }

        .break-words {
          word-wrap: break-word;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
};

export default ProjectsListing;
