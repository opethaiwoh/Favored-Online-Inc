// api/notifications/send-project-approved.js

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

    const emailSubject = `🎉 Project Approved: ${projectData.projectTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Approved</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Project Approved!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${projectData.contactName || 'Project Owner'}!</h2>
              
              <p>Great news! Your project submission has been approved by our team.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-top: 0;">Project Details:</h3>
                <p><strong>Title:</strong> ${projectData.projectTitle}</p>
                <p><strong>Timeline:</strong> ${projectData.timeline || 'Not specified'}</p>
                <p><strong>Budget:</strong> ${projectData.budget || 'Not specified'}</p>
                <p><strong>Type:</strong> ${projectData.projectType || 'General'}</p>
              </div>
              
              <h3 style="color: #4CAF50;">What happens next?</h3>
              <ul>
                <li>✅ Your project is now live on our platform</li>
                <li>👥 A team group has been automatically created for you</li>
                <li>📋 You can now manage applications from interested members</li>
                <li>🚀 Start building your dream team today!</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" class="button">
                  View Your Project
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If you have any questions, please don't hesitate to contact our support team.
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
Project Approved: ${projectData.projectTitle}

Congratulations, ${projectData.contactName || 'Project Owner'}!

Your project "${projectData.projectTitle}" has been approved and is now live on our platform.

A team group has been automatically created for you, and you can now manage applications from interested members.

Visit ${process.env.NEXT_PUBLIC_APP_URL}/projects to view your project.

Best regards,
The Favored Online Team
    `;

    const result = await transporter.sendMail({
      from: { name: 'Favored Online', address: envVars.FROM_EMAIL },
      to: projectData.contactEmail,
      cc: projectData.additionalEmails || [],
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Project approval email sent successfully',
      results: [{ 
        type: 'project_approved',
        recipient: projectData.contactEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending project approval email:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
