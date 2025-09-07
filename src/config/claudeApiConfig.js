// src/config/claudeApiConfig.js

// Claude API configuration
const CLAUDE_API_CONFIG = {
  models: {
    default: 'claude-3-5-sonnet-20240620',
    faster: 'claude-3-haiku-20240307'
  },
  maxTokens: {
    formSuggestions: 1024,
    careerAnalysis: 4096
  }
};

// Prompts for different Claude API requests
const CLAUDE_PROMPTS = {
  formSuggestions: 
    "I'm filling out a tech career assessment form for someone transitioning into tech. " +
    "Based on a typical career changer profile, suggest realistic answers for a form with these fields: " +
    "Education Level, Field of Study, Years of Experience, Current/Previous Role, " +
    "Job Responsibilities, Notable Projects or Achievements, Software or Technologies Used, Internships or Relevant Experience, " +
    "Publications or Research, " +
    "What they like doing best, Biggest motivation for tech career, " +
    "What they're passionate about, Primary reason for transition, Transferable skills from previous career, " +
    "Previous tech exposure, Anticipated challenges in transition, Tech areas they're curious about, " +
    "Comfort with learning new tools, Preferred work method, Current tech experience level, " +
    "Tools and platforms used, Certifications and courses, Tech career paths interest, " +
    "Industry preference, Whether to leverage domain expertise, Target salary range, " +
    "Weekly time commitment, Transition timeline, Whether continuing current role, " +
    "Guidance needed, and 12-month goal.",
  
  careerAnalysis: (formData) => `
    I'm a career transition expert helping someone move into technology from a different field.
    Please analyze this comprehensive career assessment for someone looking to transition into tech.
    Focus especially on their job experience, educational background, transferable skills, interests, tech preferences, and background.
    
    ASSESSMENT DATA (IMPORTANT FIELDS MARKED):
    
    BACKGROUND INFORMATION:
    - Education Level (IMPORTANT): ${formData.educationLevel || 'Not specified'}
    - Field of Study (IMPORTANT): ${formData.studyField || 'Not specified'}
    - Current/Previous Role: ${formData.currentRole || 'Not specified'}
    - Years of Experience: ${formData.yearsExperience || 'Not specified'}
    
    JOB EXPERIENCE DETAILS (IMPORTANT):
    - Key Job Responsibilities: ${formData.jobResponsibilities || 'Not specified'}
    - Notable Projects or Achievements: ${formData.jobProjects || 'Not specified'}
    - Software or Technologies Used: ${formData.jobTechnologies || 'Not specified'}
    - Internships or Relevant Experience: ${formData.internships || 'Not specified'}
    - Publications or Research (IMPORTANT): ${formData.publications || 'Not specified'}
    
    PERSONAL STRENGTHS & MOTIVATION (IMPORTANT):
    - Biggest motivation for tech career: ${formData.techMotivation || 'Not specified'}
    - What they're passionate about: ${formData.techPassion || 'Not specified'}
    
    TECH PREFERENCES & INTERESTS (IMPORTANT):
    - Tech areas they're interested in: ${formData.techInterests || 'Not specified'}
    - Comfort with learning new tools: ${formData.learningComfort || 'Not specified'}
    - Work preference: ${formData.workPreference || 'Not specified'}
    - Current tech experience level: ${formData.experienceLevel || 'Not specified'}
    - Tools & platforms used: ${formData.toolsUsed ? formData.toolsUsed.join(', ') : 'None'}
    - Certifications/courses: ${formData.certifications || 'Not specified'}
    - Certification details: ${formData.certificationsDetail || 'Not specified'}
    
    TRANSITION INFORMATION:
    - Primary reason for transition: ${formData.transitionReason || 'Not specified'}
    - Transferable skills: ${formData.transferableSkills || 'Not specified'}
    - Anticipated challenges: ${formData.anticipatedChallenges || 'Not specified'}
    
    CAREER ASPIRATIONS:
    - Tech career paths interest: ${formData.careerPathsInterest ? formData.careerPathsInterest.join(', ') : 'Not specified'}
    - Industry preferences: ${formData.industryPreference ? formData.industryPreference.join(', ') : 'Not specified'}
    - Leverage domain expertise: ${formData.leverageDomainExpertise || 'Not specified'}
    - Target salary range: ${formData.targetSalary || 'Not specified'}
    
    COMMITMENT & GOALS:
    - Weekly time commitment: ${formData.timeCommitment || 'Not specified'}
    - Transition timeline: ${formData.transitionTimeline || 'Not specified'}
    - Continue current role: ${formData.continueCurrent || 'Not specified'}
    - Guidance needed: ${formData.guidanceNeeded || 'Not specified'}
    - 12-month goal: ${formData.futureGoal || 'Not specified'}
    
    Based on this comprehensive assessment, provide a detailed analysis with the following sections.
    
    IMPORTANT: Format your response EXACTLY as shown below, maintaining the exact structure and numbering:
    
    1. CAREER PATH RECOMMENDATIONS:
       a) [Role Name] ([X]% match)
       - Why: [Detailed explanation]
       - Timeline: [Specific timeline]
       
       b) [Role Name] ([X]% match)
       - Why: [Detailed explanation]
       - Timeline: [Specific timeline]
    
    2. STRENGTHS ANALYSIS:
       - [Strength Category]: [Detailed explanation]
       - [Strength Category]: [Detailed explanation]
       (Use bullet points with "-" for this section)
    
    3. SKILLS GAP ANALYSIS:
       FORMAT EACH SKILL AS A NUMBERED ITEM WITH TITLE AND DESCRIPTION ON SEPARATE LINES:
       
       1. [Skill Name]: [Brief description of the gap and what needs to be learned]
       
       2. [Skill Name]: [Brief description of the gap and what needs to be learned]
       
       3. [Skill Name]: [Brief description of the gap and what needs to be learned]
       
       (Continue numbering for all skills. Each skill should have the format "N. Skill Name: Description")
    
    4. LEARNING ROADMAP:
       Month 1-2:
       - [Specific tasks and resources]
       - [More tasks]
       
       Month 3-4:
       - [Specific tasks and resources]
       - [More tasks]
       
       Month 5-6:
       - [Specific tasks and resources]
       - [More tasks]
    
    5. TRANSITION STRATEGY:
       - [Strategy point]
       - [Strategy point]
       - [Strategy point]
    
    6. MARKET TRENDS ANALYSIS:
       Include current (as of 2025) job market data for the recommended career paths with the following specific sections:
       
       1. JOB MARKET OUTLOOK: 
          Provide detailed job growth projections, hiring rates, and demand levels for each recommended career path. 
          Include specific percentages when possible.
       
       2. SALARY TRENDS: 
          Detail current salary ranges for entry-level, mid-level, and senior positions in each recommended 
          career path, including how these have changed in the past year. Use specific dollar ranges.
       
       3. REGIONAL OPPORTUNITIES: 
          Analyze which geographic regions show the strongest demand for each career path, including remote 
          work opportunities and emerging tech hubs.
       
       4. EMERGING TECHNOLOGIES: 
          Identify the most important emerging technologies or skills within each career path that are 
          becoming requirements for new hires in 2025.
       
       5. INDUSTRY SECTOR ANALYSIS: 
          Evaluate which industry sectors are most actively hiring for each career path (e.g., healthcare, 
          finance, retail) and their growth trajectories.
          
    7. NETWORKING STRATEGY:
       - [Specific networking tips tailored to their background and target roles]
       - [Industry events or communities to join]
       - [Online platforms for tech networking]
       - [How to leverage existing network from previous career]
       - [Informational interview strategies]
    
    8. PERSONAL BRANDING:
       - [Resume transformation recommendations]
       - [LinkedIn profile optimization]
       - [Portfolio development strategy]
       - [How to highlight transferable skills]
       - [Online presence recommendations]
    
    9. INTERVIEW PREPARATION:
       - [Technical interview strategies]
       - [Behavioral question preparation]
       - [How to discuss career transition effectively]
       - [Practice project recommendations]
       - [How to address skills gaps during interviews]
    
    Make your analysis practical, personalized, and actionable. Focus on leveraging their specific educational background,
    field of study, strengths, and interests to create a realistic path into tech. The market trends analysis should be 
    particularly relevant to their indicated interests (${formData.careerPathsInterest ? formData.careerPathsInterest.join(', ') : 'various tech roles'})
    and include current, accurate market data for 2025.
  `
};

export { CLAUDE_API_CONFIG, CLAUDE_PROMPTS };
