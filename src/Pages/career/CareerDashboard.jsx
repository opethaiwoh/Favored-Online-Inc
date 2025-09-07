// CareerDashboard.jsx - COMPLETE VERSION WITH NAVIGATION MENU
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import storageService from '../../services/storageService';
import enhancedStorageService from '../../services/enhancedStorageService';
import { toast } from 'react-toastify';

const CareerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dataSource, setDataSource] = useState('');
  
  // ADD THIS STATE FOR MOBILE MENU
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // AI-powered states
  const [careerRecommendations, setCareerRecommendations] = useState([]);
  const [marketInsights, setMarketInsights] = useState(null);
  const [personalizedRoadmap, setPersonalizedRoadmap] = useState(null);
  const [actionPlan, setActionPlan] = useState([]);
  const [networkingStrategy, setNetworkingStrategy] = useState([]);
  const [interviewPrep, setInterviewPrep] = useState([]);
  
  // Enhanced states for career-specific content
  const [learningPlan, setLearningPlan] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState(null);
  const [generatingLearning, setGeneratingLearning] = useState(false);
  const [generatingInterviews, setGeneratingInterviews] = useState(false);
  
  // Enhanced states with timestamp tracking
  const [contentTimestamp, setContentTimestamp] = useState(null);
  const [learningResources, setLearningResources] = useState([]);
  
  // Generation states
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [generatingActionPlan, setGeneratingActionPlan] = useState(false);
  
  const [activeTab, setActiveTab] = useState('paths');
  
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    experienceLevel: '',
    studyField: '',
    educationLevel: '',
    currentRole: '',
    yearsExperience: '',
    jobResponsibilities: '',
    jobProjects: '',
    jobTechnologies: '',
    publications: '',
    transferableSkills: '',
    interests: [],
    careerPathsInterest: [],
    toolsUsed: [],
    techInterests: '',
    timeCommitment: '',
    targetSalary: '',
    workPreference: '',
    transitionTimeline: ''
  });
  
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: '',
    improvements: ''
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeX9C7YtHTSBy4COsV6KaogdEvrjXoVQ0O2psoyfs1xqrySNg/formResponse';

  // ============================================================================
  // HELPER FUNCTION FOR PARSING AI RESPONSES
  // ============================================================================
  
  const parseAIResponse = (response, fallbackData = []) => {
    try {
      // First, try to parse the response as-is
      return JSON.parse(response);
    } catch (error) {
      console.log('Direct JSON parsing failed, attempting to extract JSON...');
      
      try {
        // Look for JSON within the response (between brackets or braces)
        const jsonMatch = response.match(/[\[\{][\s\S]*[\]\}]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // If no JSON found, log the response and return fallback
        console.warn('No JSON found in response:', response.substring(0, 200) + '...');
        return fallbackData;
      } catch (secondError) {
        console.error('Failed to extract JSON from response:', secondError);
        console.log('Raw response:', response.substring(0, 500));
        return fallbackData;
      }
    }
  };

  // Get user ID for storage operations
  const getUserId = () => currentUser?.uid || currentUser?.email || 'anonymous';

  // Mouse position tracking for animated background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Enhanced save function
  const saveAllData = () => {
    const userId = getUserId();
    
    // Save analysis and user data
    enhancedStorageService.saveUserAnalysis(userId, {
      analysis,
      userData,
      timestamp: new Date().toISOString()
    });

    // Save AI content if available
    if (careerRecommendations.length > 0) {
      enhancedStorageService.saveAIContent(userId, {
        careerRecommendations,
        personalizedRoadmap,
        marketInsights,
        actionPlan,
        learningPlan,
        interviewQuestions,
        lastGenerated: new Date().toISOString()
      });
    }

    // Save form data
    enhancedStorageService.saveFormData(userId, userData);
    
    console.log('✅ All data saved to enhanced storage');
  };

  // Enhanced load function
  const loadSavedData = () => {
    const userId = getUserId();
    
    // Try to load saved analysis
    const savedAnalysis = enhancedStorageService.loadUserAnalysis(userId);
    if (savedAnalysis) {
      setAnalysis(savedAnalysis.analysis || '');
      setUserData(savedAnalysis.userData || {});
      setDataSource('Enhanced storage - Analysis');
      console.log('✅ Loaded analysis from enhanced storage');
    }

    // Try to load AI content
    const savedAIContent = enhancedStorageService.loadAIContent(userId);
    if (savedAIContent) {
      if (savedAIContent.careerRecommendations) {
        setCareerRecommendations(savedAIContent.careerRecommendations);
      }
      if (savedAIContent.personalizedRoadmap) {
        setPersonalizedRoadmap(savedAIContent.personalizedRoadmap);
      }
      if (savedAIContent.marketInsights) {
        setMarketInsights(savedAIContent.marketInsights);
      }
      if (savedAIContent.actionPlan) {
        setActionPlan(savedAIContent.actionPlan);
      }
      if (savedAIContent.learningPlan) {
        setLearningPlan(savedAIContent.learningPlan);
      }
      if (savedAIContent.interviewQuestions) {
        setInterviewQuestions(savedAIContent.interviewQuestions);
      }
      setDataSource(prev => prev + ' + AI Content');
      console.log('✅ Loaded AI content from enhanced storage');
      return true;
    }

    return false;
  };

  // Auto-save whenever important data changes
  useEffect(() => {
    if (userData.email && analysis) {
      const timeoutId = setTimeout(() => {
        saveAllData();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [userData, analysis, careerRecommendations, personalizedRoadmap, marketInsights, actionPlan, learningPlan, interviewQuestions]);

  // ============================================================================
  // PDF DOWNLOAD FUNCTIONALITY FOR AI CONTENT
  // ============================================================================

  const downloadAsPDF = (content, filename) => {
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 40px;
              color: #333;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              font-size: 24px;
            }
            h2 {
              color: #059669;
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            h3 {
              color: #7c3aed;
              margin-top: 20px;
              margin-bottom: 10px;
              font-size: 16px;
            }
            h4 {
              color: #dc2626;
              margin-top: 15px;
              margin-bottom: 8px;
              font-size: 14px;
            }
            p, li {
              margin-bottom: 8px;
              font-size: 12px;
            }
            ul, ol {
              margin-left: 20px;
            }
            .metadata {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              font-size: 11px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .divider {
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            strong {
              color: #1f2937;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${formatContentForPDF(content)}
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="background: #059669; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
              Download as PDF
            </button>
            <button onclick="window.close()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
    
    toast.success(`${filename} opened for PDF download!`);
  };

  const formatContentForPDF = (content) => {
    const lines = content.split('\n');
    let html = '';
    let inList = false;
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        html += '<br>';
      } else if (trimmedLine.startsWith('# ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h1>${trimmedLine.substring(2)}</h1>`;
      } else if (trimmedLine.startsWith('## ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h2>${trimmedLine.substring(3)}</h2>`;
      } else if (trimmedLine.startsWith('### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h3>${trimmedLine.substring(4)}</h3>`;
      } else if (trimmedLine.startsWith('#### ')) {
        if (inList) { html += '</ul>'; inList = false; }
        html += `<h4>${trimmedLine.substring(5)}</h4>`;
      } else if (trimmedLine === '---') {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<div class="divider"></div>';
      } else if (trimmedLine.startsWith('- ')) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${formatText(trimmedLine.substring(2))}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (trimmedLine.includes('Generated on:') || trimmedLine.includes('User:') || 
            trimmedLine.includes('Timeline:') || trimmedLine.includes('Career Match:')) {
          html += `<div class="metadata">${formatText(trimmedLine)}</div>`;
        } else {
          html += `<p>${formatText(trimmedLine)}</p>`;
        }
      }
    });
    
    if (inList) {
      html += '</ul>';
    }
    
    return html;
  };

  const formatText = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  };

  const downloadCareerRecommendations = () => {
    const content = `# AI Career Recommendations

Generated on: ${new Date().toLocaleDateString()}
User: ${userData.name}

## Top Career Recommendations:

${careerRecommendations.map((career, index) => `
### ${index + 1}. ${career.title} (${career.match}% Match)

**Description:** ${career.description}

**Why This Fits You:** ${career.whyGoodFit}

**Key Skills Needed:**
${career.keySkills.map(skill => `- ${skill}`).join('\n')}

**Salary Range:** ${career.salaryRange}
**Demand Level:** ${career.demandLevel}
**Entry Path:** ${career.entryPath}

---
`).join('\n')}`;

    downloadAsPDF(content, `AI_Career_Recommendations_${userData.name}`);
  };

  const downloadRoadmap = () => {
    if (!personalizedRoadmap) return;
    
    const content = `# ${personalizedRoadmap.careerTitle} - AI Career Roadmap

Generated on: ${new Date().toLocaleDateString()}
User: ${userData.name}
Career Match: ${personalizedRoadmap.matchScore}%
Timeline: ${personalizedRoadmap.totalDuration}
Weekly Commitment: ${personalizedRoadmap.weeklyCommitment}

---

${personalizedRoadmap.phases.map((phase, index) => `
## Phase ${index + 1}: ${phase.title}
**Timeline:** ${phase.timeline}
**Description:** ${phase.description}

### Key Milestones:
${phase.milestones.map(milestone => `- ${milestone}`).join('\n')}

### Skills to Learn:
${phase.skills ? phase.skills.map(skill => `- ${skill}`).join('\n') : 'No specific skills listed'}

---
`).join('\n')}`;

    downloadAsPDF(content, `AI_Career_Roadmap_${personalizedRoadmap.careerTitle}_${userData.name}`);
  };

  const downloadMarketInsights = () => {
    if (!marketInsights) return;
    
    const content = `# ${marketInsights.careerTitle} - AI Market Insights

Generated on: ${marketInsights.lastUpdated}
User: ${userData.name}

## Market Overview
- **Demand Level:** ${marketInsights.overview.demandLevel}
- **Growth Projection:** ${marketInsights.overview.growthProjection}
- **Competition Level:** ${marketInsights.overview.competitionLevel}
- **Entry Barrier:** ${marketInsights.overview.entryBarrier}

## Salary Insights
- **Entry Level:** ${marketInsights.salary.entry}
- **Mid Level:** ${marketInsights.salary.mid}
- **Senior Level:** ${marketInsights.salary.senior}
- **Top 10%:** ${marketInsights.salary.topPercentile}

## Job Market Statistics
- **Total Jobs:** ${marketInsights.jobMarket.totalJobs}
- **New Monthly Jobs:** ${marketInsights.jobMarket.newJobsMonthly}
- **Remote Percentage:** ${marketInsights.jobMarket.remotePercentage}
- **Top Companies:** ${marketInsights.jobMarket.topCompanies.join(', ')}

## Skills in Demand
**Trending:** ${marketInsights.skills.trending.join(', ')}
**Essential:** ${marketInsights.skills.essential.join(', ')}
**Emerging:** ${marketInsights.skills.emerging.join(', ')}

## Location Insights
**Top Cities:** ${marketInsights.locations.topCities.join(', ')}
**Remote Work:** ${marketInsights.locations.remote}
**International:** ${marketInsights.locations.international.join(', ')}

## Market Trends
${marketInsights.trends.map(trend => `- ${trend}`).join('\n')}

## AI Recommendations
${marketInsights.recommendations.map(rec => `
### ${rec.title}
**Type:** ${rec.type}
**Description:** ${rec.description}
**Action:** ${rec.action}
`).join('\n')}`;

    downloadAsPDF(content, `AI_Market_Insights_${marketInsights.careerTitle}_${userData.name}`);
  };

  const downloadActionPlan = () => {
    if (!actionPlan.length) return;
    
    const content = `# AI Action Plan

Generated on: ${new Date().toLocaleDateString()}
User: ${userData.name}
Career Goal: ${careerRecommendations[0]?.title || 'Not specified'}

## Your Personalized Action Steps:

${actionPlan.map((step, index) => `
### ${index + 1}. ${step.title}
**Timeline:** ${step.timeline}
**Priority:** ${step.priority.toUpperCase()}
**Personalized:** ${step.personalized ? 'Yes' : 'No'}

**Description:** ${step.text}

${step.resources ? `**Recommended Resources:**
${step.resources.map(resource => `- ${resource}`).join('\n')}` : ''}

---
`).join('\n')}`;

    downloadAsPDF(content, `AI_Action_Plan_${userData.name}`);
  };

  const downloadLearningPlan = () => {
    if (!learningPlan) return;
    
    const content = `# ${learningPlan.careerTitle} - AI Learning Plan

Generated on: ${new Date().toLocaleDateString()}
User: ${userData.name}
Timeline: ${learningPlan.totalDuration}

## Learning Tracks

${learningPlan.learningTracks.map(track => `
### ${track.category}
**Priority:** ${track.priority}
**Timeframe:** ${track.timeframe}

#### Resources:
${track.resources.map(resource => `
**${resource.title}**
- Provider: ${resource.provider}
- Type: ${resource.type}
- Duration: ${resource.duration}
- Cost: ${resource.cost}
- Difficulty: ${resource.difficulty}
- Description: ${resource.description}
- Skills: ${resource.skills.join(', ')}
`).join('\n')}
`).join('\n')}

${learningPlan.practiceProjects ? `
## Practice Projects
${learningPlan.practiceProjects.map(project => `
### ${project.title}
**Time Estimate:** ${project.timeEstimate}
**Difficulty:** ${project.difficulty}
**Description:** ${project.description}
**Skills:** ${project.skills.join(', ')}
`).join('\n')}` : ''}

${learningPlan.certifications ? `
## Recommended Certifications
${learningPlan.certifications.map(cert => `
### ${cert.name}
**Provider:** ${cert.provider}
**Cost:** ${cert.cost}
**Time to Complete:** ${cert.timeToComplete}
**Priority:** ${cert.priority}
**Description:** ${cert.description}
`).join('\n')}` : ''}

${learningPlan.communityResources ? `
## Community Resources
${learningPlan.communityResources.map(community => `
### ${community.name}
**Type:** ${community.type}
**Description:** ${community.description}
${community.url ? `**URL:** ${community.url}` : ''}
`).join('\n')}` : ''}`;

    downloadAsPDF(content, `AI_Learning_Plan_${learningPlan.careerTitle}_${userData.name}`);
  };

  const downloadInterviewQuestions = () => {
    if (!interviewQuestions) return;
    
    const content = `# ${interviewQuestions.careerTitle} - AI Interview Questions

Generated on: ${new Date().toLocaleDateString()}
User: ${userData.name}

${interviewQuestions.categories.map(category => `
## ${category.category}
**Description:** ${category.description}

${category.questions.map((q, index) => `
### Question ${index + 1}: ${q.question}
**Type:** ${q.type}
**Difficulty:** ${q.difficulty}
**Topic:** ${q.topic}

**Sample Answer Approach:** ${q.sampleAnswer}

**Key Points to Address:**
${q.keyPoints.map(point => `- ${point}`).join('\n')}

---
`).join('\n')}
`).join('\n')}

${interviewQuestions.preparationTips ? `
## Preparation Tips
${interviewQuestions.preparationTips.map(tip => `- ${tip.tip} (${tip.category})`).join('\n')}` : ''}

${interviewQuestions.commonMistakes ? `
## Common Mistakes to Avoid
${interviewQuestions.commonMistakes.map(mistake => `
**Mistake:** ${mistake.mistake}
**Better Approach:** ${mistake.correction}
`).join('\n')}` : ''}`;

    downloadAsPDF(content, `AI_Interview_Questions_${interviewQuestions.careerTitle}_${userData.name}`);
  };

  const callClaudeAPI = async (prompt, maxTokens = 1000) => {
    try {
      const requestBody = {
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: maxTokens,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      };

      console.log('Calling Claude API with request:', {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens,
        promptLength: prompt.length
      });

      const response = await fetch('/api/claude-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Claude API Error Response:', errorText);
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Claude API Response received successfully');
      
      if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
        return data.content[0].text;
      } else if (data.completion) {
        return data.completion;
      } else {
        throw new Error('Unexpected response format from Claude API');
      }
      
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  };

  // ============================================================================
  // CAREER RECOMMENDATIONS - AI POWERED (FIXED)
  // ============================================================================

  const generateCareerRecommendations = async (userData) => {
    setGeneratingRecommendations(true);
    
    try {
      const prompt = `Analyze this professional profile and recommend the top 5 most suitable tech career paths:

**User Profile:**
- Name: ${userData.name}
- Current Role: ${userData.currentRole}
- Experience Level: ${userData.experienceLevel}
- Education: ${userData.studyField} (${userData.educationLevel})
- Years Experience: ${userData.yearsExperience}
- Work Preference: ${userData.workPreference}
- Target Salary: ${userData.targetSalary}
- Transition Timeline: ${userData.transitionTimeline}
- Time Commitment: ${userData.timeCommitment}

**Background:**
- Responsibilities: ${userData.jobResponsibilities}
- Projects: ${userData.jobProjects}
- Technologies: ${userData.jobTechnologies}
- Publications: ${userData.publications}
- Transferable Skills: ${userData.transferableSkills}
- Interests: ${userData.interests.join(', ')}
- Career Interests: ${userData.careerPathsInterest.join(', ')}
- Tools Used: ${userData.toolsUsed.join(', ')}

Return ONLY a JSON array with exactly 5 career recommendations with no additional text:
[
  {
    "title": "Career Title",
    "match": 85,
    "description": "Brief description of the role",
    "whyGoodFit": "Why this matches their profile",
    "keySkills": ["skill1", "skill2", "skill3"],
    "salaryRange": "$80k - $150k",
    "demandLevel": "High",
    "entryPath": "How to get started"
  }
]

Focus on realistic, achievable career transitions based on their background. Respond with ONLY the JSON array.`;

      const response = await callClaudeAPI(prompt, 1500);
      const recommendations = parseAIResponse(response, []);
      
      setCareerRecommendations(recommendations);
      setContentTimestamp(new Date());
      toast.success('Career recommendations generated!');
      
    } catch (error) {
      console.error('Error generating career recommendations:', error);
      toast.error('Failed to generate recommendations. Please try again.');
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  // ============================================================================
  // PERSONALIZED ROADMAP - AI POWERED (FIXED)
  // ============================================================================

  const generatePersonalizedRoadmap = async () => {
    setGeneratingRoadmap(true);
    
    try {
      const topCareer = careerRecommendations[0];
      if (!topCareer) {
        toast.error('Please generate career recommendations first.');
        return;
      }

      const prompt = `Create a detailed, personalized career roadmap for transitioning to: ${topCareer.title}

**User Context:**
- Current: ${userData.currentRole} (${userData.experienceLevel})
- Target: ${topCareer.title}
- Timeline: ${userData.transitionTimeline}
- Time Commitment: ${userData.timeCommitment}
- Background: ${userData.studyField}
- Interests: ${userData.interests.join(', ')}

Create a roadmap with 3-4 phases. Return ONLY JSON with no additional text:
{
  "careerTitle": "${topCareer.title}",
  "matchScore": ${topCareer.match},
  "totalDuration": "${userData.transitionTimeline}",
  "weeklyCommitment": "${userData.timeCommitment}",
  "phases": [
    {
      "title": "Phase Name",
      "timeline": "0-2 months",
      "description": "What you'll accomplish",
      "milestones": ["milestone 1", "milestone 2", "milestone 3"],
      "skills": ["skill 1", "skill 2", "skill 3", "skill 4"],
      "completed": false
    }
  ]
}

Make it specific to their background and realistic for their timeline. Respond with ONLY the JSON object.`;

      const response = await callClaudeAPI(prompt, 2000);
      const roadmap = parseAIResponse(response, null);
      
      setPersonalizedRoadmap(roadmap);
      toast.success('Personalized roadmap generated!');
      
    } catch (error) {
      console.error('Error generating roadmap:', error);
      toast.error('Failed to generate roadmap. Please try again.');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // ============================================================================
  // MARKET INSIGHTS - AI POWERED (FIXED)
  // ============================================================================

  const generateMarketInsights = async () => {
    setGeneratingInsights(true);
    
    try {
      const topCareer = careerRecommendations[0];
      if (!topCareer) {
        toast.error('Please generate career recommendations first.');
        return;
      }

      const prompt = `Provide current market analysis for: ${topCareer.title}

Include real market data and trends. Return ONLY JSON with no additional text:
{
  "careerTitle": "${topCareer.title}",
  "lastUpdated": "${new Date().toLocaleDateString()}",
  "overview": {
    "demandLevel": "Very High",
    "growthProjection": "+25% (2024-2034)",
    "competitionLevel": "Medium-High",
    "entryBarrier": "Medium"
  },
  "salary": {
    "entry": "$75,000 - $110,000",
    "mid": "$110,000 - $150,000",
    "senior": "$150,000 - $200,000",
    "topPercentile": "$250,000+"
  },
  "jobMarket": {
    "totalJobs": "85,000+ active positions",
    "newJobsMonthly": "7,500+ new openings",
    "remotePercentage": "78%",
    "topCompanies": ["Company1", "Company2", "Company3", "Company4"]
  },
  "skills": {
    "trending": ["skill1", "skill2", "skill3"],
    "essential": ["skill1", "skill2", "skill3"],
    "emerging": ["skill1", "skill2", "skill3"]
  },
  "locations": {
    "topCities": ["San Francisco", "Seattle", "New York"],
    "remote": "High availability",
    "international": ["London", "Toronto", "Berlin"]
  },
  "trends": ["trend 1", "trend 2", "trend 3"],
  "recommendations": [
    {
      "type": "skills",
      "title": "Recommendation Title",
      "description": "Detailed description",
      "action": "Specific action to take"
    }
  ]
}

Base this on current 2024-2025 market conditions. Respond with ONLY the JSON object.`;

      const response = await callClaudeAPI(prompt, 2000);
      const insights = parseAIResponse(response, null);
      
      setMarketInsights(insights);
      toast.success('Market insights generated!');
      
    } catch (error) {
      console.error('Error generating market insights:', error);
      toast.error('Failed to generate market insights. Please try again.');
    } finally {
      setGeneratingInsights(false);
    }
  };

  // ============================================================================
  // ACTION PLAN - AI POWERED (FIXED)
  // ============================================================================

  const generateActionPlan = async () => {
    setGeneratingActionPlan(true);
    
    try {
      const topCareer = careerRecommendations[0];
      if (!topCareer) {
        toast.error('Please generate career recommendations first.');
        return;
      }

      const prompt = `Create a personalized action plan for ${userData.name} transitioning to ${topCareer.title}:

**Context:**
- Current Role: ${userData.currentRole}
- Experience: ${userData.experienceLevel}
- Timeline: ${userData.transitionTimeline}
- Time Available: ${userData.timeCommitment}
- Background: ${userData.studyField}

Generate 6-8 specific, actionable steps. Return ONLY JSON array with no additional text:
[
  {
    "title": "Action Item Title",
    "text": "Detailed description of what to do and why",
    "timeline": "2-4 weeks",
    "priority": "high",
    "personalized": true,
    "resources": ["resource 1", "resource 2"],
    "icon": "🎓"
  }
]

Make each action specific, time-bound, and directly relevant to their transition goal. Respond with ONLY the JSON array.`;

      const response = await callClaudeAPI(prompt, 1500);
      const actions = parseAIResponse(response, []);
      
      setActionPlan(actions);
      toast.success('Action plan generated!');
      
    } catch (error) {
      console.error('Error generating action plan:', error);
      toast.error('Failed to generate action plan. Please try again.');
    } finally {
      setGeneratingActionPlan(false);
    }
  };

  // ============================================================================
  // ADDITIONAL AI GENERATIONS (FIXED)
  // ============================================================================

  const generateNetworkingStrategy = async () => {
    try {
      const topCareer = careerRecommendations[0];
      const prompt = `Create a networking strategy for someone transitioning to ${topCareer?.title}:

**User Profile:**
- Current: ${userData.currentRole}
- Target: ${topCareer?.title}
- Location Preference: ${userData.workPreference}
- Experience: ${userData.experienceLevel}

Return ONLY a JSON array of networking strategies with no additional text:
[
  {
    "text": "Specific networking action",
    "type": "strategy",
    "timeline": "timeline",
    "platforms": ["LinkedIn", "Twitter"],
    "why": "Why this helps"
  }
]

Focus on realistic, achievable networking actions. Respond with ONLY the JSON array.`;

      const response = await callClaudeAPI(prompt, 800);
      const strategies = parseAIResponse(response, []);
      setNetworkingStrategy(strategies);
      
    } catch (error) {
      console.error('Error generating networking strategy:', error);
      setNetworkingStrategy([]);
    }
  };

  const generateCareerLearningPlan = async () => {
    setGeneratingLearning(true);
    
    try {
      const topCareer = careerRecommendations[0];
      if (!topCareer) {
        toast.error('Please generate career recommendations first.');
        return;
      }

      const prompt = `Create a comprehensive learning plan for someone transitioning to: ${topCareer.title}

**User Profile:**
- Current Role: ${userData.currentRole}
- Experience Level: ${userData.experienceLevel}
- Educational Background: ${userData.studyField} (${userData.educationLevel})
- Timeline: ${userData.transitionTimeline}
- Time Commitment: ${userData.timeCommitment}
- Current Tech Skills: ${userData.jobTechnologies}
- Interests: ${userData.interests.join(', ')}

Create a detailed learning plan with specific resources. Return ONLY JSON with no additional text:
{
  "careerTitle": "${topCareer.title}",
  "totalDuration": "${userData.transitionTimeline}",
  "learningTracks": [
    {
      "category": "Foundation Skills",
      "priority": "High",
      "timeframe": "Month 1-2",
      "resources": [
        {
          "title": "Specific Course/Resource Name",
          "type": "Course",
          "provider": "Coursera/Udemy/FreeCodeCamp/etc",
          "duration": "4 weeks",
          "cost": "Free",
          "difficulty": "Beginner",
          "description": "Why this resource is essential",
          "skills": ["skill1", "skill2", "skill3"]
        }
      ]
    }
  ],
  "practiceProjects": [
    {
      "title": "Project Name",
      "description": "What to build and why",
      "skills": ["skill1", "skill2"],
      "timeEstimate": "2-3 weeks",
      "difficulty": "Beginner"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "provider": "AWS/Google/Microsoft/etc",
      "cost": "$150",
      "timeToComplete": "2-4 weeks",
      "priority": "High",
      "description": "Why this certification matters"
    }
  ],
  "communityResources": [
    {
      "name": "Community/Forum Name",
      "type": "Forum",
      "description": "How this helps with learning",
      "url": "Optional URL if well-known"
    }
  ]
}

Make recommendations specific to their background and very actionable. Respond with ONLY the JSON object.`;

      const response = await callClaudeAPI(prompt, 2500);
      const learningPlan = parseAIResponse(response, null);
      
      setLearningPlan(learningPlan);
      toast.success('Learning plan generated!');
      
    } catch (error) {
      console.error('Error generating learning plan:', error);
      toast.error('Failed to generate learning plan. Please try again.');
    } finally {
      setGeneratingLearning(false);
    }
  };

  // ============================================================================
  // CAREER-SPECIFIC INTERVIEW QUESTIONS (FIXED)
  // ============================================================================

  const generateInterviewQuestions = async () => {
    setGeneratingInterviews(true);
    
    try {
      const topCareer = careerRecommendations[0];
      if (!topCareer) {
        toast.error('Please generate career recommendations first.');
        return;
      }

      const prompt = `Generate comprehensive interview questions for ${topCareer.title} positions:

**Context:**
- Target Role: ${topCareer.title}
- Candidate Background: ${userData.currentRole} transitioning to tech
- Experience Level: ${userData.experienceLevel}
- Educational Background: ${userData.studyField}
- Technical Skills: ${userData.jobTechnologies}

Create interview questions covering all aspects. Return ONLY JSON with no additional text:
{
  "careerTitle": "${topCareer.title}",
  "categories": [
    {
      "category": "Technical Questions",
      "description": "Core technical skills assessment",
      "questions": [
        {
          "question": "Specific technical question",
          "type": "Technical",
          "difficulty": "Entry",
          "topic": "Programming/Data/Design/etc",
          "sampleAnswer": "Brief guidance on how to approach this question",
          "keyPoints": ["point1", "point2", "point3"]
        }
      ]
    },
    {
      "category": "Behavioral Questions",
      "description": "Assessing soft skills and fit",
      "questions": [
        {
          "question": "Behavioral question",
          "type": "Behavioral",
          "difficulty": "Standard",
          "topic": "Leadership/Communication/Problem-solving",
          "sampleAnswer": "STAR method guidance",
          "keyPoints": ["what interviewers look for"]
        }
      ]
    },
    {
      "category": "Career Transition Questions",
      "description": "Questions specific to career changers",
      "questions": [
        {
          "question": "Why are you transitioning from ${userData.currentRole} to ${topCareer.title}?",
          "type": "Transition",
          "difficulty": "Standard",
          "topic": "Career Change",
          "sampleAnswer": "How to frame your transition positively",
          "keyPoints": ["emphasize transferable skills", "show passion for tech"]
        }
      ]
    },
    {
      "category": "Situational Questions",
      "description": "Real-world scenario questions",
      "questions": [
        {
          "question": "Situational question",
          "type": "Situational",
          "difficulty": "Standard",
          "topic": "Problem-solving",
          "sampleAnswer": "Approach to solve the situation",
          "keyPoints": ["key considerations"]
        }
      ]
    }
  ],
  "preparationTips": [
    {
      "tip": "Specific preparation advice",
      "category": "Technical"
    }
  ],
  "commonMistakes": [
    {
      "mistake": "What not to do",
      "correction": "What to do instead"
    }
  ]
}

Focus on questions that are realistic for someone transitioning from ${userData.currentRole} to ${topCareer.title}. Respond with ONLY the JSON object.`;

      const response = await callClaudeAPI(prompt, 2500);
      const questions = parseAIResponse(response, null);
      
      setInterviewQuestions(questions);
      toast.success('Interview questions generated!');
      
    } catch (error) {
      console.error('Error generating interview questions:', error);
      toast.error('Failed to generate interview questions. Please try again.');
    } finally {
      setGeneratingInterviews(false);
    }
  };

  // ============================================================================
  // MAIN DATA LOADING
  // ============================================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!currentUser) {
          navigate('/login', { 
            state: { message: 'Please log in to access your career dashboard' } 
          });
          return;
        }

        let processedUserData = null;
        let hasLoadedFromStorage = false;

        // Priority 1: Try to load from navigation state (fresh test results)
        if (location.state?.formData) {
          console.log('📝 Loading fresh test results from navigation');
          const formData = location.state.formData;
          
          processedUserData = {
            name: formData.fullName || currentUser.displayName || 'User',
            email: formData.email || currentUser.email,
            experienceLevel: formData.experienceLevel,
            studyField: formData.studyField || 'Not specified',
            educationLevel: formData.educationLevel || 'Not specified',
            currentRole: formData.currentRole || 'Not specified',
            yearsExperience: formData.yearsExperience || 'Not specified',
            jobResponsibilities: formData.jobResponsibilities || 'Not specified',
            jobProjects: formData.jobProjects || 'Not specified',
            jobTechnologies: formData.jobTechnologies || 'Not specified',
            publications: formData.publications || 'Not specified',
            transferableSkills: formData.transferableSkills || 'Not specified',
            interests: typeof formData.techInterests === 'string' 
              ? formData.techInterests.split(',').map(i => i.trim()) 
              : (Array.isArray(formData.techInterests) ? formData.techInterests : []),
            careerPathsInterest: formData.careerPathsInterest || [],
            toolsUsed: formData.toolsUsed || [],
            techInterests: formData.techInterests || '',
            timeCommitment: formData.timeCommitment || '',
            targetSalary: formData.targetSalary || '',
            workPreference: formData.workPreference || '',
            transitionTimeline: formData.transitionTimeline || ''
          };
          
          setUserData(processedUserData);
          setAnalysis(location.state.analysis || '');
          setDataSource('Fresh test results');
          
          // Generate new recommendations for fresh data
          await generateCareerRecommendations(processedUserData);
          
        } else {
          // Priority 2: Try to load from enhanced storage
          console.log('💾 Attempting to load from enhanced storage');
          hasLoadedFromStorage = loadSavedData();
          
          if (hasLoadedFromStorage) {
            setDataSource('Enhanced storage (restored)');
          } else {
            // Priority 3: Try to load from legacy storage
            console.log('🔄 Trying legacy storage as fallback');
            const storedAnalysis = storageService.getLatestAnalysis();
            if (storedAnalysis) {
              const submission = storageService.getSubmissionById(storedAnalysis.submissionId);
              if (submission) {
                processedUserData = {
                  name: submission.fullName || currentUser.displayName || 'User',
                  email: submission.email || currentUser.email,
                  experienceLevel: submission.experienceLevel,
                  studyField: submission.studyField || 'Not specified',
                  educationLevel: submission.educationLevel || 'Not specified',
                  currentRole: submission.currentRole || 'Not specified',
                  yearsExperience: submission.yearsExperience || 'Not specified',
                  jobResponsibilities: submission.jobResponsibilities || 'Not specified',
                  jobProjects: submission.jobProjects || 'Not specified',
                  jobTechnologies: submission.jobTechnologies || 'Not specified',
                  publications: submission.publications || 'Not specified',
                  transferableSkills: submission.transferableSkills || 'Not specified',
                  interests: typeof submission.techInterests === 'string' 
                    ? submission.techInterests.split(',').map(i => i.trim()) 
                    : (Array.isArray(submission.techInterests) ? submission.techInterests : []),
                  careerPathsInterest: submission.careerPathsInterest || [],
                  toolsUsed: submission.toolsUsed || [],
                  techInterests: submission.techInterests || '',
                  timeCommitment: submission.timeCommitment || '',
                  targetSalary: submission.targetSalary || '',
                  workPreference: submission.workPreference || '',
                  transitionTimeline: submission.transitionTimeline || ''
                };
                
                setUserData(processedUserData);
                setAnalysis(storedAnalysis.analysis);
                setDataSource('Legacy storage (migrated)');
                
                // Migrate to enhanced storage
                const userId = getUserId();
                enhancedStorageService.saveUserAnalysis(userId, {
                  analysis: storedAnalysis.analysis,
                  userData: processedUserData,
                  timestamp: new Date().toISOString()
                });
                
                // Generate career recommendations from migrated data
                await generateCareerRecommendations(processedUserData);
              }
            } else {
              // Priority 4: No data found, redirect to test
              console.log('🔄 No saved data found, redirecting to test');
              navigate('/career/test', { 
                state: { message: 'Please complete the assessment to view your dashboard' } 
              });
              return;
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        toast.error('Error loading your data. Please try refreshing or retaking the test.');
        navigate('/career/test', { 
          state: { message: 'Error loading your results. Please try again.' } 
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [location, navigate, currentUser]);

  // Generate additional AI content when career recommendations are ready
  useEffect(() => {
    if (careerRecommendations.length > 0) {
      generateNetworkingStrategy();
    }
  }, [careerRecommendations]);

  // Handle retake test with data cleanup
  const handleRetakeTest = () => {
    const userId = getUserId();
    enhancedStorageService.clearAllUserData();
    navigate('/career/test');
    toast.info('Starting fresh assessment...');
  };

  // Quick restore function for debugging
  const handleQuickRestore = () => {
    const userId = getUserId();
    const restored = loadSavedData();
    if (restored) {
      toast.success('Data restored from storage!');
      setDataSource('Manually restored');
    } else {
      toast.warning('No saved data found to restore');
    }
  };

  // Show data source in development
  const showDataSource = process.env.NODE_ENV === 'development';

  // ============================================================================
  // UI COMPONENTS
  // ============================================================================

  const CareerRecommendationCard = ({ career, index, isTop }) => (
    <div className={`bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-lime-500/25 transition-all duration-500 transform hover:-translate-y-2 border border-white/20 ${
      isTop ? 'ring-2 ring-lime-500/50' : ''
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <div className="text-2xl sm:text-3xl lg:text-4xl mr-3 sm:mr-4">
            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '💼'}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-1 sm:mb-2" 
                style={{
                  textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.8)',
                  fontFamily: '"Inter", sans-serif'
                }}>
              {career.title}
            </h3>
            <p className="text-sm sm:text-base text-lime-300 font-semibold" 
               style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
              {career.demandLevel} Demand
            </p>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-lime-400 mb-1"
               style={{textShadow: '0 0 20px rgba(76, 175, 80, 0.8)'}}>
            {career.match}%
          </div>
          <div className="text-xs sm:text-sm text-gray-300" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Match
          </div>
        </div>
      </div>
      
      <p className="text-gray-200 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base lg:text-lg" 
         style={{
           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
           fontFamily: '"Inter", sans-serif'
         }}>
        {career.description}
      </p>
      
      <div className="mb-4 sm:mb-6">
        <h4 className="font-bold text-white mb-2 sm:mb-3 text-base sm:text-lg" 
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontFamily: '"Inter", sans-serif'
            }}>
          Why This Fits You:
        </h4>
        <p className="text-gray-200 leading-relaxed text-sm sm:text-base" 
           style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
          {career.whyGoodFit}
        </p>
      </div>
      
      <div className="mb-4 sm:mb-6">
        <h4 className="font-bold text-white mb-2 sm:mb-3 text-base sm:text-lg" 
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              fontFamily: '"Inter", sans-serif'
            }}>
          Key Skills Needed:
        </h4>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {career.keySkills.map((skill, idx) => (
            <span key={idx} className="px-2 sm:px-3 lg:px-4 py-1 sm:py-2 bg-gradient-to-r from-lime-500/20 to-green-500/20 text-lime-300 rounded-full text-xs sm:text-sm border border-lime-500/30 font-medium backdrop-blur-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20">
          <span className="font-bold text-lime-300 block mb-1 sm:mb-2" 
                style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
            Salary Range:
          </span>
          <div className="text-white font-bold text-sm sm:text-base lg:text-lg" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            {career.salaryRange}
          </div>
        </div>
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20">
          <span className="font-bold text-lime-300 block mb-1 sm:mb-2" 
                style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
            Entry Path:
          </span>
          <div className="text-gray-200 text-sm sm:text-base" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            {career.entryPath}
          </div>
        </div>
      </div>
      
      {isTop && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-lime-500/20 to-green-500/20 rounded-xl sm:rounded-2xl border border-lime-500/30 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <span className="text-lime-400 mr-0 sm:mr-3 text-xl sm:text-2xl mb-2 sm:mb-0"
                  style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
              ⭐
            </span>
            <span className="text-lime-300 font-bold text-sm sm:text-base lg:text-lg" 
                  style={{
                    textShadow: '0 0 10px rgba(76, 175, 80, 0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
              Top Recommendation - Generate roadmap below!
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const ActionCard = ({ step, index }) => {
    const priorityColors = {
      high: 'from-red-500/20 to-pink-500/20 border-red-500/30',
      medium: 'from-lime-500/20 to-green-500/20 border-lime-500/30',
      low: 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
    };

    const priorityTextColors = {
      high: 'text-red-300',
      medium: 'text-lime-300',
      low: 'text-gray-300'
    };

    return (
      <div className={`bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-lime-500/25 transition-all duration-500 transform hover:-translate-y-2 border border-white/20 ${
        step.personalized ? 'ring-2 ring-lime-500/50' : ''
      }`}>
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-start sm:items-center mb-4 sm:mb-0 w-full sm:w-auto">
            <span className="text-2xl sm:text-3xl lg:text-4xl mr-3 sm:mr-4 flex-shrink-0" 
                  style={{filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.6))'}}>
              {step.icon}
            </span>
            <div className="flex-1 sm:flex-none">
              <h4 className="font-black text-base sm:text-lg lg:text-xl text-white mb-1 sm:mb-2" 
                  style={{
                    textShadow: '0 0 15px rgba(255,255,255,0.2), 2px 2px 4px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                {step.title}
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                <p className="text-gray-300 text-sm sm:text-base" 
                   style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                  {step.timeline}
                </p>
                {step.personalized && (
                  <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold border border-purple-500/30 backdrop-blur-sm w-fit">
                    🤖 AI-Generated
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r ${priorityColors[step.priority || 'medium']} ${priorityTextColors[step.priority || 'medium']} border backdrop-blur-sm flex-shrink-0`}>
            {(step.priority || 'MEDIUM').toUpperCase()}
          </div>
        </div>
        
        <p className="text-gray-200 leading-relaxed text-sm sm:text-base lg:text-lg mb-4 sm:mb-6" 
           style={{
             textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
             fontFamily: '"Inter", sans-serif'
           }}>
          {step.text}
        </p>
        
        {step.resources && (
          <div className="p-3 sm:p-4 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20">
            <h5 className="font-bold text-lime-300 mb-2 sm:mb-3 text-sm sm:text-base" 
                style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
              Recommended Resources:
            </h5>
            <ul className="text-gray-200 space-y-1 sm:space-y-2">
              {step.resources.slice(0, 2).map((resource, idx) => (
                <li key={idx} className="flex items-start text-sm sm:text-base">
                  <span className="text-lime-400 mr-2 sm:mr-3 mt-1 flex-shrink-0" 
                        style={{filter: 'drop-shadow(0 0 10px rgba(76, 175, 80, 0.8))'}}>
                    •
                  </span>
                  <span style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    {resource}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Market Insights Components
  const MarketOverviewCard = ({ overview, careerTitle }) => (
    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
      <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6" 
          style={{
            textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.8)',
            fontFamily: '"Inter", sans-serif'
          }}>
        Market Overview
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="text-center bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20">
          <div className={`text-xl sm:text-2xl lg:text-3xl font-black mb-1 sm:mb-2 ${
            overview.demandLevel === 'Very High' ? 'text-lime-400' : 
            overview.demandLevel === 'High' ? 'text-green-400' : 'text-yellow-400'
          }`} style={{textShadow: '0 0 15px rgba(76, 175, 80, 0.8)'}}>
            {overview.demandLevel}
          </div>
          <div className="text-xs sm:text-sm text-gray-300" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Demand Level
          </div>
        </div>
        <div className="text-center bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black mb-1 sm:mb-2 text-lime-400" 
               style={{textShadow: '0 0 15px rgba(76, 175, 80, 0.8)'}}>
            {overview.growthProjection}
          </div>
          <div className="text-xs sm:text-sm text-gray-300" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Growth Rate
          </div>
        </div>
        <div className="text-center bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20">
          <div className={`text-xl sm:text-2xl lg:text-3xl font-black mb-1 sm:mb-2 ${
            overview.competitionLevel === 'High' ? 'text-orange-400' : 
            overview.competitionLevel === 'Medium' ? 'text-yellow-400' : 'text-lime-400'
          }`} style={{textShadow: '0 0 15px rgba(255, 193, 7, 0.8)'}}>
            {overview.competitionLevel}
          </div>
          <div className="text-xs sm:text-sm text-gray-300" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Competition
          </div>
        </div>
        <div className="text-center bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20">
          <div className={`text-xl sm:text-2xl lg:text-3xl font-black mb-1 sm:mb-2 ${
            overview.entryBarrier === 'High' ? 'text-red-400' : 
            overview.entryBarrier === 'Medium' ? 'text-yellow-400' : 'text-lime-400'
          }`} style={{textShadow: '0 0 15px rgba(76, 175, 80, 0.8)'}}>
            {overview.entryBarrier}
          </div>
          <div className="text-xs sm:text-sm text-gray-300" 
               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
            Entry Barrier
          </div>
        </div>
      </div>
    </div>
  );

  // Handle feedback form changes
  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit feedback to Google Form
  const submitFeedback = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    
    try {
      const formData = new FormData();
      formData.append('entry.162050771', feedbackData.rating);
      formData.append('entry.2083196363', feedbackData.improvements);
      
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });
      
      toast.success('Thank you for your feedback!');
      setShowFeedbackForm(false);
      setFeedbackData({
        rating: '',
        improvements: ''
      });
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your AI-powered career analysis..." />;
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
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(76, 175, 80, 0.1), transparent 40%)`
        }}
      />

      {/* NAVIGATION HEADER - ADDED HERE */}
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

      {/* UPDATED WELCOME HEADER - Add top margin for fixed navigation */}
      <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white relative overflow-hidden mt-16 sm:mt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-lime-400/20 via-green-400/20 to-emerald-400/20 animate-pulse"></div>
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6 leading-tight" 
                style={{
                  textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.5)',
                  fontFamily: '"Inter", sans-serif'
                }}>
              Welcome back, {userData.name}! 👋
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl opacity-90 mb-6 sm:mb-8 font-light px-4" 
               style={{
                 textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                 fontFamily: '"Inter", sans-serif'
               }}>
              Your AI-powered career recommendations and insights
            </p>
            
            {/* Data source indicator */}
            {showDataSource && dataSource && (
              <div className="bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm mb-4 inline-block">
                📊 Data Source: {dataSource}
              </div>
            )}
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 text-sm sm:text-base lg:text-lg px-4">
              {userData.currentRole !== 'Not specified' && (
                <div className="bg-white bg-opacity-20 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-white/30" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                  <span className="hidden sm:inline">Currently: </span>{userData.currentRole}
                </div>
              )}
              {careerRecommendations.length > 0 && (
                <div className="bg-white bg-opacity-20 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-white/30" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                  <span className="hidden sm:inline">Top Match: </span>{careerRecommendations[0].title} ({careerRecommendations[0].match}%)
                </div>
              )}
              {userData.transitionTimeline && (
                <div className="bg-white bg-opacity-20 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full backdrop-blur-sm border border-white/30" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                  <span className="hidden sm:inline">Timeline: </span>{userData.transitionTimeline}
                </div>
              )}
              <div className="bg-purple-400 bg-opacity-30 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-full border border-purple-300 backdrop-blur-sm" 
                   style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                🤖 AI Powered
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATED NAVIGATION TABS - Adjust sticky position for fixed header */}
      <div className="sticky top-16 sm:top-20 z-40" 
           style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-start sm:justify-center overflow-x-auto scrollbar-hide">
            <div className="flex space-x-1 sm:space-x-2 min-w-max mx-auto">
              {[
                { id: 'paths', label: '🤖 CareerPath' },
                { id: 'roadmap', label: '🗺️ Roadmap' },
                { id: 'market', label: '📊 Market' },
                { id: 'action', label: '⚡ Action' },
                { id: 'resources', label: '📚 LearningPlan'},
                ...(showDataSource ? [{ id: 'restore', label: '🔄 Restore', action: handleQuickRestore }] : []),
                { id: 'retake', label: '🔄 Retake', action: handleRetakeTest }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => tab.action ? tab.action() : setActiveTab(tab.id)}
                  className={`flex items-center px-4 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-4 lg:py-5 font-bold transition-all duration-300 border-b-2 whitespace-nowrap text-base sm:text-base lg:text-lg ${
                    tab.id === 'retake' || tab.id === 'restore'
                      ? 'border-transparent text-gray-300 hover:text-lime-400 hover:bg-white/10'
                      : activeTab === tab.id
                      ? 'border-lime-500 text-lime-400 bg-white/10'
                      : 'border-transparent text-gray-300 hover:text-lime-400 hover:bg-white/5'
                  }`}
                  style={{
                    textShadow: activeTab === tab.id ? '0 0 10px rgba(76, 175, 80, 0.8)' : '1px 1px 2px rgba(0,0,0,0.8)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        
        {/* AI Career Paths Tab */}
        {activeTab === 'paths' && (
          <div className="space-y-8 lg:space-y-12">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-white px-4" 
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                AI Career Recommendations
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-4xl mx-auto px-4" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Personalized career paths based on your complete profile analysis
              </p>
              
              {/* Save status indicator */}
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
                  ✅ Auto-saved to your device
                </div>
                {showDataSource && (
                  <button 
                    onClick={saveAllData}
                    className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full hover:bg-blue-500/30"
                  >
                    💾 Manual Save
                  </button>
                )}
              </div>
              
              {generatingRecommendations && (
                <div className="mt-4 sm:mt-6 flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-lime-400"></div>
                  <span className="text-lime-400 text-base sm:text-lg font-medium" 
                        style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
                    AI is analyzing your profile...
                  </span>
                </div>
              )}
            </div>

            {careerRecommendations.length > 0 ? (
              <div className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {careerRecommendations.map((career, index) => (
                    <CareerRecommendationCard 
                      key={index} 
                      career={career} 
                      index={index} 
                      isTop={index === 0}
                    />
                  ))}
                </div>
                
                {/* Enhanced Download Button */}
                <div className="text-center mt-6 lg:mt-8 px-4">
                  <button
                    onClick={downloadCareerRecommendations}
                    className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-lime-600 hover:to-emerald-700 transition-all font-bold text-sm sm:text-base lg:text-lg inline-flex items-center space-x-2 sm:space-x-3 shadow-2xl transform hover:scale-105"
                    style={{
                      boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download Career Recommendations (PDF)</span>
                    <span className="sm:hidden">Download PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 lg:py-16 px-4">
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl max-w-2xl mx-auto border border-white/20">
                  <div className="text-6xl sm:text-7xl lg:text-8xl mb-4 sm:mb-6">🤖</div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    {generatingRecommendations ? 'Generating AI Recommendations' : 'Ready to Generate Recommendations'}
                  </h3>
                  {!generatingRecommendations && userData.email && (
                    <button
                      onClick={() => generateCareerRecommendations(userData)}
                      className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-lime-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-2xl"
                      style={{
                        boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      🤖 Generate Career Recommendations
                    </button>
                  )}
                  <p className="text-gray-300 text-sm sm:text-base lg:text-lg mt-4" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    AI will analyze your profile to create personalized career recommendations.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Career Roadmap Tab */}
        {activeTab === 'roadmap' && (
          <div className="space-y-8 lg:space-y-12">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-white px-4" 
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                AI Career Roadmap
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-4xl mx-auto px-4" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Personalized step-by-step plan generated by AI
              </p>
            </div>

            {!personalizedRoadmap ? (
              <div className="text-center py-12 lg:py-16 px-4">
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl max-w-3xl mx-auto border border-white/20">
                  <div className="text-6xl sm:text-7xl lg:text-8xl mb-6 sm:mb-8">🗺️</div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-4 sm:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Generate Your AI Roadmap
                  </h3>
                  <p className="text-gray-200 mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    AI will create a detailed, personalized roadmap for your career transition to{' '}
                    <span className="font-bold text-lime-400" 
                          style={{textShadow: '0 0 15px rgba(76, 175, 80, 0.8)'}}>
                      {careerRecommendations[0]?.title || 'your selected career'}
                    </span>.
                  </p>
                  
                  <button
                    onClick={generatePersonalizedRoadmap}
                    disabled={generatingRoadmap || careerRecommendations.length === 0}
                    className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-8 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg lg:text-xl hover:from-lime-600 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-2xl"
                    style={{
                      boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {generatingRoadmap ? (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">AI is creating your roadmap...</span>
                        <span className="sm:hidden">Creating...</span>
                      </div>
                    ) : (
                      <>
                        <span className="hidden sm:inline">🤖 Generate AI Roadmap</span>
                        <span className="sm:hidden">🤖 Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 lg:space-y-8">
                {/* Enhanced Roadmap Header */}
                <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-8 mb-8 lg:mb-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-lime-400/20 via-green-400/20 to-emerald-400/20 animate-pulse"></div>
                  <div className="relative text-center">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-3 sm:mb-4" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Your AI Roadmap: {personalizedRoadmap.careerTitle}
                    </h2>
                    <p className="text-lime-100 mb-4 sm:mb-6 text-base sm:text-lg lg:text-xl font-light" 
                       style={{
                         textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      Tailored path to become a {personalizedRoadmap.careerTitle}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
                      <div className="bg-white bg-opacity-20 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-white/30">
                        <div className="text-2xl sm:text-3xl font-black" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                          {personalizedRoadmap.matchScore}%
                        </div>
                        <div className="text-xs sm:text-sm text-lime-100 font-medium" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                          Career Match
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-white/30">
                        <div className="text-2xl sm:text-3xl font-black" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                          {personalizedRoadmap.totalDuration}
                        </div>
                        <div className="text-xs sm:text-sm text-lime-100 font-medium" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                          Timeline
                        </div>
                      </div>
                      <div className="bg-white bg-opacity-20 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-white/30">
                        <div className="text-2xl sm:text-3xl font-black" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                          {personalizedRoadmap.weeklyCommitment}
                        </div>
                        <div className="text-xs sm:text-sm text-lime-100 font-medium" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                          Weekly Time
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Roadmap phases display */}
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-6 sm:mb-8" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Your AI-Generated Phases
                  </h3>
                  <div className="space-y-6 sm:space-y-8">
                    {personalizedRoadmap.phases.map((phase, index) => (
                      <div key={index} className="relative">
                        {index < personalizedRoadmap.phases.length - 1 && (
                          <div className="absolute left-6 sm:left-8 top-16 sm:top-20 w-0.5 sm:w-1 h-full bg-gradient-to-b from-lime-500 to-green-500 opacity-30 rounded-full hidden sm:block"></div>
                        )}
                        
                        <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 lg:space-x-6 mb-6 sm:mb-8">
                          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-lime-500 to-green-600 text-white rounded-full flex items-center justify-center font-black text-lg sm:text-xl lg:text-2xl shadow-2xl" 
                               style={{boxShadow: '0 0 30px rgba(76, 175, 80, 0.6)'}}>
                            {index + 1}
                          </div>
                          
                          <div className="flex-grow bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl hover:shadow-lime-500/25 transition-all duration-500 border border-white/20 w-full">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6">
                              <div>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-white mb-2 sm:mb-3" 
                                    style={{
                                      textShadow: '0 0 15px rgba(255,255,255,0.2)',
                                      fontFamily: '"Inter", sans-serif'
                                    }}>
                                  {phase.title}
                                </h3>
                                <p className="text-lime-400 font-bold text-sm sm:text-base lg:text-lg" 
                                   style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
                                  {phase.timeline}
                                </p>
                              </div>
                              <span className="px-3 sm:px-4 py-1 sm:py-2 bg-purple-500/20 text-purple-300 rounded-full text-xs sm:text-sm font-bold border border-purple-500/30 backdrop-blur-sm mt-2 sm:mt-0">
                                🤖 AI Generated
                              </span>
                            </div>
                            
                            <p className="text-gray-200 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg leading-relaxed" 
                               style={{
                                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                 fontFamily: '"Inter", sans-serif'
                               }}>
                              {phase.description}
                            </p>
                            
                            <div className="mb-4 sm:mb-6">
                              <h4 className="font-black text-white mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg flex items-center" 
                                  style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                    fontFamily: '"Inter", sans-serif'
                                  }}>
                                <span className="text-xl sm:text-2xl mr-2 sm:mr-3">🎯</span>
                                Key Milestones:
                              </h4>
                              <div className="space-y-2 sm:space-y-3">
                                {phase.milestones.map((milestone, idx) => (
                                  <div key={idx} className="flex items-start space-x-3 sm:space-x-4">
                                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-lime-500 rounded-full mt-1 sm:mt-2 flex-shrink-0" 
                                         style={{boxShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}></div>
                                    <span className="text-gray-200 text-sm sm:text-base lg:text-lg" 
                                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                                      {milestone}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {phase.skills && phase.skills.length > 0 && (
                              <div>
                                <h4 className="font-black text-white mb-3 sm:mb-4 text-sm sm:text-base lg:text-lg flex items-center" 
                                    style={{
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                      fontFamily: '"Inter", sans-serif'
                                    }}>
                                  <span className="text-xl sm:text-2xl mr-2 sm:mr-3">⚡</span>
                                  Skills to Learn
                                </h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                                  {phase.skills.map((skill, idx) => (
                                    <div 
                                      key={idx}
                                      className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-gradient-to-r from-lime-500/20 to-green-500/20 rounded-xl sm:rounded-2xl border border-lime-500/30 backdrop-blur-sm"
                                    >
                                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-lime-500 rounded-full flex-shrink-0" 
                                           style={{boxShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}></div>
                                      <span className="text-lime-300 font-bold text-xs sm:text-sm lg:text-base" 
                                            style={{textShadow: '0 0 10px rgba(76, 175, 80, 0.8)'}}>
                                        {skill}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Enhanced Download Button for Roadmap */}
                  <div className="text-center mt-8 lg:mt-10 px-4">
                    <button
                      onClick={downloadRoadmap}
                      className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-lime-600 hover:to-emerald-700 transition-all font-bold text-sm sm:text-base lg:text-lg inline-flex items-center space-x-2 sm:space-x-3 shadow-2xl transform hover:scale-105"
                      style={{
                        boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)',
                        fontFamily: '"Inter", sans-serif'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="hidden sm:inline">Download Career Roadmap (PDF)</span>
                      <span className="sm:hidden">Download PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Insights Tab */}
        {activeTab === 'market' && (
          <div className="space-y-8 lg:space-y-12">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-white px-4" 
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                AI Market Insights
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-4xl mx-auto px-4" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Real-time market intelligence generated by AI
              </p>
            </div>

            {!marketInsights ? (
              <div className="text-center py-12 lg:py-16 px-4">
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl max-w-3xl mx-auto border border-white/20">
                  <div className="text-6xl sm:text-7xl lg:text-8xl mb-6 sm:mb-8">📊</div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-4 sm:mb-6" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Generate Market Intelligence
                  </h3>
                  <p className="text-gray-200 mb-6 sm:mb-8 text-base sm:text-lg lg:text-xl leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    AI will analyze current market trends, salary data, and opportunities for{' '}
                    <span className="font-bold text-blue-400" 
                          style={{textShadow: '0 0 15px rgba(59, 130, 246, 0.8)'}}>
                      {careerRecommendations[0]?.title || 'your selected career'}
                    </span>.
                  </p>
                  
                  <button
                    onClick={generateMarketInsights}
                    disabled={generatingInsights || careerRecommendations.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 sm:px-10 lg:px-12 py-3 sm:py-4 lg:py-5 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg lg:text-xl hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-2xl"
                    style={{
                      boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {generatingInsights ? (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">AI is analyzing market data...</span>
                        <span className="sm:hidden">Analyzing...</span>
                      </div>
                    ) : (
                      <>
                        <span className="hidden sm:inline">🤖 Generate AI Market Insights</span>
                        <span className="sm:hidden">🤖 Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 lg:space-y-8">
                {/* Enhanced Market insights header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20 animate-pulse"></div>
                  <div className="relative text-center">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-3 sm:mb-4" 
                        style={{
                          textShadow: '0 0 20px rgba(255,255,255,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      AI Market Analysis: {marketInsights.careerTitle}
                    </h2>
                    <p className="text-blue-100 mb-4 text-base sm:text-lg lg:text-xl" 
                       style={{
                         textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                         fontFamily: '"Inter", sans-serif'
                       }}>
                      AI-generated insights • Updated {marketInsights.lastUpdated}
                    </p>
                  </div>
                </div>

                <MarketOverviewCard overview={marketInsights.overview} careerTitle={marketInsights.careerTitle} />
                
                {/* Enhanced Download Button for Market Insights */}
                <div className="text-center mt-6 lg:mt-8 px-4">
                  <button
                    onClick={downloadMarketInsights}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all font-bold text-sm sm:text-base lg:text-lg inline-flex items-center space-x-2 sm:space-x-3 shadow-2xl transform hover:scale-105"
                    style={{
                      boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download Market Insights (PDF)</span>
                    <span className="sm:hidden">Download PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Plan Tab */}
        {activeTab === 'action' && (
          <div className="space-y-8 lg:space-y-12">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-white px-4" 
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Action Plan
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-4xl mx-auto px-4" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Personalized next steps generated by AI
              </p>
              
              {actionPlan.length === 0 && careerRecommendations.length > 0 && (
                <button
                  onClick={generateActionPlan}
                  disabled={generatingActionPlan}
                  className="mt-4 sm:mt-6 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base lg:text-lg hover:from-orange-600 hover:to-red-700 transition-all transform hover:scale-105 disabled:opacity-50 shadow-2xl"
                  style={{
                    boxShadow: '0 0 40px rgba(249, 115, 22, 0.4)',
                    fontFamily: '"Inter", sans-serif'
                  }}
                >
                  {generatingActionPlan ? (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Generating Action Plan...</span>
                      <span className="sm:hidden">Generating...</span>
                    </div>
                  ) : (
                    <>
                      <span className="hidden sm:inline">🤖 Generate AI Action Plan</span>
                      <span className="sm:hidden">🤖 Generate</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            {actionPlan.length > 0 ? (
              <div className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {actionPlan.map((step, index) => (
                    <ActionCard key={index} step={step} index={index} />
                  ))}
                </div>
                
                {/* Enhanced Download Button for Action Plan */}
                <div className="text-center mt-6 lg:mt-8 px-4">
                  <button
                    onClick={downloadActionPlan}
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all font-bold text-sm sm:text-base lg:text-lg inline-flex items-center space-x-2 sm:space-x-3 shadow-2xl transform hover:scale-105"
                    style={{
                      boxShadow: '0 0 40px rgba(249, 115, 22, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download Action Plan (PDF)</span>
                    <span className="sm:hidden">Download PDF</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 lg:py-16 px-4">
                <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-8 sm:p-10 lg:p-12 shadow-2xl max-w-2xl mx-auto border border-white/20">
                  <div className="text-6xl sm:text-7xl lg:text-8xl mb-4 sm:mb-6">🎯</div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4" 
                      style={{
                        textShadow: '0 0 20px rgba(255,255,255,0.3)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Ready for Your Action Plan?
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base lg:text-lg" 
                     style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Generate personalized next steps with AI.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LearningPlan Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-8 lg:space-y-12">
            <div className="text-center mb-8 lg:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-4 sm:mb-6 text-white px-4" 
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                AI Learning Plan
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-gray-200 leading-relaxed max-w-4xl mx-auto px-4" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Personalized learning recommendations powered by AI
              </p>
            </div>

            {/* AI-Generated Learning Plan */}
            {!learningPlan ? (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
                <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-white flex items-center" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">📚</span>
                  Career-Specific Learning Plan
                </h3>
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-5xl lg:text-6xl mb-4 sm:mb-6">🎯</div>
                  <h4 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Generate Your Learning Plan
                  </h4>
                  <p className="text-gray-200 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg leading-relaxed px-4" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Get a detailed learning roadmap with specific courses, books, certifications, and projects for{' '}
                    <span className="font-bold text-lime-400" 
                          style={{textShadow: '0 0 15px rgba(76, 175, 80, 0.8)'}}>
                      {careerRecommendations[0]?.title || 'your career goal'}
                    </span>.
                  </p>
                  
                  <button
                    onClick={generateCareerLearningPlan}
                    disabled={generatingLearning || careerRecommendations.length === 0}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base lg:text-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-2xl"
                    style={{
                      boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {generatingLearning ? (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                        <span className="hidden sm:inline">AI is creating your learning plan...</span>
                        <span className="sm:hidden">Creating...</span>
                      </div>
                    ) : (
                      <>
                        <span className="hidden sm:inline">🤖 Generate Learning Plan</span>
                        <span className="sm:hidden">🤖 Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
                <h3 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 text-white flex items-center" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-2xl sm:text-3xl mr-2 sm:mr-3">📚</span>
                  Your AI Learning Plan: {learningPlan.careerTitle}
                </h3>
                
                {/* Enhanced Learning Tracks */}
                <div className="space-y-6 sm:space-y-8">
                  {learningPlan.learningTracks.map((track, idx) => (
                    <div key={idx} className="border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 sm:mb-4">
                        <h4 className="font-black text-lg sm:text-xl text-white mb-2 sm:mb-0" 
                            style={{
                              textShadow: '0 0 15px rgba(255,255,255,0.2)',
                              fontFamily: '"Inter", sans-serif'
                            }}>
                          {track.category}
                        </h4>
                        <div className="flex flex-wrap gap-2 sm:gap-3">
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                            track.priority === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            track.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            'bg-green-500/20 text-green-300 border border-green-500/30'
                          } backdrop-blur-sm`}>
                            {track.priority} Priority
                          </span>
                          <span className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs sm:text-sm font-bold border border-blue-500/30 backdrop-blur-sm">
                            {track.timeframe}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        {track.resources.map((resource, resIdx) => (
                          <div key={resIdx} className="p-3 sm:p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-3">
                              <h5 className="font-bold text-white text-sm sm:text-base mb-2 sm:mb-0" 
                                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                                {resource.title}
                              </h5>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                resource.cost === 'Free' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                              } backdrop-blur-sm flex-shrink-0`}>
                                {resource.cost}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-200 mb-2 sm:mb-3" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              {resource.description}
                            </p>
                            <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                              {resource.skills.slice(0, 3).map((skill, skillIdx) => (
                                <span key={skillIdx} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium border border-purple-500/30 backdrop-blur-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs text-gray-400" 
                                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              {resource.provider} • {resource.duration} • {resource.difficulty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Practice Projects */}
                {learningPlan.practiceProjects && learningPlan.practiceProjects.length > 0 && (
                  <div className="mt-6 sm:mt-8 border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm">
                    <h4 className="font-black text-lg sm:text-xl text-white mb-3 sm:mb-4" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Practice Projects
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {learningPlan.practiceProjects.map((project, idx) => (
                        <div key={idx} className="p-3 sm:p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-sm">
                          <h5 className="font-bold text-white mb-1 sm:mb-2 text-sm sm:text-base" 
                              style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            {project.title}
                          </h5>
                          <p className="text-xs sm:text-sm text-gray-200 mb-1 sm:mb-2" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            {project.description}
                          </p>
                          <div className="text-xs text-gray-400" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            {project.timeEstimate} • {project.difficulty}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Enhanced Download Button for Learning Plan */}
                <div className="text-center mt-6 sm:mt-8">
                  <button
                    onClick={downloadLearningPlan}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all font-bold text-sm sm:text-base lg:text-lg inline-flex items-center space-x-2 sm:space-x-3 shadow-2xl transform hover:scale-105"
                    style={{
                      boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="hidden sm:inline">Download Learning Plan (PDF)</span>
                    <span className="sm:hidden">Download PDF</span>
                  </button>
                </div>

                {/* Enhanced Certifications */}
                {learningPlan.certifications && learningPlan.certifications.length > 0 && (
                  <div className="mt-6 sm:mt-8 border border-white/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 backdrop-blur-sm">
                    <h4 className="font-black text-lg sm:text-xl text-white mb-3 sm:mb-4" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      Recommended Certifications
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                      {learningPlan.certifications.map((cert, idx) => (
                        <div key={idx} className="p-3 sm:p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-sm">
                          <div className="flex flex-col sm:flex-row justify-between items-start mb-1 sm:mb-2">
                            <h5 className="font-bold text-white text-sm sm:text-base mb-2 sm:mb-0" 
                                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              {cert.name}
                            </h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              cert.priority === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                              cert.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                              'bg-green-500/20 text-green-300 border border-green-500/30'
                            } backdrop-blur-sm flex-shrink-0`}>
                              {cert.priority}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-200 mb-1 sm:mb-2" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            {cert.description}
                          </p>
                          <div className="text-xs text-gray-400" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            {cert.provider} • {cert.cost} • {cert.timeToComplete}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI-Generated Interview Questions */}
            {!interviewQuestions ? (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <h3 className="text-2xl font-black mb-8 text-white flex items-center" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-3xl mr-3">💬</span>
                  Career-Specific Interview Prep
                </h3>
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">🎤</div>
                  <h4 className="text-xl font-bold text-white mb-4" 
                      style={{
                        textShadow: '0 0 15px rgba(255,255,255,0.2)',
                        fontFamily: '"Inter", sans-serif'
                      }}>
                    Generate Interview Questions
                  </h4>
                  <p className="text-gray-200 mb-6 text-lg leading-relaxed" 
                     style={{
                       textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                       fontFamily: '"Inter", sans-serif'
                     }}>
                    Get comprehensive interview questions and answers specifically for{' '}
                    <span className="font-bold text-lime-400" 
                          style={{textShadow: '0 0 15px rgba(76, 175, 80, 0.8)'}}>
                      {careerRecommendations[0]?.title || 'your career goal'}
                    </span>{' '}
                    positions, including technical, behavioral, and transition-specific questions.
                  </p>
                  
                  <button
                    onClick={generateInterviewQuestions}
                    disabled={generatingInterviews || careerRecommendations.length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:from-emerald-600 hover:to-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-2xl"
                    style={{
                      boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {generatingInterviews ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>AI is creating interview questions...</span>
                      </div>
                    ) : (
                      '🤖 Generate Interview Prep'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20">
                <h3 className="text-2xl font-black mb-8 text-white flex items-center" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-3xl mr-3">💬</span>
                  Your AI Interview Prep: {interviewQuestions.careerTitle}
                </h3>
                
                {/* Enhanced Interview Question Categories */}
                <div className="space-y-8">
                  {interviewQuestions.categories.map((category, idx) => (
                    <div key={idx} className="border border-white/20 rounded-2xl p-6 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
                      <h4 className="font-black text-xl text-white mb-2" 
                          style={{
                            textShadow: '0 0 15px rgba(255,255,255,0.2)',
                            fontFamily: '"Inter", sans-serif'
                          }}>
                        {category.category}
                      </h4>
                      <p className="text-sm text-gray-200 mb-6" 
                         style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                        {category.description}
                      </p>
                      
                      <div className="space-y-6">
                        {category.questions.slice(0, 3).map((q, qIdx) => (
                          <div key={qIdx} className="p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                            <div className="flex justify-between items-start mb-3">
                              <h5 className="font-bold text-white pr-4" 
                                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                                {q.question}
                              </h5>
                              <span className={`px-2 py-1 rounded-full text-xs flex-shrink-0 font-bold ${
                                q.difficulty === 'Entry' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                q.difficulty === 'Mid' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                                'bg-red-500/20 text-red-300 border border-red-500/30'
                              } backdrop-blur-sm`}>
                                {q.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-gray-200 mb-2" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              <strong className="text-lime-300">Approach:</strong> {q.sampleAnswer}
                            </p>
                            <div className="text-xs text-gray-400" 
                                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              <strong>Key Points:</strong> {q.keyPoints.join(', ')}
                            </div>
                          </div>
                        ))}
                        {category.questions.length > 3 && (
                          <div className="text-center">
                            <span className="text-sm text-gray-400" 
                                  style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                              + {category.questions.length - 3} more questions in this category
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Preparation Tips */}
                {interviewQuestions.preparationTips && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20 backdrop-blur-sm">
                    <h4 className="font-black text-white mb-4" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      💡 Preparation Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {interviewQuestions.preparationTips.map((tip, idx) => (
                        <div key={idx} className="text-sm text-gray-200 flex items-start" 
                             style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                          <span className="text-blue-400 mr-3 mt-1" 
                                style={{filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))'}}>
                            •
                          </span>
                          {tip.tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enhanced Common Mistakes */}
                {interviewQuestions.commonMistakes && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl border border-red-500/20 backdrop-blur-sm">
                    <h4 className="font-black text-white mb-4" 
                        style={{
                          textShadow: '0 0 15px rgba(255,255,255,0.2)',
                          fontFamily: '"Inter", sans-serif'
                        }}>
                      ⚠️ Common Mistakes to Avoid
                    </h4>
                    <div className="space-y-3">
                      {interviewQuestions.commonMistakes.slice(0, 3).map((mistake, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="text-red-300 mb-1" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            ❌ {mistake.mistake}
                          </div>
                          <div className="text-green-300" 
                               style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                            ✅ {mistake.correction}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Enhanced Download Button for Interview Questions */}
                <div className="mt-10 text-center">
                  <button
                    onClick={downloadInterviewQuestions}
                    className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-12 py-5 rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all font-black text-xl inline-flex items-center space-x-3 shadow-2xl transform hover:scale-105"
                    style={{
                      boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download Complete Interview Guide (PDF)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Floating Feedback Button */}
      <button
        onClick={() => setShowFeedbackForm(true)}
        className="fixed bottom-4 sm:bottom-6 lg:bottom-8 right-4 sm:right-6 lg:right-8 bg-gradient-to-r from-lime-500 to-green-600 text-white p-3 sm:p-4 lg:p-5 rounded-full shadow-2xl hover:shadow-lime-500/50 transition-all duration-300 transform hover:scale-110 group z-50"
        style={{boxShadow: '0 0 40px rgba(76, 175, 80, 0.4)'}}
        aria-label="Give Feedback"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span className="absolute right-12 sm:right-14 lg:right-16 top-1/2 transform -translate-y-1/2 bg-black/80 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-white/20 hidden sm:block"
              style={{fontFamily: '"Inter", sans-serif'}}>
          Share Feedback
        </span>
      </button>

      {/* Enhanced Feedback Form Modal */}
      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-2xl rounded-2xl lg:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  Your Feedback
                </h2>
                <button
                  onClick={() => setShowFeedbackForm(false)}
                  className="text-gray-400 hover:text-white p-2 sm:p-3 hover:bg-white/10 rounded-full transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={submitFeedback} className="space-y-6 sm:space-y-8">
                <div>
                  <label className="block text-base sm:text-lg font-bold text-white mb-3 sm:mb-4" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                    How would you rate your experience with AI career recommendations?
                  </label>
                  <div className="flex gap-2 sm:gap-3 lg:gap-4">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleFeedbackChange({ target: { name: 'rating', value: value.toString() } })}
                        className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full border-2 transition-all transform hover:scale-110 text-lg sm:text-xl font-bold ${
                          feedbackData.rating === value.toString()
                            ? 'bg-gradient-to-r from-lime-500 to-green-600 text-white border-lime-500 shadow-2xl'
                            : 'border-white/30 text-white hover:border-lime-500 hover:shadow-lg backdrop-blur-sm'
                        }`}
                        style={{
                          boxShadow: feedbackData.rating === value.toString() ? '0 0 30px rgba(76, 175, 80, 0.6)' : 'none'
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-base sm:text-lg font-bold text-white mb-3 sm:mb-4" 
                         style={{
                           textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                           fontFamily: '"Inter", sans-serif'
                         }}>
                    How can we improve the AI career dashboard?
                  </label>
                  <textarea
                    name="improvements"
                    value={feedbackData.improvements}
                    onChange={handleFeedbackChange}
                    rows="4"
                    className="w-full p-3 sm:p-4 border-2 border-white/20 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-lime-500 focus:border-lime-500 transition-all bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 text-sm sm:text-base lg:text-lg"
                    style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                    placeholder="Tell us about your experience with AI recommendations..."
                    required
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                  <button
                    type="submit"
                    disabled={submittingFeedback || !feedbackData.rating || !feedbackData.improvements}
                    className="w-full sm:flex-1 bg-gradient-to-r from-lime-500 to-green-600 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl hover:from-lime-600 hover:to-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none font-bold text-sm sm:text-base lg:text-lg shadow-2xl"
                    style={{
                      boxShadow: '0 0 30px rgba(76, 175, 80, 0.4)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackForm(false)}
                    className="w-full sm:flex-1 bg-white/20 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl hover:bg-white/30 transition-all font-bold text-sm sm:text-base lg:text-lg backdrop-blur-sm border border-white/30"
                    style={{fontFamily: '"Inter", sans-serif'}}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Success Indicators */}
      {careerRecommendations.length > 0 && (
        <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-2xl z-40 border border-purple-500/30 max-w-[calc(100vw-8rem)] sm:max-w-none">
          <div className="font-bold" 
               style={{
                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                 fontFamily: '"Inter", sans-serif'
               }}>
            🤖 {careerRecommendations.length} AI recommendations generated
          </div>
          {contentTimestamp && (
            <div className="text-xs opacity-75 hidden sm:block" 
                 style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              Last updated: {contentTimestamp.toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Storage info footer for development */}
      {showDataSource && (
        <div className="fixed bottom-20 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-xs max-w-xs z-30">
          <div className="font-bold mb-1">Storage Status:</div>
          <div>Analysis: {enhancedStorageService.loadUserAnalysis(getUserId()) ? '✅' : '❌'}</div>
          <div>AI Content: {enhancedStorageService.loadAIContent(getUserId()) ? '✅' : '❌'}</div>
          <div>Form Data: {enhancedStorageService.loadFormData(getUserId()) ? '✅' : '❌'}</div>
        </div>
      )}

      {/* Floating Elements for Enhanced Visual Appeal */}
      <div className="fixed top-1/4 left-2 sm:left-4 lg:left-10 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-lime-400/10 rounded-full blur-xl animate-bounce opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-2 sm:right-4 lg:right-10 w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-green-400/10 rounded-full blur-xl animate-pulse opacity-60 pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-emerald-400/10 rounded-full blur-xl animate-ping opacity-60 pointer-events-none"></div>

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
        
        @keyframes slideIn {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-slideIn {
          animation: slideIn 0.6s ease-out;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        body {
          font-family: 'Inter', sans-serif;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(76, 175, 80, 0.5);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(76, 175, 80, 0.7);
        }
        
        @media (max-width: 640px) {
          .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          
          .overflow-x-auto {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          
          .overflow-x-auto::-webkit-scrollbar {
            display: none;
          }
          
          button {
            min-height: 44px;
          }
          
          p, span, div {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .grid-cols-1 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
        
        @media (min-width: 1025px) {
          .hover\\:scale-105:hover {
            transform: scale(1.05);
          }
          
          .hover\\:-translate-y-2:hover {
            transform: translateY(-0.5rem);
          }
        }
        
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          text-shadow: 0 0 1px rgba(0,0,0,0.3);
        }
        
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          body {
            color-scheme: dark;
          }
        }
      `}</style>
    </div>
  );
};

export default CareerDashboard;
