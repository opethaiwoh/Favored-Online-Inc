// src/Pages/career/resources.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Video Analysis Data Integration
const videoAnalysisData = {
  project_info: {
    title: "Comprehensive Tech Career Video Analysis",
    description: "Analysis of 50+ tech career guidance videos",
    total_videos_analyzed: 54,
    processing_date: "2025-05-22"
  },
  detailed_video_analyses: {
    "tech_career_roadmap_2025": {
      title: "Complete Tech Career Roadmap 2025",
      url: "https://youtu.be/m-E6TeNjxj4",
      focus: "Career Planning and Skill Development",
      key_themes: ["Career Transition", "Skill Development", "Industry Trends", "Professional Growth"],
      comprehensive_summary: "Comprehensive guide covering modern tech career paths, essential skills, and strategic career planning for 2025.",
      actionable_insights: [
        "Start with foundational programming skills before specializing",
        "Build a portfolio showcasing real-world projects",
        "Network actively within your chosen tech domain",
        "Stay updated with industry trends and emerging technologies"
      ],
      target_audience: "Career changers and entry-level professionals"
    },
    "finding_tech_niche": {
      title: "Finding Your Perfect Tech Niche",
      url: "#",
      focus: "Career Specialization",
      key_themes: ["Self-Assessment", "Market Research", "Skill Alignment", "Career Focus"],
      comprehensive_summary: "Strategic approach to identifying and developing expertise in specific technology domains.",
      actionable_insights: [
        "Assess your natural strengths and interests",
        "Research market demand for different specializations",
        "Test different areas through projects and internships",
        "Focus on 1-2 areas for deep expertise development"
      ],
      target_audience: "Tech professionals seeking specialization"
    }
  },
  trending_skills: [
    {
      name: "Artificial Intelligence & Machine Learning",
      frequency: 45,
      importance_score: 95,
      category: "Emerging Tech",
      growth_trend: "Very High",
      related_roles: ["ML Engineer", "Data Scientist", "AI Researcher"]
    },
    {
      name: "Cloud Computing (AWS, Azure, GCP)",
      frequency: 42,
      importance_score: 92,
      category: "Infrastructure",
      growth_trend: "High",
      related_roles: ["Cloud Engineer", "DevOps Engineer", "Solutions Architect"]
    },
    {
      name: "Cybersecurity",
      frequency: 38,
      importance_score: 90,
      category: "Security",
      growth_trend: "Very High",
      related_roles: ["Security Analyst", "Penetration Tester", "CISO"]
    },
    {
      name: "Full-Stack Development",
      frequency: 35,
      importance_score: 88,
      category: "Software Development",
      growth_trend: "Stable",
      related_roles: ["Full-Stack Developer", "Software Engineer", "Technical Lead"]
    },
    {
      name: "Data Science & Analytics",
      frequency: 33,
      importance_score: 87,
      category: "Data",
      growth_trend: "High",
      related_roles: ["Data Scientist", "Data Analyst", "Business Intelligence Developer"]
    }
  ],
  career_advice_patterns: [
    {
      theme: "Continuous Learning",
      frequency: 48,
      description: "The importance of staying current with rapidly evolving technology",
      key_points: [
        "Technology changes rapidly - commit to lifelong learning",
        "Dedicate 20% of your time to learning new skills",
        "Follow industry leaders and subscribe to tech newsletters",
        "Attend conferences, workshops, and online courses regularly"
      ]
    },
    {
      theme: "Building a Strong Portfolio",
      frequency: 44,
      description: "Creating tangible proof of your technical abilities",
      key_points: [
        "Build 3-5 substantial projects showcasing different skills",
        "Include real-world applications, not just tutorials",
        "Document your code well and explain your decision-making",
        "Deploy projects live and share on GitHub"
      ]
    },
    {
      theme: "Professional Networking",
      frequency: 41,
      description: "Building relationships within the tech community",
      key_points: [
        "Engage on tech Twitter, LinkedIn, and GitHub",
        "Attend local meetups and tech events",
        "Contribute to open source projects",
        "Find mentors and eventually become one yourself"
      ]
    }
  ],
  actionable_steps_by_level: {
    'Entry-Level': {
      core_focus: 'Foundation Building',
      time_investment: '3-6 months per skill',
      steps: [
        "Choose one programming language and master fundamentals",
        "Build 2-3 beginner projects and deploy them",
        "Create professional GitHub and LinkedIn profiles",
        "Start networking through online communities",
        "Apply for entry-level positions or internships"
      ]
    },
    'Mid-Career': {
      core_focus: 'Specialization & Leadership',
      time_investment: '6-12 months per major skill',
      steps: [
        "Develop deep expertise in your chosen specialization",
        "Lead a significant project or team initiative",
        "Mentor junior developers or colleagues",
        "Contribute to technical decision-making processes",
        "Build industry recognition through speaking or writing"
      ]
    },
    'Senior-Level': {
      core_focus: 'Strategic Leadership',
      time_investment: '12+ months per initiative',
      steps: [
        "Drive technical strategy and architecture decisions",
        "Build and lead high-performing technical teams",
        "Establish thought leadership in your domain",
        "Create scalable processes and best practices",
        "Influence product and business strategy"
      ]
    }
  },
  career_path_insights: [
    {
      path: "Software Engineering",
      demand: "Very High",
      skills: ["Programming", "System Design", "Problem Solving", "Testing"],
      timeline: "6-12 months",
      salary_range: { entry: "$70-90k", mid: "$90-140k", senior: "$140-200k+" },
      growth_potential: "Excellent"
    },
    {
      path: "Data Science",
      demand: "High",
      skills: ["Python/R", "Statistics", "Machine Learning", "Data Visualization"],
      timeline: "8-15 months",
      salary_range: { entry: "$75-95k", mid: "$95-150k", senior: "$150-220k+" },
      growth_potential: "Very Good"
    },
    {
      path: "Product Management",
      demand: "High",
      skills: ["Strategy", "Analytics", "Communication", "User Research"],
      timeline: "6-10 months",
      salary_range: { entry: "$80-100k", mid: "$100-160k", senior: "$160-250k+" },
      growth_potential: "Excellent"
    }
  ]
};

const CareerResourcesHub = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('career-guidance');
  const [searchTerm, setSearchTerm] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mouse tracking for animated background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Resource Card Component
  const ResourceCard = ({ title, provider, type, cost, description, link, skills = [] }) => (
    <div className="bg-gradient-to-br from-black/40 via-gray-900/40 to-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-xl hover:shadow-lime-500/25 transition-all duration-300 transform hover:-translate-y-1 border border-white/20">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-black text-white mb-2" style={{textShadow: '0 0 15px rgba(255,255,255,0.2)'}}>
          {title}
        </h4>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          cost === 'Free' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
          cost.includes('$') ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        }`}>
          {cost}
        </span>
      </div>
      
      <div className="mb-3">
        <span className="text-lime-400 font-semibold text-sm">Provider:</span>
        <span className="text-gray-200 ml-2">{provider}</span>
      </div>
      
      <div className="mb-3">
        <span className="text-lime-400 font-semibold text-sm">Type:</span>
        <span className="text-gray-200 ml-2">{type}</span>
      </div>
      
      <p className="text-gray-200 mb-4 text-sm leading-relaxed">{description}</p>
      
      {skills.length > 0 && (
        <div className="mb-4">
          <span className="text-lime-400 font-semibold text-sm block mb-2">Skills Covered:</span>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {link && link !== '#' && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center bg-gradient-to-r from-lime-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-lime-600 hover:to-green-700 transition-all font-semibold text-sm"
        >
          <span className="mr-2">🔗</span>
          Access Resource
        </a>
      )}
    </div>
  );

  // Enhanced Section Header for Career Guidance
  const CareerInsightsHeader = () => (
    <div className="bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-teal-600/20 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-purple-500/30">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h3 className="text-2xl font-black text-white mb-2" style={{textShadow: '0 0 20px rgba(255,255,255,0.3)'}}>
            📊 Career Intelligence Dashboard
          </h3>
          <p className="text-purple-200">
            Data-driven insights from {videoAnalysisData.project_info.total_videos_analyzed}+ tech career expert videos
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{videoAnalysisData.trending_skills.length}</div>
            <div className="text-xs text-gray-300">Top Skills</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">{videoAnalysisData.career_path_insights.length}</div>
            <div className="text-xs text-gray-300">Career Paths</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-teal-400">{videoAnalysisData.career_advice_patterns.length}</div>
            <div className="text-xs text-gray-300">Expert Tips</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">3</div>
            <div className="text-xs text-gray-300">Career Levels</div>
          </div>
        </div>
      </div>
      
      {/* Trending Skills Preview */}
      <div className="mt-6">
        <h4 className="text-lg font-bold text-white mb-3">🔥 Most In-Demand Skills</h4>
        <div className="flex flex-wrap gap-2">
          {videoAnalysisData.trending_skills.slice(0, 6).map((skill, idx) => (
            <span 
              key={idx} 
              className="px-3 py-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-purple-200 rounded-full text-sm border border-purple-500/40"
              title={`Importance Score: ${skill.importance_score}% | Growth: ${skill.growth_trend}`}
            >
              {skill.name} ({skill.importance_score}%)
            </span>
          ))}
        </div>
      </div>
    </div>
  );
  
  const CertificationCard = ({ name, provider, cost, duration, description, level, link }) => (
    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-yellow-500/20 hover:shadow-yellow-500/25 transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-lg font-black text-white mb-2" style={{textShadow: '0 0 15px rgba(255,255,255,0.2)'}}>
          {name}
        </h4>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          level === 'Beginner' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
          level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
          'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}>
          {level}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <span className="text-yellow-400 font-semibold text-sm">Provider:</span>
          <div className="text-gray-200 text-sm">{provider}</div>
        </div>
        <div>
          <span className="text-yellow-400 font-semibold text-sm">Cost:</span>
          <div className="text-gray-200 text-sm">{cost}</div>
        </div>
        <div>
          <span className="text-yellow-400 font-semibold text-sm">Duration:</span>
          <div className="text-gray-200 text-sm">{duration}</div>
        </div>
      </div>
      
      <p className="text-gray-200 mb-4 text-sm leading-relaxed">{description}</p>
      
      {link && (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold text-sm"
        >
          <span className="mr-2">🎓</span>
          View Certification
        </a>
      )}
    </div>
  );

  // Resources data structure
  const resourcesData = {
    'career-guidance': {
      title: 'Career Guidance',
      icon: '🎯',
      resources: [
        // Video Analysis Resources
        ...Object.entries(videoAnalysisData.detailed_video_analyses).map(([id, analysis]) => ({
          title: analysis.title,
          provider: 'Tech Career Analysis',
          type: 'Video Analysis',
          cost: 'Free',
          description: analysis.comprehensive_summary,
          link: analysis.url,
          skills: analysis.key_themes
        })),
        
        // Original Career Guidance Resources
        {
          title: 'Understanding Yourself in Tech',
          provider: 'YouTube',
          type: 'Video Guide',
          cost: 'Free',
          description: 'Essential video guide to help you understand your place and potential in the tech industry.',
          link: 'https://youtu.be/m-E6TeNjxj4',
          skills: ['Self-Assessment', 'Career Planning', 'Tech Industry', 'Personal Development']
        },
        {
          title: 'Identifying Your Niche in Tech',
          provider: 'Career Guide',
          type: 'Resource Guide',
          cost: 'Free',
          description: 'Comprehensive guide to help you find your specific niche within the technology sector.',
          link: '#',
          skills: ['Career Focus', 'Specialization', 'Tech Roles', 'Skills Assessment']
        },
        {
          title: 'Careers in Tech Overview',
          provider: 'Career Resource',
          type: 'Career Guide',
          cost: 'Free',
          description: 'Complete overview of various career paths available in technology.',
          link: '#',
          skills: ['Career Exploration', 'Tech Roles', 'Industry Overview', 'Job Market']
        },
        {
          title: 'Entry Points in Tech',
          provider: 'Career Resource',
          type: 'Guide',
          cost: 'Free',
          description: 'Different pathways to enter the tech industry regardless of your background.',
          link: '#',
          skills: ['Career Entry', 'Tech Transition', 'Entry Level', 'Career Change']
        },
        {
          title: 'Becoming an Expert in Tech',
          provider: 'Professional Development',
          type: 'Guide',
          cost: 'Free',
          description: 'Strategies and roadmap for developing deep expertise in your chosen tech field.',
          link: '#',
          skills: ['Expertise Development', 'Skill Mastery', 'Professional Growth', 'Continuous Learning']
        },
        {
          title: 'Staying Relevant in Tech',
          provider: 'Career Development',
          type: 'Resource',
          cost: 'Free',
          description: 'How to keep your skills current and remain competitive in the fast-evolving tech landscape.',
          link: '#',
          skills: ['Continuous Learning', 'Skill Updates', 'Industry Trends', 'Professional Development']
        },
        
        // Trending Skills as Resources
        ...videoAnalysisData.trending_skills.slice(0, 5).map(skill => ({
          title: `Master ${skill.name}`,
          provider: 'Industry Analysis',
          type: 'Skill Focus',
          cost: 'Free',
          description: `High-demand skill with ${skill.importance_score}% importance score. Growth trend: ${skill.growth_trend}. Essential for roles like ${skill.related_roles.slice(0, 2).join(', ')}.`,
          link: '#',
          skills: [skill.name, skill.category, ...skill.related_roles.slice(0, 2)]
        })),
        
        // Career Advice Patterns as Resources
        ...videoAnalysisData.career_advice_patterns.map(pattern => ({
          title: `Career Strategy: ${pattern.theme}`,
          provider: 'Expert Analysis',
          type: 'Strategy Guide',
          cost: 'Free',
          description: `${pattern.description} Based on analysis of ${pattern.frequency}+ expert videos.`,
          link: '#',
          skills: ['Career Strategy', pattern.theme, 'Professional Development', 'Best Practices']
        })),
        
        // Career Path Insights as Resources
        ...videoAnalysisData.career_path_insights.map(path => ({
          title: `${path.path} Career Path`,
          provider: 'Market Analysis',
          type: 'Career Pathway',
          cost: 'Free',
          description: `Market demand: ${path.demand}. Timeline: ${path.timeline}. Salary range: ${path.salary_range.entry} - ${path.salary_range.senior}. Growth potential: ${path.growth_potential}.`,
          link: '#',
          skills: [path.path, `${path.demand} Demand`, 'Career Planning', ...path.skills.slice(0, 2)]
        })),
        
        // Actionable Steps by Level as Resources
        ...Object.entries(videoAnalysisData.actionable_steps_by_level).map(([level, data]) => ({
          title: `${level} Action Plan`,
          provider: 'Career Framework',
          type: 'Action Guide',
          cost: 'Free',
          description: `${data.core_focus} framework. Time investment: ${data.time_investment}. ${data.steps.length} actionable steps for ${level.toLowerCase()} professionals.`,
          link: '#',
          skills: [level, data.core_focus, 'Action Planning', 'Career Development']
        }))
      ],
      certifications: [
        {
          name: 'LinkedIn Learning Career Exploration',
          provider: 'LinkedIn Learning',
          cost: '$29.99/month',
          duration: '1-2 weeks',
          level: 'Beginner',
          description: 'Comprehensive career exploration and planning courses.',
          link: 'https://www.linkedin.com/learning/'
        },
        {
          name: 'Tech Career Analysis Certificate',
          provider: 'Industry Research',
          cost: 'Free',
          duration: '2-3 weeks',
          level: 'Beginner',
          description: `Based on analysis of ${videoAnalysisData.project_info.total_videos_analyzed} tech career videos. Complete framework for tech career planning.`,
          link: '#'
        }
      ]
    },
    'software-engineering': {
      title: 'Software Engineering',
      icon: '💻',
      resources: [
        {
          title: 'FreeCodeCamp - Complete Programming Course',
          provider: 'FreeCodeCamp',
          type: 'Interactive Course',
          cost: 'Free',
          description: 'Comprehensive programming course covering HTML, CSS, JavaScript, Python, and more with hands-on projects.',
          link: 'https://www.freecodecamp.org/',
          skills: ['HTML', 'CSS', 'JavaScript', 'Python', 'React', 'Node.js']
        },
        {
          title: 'SQL Tutorial',
          provider: 'W3 Schools',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Comprehensive SQL tutorial covering database fundamentals to advanced queries.',
          link: 'https://www.w3schools.com/sql/',
          skills: ['SQL', 'Database', 'Queries', 'Joins']
        },
        {
          title: 'Introduction to SQL',
          provider: 'DataCamp',
          type: 'Interactive Course',
          cost: 'Free Trial',
          description: 'Hands-on SQL course with real-world datasets and practical exercises.',
          link: 'https://www.datacamp.com/courses/introduction-to-sql',
          skills: ['SQL', 'Data Analysis', 'Database Management']
        },
        {
          title: 'SQL Crash Course',
          provider: 'Corise',
          type: 'Video Course',
          cost: 'Premium',
          description: 'Intensive SQL crash course covering fundamentals to intermediate concepts.',
          link: 'https://corise.com/course/sql-crash-course',
          skills: ['SQL', 'Database Design', 'Query Optimization']
        },
        {
          title: 'Advanced SQL',
          provider: 'Corise',
          type: 'Video Course',
          cost: 'Premium',
          description: 'Advanced SQL concepts including window functions, CTEs, and performance tuning.',
          link: 'https://corise.com/course/advanced-sql',
          skills: ['Advanced SQL', 'Window Functions', 'Performance Tuning']
        },
        {
          title: 'HTML Tutorial',
          provider: 'W3 Schools',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Complete HTML tutorial from basics to advanced semantic markup.',
          link: 'https://www.w3schools.com/html/',
          skills: ['HTML5', 'Semantic Markup', 'Forms', 'Accessibility']
        },
        {
          title: 'CSS Tutorial',
          provider: 'W3 Schools',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Comprehensive CSS tutorial covering styling, layouts, and responsive design.',
          link: 'https://www.w3schools.com/css/default.asp',
          skills: ['CSS3', 'Flexbox', 'Grid', 'Responsive Design']
        },
        {
          title: 'JavaScript Complete Course',
          provider: 'YouTube Playlist',
          type: 'Video Series',
          cost: 'Free',
          description: 'Complete JavaScript course covering fundamentals to advanced concepts.',
          link: 'https://www.youtube.com/watch?v=zBPeGR48_vE&list=PLqkLaKB2GJhWXV9rcarwvn06ISlL_9mPQ',
          skills: ['JavaScript', 'ES6+', 'DOM', 'Async Programming']
        },
        {
          title: 'JavaScript Tutorial',
          provider: 'W3 Schools',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Interactive JavaScript tutorial with examples and exercises.',
          link: 'https://www.w3schools.com/js/default.asp',
          skills: ['JavaScript', 'Functions', 'Objects', 'Events']
        },
        {
          title: 'NodeJs Complete Tutorial',
          provider: 'YouTube - Code Evolution',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete Node.js tutorial covering server-side JavaScript development.',
          link: 'https://www.youtube.com/watch?v=LAUi8pPlcUM&list=PLC3y8-rFHvwh8shCMHFA5kWxD9PaPwxaY',
          skills: ['Node.js', 'Express.js', 'NPM', 'Server Development']
        },
        {
          title: 'C# Tutorial',
          provider: 'W3 Schools',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Complete C# programming tutorial from basics to advanced concepts.',
          link: 'https://www.w3schools.com/cs/index.php',
          skills: ['C#', '.NET', 'Object-Oriented Programming', 'Windows Development']
        },
        {
          title: 'ASP.Net Core Tutorial',
          provider: 'YouTube - Kudvenkat',
          type: 'Video Series',
          cost: 'Free',
          description: 'Comprehensive ASP.NET Core tutorial for web development.',
          link: 'https://www.youtube.com/watch?v=4IgC2Q5-yDE&list=PL6n9fhu94yhVkdrusLaQsfERmL_Jh4XmU',
          skills: ['ASP.NET Core', 'C#', 'Web APIs', 'MVC']
        },
        {
          title: 'Git Started with GitHub',
          provider: 'Udemy',
          type: 'Video Course',
          cost: 'Premium',
          description: 'Complete Git and GitHub course for version control mastery.',
          link: 'https://www.udemy.com/course/git-started-with-github/',
          skills: ['Git', 'GitHub', 'Version Control', 'Collaboration']
        },
        {
          title: 'Data Structures and Algorithms',
          provider: 'YouTube - Abdul Bari',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete course on data structures and algorithms with clear explanations and examples.',
          link: 'https://www.youtube.com/channel/UCZCFT11CWBi3MHNlGf019nw',
          skills: ['Data Structures', 'Algorithms', 'Problem Solving', 'Time Complexity']
        },
        {
          title: 'LeetCode Practice',
          provider: 'LeetCode',
          type: 'Practice Platform',
          cost: 'Free (Premium available)',
          description: 'Practice coding problems and algorithm challenges.',
          link: 'https://leetcode.com/',
          skills: ['Algorithms', 'Problem Solving', 'Interview Prep']
        },
        {
          title: 'HackerRank Challenges',
          provider: 'HackerRank',
          type: 'Practice Platform',
          cost: 'Free',
          description: 'Coding challenges and skill assessment platform.',
          link: 'https://www.hackerrank.com/',
          skills: ['Programming', 'Algorithms', 'Data Structures']
        }
      ],
      certifications: [
        {
          name: 'Google IT Certificate',
          provider: 'Google',
          cost: '$39/month (Coursera)',
          duration: '3-6 months',
          level: 'Beginner',
          description: 'Entry-level certificate covering IT fundamentals, networking, security, and system administration.',
          link: 'https://www.coursera.org/professional-certificates/google-it-certificate'
        },
        {
          name: 'Oracle Java Certification',
          provider: 'Oracle',
          cost: '$245',
          duration: '2-4 months prep',
          level: 'Intermediate',
          description: 'Industry-standard Java certification proving proficiency in Java programming.',
          link: 'https://education.oracle.com/java-se-11-developer/pexam_1Z0-819'
        },
        {
          name: 'Microsoft Azure Fundamentals',
          provider: 'Microsoft',
          cost: '$99',
          duration: '1-2 months',
          level: 'Beginner',
          description: 'Foundational knowledge of cloud services and Microsoft Azure.',
          link: 'https://docs.microsoft.com/en-us/learn/certifications/azure-fundamentals/'
        }
      ]
    },
    'interview-prep': {
      title: 'Interview Preparation',
      icon: '🎤',
      resources: [
        {
          title: 'LeetCode - Coding Interview Practice',
          provider: 'LeetCode',
          type: 'Practice Platform',
          cost: 'Free (Premium $35/month)',
          description: 'Extensive collection of coding problems used by top tech companies in interviews.',
          link: 'https://leetcode.com/',
          skills: ['Algorithms', 'Data Structures', 'Problem Solving', 'Coding Interview']
        },
        {
          title: 'Cracking the Coding Interview',
          provider: 'Gayle McDowell',
          type: 'Book/Video',
          cost: '$25 (Book)',
          description: 'Comprehensive guide to technical interviews with 189 programming problems and solutions.',
          link: 'https://www.crackingthecodinginterview.com/',
          skills: ['Technical Interview', 'System Design', 'Behavioral Questions']
        },
        {
          title: 'Mock Interview Practice',
          provider: 'Pramp',
          type: 'Live Practice',
          cost: 'Free',
          description: 'Practice coding interviews with peers in a realistic interview environment.',
          link: 'https://www.pramp.com/',
          skills: ['Live Coding', 'Communication', 'Problem Solving']
        },
        {
          title: 'Behavioral Interview Guide',
          provider: 'YouTube - Dan Croitor',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete guide to behavioral interviews with STAR method and common questions.',
          link: 'https://www.youtube.com/watch?v=PJKYqLP6MRE',
          skills: ['Behavioral Interview', 'STAR Method', 'Communication']
        },
        {
          title: 'System Design Interview',
          provider: 'High Scalability',
          type: 'Blog/Articles',
          cost: 'Free',
          description: 'Real-world system design examples and architectural patterns.',
          link: 'http://highscalability.com/',
          skills: ['System Design', 'Architecture', 'Scalability']
        }
      ],
      certifications: [
        {
          name: 'Interview Skills Certification',
          provider: 'LinkedIn Learning',
          cost: '$29.99/month',
          duration: '2-4 weeks',
          level: 'Beginner',
          description: 'Comprehensive interview skills training covering all aspects of job interviews.',
          link: 'https://www.linkedin.com/learning/'
        }
      ]
    },
    'frontend': {
      title: 'Front-End Development',
      icon: '🎨',
      resources: [
        {
          title: 'HTML & CSS Complete Course',
          provider: 'YouTube - Brad Traversy',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete HTML and CSS course covering modern web development techniques.',
          link: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
          skills: ['HTML5', 'CSS3', 'Flexbox', 'Grid', 'Responsive Design']
        },
        {
          title: 'React.js Complete Guide',
          provider: 'React Official Docs',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official React documentation with interactive examples and tutorials.',
          link: 'https://reactjs.org/docs/getting-started.html',
          skills: ['React', 'JSX', 'Hooks', 'State Management', 'Component Design']
        },
        {
          title: 'Vue.js 3 Masterclass',
          provider: 'Vue School',
          type: 'Video Course',
          cost: 'Free (Premium courses available)',
          description: 'Learn Vue.js 3 from basics to advanced concepts with hands-on projects.',
          link: 'https://vueschool.io/',
          skills: ['Vue.js', 'Composition API', 'Vuex', 'Vue Router']
        },
        {
          title: 'Angular Complete Guide',
          provider: 'Angular Official',
          type: 'Tutorial',
          cost: 'Free',
          description: 'Official Angular tutorial covering TypeScript, components, and services.',
          link: 'https://angular.io/tutorial',
          skills: ['Angular', 'TypeScript', 'RxJS', 'Angular CLI']
        },
        {
          title: 'Frontend Masters Bootcamp',
          provider: 'Frontend Masters',
          type: 'Interactive Course',
          cost: '$39/month',
          description: 'Complete frontend bootcamp covering HTML, CSS, JavaScript, and React.',
          link: 'https://frontendmasters.com/bootcamp/',
          skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Git']
        }
      ],
      certifications: [
        {
          name: 'Meta Front-End Developer Certificate',
          provider: 'Meta (Facebook)',
          cost: '$39/month (Coursera)',
          duration: '5-7 months',
          level: 'Beginner',
          description: 'Professional certificate covering HTML, CSS, JavaScript, React, and UX/UI basics.',
          link: 'https://www.coursera.org/professional-certificates/meta-front-end-developer'
        },
        {
          name: 'Google UX Design Certificate',
          provider: 'Google',
          cost: '$39/month (Coursera)',
          duration: '3-6 months',
          level: 'Beginner',
          description: 'Comprehensive UX design program covering user research, wireframing, and prototyping.',
          link: 'https://www.coursera.org/professional-certificates/google-ux-design'
        }
      ]
    },
    'backend': {
      title: 'Back-End Development',
      icon: '⚙️',
      resources: [
        {
          title: 'Node.js Complete Guide',
          provider: 'YouTube - The Net Ninja',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete Node.js course covering server development, APIs, and databases.',
          link: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9gcy9lrvMJ75z9maRw4byYp',
          skills: ['Node.js', 'Express.js', 'MongoDB', 'REST APIs']
        },
        {
          title: 'Django for Beginners',
          provider: 'Django Project',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official Django tutorial for building web applications with Python.',
          link: 'https://docs.djangoproject.com/en/stable/intro/tutorial01/',
          skills: ['Django', 'Python', 'ORM', 'Web Framework']
        },
        {
          title: 'Spring Boot Tutorial',
          provider: 'Spring.io',
          type: 'Guide',
          cost: 'Free',
          description: 'Official Spring Boot guides and tutorials for Java web development.',
          link: 'https://spring.io/guides',
          skills: ['Spring Boot', 'Java', 'REST APIs', 'Microservices']
        },
        {
          title: 'ASP.NET Core Tutorial',
          provider: 'Microsoft Learn',
          type: 'Interactive Course',
          cost: 'Free',
          description: 'Complete ASP.NET Core tutorial for building web APIs and applications.',
          link: 'https://docs.microsoft.com/en-us/aspnet/core/',
          skills: ['ASP.NET Core', 'C#', 'Entity Framework', 'Web APIs']
        },
        {
          title: 'Database Design and SQL',
          provider: 'YouTube - Programming with Mosh',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete database design and SQL course covering relational databases.',
          link: 'https://www.youtube.com/watch?v=7S_tz1z_5bA',
          skills: ['SQL', 'Database Design', 'MySQL', 'PostgreSQL']
        }
      ],
      certifications: [
        {
          name: 'AWS Certified Developer',
          provider: 'Amazon Web Services',
          cost: '$150',
          duration: '2-4 months',
          level: 'Intermediate',
          description: 'Validates expertise in developing and maintaining applications on AWS.',
          link: 'https://aws.amazon.com/certification/certified-developer-associate/'
        },
        {
          name: 'Oracle Database SQL Certified Associate',
          provider: 'Oracle',
          cost: '$245',
          duration: '1-3 months',
          level: 'Beginner',
          description: 'Demonstrates foundational knowledge of SQL and relational database concepts.',
          link: 'https://education.oracle.com/oracle-database-sql-certified-associate/trackp_457'
        }
      ]
    },
    'devops': {
      title: 'DevOps Engineering',
      icon: '🔧',
      resources: [
        {
          title: 'Docker Complete Tutorial',
          provider: 'YouTube - TechWorld with Nana',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete Docker tutorial covering containerization from basics to advanced.',
          link: 'https://www.youtube.com/watch?v=3c-iBn73dDE',
          skills: ['Docker', 'Containerization', 'Docker Compose', 'Kubernetes']
        },
        {
          title: 'Kubernetes Tutorial',
          provider: 'Kubernetes Official',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official Kubernetes documentation and interactive tutorials.',
          link: 'https://kubernetes.io/docs/tutorials/',
          skills: ['Kubernetes', 'Container Orchestration', 'Pods', 'Services']
        },
        {
          title: 'AWS DevOps Learning Path',
          provider: 'AWS Training',
          type: 'Learning Path',
          cost: 'Free',
          description: 'Complete AWS DevOps learning path covering CI/CD, infrastructure as code.',
          link: 'https://aws.amazon.com/training/path-devops/',
          skills: ['AWS', 'CI/CD', 'CloudFormation', 'CodePipeline']
        },
        {
          title: 'Terraform Tutorial',
          provider: 'HashiCorp Learn',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Official Terraform tutorials for infrastructure as code.',
          link: 'https://learn.hashicorp.com/terraform',
          skills: ['Terraform', 'Infrastructure as Code', 'Cloud Providers']
        },
        {
          title: 'Jenkins CI/CD Tutorial',
          provider: 'Jenkins.io',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official Jenkins documentation and tutorials for continuous integration.',
          link: 'https://www.jenkins.io/doc/tutorials/',
          skills: ['Jenkins', 'CI/CD', 'Build Automation', 'Testing']
        }
      ],
      certifications: [
        {
          name: 'AWS Certified DevOps Engineer',
          provider: 'Amazon Web Services',
          cost: '$300',
          duration: '3-6 months',
          level: 'Advanced',
          description: 'Professional-level certification for DevOps practices on AWS.',
          link: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/'
        },
        {
          name: 'Certified Kubernetes Administrator (CKA)',
          provider: 'Cloud Native Computing Foundation',
          cost: '$375',
          duration: '2-4 months',
          level: 'Intermediate',
          description: 'Hands-on certification for Kubernetes cluster administration.',
          link: 'https://www.cncf.io/certification/cka/'
        },
        {
          name: 'Docker Certified Associate',
          provider: 'Docker',
          cost: '$195',
          duration: '1-3 months',
          level: 'Intermediate',
          description: 'Validates Docker containerization and orchestration skills.',
          link: 'https://training.docker.com/certification'
        }
      ]
    },
    'cybersecurity': {
      title: 'Cybersecurity',
      icon: '🔒',
      resources: [
        {
          title: 'Cybrary Free Cybersecurity Training',
          provider: 'Cybrary',
          type: 'Video Course',
          cost: 'Free (Premium available)',
          description: 'Comprehensive cybersecurity training covering various domains.',
          link: 'https://www.cybrary.it/',
          skills: ['Network Security', 'Incident Response', 'Penetration Testing', 'Risk Management']
        },
        {
          title: 'OWASP Top 10',
          provider: 'OWASP Foundation',
          type: 'Guide',
          cost: 'Free',
          description: 'Essential web application security risks and countermeasures.',
          link: 'https://owasp.org/www-project-top-ten/',
          skills: ['Web Security', 'Vulnerability Assessment', 'Secure Coding']
        },
        {
          title: 'TryHackMe - Learn Cybersecurity',
          provider: 'TryHackMe',
          type: 'Interactive Platform',
          cost: 'Free (Premium $10/month)',
          description: 'Hands-on cybersecurity challenges and learning paths.',
          link: 'https://tryhackme.com/',
          skills: ['Penetration Testing', 'Digital Forensics', 'Web Exploitation']
        },
        {
          title: 'SANS Free Resources',
          provider: 'SANS Institute',
          type: 'Training Materials',
          cost: 'Free',
          description: 'Free cybersecurity resources and training materials from SANS.',
          link: 'https://www.sans.org/free/',
          skills: ['Security Operations', 'Malware Analysis', 'Network Defense']
        }
      ],
      certifications: [
        {
          name: 'CompTIA Security+',
          provider: 'CompTIA',
          cost: '$370',
          duration: '2-4 months',
          level: 'Beginner',
          description: 'Entry-level cybersecurity certification covering foundational concepts.',
          link: 'https://www.comptia.org/certifications/security'
        },
        {
          name: 'Certified Ethical Hacker (CEH)',
          provider: 'EC-Council',
          cost: '$1,199',
          duration: '3-6 months',
          level: 'Intermediate',
          description: 'Validates skills in ethical hacking and penetration testing.',
          link: 'https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/'
        },
        {
          name: 'CISSP',
          provider: 'ISC2',
          cost: '$749',
          duration: '6-12 months',
          level: 'Advanced',
          description: 'Advanced cybersecurity certification for experienced professionals.',
          link: 'https://www.isc2.org/Certifications/CISSP'
        }
      ]
    },
    'product-management': {
      title: 'Product Management',
      icon: '📋',
      resources: [
        {
          title: 'Product Management Methodologies',
          provider: 'Atlassian',
          type: 'Guide',
          cost: 'Free',
          description: 'Understanding the overview of the product development lifecycle and methodologies.',
          link: 'https://www.atlassian.com/agile/product-management#:~:text=Product%20management%20is%20an%20organizational,its%20customers%20first%20and%20foremost.',
          skills: ['Product Strategy', 'Business', 'Technology', 'Design', 'Customer Focus']
        },
        {
          title: 'Introduction to Design Thinking',
          provider: 'Interaction Design Foundation',
          type: 'Article/Course',
          cost: 'Free',
          description: 'Comprehensive guide to design thinking methodology and principles.',
          link: 'https://www.interaction-design.org/literature/topics/design-thinking',
          skills: ['Design Thinking', 'User Research', 'Empathy', 'Ideation', 'Prototyping']
        },
        {
          title: 'Product Requirements Documentation',
          provider: 'Nuclino',
          type: 'Guide',
          cost: 'Free',
          description: 'Complete guide to writing powerful product requirement documents and building MVPs.',
          link: 'https://www.nuclino.com/articles/product-requirements-document',
          skills: ['PRD Writing', 'MVP Development', 'Feature Specification', 'Documentation']
        },
        {
          title: 'Agile Product Management Study Guide',
          provider: 'Product School',
          type: 'Study Guide',
          cost: 'Free',
          description: 'Comprehensive guide to agile methodologies and product management principles.',
          link: 'https://productschool.com/blog/product-fundamentals/agile-product-management-study-guide',
          skills: ['Agile', 'Scrum', 'Sprint Planning', 'Product Backlog']
        },
        {
          title: 'Introduction to Scrum',
          provider: 'Scrum.org',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official Scrum guide covering ceremonies, frameworks, and sprint management.',
          link: 'https://www.scrum.org/resources/what-is-scrum',
          skills: ['Scrum', 'Sprint Planning', 'Sprint Review', 'Sprint Retrospective']
        },
        {
          title: 'Product Roadmaps Guide',
          provider: 'Adobe Business',
          type: 'Guide',
          cost: 'Free',
          description: 'Complete guide to product vision, roadmapping, and prioritization techniques.',
          link: 'https://business.adobe.com/blog/basics/product-roadmaps-guide',
          skills: ['Product Vision', 'Roadmapping', 'Prioritization', 'Go-to-Market']
        },
        {
          title: 'Product School Free Courses',
          provider: 'Product School',
          type: 'Video Course',
          cost: 'Free',
          description: 'Free product management courses covering fundamentals to advanced topics.',
          link: 'https://productschool.com/free-product-management-resources/',
          skills: ['Product Strategy', 'User Research', 'Roadmapping', 'Analytics']
        },
        {
          title: 'Google Product Management Course',
          provider: 'Coursera',
          type: 'Course',
          cost: 'Free (Audit)',
          description: 'Product management course from Google covering end-to-end product development.',
          link: 'https://www.coursera.org/learn/google-project-management',
          skills: ['Product Development', 'Agile', 'Stakeholder Management']
        },
        {
          title: 'Aha! Product Management Guide',
          provider: 'Aha!',
          type: 'Guide/Blog',
          cost: 'Free',
          description: 'Comprehensive product management resources and best practices.',
          link: 'https://www.aha.io/product-management',
          skills: ['Product Strategy', 'Feature Prioritization', 'Go-to-Market']
        },
        {
          title: 'Mind the Product Resources',
          provider: 'Mind the Product',
          type: 'Articles/Videos',
          cost: 'Free',
          description: 'Product management community with articles, videos, and events.',
          link: 'https://www.mindtheproduct.com/',
          skills: ['Product Leadership', 'User Experience', 'Data-Driven Decisions']
        }
      ],
      certifications: [
        {
          name: 'Google Project Management Certificate',
          provider: 'Google',
          cost: '$39/month (Coursera)',
          duration: '3-6 months',
          level: 'Beginner',
          description: 'Professional certificate in project management principles and practices.',
          link: 'https://www.coursera.org/professional-certificates/google-project-management'
        },
        {
          name: 'Certified Scrum Product Owner',
          provider: 'Scrum Alliance',
          cost: '$995-$1,500',
          duration: '2-3 days',
          level: 'Intermediate',
          description: 'Certification for product owners working in Scrum environments.',
          link: 'https://www.scrumalliance.org/get-certified/product-owner-track/certified-scrum-product-owner'
        }
      ]
    },
    'ai-ml': {
      title: 'AI & Machine Learning',
      icon: '🤖',
      resources: [
        {
          title: 'Andrew Ng Machine Learning Course',
          provider: 'Coursera (Stanford)',
          type: 'Video Course',
          cost: 'Free (Audit)',
          description: 'Legendary machine learning course by Andrew Ng covering fundamentals.',
          link: 'https://www.coursera.org/learn/machine-learning',
          skills: ['Machine Learning', 'Linear Algebra', 'Statistics', 'Python']
        },
        {
          title: 'Fast.ai Practical Deep Learning',
          provider: 'Fast.ai',
          type: 'Course',
          cost: 'Free',
          description: 'Practical deep learning course focused on real-world applications.',
          link: 'https://course.fast.ai/',
          skills: ['Deep Learning', 'Neural Networks', 'Computer Vision', 'NLP']
        },
        {
          title: 'Kaggle Learn',
          provider: 'Kaggle',
          type: 'Micro-courses',
          cost: 'Free',
          description: 'Short, practical courses on data science and machine learning.',
          link: 'https://www.kaggle.com/learn',
          skills: ['Data Science', 'Feature Engineering', 'Model Validation']
        },
        {
          title: 'MIT OpenCourseWare - AI',
          provider: 'MIT',
          type: 'Course Materials',
          cost: 'Free',
          description: 'MIT artificial intelligence course materials and lectures.',
          link: 'https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/',
          skills: ['Artificial Intelligence', 'Search Algorithms', 'Game Theory']
        },
        {
          title: 'TensorFlow Tutorials',
          provider: 'TensorFlow',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official TensorFlow tutorials and guides for machine learning.',
          link: 'https://www.tensorflow.org/tutorials',
          skills: ['TensorFlow', 'Keras', 'Deep Learning', 'Model Deployment']
        }
      ],
      certifications: [
        {
          name: 'Google AI for Everyone',
          provider: 'Google',
          cost: '$39/month (Coursera)',
          duration: '1-2 months',
          level: 'Beginner',
          description: 'Introduction to AI concepts and applications in business.',
          link: 'https://www.coursera.org/learn/ai-for-everyone'
        },
        {
          name: 'AWS Certified Machine Learning',
          provider: 'Amazon Web Services',
          cost: '$300',
          duration: '3-6 months',
          level: 'Advanced',
          description: 'Specialty certification for machine learning on AWS.',
          link: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/'
        },
        {
          name: 'TensorFlow Developer Certificate',
          provider: 'TensorFlow',
          cost: '$100',
          duration: '2-4 months',
          level: 'Intermediate',
          description: 'Hands-on certification for TensorFlow development skills.',
          link: 'https://www.tensorflow.org/certificate'
        }
      ]
    },
    'cloud-engineering': {
      title: 'Cloud Engineering',
      icon: '☁️',
      resources: [
        {
          title: 'Creating Microsoft Learn Profile',
          provider: 'Microsoft Learn',
          type: 'Setup Guide',
          cost: 'Free',
          description: 'Step-by-step guide to creating your Microsoft Learn profile for tracking progress.',
          link: 'https://bit.ly/CreatingAMicrosoftLearnAccount',
          skills: ['Microsoft Learn', 'Profile Setup', 'Learning Path']
        },
        {
          title: 'Azure Data Fundamentals (DP-900)',
          provider: 'Microsoft Learn',
          type: 'Certification Path',
          cost: 'Free',
          description: 'Complete learning path for Azure Data Fundamentals certification.',
          link: 'https://learn.microsoft.com/en-us/certifications/exams/dp-900/?source=learn',
          skills: ['Azure', 'Data Fundamentals', 'Cloud Concepts', 'Data Services']
        },
        {
          title: 'DP-900 Exam Topics',
          provider: 'ExamTopics',
          type: 'Practice Questions',
          cost: 'Free',
          description: 'Practice questions and exam topics for Azure Data Fundamentals.',
          link: 'https://www.examtopics.com/exams/microsoft/dp-900/view/',
          skills: ['Exam Prep', 'Practice Questions', 'Azure Data']
        },
        {
          title: 'Azure Training Days',
          provider: 'Microsoft',
          type: 'Virtual Events',
          cost: 'Free (includes exam voucher)',
          description: 'Free virtual training events with complimentary exam vouchers.',
          link: 'https://www.microsoft.com/en-us/trainingdays/azure',
          skills: ['Azure', 'Training Events', 'Certification']
        },
        {
          title: 'Student Microsoft Fundamental Certifications',
          provider: 'Microsoft',
          type: 'Student Program',
          cost: 'Free for Students',
          description: 'Free Microsoft fundamental certifications for students.',
          link: 'https://bit.ly/StudentMicrosoftFundamentalCertifications',
          skills: ['Student Programs', 'Fundamental Certifications', 'Azure']
        },
        {
          title: 'Azure for the Data Engineer',
          provider: 'Microsoft Learn',
          type: 'Learning Path',
          cost: 'Free',
          description: 'Introduction to Azure services and tools for data engineering.',
          link: 'https://learn.microsoft.com/en-us/training/paths/azure-for-the-data-engineer/',
          skills: ['Azure', 'Data Engineering', 'Data Pipelines', 'ETL']
        },
        {
          title: 'Azure Data Engineer Associate (DP-203)',
          provider: 'Microsoft Learn',
          type: 'Certification Path',
          cost: 'Free',
          description: 'Complete learning path for Azure Data Engineer Associate certification.',
          link: 'https://learn.microsoft.com/en-us/certifications/azure-data-engineer/',
          skills: ['Azure Data Engineering', 'Data Pipelines', 'Data Storage', 'Analytics']
        },
        {
          title: 'DP-203 Exam Topics',
          provider: 'ExamTopics',
          type: 'Practice Questions',
          cost: 'Free',
          description: 'Practice questions and exam preparation for DP-203 certification.',
          link: 'https://www.examtopics.com/exams/microsoft/dp-203/view/',
          skills: ['Exam Prep', 'Azure Data Engineering', 'Practice Questions']
        },
        {
          title: 'AWS Cloud Practitioner Essentials',
          provider: 'AWS Training',
          type: 'Course',
          cost: 'Free',
          description: 'Introduction to AWS cloud computing concepts and services.',
          link: 'https://aws.amazon.com/training/course-descriptions/cloud-practitioner-essentials/',
          skills: ['AWS', 'Cloud Concepts', 'Core Services', 'Security']
        },
        {
          title: 'Google Cloud Platform Tutorial',
          provider: 'Google Cloud',
          type: 'Documentation',
          cost: 'Free',
          description: 'Comprehensive GCP tutorials and quick starts.',
          link: 'https://cloud.google.com/docs/tutorials',
          skills: ['Google Cloud', 'Compute Engine', 'Cloud Storage', 'BigQuery']
        },
        {
          title: 'Microsoft Azure Fundamentals',
          provider: 'Microsoft Learn',
          type: 'Learning Path',
          cost: 'Free',
          description: 'Azure fundamentals learning path with hands-on exercises.',
          link: 'https://docs.microsoft.com/en-us/learn/paths/azure-fundamentals/',
          skills: ['Azure', 'Virtual Machines', 'App Services', 'Databases']
        },
        {
          title: 'Cloud Architecture Patterns',
          provider: 'AWS Architecture Center',
          type: 'Documentation',
          cost: 'Free',
          description: 'Cloud architecture patterns and best practices.',
          link: 'https://aws.amazon.com/architecture/',
          skills: ['Architecture', 'Scalability', 'Reliability', 'Cost Optimization']
        },
        {
          title: 'Excel Statistical Functions',
          provider: 'YouTube Playlist',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Learn statistical functions, sorting, filters, and slicers in Excel.',
          link: 'https://www.youtube.com/watch?v=p8I583GySNQ&list=PLcmYWY91gQNdW2ZLY1SCxI1EiiRqLt9CC&index=8',
          skills: ['Excel', 'Statistical Functions', 'Data Analysis', 'Filtering']
        },
        {
          title: 'Excel Conditional Formatting',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Master conditional formatting techniques in Excel.',
          link: 'https://www.youtube.com/watch?v=lIqifDg2xfE',
          skills: ['Excel', 'Conditional Formatting', 'Data Visualization']
        },
        {
          title: 'Excel Logical Functions',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Learn IF, IFS, AND, OR, NOT functions in Excel.',
          link: 'https://www.youtube.com/watch?v=45ZLJSAnjo0',
          skills: ['Excel', 'Logical Functions', 'Formulas', 'Conditional Logic']
        },
        {
          title: 'Excel Lookup Functions',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Master VLOOKUP and INDEX functions in Excel.',
          link: 'https://www.youtube.com/watch?v=Lw03WcG4mt4&t=177s',
          skills: ['Excel', 'VLOOKUP', 'INDEX', 'Data Lookup']
        },
        {
          title: 'Excel Text Functions',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Learn text manipulation functions in Excel.',
          link: 'https://www.youtube.com/watch?v=rbUYH5n0DuM',
          skills: ['Excel', 'Text Functions', 'String Manipulation', 'Data Cleaning']
        },
        {
          title: 'Excel Date and Time Functions',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Master date and time functions in Excel.',
          link: 'https://www.youtube.com/watch?v=0x0Fjkp8BkoPivot',
          skills: ['Excel', 'Date Functions', 'Time Functions', 'Calendar Operations']
        },
        {
          title: 'Excel Pivot Tables',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Complete guide to Pivot Tables, slicers, and pivot charts.',
          link: 'https://www.youtube.com/watch?v=n4MvhCVNwlw',
          skills: ['Excel', 'Pivot Tables', 'Data Analysis', 'Charts']
        },
        {
          title: 'Excel Insert Controls',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Learn to insert combo boxes, check boxes, and option buttons.',
          link: 'https://www.youtube.com/watch?v=jjGIwoToOC4&t=10s',
          skills: ['Excel', 'Form Controls', 'Interactive Elements']
        },
        {
          title: 'Excel Data Validation',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Master data validation techniques in Excel.',
          link: 'https://www.youtube.com/watch?v=SlWIgMFpsPg',
          skills: ['Excel', 'Data Validation', 'Data Quality', 'Input Controls']
        },
        {
          title: 'Excel VBA Macros',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Learn to record and modify macros in Excel VBA.',
          link: 'https://www.youtube.com/watch?v=ltcpaHdXUrU',
          skills: ['Excel', 'VBA', 'Macros', 'Automation']
        }
      ],
      certifications: [
        {
          name: 'Azure Data Fundamentals (DP-900)',
          provider: 'Microsoft',
          cost: '$99',
          duration: '2 weeks',
          level: 'Beginner',
          description: 'Foundational knowledge of core data concepts and Azure data services.',
          link: 'https://learn.microsoft.com/en-us/certifications/exams/dp-900/'
        },
        {
          name: 'Azure Data Engineer Associate (DP-203)',
          provider: 'Microsoft',
          cost: '$165',
          duration: '11 weeks',
          level: 'Intermediate',
          description: 'Comprehensive certification for Azure data engineering skills.',
          link: 'https://learn.microsoft.com/en-us/certifications/azure-data-engineer/'
        },
        {
          name: 'AWS Cloud Practitioner',
          provider: 'Amazon Web Services',
          cost: '$100',
          duration: '1-2 months',
          level: 'Beginner',
          description: 'Entry-level AWS certification validating cloud knowledge.',
          link: 'https://aws.amazon.com/certification/certified-cloud-practitioner/'
        },
        {
          name: 'Google Cloud Associate Engineer',
          provider: 'Google Cloud',
          cost: '$125',
          duration: '2-4 months',
          level: 'Beginner',
          description: 'Associate-level certification for GCP engineering skills.',
          link: 'https://cloud.google.com/certification/cloud-engineer'
        },
        {
          name: 'Azure Solutions Architect Expert',
          provider: 'Microsoft',
          cost: '$165 per exam',
          duration: '4-8 months',
          level: 'Advanced',
          description: 'Expert-level certification for Azure architecture.',
          link: 'https://docs.microsoft.com/en-us/learn/certifications/azure-solutions-architect/'
        }
      ]
    },
    'data-science': {
      title: 'Data Science & Analytics',
      icon: '📊',
      resources: [
        {
          title: 'Web Scraping with Python',
          provider: 'DataQuest',
          type: 'Article/Tutorial',
          cost: 'Free',
          description: 'Complete guide to web scraping using Python and Beautiful Soup.',
          link: 'https://www.dataquest.io/blog/web-scraping-python-using-beautiful-soup/',
          skills: ['Python', 'Web Scraping', 'Beautiful Soup', 'Data Collection']
        },
        {
          title: 'Web Scraping Tutorial',
          provider: 'FreeCodeCamp',
          type: 'Article',
          cost: 'Free',
          description: 'Comprehensive web scraping tutorial for data extraction.',
          link: 'https://www.freecodecamp.org/news/web-scraping-python-tutorial-how-to-scrape-data-from-a-website/',
          skills: ['Web Scraping', 'Python', 'Data Extraction', 'Automation']
        },
        {
          title: 'Web Scraping with Python Course',
          provider: 'Simplilearn',
          type: 'Video Course',
          cost: 'Free',
          description: 'Video course on web scraping techniques and best practices.',
          link: 'https://www.simplilearn.com/tutorials/python-tutorial/web-scraping-with-python',
          skills: ['Web Scraping', 'Python', 'Data Mining', 'APIs']
        },
        {
          title: 'SQL Tutorial for Data Analysis',
          provider: 'Mode Analytics',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'SQL tutorial specifically designed for data analysis tasks.',
          link: 'https://mode.com/sql-tutorial/introduction-to-sql/',
          skills: ['SQL', 'Data Analysis', 'Queries', 'Analytics']
        },
        {
          title: 'Data Cleaning in Python',
          provider: 'W3 Schools',
          type: 'Tutorial',
          cost: 'Free',
          description: 'Complete guide to data cleaning using Python pandas.',
          link: 'https://www.w3schools.com/python/pandas/pandas_cleaning.asp',
          skills: ['Python', 'Pandas', 'Data Cleaning', 'Data Preprocessing']
        },
        {
          title: 'Data Cleaning - The Ultimate Guide',
          provider: 'Towards Data Science',
          type: 'Article',
          cost: 'Free',
          description: 'Comprehensive guide to data cleaning techniques and best practices.',
          link: 'https://towardsdatascience.com/data-cleaning-in-python-the-ultimate-guide-2020-c63b88bf0a0d',
          skills: ['Data Cleaning', 'Python', 'Data Quality', 'Preprocessing']
        },
        {
          title: 'Data Cleaning Course',
          provider: 'Coursera',
          type: 'Course',
          cost: 'Free (Audit)',
          description: 'Structured course on data cleaning methodologies and tools.',
          link: 'https://www.coursera.org/learn/data-cleaning',
          skills: ['Data Cleaning', 'Data Quality', 'Statistical Analysis']
        },
        {
          title: 'Comprehensive Data Exploration Guide',
          provider: 'Analytics Vidhya',
          type: 'Article',
          cost: 'Free',
          description: 'Complete guide to exploratory data analysis using Python.',
          link: 'https://www.analyticsvidhya.com/blog/2015/04/comprehensive-guide-data-exploration-sas-using-python-numpy-scipy-matplotlib-pandas/',
          skills: ['EDA', 'Python', 'Data Visualization', 'Statistical Analysis']
        },
        {
          title: 'Data Exploration with Python',
          provider: 'Kaggle',
          type: 'Notebook',
          cost: 'Free',
          description: 'Practical data exploration techniques with real datasets.',
          link: 'https://www.kaggle.com/code/pmarcelino/comprehensive-data-exploration-with-python/notebook',
          skills: ['Data Exploration', 'Python', 'Kaggle', 'Data Analysis']
        },
        {
          title: 'Exploratory Data Analysis Course',
          provider: 'Coursera',
          type: 'Course',
          cost: 'Free (Audit)',
          description: 'University-level course on exploratory data analysis techniques.',
          link: 'https://www.coursera.org/learn/exploratory-data-analysis',
          skills: ['EDA', 'Statistics', 'Data Visualization', 'R']
        },
        {
          title: 'ML Model Evaluation Introduction',
          provider: 'Comet ML',
          type: 'Article',
          cost: 'Free',
          description: 'Introduction to machine learning model evaluation techniques.',
          link: 'https://heartbeat.comet.ml/introduction-to-machine-learning-model-evaluation-fa859e1b2d7f',
          skills: ['Model Evaluation', 'Machine Learning', 'Validation', 'Metrics']
        },
        {
          title: 'Evaluating ML Models',
          provider: 'Medium',
          type: 'Article',
          cost: 'Free',
          description: 'Comprehensive guide to evaluating machine learning model performance.',
          link: 'https://medium.com/@skyl/evaluating-a-machine-learning-model-7cab1f597046',
          skills: ['Model Evaluation', 'Performance Metrics', 'Cross-validation']
        },
        {
          title: 'ML Model Evaluation and Selection',
          provider: 'Neptune AI',
          type: 'Article',
          cost: 'Free',
          description: 'Advanced techniques for model evaluation and selection.',
          link: 'https://neptune.ai/blog/ml-model-evaluation-and-selection',
          skills: ['Model Selection', 'Evaluation Metrics', 'Model Comparison']
        },
        {
          title: 'Regression Model Evaluation',
          provider: 'YouTube',
          type: 'Video',
          cost: 'Free',
          description: 'Video tutorial on evaluating regression models.',
          link: 'https://www.youtube.com/watch?v=FnGhTjq6dPA',
          skills: ['Regression', 'Model Evaluation', 'Performance Metrics']
        },
        {
          title: 'Classification Model Evaluation',
          provider: 'YouTube',
          type: 'Video',
          cost: 'Free',
          description: 'Video tutorial on evaluating classification models.',
          link: 'https://www.youtube.com/watch?v=ixX5H7RV9D0',
          skills: ['Classification', 'Model Evaluation', 'Confusion Matrix']
        },
        {
          title: 'ML Model Deployment Guide',
          provider: 'DataRobot',
          type: 'Article',
          cost: 'Free',
          description: 'Comprehensive guide to machine learning model deployment.',
          link: 'https://www.datarobot.com/wiki/machine-learning-model-deployment/',
          skills: ['Model Deployment', 'MLOps', 'Production', 'Scaling']
        },
        {
          title: 'How to Deploy ML Models',
          provider: 'Seldon',
          type: 'Article',
          cost: 'Free',
          description: 'Best practices for deploying machine learning models.',
          link: 'https://www.seldon.io/how-to-deploy-your-machine-learning-models',
          skills: ['Model Deployment', 'Kubernetes', 'Docker', 'APIs']
        },
        {
          title: 'ML Model Deployment Checklist',
          provider: 'Explorium',
          type: 'Article',
          cost: 'Free',
          description: 'Ultimate checklist for machine learning model deployment.',
          link: 'https://www.explorium.ai/blog/the-ultimate-machine-learning-model-deployment-checklist/',
          skills: ['Model Deployment', 'Checklist', 'Best Practices']
        },
        {
          title: 'Python for Data Science',
          provider: 'YouTube - Keith Galli',
          type: 'Video Series',
          cost: 'Free',
          description: 'Complete Python data science tutorial series with pandas and numpy.',
          link: 'https://www.youtube.com/playlist?list=PLFCB5Dp81iNVmuoGIqcT5oF4K-7kTI5vp',
          skills: ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Data Analysis']
        },
        {
          title: 'R Programming for Data Science',
          provider: 'R for Data Science Book',
          type: 'Book (Free Online)',
          cost: 'Free',
          description: 'Comprehensive guide to data science with R programming.',
          link: 'https://r4ds.had.co.nz/',
          skills: ['R', 'ggplot2', 'dplyr', 'Statistical Analysis']
        },
        {
          title: 'Introduction to Python for Data Science',
          provider: 'DataCamp',
          type: 'Interactive Course',
          cost: 'Free Trial',
          description: 'Hands-on introduction to Python for data science applications.',
          link: 'https://www.datacamp.com/courses/intro-to-python-for-data-science',
          skills: ['Python', 'Data Science', 'NumPy', 'Matplotlib']
        },
        {
          title: 'Python Programming Course',
          provider: 'Codecademy',
          type: 'Interactive Course',
          cost: 'Free Trial',
          description: 'Complete Python programming course with hands-on projects.',
          link: 'https://try.codecademy.com/learn-python-3',
          skills: ['Python', 'Programming', 'Object-Oriented Programming']
        },
        {
          title: 'Learn Python.org',
          provider: 'Learn Python',
          type: 'Interactive Tutorial',
          cost: 'Free',
          description: 'Free interactive Python tutorial with exercises.',
          link: 'https://www.learnpython.org/',
          skills: ['Python', 'Programming Basics', 'Syntax']
        },
        {
          title: 'Tableau Complete Tutorial',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Complete Tableau tutorial for data visualization.',
          link: 'https://www.youtube.com/watch?v=TPMlZxRRaBQ&t=773s',
          skills: ['Tableau', 'Data Visualization', 'Dashboard Creation']
        },
        {
          title: 'Power BI Complete Tutorial',
          provider: 'YouTube',
          type: 'Video Tutorial',
          cost: 'Free',
          description: 'Complete Power BI tutorial for business intelligence.',
          link: 'https://www.youtube.com/watch?v=sIxJCksa0K0',
          skills: ['Power BI', 'Business Intelligence', 'Data Visualization']
        },
        {
          title: 'Streamlit Tutorial',
          provider: 'YouTube Playlist',
          type: 'Video Series',
          cost: 'Free',
          description: 'Advanced Streamlit tutorials for creating data apps.',
          link: 'https://www.youtube.com/playlist?list=PLa6CNrvKM5QU7AjAS90zCMIwi9RTFNIIW',
          skills: ['Streamlit', 'Python', 'Web Apps', 'Data Visualization']
        },
        {
          title: 'Tableau Public Training',
          provider: 'Tableau',
          type: 'Video Training',
          cost: 'Free',
          description: 'Free Tableau training videos and resources.',
          link: 'https://public.tableau.com/en-us/s/resources',
          skills: ['Tableau', 'Data Visualization', 'Dashboard Creation']
        }
      ],
      certifications: [
        {
          name: 'Google Data Analytics Certificate',
          provider: 'Google',
          cost: '$39/month (Coursera)',
          duration: '3-6 months',
          level: 'Beginner',
          description: 'Professional certificate in data analytics and visualization.',
          link: 'https://www.coursera.org/professional-certificates/google-data-analytics'
        },
        {
          name: 'Tableau Desktop Specialist',
          provider: 'Tableau',
          cost: '$100',
          duration: '1-2 months',
          level: 'Beginner',
          description: 'Entry-level Tableau certification for data visualization.',
          link: 'https://www.tableau.com/learn/certification'
        }
      ]
    },
    'mobile-development': {
      title: 'Mobile App Development',
      icon: '📱',
      resources: [
        {
          title: 'Flutter Development Course',
          provider: 'YouTube - The Net Ninja',
          type: 'Video Course',
          cost: 'Free',
          description: 'Complete Flutter course for cross-platform mobile development.',
          link: 'https://www.youtube.com/playlist?list=PL4cUxeGkcC9jLYyp2Aoh6hcWuxFDX6PBJ',
          skills: ['Flutter', 'Dart', 'Cross-platform', 'Mobile UI']
        },
        {
          title: 'React Native Tutorial',
          provider: 'React Native Docs',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official React Native documentation and tutorials.',
          link: 'https://reactnative.dev/docs/getting-started',
          skills: ['React Native', 'JavaScript', 'Mobile Development']
        },
        {
          title: 'iOS Development with Swift',
          provider: 'Apple Developer',
          type: 'Documentation',
          cost: 'Free',
          description: 'Official iOS development resources and Swift programming guide.',
          link: 'https://developer.apple.com/swift/',
          skills: ['Swift', 'iOS', 'Xcode', 'UIKit']
        },
        {
          title: 'Android Development with Kotlin',
          provider: 'Android Developers',
          type: 'Course',
          cost: 'Free',
          description: 'Official Android development course using Kotlin.',
          link: 'https://developer.android.com/courses',
          skills: ['Kotlin', 'Android', 'Android Studio', 'Material Design']
        }
      ],
      certifications: [
        {
          name: 'Google Associate Android Developer',
          provider: 'Google',
          cost: '$149',
          duration: '2-4 months',
          level: 'Intermediate',
          description: 'Professional Android development certification.',
          link: 'https://developers.google.com/certification/associate-android-developer'
        },
        {
          name: 'Meta React Native Certificate',
          provider: 'Meta',
          cost: '$39/month (Coursera)',
          duration: '4-6 months',
          level: 'Intermediate',
          description: 'Professional certificate for React Native development.',
          link: 'https://www.coursera.org/professional-certificates/meta-react-native-developer'
        }
      ]
    },
    'other-careers': {
      title: 'Other Tech Careers',
      icon: '🌟',
      resources: [
        {
          title: 'Technical Writing Course',
          provider: 'Google Technical Writing',
          type: 'Course',
          cost: 'Free',
          description: 'Google technical writing course for creating clear documentation.',
          link: 'https://developers.google.com/tech-writing',
          skills: ['Technical Writing', 'Documentation', 'Communication']
        },
        {
          title: 'IT Project Management',
          provider: 'PMI',
          type: 'Resources',
          cost: 'Free',
          description: 'Project management resources and guides from PMI.',
          link: 'https://www.pmi.org/learning/library',
          skills: ['Project Management', 'Agile', 'Scrum', 'Leadership']
        },
        {
          title: 'Business Analysis Fundamentals',
          provider: 'IIBA',
          type: 'Guide',
          cost: 'Free',
          description: 'Business analysis body of knowledge and best practices.',
          link: 'https://www.iiba.org/',
          skills: ['Business Analysis', 'Requirements', 'Stakeholder Management']
        },
        {
          title: 'Sales Engineering Resources',
          provider: 'SalesHacker',
          type: 'Articles/Courses',
          cost: 'Free',
          description: 'Sales engineering resources and training materials.',
          link: 'https://www.saleshacker.com/',
          skills: ['Sales Engineering', 'Technical Sales', 'Customer Success']
        },
        {
          title: 'IT Support Fundamentals',
          provider: 'CompTIA',
          type: 'Study Materials',
          cost: 'Free',
          description: 'IT support fundamentals and troubleshooting guides.',
          link: 'https://www.comptia.org/certifications/a',
          skills: ['IT Support', 'Hardware', 'Software', 'Troubleshooting']
        }
      ],
      certifications: [
        {
          name: 'PMP (Project Management Professional)',
          provider: 'PMI',
          cost: '$405 (Members) / $555 (Non-members)',
          duration: '3-6 months',
          level: 'Advanced',
          description: 'Global standard for project management certification.',
          link: 'https://www.pmi.org/certifications/project-management-pmp'
        },
        {
          name: 'Certified Business Analysis Professional',
          provider: 'IIBA',
          cost: '$325 (Members) / $450 (Non-members)',
          duration: '6-12 months',
          level: 'Advanced',
          description: 'Professional certification for business analysts.',
          link: 'https://www.iiba.org/career-resources/a-business-analysis-professionals-foundation-for-success/certifications/cbap/'
        },
        {
          name: 'CompTIA A+',
          provider: 'CompTIA',
          cost: '$370 per exam (2 exams required)',
          duration: '2-4 months',
          level: 'Beginner',
          description: 'Entry-level IT certification covering hardware and software.',
          link: 'https://www.comptia.org/certifications/a'
        }
      ]
    }
  };

  const tabs = [
    { id: 'career-guidance', label: '🎯 Career Guidance', shortLabel: '🎯' },
    { id: 'software-engineering', label: '💻 Software Engineering', shortLabel: '💻' },
    { id: 'interview-prep', label: '🎤 Interview Prep', shortLabel: '🎤' },
    { id: 'frontend', label: '🎨 Frontend', shortLabel: '🎨' },
    { id: 'backend', label: '⚙️ Backend', shortLabel: '⚙️' },
    { id: 'devops', label: '🔧 DevOps', shortLabel: '🔧' },
    { id: 'cybersecurity', label: '🔒 Cybersecurity', shortLabel: '🔒' },
    { id: 'product-management', label: '📋 Product Mgmt', shortLabel: '📋' },
    { id: 'ai-ml', label: '🤖 AI & ML', shortLabel: '🤖' },
    { id: 'cloud-engineering', label: '☁️ Cloud', shortLabel: '☁️' },
    { id: 'data-science', label: '📊 Data Science', shortLabel: '📊' },
    { id: 'mobile-development', label: '📱 Mobile', shortLabel: '📱' },
    { id: 'other-careers', label: '🌟 Other Tech', shortLabel: '🌟' }
  ];

  const currentData = resourcesData[activeTab];
  
  // Filter resources based on search term
  const filteredResources = currentData?.resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const filteredCertifications = currentData?.certifications.filter(cert =>
    cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cert.provider.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div 
      className="min-h-screen flex flex-col relative"
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

      {/* Enhanced Header with Navigation Menu */}
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

                  {/* CURRENT PAGE INDICATOR */}
                  <div className="text-lime-400 font-semibold text-sm lg:text-base border-b-2 border-lime-400 pb-1"
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Resources Hub
                  </div>
                </>
              ) : (
                /* LOGGED OUT USER NAVIGATION */
                <>
                  <Link to="/career" className="text-white/90 hover:text-lime-400 font-semibold transition-all duration-300 relative group text-sm lg:text-base" 
                        style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Career
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-green-500 group-hover:w-full transition-all duration-300"></span>
                  </Link>

                  {/* CURRENT PAGE INDICATOR */}
                  <div className="text-lime-400 font-semibold text-sm lg:text-base border-b-2 border-lime-400 pb-1"
                       style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                    Resources Hub
                  </div>
                </>
              )}
            </nav>
            
            <div className="flex items-center space-x-2 lg:space-x-4">
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
              
              {/* Mobile Menu Button */}
              <div className="md:hidden ml-4">
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

                    {/* CURRENT PAGE INDICATOR */}
                    <div className="text-lime-400 font-semibold text-base sm:text-lg border-l-4 border-lime-400 pl-4"
                         style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Resources Hub
                    </div>
                  </>
                ) : (
                  /* LOGGED OUT USER MOBILE NAVIGATION */
                  <>
                    <Link to="/career" 
                          className="text-white hover:text-lime-400 font-semibold transition-colors text-base sm:text-lg" 
                          style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
                          onClick={() => setMobileMenuOpen(false)}>
                      Career
                    </Link>

                    {/* CURRENT PAGE INDICATOR */}
                    <div className="text-lime-400 font-semibold text-base sm:text-lg border-l-4 border-lime-400 pl-4"
                         style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
                      Resources Hub
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Add top padding to account for fixed header */}
      <div className="pt-20 sm:pt-24">
        {/* Header */}
        <div className="bg-gradient-to-r from-lime-500 via-green-500 to-emerald-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400/20 via-green-400/20 to-emerald-400/20 animate-pulse"></div>
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight" 
                  style={{
                    textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.5)',
                    fontFamily: '"Inter", sans-serif'
                  }}>
                Career Learning Resources Hub 🚀
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl opacity-90 mb-6 sm:mb-8 font-light" 
                 style={{
                   textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                   fontFamily: '"Inter", sans-serif'
                 }}>
                Free and premium learning resources for every tech career path
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search resources, providers, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-6 py-4 text-lg rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                    style={{fontFamily: '"Inter", sans-serif'}}
                  />
                  <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-20 sm:top-24 z-40" 
             style={{background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
          <div className="container mx-auto px-2 sm:px-4 relative">
            {/* Left scroll button */}
            <button 
              onClick={() => {
                const container = document.querySelector('.tab-scroll-container');
                container.scrollBy({ left: -200, behavior: 'smooth' });
              }}
              className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/90 to-transparent z-10 flex items-center justify-center hover:from-black/100 transition-all duration-300 group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-lime-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Right scroll button */}
            <button 
              onClick={() => {
                const container = document.querySelector('.tab-scroll-container');
                container.scrollBy({ left: 200, behavior: 'smooth' });
              }}
              className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/90 to-transparent z-10 flex items-center justify-center hover:from-black/100 transition-all duration-300 group"
            >
              <svg className="w-6 h-6 text-gray-400 group-hover:text-lime-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="flex justify-start overflow-x-auto scrollbar-hide scroll-smooth tab-scroll-container">
              <div className="flex space-x-1 min-w-max px-12">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 sm:px-4 lg:px-6 py-3 sm:py-4 font-bold transition-all duration-300 border-b-2 whitespace-nowrap text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'border-lime-500 text-lime-400 bg-white/10'
                        : 'border-transparent text-gray-300 hover:text-lime-400 hover:bg-white/5'
                    }`}
                    style={{
                      textShadow: activeTab === tab.id ? '0 0 10px rgba(76, 175, 80, 0.8)' : '1px 1px 2px rgba(0,0,0,0.8)',
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile scroll hint */}
            <div className="sm:hidden absolute bottom-2 right-4 text-xs text-gray-500 animate-bounce">
              ← → Scroll for more
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
          {currentData && (
            <div className="space-y-8">
              {/* Section Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4" 
                    style={{
                      textShadow: '0 0 30px rgba(255,255,255,0.3), 3px 3px 6px rgba(0,0,0,0.9)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  {currentData.icon} {currentData.title} Resources
                </h2>
                <div className="flex justify-center space-x-4 text-sm text-gray-300">
                  <span>📚 {filteredResources.length} Learning Resources</span>
                  <span>🎓 {filteredCertifications.length} Certifications</span>
                </div>
              </div>

              {/* Career Intelligence Dashboard - Only for Career Guidance */}
              {activeTab === 'career-guidance' && <CareerInsightsHeader />}

              {/* Learning Resources Section */}
              <div className="mb-12">
                <h3 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-2xl mr-3">📚</span>
                  {activeTab === 'career-guidance' ? 'Comprehensive Career Guidance' : 'Free Learning Resources'}
                </h3>
                
                {activeTab === 'career-guidance' ? (
                  <div className="space-y-8">
                    {/* Career Transition and Planning */}
                    <div className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-teal-600/20 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/30">
                      <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-3xl mr-3">🎯</span>
                        Career Planning and Transition Strategy
                      </h4>
                      <div className="text-gray-200 leading-relaxed space-y-4">
                        <p>
                          Building a successful tech career requires strategic planning and continuous adaptation. Our comprehensive analysis of over {videoAnalysisData.project_info.total_videos_analyzed} expert videos reveals that the most successful professionals start with foundational programming skills before specializing in specific domains. The key is to understand that technology changes rapidly, making adaptability and continuous learning your most valuable assets.
                        </p>
                        <p>
                          When transitioning into tech, focus on building a portfolio showcasing real-world projects rather than just completing tutorials. Employers value demonstrated ability over theoretical knowledge. Start with 2-3 substantial projects that solve actual problems, document your code well, and deploy them live. This approach demonstrates both technical skills and practical application.
                        </p>
                        <p>
                          Professional networking within your chosen tech domain cannot be overstated. Engage actively on platforms like GitHub, LinkedIn, and Twitter. Attend local meetups and tech events. Contributing to open source projects not only builds your skills but also establishes your presence in the community. Remember, many opportunities come through connections rather than traditional applications.
                        </p>
                      </div>
                    </div>

                    {/* High-Demand Skills and Market Analysis */}
                    <div className="bg-gradient-to-br from-green-600/20 via-emerald-600/20 to-teal-600/20 backdrop-blur-xl rounded-2xl p-8 border border-green-500/30">
                      <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-3xl mr-3">🔥</span>
                        Market-Driven Skill Development
                      </h4>
                      <div className="text-gray-200 leading-relaxed space-y-4">
                        <p>
                          Current market analysis shows that <strong>Artificial Intelligence and Machine Learning</strong> leads demand with a 95% importance score, followed closely by <strong>Cloud Computing</strong> (AWS, Azure, GCP) at 92%. These aren't just trending topics—they represent fundamental shifts in how technology operates. AI/ML skills open doors to roles like ML Engineer, Data Scientist, and AI Researcher, with growth trends remaining very high.
                        </p>
                        <p>
                          <strong>Cybersecurity</strong> maintains critical importance (90% score) as digital threats evolve. This field offers stable career paths as Security Analyst, Penetration Tester, or CISO. Meanwhile, <strong>Full-Stack Development</strong> remains the reliable foundation (88% score) for software engineers, providing versatility across frontend and backend technologies.
                        </p>
                        <p>
                          <strong>Data Science and Analytics</strong> continues strong growth (87% score) as organizations become increasingly data-driven. The key insight from industry analysis is that specialization in 1-2 areas yields better results than surface-level knowledge across many domains. Assess your natural strengths, research market demand in your region, and test different areas through projects before committing to deep expertise development.
                        </p>
                      </div>
                    </div>

                    {/* Expert-Backed Career Strategies */}
                    <div className="bg-gradient-to-br from-orange-600/20 via-red-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-8 border border-orange-500/30">
                      <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-3xl mr-3">💡</span>
                        Expert-Validated Success Strategies
                      </h4>
                      <div className="text-gray-200 leading-relaxed space-y-4">
                        <p>
                          The most frequently cited advice from industry experts emphasizes <strong>continuous learning</strong> as non-negotiable. Technology evolves rapidly—commit to lifelong learning by dedicating 20% of your time to acquiring new skills. Follow industry leaders, subscribe to tech newsletters, and attend conferences regularly. This isn't just about staying current; it's about anticipating future trends and positioning yourself ahead of the curve.
                        </p>
                        <p>
                          <strong>Portfolio development</strong> emerged as the second most critical factor. Build 3-5 substantial projects showcasing different skills, ensuring they represent real-world applications rather than tutorial walkthroughs. Include clear documentation explaining your decision-making process and technical choices. Deploy projects live and maintain active GitHub repositories—these serve as your professional credibility in the tech industry.
                        </p>
                        <p>
                          <strong>Professional networking</strong> consistently ranks high among success factors. This extends beyond collecting LinkedIn connections to meaningful engagement with the tech community. Contribute to open source projects, write technical blog posts, speak at local meetups, and eventually mentor others. The tech community values knowledge sharing and collaboration, making networking a natural extension of professional growth rather than a separate activity.
                        </p>
                      </div>
                    </div>

                    {/* Level-Specific Action Plans */}
                    <div className="bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-8 border border-indigo-500/30">
                      <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-3xl mr-3">📈</span>
                        Progressive Career Development Framework
                      </h4>
                      <div className="text-gray-200 leading-relaxed space-y-4">
                        <p>
                          <strong>Entry-Level Professionals (3-6 months per skill):</strong> Focus on foundation building by choosing one programming language and mastering fundamentals thoroughly. Build 2-3 beginner projects and deploy them to demonstrate practical application. Create professional GitHub and LinkedIn profiles showcasing your work. Start networking through online communities and apply for entry-level positions or internships. The goal is establishing credibility and gaining real-world experience.
                        </p>
                        <p>
                          <strong>Mid-Career Professionals (6-12 months per major skill):</strong> Transition toward specialization and leadership. Develop deep expertise in your chosen area while leading significant projects or team initiatives. Begin mentoring junior developers and contributing to technical decision-making processes. Build industry recognition through speaking engagements or technical writing. This phase is about establishing yourself as a subject matter expert.
                        </p>
                        <p>
                          <strong>Senior-Level Professionals (12+ months per initiative):</strong> Focus on strategic leadership by driving technical strategy and architecture decisions. Build and lead high-performing technical teams while establishing thought leadership in your domain. Create scalable processes and best practices that influence product and business strategy. At this level, your impact extends beyond individual contributions to organizational and industry influence.
                        </p>
                      </div>
                    </div>

                    {/* Career Path Analysis */}
                    <div className="bg-gradient-to-br from-teal-600/20 via-cyan-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-8 border border-teal-500/30">
                      <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-3xl mr-3">🛤️</span>
                        Strategic Career Path Selection
                      </h4>
                      <div className="text-gray-200 leading-relaxed space-y-4">
                        <p>
                          <strong>Software Engineering</strong> offers the most accessible entry point with very high demand and excellent growth potential. Entry-level positions start at $70-90k, progressing to $90-140k mid-career, and $140-200k+ for senior roles. The 6-12 month timeline makes it attractive for career changers. Core skills include programming, system design, problem-solving, and testing methodologies.
                        </p>
                        <p>
                          <strong>Data Science</strong> requires a longer investment (8-15 months) but offers higher earning potential, ranging from $75-95k entry-level to $150-220k+ senior positions. This path demands proficiency in Python/R, statistics, machine learning, and data visualization. The field suits analytically-minded individuals who enjoy extracting insights from complex datasets.
                        </p>
                        <p>
                          <strong>Product Management</strong> presents unique opportunities for those who prefer strategy over coding. With 6-10 month preparation timelines, salaries range from $80-100k entry-level to $160-250k+ senior positions. Success requires strong skills in strategy, analytics, communication, and user research. This path suits individuals who excel at connecting technical capabilities with business objectives and user needs.
                        </p>
                      </div>
                    </div>

                    {/* Key Resources and Next Steps */}
                    <div className="bg-gradient-to-br from-yellow-600/20 via-orange-600/20 to-red-600/20 backdrop-blur-xl rounded-2xl p-8 border border-yellow-500/30">
                      <h4 className="text-2xl font-bold text-white mb-4 flex items-center">
                        <span className="text-3xl mr-3">🚀</span>
                        Essential Resources and Immediate Actions
                      </h4>
                      <div className="text-gray-200 leading-relaxed space-y-4">
                        <p>
                          Start with the foundational video guide <a href="https://youtu.be/m-E6TeNjxj4" target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:text-lime-300 underline font-semibold">"Understanding Yourself in Tech"</a> which provides essential framework for career planning and self-assessment. This comprehensive resource covers career transition strategies, skill development priorities, industry trends, and professional growth pathways specifically tailored for tech careers.
                        </p>
                        <p>
                          Based on our analysis of expert recommendations, your immediate actions should include: conducting honest self-assessment of your strengths and interests, researching market demand for different specializations in your target location, and beginning to test different areas through small projects or internships. Don't try to learn everything at once—focus on 1-2 areas for deep expertise development.
                        </p>
                        <p>
                          Remember that career development in tech is not linear. The industry rewards continuous learning, adaptability, and genuine problem-solving ability over rigid career planning. Stay updated with industry trends, maintain strong professional networks, and always be building something that demonstrates your capabilities. Your next opportunity often comes from connections and demonstrated expertise rather than traditional job applications.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : filteredResources.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredResources.map((resource, index) => (
                      <ResourceCard key={index} {...resource} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-400">No resources found matching "{searchTerm}"</p>
                  </div>
                )}
              </div>

              {/* Certifications Section */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-6 flex items-center" 
                    style={{
                      textShadow: '0 0 20px rgba(255,255,255,0.3)',
                      fontFamily: '"Inter", sans-serif'
                    }}>
                  <span className="text-2xl mr-3">🎓</span>
                  Professional Certifications
                </h3>
                
                {filteredCertifications.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredCertifications.map((cert, index) => (
                      <CertificationCard key={index} {...cert} />
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-400">No certifications found matching "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🎓</div>
                    <p className="text-gray-400">No certifications available for this category yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating elements for visual appeal */}
      <div className="fixed top-1/4 left-4 w-16 h-16 bg-lime-400/10 rounded-full blur-xl animate-bounce opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-1/4 right-4 w-24 h-24 bg-green-400/10 rounded-full blur-xl animate-pulse opacity-60 pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/4 w-12 h-12 bg-emerald-400/10 rounded-full blur-xl animate-ping opacity-60 pointer-events-none"></div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');
        
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
      `}</style>
    </div>
  );
};

export default CareerResourcesHub;
