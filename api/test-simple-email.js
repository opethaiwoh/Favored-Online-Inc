// api/test-simple-email.js
// FIXED: Using exact same syntax as your working daily email

const nodemailer = require('nodemailer'); // ✅ Same as your working file

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { email } = req.body;
    
    console.log('🧪 Email test started for:', email);
    
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
    
    // ✅ EXACT SAME SYNTAX as your working daily email
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
    console.log('✅ SMTP connection verified');
    
    const mailOptions = {
      from: {
        name: 'Favored Online',
        address: envVars.FROM_EMAIL
      },
      to: email,
      subject: '🎉 SUCCESS - Email Notifications Working!',
      text: 'Congratulations! Your email notification system is working perfectly.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">🎉 Complete Success!</h2>
          <p>Your Favored Online email notification system is working perfectly!</p>
          <ul>
            <li>✅ Syntax: Matches your working daily email</li>
            <li>✅ Import: CommonJS require (same as daily email)</li>
            <li>✅ Method: createTransport (same as daily email)</li>
            <li>✅ Environment variables: Working</li>
            <li>✅ Email system: Functional</li>
          </ul>
          <p style="color: #666;">Your admin dashboard is ready!</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    
    transporter.close(); // ✅ Same as your working file
    
    return res.status(200).json({
      success: true,
      message: '🎉 Email system working perfectly - syntax matches daily email!',
      messageId: result.messageId,
      syntaxUsed: 'CommonJS require + createTransport',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Email error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
