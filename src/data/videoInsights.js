// src/data/videoInsights.js
// Enhanced with comprehensive analysis from JSON data files

// Import both JSON files (now in src/data/ directory)
import comprehensiveTechCareersJson from './COMPREHENSIVE_TECH_CAREER_VIDEOS_ANALYSIS_20250522_162024.json';
import growTechCareersJson from './COMPREHENSIVE_GROW_TECH_CAREERS_ANALYSIS_20250522_173825.json';

class VideoAnalysisDataManager {
  constructor() {
    this.rawData = {
      comprehensive: comprehensiveTechCareersJson,
      growth: growTechCareersJson
    };
  }

  // Process and merge data from both JSON files
  processData() {
    const comprehensive = this.rawData.comprehensive;
    const growth = this.rawData.growth;

    return {
      project_info: this.extractProjectInfo(comprehensive, growth),
      detailed_video_analyses: this.mergeVideoAnalyses(comprehensive, growth),
      trending_skills: this.extractTrendingSkills(comprehensive, growth),
      career_advice_patterns: this.extractCareerAdvicePatterns(comprehensive, growth),
      actionable_steps_by_level: this.extractActionableSteps(comprehensive, growth),
      career_path_insights: this.extractCareerPaths(comprehensive, growth),
      market_trends: this.extractMarketTrends(comprehensive, growth)
    };
  }

  extractProjectInfo(comprehensive, growth) {
    return {
      title: comprehensive?.project_metadata?.title || "Comprehensive Tech Career Video Analysis",
      description: comprehensive?.project_metadata?.description || "Complete analysis of tech career guidance videos",
      total_videos_analyzed: (comprehensive?.project_metadata?.successful_analyses || 0) + 
                            (growth?.project_metadata?.successful_analyses || 0),
      detailed_analysis_videos: (comprehensive?.project_metadata?.successful_extractions || 0) + 
                               (growth?.project_metadata?.successful_extractions || 0),
      processing_date: comprehensive?.project_metadata?.processing_date || growth?.project_metadata?.processing_date || "2025-05-22",
      methodology: comprehensive?.project_metadata?.analysis_methodology?.consensus_approach || 
                  "Multi-prompt self-consistency for career growth analysis",
      data_sources: {
        comprehensive_analysis: comprehensive?.project_metadata?.title || "Comprehensive Tech Career Analysis",
        growth_analysis: growth?.project_metadata?.title || "Growth Tech Career Analysis"
      }
    };
  }

  mergeVideoAnalyses(comprehensive, growth) {
    const merged = {};
    
    // Merge video analyses from comprehensive dataset
    if (comprehensive?.video_analyses) {
      Object.entries(comprehensive.video_analyses).forEach(([videoId, analysis]) => {
        merged[videoId] = {
          ...analysis,
          source: 'comprehensive',
          title: analysis.final_video_summary?.title || analysis.title,
          url: analysis.final_video_summary?.url || analysis.url,
          focus: analysis.final_video_summary?.focus || "Career Growth and Professional Development",
          key_themes: analysis.final_video_summary?.key_themes || analysis.key_themes || [],
          comprehensive_summary: analysis.final_video_summary?.comprehensive_summary || analysis.summary,
          actionable_insights: analysis.final_video_summary?.actionable_insights || analysis.insights || [],
          target_audience: analysis.final_video_summary?.target_audience || "Tech professionals",
          career_paths: analysis.final_video_summary?.career_paths || []
        };
      });
    }

    // Merge video analyses from growth dataset
    if (growth?.video_analyses) {
      Object.entries(growth.video_analyses).forEach(([videoId, analysis]) => {
        if (!merged[videoId]) {
          merged[videoId] = {
            ...analysis,
            source: 'growth',
            title: analysis.final_video_summary?.title || analysis.title,
            url: analysis.final_video_summary?.url || analysis.url,
            focus: analysis.final_video_summary?.focus || "Career Growth and Professional Development",
            key_themes: analysis.final_video_summary?.key_themes || analysis.key_themes || [],
            comprehensive_summary: analysis.final_video_summary?.comprehensive_summary || analysis.summary,
            actionable_insights: analysis.final_video_summary?.actionable_insights || analysis.insights || [],
            target_audience: analysis.final_video_summary?.target_audience || "Tech professionals",
            career_paths: analysis.final_video_summary?.career_paths || []
          };
        }
      });
    }

    return merged;
  }

  extractTrendingSkills(comprehensive, growth) {
    const skillsMap = new Map();
    
    // Extract skills from both datasets
    [comprehensive, growth].forEach(dataset => {
      if (dataset?.trending_skills) {
        dataset.trending_skills.forEach(skill => {
          const key = skill.name || skill.skill;
          if (skillsMap.has(key)) {
            const existing = skillsMap.get(key);
            existing.frequency += skill.frequency || 1;
            existing.mentions = (existing.mentions || 1) + 1;
          } else {
            skillsMap.set(key, {
              name: key,
              frequency: skill.frequency || 1,
              growth_trend: skill.growth_trend || 'Stable',
              category: skill.category || 'General',
              importance_score: skill.importance_score || 70,
              related_roles: skill.related_roles || [],
              learning_resources: skill.learning_resources || [],
              mentions: 1
            });
          }
        });
      }
    });

    return Array.from(skillsMap.values())
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0));
  }

  extractCareerAdvicePatterns(comprehensive, growth) {
    const patterns = [];
    
    [comprehensive, growth].forEach(dataset => {
      if (dataset?.career_advice_patterns) {
        dataset.career_advice_patterns.forEach(pattern => {
          patterns.push({
            theme: pattern.theme || pattern.category,
            frequency: pattern.frequency || 1,
            description: pattern.description || pattern.summary,
            key_points: pattern.key_points || pattern.points || [],
            practical_steps: pattern.practical_steps || pattern.steps || [],
            success_metrics: pattern.success_metrics || pattern.metrics || [],
            source: dataset.project_metadata?.title || 'Unknown'
          });
        });
      }
    });

    return patterns;
  }

  extractActionableSteps(comprehensive, growth) {
    const stepsByLevel = {
      'Entry-Level': {
        core_focus: 'Foundation Building',
        time_investment: '3-6 months per skill',
        steps: []
      },
      'Mid-Career': {
        core_focus: 'Specialization & Leadership',
        time_investment: '6-12 months per major skill',
        steps: []
      },
      'Senior-Level': {
        core_focus: 'Strategic Leadership',
        time_investment: '12+ months per initiative',
        steps: []
      }
    };

    [comprehensive, growth].forEach(dataset => {
      if (dataset?.actionable_steps_by_level) {
        Object.entries(dataset.actionable_steps_by_level).forEach(([level, data]) => {
          if (stepsByLevel[level] && data.steps) {
            stepsByLevel[level].steps.push(...data.steps);
          }
        });
      }
    });

    return stepsByLevel;
  }

  extractCareerPaths(comprehensive, growth) {
    const pathsMap = new Map();

    [comprehensive, growth].forEach(dataset => {
      if (dataset?.career_path_insights) {
        dataset.career_path_insights.forEach(path => {
          const key = path.path || path.title;
          if (!pathsMap.has(key)) {
            pathsMap.set(key, {
              path: key,
              demand: path.demand || 'Medium',
              skills: path.skills || [],
              timeline: path.timeline || '6-12 months',
              salary_range: path.salary_range || {},
              growth_potential: path.growth_potential || 'Good',
              market_outlook: path.market_outlook || 'Stable',
              key_companies: path.key_companies || []
            });
          }
        });
      }
    });

    return Array.from(pathsMap.values());
  }

  extractMarketTrends(comprehensive, growth) {
    const trends = [];

    [comprehensive, growth].forEach(dataset => {
      if (dataset?.market_trends) {
        dataset.market_trends.forEach(trend => {
          trends.push({
            trend: trend.trend || trend.title,
            impact: trend.impact || 'Medium',
            timeline: trend.timeline || '2025-2026',
            action_items: trend.action_items || trend.actions || []
          });
        });
      }
    });

    return trends;
  }

  getFallbackData() {
    // Return the original hardcoded data as fallback
    return {
      project_info: {
        title: "Tech Career Video Analysis (Fallback)",
        description: "Fallback data when JSON files cannot be loaded",
        total_videos_analyzed: 0,
        processing_date: "2025-05-22"
      },
      detailed_video_analyses: {},
      trending_skills: [],
      career_advice_patterns: [],
      actionable_steps_by_level: {},
      career_path_insights: [],
      market_trends: []
    };
  }
}

// Initialize the data manager
const dataManager = new VideoAnalysisDataManager();

// Process the data (using direct imports by default)
export const videoAnalysisData = {
  ...dataManager.processData(),
  
  // Utility functions for data analysis
  getSkillsByCategory: function(category) {
    return this.trending_skills.filter(skill => skill.category === category);
  },

  getCareerPathsByDemand: function(demandLevel) {
    return this.career_path_insights.filter(path => path.demand === demandLevel);
  },

  getActionableStepsByLevel: function(level) {
    return this.actionable_steps_by_level[level] || null;
  },

  getAdviceByTheme: function(theme) {
    return this.career_advice_patterns.find(pattern => 
      pattern.theme.toLowerCase().includes(theme.toLowerCase())
    );
  },

  getVideoSummary: function(videoId) {
    return this.detailed_video_analyses?.[videoId]?.comprehensive_summary || null;
  },

  // New utility functions for enhanced functionality
  getSkillsByImportance: function(minScore = 80) {
    return this.trending_skills.filter(skill => skill.importance_score >= minScore);
  },

  getVideosByTheme: function(theme) {
    return Object.entries(this.detailed_video_analyses)
      .filter(([_, analysis]) => 
        analysis.key_themes?.some(t => 
          t.toLowerCase().includes(theme.toLowerCase())
        )
      )
      .map(([id, analysis]) => ({ id, ...analysis }));
  },

  getTrendsByImpact: function(impactLevel = 'High') {
    return this.market_trends.filter(trend => trend.impact === impactLevel);
  }
};

// Export individual components for modular use
export const {
  project_info,
  detailed_video_analyses,
  trending_skills,
  career_advice_patterns,
  actionable_steps_by_level,
  career_path_insights,
  market_trends
} = videoAnalysisData;

// Enhanced helper functions
export const CareerDataHelpers = {
  // Get recommendations for a specific career level
  getRecommendationsForLevel: (level) => {
    const steps = videoAnalysisData.getActionableStepsByLevel(level);
    const relevantSkills = trending_skills.filter(skill => 
      skill.importance_score > 80
    );
    
    return {
      actionable_steps: steps,
      priority_skills: relevantSkills,
      estimated_timeline: steps?.time_investment || 'Variable'
    };
  },

  // Get skills roadmap for a specific career path
  getSkillsRoadmap: (careerPath) => {
    const pathInfo = career_path_insights.find(path => 
      path.path.toLowerCase().includes(careerPath.toLowerCase())
    );
    
    if (!pathInfo) return null;
    
    return {
      path: pathInfo.path,
      required_skills: pathInfo.skills,
      timeline: pathInfo.timeline,
      salary_progression: pathInfo.salary_range,
      market_demand: pathInfo.demand
    };
  },

  // Get trending skills by importance
  getTopSkills: (limit = 10) => {
    return trending_skills
      .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
      .slice(0, limit);
  },

  // Get market trends by impact
  getHighImpactTrends: () => {
    return market_trends.filter(trend => 
      trend.impact === 'High' || trend.impact === 'Very High'
    );
  },

  // New helper functions for JSON data
  getVideoAnalysisBySource: (source) => {
    return Object.entries(detailed_video_analyses)
      .filter(([_, analysis]) => analysis.source === source)
      .reduce((acc, [id, analysis]) => ({ ...acc, [id]: analysis }), {});
  },

  getSkillFrequencyReport: () => {
    return trending_skills
      .sort((a, b) => (b.frequency || 0) - (a.frequency || 0))
      .map(skill => ({
        name: skill.name,
        frequency: skill.frequency,
        mentions: skill.mentions || 1,
        category: skill.category
      }));
  },

  getCareerPathComparison: (path1, path2) => {
    const paths = [path1, path2].map(pathName => 
      career_path_insights.find(path => 
        path.path.toLowerCase().includes(pathName.toLowerCase())
      )
    );
    
    return {
      comparison: paths,
      commonSkills: paths[0]?.skills?.filter(skill => 
        paths[1]?.skills?.includes(skill)
      ) || []
    };
  }
};

export default videoAnalysisData;
