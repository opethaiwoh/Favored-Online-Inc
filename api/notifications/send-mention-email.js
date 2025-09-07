// =================================================================
// ADD THIS TO YOUR EXISTING API: /api/notifications/send-mention-email
// =================================================================

import nodemailer from 'nodemailer';

// Configure your email transporter (same as your existing setup)
const transporter = nodemailer.createTransporter({
  // Use your existing email configuration
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { notificationData, mentionedUser, mentioner, postData } = req.body;

    // Validate required data
    if (!notificationData || !mentionedUser || !mentioner) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required notification data' 
      });
    }

    // Don't send email to self
    if (mentionedUser.uid === mentioner.uid) {
      return res.status(200).json({ 
        success: true, 
        message: 'Self-notification skipped' 
      });
    }

    // Don't send if user has no email
    if (!mentionedUser.email) {
      return res.status(200).json({ 
        success: true, 
        message: 'User has no email address' 
      });
    }

    // Generate email content
    const emailData = generateMentionEmail({
      notificationData,
      mentionedUser,
      mentioner,
      postData
    });

    // Send email
    const emailResult = await transporter.sendMail({
      from: `"Favored Online Community" <${process.env.EMAIL_USER}>`,
      to: mentionedUser.email,
      subject: emailData.subject,
      html: emailData.html,
      headers: {
        'X-Entity-Ref-ID': notificationData.postId || '',
        'X-Notification-Type': notificationData.type || 'mention',
        'X-Mentioner-ID': mentioner.uid
      }
    });

    console.log('✅ Mention email sent successfully:', {
      messageId: emailResult.messageId,
      recipient: mentionedUser.email,
      type: notificationData.type,
      mentioner: mentioner.displayName || mentioner.email
    });

    return res.status(200).json({
      success: true,
      messageId: emailResult.messageId,
      type: notificationData.type,
      timestamp: new Date().toISOString(),
      results: [{
        recipient: mentionedUser.email,
        status: 'sent',
        messageId: emailResult.messageId
      }]
    });

  } catch (error) {
    console.error('❌ Error sending mention email:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to send mention notification email',
      details: error.message
    });
  }
}

// Email content generator
function generateMentionEmail({ notificationData, mentionedUser, mentioner, postData }) {
  const appName = 'Favored Online';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://favoronline.com';
  const postUrl = `${appUrl}/community${postData?.id ? `?post=${postData.id}` : ''}`;
  
  const mentionerName = mentioner.firstName && mentioner.lastName 
    ? `${mentioner.firstName} ${mentioner.lastName}`
    : mentioner.displayName || mentioner.email;
    
  const recipientName = mentionedUser.firstName && mentionedUser.lastName 
    ? `${mentionedUser.firstName} ${mentionedUser.lastName}`
    : mentionedUser.displayName || mentionedUser.email.split('@')[0];

  const mentionerPhoto = mentioner.photoURL || null;

  // Generate email based on type
  switch (notificationData.type) {
    case 'reply_mention':
      return {
        subject: `${mentionerName} mentioned you in a reply`,
        html: generateReplyMentionEmail({
          recipientName,
          mentionerName,
          mentionerPhoto,
          content: notificationData.replyContent || '',
          postUrl,
          appName,
          appUrl
        })
      };

    case 'repost_mention':
      return {
        subject: `${mentionerName} mentioned you in a repost`,
        html: generateRepostMentionEmail({
          recipientName,
          mentionerName,
          mentionerPhoto,
          content: notificationData.repostComment || '',
          postTitle: notificationData.postTitle || '',
          postUrl,
          appName,
          appUrl
        })
      };

    case 'post_mention':
      return {
        subject: `${mentionerName} mentioned you in a post`,
        html: generatePostMentionEmail({
          recipientName,
          mentionerName,
          mentionerPhoto,
          content: postData?.title || '',
          postUrl,
          appName,
          appUrl
        })
      };

    default:
      return {
        subject: `${mentionerName} mentioned you on ${appName}`,
        html: generateGenericMentionEmail({
          recipientName,
          mentionerName,
          mentionerPhoto,
          appName,
          appUrl
        })
      };
  }
}

// Email templates (same as before but adapted for your system)
function generateReplyMentionEmail({ recipientName, mentionerName, mentionerPhoto, content, postUrl, appName, appUrl }) {
  const avatarHtml = mentionerPhoto 
    ? `<img src="${mentionerPhoto}" alt="${mentionerName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #84CC16, #22C55E); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${mentionerName.charAt(0).toUpperCase()}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been mentioned!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #84CC16 0%, #22C55E 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">💬 You've been mentioned!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            ${avatarHtml}
            <div style="margin-left: 15px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                Hi ${recipientName}! <strong>${mentionerName}</strong> mentioned you in a reply on the Developer Hub.
              </p>
            </div>
          </div>

          ${content ? `
            <div style="background-color: #F9FAFB; border-left: 4px solid #84CC16; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                "${content}"
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #84CC16 0%, #22C55E 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 16px;">
              View Reply
            </a>
          </div>

          <hr style="border: none; height: 1px; background-color: #E5E7EB; margin: 30px 0;">

          <p style="color: #6B7280; font-size: 12px; text-align: center; margin: 0;">
            You're receiving this because you were mentioned on ${appName}.<br>
            <a href="${appUrl}/settings" style="color: #84CC16; text-decoration: none;">Manage your notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateRepostMentionEmail({ recipientName, mentionerName, mentionerPhoto, content, postTitle, postUrl, appName, appUrl }) {
  const avatarHtml = mentionerPhoto 
    ? `<img src="${mentionerPhoto}" alt="${mentionerName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${mentionerName.charAt(0).toUpperCase()}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been mentioned in a repost!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🔄 You've been mentioned in a repost!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            ${avatarHtml}
            <div style="margin-left: 15px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                Hi ${recipientName}! <strong>${mentionerName}</strong> mentioned you in a repost.
              </p>
              ${postTitle ? `
                <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">
                  Reposting: "${postTitle}"
                </p>
              ` : ''}
            </div>
          </div>

          ${content ? `
            <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                "${content}"
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 16px;">
              View Repost
            </a>
          </div>

          <hr style="border: none; height: 1px; background-color: #E5E7EB; margin: 30px 0;">

          <p style="color: #6B7280; font-size: 12px; text-align: center; margin: 0;">
            You're receiving this because you were mentioned on ${appName}.<br>
            <a href="${appUrl}/settings" style="color: #10B981; text-decoration: none;">Manage your notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePostMentionEmail({ recipientName, mentionerName, mentionerPhoto, content, postUrl, appName, appUrl }) {
  const avatarHtml = mentionerPhoto 
    ? `<img src="${mentionerPhoto}" alt="${mentionerName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #8B5CF6, #7C3AED); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${mentionerName.charAt(0).toUpperCase()}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been mentioned in a post!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">📝 You've been mentioned in a post!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            ${avatarHtml}
            <div style="margin-left: 15px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                Hi ${recipientName}! <strong>${mentionerName}</strong> mentioned you in a post on the Developer Hub.
              </p>
            </div>
          </div>

          ${content ? `
            <div style="background-color: #FAF5FF; border-left: 4px solid #8B5CF6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5; font-weight: 600;">
                "${content}"
              </p>
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${postUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 16px;">
              View Post
            </a>
          </div>

          <hr style="border: none; height: 1px; background-color: #E5E7EB; margin: 30px 0;">

          <p style="color: #6B7280; font-size: 12px; text-align: center; margin: 0;">
            You're receiving this because you were mentioned on ${appName}.<br>
            <a href="${appUrl}/settings" style="color: #8B5CF6; text-decoration: none;">Manage your notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateGenericMentionEmail({ recipientName, mentionerName, mentionerPhoto, appName, appUrl }) {
  const avatarHtml = mentionerPhoto 
    ? `<img src="${mentionerPhoto}" alt="${mentionerName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">` 
    : `<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(45deg, #84CC16, #22C55E); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${mentionerName.charAt(0).toUpperCase()}</div>`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You've been mentioned!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #84CC16 0%, #22C55E 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">🔔 You've been mentioned!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px;">
            ${avatarHtml}
            <div style="margin-left: 15px;">
              <p style="margin: 0; color: #374151; font-size: 16px;">
                Hi ${recipientName}! <strong>${mentionerName}</strong> mentioned you on the Developer Hub.
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/community" style="display: inline-block; background: linear-gradient(135deg, #84CC16 0%, #22C55E 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: 600; font-size: 16px;">
              View Community
            </a>
          </div>

          <hr style="border: none; height: 1px; background-color: #E5E7EB; margin: 30px 0;">

          <p style="color: #6B7280; font-size: 12px; text-align: center; margin: 0;">
            You're receiving this because you were mentioned on ${appName}.<br>
            <a href="${appUrl}/settings" style="color: #84CC16; text-decoration: none;">Manage your notification preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
