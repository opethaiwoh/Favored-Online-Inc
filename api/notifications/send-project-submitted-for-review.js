// api/notifications/send-project-submitted-for-review.js

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { projectData } = req.body;
    
    if (!projectData || !projectData.contactEmail) {
      return res.status(400).json({
        success: false, 
        error: 'Project data and contact email are required'
      });
    }

    // Environment variables check
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,  
      SMTP_PASS: process.env.SMTP_PASS,
      FROM_EMAIL: process.env.FROM_EMAIL
    };

    const missing = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return res.status(500).json({
        success: false,
        error: `Missing environment variables: ${missing.join(', ')}`
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: envVars.SMTP_HOST,
      port: parseInt(envVars.SMTP_PORT || '587'),
      secure: envVars.SMTP_PORT === '465',
      auth: {
        user: envVars.SMTP_USER,
        pass: envVars.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    const emailSubject = `🔍 New Project Submitted for Review: ${projectData.projectTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Submitted for Review</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .project-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }
            .urgent-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔍 Project Review Required</h1>
            </div>
            <div class="content">
              <h2>Hello Admin Team,</h2>
              
              <p>A new project has been submitted for completion review and requires your evaluation.</p>
              
              <div class="project-details">
                <h3 style="color: #2196F3; margin-top: 0;">📋 Project Details:</h3>
                <p><strong>Project Title:</strong> ${projectData.projectTitle}</p>
                <p><strong>Project Owner:</strong> ${projectData.contactName}</p>
                <p><strong>Owner Email:</strong> ${projectData.contactEmail}</p>
                <p><strong>Team Size:</strong> ${projectData.teamSize} members</p>
                <p><strong>Submission Type:</strong> ${projectData.isResubmission ? 'Resubmission' : 'First Submission'}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div class="project-details">
                <h3 style="color: #2196F3; margin-top: 0;">🔗 Project Links:</h3>
                <p><strong>Project URL:</strong> <a href="${projectData.projectUrl}" target="_blank" style="color: #2196F3; word-break: break-all;">${projectData.projectUrl}</a></p>
                <p><strong>GitHub Repository:</strong> <a href="${projectData.repositoryUrl}" target="_blank" style="color: #2196F3; word-break: break-all;">${projectData.repositoryUrl}</a></p>
                ${projectData.demoUrl ? `<p><strong>Live Demo:</strong> <a href="${projectData.demoUrl}" target="_blank" style="color: #2196F3; word-break: break-all;">${projectData.demoUrl}</a></p>` : ''}
              </div>
              
              <div class="project-details">
                <h3 style="color: #2196F3; margin-top: 0;">📝 Project Summary:</h3>
                <p>${projectData.projectDescription || 'No description provided'}</p>
              </div>
              
              <div class="urgent-box">
                <h3 style="color: #856404; margin-top: 0;">⚠️ Review Requirements:</h3>
                <ul style="color: #856404;">
                  <li><strong>Verify Repository Access:</strong> Check that "FavoredOnlineInc" has collaborator access</li>
                  <li><strong>Confirm Team Credits:</strong> All team members' names should be visible in the project</li>
                  <li><strong>Test Functionality:</strong> Ensure the project works as described</li>
                  <li><strong>Code Quality Check:</strong> Review the repository for proper implementation</li>
                  <li><strong>Repository Visibility:</strong> Confirm repository is public</li>
                </ul>
              </div>
              
              <h3 style="color: #2196F3;">📋 Next Steps:</h3>
              <ol>
                <li><strong>Review the project</strong> using the links above</li>
                <li><strong>Check GitHub requirements</strong> (public repo, collaborator access, team credits)</li>
                <li><strong>Test the application</strong> to ensure it's functional</li>
                <li><strong>Approve or reject</strong> the submission via admin panel</li>
                <li><strong>Project owner will be notified</strong> automatically of your decision</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/project-reviews" class="button">
                  Review Project
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                ${projectData.isResubmission ? 
                  'This is a resubmission after previous rejection. Please review the updated project carefully.' : 
                  'This is a new project submission awaiting your review.'
                }
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Building the future of tech collaboration.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
Project Submitted for Review: ${projectData.projectTitle}

Hello Admin Team,

A new project has been submitted for completion review and requires your evaluation.

Project Details:
- Project Title: ${projectData.projectTitle}
- Project Owner: ${projectData.contactName}
- Owner Email: ${projectData.contactEmail}
- Team Size: ${projectData.teamSize} members
- Submission Type: ${projectData.isResubmission ? 'Resubmission' : 'First Submission'}
- Submitted: ${new Date().toLocaleDateString()}

Project Links:
- Project URL: ${projectData.projectUrl}
- GitHub Repository: ${projectData.repositoryUrl}
${projectData.demoUrl ? `- Live Demo: ${projectData.demoUrl}` : ''}

Project Summary:
${projectData.projectDescription || 'No description provided'}

Review Requirements:
- Verify Repository Access: Check that "FavoredOnlineInc" has collaborator access
- Confirm Team Credits: All team members' names should be visible in the project
- Test Functionality: Ensure the project works as described
- Code Quality Check: Review the repository for proper implementation
- Repository Visibility: Confirm repository is public

Next Steps:
1. Review the project using the links above
2. Check GitHub requirements (public repo, collaborator access, team credits)
3. Test the application to ensure it's functional
4. Approve or reject the submission via admin panel
5. Project owner will be notified automatically of your decision

Visit ${process.env.NEXT_PUBLIC_APP_URL}/admin/project-reviews to review the project.

${projectData.isResubmission ? 
  'This is a resubmission after previous rejection. Please review the updated project carefully.' : 
  'This is a new project submission awaiting your review.'
}

Best regards,
The Favored Online System
    `;

    const result = await transporter.sendMail({
      from: { name: 'Favored Online - Project Review System', address: envVars.FROM_EMAIL },
      to: process.env.ADMIN_EMAIL || 'admin@favoredsite.com', // Admin email
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Project review notification sent successfully',
      results: [{ 
        type: 'project_submitted_for_review',
        recipient: process.env.ADMIN_EMAIL || 'admin@favoredsite.com',
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending project review notification:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
