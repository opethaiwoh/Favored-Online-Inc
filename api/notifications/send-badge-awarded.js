// api/notifications/send-badge-awarded.js

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { badgeData, projectData, memberData } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('🏆 DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('🏆 DEBUG - badgeData:', badgeData);
    console.log('🏆 DEBUG - memberEmail:', memberData?.memberEmail);
    console.log('🏆 DEBUG - projectData:', projectData);
    
    if (!badgeData || !memberData?.memberEmail || !projectData) {
      console.log('❌ DEBUG - Validation failed:', { 
        hasBadgeData: !!badgeData, 
        hasMemberEmail: !!memberData?.memberEmail,
        hasProjectData: !!projectData
      });
      return res.status(400).json({
        success: false, 
        error: 'Badge data, member email, and project data are required'
      });
    }

    // Environment variables check - Using same variables as application approval
    const envVars = {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD
    };

    const missing = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.log('❌ DEBUG - Missing environment variables:', missing);
      return res.status(500).json({
        success: false,
        error: `Missing environment variables: ${missing.join(', ')}`
      });
    }

    console.log('✅ DEBUG - Environment variables check passed');

    // Create transporter using EXACT same method as application approval
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: envVars.EMAIL_USER,
        pass: envVars.EMAIL_PASSWORD
      }
    });

    console.log('🔧 DEBUG - Transporter created, verifying...');
    await transporter.verify();
    console.log('✅ DEBUG - Transporter verified successfully');

    // Badge category mapping
    const badgeCategories = {
      'mentorship': { 
        name: 'TechMO Badge', 
        color: '#F59E0B', 
        emoji: '🎓',
        image: '/Images/TechMO.png',
        description: 'Mentorship & Leadership Excellence'
      },
      'quality-assurance': { 
        name: 'TechQA Badge', 
        color: '#3B82F6', 
        emoji: '🔍',
        image: '/Images/TechQA.png',
        description: 'Quality Assurance & Testing Mastery'
      },
      'development': { 
        name: 'TechDev Badge', 
        color: '#10B981', 
        emoji: '💻',
        image: '/Images/TechDev.png',
        description: 'Development & Programming Skills'
      },
      'leadership': { 
        name: 'TechLeads Badge', 
        color: '#8B5CF6', 
        emoji: '👑',
        image: '/Images/TechLeads.png',
        description: 'Technical Leadership & Project Management'
      },
      'design': { 
        name: 'TechArchs Badge', 
        color: '#F97316', 
        emoji: '🎨',
        image: '/Images/TechArchs.png',
        description: 'Architecture & Design Excellence'
      },
      'security': { 
        name: 'TechGuard Badge', 
        color: '#EF4444', 
        emoji: '🛡️',
        image: '/Images/TechGuard.png',
        description: 'Security & Protection Expertise'
      }
    };

    const badgeInfo = badgeCategories[badgeData.badgeCategory] || {
      name: 'TechTalent Badge',
      color: '#6B7280',
      emoji: '🏆',
      image: '/Images/512X512.png',
      description: 'Technical Excellence Recognition'
    };

    const emailSubject = `🏆 Congratulations! You've Earned a ${badgeInfo.name}`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to:', memberData.memberEmail);
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Badge Awarded</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, ${badgeInfo.color}, #1F2937); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: ${badgeInfo.color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .badge-showcase { background: linear-gradient(135deg, ${badgeInfo.color}20, ${badgeInfo.color}10); border: 2px solid ${badgeInfo.color}; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
            .badge-image { width: 80px; height: 80px; margin: 0 auto 15px auto; display: block; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .skill-tag { background-color: ${badgeInfo.color}20; color: ${badgeInfo.color}; padding: 6px 12px; border-radius: 20px; font-size: 12px; margin: 2px; display: inline-block; }
            .achievement-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .achievement-item { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${badgeInfo.color}; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${badgeInfo.emoji} Badge Awarded!</h1>
              <p style="font-size: 18px; margin: 10px 0;">Outstanding Achievement Recognized</p>
            </div>
            <div class="content">
              <h2>Congratulations, ${memberData.memberName || 'Team Member'}!</h2>
              
              <div class="badge-showcase">
                <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}${badgeInfo.image}" 
                     alt="${badgeInfo.name}" 
                     class="badge-image"
                     onerror="this.style.display='none';" />
                <h3 style="color: ${badgeInfo.color}; margin: 0 0 5px 0; font-size: 24px;">${badgeInfo.name}</h3>
                <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 14px; font-style: italic;">
                  ${badgeInfo.description}
                </p>
                <p style="margin: 5px 0; color: #4B5563; font-size: 18px; font-weight: bold;">
                  ${(badgeData.badgeLevel || 'novice').charAt(0).toUpperCase() + (badgeData.badgeLevel || 'novice').slice(1)} Level
                </p>
                <p style="margin: 10px 0; color: #6B7280; font-size: 14px;">
                  Awarded for exceptional contribution to "${projectData.projectTitle}"
                </p>
              </div>
              
              <p>🎉 <strong>Amazing work!</strong> Your project owner <strong>${projectData.contactName || 'Project Team'}</strong> has recognized your outstanding contribution and awarded you this prestigious TechTalent badge.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #E5E7EB;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <img src="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}${badgeInfo.image}" 
                       alt="${badgeInfo.name}" 
                       style="width: 40px; height: 40px; margin-right: 12px; border-radius: 6px; flex-shrink: 0;" />
                  <h3 style="color: ${badgeInfo.color}; margin: 0; flex-grow: 1;">📋 Badge Details</h3>
                </div>
                <div class="achievement-grid">
                  <div class="achievement-item">
                    <h4 style="margin: 0 0 5px 0; color: #374151;">Badge Category</h4>
                    <p style="margin: 0; font-weight: bold; color: ${badgeInfo.color};">${badgeInfo.name}</p>
                  </div>
                  <div class="achievement-item">
                    <h4 style="margin: 0 0 5px 0; color: #374151;">Skill Level</h4>
                    <p style="margin: 0; font-weight: bold;">${(badgeData.badgeLevel || 'novice').charAt(0).toUpperCase() + (badgeData.badgeLevel || 'novice').slice(1)}</p>
                  </div>
                </div>
                
                <h4 style="color: #374151; margin: 15px 0 5px 0;">Project Information:</h4>
                <p><strong>Project:</strong> ${projectData.projectTitle}</p>
                <p><strong>Your Role:</strong> ${memberData.memberRole || 'Team Member'}</p>
                <p><strong>Project Owner:</strong> ${projectData.contactName || 'Project Team'}</p>
                <p><strong>Award Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Contribution Quality:</strong> ${(badgeData.contribution || 'good').charAt(0).toUpperCase() + (badgeData.contribution || 'good').slice(1)}</p>
              </div>
              
              ${badgeData.skillsDisplayed && badgeData.skillsDisplayed.length > 0 ? `
                <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #374151; margin-top: 0;">🚀 Skills You Demonstrated:</h4>
                  <div>
                    ${badgeData.skillsDisplayed.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${badgeData.adminNotes ? `
                <div style="background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #92400E; margin-top: 0;">💬 Recognition Notes:</h4>
                  <p style="color: #92400E; margin: 0; font-style: italic;">"${badgeData.adminNotes}"</p>
                </div>
              ` : ''}
              
              <h3 style="color: ${badgeInfo.color};">🎯 What This Badge Represents</h3>
              <ul style="color: #4B5563;">
                <li>🏆 <strong>Professional Recognition:</strong> Your skills and contributions have been formally acknowledged</li>
                <li>📈 <strong>Career Growth:</strong> This badge enhances your professional portfolio and credibility</li>
                <li>🌟 <strong>Skill Validation:</strong> Demonstrates your expertise in ${badgeInfo.name.replace(' Badge', '').toLowerCase()} to future employers</li>
                <li>🤝 <strong>Team Impact:</strong> Shows your ability to work effectively in collaborative environments</li>
                <li>📜 <strong>Permanent Achievement:</strong> This badge is permanently recorded in your TechTalent profile</li>
              </ul>
              
              <div style="background: #E8F5E8; border: 1px solid #4CAF50; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2E7D32; margin-top: 0;">💡 Maximize Your Badge Value:</h4>
                <ul style="color: #2E7D32; font-size: 14px; margin: 5px 0;">
                  <li>Add this badge to your LinkedIn profile and resume</li>
                  <li>Showcase your verified skills to potential employers</li>
                  <li>Use this as evidence of your project experience</li>
                  <li>Share your achievement with your professional network</li>
                  <li>Continue building your badge collection with future projects</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/career/dashboard" class="button">
                  View Your Badge Collection
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; text-align: center;">
                Congratulations on this well-deserved recognition! Keep building your skills and earning more badges to advance your tech career. 🚀
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Empowering careers through skill recognition and validation.</p>
              <p style="font-size: 12px; margin-top: 10px;">
                This badge has been verified and is permanently recorded in your TechTalent profile.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
🏆 Congratulations! You've Earned a ${badgeInfo.name}

Dear ${memberData.memberName || 'Team Member'},

Congratulations! Your project owner has recognized your outstanding contribution and awarded you a prestigious TechTalent badge.

BADGE DETAILS:
🏆 Badge: ${badgeInfo.name}
📊 Level: ${(badgeData.badgeLevel || 'novice').charAt(0).toUpperCase() + (badgeData.badgeLevel || 'novice').slice(1)}
📝 Description: ${badgeInfo.description}
🎯 Project: ${projectData.projectTitle}
👤 Your Role: ${memberData.memberRole || 'Team Member'}
👔 Project Owner: ${projectData.contactName || 'Project Team'}
📅 Award Date: ${new Date().toLocaleDateString()}
⭐ Contribution Quality: ${(badgeData.contribution || 'good').charAt(0).toUpperCase() + (badgeData.contribution || 'good').slice(1)}

${badgeData.skillsDisplayed && badgeData.skillsDisplayed.length > 0 ? `
SKILLS DEMONSTRATED:
${badgeData.skillsDisplayed.map(skill => `• ${skill}`).join('\n')}
` : ''}

${badgeData.adminNotes ? `
RECOGNITION NOTES:
"${badgeData.adminNotes}"
` : ''}

WHAT THIS BADGE REPRESENTS:
✓ Professional recognition of your skills and contributions
✓ Career growth and enhanced professional credibility
✓ Skill validation for future employers
✓ Evidence of effective teamwork and collaboration
✓ Permanent achievement in your TechTalent profile

MAXIMIZE YOUR BADGE VALUE:
- Add this badge to your LinkedIn profile and resume
- Showcase your verified skills to potential employers
- Use as evidence of your project experience
- Share your achievement with your professional network
- Continue building your badge collection with future projects

View your complete badge collection: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/career/dashboard

Congratulations on this well-deserved recognition! Keep building your skills and earning more badges to advance your tech career.

Best regards,
The Favored Online Team

---
This badge has been verified and is permanently recorded in your TechTalent profile.
    `;

    console.log('📧 DEBUG - About to send badge award email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - TechTalent Badges', 
        address: envVars.EMAIL_USER 
      },
      to: memberData.memberEmail,
      cc: memberData.additionalEmails || [],
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    console.log('✅ DEBUG - Badge award email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Badge award email sent successfully',
      results: [{ 
        type: 'badge_awarded',
        recipient: memberData.memberEmail,
        badgeCategory: badgeData.badgeCategory,
        badgeLevel: badgeData.badgeLevel,
        projectTitle: projectData.projectTitle,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending badge award email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
