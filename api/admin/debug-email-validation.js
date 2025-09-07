// =================================================================
// EMAIL VALIDATION DEBUG: api/admin/debug-email-validation.js
// =================================================================

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: "favored-online-f3e8b",
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "favored-online-f3e8b"
    });
  } catch (initError) {
    console.error('❌ Firebase Admin initialization failed:', initError.message);
  }
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authentication
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.ADMIN_AUTO_SUBSCRIBE_KEY || 'favored-admin-subscribe-2025';
  
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       req.headers.host?.includes('localhost') ||
                       req.headers.host?.includes('127.0.0.1');

  if (!isDevelopment && (!apiKey || apiKey !== validApiKey)) {
    return res.status(401).json({ 
      error: 'Unauthorized - Admin API key required'
    });
  }

  try {
    // Get users with email preferences (same as digest query)
    const usersSnapshot = await db.collection('users')
      .where('emailPreferences.dailyDigest', '==', true)
      .get();

    console.log(`📊 Raw query found ${usersSnapshot.size} users with dailyDigest=true`);

    // Apply the SAME filtering logic as the digest code
    const allUsers = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName,
      rawData: {
        email: doc.data().email,
        emailType: typeof doc.data().email,
        hasEmail: !!doc.data().email,
        hasAtSymbol: doc.data().email?.includes?.('@'),
        emailLength: doc.data().email?.length || 0
      }
    }));

    // Filter EXACTLY like the digest code does
    const validUsers = allUsers.filter(user => user.email && user.email.includes('@'));
    const invalidUsers = allUsers.filter(user => !user.email || !user.email.includes('@'));

    console.log(`✅ Valid users after filtering: ${validUsers.length}`);
    console.log(`❌ Invalid users filtered out: ${invalidUsers.length}`);

    return res.json({
      success: true,
      analysis: {
        totalQueryResults: usersSnapshot.size,
        validUsers: validUsers.length,
        invalidUsers: invalidUsers.length,
        validUsersSample: validUsers.slice(0, 5).map(u => ({
          email: u.email,
          displayName: u.displayName
        })),
        invalidUsersSample: invalidUsers.map(u => ({
          uid: u.uid,
          displayName: u.displayName,
          emailIssue: u.rawData
        })),
        emailValidationResults: {
          usersWithNoEmail: allUsers.filter(u => !u.email).length,
          usersWithEmptyEmail: allUsers.filter(u => u.email === '').length,
          usersWithNoAtSymbol: allUsers.filter(u => u.email && !u.email.includes('@')).length,
          usersWithValidEmail: allUsers.filter(u => u.email && u.email.includes('@')).length
        }
      },
      digestFilteringLogic: {
        explanation: "Digest code filters users with: user.email && user.email.includes('@')",
        thisIsWhy: "Some users probably have missing or invalid email addresses",
        solution: "Fix the email addresses for the filtered-out users"
      },
      recommendations: [
        `📊 Raw query finds: ${usersSnapshot.size} users`,
        `✅ Valid emails: ${validUsers.length} users`,
        `❌ Invalid emails: ${invalidUsers.length} users`,
        `🔧 Fix the ${invalidUsers.length} users with invalid emails to reach full 21-user delivery`
      ]
    });

  } catch (error) {
    console.error('💥 Error in email validation debug:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
