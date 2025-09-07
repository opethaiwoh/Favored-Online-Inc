// =================================================================
// FIXED FILE: api/email/preview-digest.js (CommonJS Format)
// =================================================================
const { subDays } = require('date-fns');
const admin = require('firebase-admin');

// Initialize Firebase Admin with your actual project
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

    console.log('✅ Firebase Admin initialized for preview');
  } catch (initError) {
    console.error('❌ Firebase Admin initialization failed:', initError.message);
    throw new Error('Firebase configuration error. Check your service account credentials.');
  }
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('👁️ Generating digest preview for Favored Online Projects...');
    
    const oneWeekAgo = subDays(new Date(), 7);

    // Get sample data from your collections with better error handling
    const results = await Promise.allSettled([
      db.collection('client_projects')
        .where('status', 'in', ['approved', 'active'])
        .where('postedDate', '>=', oneWeekAgo)
        .orderBy('postedDate', 'desc')
        .limit(5)
        .get(),

      db.collection('users')
        .where('emailPreferences.weeklyDigest', '==', true)
        .get(),

      // Posts collection (may not exist)
      db.collection('posts')
        .where('status', '==', 'approved')
        .where('createdAt', '>=', oneWeekAgo)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
    ]);

    // Handle results with proper error checking
    const projectsSnapshot = results[0].status === 'fulfilled' ? results[0].value : { docs: [] };
    const usersSnapshot = results[1].status === 'fulfilled' ? results[1].value : { docs: [] };
    const postsSnapshot = results[2].status === 'fulfilled' ? results[2].value : { docs: [] };

    // Log any errors
    results.forEach((result, index) => {
      const collectionNames = ['client_projects', 'users', 'posts'];
      if (result.status === 'rejected') {
        console.warn(`⚠️ Error fetching ${collectionNames[index]}:`, result.reason.message);
      }
    });

    // Process the data
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      postedDate: doc.data().postedDate?.toDate?.() || new Date()
    }));

    const posts = postsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));

    const subscribedUsers = usersSnapshot.docs.filter(doc => {
      const userData = doc.data();
      return userData.email && userData.email.includes('@'); // Basic validation
    }).length;

    console.log(`📊 Preview data: ${projects.length} projects, ${posts.length} posts, ${subscribedUsers} subscribed users`);

    // Generate preview stats
    const weeklyStats = {
      projectsThisWeek: projects.length,
      postsThisWeek: posts.length,
      subscribedUsers,
      weekOf: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      timeRange: {
        from: oneWeekAgo.toISOString(),
        to: new Date().toISOString()
      }
    };

    // Generate sample email preview (HTML snippet)
    const generatePreviewHTML = () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🚀 Favored Online Weekly Digest</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your weekly tech update</p>
        </div>
        <div style="padding: 30px;">
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${projects.length}</div>
              <div style="font-size: 12px; color: #666;">New Projects</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${posts.length}</div>
              <div style="font-size: 12px; color: #666;">Community Posts</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #4CAF50;">${subscribedUsers}</div>
              <div style="font-size: 12px; color: #666;">Subscribers</div>
            </div>
          </div>
          ${projects.length > 0 ? `
          <h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 8px;">💼 Latest Projects</h2>
          ${projects.slice(0, 2).map(project => `
          <div style="background: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${project.projectTitle || 'Untitled Project'}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">${(project.projectDescription || 'No description').substring(0, 100)}...</p>
            <small style="color: #888;">by ${project.companyName || 'Unknown Company'}</small>
          </div>
          `).join('')}
          ` : '<p style="text-align: center; color: #666; font-style: italic;">No new projects this week</p>'}
        </div>
      </div>
    `;

    return res.json({
      success: true,
      message: 'Preview data generated successfully',
      data: {
        stats: weeklyStats,
        preview: {
          projects: projects.slice(0, 3).map(p => ({
            title: p.projectTitle || 'Untitled Project',
            company: p.companyName || 'Unknown Company',
            description: (p.projectDescription || 'No description available').substring(0, 100) + '...',
            type: p.projectType || 'general',
            postedDate: p.postedDate?.toLocaleDateString() || 'Recently'
          })),
          posts: posts.slice(0, 3).map(p => ({
            title: p.title || 'Untitled Post',
            author: p.authorName || 'Anonymous',
            content: (p.content || 'No content available').substring(0, 100) + '...',
            createdAt: p.createdAt?.toLocaleDateString() || 'Recently'
          })),
          emailHTML: generatePreviewHTML()
        },
        collections: {
          client_projects: {
            exists: results[0].status === 'fulfilled',
            count: projects.length,
            error: results[0].status === 'rejected' ? results[0].reason.message : null
          },
          users: {
            exists: results[1].status === 'fulfilled',
            total: usersSnapshot.docs.length,
            subscribed: subscribedUsers,
            error: results[1].status === 'rejected' ? results[1].reason.message : null
          },
          posts: {
            exists: results[2].status === 'fulfilled',
            count: posts.length,
            error: results[2].status === 'rejected' ? results[2].reason.message : null
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating preview:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
