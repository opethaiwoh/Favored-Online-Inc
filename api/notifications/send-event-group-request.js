// api/notifications/send-event-group-request.js
// 🔥 Event Group Join Request Email Notification for Group Admins

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
    
    if (!applicantData || !adminData?.email || !applicantData.userEmail) {
      console.log('❌ DEBUG - Validation failed:', { 
        hasApplicantData: !!applicantData,
        hasAdminEmail: !!adminData?.email,
        hasApplicantEmail: !!applicantData?.userEmail,
        applicantEmail: applicantData?.userEmail,
        adminEmail: adminData?.email
      });
      return res.status(400).json({
        success: false, 
        error: 'Applicant data, group admin email, and applicant email are required'
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

    // 🔥 FIXED: Create transport (not createTransporter)
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
    const applicantName = applicantData.userName || applicantData.displayName || 'New Member';
    const emailSubject = `🎪 New Join Request: ${applicantName} wants to join "${eventGroupTitle}"`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to:', adminData.email);
    
    // Extract data
    const applicantEmail = applicantData.userEmail;
    const applicantRole = applicantData.eventRole || applicantData.role || 'Attendee';
    const applicationMessage = applicantData.applicationMessage || applicantData.message || '';
    const appliedAt = applicantData.appliedAt || new Date();
    
    // Event group data
    const eventDescription = eventGroupData?.description || 'Event group description not provided';
    const eventDate = eventGroupData?.eventDate || 'Date not specified';
    const eventLocation = eventGroupData?.location || eventGroupData?.venue || 'Location not specified';
    const eventType = eventGroupData?.eventType || eventGroupData?.type || 'Event';
    const memberCount = eventGroupData?.memberCount || 0;
    const maxMembers = eventGroupData?.maxMembers || 'Unlimited';
    
    // Admin data
    const adminName = adminData.name || adminData.displayName || 'Group Admin';
    const adminEmail = adminData.email;
    
    console.log('📧 DEBUG - Extracted data:', {
      applicantName,
      applicantEmail,
      eventGroupTitle,
      adminName,
      adminEmail,
      applicantRole
    });
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New Event Group Join Request</title>
          <style>
            .container { max-width: 700px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .button-secondary { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .button-danger { background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .applicant-box { background: #e8f5e8; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50; }
            .event-group-header { background: linear-gradient(135deg, #6a5acd, #483d8b); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎪 New Event Group Request!</h1>
              <p style="margin: 5px 0; font-size: 18px;">Someone wants to join your event group</p>
            </div>
            <div class="content">
              <h2>Hello ${adminName}!</h2>
              
              <div class="applicant-box">
                <h3 style="color: #4CAF50; margin: 0 0 10px 0;">👤 New Member Request</h3>
                <p style="margin: 5px 0; font-size: 20px; font-weight: bold;">
                  ${applicantName}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  📧 ${applicantEmail}
                </p>
                <p style="margin: 5px 0; color: #4CAF50; font-weight: bold;">
                  🎭 Requested Role: ${applicantRole}
                </p>
              </div>
              
              <div class="event-group-header">
                <h3 style="margin-top: 0; font-size: 24px;">🎪 ${eventGroupTitle}</h3>
                <p style="margin: 5px 0; opacity: 0.9;">Event Group Join Request</p>
                <p style="color: #ddd; font-size: 14px; margin: 10px 0 0 0;">
                  Request submitted: ${new Date(appliedAt).toLocaleDateString()} at ${new Date(appliedAt).toLocaleTimeString()}
                </p>
              </div>

              ${applicationMessage ? `
              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">💬 Application Message</h3>
                <p style="color: #333; line-height: 1.6; white-space: pre-line; font-style: italic; background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 3px solid #4CAF50;">"${applicationMessage}"</p>
              </div>
              ` : ''}

              <div class="info-section">
                <h3 style="color: #4CAF50; margin-top: 0;">📋 Event Group Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                  <div><strong>📅 Event Date:</strong> ${typeof eventDate === 'object' ? eventDate.toLocaleDateString() : eventDate}</div>
                  <div><strong>📍 Location:</strong> ${eventLocation}</div>
                  <div><strong>🏷️ Event Type:</strong> ${eventType}</div>
                  <div><strong>👥 Current Members:</strong> ${memberCount}${maxMembers !== 'Unlimited' ? ` / ${maxMembers}` : ''}</div>
                </div>
                <div style="margin-top: 15px;">
                  <strong>📝 Description:</strong>
                  <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">${eventDescription}</p>
                </div>
              </div>
              
              <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #e65100; margin-top: 0;">⚡ Admin Actions Required</h3>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}" class="button">
                    ✅ Review & Approve Request
                  </a>
                  <br/>
                  <a href="mailto:${applicantEmail}?subject=Re: Your request to join ${eventGroupTitle}" class="button-secondary">
                    📧 Contact Applicant
                  </a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}?tab=applications" class="button-danger">
                    ❌ Manage Applications
                  </a>
                </div>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">💡 What's Next:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 5px 0;">
                  <li>Review the applicant's information and message</li>
                  <li>Check if they're a good fit for your event group</li>
                  <li>Consider their requested role and availability</li>
                  <li>Approve their request to welcome them to the group</li>
                  <li>Or contact them if you need more information</li>
                </ul>
              </div>

              <div style="background: #e3f2fd; border: 1px solid #2196F3; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1976d2; margin-top: 0;">🎪 Group Management Tips:</h4>
                <ul style="color: #1976d2; font-size: 14px; margin: 5px 0;">
                  <li>Welcome new members with a personal message</li>
                  <li>Share event details and group guidelines</li>
                  <li>Encourage participation in group discussions</li>
                  <li>Keep the group engaged with regular updates</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This join request was submitted through your Favored Online event group listing. You can manage all group members and applications from your event group dashboard.
              </p>
            </div>
            <div class="footer">
              <p>&copy; <script>document.write(new Date().getFullYear());</script> Favored Online. All rights reserved.</p>
              <p>Building communities through amazing events and connections.</p>
              <p style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                Event Group: ${eventGroupTitle} | Admin: ${adminName}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
New Event Group Join Request: ${applicantName} wants to join "${eventGroupTitle}"

Hello ${adminName}!

You have received a new join request for your event group.

APPLICANT DETAILS:
Name: ${applicantName}
Email: ${applicantEmail}
Requested Role: ${applicantRole}

EVENT GROUP: ${eventGroupTitle}
Request submitted: ${new Date(appliedAt).toLocaleDateString()} at ${new Date(appliedAt).toLocaleTimeString()}

${applicationMessage ? `APPLICATION MESSAGE:\n"${applicationMessage}"\n` : ''}

EVENT GROUP DETAILS:
Event Date: ${typeof eventDate === 'object' ? eventDate.toLocaleDateString() : eventDate}
Location: ${eventLocation}
Event Type: ${eventType}
Current Members: ${memberCount}${maxMembers !== 'Unlimited' ? ` / ${maxMembers}` : ''}
Description: ${eventDescription}

ADMIN ACTIONS:
• Review & Approve: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}
• Contact Applicant: ${applicantEmail}
• Manage Applications: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/event-group/${eventGroupData?.id || 'group'}?tab=applications

WHAT'S NEXT:
1. Review the applicant's information and message
2. Check if they're a good fit for your event group
3. Consider their requested role and availability
4. Approve their request to welcome them to the group
5. Or contact them if you need more information

Best regards,
The Favored Online Team

Event Group: ${eventGroupTitle}
Admin: ${adminName}
    `;

    console.log('📧 DEBUG - About to send email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - Event Groups', 
        address: envVars.EMAIL_USER 
      },
      to: adminEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: applicantEmail // Allow admin to reply directly to applicant
    });

    console.log('✅ DEBUG - Email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Event group join request notification email sent successfully',
      results: [{ 
        type: 'event_group_join_request',
        recipient: adminEmail,
        applicant: applicantEmail,
        eventGroup: eventGroupTitle,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending event group join request email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
