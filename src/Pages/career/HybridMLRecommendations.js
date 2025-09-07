// ============================================================================
// HybridMLRecommendations.js
// Complete Hybrid ML + Rule-Based Career Recommendation Engine - ENHANCED
// ============================================================================

/**
 * MAIN HYBRID RECOMMENDATION FUNCTION
 */
export const generateHybridCareerRecommendations = (userData) => {
  console.log('🚀 Generating hybrid ML + rule-based recommendations for:', userData.name);
  
  // Step 1: Generate rule-based recommendations (enhanced version)
  const ruleBasedResults = generateEnhancedCareerPaths(userData);
  
  // Step 2: Generate ML-based recommendations
  const mlResults = generateMLRecommendations(userData);
  
  // Step 3: Combine both approaches
  const hybridResults = combineRecommendations(ruleBasedResults, mlResults, userData);
  
  console.log('🎯 Hybrid results generated:', {
    primary: hybridResults.recommendations.primary.length,
    inferred: hybridResults.recommendations.inferred.length,
    adjacent: hybridResults.recommendations.adjacent.length,
    mlDiscovered: hybridResults.recommendations.mlDiscovered.length
  });
  
  return hybridResults;
};

/**
 * ENHANCED CAREER PATH GENERATION (Improved version)
 */
const generateEnhancedCareerPaths = (userData) => {
  console.log('📋 Generating rule-based recommendations...');
  
  const recommendations = {
    primary: [],    // Explicitly stated interests
    inferred: [],   // Inferred from background/skills  
    adjacent: []    // Related/similar careers
  };

  // TIER 1: Direct matches from stated interests
  if (userData.careerPathsInterest && userData.careerPathsInterest.length > 0) {
    console.log('Processing stated interests:', userData.careerPathsInterest);
    recommendations.primary = userData.careerPathsInterest.map((interest, index) => {
      const careerPath = buildAuthenticCareerPath(interest, userData, index, 'stated');
      if (careerPath) {
        careerPath.recommendationType = 'stated';
        careerPath.badge = 'Your Interest';
        careerPath.badgeColor = 'green';
        careerPath.originalScore = careerPath.match;
        return careerPath;
      }
      return null;
    }).filter(Boolean);
  }

  // TIER 2: Inferred matches from background analysis
  const inferredInterests = inferCareerInterests(userData);
  console.log('Inferred interests from background:', inferredInterests);
  
  if (inferredInterests.length > 0) {
    recommendations.inferred = inferredInterests
      .filter(interest => !isAlreadyRecommended(interest.title, recommendations.primary))
      .map((interest, index) => {
        const careerPath = buildAuthenticCareerPath(interest.title, userData, index + 10, 'inferred');
        if (careerPath && careerPath.match >= 60) {
          careerPath.recommendationType = 'inferred';
          careerPath.badge = 'Smart Match';
          careerPath.badgeColor = 'blue';
          careerPath.inferenceReason = interest.reason;
          careerPath.confidenceScore = interest.confidence;
          careerPath.originalScore = careerPath.match;
          return careerPath;
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 3);
  }

  // TIER 3: Adjacent opportunities
  const allRecommendedCareers = [...recommendations.primary, ...recommendations.inferred];
  if (allRecommendedCareers.length > 0) {
    const adjacentCareers = findAdjacentCareers(allRecommendedCareers);
    console.log('Adjacent career opportunities:', adjacentCareers);
    
    recommendations.adjacent = adjacentCareers
      .filter(career => !isAlreadyRecommended(career, allRecommendedCareers))
      .map((career, index) => {
        const careerPath = buildAuthenticCareerPath(career, userData, index + 20, 'adjacent');
        if (careerPath && careerPath.match >= 50) {
          careerPath.recommendationType = 'adjacent';
          careerPath.badge = 'Consider This';
          careerPath.badgeColor = 'purple';
          careerPath.originalScore = careerPath.match;
          return careerPath;
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 2);
  }

  // Combine all recommendations for backward compatibility
  const allRecommendations = [
    ...recommendations.primary,
    ...recommendations.inferred,
    ...recommendations.adjacent
  ];

  return { recommendations, allRecommendations };
};

/**
 * BUILD AUTHENTIC CAREER PATH (Enhanced version from original)
 */
const buildAuthenticCareerPath = (userInterest, userData, priority, type = 'stated') => {
  console.log(`Processing user interest: "${userInterest}" (type: ${type})`);
  
  const standardizedPath = mapUserInterestToCareerPath(userInterest);
  if (!standardizedPath) {
    console.log(`Could not map interest "${userInterest}" to valid career path`);
    return null;
  }

  const matchScore = calculateAuthenticMatchScore(standardizedPath, userData, priority);
  const personalizedInsights = generatePersonalizedInsights(standardizedPath, userData);

  return {
    title: standardizedPath.title,
    match: matchScore,
    userInterest: userInterest,
    insights: personalizedInsights,
    reasoning: generateMatchReasoning(standardizedPath, userData, matchScore),
    authenticated: true,
    category: standardizedPath.category,
    level: standardizedPath.level
  };
};

/**
 * ENHANCED MAP USER INTEREST TO CAREER PATH - COMPREHENSIVE VERSION
 */
const mapUserInterestToCareerPath = (userInterest) => {
  const interest = userInterest.toLowerCase().trim();
  
  // EXPANDED CAREER MAPPINGS - Exact matches
  const careerMappings = {
    // ============================================================================
    // SOFTWARE DEVELOPMENT - Comprehensive variations
    // ============================================================================
    'software developer': { title: 'Software Developer', category: 'development', level: 'mid' },
    'software engineer': { title: 'Software Engineer', category: 'development', level: 'mid' },
    'programmer': { title: 'Software Developer', category: 'development', level: 'mid' },
    'coder': { title: 'Software Developer', category: 'development', level: 'entry' },
    'developer': { title: 'Software Developer', category: 'development', level: 'mid' },
    'application developer': { title: 'Software Developer', category: 'development', level: 'mid' },
    'software programmer': { title: 'Software Developer', category: 'development', level: 'mid' },
    'computer programmer': { title: 'Software Developer', category: 'development', level: 'mid' },
    
    // Frontend Development
    'frontend developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'front-end developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'front end developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'ui developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'web developer': { title: 'Web Developer', category: 'development', level: 'entry' },
    'javascript developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'react developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'angular developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'vue developer': { title: 'Frontend Developer', category: 'development', level: 'mid' },
    'html developer': { title: 'Frontend Developer', category: 'development', level: 'entry' },
    'css developer': { title: 'Frontend Developer', category: 'development', level: 'entry' },
    
    // Backend Development
    'backend developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'back-end developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'back end developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'server developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'api developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'python developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'java developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'node.js developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'nodejs developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'php developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'c# developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'ruby developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    'go developer': { title: 'Backend Developer', category: 'development', level: 'mid' },
    
    // Full Stack Development
    'full stack developer': { title: 'Full Stack Developer', category: 'development', level: 'senior' },
    'full-stack developer': { title: 'Full Stack Developer', category: 'development', level: 'senior' },
    'fullstack developer': { title: 'Full Stack Developer', category: 'development', level: 'senior' },
    'full stack engineer': { title: 'Full Stack Developer', category: 'development', level: 'senior' },
    'full-stack engineer': { title: 'Full Stack Developer', category: 'development', level: 'senior' },
    'web application developer': { title: 'Full Stack Developer', category: 'development', level: 'senior' },
    
    // Mobile Development
    'mobile developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'mobile app developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'mobile application developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'app developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'ios developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'android developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'react native developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'flutter developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'swift developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    'kotlin developer': { title: 'Mobile App Developer', category: 'development', level: 'mid' },
    
    // Senior Development Roles
    'software architect': { title: 'Software Architect', category: 'development', level: 'expert' },
    'solution architect': { title: 'Solution Architect', category: 'development', level: 'expert' },
    'technical architect': { title: 'Software Architect', category: 'development', level: 'expert' },
    'tech lead': { title: 'Technical Lead', category: 'development', level: 'senior' },
    'technical lead': { title: 'Technical Lead', category: 'development', level: 'senior' },
    'lead developer': { title: 'Technical Lead', category: 'development', level: 'senior' },
    'senior developer': { title: 'Software Developer', category: 'development', level: 'senior' },
    'senior software engineer': { title: 'Software Engineer', category: 'development', level: 'senior' },
    
    // ============================================================================
    // DATA & ANALYTICS - Comprehensive variations
    // ============================================================================
    'data scientist': { title: 'Data Scientist', category: 'data', level: 'senior' },
    'data science': { title: 'Data Scientist', category: 'data', level: 'senior' },
    'data researcher': { title: 'Data Scientist', category: 'data', level: 'senior' },
    'research scientist': { title: 'Data Scientist', category: 'data', level: 'expert' },
    'quantitative analyst': { title: 'Data Scientist', category: 'data', level: 'senior' },
    'statistician': { title: 'Data Scientist', category: 'data', level: 'senior' },
    'applied scientist': { title: 'Data Scientist', category: 'data', level: 'senior' },
    
    'data analyst': { title: 'Data Analyst', category: 'data', level: 'entry' },
    'data analysis': { title: 'Data Analyst', category: 'data', level: 'entry' },
    'business data analyst': { title: 'Data Analyst', category: 'data', level: 'mid' },
    'reporting analyst': { title: 'Data Analyst', category: 'data', level: 'entry' },
    'insights analyst': { title: 'Data Analyst', category: 'data', level: 'mid' },
    'analytics specialist': { title: 'Data Analyst', category: 'data', level: 'mid' },
    'data specialist': { title: 'Data Analyst', category: 'data', level: 'mid' },
    
    'data engineer': { title: 'Data Engineer', category: 'data', level: 'mid' },
    'data engineering': { title: 'Data Engineer', category: 'data', level: 'mid' },
    'big data engineer': { title: 'Data Engineer', category: 'data', level: 'senior' },
    'data pipeline engineer': { title: 'Data Engineer', category: 'data', level: 'mid' },
    'data architect': { title: 'Data Engineer', category: 'data', level: 'senior' },
    'database engineer': { title: 'Data Engineer', category: 'data', level: 'mid' },
    'etl developer': { title: 'Data Engineer', category: 'data', level: 'mid' },
    'data warehouse engineer': { title: 'Data Engineer', category: 'data', level: 'mid' },
    
    'business intelligence analyst': { title: 'Business Intelligence Analyst', category: 'data', level: 'mid' },
    'bi analyst': { title: 'Business Intelligence Analyst', category: 'data', level: 'mid' },
    'business intelligence': { title: 'Business Intelligence Analyst', category: 'data', level: 'mid' },
    'bi developer': { title: 'Business Intelligence Analyst', category: 'data', level: 'mid' },
    'tableau developer': { title: 'Business Intelligence Analyst', category: 'data', level: 'mid' },
    'power bi developer': { title: 'Business Intelligence Analyst', category: 'data', level: 'mid' },
    
    // ============================================================================
    // AI & MACHINE LEARNING - Comprehensive variations
    // ============================================================================
    'machine learning engineer': { title: 'ML Engineer', category: 'ai', level: 'senior' },
    'ml engineer': { title: 'ML Engineer', category: 'ai', level: 'senior' },
    'machine learning': { title: 'ML Engineer', category: 'ai', level: 'senior' },
    'mlops engineer': { title: 'ML Engineer', category: 'ai', level: 'senior' },
    'ai engineer': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    'artificial intelligence engineer': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    'artificial intelligence': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    'ai researcher': { title: 'AI Engineer', category: 'ai', level: 'expert' },
    'ai specialist': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    'deep learning engineer': { title: 'ML Engineer', category: 'ai', level: 'senior' },
    'computer vision engineer': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    'nlp engineer': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    'natural language processing': { title: 'AI Engineer', category: 'ai', level: 'senior' },
    
    // ============================================================================
    // DESIGN & USER EXPERIENCE - Comprehensive variations
    // ============================================================================
    'ux designer': { title: 'UX Designer', category: 'design', level: 'mid' },
    'user experience designer': { title: 'UX Designer', category: 'design', level: 'mid' },
    'ux/ui designer': { title: 'UX Designer', category: 'design', level: 'mid' },
    'ux ui designer': { title: 'UX Designer', category: 'design', level: 'mid' },
    'user experience': { title: 'UX Designer', category: 'design', level: 'mid' },
    'experience designer': { title: 'UX Designer', category: 'design', level: 'mid' },
    'interaction designer': { title: 'UX Designer', category: 'design', level: 'mid' },
    'service designer': { title: 'UX Designer', category: 'design', level: 'senior' },
    'design researcher': { title: 'UX Designer', category: 'design', level: 'mid' },
    'user researcher': { title: 'UX Designer', category: 'design', level: 'mid' },
    'usability specialist': { title: 'UX Designer', category: 'design', level: 'mid' },
    
    'ui designer': { title: 'UI Designer', category: 'design', level: 'mid' },
    'user interface designer': { title: 'UI Designer', category: 'design', level: 'mid' },
    'interface designer': { title: 'UI Designer', category: 'design', level: 'mid' },
    'visual designer': { title: 'UI Designer', category: 'design', level: 'mid' },
    'digital designer': { title: 'Digital Designer', category: 'design', level: 'entry' },
    'web designer': { title: 'UI Designer', category: 'design', level: 'entry' },
    
    'product designer': { title: 'Product Designer', category: 'design', level: 'senior' },
    'product design': { title: 'Product Designer', category: 'design', level: 'senior' },
    'design lead': { title: 'Product Designer', category: 'design', level: 'senior' },
    'senior designer': { title: 'Product Designer', category: 'design', level: 'senior' },
    
    'graphic designer': { title: 'Digital Designer', category: 'design', level: 'entry' },
    'graphics designer': { title: 'Digital Designer', category: 'design', level: 'entry' },
    'creative designer': { title: 'Digital Designer', category: 'design', level: 'entry' },
    'brand designer': { title: 'Digital Designer', category: 'design', level: 'mid' },
    'marketing designer': { title: 'Digital Designer', category: 'design', level: 'mid' },
    
    // ============================================================================
    // PRODUCT & MANAGEMENT - Comprehensive variations
    // ============================================================================
    'product manager': { title: 'Product Manager', category: 'management', level: 'senior' },
    'product management': { title: 'Product Manager', category: 'management', level: 'senior' },
    'pm': { title: 'Product Manager', category: 'management', level: 'senior' },
    'product owner': { title: 'Product Owner', category: 'management', level: 'mid' },
    'po': { title: 'Product Owner', category: 'management', level: 'mid' },
    'senior product manager': { title: 'Product Manager', category: 'management', level: 'expert' },
    'associate product manager': { title: 'Product Manager', category: 'management', level: 'mid' },
    'apm': { title: 'Product Manager', category: 'management', level: 'mid' },
    'product lead': { title: 'Product Manager', category: 'management', level: 'senior' },
    'product strategy': { title: 'Product Manager', category: 'management', level: 'senior' },
    'product marketing manager': { title: 'Product Manager', category: 'management', level: 'senior' },
    
    'project manager': { title: 'Technical Project Manager', category: 'management', level: 'mid' },
    'technical project manager': { title: 'Technical Project Manager', category: 'management', level: 'mid' },
    'program manager': { title: 'Technical Project Manager', category: 'management', level: 'senior' },
    'scrum master': { title: 'Technical Project Manager', category: 'management', level: 'mid' },
    'agile coach': { title: 'Technical Project Manager', category: 'management', level: 'senior' },
    'delivery manager': { title: 'Technical Project Manager', category: 'management', level: 'mid' },
    'operations manager': { title: 'Technical Project Manager', category: 'management', level: 'mid' },
    
    'business analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'ba': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'business systems analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'systems analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'functional analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'requirements analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'process analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'strategy analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'operations analyst': { title: 'Business Analyst', category: 'analysis', level: 'mid' },
    'business consultant': { title: 'Business Analyst', category: 'analysis', level: 'senior' },
    
    // ============================================================================
    // INFRASTRUCTURE & OPERATIONS - Comprehensive variations
    // ============================================================================
    'devops engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'devops': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'dev ops engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'site reliability engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'sre': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'platform engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'infrastructure engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'senior' },
    'release engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'mid' },
    'build engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'mid' },
    'automation engineer': { title: 'DevOps Engineer', category: 'infrastructure', level: 'mid' },
    
    'cloud engineer': { title: 'Cloud Engineer', category: 'infrastructure', level: 'mid' },
    'cloud architect': { title: 'Cloud Engineer', category: 'infrastructure', level: 'senior' },
    'aws engineer': { title: 'Cloud Engineer', category: 'infrastructure', level: 'mid' },
    'azure engineer': { title: 'Cloud Engineer', category: 'infrastructure', level: 'mid' },
    'gcp engineer': { title: 'Cloud Engineer', category: 'infrastructure', level: 'mid' },
    'cloud specialist': { title: 'Cloud Engineer', category: 'infrastructure', level: 'mid' },
    'cloud developer': { title: 'Cloud Engineer', category: 'infrastructure', level: 'mid' },
    'cloud consultant': { title: 'Cloud Engineer', category: 'infrastructure', level: 'senior' },
    
    'systems administrator': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'system administrator': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'sysadmin': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'systems engineer': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'network administrator': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'network engineer': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'it administrator': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'it engineer': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'server administrator': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'database administrator': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    'dba': { title: 'Systems Engineer', category: 'infrastructure', level: 'mid' },
    
    // ============================================================================
    // CYBERSECURITY - Comprehensive variations
    // ============================================================================
    'cybersecurity analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'cyber security analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'security analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'information security analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'infosec analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'cybersecurity specialist': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'security specialist': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'security consultant': { title: 'Cybersecurity Analyst', category: 'security', level: 'senior' },
    'cyber security consultant': { title: 'Cybersecurity Analyst', category: 'security', level: 'senior' },
    
    'security engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    'cybersecurity engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    'cyber security engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    'information security engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    'application security engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    'network security engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    'cloud security engineer': { title: 'Security Engineer', category: 'security', level: 'senior' },
    
    'ethical hacker': { title: 'Penetration Tester', category: 'security', level: 'senior' },
    'penetration tester': { title: 'Penetration Tester', category: 'security', level: 'senior' },
    'pen tester': { title: 'Penetration Tester', category: 'security', level: 'senior' },
    'white hat hacker': { title: 'Penetration Tester', category: 'security', level: 'senior' },
    'security researcher': { title: 'Penetration Tester', category: 'security', level: 'senior' },
    'vulnerability assessor': { title: 'Penetration Tester', category: 'security', level: 'mid' },
    'security auditor': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'compliance analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    'risk analyst': { title: 'Cybersecurity Analyst', category: 'security', level: 'mid' },
    
    // ============================================================================
    // QUALITY ASSURANCE & TESTING
    // ============================================================================
    'qa engineer': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'quality assurance engineer': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'test engineer': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'software tester': { title: 'QA Engineer', category: 'testing', level: 'entry' },
    'automation tester': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'test automation engineer': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'sdet': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'software development engineer in test': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'performance tester': { title: 'QA Engineer', category: 'testing', level: 'mid' },
    'manual tester': { title: 'QA Engineer', category: 'testing', level: 'entry' },
    
    // ============================================================================
    // TECHNICAL WRITING & DOCUMENTATION
    // ============================================================================
    'technical writer': { title: 'Technical Writer', category: 'communication', level: 'mid' },
    'documentation specialist': { title: 'Technical Writer', category: 'communication', level: 'mid' },
    'api documentation writer': { title: 'Technical Writer', category: 'communication', level: 'mid' },
    'content strategist': { title: 'Technical Writer', category: 'communication', level: 'senior' },
    'developer advocate': { title: 'Developer Advocate', category: 'communication', level: 'senior' },
    'developer relations': { title: 'Developer Advocate', category: 'communication', level: 'senior' },
    'devrel': { title: 'Developer Advocate', category: 'communication', level: 'senior' },
    'community manager': { title: 'Developer Advocate', category: 'communication', level: 'mid' },
  };

  // EXPANDED KEYWORD MAPPINGS - Comprehensive fallback matches
  const keywordMappings = {
    // Programming & Development
    'programming': careerMappings['software developer'],
    'coding': careerMappings['software developer'],
    'development': careerMappings['software developer'],
    'software': careerMappings['software developer'],
    'application': careerMappings['software developer'],
    'apps': careerMappings['mobile developer'],
    'mobile': careerMappings['mobile developer'],
    'web': careerMappings['web developer'],
    'website': careerMappings['web developer'],
    'frontend': careerMappings['frontend developer'],
    'backend': careerMappings['backend developer'],
    'fullstack': careerMappings['full stack developer'],
    
    // Specific Technologies
    'javascript': careerMappings['frontend developer'],
    'react': careerMappings['frontend developer'],
    'angular': careerMappings['frontend developer'],
    'vue': careerMappings['frontend developer'],
    'python': careerMappings['backend developer'],
    'java': careerMappings['backend developer'],
    'node': careerMappings['backend developer'],
    'php': careerMappings['backend developer'],
    'ruby': careerMappings['backend developer'],
    'golang': careerMappings['backend developer'],
    'swift': careerMappings['mobile developer'],
    'kotlin': careerMappings['mobile developer'],
    'flutter': careerMappings['mobile developer'],
    'ios': careerMappings['mobile developer'],
    'android': careerMappings['mobile developer'],
    
    // Data & Analytics
    'data': careerMappings['data analyst'],
    'analytics': careerMappings['data analyst'],
    'analysis': careerMappings['data analyst'],
    'statistics': careerMappings['data scientist'],
    'statistical': careerMappings['data scientist'],
    'research': careerMappings['data scientist'],
    'insights': careerMappings['data analyst'],
    'reporting': careerMappings['data analyst'],
    'visualization': careerMappings['data analyst'],
    'tableau': careerMappings['business intelligence analyst'],
    'powerbi': careerMappings['business intelligence analyst'],
    'power bi': careerMappings['business intelligence analyst'],
    'bi': careerMappings['business intelligence analyst'],
    'business intelligence': careerMappings['business intelligence analyst'],
    'etl': careerMappings['data engineer'],
    'database': careerMappings['data engineer'],
    'sql': careerMappings['data analyst'],
    'nosql': careerMappings['data engineer'],
    'mongodb': careerMappings['data engineer'],
    'bigdata': careerMappings['data engineer'],
    'big data': careerMappings['data engineer'],
    'hadoop': careerMappings['data engineer'],
    'spark': careerMappings['data engineer'],
    
    // AI & Machine Learning
    'ai': careerMappings['ai engineer'],
    'artificial intelligence': careerMappings['ai engineer'],
    'machine learning': careerMappings['machine learning engineer'],
    'ml': careerMappings['machine learning engineer'],
    'deep learning': careerMappings['machine learning engineer'],
    'neural networks': careerMappings['machine learning engineer'],
    'computer vision': careerMappings['ai engineer'],
    'nlp': careerMappings['ai engineer'],
    'natural language': careerMappings['ai engineer'],
    'tensorflow': careerMappings['machine learning engineer'],
    'pytorch': careerMappings['machine learning engineer'],
    'scikit': careerMappings['machine learning engineer'],
    'algorithms': careerMappings['machine learning engineer'],
    
    // Design & UX
    'design': careerMappings['ux designer'],
    'designer': careerMappings['ux designer'],
    'ux': careerMappings['ux designer'],
    'ui': careerMappings['ui designer'],
    'user experience': careerMappings['ux designer'],
    'user interface': careerMappings['ui designer'],
    'usability': careerMappings['ux designer'],
    'wireframing': careerMappings['ux designer'],
    'prototyping': careerMappings['ux designer'],
    'figma': careerMappings['ux designer'],
    'sketch': careerMappings['ui designer'],
    'adobe': careerMappings['ui designer'],
    'photoshop': careerMappings['ui designer'],
    'illustrator': careerMappings['ui designer'],
    'creative': careerMappings['ui designer'],
    'visual': careerMappings['ui designer'],
    'graphics': careerMappings['ui designer'],
    'branding': careerMappings['ui designer'],
    'interaction': careerMappings['ux designer'],
    
    // Product & Management
    'product': careerMappings['product manager'],
    'management': careerMappings['product manager'],
    'manager': careerMappings['product manager'],
    'strategy': careerMappings['product manager'],
    'business': careerMappings['business analyst'],
    'analyst': careerMappings['business analyst'],
    'consulting': careerMappings['business analyst'],
    'project': careerMappings['project manager'],
    'scrum': careerMappings['project manager'],
    'agile': careerMappings['project manager'],
    'operations': careerMappings['project manager'],
    'coordination': careerMappings['project manager'],
    'planning': careerMappings['project manager'],
    'requirements': careerMappings['business analyst'],
    'stakeholder': careerMappings['product manager'],
    'roadmap': careerMappings['product manager'],
    
    // Infrastructure & DevOps
    'devops': careerMappings['devops engineer'],
    'infrastructure': careerMappings['devops engineer'],
    'cloud': careerMappings['cloud engineer'],
    'aws': careerMappings['cloud engineer'],
    'azure': careerMappings['cloud engineer'],
    'gcp': careerMappings['cloud engineer'],
    'google cloud': careerMappings['cloud engineer'],
    'kubernetes': careerMappings['devops engineer'],
    'docker': careerMappings['devops engineer'],
    'containers': careerMappings['devops engineer'],
    'automation': careerMappings['devops engineer'],
    'deployment': careerMappings['devops engineer'],
    'ci/cd': careerMappings['devops engineer'],
    'jenkins': careerMappings['devops engineer'],
    'terraform': careerMappings['devops engineer'],
    'ansible': careerMappings['devops engineer'],
    'monitoring': careerMappings['devops engineer'],
    'systems': careerMappings['systems administrator'],
    'server': careerMappings['systems administrator'],
    'network': careerMappings['systems administrator'],
    'linux': careerMappings['systems administrator'],
    'unix': careerMappings['systems administrator'],
    'windows server': careerMappings['systems administrator'],
    'virtualization': careerMappings['systems administrator'],
    'vmware': careerMappings['systems administrator'],
    
    // Security
    'security': careerMappings['cybersecurity analyst'],
    'cybersecurity': careerMappings['cybersecurity analyst'],
    'cyber security': careerMappings['cybersecurity analyst'],
    'infosec': careerMappings['cybersecurity analyst'],
    'information security': careerMappings['cybersecurity analyst'],
    'ethical hacking': careerMappings['ethical hacker'],
    'penetration testing': careerMappings['penetration tester'],
    'pen testing': careerMappings['penetration tester'],
    'vulnerability': careerMappings['penetration tester'],
    'compliance': careerMappings['cybersecurity analyst'],
    'risk': careerMappings['cybersecurity analyst'],
    'audit': careerMappings['cybersecurity analyst'],
    'forensics': careerMappings['cybersecurity analyst'],
    'incident response': careerMappings['cybersecurity analyst'],
    
    // Testing & QA
    'testing': careerMappings['qa engineer'],
    'qa': careerMappings['qa engineer'],
    'quality assurance': careerMappings['qa engineer'],
    'test automation': careerMappings['qa engineer'],
    'selenium': careerMappings['qa engineer'],
    'manual testing': careerMappings['qa engineer'],
    'performance testing': careerMappings['qa engineer'],
    'load testing': careerMappings['qa engineer'],
    
    // Communication & Documentation
    'technical writing': careerMappings['technical writer'],
    'documentation': careerMappings['technical writer'],
    'content': careerMappings['technical writer'],
    'communication': careerMappings['technical writer'],
    'developer relations': careerMappings['developer advocate'],
    'community': careerMappings['developer advocate'],
    'advocacy': careerMappings['developer advocate'],
    'evangelism': careerMappings['developer advocate'],
    
    // General Tech Terms
    'technology': careerMappings['software developer'],
    'tech': careerMappings['software developer'],
    'it': careerMappings['systems administrator'],
    'information technology': careerMappings['systems administrator'],
    'computer science': careerMappings['software developer'],
    'engineering': careerMappings['software engineer'],
    'innovation': careerMappings['product manager'],
    'digital': careerMappings['ux designer'],
    'startup': careerMappings['product manager'],
    'saas': careerMappings['product manager'],
    'platform': careerMappings['devops engineer'],
    'enterprise': careerMappings['business analyst'],
    'consulting': careerMappings['business analyst'],
    'transformation': careerMappings['business analyst'],
    'optimization': careerMappings['data analyst'],
    'growth': careerMappings['product manager'],
    'metrics': careerMappings['data analyst'],
    'kpi': careerMappings['data analyst'],
    'dashboard': careerMappings['data analyst']
  };

  // Exact match first
  if (careerMappings[interest]) {
    console.log(`Exact match: "${userInterest}" → "${careerMappings[interest].title}"`);
    return careerMappings[interest];
  }

  // Partial matches - check if user input contains career mapping keys
  for (const [key, value] of Object.entries(careerMappings)) {
    if (interest.includes(key) || key.includes(interest)) {
      console.log(`Partial match: "${userInterest}" → "${value.title}"`);
      return value;
    }
  }

  // Keyword matching - fallback for broad terms
  for (const [keyword, mapping] of Object.entries(keywordMappings)) {
    if (interest.includes(keyword)) {
      console.log(`Keyword match: "${userInterest}" → "${mapping.title}"`);
      return mapping;
    }
  }

  // No match found
  console.log(`No mapping found for: "${userInterest}"`);
  return null;
};

/**
 * CALCULATE AUTHENTIC MATCH SCORE
 */
const calculateAuthenticMatchScore = (careerPath, userData, priority) => {
  let score = 50; // Base score
  const reasons = [];

  // User explicitly stated this interest
  score += 20;
  reasons.push(`+20 (stated interest)`);

  // Experience level alignment
  const experienceBoost = calculateExperienceAlignment(careerPath, userData.experienceLevel);
  score += experienceBoost;
  reasons.push(`+${experienceBoost} (experience)`);

  // Educational background alignment
  const educationBoost = calculateEducationAlignment(careerPath, userData.studyField);
  score += educationBoost;
  reasons.push(`+${educationBoost} (education)`);

  // Current role relevance
  const roleBoost = calculateCurrentRoleAlignment(careerPath, userData.currentRole);
  score += roleBoost;
  reasons.push(`+${roleBoost} (current role)`);

  // Tools & technology alignment - ENHANCED
  const toolsBoost = calculateEnhancedToolsAlignment(careerPath, userData.toolsUsed);
  score += toolsBoost;
  reasons.push(`+${toolsBoost} (tools)`);

  // Timeline feasibility
  const timelineBoost = calculateTimelineAlignment(careerPath, userData.transitionTimeline, userData.experienceLevel);
  score += timelineBoost;
  reasons.push(`+${timelineBoost} (timeline)`);

  // Priority adjustment
  if (priority === 0) score += 5;
  else if (priority === 1) score += 3;

  const finalScore = Math.min(Math.round(score), 95);
  console.log(`${careerPath.title} score: ${finalScore}% (${reasons.join(', ')})`);
  return finalScore;
};

// Enhanced Helper functions for scoring
const calculateExperienceAlignment = (careerPath, experienceLevel) => {
  if (!experienceLevel) return 0;

  const experienceMap = {
    'Complete beginner': 1,
    'Some exposure': 2,
    'Beginner': 3,
    'Intermediate': 4,
    'Advanced': 5
  };

  const userLevel = experienceMap[experienceLevel] || 1;
  const pathRequirement = getCareerPathRequiredLevel(careerPath);

  if (userLevel === pathRequirement) return 15;
  if (Math.abs(userLevel - pathRequirement) === 1) return 10;
  if (userLevel > pathRequirement) return 12;
  if (userLevel < pathRequirement) {
    const gap = pathRequirement - userLevel;
    return Math.max(0, 8 - (gap * 2));
  }
  return 5;
};

const getCareerPathRequiredLevel = (careerPath) => {
  const levelMap = { 'entry': 2, 'mid': 3, 'senior': 4, 'expert': 5 };
  return levelMap[careerPath.level] || 3;
};

const calculateEducationAlignment = (careerPath, studyField) => {
  if (!studyField || studyField === 'Not specified') return 0;

  const field = studyField.toLowerCase();
  const category = careerPath.category;

  // Enhanced education alignment mapping
  const strongAlignment = {
    'development': ['computer science', 'software engineering', 'information technology', 'computer engineering'],
    'data': ['data science', 'statistics', 'mathematics', 'computer science', 'applied mathematics', 'economics'],
    'design': ['design', 'graphic design', 'digital media', 'art', 'interaction design', 'industrial design'],
    'ai': ['computer science', 'machine learning', 'artificial intelligence', 'mathematics', 'statistics'],
    'security': ['cybersecurity', 'information security', 'computer science', 'information technology'],
    'infrastructure': ['computer science', 'information technology', 'engineering', 'systems engineering'],
    'management': ['business', 'business administration', 'management', 'mba', 'economics'],
    'analysis': ['business', 'economics', 'mathematics', 'statistics', 'finance'],
    'testing': ['computer science', 'software engineering', 'information technology'],
    'communication': ['english', 'communications', 'marketing', 'journalism', 'technical writing']
  };

  if (strongAlignment[category]) {
    for (const alignedField of strongAlignment[category]) {
      if (field.includes(alignedField)) return 12;
    }
  }

  // General STEM bonus
  if (field.includes('engineering') || field.includes('science') || field.includes('mathematics')) return 6;
  
  // Business field bonus for management/analysis roles
  if ((category === 'management' || category === 'analysis') && field.includes('business')) return 10;
  
  return 0;
};

const calculateCurrentRoleAlignment = (careerPath, currentRole) => {
  if (!currentRole || currentRole === 'Not specified') return 0;

  const role = currentRole.toLowerCase();
  const category = careerPath.category;

  // Enhanced role alignment mapping
  const roleAlignment = {
    'development': ['developer', 'programmer', 'engineer', 'coder', 'architect'],
    'data': ['analyst', 'researcher', 'scientist', 'data', 'statistician', 'quantitative'],
    'design': ['designer', 'creative', 'artist', 'marketing', 'brand', 'visual'],
    'management': ['manager', 'coordinator', 'lead', 'supervisor', 'director', 'owner'],
    'analysis': ['analyst', 'consultant', 'researcher', 'advisor', 'strategist'],
    'infrastructure': ['administrator', 'engineer', 'technician', 'specialist', 'architect'],
    'security': ['security', 'analyst', 'engineer', 'specialist', 'consultant', 'auditor'],
    'testing': ['tester', 'qa', 'quality', 'test', 'validation'],
    'communication': ['writer', 'communications', 'marketing', 'content', 'community', 'relations']
  };

  if (roleAlignment[category]) {
    for (const alignedRole of roleAlignment[category]) {
      if (role.includes(alignedRole)) return 8;
    }
  }

  // General tech role bonus
  if (role.includes('tech') || role.includes('it') || role.includes('software')) return 4;
  return 0;
};

const calculateEnhancedToolsAlignment = (careerPath, toolsUsed) => {
  if (!toolsUsed || toolsUsed.length === 0 || toolsUsed.includes('None')) return 0;

  const category = careerPath.category;
  let alignment = 0;

  // Enhanced tools alignment with more comprehensive mappings
  const toolsAlignment = {
    'development': {
      'high': ['javascript', 'python', 'java', 'react', 'angular', 'vue', 'node', 'typescript', 'c#', 'ruby', 'go', 'swift', 'kotlin'],
      'medium': ['html', 'css', 'sql', 'git', 'mongodb', 'postgresql', 'docker', 'api']
    },
    'data': {
      'high': ['python', 'r', 'sql', 'tableau', 'power bi', 'pandas', 'numpy', 'scikit-learn', 'spark', 'hadoop'],
      'medium': ['excel', 'analytics', 'jupyter', 'matplotlib', 'seaborn', 'bigquery']
    },
    'design': {
      'high': ['figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'invision', 'principle'],
      'medium': ['canva', 'zeplin', 'miro', 'framer', 'after effects']
    },
    'ai': {
      'high': ['python', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'opencv', 'nltk', 'spacy'],
      'medium': ['jupyter', 'pandas', 'numpy', 'matplotlib', 'cuda']
    },
    'infrastructure': {
      'high': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins'],
      'medium': ['linux', 'bash', 'git', 'monitoring', 'grafana', 'prometheus']
    },
    'security': {
      'high': ['nmap', 'wireshark', 'metasploit', 'burp suite', 'nessus', 'splunk'],
      'medium': ['kali linux', 'python', 'bash', 'sql', 'networking']
    },
    'testing': {
      'high': ['selenium', 'cypress', 'jest', 'junit', 'postman', 'jmeter'],
      'medium': ['git', 'sql', 'javascript', 'python', 'api testing']
    },
    'management': {
      'high': ['jira', 'confluence', 'slack', 'trello', 'asana', 'miro'],
      'medium': ['excel', 'powerpoint', 'analytics', 'sql']
    },
    'communication': {
      'high': ['confluence', 'notion', 'gitbook', 'markdown', 'cms'],
      'medium': ['slack', 'figma', 'canva', 'wordpress']
    }
  };

  if (toolsAlignment[category]) {
    toolsUsed.forEach(tool => {
      const toolLower = tool.toLowerCase();
      if (toolsAlignment[category].high?.some(t => toolLower.includes(t))) {
        alignment += 3;
      } else if (toolsAlignment[category].medium?.some(t => toolLower.includes(t))) {
        alignment += 2;
      }
    });
  }

  return Math.min(alignment, 12);
};

const calculateTimelineAlignment = (careerPath, timeline, experienceLevel) => {
  if (!timeline) return 0;

  const timelineMonths = {
    'Less than 6 months': 6,
    '6-12 months': 12,
    '1-2 years': 24,
    '2+ years': 36,
    'Already transitioning': 3
  };

  const months = timelineMonths[timeline] || 12;
  const pathLevel = careerPath.level;

  const pathRequiredMonths = {
    'entry': { 'Complete beginner': 12, 'Some exposure': 8, 'Beginner': 6 },
    'mid': { 'Complete beginner': 18, 'Some exposure': 12, 'Beginner': 10, 'Intermediate': 6 },
    'senior': { 'Beginner': 24, 'Intermediate': 18, 'Advanced': 12 },
    'expert': { 'Intermediate': 36, 'Advanced': 24 }
  };

  const requiredMonths = pathRequiredMonths[pathLevel]?.[experienceLevel] || 12;

  if (months >= requiredMonths) return 8;
  if (months >= requiredMonths * 0.75) return 5;
  if (months >= requiredMonths * 0.5) return 2;
  return 0;
};

const generatePersonalizedInsights = (careerPath, userData) => {
  const insights = [];

  if (userData.experienceLevel) {
    insights.push(`Your ${userData.experienceLevel.toLowerCase()} experience level aligns well with ${careerPath.title} requirements`);
  }

  if (userData.studyField && userData.studyField !== 'Not specified') {
    insights.push(`Your ${userData.studyField} background provides a strong foundation for this role`);
  }

  if (userData.toolsUsed && userData.toolsUsed.length > 0 && !userData.toolsUsed.includes('None')) {
    insights.push(`Your experience with ${userData.toolsUsed.slice(0, 2).join(' and ')} gives you a head start`);
  }

  return insights.slice(0, 2);
};

const generateMatchReasoning = (careerPath, userData, score) => {
  if (score >= 85) {
    return "Excellent match based on your interests, experience, and background";
  } else if (score >= 75) {
    return "Strong match with good alignment to your profile and goals";
  } else if (score >= 65) {
    return "Good potential match that builds on your existing strengths";
  } else {
    return "Consider this path after building foundational skills";
  }
};

/**
 * ENHANCED INFERENCE FUNCTIONS
 */
const inferCareerInterests = (userData) => {
  const inferredInterests = [];
  
  // Analyze background signals
  const backgroundSignals = analyzeUserBackgroundSignals(userData);
  
  // Infer from Study Field - ENHANCED
  const fieldInferences = enhancedInferFromStudyField(userData.studyField, backgroundSignals);
  inferredInterests.push(...fieldInferences);
  
  // Infer from Current Role - ENHANCED
  const roleInferences = enhancedInferFromCurrentRole(userData.currentRole, userData.jobResponsibilities, backgroundSignals);
  inferredInterests.push(...roleInferences);
  
  // Infer from Tools and Technologies - ENHANCED
  const toolInferences = enhancedInferFromTools(userData.toolsUsed, backgroundSignals);
  inferredInterests.push(...toolInferences);
  
  // Infer from Transferable Skills
  const skillInferences = inferFromTransferableSkills(userData.transferableSkills, backgroundSignals);
  inferredInterests.push(...skillInferences);
  
  // Remove duplicates and sort by confidence
  const uniqueInferences = deduplicateInferences(inferredInterests);
  return uniqueInferences.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
};

const analyzeUserBackgroundSignals = (userData) => {
  const signals = {
    technical: 0,
    analytical: 0,
    creative: 0,
    leadership: 0,
    communication: 0
  };
  
  // Study field signals
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('computer') || field.includes('engineering') || field.includes('technology')) {
      signals.technical += 30;
    }
    if (field.includes('business') || field.includes('management')) {
      signals.leadership += 25;
      signals.communication += 15;
    }
    if (field.includes('design') || field.includes('art')) {
      signals.creative += 30;
    }
    if (field.includes('math') || field.includes('statistics') || field.includes('data')) {
      signals.analytical += 30;
    }
  }
  
  return signals;
};

/**
 * ENHANCED STUDY FIELD INFERENCE
 */
const enhancedInferFromStudyField = (studyField, signals) => {
  if (!studyField || studyField === 'Not specified') return [];
  
  const field = studyField.toLowerCase();
  const fieldCareerMap = {
    // Computer Science & Related
    'computer science': [
      { title: 'Software Developer', confidence: 90, reason: 'Direct CS degree alignment with software development' },
      { title: 'Data Scientist', confidence: 80, reason: 'CS foundation excellent for data science' },
      { title: 'AI Engineer', confidence: 85, reason: 'CS curriculum includes AI/ML fundamentals' },
      { title: 'Backend Developer', confidence: 85, reason: 'CS teaches system architecture and algorithms' }
    ],
    'software engineering': [
      { title: 'Software Engineer', confidence: 95, reason: 'Perfect match - software engineering degree' },
      { title: 'DevOps Engineer', confidence: 75, reason: 'SE covers software lifecycle and deployment' },
      { title: 'Technical Lead', confidence: 70, reason: 'SE includes project and team management concepts' }
    ],
    'information technology': [
      { title: 'Systems Engineer', confidence: 85, reason: 'IT background directly applicable to systems' },
      { title: 'DevOps Engineer', confidence: 80, reason: 'IT knowledge essential for infrastructure' },
      { title: 'Cloud Engineer', confidence: 75, reason: 'IT foundation supports cloud technologies' }
    ],
    'computer engineering': [
      { title: 'Software Developer', confidence: 80, reason: 'Computer engineering includes programming' },
      { title: 'Systems Engineer', confidence: 85, reason: 'Hardware/software integration knowledge' },
      { title: 'DevOps Engineer', confidence: 75, reason: 'Understanding of system architecture' }
    ],
    'data science': [
      { title: 'Data Scientist', confidence: 95, reason: 'Perfect match - data science degree' },
      { title: 'ML Engineer', confidence: 90, reason: 'Data science curriculum includes ML' },
      { title: 'Data Analyst', confidence: 85, reason: 'Strong foundation for data analysis' }
    ],
    
    // Business & Management
    'business administration': [
      { title: 'Product Manager', confidence: 85, reason: 'Business knowledge crucial for product strategy' },
      { title: 'Business Analyst', confidence: 90, reason: 'Direct business background application' },
      { title: 'Technical Project Manager', confidence: 80, reason: 'Management skills transfer to tech projects' }
    ],
    'business': [
      { title: 'Product Manager', confidence: 80, reason: 'Business understanding essential for PM role' },
      { title: 'Business Analyst', confidence: 85, reason: 'Business background directly applicable' }
    ],
    'mba': [
      { title: 'Product Manager', confidence: 90, reason: 'MBA provides strategic thinking for product management' },
      { title: 'Technical Project Manager', confidence: 85, reason: 'Leadership and management expertise' }
    ],
    'management': [
      { title: 'Technical Project Manager', confidence: 85, reason: 'Management background applies to tech leadership' },
      { title: 'Product Manager', confidence: 80, reason: 'Management skills valuable for product roles' }
    ],
    
    // Design & Creative
    'design': [
      { title: 'UX Designer', confidence: 90, reason: 'Design education directly applicable to UX' },
      { title: 'UI Designer', confidence: 85, reason: 'Visual design principles transfer to interfaces' },
      { title: 'Product Designer', confidence: 80, reason: 'Design thinking valuable for product design' }
    ],
    'graphic design': [
      { title: 'UI Designer', confidence: 85, reason: 'Visual design skills transfer to digital interfaces' },
      { title: 'UX Designer', confidence: 75, reason: 'Design principles applicable to user experience' },
      { title: 'Digital Designer', confidence: 90, reason: 'Direct application of graphic design skills' }
    ],
    'interaction design': [
      { title: 'UX Designer', confidence: 95, reason: 'Perfect match - interaction design expertise' },
      { title: 'Product Designer', confidence: 85, reason: 'Interaction knowledge valuable for products' }
    ],
    'industrial design': [
      { title: 'Product Designer', confidence: 80, reason: 'Design thinking and user-centered approach' },
      { title: 'UX Designer', confidence: 70, reason: 'User research and design process experience' }
    ],
    
    // Mathematics & Statistics
    'mathematics': [
      { title: 'Data Scientist', confidence: 90, reason: 'Mathematical foundation crucial for data science' },
      { title: 'ML Engineer', confidence: 85, reason: 'Math background essential for ML algorithms' },
      { title: 'Data Analyst', confidence: 80, reason: 'Statistical knowledge directly applicable' }
    ],
    'statistics': [
      { title: 'Data Scientist', confidence: 95, reason: 'Statistics directly applicable to data science' },
      { title: 'Data Analyst', confidence: 90, reason: 'Statistical analysis is core requirement' },
      { title: 'Business Intelligence Analyst', confidence: 80, reason: 'Statistical knowledge for business insights' }
    ],
    'applied mathematics': [
      { title: 'Data Scientist', confidence: 85, reason: 'Applied math valuable for data modeling' },
      { title: 'ML Engineer', confidence: 80, reason: 'Mathematical modeling for ML algorithms' }
    ],
    
    // Engineering Disciplines
    'electrical engineering': [
      { title: 'Software Developer', confidence: 70, reason: 'Programming and logical thinking skills' },
      { title: 'Systems Engineer', confidence: 75, reason: 'Hardware/software integration knowledge' },
      { title: 'Data Engineer', confidence: 65, reason: 'Engineering problem-solving approach' }
    ],
    'mechanical engineering': [
      { title: 'Software Developer', confidence: 65, reason: 'Engineering problem-solving and logical thinking' },
      { title: 'Data Analyst', confidence: 70, reason: 'Analytical and quantitative skills' },
      { title: 'Product Manager', confidence: 75, reason: 'Engineering background valuable for technical products' }
    ],
    'civil engineering': [
      { title: 'Data Analyst', confidence: 70, reason: 'Analytical and project management skills' },
      { title: 'Technical Project Manager', confidence: 75, reason: 'Project management and technical background' }
    ],
    
    // Science Fields
    'physics': [
      { title: 'Data Scientist', confidence: 80, reason: 'Quantitative analysis and modeling skills' },
      { title: 'ML Engineer', confidence: 75, reason: 'Mathematical modeling and analytical thinking' },
      { title: 'Software Developer', confidence: 70, reason: 'Logical reasoning and problem-solving' }
    ],
    'chemistry': [
      { title: 'Data Analyst', confidence: 75, reason: 'Laboratory data analysis experience' },
      { title: 'Data Scientist', confidence: 70, reason: 'Scientific method and analytical skills' }
    ],
    'biology': [
      { title: 'Data Analyst', confidence: 70, reason: 'Research and data analysis experience' },
      { title: 'Data Scientist', confidence: 65, reason: 'Scientific research methodology' }
    ],
    
    // Liberal Arts & Humanities
    'psychology': [
      { title: 'UX Designer', confidence: 80, reason: 'Understanding of human behavior and cognition' },
      { title: 'Product Manager', confidence: 70, reason: 'User empathy and research skills' },
      { title: 'Business Analyst', confidence: 65, reason: 'Research and analytical thinking' }
    ],
    'english': [
      { title: 'Technical Writer', confidence: 85, reason: 'Writing and communication expertise' },
      { title: 'Product Manager', confidence: 70, reason: 'Communication skills essential for PM role' },
      { title: 'UX Designer', confidence: 65, reason: 'Content strategy and user communication' }
    ],
    'communications': [
      { title: 'Technical Writer', confidence: 80, reason: 'Communication expertise directly applicable' },
      { title: 'Developer Advocate', confidence: 85, reason: 'Perfect match for developer relations' },
      { title: 'Product Manager', confidence: 75, reason: 'Communication skills essential for stakeholder management' }
    ],
    'marketing': [
      { title: 'Product Manager', confidence: 80, reason: 'Marketing knowledge valuable for product strategy' },
      { title: 'Data Analyst', confidence: 75, reason: 'Marketing analytics and metrics experience' },
      { title: 'Business Analyst', confidence: 70, reason: 'Business and customer understanding' }
    ],
    
    // Economics & Finance
    'economics': [
      { title: 'Data Analyst', confidence: 80, reason: 'Quantitative analysis and statistical knowledge' },
      { title: 'Business Analyst', confidence: 85, reason: 'Economic analysis directly applicable to business' },
      { title: 'Data Scientist', confidence: 75, reason: 'Econometric modeling and data analysis' }
    ],
    'finance': [
      { title: 'Data Analyst', confidence: 75, reason: 'Financial modeling and quantitative analysis' },
      { title: 'Business Analyst', confidence: 80, reason: 'Business and financial analysis skills' },
      { title: 'Product Manager', confidence: 70, reason: 'Business acumen for product decisions' }
    ]
  };
  
  // Find matches for the study field
  const matches = [];
  for (const [fieldKey, careers] of Object.entries(fieldCareerMap)) {
    if (field.includes(fieldKey) || fieldKey.includes(field)) {
      matches.push(...careers);
      break; // Take first match to avoid duplicates
    }
  }
  
  return matches;
};

/**
 * ENHANCED CURRENT ROLE INFERENCE
 */
const enhancedInferFromCurrentRole = (currentRole, jobResponsibilities, signals) => {
  if (!currentRole || currentRole === 'Not specified') return [];
  
  const role = currentRole.toLowerCase();
  const roleCareerMap = {
    // Technology Roles
    'software engineer': [
      { title: 'Software Developer', confidence: 90, reason: 'Direct role alignment' },
      { title: 'Technical Lead', confidence: 75, reason: 'Natural progression from engineering role' }
    ],
    'developer': [
      { title: 'Software Developer', confidence: 95, reason: 'Perfect role match' },
      { title: 'DevOps Engineer', confidence: 70, reason: 'Development background useful for DevOps' }
    ],
    'data analyst': [
      { title: 'Data Analyst', confidence: 95, reason: 'Direct role match' },
      { title: 'Data Scientist', confidence: 80, reason: 'Natural progression from analyst role' },
      { title: 'Business Intelligence Analyst', confidence: 85, reason: 'Analysis skills directly transferable' }
    ],
    'business analyst': [
      { title: 'Business Analyst', confidence: 95, reason: 'Perfect role match' },
      { title: 'Product Manager', confidence: 80, reason: 'Business analysis skills valuable for product management' },
      { title: 'Data Analyst', confidence: 75, reason: 'Analytical skills transfer to data analysis' }
    ],
    
    // Management Roles
    'project manager': [
      { title: 'Technical Project Manager', confidence: 90, reason: 'Project management experience directly applicable' },
      { title: 'Product Manager', confidence: 75, reason: 'Management skills transfer to product roles' }
    ],
    'product manager': [
      { title: 'Product Manager', confidence: 95, reason: 'Perfect role match' },
      { title: 'Business Analyst', confidence: 70, reason: 'Product analysis skills transferable' }
    ],
    'manager': [
      { title: 'Technical Project Manager', confidence: 80, reason: 'Management experience essential for tech leadership' },
      { title: 'Product Manager', confidence: 75, reason: 'Leadership skills valuable for product roles' }
    ],
    
    // Marketing & Sales
    'marketing': [
      { title: 'Product Manager', confidence: 75, reason: 'Marketing experience valuable for product positioning' },
      { title: 'Data Analyst', confidence: 70, reason: 'Marketing analytics skills transfer to data analysis' },
      { title: 'Business Analyst', confidence: 65, reason: 'Customer and market understanding' }
    ],
    'sales': [
      { title: 'Product Manager', confidence: 70, reason: 'Customer interaction experience valuable' },
      { title: 'Business Analyst', confidence: 65, reason: 'Customer needs analysis experience' }
    ],
    'digital marketing': [
      { title: 'Data Analyst', confidence: 80, reason: 'Digital marketing requires data analysis skills' },
      { title: 'Product Manager', confidence: 75, reason: 'Digital product knowledge transferable' }
    ],
    
    // Design Roles
    'designer': [
      { title: 'UX Designer', confidence: 85, reason: 'Design experience directly applicable' },
      { title: 'UI Designer', confidence: 80, reason: 'Visual design skills transferable' },
      { title: 'Product Designer', confidence: 75, reason: 'Design thinking valuable for products' }
    ],
    'graphic designer': [
      { title: 'UI Designer', confidence: 85, reason: 'Visual design skills transfer to interfaces' },
      { title: 'UX Designer', confidence: 70, reason: 'Design principles applicable to UX' }
    ],
    
    // Research & Analysis
    'researcher': [
      { title: 'Data Scientist', confidence: 80, reason: 'Research methodology directly applicable' },
      { title: 'UX Designer', confidence: 75, reason: 'Research skills valuable for user research' },
      { title: 'Data Analyst', confidence: 75, reason: 'Research and analysis skills transferable' }
    ],
    'consultant': [
      { title: 'Business Analyst', confidence: 80, reason: 'Consulting experience directly applicable' },
      { title: 'Product Manager', confidence: 70, reason: 'Strategic thinking and client interaction' }
    ],
    
    // Operations & Support
    'operations': [
      { title: 'DevOps Engineer', confidence: 75, reason: 'Operations experience essential for DevOps' },
      { title: 'Technical Project Manager', confidence: 70, reason: 'Operations management skills transferable' }
    ],
    'support': [
      { title: 'QA Engineer', confidence: 70, reason: 'Understanding of user issues and system problems' },
      { title: 'Technical Writer', confidence: 65, reason: 'Experience explaining technical concepts' }
    ],
    
    // Finance & Accounting
    'financial analyst': [
      { title: 'Data Analyst', confidence: 80, reason: 'Financial analysis skills directly transferable' },
      { title: 'Business Analyst', confidence: 85, reason: 'Business and financial analysis experience' }
    ],
    'accountant': [
      { title: 'Data Analyst', confidence: 70, reason: 'Data analysis and attention to detail' },
      { title: 'Business Analyst', confidence: 65, reason: 'Business process understanding' }
    ]
  };
  
  const inferences = [];
  
  // Find role matches
  for (const [roleType, careers] of Object.entries(roleCareerMap)) {
    if (role.includes(roleType)) {
      inferences.push(...careers);
    }
  }
  
  // If no specific matches, try broader categories
  if (inferences.length === 0) {
    if (role.includes('analyst')) {
      inferences.push(
        { title: 'Data Analyst', confidence: 75, reason: 'Analysis skills directly transferable' },
        { title: 'Business Analyst', confidence: 70, reason: 'Analytical thinking applies to business problems' }
      );
    }
    if (role.includes('manager') || role.includes('lead')) {
      inferences.push(
        { title: 'Product Manager', confidence: 70, reason: 'Management experience essential for product leadership' },
        { title: 'Technical Project Manager', confidence: 75, reason: 'Management skills apply to technical projects' }
      );
    }
  }
  
  return inferences;
};

/**
 * ENHANCED TOOL-BASED INFERENCE
 */
const enhancedInferFromTools = (toolsUsed, signals) => {
  if (!toolsUsed || toolsUsed.length === 0 || toolsUsed.includes('None')) return [];
  
  const toolCareerMap = {
    // Programming Languages
    'python': [
      { title: 'Data Scientist', confidence: 85, reason: 'Python is the primary language for data science' },
      { title: 'Backend Developer', confidence: 80, reason: 'Python widely used for backend development' },
      { title: 'ML Engineer', confidence: 85, reason: 'Python essential for machine learning' }
    ],
    'javascript': [
      { title: 'Frontend Developer', confidence: 90, reason: 'JavaScript is essential for frontend development' },
      { title: 'Full Stack Developer', confidence: 80, reason: 'JavaScript enables full-stack development' },
      { title: 'Backend Developer', confidence: 75, reason: 'Node.js for backend JavaScript development' }
    ],
    'java': [
      { title: 'Backend Developer', confidence: 85, reason: 'Java is a major backend development language' },
      { title: 'Software Developer', confidence: 80, reason: 'Java is widely used in enterprise software' }
    ],
    'c#': [
      { title: 'Backend Developer', confidence: 80, reason: 'C# is primary Microsoft stack backend language' },
      { title: 'Software Developer', confidence: 75, reason: 'C# used for Windows application development' }
    ],
    'ruby': [
      { title: 'Backend Developer', confidence: 80, reason: 'Ruby on Rails for web backend development' },
      { title: 'Full Stack Developer', confidence: 75, reason: 'Ruby used in full-stack web development' }
    ],
    'php': [
      { title: 'Backend Developer', confidence: 75, reason: 'PHP is a popular web backend language' },
      { title: 'Web Developer', confidence: 80, reason: 'PHP commonly used for web development' }
    ],
    'go': [
      { title: 'Backend Developer', confidence: 80, reason: 'Go excellent for backend services and APIs' },
      { title: 'DevOps Engineer', confidence: 75, reason: 'Go used for infrastructure and DevOps tools' }
    ],
    'rust': [
      { title: 'Backend Developer', confidence: 75, reason: 'Rust gaining popularity for system programming' },
      { title: 'Systems Engineer', confidence: 70, reason: 'Rust used for low-level system programming' }
    ],
    'swift': [
      { title: 'Mobile App Developer', confidence: 90, reason: 'Swift is the primary iOS development language' }
    ],
    'kotlin': [
      { title: 'Mobile App Developer', confidence: 85, reason: 'Kotlin is modern Android development language' }
    ],
    
    // Frontend Frameworks & Libraries
    'react': [
      { title: 'Frontend Developer', confidence: 90, reason: 'React is a leading frontend framework' },
      { title: 'Full Stack Developer', confidence: 80, reason: 'React commonly used in full-stack development' }
    ],
    'angular': [
      { title: 'Frontend Developer', confidence: 85, reason: 'Angular is a major frontend framework' },
      { title: 'Full Stack Developer', confidence: 75, reason: 'Angular used in enterprise full-stack apps' }
    ],
    'vue': [
      { title: 'Frontend Developer', confidence: 85, reason: 'Vue.js is a popular frontend framework' }
    ],
    'next.js': [
      { title: 'Full Stack Developer', confidence: 85, reason: 'Next.js enables full-stack React development' },
      { title: 'Frontend Developer', confidence: 80, reason: 'Next.js is advanced React framework' }
    ],
    
    // Data Science & Analytics Tools
    'tableau': [
      { title: 'Data Analyst', confidence: 85, reason: 'Tableau is leading data visualization tool' },
      { title: 'Business Intelligence Analyst', confidence: 90, reason: 'Tableau essential for BI roles' }
    ],
    'power bi': [
      { title: 'Data Analyst', confidence: 80, reason: 'Power BI is Microsoft business intelligence tool' },
      { title: 'Business Intelligence Analyst', confidence: 85, reason: 'Power BI core tool for BI analysts' }
    ],
    'excel': [
      { title: 'Data Analyst', confidence: 70, reason: 'Excel fundamental for data analysis' },
      { title: 'Business Analyst', confidence: 75, reason: 'Excel essential for business analysis' }
    ],
    'sql': [
      { title: 'Data Analyst', confidence: 85, reason: 'SQL essential for data querying and analysis' },
      { title: 'Data Engineer', confidence: 90, reason: 'SQL fundamental for data engineering' },
      { title: 'Backend Developer', confidence: 70, reason: 'SQL needed for database-driven applications' }
    ],
    'r': [
      { title: 'Data Scientist', confidence: 90, reason: 'R is specialized language for statistical analysis' },
      { title: 'Data Analyst', confidence: 85, reason: 'R excellent for advanced data analysis' }
    ],
    'pandas': [
      { title: 'Data Scientist', confidence: 85, reason: 'Pandas is essential Python data science library' },
      { title: 'Data Analyst', confidence: 80, reason: 'Pandas fundamental for data manipulation' }
    ],
    'numpy': [
      { title: 'Data Scientist', confidence: 80, reason: 'NumPy essential for numerical computing' },
      { title: 'ML Engineer', confidence: 75, reason: 'NumPy fundamental for ML data processing' }
    ],
    
    // ML & AI Tools
    'tensorflow': [
      { title: 'ML Engineer', confidence: 90, reason: 'TensorFlow is leading ML framework' },
      { title: 'AI Engineer', confidence: 85, reason: 'TensorFlow widely used for AI development' }
    ],
    'pytorch': [
      { title: 'ML Engineer', confidence: 90, reason: 'PyTorch is popular deep learning framework' },
      { title: 'AI Engineer', confidence: 85, reason: 'PyTorch preferred for AI research and development' }
    ],
    'scikit-learn': [
      { title: 'Data Scientist', confidence: 85, reason: 'Scikit-learn essential for ML in Python' },
      { title: 'ML Engineer', confidence: 80, reason: 'Scikit-learn fundamental for ML algorithms' }
    ],
    
    // Design Tools
    'figma': [
      { title: 'UX Designer', confidence: 90, reason: 'Figma is industry standard for UX design' },
      { title: 'UI Designer', confidence: 85, reason: 'Figma excellent for UI design and prototyping' },
      { title: 'Product Designer', confidence: 85, reason: 'Figma essential for product design workflows' }
    ],
    'sketch': [
      { title: 'UI Designer', confidence: 85, reason: 'Sketch is popular UI design tool' },
      { title: 'UX Designer', confidence: 80, reason: 'Sketch used for UX design and wireframing' }
    ],
    'adobe xd': [
      { title: 'UX Designer', confidence: 80, reason: 'Adobe XD is UX/UI design and prototyping tool' },
      { title: 'UI Designer', confidence: 85, reason: 'Adobe XD excellent for UI design' }
    ],
    'photoshop': [
      { title: 'UI Designer', confidence: 75, reason: 'Photoshop used for visual design and graphics' },
      { title: 'Digital Designer', confidence: 80, reason: 'Photoshop fundamental for graphic design' }
    ],
    'illustrator': [
      { title: 'UI Designer', confidence: 75, reason: 'Illustrator used for vector graphics and icons' },
      { title: 'Digital Designer', confidence: 85, reason: 'Illustrator essential for graphic design' }
    ],
    
    // DevOps & Infrastructure Tools
    'docker': [
      { title: 'DevOps Engineer', confidence: 85, reason: 'Docker essential for containerization' },
      { title: 'Backend Developer', confidence: 70, reason: 'Docker commonly used in backend development' }
    ],
    'kubernetes': [
      { title: 'DevOps Engineer', confidence: 90, reason: 'Kubernetes essential for container orchestration' },
      { title: 'Cloud Engineer', confidence: 85, reason: 'Kubernetes key for cloud-native applications' }
    ],
    'aws': [
      { title: 'Cloud Engineer', confidence: 90, reason: 'AWS is leading cloud platform' },
      { title: 'DevOps Engineer', confidence: 85, reason: 'AWS essential for cloud infrastructure' }
    ],
    'azure': [
      { title: 'Cloud Engineer', confidence: 85, reason: 'Microsoft Azure is major cloud platform' },
      { title: 'DevOps Engineer', confidence: 80, reason: 'Azure used for cloud infrastructure' }
    ],
    'gcp': [
      { title: 'Cloud Engineer', confidence: 85, reason: 'Google Cloud Platform is major cloud provider' },
      { title: 'DevOps Engineer', confidence: 80, reason: 'GCP used for cloud infrastructure' }
    ],
    'terraform': [
      { title: 'DevOps Engineer', confidence: 85, reason: 'Terraform essential for infrastructure as code' },
      { title: 'Cloud Engineer', confidence: 80, reason: 'Terraform used for cloud infrastructure management' }
    ],
    'ansible': [
      { title: 'DevOps Engineer', confidence: 80, reason: 'Ansible used for configuration management' },
      { title: 'Systems Engineer', confidence: 75, reason: 'Ansible useful for system automation' }
    ],
    'jenkins': [
      { title: 'DevOps Engineer', confidence: 85, reason: 'Jenkins essential for CI/CD pipelines' }
    ],
    
    // Testing Tools
    'selenium': [
      { title: 'QA Engineer', confidence: 85, reason: 'Selenium is leading test automation framework' }
    ],
    'jest': [
      { title: 'Frontend Developer', confidence: 75, reason: 'Jest is popular JavaScript testing framework' },
      { title: 'QA Engineer', confidence: 70, reason: 'Jest used for automated testing' }
    ],
    'cypress': [
      { title: 'QA Engineer', confidence: 80, reason: 'Cypress is modern end-to-end testing tool' },
      { title: 'Frontend Developer', confidence: 70, reason: 'Cypress used for frontend testing' }
    ],
    
    // Database Tools
    'mongodb': [
      { title: 'Backend Developer', confidence: 80, reason: 'MongoDB popular NoSQL database for backends' },
      { title: 'Data Engineer', confidence: 75, reason: 'MongoDB used in data engineering pipelines' }
    ],
    'postgresql': [
      { title: 'Backend Developer', confidence: 75, reason: 'PostgreSQL popular relational database' },
      { title: 'Data Engineer', confidence: 80, reason: 'PostgreSQL excellent for data engineering' }
    ],
    'mysql': [
      { title: 'Backend Developer', confidence: 75, reason: 'MySQL widely used relational database' },
      { title: 'Data Analyst', confidence: 70, reason: 'MySQL used for data storage and analysis' }
    ]
  };
  
  const inferences = [];
  
  toolsUsed.forEach(tool => {
    const toolLower = tool.toLowerCase();
    for (const [techTool, careers] of Object.entries(toolCareerMap)) {
      if (toolLower.includes(techTool) || techTool.includes(toolLower)) {
        inferences.push(...careers);
      }
    }
  });
  
  return inferences;
};

const inferFromTransferableSkills = (transferableSkills, signals) => {
  if (!transferableSkills || transferableSkills === 'Not specified') return [];
  
  const skills = transferableSkills.toLowerCase();
  const inferences = [];
  
  if (skills.includes('communication') || skills.includes('presentation')) {
    inferences.push({
      title: 'Product Manager',
      confidence: 70,
      reason: 'Communication skills essential for product management'
    });
    inferences.push({
      title: 'Technical Writer',
      confidence: 75,
      reason: 'Communication skills directly applicable to technical writing'
    });
  }
  
  if (skills.includes('leadership') || skills.includes('management')) {
    inferences.push({
      title: 'Technical Project Manager',
      confidence: 75,
      reason: 'Leadership experience applies to technical project management'
    });
    inferences.push({
      title: 'Product Manager',
      confidence: 70,
      reason: 'Leadership skills essential for product management'
    });
  }
  
  if (skills.includes('analytical') || skills.includes('problem solving')) {
    inferences.push({
      title: 'Data Analyst',
      confidence: 70,
      reason: 'Analytical skills directly applicable to data analysis'
    });
    inferences.push({
      title: 'Business Analyst',
      confidence: 75,
      reason: 'Problem-solving skills essential for business analysis'
    });
  }
  
  if (skills.includes('creative') || skills.includes('design')) {
    inferences.push({
      title: 'UX Designer',
      confidence: 70,
      reason: 'Creative skills applicable to user experience design'
    });
    inferences.push({
      title: 'UI Designer',
      confidence: 65,
      reason: 'Design skills transferable to interface design'
    });
  }
  
  return inferences;
};

const findAdjacentCareers = (primaryCareers) => {
  const adjacencyMap = {
    'Data Analyst': ['Business Analyst', 'Data Scientist', 'Business Intelligence Analyst'],
    'Data Scientist': ['ML Engineer', 'Data Engineer', 'Research Scientist'],
    'UX Designer': ['Product Designer', 'UI Designer', 'Design Researcher'],
    'UI Designer': ['UX Designer', 'Frontend Developer', 'Digital Designer'],
    'Software Developer': ['DevOps Engineer', 'Technical Lead', 'Solution Architect'],
    'Frontend Developer': ['Full Stack Developer', 'UI Designer', 'Mobile App Developer'],
    'Backend Developer': ['Full Stack Developer', 'DevOps Engineer', 'Data Engineer'],
    'Product Manager': ['Product Owner', 'Business Analyst', 'Strategy Consultant'],
    'Business Analyst': ['Product Manager', 'Data Analyst', 'Technical Project Manager'],
    'DevOps Engineer': ['Cloud Engineer', 'Systems Engineer', 'Site Reliability Engineer'],
    'Cloud Engineer': ['DevOps Engineer', 'Systems Engineer', 'Solution Architect'],
    'ML Engineer': ['Data Scientist', 'AI Engineer', 'Research Scientist'],
    'AI Engineer': ['ML Engineer', 'Data Scientist', 'Research Scientist'],
    'Technical Project Manager': ['Product Manager', 'Business Analyst', 'Agile Coach'],
    'QA Engineer': ['Software Developer', 'DevOps Engineer', 'Technical Writer'],
    'Technical Writer': ['Developer Advocate', 'UX Designer', 'Product Manager'],
    'Systems Engineer': ['DevOps Engineer', 'Cloud Engineer', 'Security Engineer'],
    'Cybersecurity Analyst': ['Security Engineer', 'Systems Engineer', 'Penetration Tester'],
    'Security Engineer': ['DevOps Engineer', 'Systems Engineer', 'Cloud Engineer']
  };
  
  const adjacent = [];
  primaryCareers.forEach(career => {
    if (adjacencyMap[career.title]) {
      adjacent.push(...adjacencyMap[career.title]);
    }
  });
  
  return [...new Set(adjacent)];
};

const isAlreadyRecommended = (careerTitle, existingRecommendations) => {
  return existingRecommendations.some(rec => rec.title === careerTitle);
};

const deduplicateInferences = (inferences) => {
  const unique = {};
  
  inferences.forEach(inference => {
    if (unique[inference.title]) {
      // Combine confidences but cap at 95
      unique[inference.title].confidence = Math.min(
        unique[inference.title].confidence + (inference.confidence * 0.2), 
        95
      );
      // Keep the best reason
      if (inference.confidence > unique[inference.title].originalConfidence) {
        unique[inference.title].reason = inference.reason;
      }
    } else {
      unique[inference.title] = { 
        ...inference, 
        originalConfidence: inference.confidence 
      };
    }
  });
  
  return Object.values(unique);
};

// Continue with ML functions from original code...
/**
 * MACHINE LEARNING RECOMMENDATION ENGINE
 */
const generateMLRecommendations = (userData) => {
  console.log('🧠 Generating ML-based recommendations...');
  
  // Extract features from user data
  const userFeatures = extractUserFeatures(userData);
  
  // Find similar user profiles
  const similarProfiles = findSimilarProfiles(userFeatures);
  
  // Analyze career transition patterns
  const transitionPatterns = analyzeTransitionPatterns(userFeatures);
  
  // Get clustering-based recommendations
  const clusterRecommendations = getClusterBasedRecommendations(userFeatures);
  
  // Calculate success probabilities
  const successScores = calculateSuccessProbabilities(userFeatures);
  
  return {
    userFeatures,
    similarProfiles,
    transitionPatterns,
    clusterRecommendations,
    successScores
  };
};

/**
 * FEATURE EXTRACTION FOR ML
 */
const extractUserFeatures = (userData) => {
  const features = {
    // Encoded categorical features
    studyField: encodeStudyField(userData.studyField),
    currentRole: encodeCurrentRole(userData.currentRole),
    experienceLevel: encodeExperienceLevel(userData.experienceLevel),
    
    // Numerical features
    yearsExperience: parseYearsExperience(userData.yearsExperience),
    timeCommitment: parseTimeCommitment(userData.timeCommitment),
    
    // Derived features
    technicalAptitude: calculateTechnicalAptitude(userData),
    businessAcumen: calculateBusinessAcumen(userData),
    creativityScore: calculateCreativityScore(userData),
    analyticalThinking: calculateAnalyticalThinking(userData),
    communicationSkills: calculateCommunicationSkills(userData),
    leadershipPotential: calculateLeadershipPotential(userData)
  };
  
  console.log('🔍 Extracted user features:', features);
  return features;
};

// Enhanced Feature calculation functions
const calculateTechnicalAptitude = (userData) => {
  let score = 0;
  
  // Study field contribution - Enhanced
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('computer science') || field.includes('software engineering')) {
      score += 0.5;
    } else if (field.includes('computer') || field.includes('engineering') || field.includes('technology')) {
      score += 0.4;
    } else if (field.includes('math') || field.includes('science') || field.includes('physics')) {
      score += 0.3;
    } else if (field.includes('data science') || field.includes('information technology')) {
      score += 0.45;
    }
  }
  
  // Tools contribution - Enhanced with more tools
  if (userData.toolsUsed && userData.toolsUsed.length > 0 && !userData.toolsUsed.includes('None')) {
    const technicalTools = [
      'Python', 'JavaScript', 'Java', 'React', 'SQL', 'Git', 'Docker', 'AWS',
      'Angular', 'Vue', 'Node.js', 'C#', 'Ruby', 'Go', 'Kubernetes', 'Azure',
      'GCP', 'Terraform', 'Jenkins', 'Linux', 'MongoDB', 'PostgreSQL'
    ];
    const userTechnicalTools = userData.toolsUsed.filter(tool => 
      technicalTools.some(techTool => tool.toLowerCase().includes(techTool.toLowerCase()))
    );
    score += Math.min(userTechnicalTools.length * 0.08, 0.4);
  }
  
  // Current role contribution
  if (userData.currentRole) {
    const role = userData.currentRole.toLowerCase();
    if (role.includes('developer') || role.includes('engineer') || role.includes('programmer')) {
      score += 0.3;
    } else if (role.includes('analyst') && role.includes('data')) {
      score += 0.25;
    } else if (role.includes('tech') || role.includes('it')) {
      score += 0.2;
    }
  }
  
  // Experience level contribution
  const expBoost = {
    'Complete beginner': 0,
    'Some exposure': 0.05,
    'Beginner': 0.1,
    'Intermediate': 0.15,
    'Advanced': 0.2
  };
  score += expBoost[userData.experienceLevel] || 0;
  
  return Math.min(score, 1.0);
};

const calculateBusinessAcumen = (userData) => {
  let score = 0;
  
  // Study field contribution - Enhanced
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('business administration') || field.includes('mba')) {
      score += 0.5;
    } else if (field.includes('business') || field.includes('management')) {
      score += 0.4;
    } else if (field.includes('economics') || field.includes('finance')) {
      score += 0.35;
    } else if (field.includes('marketing')) {
      score += 0.3;
    }
  }
  
  // Current role contribution - Enhanced
  if (userData.currentRole) {
    const role = userData.currentRole.toLowerCase();
    if (role.includes('manager') || role.includes('director')) {
      score += 0.4;
    } else if (role.includes('analyst') && !role.includes('data')) {
      score += 0.3;
    } else if (role.includes('consultant') || role.includes('strategy')) {
      score += 0.35;
    } else if (role.includes('marketing') || role.includes('sales')) {
      score += 0.25;
    }
  }
  
  // Transferable skills contribution
  if (userData.transferableSkills) {
    const skills = userData.transferableSkills.toLowerCase();
    if (skills.includes('leadership') || skills.includes('management')) {
      score += 0.3;
    }
    if (skills.includes('strategy') || skills.includes('planning')) {
      score += 0.25;
    }
  }
  
  return Math.min(score, 1.0);
};

const calculateCreativityScore = (userData) => {
  let score = 0;
  
  // Study field contribution - Enhanced
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('design') || field.includes('art')) {
      score += 0.5;
    } else if (field.includes('creative') || field.includes('media')) {
      score += 0.4;
    } else if (field.includes('marketing') || field.includes('communications')) {
      score += 0.25;
    }
  }
  
  // Tools contribution - Enhanced
  if (userData.toolsUsed && userData.toolsUsed.length > 0) {
    const creativeTools = [
      'Figma', 'Adobe', 'Sketch', 'Photoshop', 'Illustrator', 'Adobe XD',
      'InVision', 'Canva', 'After Effects', 'Premiere', 'Blender'
    ];
    const userCreativeTools = userData.toolsUsed.filter(tool => 
      creativeTools.some(creativeTool => tool.toLowerCase().includes(creativeTool.toLowerCase()))
    );
    score += Math.min(userCreativeTools.length * 0.15, 0.4);
  }
  
  // Current role contribution - Enhanced
  if (userData.currentRole) {
    const role = userData.currentRole.toLowerCase();
    if (role.includes('designer') || role.includes('creative')) {
      score += 0.4;
    } else if (role.includes('marketing') || role.includes('brand')) {
      score += 0.25;
    } else if (role.includes('content') || role.includes('media')) {
      score += 0.2;
    }
  }
  
  return Math.min(score, 1.0);
};

const calculateAnalyticalThinking = (userData) => {
  let score = 0;
  
  // Study field contribution - Enhanced
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('mathematics') || field.includes('statistics')) {
      score += 0.5;
    } else if (field.includes('data science') || field.includes('economics')) {
      score += 0.45;
    } else if (field.includes('science') || field.includes('engineering')) {
      score += 0.35;
    } else if (field.includes('finance') || field.includes('accounting')) {
      score += 0.3;
    }
  }
  
  // Current role contribution - Enhanced
  if (userData.currentRole) {
    const role = userData.currentRole.toLowerCase();
    if (role.includes('analyst') || role.includes('researcher')) {
      score += 0.4;
    } else if (role.includes('scientist') || role.includes('statistician')) {
      score += 0.45;
    } else if (role.includes('consultant') || role.includes('advisor')) {
      score += 0.25;
    }
  }
  
  // Tools contribution - Enhanced
  if (userData.toolsUsed && userData.toolsUsed.length > 0) {
    const analyticalTools = [
      'Excel', 'Tableau', 'R', 'SQL', 'Python', 'Power BI', 'SPSS',
      'SAS', 'Pandas', 'NumPy', 'Jupyter', 'Stata'
    ];
    const userAnalyticalTools = userData.toolsUsed.filter(tool => 
      analyticalTools.some(analyticTool => tool.toLowerCase().includes(analyticTool.toLowerCase()))
    );
    score += Math.min(userAnalyticalTools.length * 0.1, 0.3);
  }
  
  return Math.min(score, 1.0);
};

const calculateCommunicationSkills = (userData) => {
  let score = 0;
  
  // Study field contribution
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('communications') || field.includes('journalism')) {
      score += 0.5;
    } else if (field.includes('english') || field.includes('marketing')) {
      score += 0.4;
    } else if (field.includes('psychology') || field.includes('business')) {
      score += 0.25;
    }
  }
  
  // Transferable skills contribution - Enhanced
  if (userData.transferableSkills) {
    const skills = userData.transferableSkills.toLowerCase();
    if (skills.includes('communication') || skills.includes('presentation')) {
      score += 0.4;
    }
    if (skills.includes('writing') || skills.includes('speaking')) {
      score += 0.3;
    }
    if (skills.includes('teaching') || skills.includes('training')) {
      score += 0.25;
    }
  }
  
  // Current role contribution - Enhanced
  if (userData.currentRole) {
    const role = userData.currentRole.toLowerCase();
    if (role.includes('teacher') || role.includes('trainer')) {
      score += 0.4;
    } else if (role.includes('sales') || role.includes('marketing')) {
      score += 0.35;
    } else if (role.includes('manager') || role.includes('coordinator')) {
      score += 0.25;
    } else if (role.includes('writer') || role.includes('content')) {
      score += 0.3;
    }
  }
  
  return Math.min(score, 1.0);
};

const calculateLeadershipPotential = (userData) => {
  let score = 0;
  
  // Transferable skills contribution - Enhanced
  if (userData.transferableSkills) {
    const skills = userData.transferableSkills.toLowerCase();
    if (skills.includes('leadership') || skills.includes('team lead')) {
      score += 0.5;
    }
    if (skills.includes('management') || skills.includes('supervision')) {
      score += 0.4;
    }
    if (skills.includes('mentoring') || skills.includes('coaching')) {
      score += 0.25;
    }
  }
  
  // Current role contribution - Enhanced
  if (userData.currentRole) {
    const role = userData.currentRole.toLowerCase();
    if (role.includes('manager') || role.includes('director')) {
      score += 0.5;
    } else if (role.includes('lead') || role.includes('supervisor')) {
      score += 0.4;
    } else if (role.includes('coordinator') || role.includes('team')) {
      score += 0.25;
    }
  }
  
  // Study field contribution
  if (userData.studyField) {
    const field = userData.studyField.toLowerCase();
    if (field.includes('business') || field.includes('management') || field.includes('mba')) {
      score += 0.3;
    }
  }
  
  return Math.min(score, 1.0);
};

// Enhanced Encoding functions
const encodeStudyField = (studyField) => {
  if (!studyField || studyField === 'Not specified') return 0;
  const fieldMap = {
    'computer science': 0.95,
    'software engineering': 0.9,
    'data science': 0.9,
    'information technology': 0.85,
    'engineering': 0.8,
    'mathematics': 0.85,
    'statistics': 0.85,
    'business administration': 0.7,
    'business': 0.65,
    'mba': 0.75,
    'design': 0.7,
    'economics': 0.7,
    'finance': 0.65,
    'science': 0.7,
    'psychology': 0.6,
    'marketing': 0.6,
    'communications': 0.55
  };
  
  const field = studyField.toLowerCase();
  for (const [key, value] of Object.entries(fieldMap)) {
    if (field.includes(key)) return value;
  }
  return 0.5;
};

const encodeCurrentRole = (currentRole) => {
  if (!currentRole || currentRole === 'Not specified') return 0;
  const roleMap = {
    'software engineer': 0.95,
    'developer': 0.9,
    'data scientist': 0.9,
    'product manager': 0.85,
    'manager': 0.8,
    'analyst': 0.75,
    'designer': 0.8,
    'engineer': 0.8,
    'consultant': 0.75,
    'researcher': 0.7,
    'coordinator': 0.65,
    'specialist': 0.7
  };
  
  const role = currentRole.toLowerCase();
  for (const [key, value] of Object.entries(roleMap)) {
    if (role.includes(key)) return value;
  }
  return 0.5;
};

const encodeExperienceLevel = (level) => {
  const levelMap = {
    'Complete beginner': 0.1,
    'Some exposure': 0.3,
    'Beginner': 0.5,
    'Intermediate': 0.7,
    'Advanced': 0.9
  };
  return levelMap[level] || 0.5;
};

const parseYearsExperience = (years) => {
  if (!years || years === 'Not specified') return 0;
  const match = years.match(/\d+/);
  return match ? Math.min(parseInt(match[0]) / 20, 1.0) : 0;
};

const parseTimeCommitment = (commitment) => {
  if (!commitment) return 0.5;
  if (commitment.includes('40+') || commitment.includes('full')) return 1.0;
  if (commitment.includes('20-40')) return 0.7;
  if (commitment.includes('10-20')) return 0.5;
  return 0.3;
};

/**
 * SIMILAR PROFILES ANALYSIS
 */
const findSimilarProfiles = (userFeatures) => {
  // Enhanced synthetic user database
  const userDatabase = generateEnhancedSyntheticUserDatabase();
  
  const similarities = userDatabase.map(profile => ({
    profile,
    similarity: calculateCosineSimilarity(userFeatures, profile.features),
    careerOutcomes: profile.careerOutcomes
  }));
  
  const topSimilar = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 8);
  
  // Extract career recommendations from similar users
  const recommendations = [];
  topSimilar.forEach(similar => {
    similar.careerOutcomes.forEach(outcome => {
      if (outcome.success && outcome.career) {
        const existing = recommendations.find(r => r.title === outcome.career);
        if (existing) {
          existing.confidence = Math.min(existing.confidence + 0.1, 0.95);
          existing.sourceProfiles.push(similar.profile.id);
        } else {
          recommendations.push({
            title: outcome.career,
            confidence: similar.similarity,
            reason: `Based on similar professionals with ${Math.round(similar.similarity * 100)}% profile match`,
            sourceProfiles: [similar.profile.id],
            avgTransitionTime: outcome.timeToTransition
          });
        }
      }
    });
  });
  
  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
};

/**
 * ENHANCED CAREER TRANSITION PATTERNS
 */
const analyzeTransitionPatterns = (userFeatures) => {
  const patterns = {
    'business_to_tech': {
      match: userFeatures.businessAcumen > 0.6 && userFeatures.technicalAptitude < 0.5,
      careers: ['Product Manager', 'Business Analyst', 'Data Analyst', 'Technical Project Manager'],
      successRate: 0.78,
      timeFrame: '8-12 months'
    },
    'design_to_tech': {
      match: userFeatures.creativityScore > 0.6,
      careers: ['UX Designer', 'Product Designer', 'Frontend Developer', 'UI Designer'],
      successRate: 0.82,
      timeFrame: '6-10 months'
    },
    'stem_to_tech': {
      match: userFeatures.technicalAptitude > 0.6 || userFeatures.analyticalThinking > 0.7,
      careers: ['Data Scientist', 'Software Developer', 'ML Engineer', 'Data Engineer'],
      successRate: 0.85,
      timeFrame: '4-8 months'
    },
    'analytics_to_tech': {
      match: userFeatures.analyticalThinking > 0.7 && userFeatures.technicalAptitude < 0.6,
      careers: ['Data Analyst', 'Business Intelligence Analyst', 'Data Scientist', 'Business Analyst'],
      successRate: 0.80,
      timeFrame: '6-10 months'
    },
    'management_to_tech': {
      match: userFeatures.leadershipPotential > 0.6 && userFeatures.communicationSkills > 0.6,
      careers: ['Product Manager', 'Technical Project Manager', 'Engineering Manager', 'Product Owner'],
      successRate: 0.75,
      timeFrame: '8-14 months'
    },
    'non_tech_to_tech': {
      match: userFeatures.communicationSkills > 0.6 && userFeatures.technicalAptitude < 0.4,
      careers: ['Technical Writer', 'Developer Advocate', 'QA Engineer', 'Customer Success'],
      successRate: 0.71,
      timeFrame: '6-12 months'
    }
  };
  
  // Find best matching pattern
  let bestPattern = 'non_tech_to_tech';
  let bestScore = 0;
  
  Object.entries(patterns).forEach(([pattern, data]) => {
    if (data.match) {
      const score = calculatePatternScore(userFeatures, pattern);
      if (score > bestScore) {
        bestScore = score;
        bestPattern = pattern;
      }
    }
  });
  
  return {
    pattern: bestPattern,
    recommendations: patterns[bestPattern],
    confidence: bestScore
  };
};

const calculatePatternScore = (features, pattern) => {
  const scores = {
    'business_to_tech': features.businessAcumen * 0.6 + features.communicationSkills * 0.4,
    'design_to_tech': features.creativityScore * 0.7 + features.technicalAptitude * 0.3,
    'stem_to_tech': features.technicalAptitude * 0.5 + features.analyticalThinking * 0.5,
    'analytics_to_tech': features.analyticalThinking * 0.6 + features.technicalAptitude * 0.4,
    'management_to_tech': features.leadershipPotential * 0.5 + features.communicationSkills * 0.5,
    'non_tech_to_tech': features.communicationSkills * 0.6 + features.leadershipPotential * 0.4
  };
  return scores[pattern] || 0;
};

/**
 * ENHANCED CLUSTERING-BASED RECOMMENDATIONS
 */
const getClusterBasedRecommendations = (userFeatures) => {
  const careerClusters = {
    'data_analytics': {
      careers: ['Data Analyst', 'Data Scientist', 'Business Intelligence Analyst', 'Data Engineer'],
      centerFeatures: { 
        technicalAptitude: 0.8, 
        analyticalThinking: 0.9, 
        businessAcumen: 0.6,
        communicationSkills: 0.5 
      }
    },
    'software_development': {
      careers: ['Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer'],
      centerFeatures: { 
        technicalAptitude: 0.9, 
        analyticalThinking: 0.7, 
        creativityScore: 0.6,
        communicationSkills: 0.4
      }
    },
    'product_strategy': {
      careers: ['Product Manager', 'Product Owner', 'Business Analyst', 'Technical Project Manager'],
      centerFeatures: { 
        businessAcumen: 0.9, 
        communicationSkills: 0.8, 
        leadershipPotential: 0.7,
        technicalAptitude: 0.5
      }
    },
    'design_ux': {
      careers: ['UX Designer', 'UI Designer', 'Product Designer', 'Digital Designer'],
      centerFeatures: { 
        creativityScore: 0.9, 
        communicationSkills: 0.7, 
        technicalAptitude: 0.5,
        analyticalThinking: 0.6
      }
    },
    'ai_ml': {
      careers: ['ML Engineer', 'AI Engineer', 'Data Scientist', 'Research Scientist'],
      centerFeatures: {
        technicalAptitude: 0.9,
        analyticalThinking: 0.85,
        creativityScore: 0.6,
        businessAcumen: 0.4
      }
    },
    'infrastructure_ops': {
      careers: ['DevOps Engineer', 'Cloud Engineer', 'Systems Engineer', 'Site Reliability Engineer'],
      centerFeatures: {
        technicalAptitude: 0.85,
        analyticalThinking: 0.7,
        communicationSkills: 0.5,
        leadershipPotential: 0.6
      }
    }
  };
  
  const clusterDistances = Object.entries(careerClusters).map(([clusterName, cluster]) => ({
    cluster: clusterName,
    distance: calculateEuclideanDistance(userFeatures, cluster.centerFeatures),
    careers: cluster.careers
  }));
  
  return clusterDistances.sort((a, b) => a.distance - b.distance);
};

/**
 * ENHANCED SUCCESS PROBABILITY CALCULATION
 */
const calculateSuccessProbabilities = (userFeatures) => {
  const careerWeights = {
    'Data Scientist': {
      technicalAptitude: 0.25,
      analyticalThinking: 0.35,
      businessAcumen: 0.2,
      communicationSkills: 0.15,
      creativityScore: 0.05
    },
    'Product Manager': {
      businessAcumen: 0.3,
      communicationSkills: 0.25,
      leadershipPotential: 0.2,
      technicalAptitude: 0.15,
      analyticalThinking: 0.1
    },
    'UX Designer': {
      creativityScore: 0.35,
      communicationSkills: 0.25,
      technicalAptitude: 0.2,
      analyticalThinking: 0.15,
      businessAcumen: 0.05
    },
    'Software Developer': {
      technicalAptitude: 0.45,
      analyticalThinking: 0.3,
      creativityScore: 0.15,
      communicationSkills: 0.05,
      businessAcumen: 0.05
    },
    'Data Analyst': {
      analyticalThinking: 0.4,
      technicalAptitude: 0.25,
      businessAcumen: 0.2,
      communicationSkills: 0.15,
      creativityScore: 0.0
    },
    'DevOps Engineer': {
      technicalAptitude: 0.4,
      analyticalThinking: 0.25,
      communicationSkills: 0.15,
      leadershipPotential: 0.15,
      businessAcumen: 0.05
    },
    'Business Analyst': {
      businessAcumen: 0.35,
      analyticalThinking: 0.25,
      communicationSkills: 0.25,
      technicalAptitude: 0.1,
      leadershipPotential: 0.05
    },
    'ML Engineer': {
      technicalAptitude: 0.35,
      analyticalThinking: 0.35,
      creativityScore: 0.15,
      communicationSkills: 0.1,
      businessAcumen: 0.05
    }
  };
  
  const probabilities = {};
  
  Object.entries(careerWeights).forEach(([career, weights]) => {
    let score = 0;
    Object.entries(weights).forEach(([feature, weight]) => {
      const featureValue = userFeatures[feature] || 0;
      score += featureValue * weight;
    });
    
    // Apply sigmoid function for more realistic probabilities
    probabilities[career] = 1 / (1 + Math.exp(-score * 6 + 3));
  });
  
  return probabilities;
};

/**
 * COMBINE RULE-BASED AND ML RECOMMENDATIONS
 */
const combineRecommendations = (ruleBasedResults, mlResults, userData) => {
  console.log('🔄 Combining rule-based and ML recommendations...');
  
  const hybridRecommendations = {
    primary: ruleBasedResults.recommendations.primary,
    inferred: ruleBasedResults.recommendations.inferred,
    adjacent: ruleBasedResults.recommendations.adjacent,
    mlDiscovered: []
  };
  
  // Add ML-discovered recommendations
  const mlDiscovered = discoverMLRecommendations(mlResults, ruleBasedResults.allRecommendations);
  hybridRecommendations.mlDiscovered = mlDiscovered;
  
  // Re-rank all recommendations using ensemble scoring
  const allRecommendations = [
    ...hybridRecommendations.primary,
    ...hybridRecommendations.inferred,
    ...hybridRecommendations.adjacent,
    ...hybridRecommendations.mlDiscovered
  ];
  
  const weights = { ruleBased: 0.6, mlSimilarity: 0.15, mlClustering: 0.15, mlSuccess: 0.1 };
  
  const rerankedRecommendations = allRecommendations.map(recommendation => {
    const hybridScore = calculateHybridScore(recommendation, mlResults, weights);
    return {
      ...recommendation,
      hybridScore: hybridScore,
      mlConfidence: getMLConfidence(recommendation.title, mlResults)
    };
  });
  
  // Sort by hybrid score
  rerankedRecommendations.sort((a, b) => b.hybridScore - a.hybridScore);
  
  return {
    recommendations: hybridRecommendations,
    allRecommendations: rerankedRecommendations,
    mlInsights: generateMLInsights(mlResults, userData),
    explanations: generateHybridExplanations(rerankedRecommendations, mlResults)
  };
};

/**
 * DISCOVER ML RECOMMENDATIONS
 */
const discoverMLRecommendations = (mlResults, existingRecommendations) => {
  const existingTitles = existingRecommendations.map(rec => rec.title);
  const mlRecommendations = [];
  
  // From similar profiles
  mlResults.similarProfiles.forEach(rec => {
    if (!existingTitles.includes(rec.title) && rec.confidence > 0.65) {
      mlRecommendations.push({
        title: rec.title,
        match: Math.round(rec.confidence * 100),
        originalScore: Math.round(rec.confidence * 100),
        reasoning: rec.reason,
        recommendationType: 'ml_similarity',
        badge: 'ML Discovery',
        badgeColor: 'orange',
        mlConfidence: rec.confidence,
        sourceProfiles: rec.sourceProfiles
      });
    }
  });
  
  // From clustering
  mlResults.clusterRecommendations.slice(0, 2).forEach(cluster => {
    cluster.careers.forEach(career => {
      if (!existingTitles.includes(career) && !mlRecommendations.some(r => r.title === career)) {
        const confidence = Math.max(0, 1 - cluster.distance);
        
        if (confidence > 0.6) {
          mlRecommendations.push({
            title: career,
            match: Math.round(confidence * 100),
            originalScore: Math.round(confidence * 100),
            reasoning: `Identified through ${cluster.cluster.replace('_', ' ')} career cluster analysis`,
            recommendationType: 'ml_clustering',
            badge: 'Pattern Match',
            badgeColor: 'teal',
            mlConfidence: confidence,
            clusterName: cluster.cluster
          });
        }
      }
    });
  });
  
  return mlRecommendations.slice(0, 3);
};

/**
 * CALCULATE HYBRID SCORE
 */
const calculateHybridScore = (recommendation, mlResults, weights) => {
  const ruleScore = (recommendation.originalScore || recommendation.match) / 100;
  
  const similarityScore = getMLSimilarityScore(recommendation.title, mlResults);
  const clusteringScore = getMLClusteringScore(recommendation.title, mlResults);
  const successScore = mlResults.successScores[recommendation.title] || 0.5;
  
  const hybridScore = (
    ruleScore * weights.ruleBased +
    similarityScore * weights.mlSimilarity +
    clusteringScore * weights.mlClustering +
    successScore * weights.mlSuccess
  );
  
  return Math.round(hybridScore * 100);
};

/**
 * GENERATE ML INSIGHTS
 */
const generateMLInsights = (mlResults, userData) => {
  return {
    dominantPattern: mlResults.transitionPatterns.pattern,
    patternConfidence: mlResults.transitionPatterns.confidence,
    topCluster: mlResults.clusterRecommendations[0]?.cluster,
    successFactors: extractTopSuccessFactors(mlResults.userFeatures),
    similarProfileInsights: {
      count: 247, // Simulated
      avgTime: '7.2 months' // Simulated
    }
  };
};

// Enhanced Helper functions
const calculateCosineSimilarity = (features1, features2) => {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  const allKeys = new Set([...Object.keys(features1), ...Object.keys(features2)]);
  
  allKeys.forEach(key => {
    const val1 = features1[key] || 0;
    const val2 = features2[key] || 0;
    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  });
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

const calculateEuclideanDistance = (features1, features2) => {
  let sum = 0;
  const allKeys = new Set([...Object.keys(features1), ...Object.keys(features2)]);
  
  allKeys.forEach(key => {
    const val1 = features1[key] || 0;
    const val2 = features2[key] || 0;
    sum += Math.pow(val1 - val2, 2);
  });
  
  return Math.sqrt(sum);
};

const getMLSimilarityScore = (careerTitle, mlResults) => {
  const match = mlResults.similarProfiles.find(p => p.title === careerTitle);
  return match ? match.confidence : 0.5;
};

const getMLClusteringScore = (careerTitle, mlResults) => {
  for (const cluster of mlResults.clusterRecommendations) {
    if (cluster.careers.includes(careerTitle)) {
      return Math.max(0, 1 - cluster.distance);
    }
  }
  return 0.5;
};

const getMLConfidence = (careerTitle, mlResults) => {
  const similarityScore = getMLSimilarityScore(careerTitle, mlResults);
  const clusteringScore = getMLClusteringScore(careerTitle, mlResults);
  const successScore = mlResults.successScores[careerTitle] || 0.5;
  
  return (similarityScore + clusteringScore + successScore) / 3;
};

const extractTopSuccessFactors = (userFeatures) => {
  const factors = Object.entries(userFeatures)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase());
  
  return factors;
};

const generateHybridExplanations = (recommendations, mlResults) => {
  return recommendations.map(rec => ({
    title: rec.title,
    explanation: `${rec.reasoning} (Hybrid Score: ${rec.hybridScore}%)`
  }));
};

// Enhanced synthetic data for demonstration
const generateEnhancedSyntheticUserDatabase = () => {
  return [
    {
      id: 1,
      features: { 
        technicalAptitude: 0.7, 
        businessAcumen: 0.8, 
        communicationSkills: 0.9,
        analyticalThinking: 0.6,
        creativityScore: 0.4,
        leadershipPotential: 0.7
      },
      careerOutcomes: [
        { career: 'Product Manager', success: true, timeToTransition: 9 },
        { career: 'Business Analyst', success: true, timeToTransition: 6 }
      ]
    },
    {
      id: 2,
      features: { 
        technicalAptitude: 0.9, 
        analyticalThinking: 0.8, 
        creativityScore: 0.6,
        businessAcumen: 0.5,
        communicationSkills: 0.6,
        leadershipPotential: 0.4
      },
      careerOutcomes: [
        { career: 'Data Scientist', success: true, timeToTransition: 8 },
        { career: 'Software Developer', success: true, timeToTransition: 7 }
      ]
    },
    {
      id: 3,
      features: { 
        creativityScore: 0.9, 
        communicationSkills: 0.8, 
        technicalAptitude: 0.6,
        analyticalThinking: 0.5,
        businessAcumen: 0.6,
        leadershipPotential: 0.5
      },
      careerOutcomes: [
        { career: 'UX Designer', success: true, timeToTransition: 6 },
        { career: 'Product Designer', success: true, timeToTransition: 8 }
      ]
    },
    {
      id: 4,
      features: {
        technicalAptitude: 0.85,
        analyticalThinking: 0.9,
        creativityScore: 0.3,
        businessAcumen: 0.4,
        communicationSkills: 0.5,
        leadershipPotential: 0.3
      },
      careerOutcomes: [
        { career: 'ML Engineer', success: true, timeToTransition: 10 },
        { career: 'Data Engineer', success: true, timeToTransition: 7 }
      ]
    },
    {
      id: 5,
      features: {
        technicalAptitude: 0.8,
        analyticalThinking: 0.6,
        creativityScore: 0.4,
        businessAcumen: 0.3,
        communicationSkills: 0.6,
        leadershipPotential: 0.7
      },
      careerOutcomes: [
        { career: 'DevOps Engineer', success: true, timeToTransition: 8 },
        { career: 'Cloud Engineer', success: true, timeToTransition: 9 }
      ]
    },
    {
      id: 6,
      features: {
        technicalAptitude: 0.4,
        analyticalThinking: 0.8,
        creativityScore: 0.2,
        businessAcumen: 0.9,
        communicationSkills: 0.8,
        leadershipPotential: 0.6
      },
      careerOutcomes: [
        { career: 'Business Analyst', success: true, timeToTransition: 5 },
        { career: 'Data Analyst', success: true, timeToTransition: 7 }
      ]
    }
  ];
};
