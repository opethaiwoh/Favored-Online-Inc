// =================================================================
// CREATE FILE: api/email/preview-daily-digest.js
// =================================================================
const { subDays } = require('date-fns');
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

    console.log('✅ Firebase Admin initialized for daily preview');
  } catch (initError) {
    console.error('❌ Firebase Admin initialization failed:', initError.message);
    throw new Error('Firebase configuration error');
  }
}

const db = admin.firestore();

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    console.log('👁️ Generating DAILY digest preview...');
    
    const oneDayAgo = subDays(new Date(), 1);

    // Get daily data with error handling
    const results = await Promise.allSettled([
      db.collection('client_projects')
        .where('status', 'in', ['approved', 'active'])
        .where('postedDate', '>=', oneDayAgo)
        .orderBy('postedDate', 'desc')
        .limit(5)
        .get(),

      db.collection('users')
        .where('emailPreferences.dailyDigest', '==', true)
        .get(),

      db.collection('posts')
        .where('status', '==', 'approved')
        .where('createdAt', '>=', oneDayAgo)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
    ]);

    // Handle results
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
      return userData.email && userData.email.includes('@');
    }).length;

    console.log(`📊 DAILY preview: ${projects.length} projects, ${posts.length} posts, ${subscribedUsers} subscribed users`);

    // Generate daily stats
    const dailyStats = {
      projectsToday: projects.length,
      postsToday: posts.length,
      subscribedUsers,
      today: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      timeRange: {
        from: oneDayAgo.toISOString(),
        to: new Date().toISOString()
      },
      wouldSkip: projects.length === 0 && posts.length === 0
    };

    // Generate daily email preview HTML
    const generateDailyPreviewHTML = () => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; padding: 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 22px;">🌅 Favored Online Daily Update</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Your daily tech update</p>
          <div style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; margin-top: 10px;">
            📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style="padding: 25px;">
          ${dailyStats.wouldSkip ? `
          <div style="text-align: center; padding: 20px; background: #fff8f5; border-radius: 8px; border: 2px dashed #FF6B35;">
            <p style="margin: 0; color: #FF6B35; font-weight: 600;">📭 No new content today</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #666;">Daily digest would be skipped to prevent spam</p>
          </div>
          ` : `
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 25px;">
            <div style="text-align: center; padding: 15px; background: #fff8f5; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: bold; color: #FF6B35;">${projects.length}</div>
              <div style="font-size: 10px; color: #666;">New Projects</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #fff8f5; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: bold; color: #FF6B35;">${posts.length}</div>
              <div style="font-size: 10px; color: #666;">New Posts</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #fff8f5; border-radius: 8px;">
              <div style="font-size: 20px; font-weight: bold; color: #FF6B35;">${subscribedUsers}</div>
              <div style="font-size: 10px; color: #666;">Subscribers</div>
            </div>
          </div>
          ${projects.length > 0 ? `
          <h2 style="color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 6px; font-size: 16px;">🆕 Today's Projects</h2>
          ${projects.slice(0, 2).map(project => `
          <div style="background: #fff8f5; padding: 12px; margin: 12px 0; border-radius: 6px; border-left: 3px solid #FF6B35;">
            <h3 style="margin: 0 0 6px 0; color: #333; font-size: 14px;">${project.projectTitle || 'Untitled Project'}</h3>
            <p style="margin: 0; color: #666; font-size: 12px;">${(project.projectDescription || 'No description').substring(0, 80)}...</p>
            <small style="color: #888;">by ${project.companyName || 'Unknown Company'}</small>
          </div>
          `).join('')}
          ` : ''}
          ${posts.length > 0 ? `
          <h2 style="color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 6px; font-size: 16px;">💬 Today's Posts</h2>
          ${posts.slice(0, 2).map(post => `
          <div style="background: #fff8f5; padding: 12px; margin: 12px 0; border-radius: 6px; border-left: 3px solid #FF6B35;">
            <h3 style="margin: 0 0 6px 0; color: #333; font-size: 14px;">${post.title || 'Untitled Post'}</h3>
            <p style="margin: 0; color: #666; font-size: 12px;">${(post.content || 'No content').substring(0, 80)}...</p>
            <small style="color: #888;">by ${post.authorName || 'Anonymous'}</small>
          </div>
          `).join('')}
          ` : ''}
          `}
        </div>
      </div>
    `;

    return res.json({
      success: true,
      message: 'Daily digest preview generated successfully',
      data: {
        stats: dailyStats,
        preview: {
          projects: projects.slice(0, 3).map(p => ({
            title: p.projectTitle || 'Untitled Project',
            company: p.companyName || 'Unknown Company',
            description: (p.projectDescription || 'No description available').substring(0, 100) + '...',
            type: p.projectType || 'general',
            postedDate: p.postedDate?.toLocaleDateString() || 'Today'
          })),
          posts: posts.slice(0, 3).map(p => ({
            title: p.title || 'Untitled Post',
            author: p.authorName || 'Anonymous',
            content: (p.content || 'No content available').substring(0, 100) + '...',
            createdAt: p.createdAt?.toLocaleDateString() || 'Today'
          })),
          emailHTML: generateDailyPreviewHTML()
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
        },
        smartLogic: {
          wouldSkip: dailyStats.wouldSkip,
          reason: dailyStats.wouldSkip ? 'No new content today - prevents spam' : 'Has content - would send'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating daily preview:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
