// api/notifications/send-event-rejected.js

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { eventData } = req.body;
    
    if (!eventData || !eventData.organizerEmail) {
      return res.status(400).json({
        success: false, 
        error: 'Event data and organizer email are required'
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

    const emailSubject = `⚠️ Event Needs Revision: ${eventData.eventTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Event Needs Revision</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #FF9800, #F57C00); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .feedback-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Event Needs Revision</h1>
            </div>
            <div class="content">
              <h2>Hello ${eventData.organizerName || 'Event Organizer'},</h2>
              
              <p>Thank you for submitting your event to Favored Online. After careful review, we need some adjustments before we can publish your event.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #FF9800; margin-top: 0;">📅 Event Details:</h3>
                <p><strong>Title:</strong> ${eventData.eventTitle}</p>
                <p><strong>Scheduled Date:</strong> ${eventData.eventDate ? new Date(eventData.eventDate).toLocaleString() : 'TBA'}</p>
                <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Reviewed by:</strong> ${eventData.rejectedBy || 'Admin Team'}</p>
              </div>
              
              <div class="feedback-box">
                <h3 style="color: #856404; margin-top: 0;">📝 Feedback & Required Changes:</h3>
                <p style="color: #856404; font-size: 16px; line-height: 1.6;">
                  ${eventData.rejectionReason || 'Please review your event details and ensure all required information is provided according to our community guidelines.'}
                </p>
              </div>
              
              <h3 style="color: #FF9800;">Next Steps:</h3>
              <ul>
                <li>📝 Review the feedback above carefully</li>
                <li>✏️ Make the necessary changes to your event</li>
                <li>📋 Ensure all event details meet our guidelines</li>
                <li>🔄 Resubmit your event for review</li>
                <li>📞 Contact support if you need clarification</li>
              </ul>
              
              <h3 style="color: #FF9800;">Common Issues to Check:</h3>
              <ul style="color: #666; font-size: 14px;">
                <li>Event description is clear and informative</li>
                <li>Date and time are realistic and properly scheduled</li>
                <li>Meeting links (if provided) are valid</li>
                <li>Content is appropriate for our tech community</li>
                <li>All required fields are completed</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-event" class="button">
                  Resubmit Event
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                We appreciate your contribution to our tech community! If you have any questions about the feedback, please don't hesitate to contact our support team.
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
Event Needs Revision: ${eventData.eventTitle}

Hello ${eventData.organizerName || 'Event Organizer'},

Your event "${eventData.eventTitle}" requires some revisions before we can publish it.

Feedback:
${eventData.rejectionReason || 'Please review your event details and ensure all required information is provided according to our community guidelines.'}

Next Steps:
1. Review the feedback carefully
2. Make the necessary changes
3. Ensure all details meet our guidelines
4. Resubmit your event for review

Visit ${process.env.NEXT_PUBLIC_APP_URL}/submit-event to resubmit.

Best regards,
The Favored Online Team
    `;

    const result = await transporter.sendMail({
      from: { name: 'Favored Online', address: envVars.FROM_EMAIL },
      to: eventData.organizerEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate
    });

    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Event rejection email sent successfully',
      results: [{ 
        type: 'event_rejected',
        recipient: eventData.organizerEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending event rejection email:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
