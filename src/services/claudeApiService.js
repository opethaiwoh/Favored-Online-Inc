// src/services/claudeApiService.js with fixes
import { CLAUDE_API_CONFIG, CLAUDE_PROMPTS } from '../config/claudeApiConfig';
import storageService from './storageService';

class ClaudeApiService {
  /**
   * Generate form field suggestions based on typical tech enthusiast profile
   * @returns {Promise<string>} The suggested form responses
   */
  async getFormSuggestions() {
    try {
      console.log("Calling Claude API for form suggestions");
      
      const requestBody = {
        model: CLAUDE_API_CONFIG.models.default,
        max_tokens: CLAUDE_API_CONFIG.maxTokens.formSuggestions,
        messages: [
          {
            role: "user",
            content: CLAUDE_PROMPTS.formSuggestions
          }
        ]
      };
      
      console.log("Request details:", {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens
      });
      
      // CRITICAL FIX: Using the correct API endpoint '/api/claude-proxy'
      const response = await fetch('/api/claude-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Received successful response from Claude API");
      return data.content[0].text;
    } catch (error) {
      console.error('Error getting form suggestions from Claude API:', error);
      throw error;
    }
  }

  /**
   * Analyze the submitted form data and generate career path recommendations
   * @param {Object} formData The user's form responses
   * @returns {Promise<string>} The career path analysis and recommendations
   */
  async analyzeCareerPath(formData) {
    try {
      console.log("Calling Claude API for career analysis");
      
      // Log important new fields to help with debugging
      console.log("Key form data fields:", {
        educationLevel: formData.educationLevel || 'Not provided',
        studyField: formData.studyField || 'Not provided',
        publications: formData.publications ? 'Provided' : 'Not provided'
      });
      
      // Use the updated prompt from configuration that highlights important questions
      const requestBody = {
        model: CLAUDE_API_CONFIG.models.default,
        max_tokens: CLAUDE_API_CONFIG.maxTokens.careerAnalysis,
        messages: [
          {
            role: "user",
            content: CLAUDE_PROMPTS.careerAnalysis(formData)
          }
        ]
      };
      
      console.log("Request details:", {
        model: requestBody.model,
        max_tokens: requestBody.max_tokens
      });
      
      // CRITICAL FIX: Using the correct API endpoint '/api/claude-proxy'
      const response = await fetch('/api/claude-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        let errorText;
        try {
          // Try to parse as JSON first
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch {
          // If not JSON, get as text
          errorText = await response.text();
        }
        console.error("API Error Response:", errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Received successful response from Claude API");
      
      // DEBUGGING: Log the actual response text
      const responseText = data.content[0].text;
      console.log("=== CLAUDE RESPONSE START ===");
      console.log(responseText);
      console.log("=== CLAUDE RESPONSE END ===");
      
      // Log first 500 characters to see format
      console.log("First 500 chars:", responseText.substring(0, 500));
      
      // Check if Skills Gap section exists
      const hasSkillsGap = responseText.includes("SKILLS GAP ANALYSIS");
      console.log("Has Skills Gap section:", hasSkillsGap);
      
      if (hasSkillsGap) {
        // Extract just the Skills Gap section for debugging
        const skillsGapStart = responseText.indexOf("SKILLS GAP ANALYSIS");
        const skillsGapEnd = responseText.indexOf("LEARNING ROADMAP") || responseText.indexOf("TRANSITION STRATEGY");
        if (skillsGapEnd > skillsGapStart) {
          const skillsGapSection = responseText.substring(skillsGapStart, skillsGapEnd);
          console.log("=== SKILLS GAP SECTION ===");
          console.log(skillsGapSection);
          console.log("=== END SKILLS GAP ===");
        }
      }
      
      // Verify that the response includes relevant content about education and publications
      const containsEducationRef = responseText.toLowerCase().includes('education') || 
                                  responseText.toLowerCase().includes('degree') ||
                                  responseText.toLowerCase().includes('study');
      
      const containsPublicationsRef = formData.publications ? 
                                      responseText.toLowerCase().includes('publication') || 
                                      responseText.toLowerCase().includes('research') : true;
      
      if (formData.educationLevel && !containsEducationRef) {
        console.warn("Warning: Response does not mention education despite education level being provided");
      }
      
      if (formData.publications && !containsPublicationsRef) {
        console.warn("Warning: Response does not mention publications despite publications being provided");
      }
      
      // CRITICAL FIX: Now saving the analysis to storage after successful API call
      try {
        // Save analysis to storage using the correct method
        const analysisData = {
          userId: formData.email || String(new Date().getTime()),
          analysis: responseText,
          raw: responseText // Store the raw analysis text
        };
        
        // Use the correct method from storageService
        storageService.saveCareerAnalysis(analysisData);
        
        // Also save formatted version for faster rendering if email is available
        if (formData.email) {
          storageService.saveFormattedAnalysis(formData.email, responseText);
        }
        
        console.log('Analysis saved to local storage');
      } catch (storageError) {
        console.error('Error saving analysis to storage:', storageError);
        // Continue execution even if storage fails
      }
      
      return responseText;
    } catch (error) {
      console.error('Error getting career analysis from Claude API:', error);
      throw error;
    }
  }
}

export default new ClaudeApiService();
