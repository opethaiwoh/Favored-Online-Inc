// api/notifications/send-project-application.js
// 🔥 UPDATED VERSION - Project Owner Email Notification for New Applications

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { applicationData, projectData, projectOwnerData } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('📧 DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 DEBUG - applicationData:', applicationData);
    console.log('📧 DEBUG - projectData:', projectData);
    console.log('📧 DEBUG - projectOwnerData:', projectOwnerData);
    
    if (!applicationData || !projectOwnerData?.email || !applicationData.applicantEmail) {
      console.log('❌ DEBUG - Validation failed:', { 
        hasApplicationData: !!applicationData,
        hasProjectOwnerEmail: !!projectOwnerData?.email,
        hasApplicantEmail: !!applicationData?.applicantEmail,
        applicantEmail: applicationData?.applicantEmail,
        projectOwnerEmail: projectOwnerData?.email
      });
      return res.status(400).json({
        success: false, 
        error: 'Application data, project owner email, and applicant email are required'
      });
    }

    // Environment variables check - Using same variables as send-application-approved
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

    // 🔥 Create transport using same method as send-application-approved
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

    const projectTitle = projectData?.projectTitle || 'Your Project';
    const applicantName = applicationData.applicantName || 'Applicant';
    const emailSubject = `🎯 New Application: ${applicantName} applied for "${projectTitle}"`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to:', projectOwnerData.email);
    
    // Extract data using exact field names from dashboard
    const applicantEmail = applicationData.applicantEmail;
    const applicantPhone = applicationData.phone || '';
    const applicantExperience = applicationData.experience || 'Not provided';
    const applicantMotivation = applicationData.motivation || 'Not provided'; 
    const applicantSkills = applicationData.skills || applicationData.technicalSkills || 'Not provided';
    const applicantPortfolio = applicationData.portfolio || '';
    const applicantAvailability = applicationData.availability || applicationData.availableStart || '';
    const interestedRole = applicationData.interestedRole || 'Developer';
    
    // Project data extraction
    const projectDescription = projectData?.projectDescription || 'Not provided';
    const projectTimeline = projectData?.timeline || 'Not specified';
    const projectType = projectData?.projectType || 'Not specified';
    const projectExperienceLevel = projectData?.experienceLevel || 'Not specified';
    const projectBudget = projectData?.budget || 'Not specified';
    const companyName = projectData?.companyName || projectData?.contactName || 'Team Project';
    
    // Project owner data
    const projectOwnerName = projectOwnerData.name || 'Project Owner';
    const projectOwnerEmail = projectOwnerData.email;
    
    console.log('📧 DEBUG - Extracted data:', {
      applicantName,
      applicantEmail,
      projectTitle,
      projectOwnerName,
      projectOwnerEmail,
      interestedRole
    });
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Project Application</title>
          <style>
            .container { max-width: 700px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .button-secondary { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .applicant-box { background: #e8f5e8; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Project Application!</h1>
              <p style="margin: 5px 0; font-size: 18px;">Someone wants to join your project</p>
            </div>
            <div class="content">
              <h2>Hello ${projectOwnerName}!</h2>
              
              <div class="applicant-box">
                <h3 style="color: #4CAF50; margin: 0 0 10px 0;">👤 New Applicant</h3>
                <p style="margin: 5px 0; font-size: 20px; font-weight: bold;">
                  ${applicantName}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  📧 ${applicantEmail}
                  ${applicantPhone ? ` | 📱 ${applicantPhone}` : ''}
                </p>
                <p style="margin: 5px 0; color: #4CAF50; font-weight: bold;">
                  💼 Applied for: ${interestedRole}
                </p>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-top: 0;">📋 Project Applied For:</h3>
                <p style="font-size: 18px; font-weight: bold; color: #333;">${projectTitle}</p>
                <p style="color: #666; font-size: 14px;">Application submitted: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                ${projectDescription !== 'Not provided' ? `<p style="color: #555; margin-top: 10px;">${projectDescription}</p>` : ''}
              </div>

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">💼 Professional Experience</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-line;">${applicantExperience}</p>
              </div>

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">🎯 Motivation & Interest</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-line;">${applicantMotivation}</p>
              </div>

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">🛠️ Technical Skills & Technologies</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-line;">${applicantSkills}</p>
              </div>

              ${applicantPortfolio ? `
              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">🌐 Portfolio & Work Samples</h3>
                <p><a href="${applicantPortfolio}" target="_blank" style="color: #2196F3; text-decoration: none;">
                  ${applicantPortfolio}
                </a></p>
              </div>
              ` : ''}

              ${applicantAvailability ? `
              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">⏰ Availability</h3>
                <p style="color: #333;">${applicantAvailability}</p>
              </div>
              ` : ''}

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">📊 Project Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                  <div><strong>Type:</strong> ${projectType}</div>
                  <div><strong>Timeline:</strong> ${projectTimeline}</div>
                  <div><strong>Experience Level:</strong> ${projectExperienceLevel}</div>
                  <div><strong>Budget:</strong> ${projectBudget}</div>
                </div>
              </div>
              
              <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #e65100; margin-top: 0;">⚡ Quick Actions</h3>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/dashboard/owner" class="button">
                    📋 Review Application
                  </a>
                  <br/>
                  <a href="mailto:${applicantEmail}?subject=Re: Your application for ${projectTitle}" class="button-secondary">
                    📧 Contact Applicant
                  </a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/projects/manage" class="button-secondary">
                    ⚙️ Manage Project
                  </a>
                </div>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">💡 Next Steps:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 5px 0;">
                  <li>Review the applicant's experience and portfolio</li>
                  <li>Check if their skills match your project needs</li>
                  <li>Consider their availability and motivation</li>
                  <li>Contact them for an interview or discussion</li>
                  <li>Approve or provide feedback on their application</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This application was submitted through your Favored Online project listing. You can manage all your applications and project details from your dashboard.
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Connecting talented developers with exciting projects.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
New Project Application: ${applicantName} applied for "${projectTitle}"

Hello ${projectOwnerName}!

You have received a new application for your project.

APPLICANT DETAILS:
Name: ${applicantName}
Email: ${applicantEmail}
Role Applied For: ${interestedRole}
${applicantPhone ? `Phone: ${applicantPhone}` : ''}

PROJECT: ${projectTitle}
Applied: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

PROFESSIONAL EXPERIENCE:
${applicantExperience}

MOTIVATION:
${applicantMotivation}

TECHNICAL SKILLS:
${applicantSkills}

${applicantPortfolio ? `PORTFOLIO: ${applicantPortfolio}` : ''}

${applicantAvailability ? `AVAILABILITY: ${applicantAvailability}` : ''}

PROJECT DETAILS:
Type: ${projectType}
Timeline: ${projectTimeline}
Experience Level: ${projectExperienceLevel}
Budget: ${projectBudget}

QUICK ACTIONS:
• Review Application: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/dashboard/owner
• Contact Applicant: ${applicantEmail}
• Manage Project: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/projects/manage

Best regards,
The Favored Online Team
    `;

    console.log('📧 DEBUG - About to send email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online', 
        address: envVars.EMAIL_USER 
      },
      to: projectOwnerEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: applicantEmail // Allow project owner to reply directly to applicant
    });

    console.log('✅ DEBUG - Email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Project application notification email sent successfully',
      results: [{ 
        type: 'project_application',
        recipient: projectOwnerEmail,
        applicant: applicantEmail,
        project: projectTitle,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending project application email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
