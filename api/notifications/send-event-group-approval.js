// api/notifications/send-event-group-approval.js
// 🔥 Email notification when applicant is approved to join event group

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { applicantData, eventGroupData, adminData } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('📧 DEBUG - Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📧 DEBUG - applicantData:', applicantData);
    console.log('📧 DEBUG - eventGroupData:', eventGroupData);
    console.log('📧 DEBUG - adminData:', adminData);
    
    if (!applicantData || !applicantData.userEmail || !eventGroupData) {
      console.log('❌ DEBUG - Validation failed:', { 
        hasApplicantData: !!applicantData,
        hasApplicantEmail: !!applicantData?.userEmail,
        hasEventGroupData: !!eventGroupData,
        applicantEmail: applicantData?.userEmail
      });
      return res.status(400).json({
        success: false, 
        error: 'Applicant data with email and event group data are required'
      });
    }

    // Environment variables check
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

    // Create transport
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

    const eventGroupTitle = eventGroupData?.eventTitle || eventGroupData?.title || 'Event Group';
    const applicantName = applicantData.userName || applicantData.displayName || 'Member';
    const emailSubject = `🎉 Welcome to ${eventGroupTitle}! Your application has been approved`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to:', applicantData.userEmail);
    
    // Extract data
    const applicantEmail = applicantData.userEmail;
    const applicantRole = applicantData.eventRole || applicantData.role || 'Attendee';
    const approvedAt = new Date();
    
    // Event group data
    const eventDescription = eventGroupData?.description || 'Event group description not provided';
    const eventDate = eventGroupData?.eventDate || 'Date not specified';
    const eventLocation = eventGroupData?.location || eventGroupData?.venue || 'Location not specified';
    const eventType = eventGroupData?.eventType || eventGroupData?.type || 'Event';
    const memberCount = eventGroupData?.memberCount || 0;
    const maxMembers = eventGroupData?.maxMembers || 'Unlimited';
    const meetingUrl = eventGroupData?.meetingUrl || '';
    
    // Admin data
    const adminName = adminData?.name || adminData?.displayName || 'Event Group Admin';
    
    console.log('📧 DEBUG - Extracted data:', {
      applicantName,
      applicantEmail,
      eventGroupTitle,
      adminName,
      applicantRole
    });
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to ${eventGroupTitle}!</title>
          <style>
            .container { max-width: 700px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .button-secondary { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .button-purple { background-color: #6a5acd; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .welcome-box { background: #e8f5e8; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .event-group-header { background: linear-gradient(135deg, #6a5acd, #483d8b); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .celebration { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p style="margin: 5px 0; font-size: 18px;">You've been approved to join the event group!</p>
            </div>
            <div class="content">
              <h2>Hello ${applicantName}!</h2>
              
              <div class="celebration">
                <h3 style="margin-top: 0; font-size: 24px;">🎊 Welcome to the Community!</h3>
                <p style="margin: 5px 0; font-size: 16px; opacity: 0.9;">
                  Your request to join has been approved by the event organizers.
                </p>
              </div>
              
              <div class="welcome-box">
                <h3 style="color: #4CAF50; margin: 0 0 10px 0;">✅ Application Approved</h3>
                <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">
                  You are now a member of "${eventGroupTitle}"
                </p>
                <p style="margin: 5px 0; color: #666;">
                  👤 Your Role: ${applicantRole}
                </p>
                <p style="margin: 5px 0; color: #4CAF50; font-weight: bold;">
                  📅 Approved: ${approvedAt.toLocaleDateString()} at ${approvedAt.toLocaleTimeString()}
                </p>
              </div>
              
              <div class="event-group-header">
                <h3 style="margin-top: 0; font-size: 24px;">🎪 ${eventGroupTitle}</h3>
                <p style="margin: 5px 0; opacity: 0.9;">You're now part of this amazing event!</p>
                <p style="color: #ddd; font-size: 14px; margin: 10px 0 0 0;">
                  Approved by: ${adminName}
                </p>
              </div>

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">📋 Event Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                  <div><strong>📅 Event Date:</strong> ${typeof eventDate === 'object' ? eventDate.toLocaleDateString() : eventDate}</div>
                  <div><strong>📍 Location:</strong> ${eventLocation}</div>
                  <div><strong>🏷️ Event Type:</strong> ${eventType}</div>
                  <div><strong>👥 Group Size:</strong> ${memberCount}${maxMembers !== 'Unlimited' ? ` / ${maxMembers}` : ''} members</div>
                </div>
                <div style="margin-top: 15px;">
                  <strong>📝 About This Event:</strong>
                  <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">${eventDescription}</p>
                </div>
                ${meetingUrl ? `
                <div style="margin-top: 15px; background: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 3px solid #2196F3;">
                  <strong>🔗 Event Link:</strong>
                  <p style="margin: 5px 0 0 0;"><a href="${meetingUrl}" target="_blank" style="color: #1976d2; text-decoration: none;">${meetingUrl}</a></p>
                </div>
                ` : ''}
              </div>
              
              <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #e65100; margin-top: 0;">🚀 Get Started</h3>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}" class="button">
                    🎪 Access Event Group
                  </a>
                  <br/>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}?tab=discussions" class="button-secondary">
                    💬 Join Discussions
                  </a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}?tab=members" class="button-purple">
                    👥 Meet Members
                  </a>
                </div>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">🎯 What's Next:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 5px 0;">
                  <li>Access the event group dashboard to see event details</li>
                  <li>Introduce yourself in the group discussions</li>
                  <li>Connect with other members and organizers</li>
                  <li>Stay updated with event announcements and changes</li>
                  <li>Prepare for an amazing event experience!</li>
                </ul>
              </div>

              <div style="background: #e3f2fd; border: 1px solid #2196F3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1976d2; margin-top: 0;">💡 Member Tips:</h4>
                <ul style="color: #1976d2; font-size: 14px; margin: 5px 0;">
                  <li>Check the event group regularly for updates</li>
                  <li>Participate actively in group discussions</li>
                  <li>Arrive on time and be prepared for the event</li>
                  <li>Respect other members and follow group guidelines</li>
                  <li>Share your excitement and ask questions!</li>
                </ul>
              </div>

              <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #2e7d32; margin-top: 0;">📞 Need Help?</h4>
                <p style="color: #1b5e20; font-size: 14px; margin: 5px 0;">
                  If you have any questions about the event or need assistance, don't hesitate to reach out to the event organizers through the group discussions or contact support.
                </p>
                <div style="margin-top: 10px;">
                  <a href="mailto:${adminData?.email || 'support@favoredsite.com'}?subject=Question about ${eventGroupTitle}" style="color: #2e7d32; text-decoration: none; font-weight: bold;">
                    📧 Contact Event Organizer
                  </a>
                </div>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Thank you for joining our event community! We're excited to have you as part of "${eventGroupTitle}" and look forward to seeing you at the event.
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Building communities through amazing events and connections.</p>
              <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                Welcome to: ${eventGroupTitle} | Your Role: ${applicantRole}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
🎉 Congratulations! Welcome to ${eventGroupTitle}!

Hello ${applicantName}!

Your request to join the event group has been approved! You are now a member of "${eventGroupTitle}".

APPROVAL DETAILS:
- Event Group: ${eventGroupTitle}
- Your Role: ${applicantRole}
- Approved: ${approvedAt.toLocaleDateString()} at ${approvedAt.toLocaleTimeString()}
- Approved By: ${adminName}

EVENT DETAILS:
- Event Date: ${typeof eventDate === 'object' ? eventDate.toLocaleDateString() : eventDate}
- Location: ${eventLocation}
- Event Type: ${eventType}
- Group Size: ${memberCount}${maxMembers !== 'Unlimited' ? ` / ${maxMembers}` : ''} members
- Description: ${eventDescription}
${meetingUrl ? `- Event Link: ${meetingUrl}` : ''}

WHAT'S NEXT:
1. Access the event group dashboard to see event details
2. Introduce yourself in the group discussions
3. Connect with other members and organizers
4. Stay updated with event announcements and changes
5. Prepare for an amazing event experience!

GET STARTED:
• Access Event Group: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}
• Join Discussions: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}?tab=discussions
• Meet Members: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}?tab=members

MEMBER TIPS:
- Check the event group regularly for updates
- Participate actively in group discussions
- Arrive on time and be prepared for the event
- Respect other members and follow group guidelines
- Share your excitement and ask questions!

Need help? Contact the event organizer: ${adminData?.email || 'support@favoredsite.com'}

Thank you for joining our event community!

Best regards,
The Favored Online Team

Welcome to: ${eventGroupTitle}
Your Role: ${applicantRole}
    `;

    console.log('📧 DEBUG - About to send approval email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - Event Groups', 
        address: envVars.EMAIL_USER 
      },
      to: applicantEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: adminData?.email || envVars.EMAIL_USER
    });

    console.log('✅ DEBUG - Approval email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Event group approval notification email sent successfully',
      results: [{ 
        type: 'event_group_member_approved',
        recipient: applicantEmail,
        eventGroup: eventGroupTitle,
        role: applicantRole,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending event group approval email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
