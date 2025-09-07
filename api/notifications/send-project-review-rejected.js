// api/notifications/send-project-review-rejected.js

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { completionData } = req.body;
    
    if (!completionData || !completionData.adminEmail) {
      return res.status(400).json({
        success: false, 
        error: 'Completion data and admin email are required'
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

    const emailSubject = `⚠️ Project Review Needs Revision: ${completionData.projectTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Review Needs Revision</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #FF5722, #E64A19); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #FF5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .feedback-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .requirements-box { background: #ffebee; border: 1px solid #ffcdd2; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Project Review Needs Revision</h1>
            </div>
            <div class="content">
              <h2>Hello ${completionData.adminName || 'Project Owner'},</h2>
              
              <p>Thank you for submitting your project for completion review. After careful evaluation, we need some adjustments before we can approve the completion.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #FF5722; margin-top: 0;">📋 Project Details:</h3>
                <p><strong>Title:</strong> ${completionData.projectTitle}</p>
                <p><strong>Team Size:</strong> ${completionData.teamSize || 'Not specified'} members</p>
                <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Reviewed by:</strong> ${completionData.rejectedBy || 'Admin Team'}</p>
              </div>
              
              <div class="feedback-box">
                <h3 style="color: #856404; margin-top: 0;">📝 Specific Feedback & Required Changes:</h3>
                <p style="color: #856404; font-size: 16px; line-height: 1.6;">
                  ${completionData.rejectionReason || 'Please review the requirements below and ensure your project meets all completion criteria.'}
                </p>
              </div>
              
              <div class="requirements-box">
                <h3 style="color: #c62828; margin-top: 0;">📋 Common Review Requirements:</h3>
                <ul style="color: #d32f2f; font-size: 14px;">
                  <li><strong>GitHub Repository:</strong> Must be public and accessible</li>
                  <li><strong>Collaborator Access:</strong> FavoredOnlineInc must be added as collaborator</li>
                  <li><strong>Team Visibility:</strong> All team member names should be visible in the project</li>
                  <li><strong>Code Quality:</strong> Project should demonstrate good coding practices</li>
                  <li><strong>Functionality:</strong> Project should be complete and functional</li>
                  <li><strong>Documentation:</strong> README file with project information</li>
                </ul>
              </div>
              
              <h3 style="color: #FF5722;">Next Steps:</h3>
              <ol>
                <li>📝 <strong>Review the feedback carefully</strong> - Address each point mentioned above</li>
                <li>✏️ <strong>Make necessary corrections</strong> - Update your repository and project</li>
                <li>👥 <strong>Verify team member visibility</strong> - Ensure all names are clearly shown</li>
                <li>🔗 <strong>Check repository access</strong> - Confirm FavoredOnlineInc has collaborator access</li>
                <li>🔄 <strong>Resubmit for review</strong> - Submit again once all issues are resolved</li>
              </ol>
              
              <div style="background: #e3f2fd; border: 1px solid #90caf9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1976d2; margin-top: 0;">💡 Quick Tips:</h4>
                <ul style="color: #1565c0; font-size: 14px; margin: 5px 0;">
                  <li>Double-check your repository URL works and is accessible</li>
                  <li>Ensure your README explains what the project does</li>
                  <li>Add comments to your code where helpful</li>
                  <li>Test that all features work as expected</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${completionData.groupId || ''}" class="button">
                  Update & Resubmit
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                We're here to help you succeed! If you have any questions about the feedback or need clarification on any requirements, please don't hesitate to contact our support team.
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
Project Review Needs Revision: ${completionData.projectTitle}

Hello ${completionData.adminName || 'Project Owner'},

Your project completion submission requires some revisions before approval.

Specific Feedback:
${completionData.rejectionReason || 'Please review the requirements and ensure your project meets all completion criteria.'}

Common Requirements to Check:
✓ GitHub repository is public and accessible
✓ FavoredOnlineInc is added as collaborator
✓ All team member names are visible in the project
✓ Project demonstrates good coding practices
✓ Project is complete and functional
✓ README file with project information

Next Steps:
1. Review the feedback carefully
2. Make necessary corrections
3. Verify team member visibility
4. Check repository access
5. Resubmit for review

Visit ${process.env.NEXT_PUBLIC_APP_URL}/groups/${completionData.groupId || ''} to update and resubmit.

Best regards,
The Favored Online Team
    `;

    const result = await transporter.sendMail({
      from: { name: 'Favored Online', address: envVars.FROM_EMAIL },
      to: completionData.adminEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Project review rejection email sent successfully',
      results: [{ 
        type: 'project_review_rejected',
        recipient: completionData.adminEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending project review rejection email:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
