// api/notifications/send-event-submission-notification.js
// 🔥 Event Submission Admin Notification Email

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { eventData, submitterData } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('📧 DEBUG - Event submission notification request:', JSON.stringify(req.body, null, 2));
    
    if (!eventData || !submitterData) {
      console.log('❌ DEBUG - Validation failed:', { 
        hasEventData: !!eventData,
        hasSubmitterData: !!submitterData
      });
      return res.status(400).json({
        success: false, 
        error: 'Event data and submitter data are required'
      });
    }

    // Environment variables check
    const envVars = {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@favoredonline.com' // Default admin email
    };

    const missing = Object.entries(envVars)
      .filter(([key, value]) => !value || (key === 'ADMIN_EMAIL' && value === 'admin@favoredonline.com'))
      .map(([key]) => key);

    if (missing.length > 0) {
      console.log('❌ DEBUG - Missing environment variables:', missing);
      return res.status(500).json({
        success: false,
        error: `Missing environment variables: ${missing.join(', ')}`
      });
    }

    console.log('✅ DEBUG - Environment variables check passed');

    // Create transporter
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

    // Extract event data
    const eventTitle = eventData.eventTitle || 'Untitled Event';
    const eventType = eventData.eventType || 'Event';
    const eventDescription = eventData.eventDescription || 'No description provided';
    const eventDate = eventData.eventDate;
    const eventTime = eventData.eventTime;
    const duration = eventData.duration || 'Not specified';
    const format = eventData.format || 'Not specified';
    const requirements = eventData.requirements || 'None specified';
    const learningObjectives = eventData.learningObjectives || 'Not specified';
    const meetingUrl = eventData.meetingUrl || 'To be provided';
    const tags = eventData.tags || [];
    const additionalInfo = eventData.additionalInfo || 'None';
    const eventComplexity = eventData.eventComplexity || 'simple';
    const submissionDate = eventData.submissionDate || new Date();
    
    // Extract submitter data
    const organizerName = eventData.organizerName || submitterData.submitterName || 'Unknown';
    const organizerEmail = eventData.organizerEmail || submitterData.submitterEmail || 'Unknown';
    const organizerBio = eventData.organizerBio || 'No bio provided';
    const submitterId = submitterData.submitterId || 'Unknown';
    
    const emailSubject = `🎯 New Event Submission: "${eventTitle}" by ${organizerName}`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to admin:', envVars.ADMIN_EMAIL);
    
    // Format event date and time
    const formatDateTime = (date, time) => {
      if (!date) return 'Date not specified';
      try {
        const eventDateTime = new Date(date);
        if (time) {
          const [hours, minutes] = time.split(':');
          eventDateTime.setHours(parseInt(hours), parseInt(minutes));
        }
        return eventDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: time ? 'numeric' : undefined,
          minute: time ? '2-digit' : undefined,
          timeZone: 'UTC'
        });
      } catch (error) {
        return date.toString();
      }
    };

    const formattedDateTime = formatDateTime(eventDate, eventData.eventTime);
    
    console.log('📧 DEBUG - Extracted data:', {
      eventTitle,
      organizerName,
      organizerEmail,
      eventType,
      formattedDateTime,
      eventComplexity
    });
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Event Submission - Admin Review Required</title>
          <style>
            .container { max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 10px; font-weight: bold; }
            .button-approve { background-color: #4CAF50; }
            .button-review { background-color: #2196F3; }
            .button-reject { background-color: #f44336; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .event-box { background: #e8f5e8; border: 2px solid #4CAF50; padding: 25px; border-radius: 12px; margin: 20px 0; }
            .organizer-box { background: #fff3e0; border: 2px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .complexity-badge { 
              display: inline-block; 
              padding: 6px 12px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: bold; 
              text-transform: uppercase;
            }
            .complexity-simple { background-color: #4CAF50; color: white; }
            .complexity-moderate { background-color: #ff9800; color: white; }
            .complexity-complex { background-color: #f44336; color: white; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
            .full-width { grid-column: 1 / -1; }
            .tag { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin: 2px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 New Event Submission!</h1>
              <p style="margin: 5px 0; font-size: 18px;">Admin review required</p>
              <div class="complexity-badge complexity-${eventComplexity}">
                ${eventComplexity.toUpperCase()} EVENT
              </div>
            </div>
            <div class="content">
              <h2>Event Awaiting Approval</h2>
              
              <div class="event-box">
                <h3 style="color: #4CAF50; margin: 0 0 15px 0; font-size: 24px;">🎪 ${eventTitle}</h3>
                <div class="grid">
                  <div><strong>📅 Date & Time:</strong> ${formattedDateTime}</div>
                  <div><strong>⏱️ Duration:</strong> ${duration}</div>
                  <div><strong>🏷️ Event Type:</strong> ${eventType}</div>
                  <div><strong>💻 Format:</strong> ${format}</div>
                </div>
                <div style="margin-top: 15px;">
                  <strong>📝 Description:</strong>
                  <p style="margin: 8px 0 0 0; color: #333; line-height: 1.6; background: #f8f9fa; padding: 15px; border-radius: 6px;">${eventDescription}</p>
                </div>
                ${tags && tags.length > 0 ? `
                <div style="margin-top: 15px;">
                  <strong>🏷️ Tags:</strong><br/>
                  ${Array.isArray(tags) ? tags.map(tag => `<span class="tag">${tag}</span>`).join('') : tags}
                </div>
                ` : ''}
              </div>
              
              <div class="organizer-box">
                <h3 style="color: #e65100; margin-top: 0;">👤 Event Organizer</h3>
                <div class="grid">
                  <div><strong>👨‍💼 Name:</strong> ${organizerName}</div>
                  <div><strong>📧 Email:</strong> <a href="mailto:${organizerEmail}">${organizerEmail}</a></div>
                  <div><strong>🆔 User ID:</strong> ${submitterId}</div>
                  <div><strong>📅 Submitted:</strong> ${new Date(submissionDate).toLocaleDateString()}</div>
                </div>
                ${organizerBio && organizerBio !== 'No bio provided' ? `
                <div style="margin-top: 15px;">
                  <strong>📋 Bio & Expertise:</strong>
                  <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5; background: #fff; padding: 12px; border-radius: 4px; border: 1px solid #ddd;">${organizerBio}</p>
                </div>
                ` : ''}
              </div>

              ${learningObjectives && learningObjectives !== 'Not specified' ? `
              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">🎯 Learning Objectives</h3>
                <p style="color: #333; line-height: 1.6;">${learningObjectives}</p>
              </div>
              ` : ''}

              ${requirements && requirements !== 'None specified' ? `
              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">📋 Prerequisites & Requirements</h3>
                <p style="color: #333; line-height: 1.6;">${requirements}</p>
              </div>
              ` : ''}

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">🔗 Technical Details</h3>
                <div class="grid">
                  <div><strong>🌐 Meeting URL:</strong> ${meetingUrl}</div>
                  <div><strong>📊 Complexity:</strong> <span class="complexity-badge complexity-${eventComplexity}">${eventComplexity}</span></div>
                </div>
                ${additionalInfo && additionalInfo !== 'None' ? `
                <div style="margin-top: 15px;">
                  <strong>ℹ️ Additional Information:</strong>
                  <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">${additionalInfo}</p>
                </div>
                ` : ''}
              </div>
              
              <div style="background: #fff3e0; border: 2px solid #ff9800; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
                <h3 style="color: #e65100; margin-top: 0;">⚡ Admin Actions Required</h3>
                <p style="color: #bf360c; font-size: 16px; margin-bottom: 20px;">Review this event submission and take appropriate action</p>
                
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/events" class="button button-approve">
                  ✅ Approve Event
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/events?filter=pending" class="button button-review">
                  👀 Review All Pending
                </a>
                <a href="mailto:${organizerEmail}?subject=Re: Your event submission - ${eventTitle}" class="button button-review">
                  📧 Contact Organizer
                </a>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">📋 Review Checklist:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 10px 0;">
                  <li>✅ Event title and description are clear and appropriate</li>
                  <li>✅ Date and time are properly set (future date)</li>
                  <li>✅ Organizer information is complete and verified</li>
                  <li>✅ Event type and format are suitable for the platform</li>
                  <li>✅ Learning objectives align with tech community goals</li>
                  <li>✅ Prerequisites are reasonable and clearly stated</li>
                  <li>✅ Meeting details are properly configured</li>
                </ul>
              </div>

              <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2e7d32; margin-top: 0;">🎯 Next Steps After Approval:</h4>
                <ul style="color: #2e7d32; font-size: 14px; margin: 10px 0;">
                  <li>Event will be published on the events page</li>
                  <li>Organizer will receive approval confirmation email</li>
                  <li>Event will be available for attendees to view and add to calendars</li>
                  <li>Automated reminders will be sent to registered attendees</li>
                  <li>Event analytics will begin tracking</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This event was submitted through the Favored Online event submission form on ${new Date(submissionDate).toLocaleDateString()} at ${new Date(submissionDate).toLocaleTimeString()}. The organizer has been notified that their submission is under review.
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Building the future through amazing tech events and community connections.</p>
              <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                Event: ${eventTitle} | Organizer: ${organizerName} | Complexity: ${eventComplexity.toUpperCase()}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
NEW EVENT SUBMISSION - ADMIN REVIEW REQUIRED

Event: ${eventTitle}
Organizer: ${organizerName} (${organizerEmail})
Submitted: ${new Date(submissionDate).toLocaleDateString()} at ${new Date(submissionDate).toLocaleTimeString()}
Complexity: ${eventComplexity.toUpperCase()}

EVENT DETAILS:
================
Title: ${eventTitle}
Type: ${eventType}
Format: ${format}
Date & Time: ${formattedDateTime}
Duration: ${duration}
Meeting URL: ${meetingUrl}

Description:
${eventDescription}

${learningObjectives && learningObjectives !== 'Not specified' ? `Learning Objectives:\n${learningObjectives}\n` : ''}

${requirements && requirements !== 'None specified' ? `Prerequisites & Requirements:\n${requirements}\n` : ''}

${tags && tags.length > 0 ? `Tags: ${Array.isArray(tags) ? tags.join(', ') : tags}\n` : ''}

ORGANIZER INFORMATION:
=====================
Name: ${organizerName}
Email: ${organizerEmail}
User ID: ${submitterId}

${organizerBio && organizerBio !== 'No bio provided' ? `Bio & Expertise:\n${organizerBio}\n` : ''}

${additionalInfo && additionalInfo !== 'None' ? `Additional Information:\n${additionalInfo}\n` : ''}

ADMIN ACTIONS:
=============
• Review & Approve: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/events
• View All Pending: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/events?filter=pending
• Contact Organizer: ${organizerEmail}

REVIEW CHECKLIST:
================
- Event title and description are clear and appropriate
- Date and time are properly set (future date)
- Organizer information is complete and verified
- Event type and format are suitable for the platform
- Learning objectives align with tech community goals
- Prerequisites are reasonable and clearly stated
- Meeting details are properly configured

NEXT STEPS AFTER APPROVAL:
=========================
- Event will be published on the events page
- Organizer will receive approval confirmation email
- Event will be available for attendees to view and add to calendars
- Automated reminders will be sent to registered attendees
- Event analytics will begin tracking

--
Favored Online Admin Team
Event Submission System
    `;

    console.log('📧 DEBUG - About to send admin notification email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - Event Submissions', 
        address: envVars.EMAIL_USER 
      },
      to: envVars.ADMIN_EMAIL,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: organizerEmail // Allow admin to reply directly to organizer
    });

    console.log('✅ DEBUG - Admin notification email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Event submission admin notification email sent successfully',
      results: [{ 
        type: 'event_submission_admin_notification',
        recipient: envVars.ADMIN_EMAIL,
        organizer: organizerEmail,
        eventTitle: eventTitle,
        submissionDate: submissionDate,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending event submission admin notification:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
