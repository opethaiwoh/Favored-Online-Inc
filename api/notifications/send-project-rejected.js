// api/notifications/send-project-rejected.js

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

    const emailSubject = `⚠️ Project Submission Needs Revision: ${projectData.projectTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Needs Revision</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .feedback-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Project Needs Revision</h1>
            </div>
            <div class="content">
              <h2>Hello ${projectData.contactName || 'Project Owner'},</h2>
              
              <p>Thank you for submitting your project to Favored Online. After careful review, we need some revisions before we can approve your project.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #ff6b6b; margin-top: 0;">Project Details:</h3>
                <p><strong>Title:</strong> ${projectData.projectTitle}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Reviewed by:</strong> ${projectData.rejectedBy || 'Admin Team'}</p>
              </div>
              
              <div class="feedback-box">
                <h3 style="color: #856404; margin-top: 0;">📝 Feedback & Required Changes:</h3>
                <p style="color: #856404; font-size: 16px; line-height: 1.6;">
                  ${projectData.rejectionReason || 'Please review your project details and ensure all required information is provided.'}
                </p>
              </div>
              
              <h3 style="color: #ff6b6b;">Next Steps:</h3>
              <ul>
                <li>📝 Review the feedback above carefully</li>
                <li>✏️ Make the necessary changes to your project</li>
                <li>🔄 Resubmit your project for review</li>
                <li>📞 Contact support if you need clarification</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-project" class="button">
                  Resubmit Project
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                We're here to help you succeed! If you have any questions about the feedback, please don't hesitate to contact our support team.
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
Project Submission Needs Revision: ${projectData.projectTitle}

Hello ${projectData.contactName || 'Project Owner'},

Your project "${projectData.projectTitle}" requires some revisions before approval.

Feedback:
${projectData.rejectionReason || 'Please review your project details and ensure all required information is provided.'}

Next Steps:
1. Review the feedback carefully
2. Make the necessary changes
3. Resubmit your project for review

Visit ${process.env.NEXT_PUBLIC_APP_URL}/submit-project to resubmit.

Best regards,
The Favored Online Team
    `;

    const result = await transporter.sendMail({
      from: { name: 'Favored Online', address: envVars.FROM_EMAIL },
      to: projectData.contactEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Project rejection email sent successfully',
      results: [{ 
        type: 'project_rejected',
        recipient: projectData.contactEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending project rejection email:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
