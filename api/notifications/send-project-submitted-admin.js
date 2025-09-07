// api/notifications/send-project-submitted-admin.js

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
    
    // 🔍 DEBUG: Log what we received  
    console.log('📧 DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 DEBUG - projectData:', projectData);
    console.log('📧 DEBUG - projectData exists:', !!projectData);
    
    if (!projectData) {
      console.log('❌ DEBUG - No projectData received');
      return res.status(400).json({
        success: false, 
        error: 'Project data is required'
      });
    }

    console.log('✅ DEBUG - projectData validation passed');
    console.log('📧 DEBUG - Project title:', projectData.projectTitle);
    console.log('📧 DEBUG - Contact name:', projectData.contactName);
    console.log('📧 DEBUG - Contact email:', projectData.contactEmail);

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

    const emailSubject = `🔍 New Project Submitted for Review: ${projectData.projectTitle || 'Unknown Project'}`;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@favoredsite.com';
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to admin:', adminEmail);
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Project Submitted for Admin Review</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .project-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔍 New Project Submitted</h1>
            </div>
            <div class="content">
              <h2>Hello Admin,</h2>
              
              <p>A new project has been submitted for your review and approval.</p>
              
              <div class="project-details">
                <h3 style="color: #2196F3; margin-top: 0;">📋 Project Details:</h3>
                <p><strong>Project Title:</strong> ${projectData.projectTitle || 'No title provided'}</p>
                <p><strong>Submitted By:</strong> ${projectData.contactName || 'Unknown'}</p>
                <p><strong>Contact Email:</strong> ${projectData.contactEmail || 'Not provided'}</p>
                <p><strong>Company:</strong> ${projectData.companyName || 'Not specified'}</p>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              ${projectData.projectDescription ? `
                <div class="project-details">
                  <h3 style="color: #2196F3; margin-top: 0;">📝 Project Description:</h3>
                  <p>${projectData.projectDescription}</p>
                </div>
              ` : ''}
              
              <div class="project-details">
                <h3 style="color: #2196F3; margin-top: 0;">📊 Project Details:</h3>
                <p><strong>Timeline:</strong> ${projectData.timeline || 'Not specified'}</p>
                <p><strong>Budget:</strong> ${projectData.budget || 'Not specified'}</p>
                <p><strong>Experience Level:</strong> ${projectData.experienceLevel || 'Not specified'}</p>
                <p><strong>Project Type:</strong> ${projectData.projectType || 'Not specified'}</p>
              </div>
              
              <h3 style="color: #2196F3;">📋 Next Steps:</h3>
              <ol>
                <li><strong>Review the project details</strong> above</li>
                <li><strong>Check if project meets guidelines</strong></li>
                <li><strong>Approve or reject</strong> via admin dashboard</li>
                <li><strong>Project owner will be notified</strong> of your decision</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/dashboard" class="button">
                  Review Project
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This is an automated notification when new projects are submitted to the platform.
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
New Project Submitted for Review: ${projectData.projectTitle || 'Unknown Project'}

Hello Admin,

A new project has been submitted for your review and approval.

Project Details:
- Project Title: ${projectData.projectTitle || 'No title provided'}
- Submitted By: ${projectData.contactName || 'Unknown'}
- Contact Email: ${projectData.contactEmail || 'Not provided'}
- Company: ${projectData.companyName || 'Not specified'}
- Timeline: ${projectData.timeline || 'Not specified'}
- Budget: ${projectData.budget || 'Not specified'}
- Experience Level: ${projectData.experienceLevel || 'Not specified'}
- Project Type: ${projectData.projectType || 'Not specified'}

${projectData.projectDescription ? `Project Description:\n${projectData.projectDescription}\n\n` : ''}

Please review this project in the admin dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/dashboard

Best regards,
The Favored Online System
    `;

    console.log('📧 DEBUG - About to send admin notification email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - Admin Notifications', 
        address: envVars.EMAIL_USER 
      },
      to: adminEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    console.log('✅ DEBUG - Admin notification email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Admin notification sent successfully',
      results: [{ 
        type: 'project_submitted_admin',
        recipient: adminEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending admin notification:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
