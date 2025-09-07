// api/notifications/send-application-rejected.js
// 🔥 NEW: Email notification for application rejections

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { applicationData, projectData, rejectionReason } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('📧 DEBUG - Rejection email request:', {
      applicantName: applicationData?.applicantName,
      applicantEmail: applicationData?.applicantEmail,
      projectTitle: projectData?.projectTitle,
      hasReason: !!rejectionReason
    });
    
    if (!applicationData || !projectData || !applicationData.applicantEmail) {
      console.log('❌ DEBUG - Validation failed for rejection email');
      return res.status(400).json({
        success: false, 
        error: 'Application data, project data, and applicant email are required'
      });
    }

    // Environment variables check
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

    // Create transport
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

    const projectTitle = projectData?.projectTitle || 'Project';
    const applicantName = applicationData.applicantName || 'Applicant';
    const emailSubject = `📋 Application Update: ${projectTitle}`;
    
    console.log('📧 DEBUG - Sending rejection email to:', applicationData.applicantEmail);
    
    // Extract data
    const applicantEmail = applicationData.applicantEmail;
    const projectOwnerName = projectData.contactName || 'Project Owner';
    const projectOwnerEmail = projectData.contactEmail || '';
    const projectDescription = projectData?.projectDescription || '';
    const projectType = projectData?.projectType || 'Project';
    const companyName = projectData?.companyName || projectData?.contactName || 'Team';
    
    console.log('📧 DEBUG - Extracted data for rejection email:', {
      applicantName,
      applicantEmail,
      projectTitle,
      projectOwnerName,
      hasRejectionReason: !!rejectionReason
    });
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Application Update</title>
          <style>
            .container { max-width: 700px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .button-secondary { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .info-box { background: #fff3e0; border: 2px solid #FF9800; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FF6B35; }
            .feedback-section { background: #f3e5f5; border: 1px solid #9c27b0; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Application Update</h1>
              <p style="margin: 5px 0; font-size: 18px;">Regarding your application to "${projectTitle}"</p>
            </div>
            <div class="content">
              <h2>Hello ${applicantName},</h2>
              
              <div class="info-box">
                <h3 style="color: #E65100; margin: 0 0 10px 0;">📋 Application Status Update</h3>
                <p style="margin: 5px 0; font-size: 16px;">
                  Thank you for your interest in <strong>"${projectTitle}"</strong>. 
                </p>
                <p style="margin: 10px 0; color: #666;">
                  After careful consideration, we have decided not to move forward with your application at this time.
                </p>
              </div>
              
              <div class="info-section">
                <h3 style="color: #FF6B35; margin-top: 0;">📊 Project Details</h3>
                <p><strong>Project:</strong> ${projectTitle}</p>
                <p><strong>Company/Team:</strong> ${companyName}</p>
                <p><strong>Project Type:</strong> ${projectType}</p>
                ${projectDescription ? `<p><strong>Description:</strong> ${projectDescription}</p>` : ''}
                <p><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              ${rejectionReason && rejectionReason.trim() ? `
              <div class="feedback-section">
                <h3 style="color: #7b1fa2; margin-top: 0;">💬 Feedback from ${projectOwnerName}</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-line; font-style: italic;">"${rejectionReason}"</p>
              </div>
              ` : ''}

              <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #2E7D32; margin-top: 0;">🌟 Keep Moving Forward!</h3>
                <p style="color: #2E7D32; margin: 10px 0;">
                  • This decision doesn't reflect on your skills or potential
                </p>
                <p style="color: #2E7D32; margin: 10px 0;">
                  • Many factors influence project team selection
                </p>
                <p style="color: #2E7D32; margin: 10px 0;">
                  • We encourage you to continue applying to other exciting projects
                </p>
                <p style="color: #2E7D32; margin: 10px 0;">
                  • Your experience and skills are valuable to the right project
                </p>
              </div>
              
              <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #e65100; margin-top: 0;">🚀 Next Steps</h3>
                <div style="text-align: center;">
                  <a href="https://www.favoredonline.com/projects" class="button">
                    🔍 Explore More Projects
                  </a>
                  <br/>
                  <a href="https://www.favoredonline.com/career/dashboard" class="button-secondary">
                    📈 Build Your Profile
                  </a>
                  <a href="https://www.favoredonline.com/community" class="button-secondary">
                    👥 Join Community
                  </a>
                </div>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">💡 Tips for Future Applications:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 5px 0;">
                  <li>Tailor your application to each specific project</li>
                  <li>Highlight relevant experience and skills</li>
                  <li>Show genuine interest and understanding of the project</li>
                  <li>Include links to your best work and portfolio</li>
                  <li>Keep building and learning new skills</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Thank you again for your interest in our project. We wish you the best in your future endeavors and hope you find the perfect opportunity soon.
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Best regards,<br/>
                <strong>${projectOwnerName}</strong><br/>
                ${companyName}
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Connecting talented developers with exciting projects.</p>
              <p style="margin-top: 10px;">
                <a href="https://www.favoredonline.com/projects" style="color: #4CAF50; text-decoration: none;">Browse More Projects</a> | 
                <a href="https://www.favoredonline.com/career/support" style="color: #4CAF50; text-decoration: none;">Get Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
Application Update: ${projectTitle}

Hello ${applicantName},

Thank you for your interest in "${projectTitle}". After careful consideration, we have decided not to move forward with your application at this time.

PROJECT DETAILS:
Project: ${projectTitle}
Company/Team: ${companyName}
Project Type: ${projectType}
Decision Date: ${new Date().toLocaleDateString()}

${rejectionReason && rejectionReason.trim() ? `
FEEDBACK FROM ${projectOwnerName.toUpperCase()}:
"${rejectionReason}"
` : ''}

KEEP MOVING FORWARD!
• This decision doesn't reflect on your skills or potential
• Many factors influence project team selection  
• We encourage you to continue applying to other exciting projects
• Your experience and skills are valuable to the right project

NEXT STEPS:
• Explore More Projects: https://www.favoredonline.com/projects
• Build Your Profile: https://www.favoredonline.com/career/dashboard
• Join Community: https://www.favoredonline.com/community

TIPS FOR FUTURE APPLICATIONS:
• Tailor your application to each specific project
• Highlight relevant experience and skills
• Show genuine interest and understanding of the project
• Include links to your best work and portfolio
• Keep building and learning new skills

Thank you again for your interest in our project. We wish you the best in your future endeavors and hope you find the perfect opportunity soon.

Best regards,
${projectOwnerName}
${companyName}

---
Favored Online - Connecting talented developers with exciting projects
Browse More Projects: https://www.favoredonline.com/projects
    `;

    console.log('📧 DEBUG - About to send rejection email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online', 
        address: envVars.EMAIL_USER 
      },
      to: applicantEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: projectOwnerEmail // Allow applicant to reply to project owner if they want
    });

    console.log('✅ DEBUG - Rejection email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Application rejection notification email sent successfully',
      results: [{ 
        type: 'application_rejected',
        recipient: applicantEmail,
        project: projectTitle,
        messageId: result.messageId,
        hasCustomReason: !!rejectionReason
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending rejection email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
