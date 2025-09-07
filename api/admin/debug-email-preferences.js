// =================================================================
// DEBUG SCRIPT: api/admin/debug-email-preferences.js
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
    throw new Error('Firebase configuration error');
  }
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

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
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Analyzing ${usersSnapshot.size} users...`);

    let analysis = {
      totalUsers: usersSnapshot.size,
      usersWithEmailPrefs: 0,
      usersWithoutEmailPrefs: 0,
      dailyDigestTrue: 0,
      dailyDigestFalse: 0,
      weeklyDigestTrue: 0,
      weeklyDigestFalse: 0,
      structures: [],
      sampleUsers: []
    };

    usersSnapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      const emailPrefs = userData.emailPreferences;
      
      // Sample first 5 users for detailed analysis
      if (index < 5) {
        analysis.sampleUsers.push({
          email: userData.email,
          hasEmailPrefs: !!emailPrefs,
          emailPrefs: emailPrefs || null,
          structure: emailPrefs ? Object.keys(emailPrefs).sort() : null
        });
      }

      if (emailPrefs) {
        analysis.usersWithEmailPrefs++;
        
        // Count daily digest
        if (emailPrefs.dailyDigest === true) analysis.dailyDigestTrue++;
        if (emailPrefs.dailyDigest === false) analysis.dailyDigestFalse++;
        
        // Count weekly digest  
        if (emailPrefs.weeklyDigest === true) analysis.weeklyDigestTrue++;
        if (emailPrefs.weeklyDigest === false) analysis.weeklyDigestFalse++;
        
        // Track unique structures
        const structure = Object.keys(emailPrefs).sort().join(',');
        const existingStructure = analysis.structures.find(s => s.fields === structure);
        if (existingStructure) {
          existingStructure.count++;
        } else {
          analysis.structures.push({
            fields: structure,
            count: 1,
            example: emailPrefs
          });
        }
      } else {
        analysis.usersWithoutEmailPrefs++;
      }
    });

    // Test the exact queries your digests use
    const dailyQuerySnapshot = await db.collection('users')
      .where('emailPreferences.dailyDigest', '==', true)
      .get();
    
    const weeklyQuerySnapshot = await db.collection('users')
      .where('emailPreferences.weeklyDigest', '==', true)
      .get();

    analysis.queryResults = {
      dailyQueryFinds: dailyQuerySnapshot.size,
      weeklyQueryFinds: weeklyQuerySnapshot.size,
      dailyQuerySample: dailyQuerySnapshot.docs.slice(0, 3).map(doc => ({
        email: doc.data().email,
        dailyDigest: doc.data().emailPreferences?.dailyDigest
      })),
      weeklyQuerySample: weeklyQuerySnapshot.docs.slice(0, 3).map(doc => ({
        email: doc.data().email,
        weeklyDigest: doc.data().emailPreferences?.weeklyDigest
      }))
    };

    return res.json({
      success: true,
      analysis,
      recommendations: [
        `📊 ${analysis.totalUsers} total users`,
        `✅ ${analysis.usersWithEmailPrefs} users have emailPreferences`,
        `❌ ${analysis.usersWithoutEmailPrefs} users missing emailPreferences`,
        `📧 Daily digest query finds: ${analysis.queryResults.dailyQueryFinds} users`,
        `📧 Weekly digest query finds: ${analysis.queryResults.weeklyQueryFinds} users`,
        `🔍 Found ${analysis.structures.length} different emailPreferences structures`
      ]
    });

  } catch (error) {
    console.error('💥 Error in debug script:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
