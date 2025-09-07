// api/notifications/send-new-event-group-admin.js

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { eventGroupData } = req.body;
    
    // 🔍 DEBUG: Log what we received  
    console.log('📧 DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 DEBUG - eventGroupData:', eventGroupData);
    console.log('📧 DEBUG - eventGroupData exists:', !!eventGroupData);
    
    if (!eventGroupData) {
      console.log('❌ DEBUG - No eventGroupData received');
      return res.status(400).json({
        success: false, 
        error: 'Event group data is required'
      });
    }

    console.log('✅ DEBUG - eventGroupData validation passed');
    console.log('📧 DEBUG - Event title:', eventGroupData.eventTitle);
    console.log('📧 DEBUG - Organizer name:', eventGroupData.organizerName);
    console.log('📧 DEBUG - Organizer email:', eventGroupData.organizerEmail);

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
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: envVars.EMAIL_USER,
        pass: envVars.EMAIL_PASSWORD
      }
    });

    console.log('🔧 DEBUG - Transporter created, verifying...');
    await transporter.verify();
    console.log('✅ DEBUG - Transporter verified successfully');

    const emailSubject = `🎪 New Event Group Submission: ${eventGroupData.eventTitle || 'Unknown Event'}`;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@favoredsite.com';
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to admin:', adminEmail);
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Event Group Submission - Admin Notification</title>
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #6a5acd, #483d8b); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #6a5acd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .button-secondary { background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6a5acd; }
            .urgent-notice { background: #fff3e0; border: 2px solid #ff9800; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎪 New Event Group Submission</h1>
              <p style="margin: 5px 0; font-size: 18px;">Requires Admin Approval</p>
            </div>
            <div class="content">
              <h2>Hello Admin,</h2>
              
              <p>A new event group has been submitted to the platform and requires your approval before it can be published and accept member applications.</p>
              
              <div class="urgent-notice">
                <h4 style="color: #e65100; margin-top: 0;">⚡ Action Required</h4>
                <p style="color: #bf360c; margin: 5px 0;">This event group is pending approval and will not be visible to users until you review and approve it.</p>
              </div>
              
              <div class="event-details">
                <h3 style="color: #6a5acd; margin-top: 0;">🎪 Event Group Details:</h3>
                <p><strong>Event Title:</strong> ${eventGroupData.eventTitle || 'No title provided'}</p>
                <p><strong>Organizer:</strong> ${eventGroupData.organizerName || 'Unknown'}</p>
                <p><strong>Organizer Email:</strong> ${eventGroupData.organizerEmail || 'Not provided'}</p>
                <p><strong>Organization:</strong> ${eventGroupData.organizationName || 'Not specified'}</p>
                <p><strong>Submission Date:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                <p><strong>Event Group ID:</strong> ${eventGroupData.id || 'Not assigned'}</p>
              </div>
              
              ${eventGroupData.description ? `
                <div class="event-details">
                  <h3 style="color: #6a5acd; margin-top: 0;">📝 Event Description:</h3>
                  <p style="line-height: 1.6;">${eventGroupData.description}</p>
                </div>
              ` : ''}
              
              <div class="event-details">
                <h3 style="color: #6a5acd; margin-top: 0;">📊 Event Information:</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div><strong>📅 Event Date:</strong> ${eventGroupData.eventDate ? new Date(eventGroupData.eventDate).toLocaleDateString() : 'Not specified'}</div>
                  <div><strong>⏰ Event Time:</strong> ${eventGroupData.eventTime || 'Not specified'}</div>
                  <div><strong>📍 Location:</strong> ${eventGroupData.location || eventGroupData.venue || 'Not specified'}</div>
                  <div><strong>🏷️ Event Type:</strong> ${eventGroupData.eventType || 'Not specified'}</div>
                  <div><strong>👥 Max Members:</strong> ${eventGroupData.maxMembers || 'Unlimited'}</div>
                  <div><strong>⏱️ Duration:</strong> ${eventGroupData.duration || 'Not specified'}</div>
                </div>
                ${eventGroupData.meetingUrl ? `<p style="margin-top: 10px;"><strong>🔗 Meeting URL:</strong> <a href="${eventGroupData.meetingUrl}" target="_blank">${eventGroupData.meetingUrl}</a></p>` : ''}
                ${eventGroupData.requirements ? `<p style="margin-top: 10px;"><strong>📋 Requirements:</strong> ${eventGroupData.requirements}</p>` : ''}
              </div>

              ${eventGroupData.tags && eventGroupData.tags.length > 0 ? `
                <div class="event-details">
                  <h3 style="color: #6a5acd; margin-top: 0;">🏷️ Event Tags:</h3>
                  <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${eventGroupData.tags.map(tag => `<span style="background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 16px; font-size: 14px;">${tag}</span>`).join('')}
                  </div>
                </div>
              ` : ''}
              
              <div class="event-details">
                <h3 style="color: #6a5acd; margin-top: 0;">👤 Organizer Information:</h3>
                <p><strong>Name:</strong> ${eventGroupData.organizerName || 'Not provided'}</p>
                <p><strong>Email:</strong> ${eventGroupData.organizerEmail || 'Not provided'}</p>
                <p><strong>Phone:</strong> ${eventGroupData.organizerPhone || 'Not provided'}</p>
                ${eventGroupData.organizerBio ? `<p><strong>Bio:</strong> ${eventGroupData.organizerBio}</p>` : ''}
                ${eventGroupData.organizerLinkedIn ? `<p><strong>LinkedIn:</strong> <a href="${eventGroupData.organizerLinkedIn}" target="_blank">${eventGroupData.organizerLinkedIn}</a></p>` : ''}
              </div>
              
              <h3 style="color: #6a5acd;">📋 Admin Review Checklist:</h3>
              <ul style="color: #555; line-height: 1.8;">
                <li><strong>Content Review:</strong> Check event title and description for appropriate content</li>
                <li><strong>Date Validation:</strong> Ensure event date and time are reasonable</li>
                <li><strong>Contact Verification:</strong> Verify organizer contact information is valid</li>
                <li><strong>Guidelines Compliance:</strong> Ensure event meets platform guidelines</li>
                <li><strong>Spam Check:</strong> Verify this is a legitimate event request</li>
                <li><strong>Capacity Planning:</strong> Review max member limits if specified</li>
              </ul>
              
              <h3 style="color: #6a5acd;">⚡ What Happens Next:</h3>
              <ol style="color: #555; line-height: 1.8;">
                <li><strong>Review the event details</strong> above carefully</li>
                <li><strong>Check organizer credentials</strong> and contact information</li>
                <li><strong>Approve or reject</strong> via admin dashboard</li>
                <li><strong>Organizer will be notified</strong> of your decision automatically</li>
                <li><strong>Event group goes live</strong> immediately upon approval</li>
                <li><strong>Users can start joining</strong> the event group once approved</li>
              </ol>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/event-groups" class="button">
                  🔍 Review Event Group
                </a>
                <br/>
                <a href="mailto:${eventGroupData.organizerEmail}?subject=Re: Event Group Submission - ${eventGroupData.eventTitle}" class="button-secondary">
                  📧 Contact Organizer
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/dashboard" class="button-secondary">
                  📊 Admin Dashboard
                </a>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">💡 Approval Guidelines:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 5px 0;">
                  <li>Events should be professional and educational in nature</li>
                  <li>Organizer contact information must be valid and verifiable</li>
                  <li>Event descriptions should be clear and appropriate</li>
                  <li>No spam, promotional-only, or inappropriate content</li>
                  <li>Events should provide value to the tech community</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                This is an automated notification sent when new event groups are submitted to the platform. 
                Event groups remain hidden from users until admin approval is granted.
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Building amazing tech communities through events and collaboration.</p>
              <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                Event Group: ${eventGroupData.eventTitle || 'Pending Review'} | Organizer: ${eventGroupData.organizerName || 'Unknown'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
New Event Group Submission: ${eventGroupData.eventTitle || 'Unknown Event'}

Hello Admin,

A new event group has been submitted to the platform and requires your approval.

EVENT GROUP DETAILS:
- Event Title: ${eventGroupData.eventTitle || 'No title provided'}
- Organizer: ${eventGroupData.organizerName || 'Unknown'}
- Organizer Email: ${eventGroupData.organizerEmail || 'Not provided'}
- Organization: ${eventGroupData.organizationName || 'Not specified'}
- Event Date: ${eventGroupData.eventDate ? new Date(eventGroupData.eventDate).toLocaleDateString() : 'Not specified'}
- Event Time: ${eventGroupData.eventTime || 'Not specified'}
- Location: ${eventGroupData.location || eventGroupData.venue || 'Not specified'}
- Event Type: ${eventGroupData.eventType || 'Not specified'}
- Max Members: ${eventGroupData.maxMembers || 'Unlimited'}
- Duration: ${eventGroupData.duration || 'Not specified'}
${eventGroupData.meetingUrl ? `- Meeting URL: ${eventGroupData.meetingUrl}` : ''}
${eventGroupData.requirements ? `- Requirements: ${eventGroupData.requirements}` : ''}

${eventGroupData.description ? `EVENT DESCRIPTION:\n${eventGroupData.description}\n\n` : ''}

ORGANIZER INFORMATION:
- Name: ${eventGroupData.organizerName || 'Not provided'}
- Email: ${eventGroupData.organizerEmail || 'Not provided'}
- Phone: ${eventGroupData.organizerPhone || 'Not provided'}
${eventGroupData.organizerBio ? `- Bio: ${eventGroupData.organizerBio}` : ''}
${eventGroupData.organizerLinkedIn ? `- LinkedIn: ${eventGroupData.organizerLinkedIn}` : ''}

NEXT STEPS:
1. Review the event details above carefully
2. Check organizer credentials and contact information  
3. Approve or reject via admin dashboard
4. Organizer will be notified of your decision automatically
5. Event group goes live immediately upon approval
6. Users can start joining the event group once approved

Please review this event group in the admin dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/admin/event-groups

Direct contact with organizer: ${eventGroupData.organizerEmail || 'Not provided'}

Best regards,
The Favored Online Admin System
    `;

    console.log('📧 DEBUG - About to send admin notification email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - Event Group Notifications', 
        address: envVars.EMAIL_USER 
      },
      to: adminEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: eventGroupData.organizerEmail || envVars.EMAIL_USER
    });

    console.log('✅ DEBUG - Admin notification email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Event group admin notification sent successfully',
      results: [{ 
        type: 'new_event_group_submission_admin',
        recipient: adminEmail,
        organizer: eventGroupData.organizerEmail,
        eventGroup: eventGroupData.eventTitle,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending event group admin notification:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
