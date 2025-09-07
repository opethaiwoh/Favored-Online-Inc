// api/notifications/send-event-group-rejection.js
// 🔥 Event Group Rejection Email Notification for Applicants

const nodemailer = require('nodemailer');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { applicantData, eventGroupData, adminData, rejectionReason } = req.body;
    
    // 🔍 DEBUG: Log what we received
    console.log('📧 DEBUG - Full rejection email request:', JSON.stringify(req.body, null, 2));
    console.log('📧 DEBUG - applicantData:', applicantData);
    console.log('📧 DEBUG - eventGroupData:', eventGroupData);
    console.log('📧 DEBUG - adminData:', adminData);
    console.log('📧 DEBUG - rejectionReason:', rejectionReason);
    
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

    const eventGroupTitle = eventGroupData?.eventTitle || eventGroupData?.title || 'Event Group';
    const applicantName = applicantData.userName || applicantData.displayName || 'Member';
    const emailSubject = `📋 Update on your request to join "${eventGroupTitle}"`;
    
    console.log('📧 DEBUG - Email subject:', emailSubject);
    console.log('📧 DEBUG - Sending to:', applicantData.userEmail);
    
    // Extract data
    const applicantEmail = applicantData.userEmail;
    const applicantRole = applicantData.eventRole || applicantData.role || 'Attendee';
    const applicationMessage = applicantData.applicationMessage || applicantData.message || '';
    const appliedAt = applicantData.appliedAt || new Date();
    const finalRejectionReason = rejectionReason || 'The group admin felt this wasn\'t the right fit at this time';
    
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
      applicantRole,
      finalRejectionReason
    });
    
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Event Group Application Update</title>
          <style>
            .container { max-width: 700px; margin: 0 auto; font-family: Arial, sans-serif; }
            .header { background: linear-gradient(135deg, #ff7043, #f4511e); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; background-color: #f9f9f9; }
            .button { background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
            .button-primary { background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .button-secondary { background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; }
            .footer { background-color: #333; color: white; padding: 20px; text-align: center; font-size: 14px; }
            .applicant-box { background: #fff3e0; border: 2px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-section { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ff9800; }
            .event-group-header { background: linear-gradient(135deg, #ff7043, #f4511e); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .encouragement-box { background: #e8f5e8; border: 2px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .reason-box { background: #ffebee; border: 1px solid #f44336; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Application Update</h1>
              <p style="margin: 5px 0; font-size: 18px;">Thank you for your interest in joining our event group</p>
            </div>
            <div class="content">
              <h2>Hello ${applicantName}!</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Thank you for your interest in joining <strong>"${eventGroupTitle}"</strong>. We appreciate the time you took to submit your application and share your enthusiasm for our event.
              </p>
              
              <div class="applicant-box">
                <h3 style="color: #ff9800; margin: 0 0 10px 0;">📝 Your Application Details</h3>
                <p style="margin: 5px 0; font-size: 16px;">
                  <strong>Applied for Role:</strong> ${applicantRole}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Submitted:</strong> ${new Date(appliedAt).toLocaleDateString()} at ${new Date(appliedAt).toLocaleTimeString()}
                </p>
                ${applicationMessage ? `
                <div style="margin: 15px 0;">
                  <strong>Your Message:</strong>
                  <p style="color: #555; line-height: 1.6; white-space: pre-line; font-style: italic; background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 3px solid #ff9800; margin: 8px 0;">"${applicationMessage}"</p>
                </div>
                ` : ''}
              </div>
              
              <div class="event-group-header">
                <h3 style="margin-top: 0; font-size: 24px;">🎪 ${eventGroupTitle}</h3>
                <p style="margin: 5px 0; opacity: 0.9;">Event Group Application Status</p>
                <p style="color: #ffccbc; font-size: 14px; margin: 10px 0 0 0;">
                  Decision made: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                </p>
              </div>

              <div class="reason-box">
                <h3 style="color: #d32f2f; margin-top: 0;">💭 Admin Feedback</h3>
                <p style="color: #333; line-height: 1.6; background: #fff; padding: 15px; border-radius: 6px; border-left: 3px solid #f44336; margin: 8px 0;">
                  <strong>From ${adminName}:</strong><br/>
                  "${finalRejectionReason}"
                </p>
              </div>

              <div class="encouragement-box">
                <h3 style="color: #388e3c; margin-top: 0;">🌟 We Appreciate Your Interest!</h3>
                <p style="color: #1b5e20; line-height: 1.8;">
                  While this particular group wasn't the right fit at this time, we want you to know that your interest in joining our community means a lot to us. There are many opportunities to get involved with Favored Online events!
                </p>
              </div>

              <div class="info-section">
                <h3 style="color: #ff9800; margin-top: 0;">📋 Event Group Details (For Reference)</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
                  <div><strong>📅 Event Date:</strong> ${typeof eventDate === 'object' ? eventDate.toLocaleDateString() : eventDate}</div>
                  <div><strong>📍 Location:</strong> ${eventLocation}</div>
                  <div><strong>🏷️ Event Type:</strong> ${eventType}</div>
                  <div><strong>👥 Group Size:</strong> ${memberCount}${maxMembers !== 'Unlimited' ? ` / ${maxMembers}` : ''} members</div>
                </div>
                <div style="margin-top: 15px;">
                  <strong>📝 Description:</strong>
                  <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">${eventDescription}</p>
                </div>
              </div>
              
              <div style="background: #e3f2fd; border: 1px solid #2196F3; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #1976d2; margin-top: 0;">🚀 What's Next: Explore More Opportunities!</h3>
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/events" class="button-primary">
                    🔍 Browse Other Events
                  </a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/events?type=${eventType}" class="button-secondary">
                    📅 Find Similar ${eventType} Events
                  </a>
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/dashboard" class="button">
                    📊 Visit Your Dashboard
                  </a>
                </div>
              </div>

              <div style="background: #f3e5f5; border: 1px solid #9c27b0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #7b1fa2; margin-top: 0;">💡 Tips for Future Applications:</h4>
                <ul style="color: #7b1fa2; font-size: 14px; margin: 5px 0; line-height: 1.6;">
                  <li>Look for events that match your specific interests and experience level</li>
                  <li>Read event descriptions carefully and align your application accordingly</li>
                  <li>Include specific details about why you're interested in joining</li>
                  <li>Highlight relevant skills or experience you can bring to the group</li>
                  <li>Apply early when new events are posted</li>
                </ul>
              </div>

              <div style="background: #e8f5e8; border: 1px solid #4CAF50; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #388e3c; margin-top: 0;">🎪 Stay Connected with Favored Online:</h4>
                <ul style="color: #1b5e20; font-size: 14px; margin: 5px 0; line-height: 1.6;">
                  <li>Check our events page regularly for new opportunities</li>
                  <li>Set up event notifications for topics you're interested in</li>
                  <li>Connect with other community members</li>
                  <li>Consider creating your own event group</li>
                  <li>Follow us for updates on upcoming community events</li>
                </ul>
              </div>

              <div style="background: #fff3e0; border: 1px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h4 style="color: #e65100; margin-top: 0;">💌 Want to Connect with the Admin?</h4>
                <p style="color: #bf360c; margin: 10px 0;">
                  If you have questions about this decision or would like feedback for future applications, feel free to reach out:
                </p>
                <a href="mailto:${adminEmail}?subject=Question about ${eventGroupTitle} application" class="button-secondary">
                  📧 Contact ${adminName}
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; line-height: 1.6;">
                <strong>Remember:</strong> This decision doesn't reflect on your value as a community member. Different event groups have different needs, timing, and capacity constraints. We encourage you to keep exploring and applying to events that interest you!
              </p>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Thank you again for your interest in <strong>"${eventGroupTitle}"</strong> and for being part of the Favored Online community. We look forward to seeing you at future events!
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
Event Group Application Update: "${eventGroupTitle}"

Hello ${applicantName}!

Thank you for your interest in joining "${eventGroupTitle}". We appreciate the time you took to submit your application and share your enthusiasm for our event.

YOUR APPLICATION DETAILS:
Applied for Role: ${applicantRole}
Submitted: ${new Date(appliedAt).toLocaleDateString()} at ${new Date(appliedAt).toLocaleTimeString()}

${applicationMessage ? `YOUR MESSAGE:\n"${applicationMessage}"\n` : ''}

ADMIN FEEDBACK:
From ${adminName}: "${finalRejectionReason}"

EVENT GROUP DETAILS (For Reference):
Event Date: ${typeof eventDate === 'object' ? eventDate.toLocaleDateString() : eventDate}
Location: ${eventLocation}
Event Type: ${eventType}
Group Size: ${memberCount}${maxMembers !== 'Unlimited' ? ` / ${maxMembers}` : ''} members
Description: ${eventDescription}

WE APPRECIATE YOUR INTEREST!
While this particular group wasn't the right fit at this time, we want you to know that your interest in joining our community means a lot to us. There are many opportunities to get involved with Favored Online events!

WHAT'S NEXT - EXPLORE MORE OPPORTUNITIES:
• Browse Other Events: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/events
• Find Similar ${eventType} Events: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/events?type=${eventType}
• Visit Your Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.favoredonline.com'}/dashboard

TIPS FOR FUTURE APPLICATIONS:
1. Look for events that match your specific interests and experience level
2. Read event descriptions carefully and align your application accordingly
3. Include specific details about why you're interested in joining
4. Highlight relevant skills or experience you can bring to the group
5. Apply early when new events are posted

STAY CONNECTED:
• Check our events page regularly for new opportunities
• Set up event notifications for topics you're interested in
• Connect with other community members
• Consider creating your own event group
• Follow us for updates on upcoming community events

WANT TO CONNECT WITH THE ADMIN?
If you have questions about this decision or would like feedback for future applications:
Contact ${adminName}: ${adminEmail}

REMEMBER: This decision doesn't reflect on your value as a community member. Different event groups have different needs, timing, and capacity constraints. We encourage you to keep exploring and applying to events that interest you!

Thank you again for your interest in "${eventGroupTitle}" and for being part of the Favored Online community. We look forward to seeing you at future events!

Best regards,
The Favored Online Team

Event Group: ${eventGroupTitle}
Admin: ${adminName}
Decision made: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
    `;

    console.log('📧 DEBUG - About to send rejection email...');
    const result = await transporter.sendMail({
      from: { 
        name: 'Favored Online - Event Groups', 
        address: envVars.EMAIL_USER 
      },
      to: applicantEmail,
      subject: emailSubject,
      text: textVersion,
      html: htmlTemplate,
      replyTo: adminEmail // Allow applicant to reply directly to admin
    });

    console.log('✅ DEBUG - Rejection email sent successfully:', result.messageId);
    transporter.close();

    return res.status(200).json({ 
      success: true, 
      message: 'Event group rejection notification email sent successfully',
      results: [{ 
        type: 'event_group_rejection',
        recipient: applicantEmail,
        admin: adminEmail,
        eventGroup: eventGroupTitle,
        rejectionReason: finalRejectionReason,
        messageId: result.messageId 
      }]
    });

  } catch (error) {
    console.error('❌ DEBUG - Error sending event group rejection email:', error);
    console.error('❌ DEBUG - Error stack:', error.stack);
    return res.status(500).json({
      success: false, 
      error: error.message
    });
  }
};
