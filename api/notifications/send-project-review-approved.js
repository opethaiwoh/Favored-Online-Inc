// api/notifications/send-project-review-approved.js

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

    const emailSubject = `🎉 Project Review Approved: ${completionData.projectTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Review Approved</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .achievement-box { background: #e8f5e8; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Project Review Approved!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${completionData.adminName || 'Project Owner'}!</h2>
              
              <div class="achievement-box">
                <h3 style="color: #4CAF50; margin: 0;">🏆 Outstanding Achievement!</h3>
                <p style="margin: 10px 0; color: #2e7d32; font-size: 18px;">
                  Your project has passed our comprehensive review process!
                </p>
              </div>
              
              <p>Excellent work! Your project completion submission has been thoroughly reviewed and approved by our admin team.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #4CAF50; margin-top: 0;">📋 Project Details:</h3>
                <p><strong>Title:</strong> ${completionData.projectTitle}</p>
                <p><strong>Team Size:</strong> ${completionData.teamSize || 'Not specified'} members</p>
                <p><strong>Completion Status:</strong> ✅ Approved</p>
                <p><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <h3 style="color: #4CAF50;">🎯 What's Next - Badge Assignment Phase:</h3>
              <ul>
                <li>🏅 You can now assign skill badges to your team members</li>
                <li>📊 Evaluate each member's contribution and skills demonstrated</li>
                <li>🎖️ Award appropriate badges based on their performance</li>
                <li>📜 Generate completion certificates for your team</li>
                <li>🌟 Celebrate your team's achievement!</li>
              </ul>
              
              <div style="background: #fff3e0; border: 1px solid #ffb74d; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #f57c00; margin-top: 0;">💡 Badge Assignment Tips:</h4>
                <ul style="color: #ef6c00; font-size: 14px; margin: 5px 0;">
                  <li>Be thoughtful and fair in your evaluations</li>
                  <li>Consider each member's unique contributions</li>
                  <li>Award badges that reflect actual skills demonstrated</li>
                  <li>This impacts their professional profiles</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${completionData.groupId || ''}" class="button">
                  Assign Team Badges
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Thank you for maintaining high standards and contributing to our community's success. Your completed project serves as an inspiration to others!
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
Project Review Approved: ${completionData.projectTitle}

Congratulations, ${completionData.adminName || 'Project Owner'}!

Your project completion submission has been thoroughly reviewed and approved by our admin team.

Project Details:
- Title: ${completionData.projectTitle}
- Team Size: ${completionData.teamSize || 'Not specified'} members
- Review Date: ${new Date().toLocaleDateString()}

What's Next - Badge Assignment Phase:
✓ You can now assign skill badges to your team members
✓ Evaluate each member's contribution and skills demonstrated
✓ Award appropriate badges based on their performance
✓ Generate completion certificates for your team

Visit ${process.env.NEXT_PUBLIC_APP_URL}/groups/${completionData.groupId || ''} to assign team badges.

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
      message: 'Project review approval email sent successfully',
      results: [{ 
        type: 'project_review_approved',
        recipient: completionData.adminEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending project review approval email:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
