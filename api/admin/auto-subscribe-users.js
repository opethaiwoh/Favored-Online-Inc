// =================================================================
// AUTO-SUBSCRIBE SCRIPT: api/admin/auto-subscribe-users.js
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

    console.log('✅ Firebase Admin initialized for auto-subscribe');
  } catch (initError) {
    console.error('❌ Firebase Admin initialization failed:', initError.message);
    throw new Error('Firebase configuration error');
  }
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // Enhanced CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 🔒 ADMIN AUTHENTICATION
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.ADMIN_AUTO_SUBSCRIBE_KEY || 'favored-admin-subscribe-2025';
  
  // Skip API key for localhost/development
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       req.headers.host?.includes('localhost') ||
                       req.headers.host?.includes('127.0.0.1');

  if (!isDevelopment && (!apiKey || apiKey !== validApiKey)) {
    console.log('❌ Unauthorized auto-subscribe access attempt');
    return res.status(401).json({ 
      error: 'Unauthorized - Admin API key required',
      hint: 'Add x-api-key header or ?apiKey=... parameter'
    });
  }

  console.log('✅ Auto-subscribe access authorized');

  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    console.log(`👥 Found ${usersSnapshot.size} total users`);

    if (usersSnapshot.empty) {
      return res.json({
        success: true,
        message: 'No users found to subscribe',
        stats: { total: 0, updated: 0, alreadySubscribed: 0, errors: 0 }
      });
    }

    let updated = 0;
    let alreadySubscribed = 0;
    let errors = 0;
    const errorDetails = [];

    // Process users in batches for performance
    const batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const currentPrefs = userData.emailPreferences || {};

        // Check if user already has both subscriptions
        const hasDaily = currentPrefs.dailyDigest === true;
        const hasWeekly = currentPrefs.weeklyDigest === true;

        if (hasDaily && hasWeekly) {
          alreadySubscribed++;
          continue;
        }

        // Set up default email preferences (auto-subscribe)
        const newPrefs = {
          ...currentPrefs,
          dailyDigest: true,        // Auto-subscribe to daily
          weeklyDigest: true,       // Auto-subscribe to weekly
          notifications: currentPrefs.notifications !== false, // Default to true unless explicitly false
          projectUpdates: currentPrefs.projectUpdates !== false,
          communityUpdates: currentPrefs.communityUpdates !== false,
          lastUpdated: new Date()
        };

        // Add to batch update
        const userRef = db.collection('users').doc(userDoc.id);
        batch.update(userRef, { emailPreferences: newPrefs });
        
        batchCount++;
        updated++;

        // Execute batch every 500 operations (Firestore limit)
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`✅ Processed batch of ${batchCount} users`);
          batchCount = 0;
        }

      } catch (userError) {
        console.error(`❌ Error processing user ${userDoc.id}:`, userError.message);
        errors++;
        errorDetails.push({
          userId: userDoc.id,
          email: userDoc.data().email,
          error: userError.message
        });
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Processed final batch of ${batchCount} users`);
    }

    // Log the operation
    await db.collection('admin_logs').add({
      action: 'auto_subscribe_users',
      timestamp: new Date(),
      stats: {
        totalUsers: usersSnapshot.size,
        updated,
        alreadySubscribed,
        errors
      },
      errorDetails: errorDetails.slice(0, 10), // Limit error details
      adminUser: req.headers['user-agent'] || 'unknown'
    });

    console.log(`🎉 Auto-subscribe completed: ${updated} users subscribed, ${alreadySubscribed} already subscribed, ${errors} errors`);

    return res.json({
      success: true,
      message: `Successfully auto-subscribed ${updated} users to email digests!`,
      stats: {
        totalUsers: usersSnapshot.size,
        updated,
        alreadySubscribed,
        errors,
        newDailySubscribers: updated,
        newWeeklySubscribers: updated
      },
      ...(errors > 0 && { 
        errorSample: errorDetails.slice(0, 5),
        note: `${errors} errors occurred. Check admin_logs collection for details.`
      })
    });

  } catch (error) {
    console.error('💥 Error in auto-subscribe:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
