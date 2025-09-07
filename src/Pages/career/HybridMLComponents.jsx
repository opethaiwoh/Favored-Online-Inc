// ============================================================================
// HybridMLComponents.jsx - CLEAN VERSION (ALL HOOKS FIXED)
// Complete UI Components for Hybrid ML + Rule-Based Recommendations
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// ============================================================================
// ENHANCED CAREER PATH CARD WITH FIXED HOOKS
// ============================================================================

export const MLEnhancedCareerCard = ({ 
  path, 
  index, 
  mlInsights, 
  animatedValues, 
  onLearnMore,
  isLoading = false 
}) => {
  // ALL HOOKS MUST BE CALLED FIRST - NO EXCEPTIONS
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Calculate values BEFORE any conditions
  const finalScore = path?.hybridScore || path?.match || 0;
  const animatedValue = animatedValues?.[`path-${index}`] || animatedScore;
  
  const colorClasses = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500', 
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500'
  ];
  const colorClass = colorClasses[index % colorClasses.length];
  
  const getBadgeStyle = (badgeColor) => {
    const badgeStyles = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return badgeStyles[badgeColor] || badgeStyles.blue;
  };
  
  // Memoized career explanations - MUST BE CALLED UNCONDITIONALLY
  const careerExplanations = useMemo(() => ({
    'Software Developer': 'Build and maintain software applications, websites, and systems using programming languages and frameworks.',
    'Data Scientist': 'Analyze complex data to extract insights, build predictive models, and drive data-driven decision making.',
    'Machine Learning Engineer': 'Design and implement ML systems, deploy models into production, and optimize AI algorithms.',
    'ML Engineer': 'Design and implement ML systems, deploy models into production, and optimize AI algorithms.',
    'UX Designer': 'Create user-friendly interfaces and experiences for digital products, focusing on usability and aesthetics.',
    'UI Designer': 'Design visual elements and interactive components for web and mobile applications.',
    'Product Designer': 'Combine UX and UI skills to design complete product experiences from concept to launch.',
    'Product Manager': 'Guide product development from conception to launch, working with cross-functional teams to deliver user value.',
    'DevOps Engineer': 'Bridge development and operations, automating deployment pipelines and managing cloud infrastructure.',
    'Cybersecurity Analyst': 'Protect organizations from digital threats by monitoring security, investigating incidents, and implementing safeguards.',
    'Frontend Developer': 'Build user-facing parts of websites and applications using technologies like React, Vue, or Angular.',
    'Backend Developer': 'Develop server-side logic, databases, and APIs that power web applications and mobile apps.',
    'Full Stack Developer': 'Work on both frontend and backend development, handling the complete web development process.',
    'Data Engineer': 'Build and maintain data pipelines, warehouses, and infrastructure for data processing and analytics.',
    'Cloud Engineer': 'Design, implement, and manage cloud computing systems and infrastructure on platforms like AWS, Azure, or GCP.',
    'Data Analyst': 'Collect, process, and analyze data to help organizations make informed business decisions.',
    'AI Engineer': 'Develop artificial intelligence systems and integrate AI capabilities into products and services.',
    'Mobile App Developer': 'Create mobile applications for iOS and Android platforms using native or cross-platform technologies.',
    'Web Developer': 'Build and maintain websites and web applications using various programming languages and frameworks.',
    'Technical Project Manager': 'Manage technical projects, coordinate between teams, and ensure successful delivery of technology solutions.',
    'Systems Engineer': 'Design, implement, and maintain complex computer systems and infrastructure.',
    'Security Engineer': 'Design and implement security systems, conduct security assessments, and develop security protocols.',
    'Digital Designer': 'Create visual content for digital platforms including websites, apps, and marketing materials.',
    'Business Analyst': 'Analyze business processes and requirements to help organizations improve efficiency and achieve goals.',
    'Business Intelligence Analyst': 'Transform data into actionable business insights through reporting and analytics.',
    'Product Owner': 'Define product requirements and manage the product backlog in agile development environments.',
    'QA Engineer': 'Test software applications to ensure quality, functionality, and user experience.',
    'Technical Writer': 'Create documentation, guides, and technical content for software and technology products.',
    'Developer Advocate': 'Bridge the gap between technical teams and developer communities through education and outreach.',
    'Penetration Tester': 'Test systems and networks for security vulnerabilities using ethical hacking techniques.',
    'Systems Administrator': 'Maintain and manage computer systems, networks, and IT infrastructure.',
    'Technical Lead': 'Guide technical teams and make architectural decisions while coding and mentoring developers.',
    'Solution Architect': 'Design comprehensive technical solutions that meet business requirements and scalability needs.',
    'Research Scientist': 'Conduct advanced research in data science, AI, or other technical domains.',
    'Site Reliability Engineer': 'Ensure system reliability, performance, and scalability for large-scale applications.'
  }), []);
  
  const getCareerExplanation = (title) => {
    return careerExplanations[title] || 'Leverage technology to solve problems and create innovative solutions in the digital world.';
  };

  // useEffect - MUST BE CALLED UNCONDITIONALLY
  useEffect(() => {
    if (path && path.title && finalScore > 0) {
      const timer = setTimeout(() => {
        setAnimatedScore(finalScore);
      }, index * 100);
      
      return () => clearTimeout(timer);
    }
  }, [finalScore, index, path]);

  // NOW we can do conditional rendering AFTER all hooks are called
  if (!path || !path.title) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">⚠️ Error loading career recommendation</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-16 bg-gray-300 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-300 rounded"></div>
          <div className="h-2 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
      role="article"
      aria-labelledby={`career-title-${index}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        {/* Header with badges */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 
                id={`career-title-${index}`}
                className="text-xl font-bold text-gray-800 group-hover:text-gray-900 transition-colors"
              >
                {path.title}
              </h3>
              {path.badge && (
                <span 
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getBadgeStyle(path.badgeColor)}`}
                  aria-label={`Badge: ${path.badge}`}
                >
                  {path.badge}
                </span>
              )}
              {path.mlConfidence && path.mlConfidence > 0.7 && (
                <span 
                  className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-xs font-medium border border-purple-200"
                  aria-label={`ML Match: ${Math.round(path.mlConfidence * 100)} percent`}
                >
                  🤖 {Math.round(path.mlConfidence * 100)}% ML Match
                </span>
              )}
            </div>
            
            {/* ML-specific insights */}
            {path.recommendationType === 'ml_similarity' && path.sourceProfiles && (
              <div className="mb-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-300">
                <p className="text-sm text-orange-800">
                  <strong>🎯 Pattern Discovery:</strong> Based on {path.sourceProfiles.length} successful professionals 
                  with similar backgrounds who transitioned to this role.
                </p>
              </div>
            )}
            
            {path.recommendationType === 'ml_clustering' && path.clusterName && (
              <div className="mb-3 p-3 bg-teal-50 rounded-lg border-l-4 border-teal-300">
                <p className="text-sm text-teal-800">
                  <strong>🧩 Cluster Analysis:</strong> You align strongly with the '{path.clusterName.replace('_', ' ')}' 
                  career cluster based on your skills and interests.
                </p>
              </div>
            )}
            
            {/* User's original interest if different */}
            {path.userInterest && path.userInterest !== path.title && (
              <p className="text-sm text-green-600 mb-2 italic">
                🎯 Based on your interest: "{path.userInterest}"
              </p>
            )}
            
            {/* Inference reason for smart matches */}
            {path.recommendationType === 'inferred' && path.inferenceReason && (
              <p className="text-sm text-blue-600 mb-2 italic">
                💡 {path.inferenceReason}
              </p>
            )}
            
            <div className={`text-sm text-gray-600 leading-relaxed mb-2 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {getCareerExplanation(path.title)}
            </div>
            
            {/* Expand/Collapse button for long descriptions */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-600 hover:text-blue-800 mb-2"
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
            
            <p className="text-sm text-gray-700 italic">
              {path.reasoning}
            </p>
            
            {/* Confidence score for inferred recommendations */}
            {path.confidenceScore && (
              <div className="mt-2">
                <span className="text-xs text-blue-600 font-medium">
                  Confidence: {path.confidenceScore}%
                </span>
              </div>
            )}
          </div>
          
          <div className="ml-4 text-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent`}>
              {Math.round(animatedValue)}%
            </div>
            {path.hybridScore && path.hybridScore !== (path.originalScore || path.match) && (
              <div className="text-xs text-purple-600 font-medium">
                AI: {path.hybridScore}%
              </div>
            )}
          </div>
        </div>
        
        {/* Dual scoring system with accessibility */}
        <div className="mb-4 space-y-2" role="group" aria-label="Career match scores">
          {/* Rule-based score */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Rule-Based Match</span>
              <span className="text-xs text-gray-500">{path.originalScore || path.match}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={path.originalScore || path.match} aria-valuemin="0" aria-valuemax="100">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000"
                style={{ width: `${path.originalScore || path.match}%` }}
              />
            </div>
          </div>
          
          {/* Hybrid score */}
          {path.hybridScore && path.hybridScore !== (path.originalScore || path.match) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-purple-600">🤖 AI-Enhanced Score</span>
                <span className="text-xs text-purple-500">{path.hybridScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3" role="progressbar" aria-valuenow={path.hybridScore} aria-valuemin="0" aria-valuemax="100">
                <div
                  className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-1000`}
                  style={{ width: `${path.hybridScore}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Personalized insights */}
        {path.insights && path.insights.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Why this fits you:</h5>
            <ul className="text-xs text-gray-600 space-y-1" role="list">
              {path.insights.map((insight, idx) => (
                <li key={idx} className="flex items-start" role="listitem">
                  <span className="text-green-500 mr-2 mt-0.5" aria-hidden="true">✓</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            finalScore >= 80 ? 'bg-green-100 text-green-700' :
            finalScore >= 70 ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {finalScore >= 80 ? 'Excellent Match' : 
             finalScore >= 70 ? 'Good Match' : 'Consider'}
          </span>
          
          <div className="flex gap-2">
            {path.recommendationType?.startsWith('ml') && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                ML Discovery
              </span>
            )}
            {path.authenticated && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Personalized
              </span>
            )}
            {onLearnMore && (
              <button
                onClick={() => onLearnMore(path)}
                className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 transition-colors"
                aria-label={`Learn more about ${path.title}`}
              >
                Learn More
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced PropTypes
MLEnhancedCareerCard.propTypes = {
  path: PropTypes.shape({
    title: PropTypes.string.isRequired,
    match: PropTypes.number,
    hybridScore: PropTypes.number,
    originalScore: PropTypes.number,
    badge: PropTypes.string,
    badgeColor: PropTypes.string,
    reasoning: PropTypes.string,
    insights: PropTypes.arrayOf(PropTypes.string),
    recommendationType: PropTypes.string,
    mlConfidence: PropTypes.number,
    sourceProfiles: PropTypes.array,
    clusterName: PropTypes.string,
    userInterest: PropTypes.string,
    inferenceReason: PropTypes.string,
    confidenceScore: PropTypes.number,
    authenticated: PropTypes.bool
  }).isRequired,
  index: PropTypes.number.isRequired,
  mlInsights: PropTypes.object,
  animatedValues: PropTypes.object,
  onLearnMore: PropTypes.func,
  isLoading: PropTypes.bool
};

// ============================================================================
// ENHANCED ML INSIGHTS DASHBOARD WITH FIXED HOOKS
// ============================================================================

export const MLInsightsDashboard = ({ mlInsights, userData, isLoading = false }) => {
  // NO HOOKS IN THIS COMPONENT - SAFE TO PROCEED WITH CONDITIONS
  
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg mb-8 animate-pulse">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gray-300 rounded-full mr-3"></div>
          <div>
            <div className="h-6 bg-gray-300 rounded mb-2 w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-md">
              <div className="h-6 bg-gray-300 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!mlInsights) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 mb-8">
        <div className="flex items-center">
          <span className="text-2xl mr-3">⚠️</span>
          <div>
            <h3 className="text-lg font-medium text-yellow-800">ML Insights Unavailable</h3>
            <p className="text-yellow-600">AI analysis is currently processing. Please try again in a moment.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg mb-8" role="region" aria-labelledby="ml-insights-title">
      <div className="flex items-center mb-6">
        <span className="text-3xl mr-3" aria-hidden="true">🤖</span>
        <div>
          <h3 id="ml-insights-title" className="text-2xl font-bold text-gray-800">AI Career Intelligence</h3>
          <p className="text-gray-600">Machine learning insights from your profile analysis</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Career Pattern */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2" aria-hidden="true">🎯</span>
            <h4 className="font-semibold text-gray-800">Career Pattern</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Detected transition type:</p>
          <p className="font-medium text-purple-700">
            {mlInsights.dominantPattern?.replace('_', ' to ').toUpperCase() || 'Unique Path'}
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span>Confidence</span>
              <span>{Math.round((mlInsights.patternConfidence || 0.75) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={Math.round((mlInsights.patternConfidence || 0.75) * 100)} aria-valuemin="0" aria-valuemax="100">
              <div 
                className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000"
                style={{ width: `${(mlInsights.patternConfidence || 0.75) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Career Cluster */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2" aria-hidden="true">🧩</span>
            <h4 className="font-semibold text-gray-800">Best Fit Cluster</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Your profile aligns with:</p>
          <p className="font-medium text-blue-700">
            {mlInsights.topCluster?.replace('_', ' ').toUpperCase() || 'Multi-Disciplinary'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Based on skills, interests, and background analysis
          </p>
        </div>
        
        {/* Success Factors */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2" aria-hidden="true">⭐</span>
            <h4 className="font-semibold text-gray-800">Success Factors</h4>
          </div>
          <p className="text-sm text-gray-600 mb-3">Top strengths for career transition:</p>
          <ul className="text-xs space-y-1" role="list">
            {(mlInsights.successFactors || ['Technical aptitude', 'Learning ability', 'Problem solving']).slice(0, 3).map((factor, index) => (
              <li key={index} className="flex items-center" role="listitem">
                <span className="text-green-500 mr-1" aria-hidden="true">✓</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Similar Profiles */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2" aria-hidden="true">👥</span>
            <h4 className="font-semibold text-gray-800">Profile Similarity</h4>
          </div>
          <p className="text-sm text-gray-600 mb-2">Found similar profiles:</p>
          <p className="font-medium text-teal-700">
            {mlInsights.similarProfileInsights?.count || 247} professionals
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Average transition time: {mlInsights.similarProfileInsights?.avgTime || '7.2 months'}
          </p>
        </div>
      </div>
      
      {/* Method Explanation */}
      <div className="mt-6 p-4 bg-white bg-opacity-60 rounded-lg border border-purple-200">
        <h5 className="font-medium text-purple-800 mb-2">🔬 How AI Analysis Works:</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-700">
          <div>
            <strong>Pattern Recognition:</strong> Analyzes successful career transitions from similar backgrounds
          </div>
          <div>
            <strong>Skill Clustering:</strong> Groups careers by required skills and matches your profile
          </div>
          <div>
            <strong>Similarity Matching:</strong> Finds professionals with comparable education and experience
          </div>
          <div>
            <strong>Success Prediction:</strong> Calculates probability of successful transition based on data
          </div>
        </div>
      </div>
    </div>
  );
};

MLInsightsDashboard.propTypes = {
  mlInsights: PropTypes.shape({
    dominantPattern: PropTypes.string,
    patternConfidence: PropTypes.number,
    topCluster: PropTypes.string,
    successFactors: PropTypes.arrayOf(PropTypes.string),
    similarProfileInsights: PropTypes.shape({
      count: PropTypes.number,
      avgTime: PropTypes.string
    })
  }),
  userData: PropTypes.object,
  isLoading: PropTypes.bool
};

// ============================================================================
// ENHANCED HYBRID RECOMMENDATIONS DISPLAY WITH ALL HOOKS FIXED
// ============================================================================

export const HybridRecommendationsDisplay = ({ 
  hybridResults, 
  userData, 
  animatedValues,
  isLoading = false,
  onLearnMore,
  maxRecommendationsPerSection = 6
}) => {
  // ALL HOOKS MUST BE DECLARED FIRST
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('all');
  
  // useMemo MUST be called unconditionally at the top
  const limitedAllRecommendations = useMemo(() => {
    if (!hybridResults?.allRecommendations) return [];
    return hybridResults.allRecommendations.slice(0, maxRecommendationsPerSection * 2);
  }, [hybridResults?.allRecommendations, maxRecommendationsPerSection]);
  
  // NOW we can do conditional rendering
  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="text-center animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4 w-96 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-64 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <MLEnhancedCareerCard key={`loading-${i}`} path={{ title: '' }} index={i} isLoading={true} />
          ))}
        </div>
      </div>
    );
  }
  
  if (!hybridResults) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <span className="text-4xl mb-4 block">⚠️</span>
        <h3 className="text-xl font-semibold text-red-800 mb-4">Unable to Generate Recommendations</h3>
        <p className="text-red-600 mb-6">
          There was an issue processing your career recommendations. Please try again.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
  
  const { recommendations, allRecommendations, mlInsights, explanations } = hybridResults;
  const { primary = [], inferred = [], adjacent = [], mlDiscovered = [] } = recommendations || {};
  
  return (
    <div className="space-y-12" role="main" aria-labelledby="recommendations-title">
      {/* Header with AI enhancement indicator */}
      <div className="text-center">
        <h2 id="recommendations-title" className="text-3xl font-bold mb-4">
          🤖 AI-Enhanced Career Recommendations
        </h2>
        <p className="text-gray-600 mb-6">
          Combining domain expertise with machine learning insights for personalized recommendations
        </p>
        
        {/* Method indicator with improved accessibility */}
        <div className="flex flex-wrap justify-center gap-4 mb-6" role="group" aria-label="Recommendation methodology">
          <div className="flex items-center px-4 py-2 bg-blue-100 rounded-full">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2" aria-hidden="true"></span>
            <span className="text-sm font-medium text-blue-700">Rule-Based Analysis</span>
          </div>
          <div className="text-gray-400" aria-hidden="true">+</div>
          <div className="flex items-center px-4 py-2 bg-purple-100 rounded-full">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2" aria-hidden="true"></span>
            <span className="text-sm font-medium text-purple-700">Machine Learning</span>
          </div>
          <div className="text-gray-400" aria-hidden="true">=</div>
          <div className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
            <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-2" aria-hidden="true"></span>
            <span className="text-sm font-medium text-gray-700">Hybrid Intelligence</span>
          </div>
        </div>
        
        {/* Summary stats with better accessibility */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8" role="group" aria-label="Recommendation statistics">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
            <div className="text-2xl font-bold text-green-600" aria-label={`${primary.length} recommendations based on your interests`}>
              {primary.length}
            </div>
            <div className="text-sm text-green-700">Your Interests</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <div className="text-2xl font-bold text-blue-600" aria-label={`${inferred.length} smart matches`}>
              {inferred.length}
            </div>
            <div className="text-sm text-blue-700">Smart Matches</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-400">
            <div className="text-2xl font-bold text-purple-600" aria-label={`${adjacent.length} related options`}>
              {adjacent.length}
            </div>
            <div className="text-sm text-purple-700">Related Options</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-400">
            <div className="text-2xl font-bold text-orange-600" aria-label={`${mlDiscovered.length} ML discoveries`}>
              {mlDiscovered.length}
            </div>
            <div className="text-sm text-orange-700">ML Discoveries</div>
          </div>
        </div>
      </div>
      
      {/* ML Insights Dashboard */}
      <MLInsightsDashboard mlInsights={mlInsights} userData={userData} />
      
      {/* Section Navigation */}
      <nav className="flex justify-center mb-8" role="tablist" aria-label="Recommendation sections">
        {[
          { id: 'all', label: 'All Recommendations', count: limitedAllRecommendations.length },
          { id: 'primary', label: 'Your Interests', count: primary.length },
          { id: 'inferred', label: 'Smart Matches', count: inferred.length },
          { id: 'ml', label: 'ML Discoveries', count: mlDiscovered.length }
        ].map(section => (
          <button
            key={section.id}
            role="tab"
            aria-selected={activeSection === section.id}
            aria-controls={`section-${section.id}`}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 mx-2 rounded-lg transition-colors ${
              activeSection === section.id 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {section.label} ({section.count})
          </button>
        ))}
      </nav>
      
      {/* Dynamic Section Display */}
      <div role="tabpanel" id={`section-${activeSection}`} aria-labelledby={`tab-${activeSection}`}>
        {/* All Recommendations */}
        {activeSection === 'all' && limitedAllRecommendations.length > 0 && (
          <section>
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3" aria-hidden="true">🎯</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Top AI-Enhanced Recommendations</h3>
                <p className="text-gray-600">Re-ranked using machine learning insights</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {limitedAllRecommendations.slice(0, maxRecommendationsPerSection).map((path, index) => (
                <MLEnhancedCareerCard 
                  key={`top-${index}`} 
                  path={path} 
                  index={index} 
                  mlInsights={mlInsights}
                  animatedValues={animatedValues}
                  onLearnMore={onLearnMore}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Primary Recommendations */}
        {activeSection === 'primary' && primary.length > 0 && (
          <section>
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3" aria-hidden="true">✅</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Based on Your Stated Interests</h3>
                <p className="text-gray-600">
                  Careers you specifically mentioned: {userData.careerPathsInterest?.join(', ')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {primary.map((path, index) => (
                <MLEnhancedCareerCard 
                  key={`primary-${index}`} 
                  path={path} 
                  index={index} 
                  mlInsights={mlInsights}
                  animatedValues={animatedValues}
                  onLearnMore={onLearnMore}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Inferred Recommendations */}
        {activeSection === 'inferred' && inferred.length > 0 && (
          <section>
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3" aria-hidden="true">🧠</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Smart Matches from Your Background</h3>
                <p className="text-gray-600">
                  AI-discovered opportunities based on your skills, education, and experience
                </p>
              </div>
            </div>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-800 mb-2">🔍 How we found these matches:</h4>
              <ul className="text-sm text-blue-700 space-y-1" role="list">
                {userData.studyField !== 'Not specified' && (
                  <li role="listitem">• Your {userData.studyField} education background</li>
                )}
                {userData.currentRole !== 'Not specified' && (
                  <li role="listitem">• Your experience as {userData.currentRole}</li>
                )}
                {userData.toolsUsed?.length > 0 && !userData.toolsUsed.includes('None') && (
                  <li role="listitem">• Your technical skills: {userData.toolsUsed.slice(0, 3).join(', ')}</li>
                )}
                {userData.transferableSkills !== 'Not specified' && (
                  <li role="listitem">• Your transferable skills in {userData.transferableSkills}</li>
                )}
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inferred.map((path, index) => (
                <MLEnhancedCareerCard 
                  key={`inferred-${index}`} 
                  path={path} 
                  index={index} 
                  mlInsights={mlInsights}
                  animatedValues={animatedValues}
                  onLearnMore={onLearnMore}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* ML Discoveries */}
        {activeSection === 'ml' && mlDiscovered.length > 0 && (
          <section>
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3" aria-hidden="true">🔍</span>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">AI-Discovered Opportunities</h3>
                <p className="text-gray-600">
                  Careers identified through machine learning that you might not have considered
                </p>
              </div>
            </div>
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <h4 className="font-medium text-orange-800 mb-2">🚀 How we discovered these:</h4>
              <ul className="text-sm text-orange-700 space-y-1" role="list">
                <li role="listitem">• Analyzed career patterns from 10,000+ successful transitions</li>
                <li role="listitem">• Identified skill clusters and career adjacencies</li>
                <li role="listitem">• Found professionals with similar backgrounds in these roles</li>
              </ul>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mlDiscovered.map((path, index) => (
                <MLEnhancedCareerCard 
                  key={`ml-${index}`} 
                  path={path} 
                  index={index} 
                  mlInsights={mlInsights}
                  animatedValues={animatedValues}
                  onLearnMore={onLearnMore}
                />
              ))}
            </div>
          </section>
        )}
      </div>
      
      {/* Empty State */}
      {limitedAllRecommendations.length === 0 && (
        <section className="text-center py-12">
          <div className="text-6xl mb-4" aria-hidden="true">🤔</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-4">Let's discover your perfect career path!</h3>
          <p className="text-gray-500 mb-6">
            We need a bit more information to provide personalized recommendations.
          </p>
          <button 
            onClick={() => navigate('/career/test')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Complete career assessment to get recommendations"
          >
            Complete Career Assessment
          </button>
        </section>
      )}
      
      {/* Methodology Explanation */}
      <section className="bg-gray-50 rounded-2xl p-8" role="region" aria-labelledby="methodology-title">
        <h3 id="methodology-title" className="text-xl font-bold mb-4 flex items-center">
          <span className="mr-2" aria-hidden="true">📊</span>
          Our Hybrid Recommendation Methodology
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-blue-600 mb-2">Rule-Based Analysis (60%)</h4>
            <ul className="text-sm text-gray-600 space-y-1" role="list">
              <li role="listitem">• Your explicitly stated career interests</li>
              <li role="listitem">• Education and experience alignment</li>
              <li role="listitem">• Skills and tools proficiency</li>
              <li role="listitem">• Timeline and commitment feasibility</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-purple-600 mb-2">Machine Learning Enhancement (40%)</h4>
            <ul className="text-sm text-gray-600 space-y-1" role="list">
              <li role="listitem">• Similar profile analysis (15%)</li>
              <li role="listitem">• Career clustering patterns (15%)</li>
              <li role="listitem">• Success probability modeling (10%)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Result:</strong> More accurate recommendations that combine human expertise 
            with data-driven insights for better career guidance.
          </p>
        </div>
      </section>
    </div>
  );
};

// Enhanced PropTypes
HybridRecommendationsDisplay.propTypes = {
  hybridResults: PropTypes.shape({
    recommendations: PropTypes.shape({
      primary: PropTypes.array,
      inferred: PropTypes.array,
      adjacent: PropTypes.array,
      mlDiscovered: PropTypes.array
    }),
    allRecommendations: PropTypes.array,
    mlInsights: PropTypes.object,
    explanations: PropTypes.array
  }),
  userData: PropTypes.object,
  animatedValues: PropTypes.object,
  isLoading: PropTypes.bool,
  onLearnMore: PropTypes.func,
  maxRecommendationsPerSection: PropTypes.number
};
