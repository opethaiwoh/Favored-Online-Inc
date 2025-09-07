// api/notifications/send-application-approved.js

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { applicationData, projectData } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('📧 DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 DEBUG - applicationData:', applicationData);
    console.log('📧 DEBUG - applicantEmail:', applicationData?.applicantEmail);
    console.log('📧 DEBUG - projectData:', projectData);
    
    if (!applicationData || !applicationData.applicantEmail) {
      console.log('❌ DEBUG - Validation failed:', { 
        hasApplicationData: !!applicationData, 
        hasApplicantEmail: !!applicationData?.applicantEmail 
      });
      return res.status(400).json({
        success: false, 
        error: 'Application data and applicant email are required'
      });
    }

    // Environment variables check - Using same variables as daily digest
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

    // Create transporter using same method as daily digest
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

    const projectTitle = projectData?.projectTitle || applicationData.projectTitle || 'Project';
    const emailSubject = `🎉 Application Approved: Welcome to ${projectTitle}`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to:', applicationData.applicantEmail);
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Application Approved</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #9C27B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .welcome-box { background: #f3e5f5; border: 2px solid #9C27B0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to the Team!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${applicationData.applicantName || 'Team Member'}!</h2>
              
              <div class="welcome-box">
                <h3 style="color: #9C27B0; margin: 0;">🌟 You're In!</h3>
                <p style="margin: 10px 0; color: #7B1FA2; font-size: 18px;">
                  Your application has been approved!
                </p>
              </div>
              
              <p>Great news! The project owner has reviewed your application and is excited to have you join their team.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #9C27B0; margin-top: 0;">📋 Project Details:</h3>
                <p><strong>Project:</strong> ${projectTitle}</p>
                <p><strong>Your Role:</strong> ${applicationData.roleAppliedFor || 'Team Member'}</p>
                <p><strong>Project Owner:</strong> ${projectData?.contactName || applicationData.projectOwner || 'Project Team'}</p>
                <p><strong>Approval Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <h3 style="color: #9C27B0;">🚀 What's Next?</h3>
              <ul>
                <li>📧 You'll receive an invitation to join the project group</li>
                <li>💬 Connect with your new team members</li>
                <li>📋 Review project requirements and timeline</li>
                <li>🎯 Start contributing to this exciting project!</li>
                <li>🏆 Work towards earning skill badges and certificates</li>
              </ul>
              
              <div style="background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2e7d32; margin-top: 0;">💡 Getting Started Tips:</h4>
                <ul style="color: #2e7d32; font-size: 14px; margin: 5px 0;">
                  <li>Introduce yourself to the team</li>
                  <li>Ask questions if anything is unclear</li>
                  <li>Set up your development environment</li>
                  <li>Review the project documentation</li>
                  <li>Be proactive and communicate regularly</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/projects" class="button">
                  View Project Details
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Welcome to the Favored Online community! We're excited to see what amazing things you'll build together. If you have any questions, our support team is here to help.
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
Application Approved: Welcome to ${projectTitle}

Congratulations, ${applicationData.applicantName || 'Team Member'}!

Your application has been approved and you're now part of the team!

Project Details:
- Project: ${projectTitle}
- Your Role: ${applicationData.roleAppliedFor || 'Team Member'}
- Project Owner: ${projectData?.contactName || applicationData.projectOwner || 'Project Team'}
- Approval Date: ${new Date().toLocaleDateString()}

What's Next:
✓ You'll receive an invitation to join the project group
✓ Connect with your new team members
✓ Review project requirements and timeline
✓ Start contributing to this exciting project
✓ Work towards earning skill badges and certificates

Visit ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/projects to view project details.

Welcome to the Favored Online community!

Best regards,
The Favored Online Team
    `;

    console.log('📧 DEBUG - About to send email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online', 
        address: envVars.EMAIL_USER 
      },
      to: applicationData.applicantEmail,
      cc: applicationData.additionalEmails || [],
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    console.log('✅ DEBUG - Email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Application approval email sent successfully',
      results: [{ 
        type: 'application_approved',
        recipient: applicationData.applicantEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending application approval email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
