// api/notifications/send-event-published.js

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

    const emailSubject = `🎉 Event Published: ${eventData.eventTitle}`;
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Event Published</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #00BCD4, #0097A7); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #00BCD4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00BCD4; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Event Published!</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${eventData.organizerName || 'Event Organizer'}!</h2>
              
              <p>Excellent news! Your event has been approved and is now live on our events page.</p>
              
              <div class="event-details">
                <h3 style="color: #00BCD4; margin-top: 0;">📅 Event Details:</h3>
                <p><strong>Title:</strong> ${eventData.eventTitle}</p>
                <p><strong>Date & Time:</strong> ${eventData.eventDate ? new Date(eventData.eventDate).toLocaleString() : 'TBA'}</p>
                <p><strong>Duration:</strong> ${eventData.duration || 'Not specified'}</p>
                <p><strong>Type:</strong> ${eventData.eventType || 'General'}</p>
                <p><strong>Format:</strong> ${eventData.format || 'Not specified'}</p>
                <p><strong>Max Attendees:</strong> ${eventData.maxAttendees || 'Unlimited'}</p>
              </div>
              
              <h3 style="color: #00BCD4;">What's Next?</h3>
              <ul>
                <li>📢 Your event is now visible to all community members</li>
                <li>📝 Attendees can register and add it to their calendars</li>
                <li>📊 You'll receive updates on registrations</li>
                <li>🎯 Prepare your amazing content for the event!</li>
              </ul>
              
              ${eventData.meetingUrl ? `
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #2e7d32; margin-top: 0;">🔗 Meeting Link:</h4>
                  <p style="word-break: break-all; color: #2e7d32;">
                    <a href="${eventData.meetingUrl}" style="color: #2e7d32;">${eventData.meetingUrl}</a>
                  </p>
                </div>
              ` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/events" class="button">
                  View Your Event
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                Thank you for contributing to our tech community! If you need to make any updates to your event, please contact our support team.
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
Event Published: ${eventData.eventTitle}

Congratulations, ${eventData.organizerName || 'Event Organizer'}!

Your event "${eventData.eventTitle}" has been approved and is now live on our events page.

Event Details:
- Date & Time: ${eventData.eventDate ? new Date(eventData.eventDate).toLocaleString() : 'TBA'}
- Duration: ${eventData.duration || 'Not specified'}
- Type: ${eventData.eventType || 'General'}
- Format: ${eventData.format || 'Not specified'}

${eventData.meetingUrl ? `Meeting Link: ${eventData.meetingUrl}` : ''}

Your event is now visible to all community members who can register and add it to their calendars.

Visit ${process.env.NEXT_PUBLIC_APP_URL}/events to view your event.

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
      message: 'Event published email sent successfully',
      results: [{ 
        type: 'event_published',
        recipient: eventData.organizerEmail,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('Error sending event published email:', error);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
