// =================================================================
// VERCEL-COMPATIBLE: api/email/send-weekly-digest.js - WITH EVENTS AND GROUP POSTS
// =================================================================

const nodemailer = require('nodemailer');
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

    console.log('✅ Firebase Admin initialized successfully');
  } catch (initError) {
    console.error('❌ Firebase Admin initialization failed:', initError.message);
    throw new Error('Firebase configuration error. Check your service account credentials.');
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

  // Debug mode for testing
  const isDebugMode = req.query.debug === 'true';

  // 🔥 VERCEL CRON AUTHENTICATION (Updated for Vercel limitations)
  const isVercelCron = req.headers['x-vercel-cron'] || 
                      req.headers['user-agent']?.includes('vercel') ||
                      req.headers['x-forwarded-host']?.includes('vercel.app');
  
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validApiKey = process.env.WEEKLY_DIGEST_API_KEY || 'favored-weekly-2025';
  
  // Skip API key for localhost/development or Vercel cron
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       req.headers.host?.includes('localhost') ||
                       req.headers.host?.includes('127.0.0.1');

  // 🔥 Allow Vercel cron jobs OR debug mode without API key
  if (!isDevelopment && !isVercelCron && !isDebugMode && (!apiKey || apiKey !== validApiKey)) {
    console.log('❌ Unauthorized weekly digest access attempt');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    return res.status(401).json({ 
      error: 'Unauthorized - API key required or Vercel cron expected',
      hint: 'Add x-api-key header or ?apiKey=... parameter'
    });
  }

  console.log('✅ Weekly digest access authorized', { 
    isVercelCron, 
    hasApiKey: !!apiKey,
    isDevelopment,
    isDebugMode
  });

  // Debug endpoint (GET request)
  if (req.method === 'GET' && isDebugMode) {
    try {
      console.log('🐛 DEBUG MODE - Testing weekly digest setup...');
      
      // Test environment variables
      const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
      const envCheck = {};
      requiredEnvVars.forEach(varName => {
        envCheck[varName.toLowerCase()] = !!process.env[varName];
      });
      envCheck.weekly_digest_api_key = !!process.env.WEEKLY_DIGEST_API_KEY;
      envCheck.is_vercel_cron = isVercelCron;
      envCheck.request_headers = Object.keys(req.headers);
      
      console.log('Environment check:', envCheck);
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      if (missingVars.length > 0) {
        return res.status(500).json({
          success: false,
          debug: true,
          error: `Missing required environment variables: ${missingVars.join(', ')}`,
          environment: envCheck
        });
      }
      
      // Test Firebase connection
      const testDoc = await db.collection('users').limit(1).get();
      console.log(`✅ Firebase connected, found ${testDoc.size} users`);
      
      // Test email transporter
      const transporter = nodemailer.createTransport({ 
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      await transporter.verify();
      console.log('✅ Email transporter verified');
      
      // Check for subscribed users
      const usersSnapshot = await db.collection('users')
        .where('emailPreferences.weeklyDigest', '==', true)
        .get();
        
      const users = usersSnapshot.docs.map(doc => ({
        email: doc.data().email,
        displayName: doc.data().displayName
      })).filter(user => user.email && user.email.includes('@'));
      
      console.log(`👥 Found ${users.length} users subscribed to weekly digest`);
      
      // Check recent content - FIXED: Extended timeframes
      const oneWeekAgo = subDays(new Date(), 7);
      const thirtyDaysAgo = subDays(new Date(), 30); // For projects
      
      // Check projects - Enhanced debugging with extended timeframe
      let projectsCount = 0;
      let projectsDebugInfo = {};
      
      try {
        console.log('🔍 Debugging client_projects collection for weekly digest...');
        
        // First, check if the projects collection exists and get basic info
        const allProjectsSnapshot = await db.collection('client_projects').limit(5).get();
        console.log(`📝 Total projects found (first 5): ${allProjectsSnapshot.size}`);
        projectsDebugInfo.totalProjectsFound = allProjectsSnapshot.size;
        
        if (allProjectsSnapshot.size > 0) {
          const sampleProject = allProjectsSnapshot.docs[0].data();
          console.log('📄 Sample project structure:', Object.keys(sampleProject));
          
          projectsDebugInfo.sampleProjectFields = Object.keys(sampleProject);
          projectsDebugInfo.sampleProjectStatus = sampleProject.status;
          projectsDebugInfo.sampleProjectDate = sampleProject.postedDate || sampleProject.createdAt || sampleProject.dateCreated;
          
          // Try different possible status values
          const statusesToTry = ['approved', 'active', 'published', 'open', 'available', 'pending'];
          for (const status of statusesToTry) {
            try {
              const statusSnapshot = await db.collection('client_projects')
                .where('status', '==', status)
                .limit(3)
                .get();
              if (statusSnapshot.size > 0) {
                console.log(`✅ Found ${statusSnapshot.size} projects with status: ${status}`);
                projectsDebugInfo[`status_${status}`] = statusSnapshot.size;
              }
            } catch (err) {
              console.log(`❌ Error checking status ${status}:`, err.message);
              projectsDebugInfo[`status_${status}_error`] = err.message;
            }
          }
          
          // Try different possible date fields with extended timeframe
          const dateFieldsToTry = ['postedDate', 'createdAt', 'timestamp', 'dateCreated', 'created_at', 'publishedAt'];
          for (const dateField of dateFieldsToTry) {
            try {
              const dateSnapshot = await db.collection('client_projects')
                .where(dateField, '>=', thirtyDaysAgo)
                .limit(3)
                .get();
              if (dateSnapshot.size > 0) {
                console.log(`✅ Found ${dateSnapshot.size} recent projects using date field: ${dateField}`);
                projectsDebugInfo[`dateField_${dateField}`] = dateSnapshot.size;
              }
            } catch (err) {
              console.log(`❌ Error checking date field ${dateField}:`, err.message);
              projectsDebugInfo[`dateField_${dateField}_error`] = err.message;
            }
          }
        } else {
          projectsDebugInfo.note = "No projects found in client_projects collection";
          console.log('📝 No projects found in collection');
        }
        
        // Try the original query - FIXED: Extended timeframe to 30 days
        try {
          const projectsSnapshot = await db.collection('client_projects')
            .where('status', 'in', ['approved', 'active'])
            .where('postedDate', '>=', thirtyDaysAgo)
            .limit(10)
            .get();
            
          console.log(`📊 Original weekly projects query result: ${projectsSnapshot.size} projects`);
          projectsDebugInfo.originalQueryResult = projectsSnapshot.size;
          projectsCount = projectsSnapshot.size;
        } catch (originalError) {
          console.log('❌ Original weekly projects query failed:', originalError.message);
          projectsDebugInfo.originalQueryError = originalError.message;
          
          // Fallback: try without status filter first
          try {
            const fallbackSnapshot = await db.collection('client_projects')
              .where('postedDate', '>=', thirtyDaysAgo)
              .limit(10)
              .get();
            projectsCount = fallbackSnapshot.size;
            projectsDebugInfo.fallbackQuery = 'Used postedDate-only query';
          } catch (err2) {
            // Last resort: get any projects
            const anyProjectsSnapshot = await db.collection('client_projects')
              .limit(10)
              .get();
            projectsCount = 0; // Don't count all projects, just confirm collection exists
            projectsDebugInfo.fallbackQuery = 'Used no-filter query for existence check';
            projectsDebugInfo.collectionExists = anyProjectsSnapshot.size > 0;
          }
        }
        
      } catch (projectsError) {
        console.log('⚠️ Weekly projects debug error:', projectsError.message);
        projectsDebugInfo.debugError = projectsError.message;
        projectsCount = 0;
      }
      
      // Check posts
      let postsCount = 0;
      try {
        const postsSnapshot = await db.collection('posts')
          .where('createdAt', '>=', oneWeekAgo)
          .limit(10)
          .get();
        postsCount = postsSnapshot.size;
      } catch (postsError) {
        console.log('⚠️ Posts query issue:', postsError.message);
      }

      // Check events
      let eventsCount = 0;
      try {
        const eventsSnapshot = await db.collection('tech_events')
          .where('status', '==', 'approved')
          .where('submissionDate', '>=', oneWeekAgo)
          .limit(10)
          .get();
        eventsCount = eventsSnapshot.size;
      } catch (eventsError) {
        console.log('⚠️ Events query issue:', eventsError.message);
        // Fallback: try without status filter
        try {
          const fallbackSnapshot = await db.collection('tech_events')
            .where('submissionDate', '>=', oneWeekAgo)
            .limit(10)
            .get();
          eventsCount = fallbackSnapshot.size;
          console.log('✅ Events fetched using fallback query');
        } catch (fallbackError) {
          console.log('⚠️ Fallback events query also failed:', fallbackError.message);
          eventsCount = 0;
        }
      }

      // 🆕 Check group posts
      let groupPostsCount = 0;
      try {
        const groupPostsSnapshot = await db.collection('group_posts')
          .where('createdAt', '>=', oneWeekAgo)
          .limit(10)
          .get();
        groupPostsCount = groupPostsSnapshot.size;
      } catch (groupPostsError) {
        console.log('⚠️ Group posts query issue:', groupPostsError.message);
      }
      
      return res.json({
        success: true,
        debug: true,
        authenticated: isVercelCron ? 'vercel_cron' : (isDebugMode ? 'debug_mode' : 'api_key'),
        timestamp: new Date().toISOString(),
        environment: envCheck,
        data: {
          subscribedUsers: users.length,
          sampleUsers: users.slice(0, 3).map(u => ({ email: u.email, name: u.displayName })),
          weeklyProjects: projectsCount,
          weeklyPosts: postsCount,
          weeklyEvents: eventsCount,
          weeklyGroupPosts: groupPostsCount, // 🆕 Added group posts count
          weekStarting: oneWeekAgo.toLocaleDateString(),
          projectsTimeframe: '30 days', // NEW: Show extended timeframe
          projectsDebugInfo: projectsDebugInfo
        },
        recommendations: users.length > 0 ? [
          `✅ ${users.length} users subscribed to weekly digest`,
          '✅ Email setup verified',
          '✅ Firebase connection working',
          '🚀 Ready for Vercel cron automation!'
        ] : [
          '⚠️ No users subscribed to weekly digest',
          'Users need emailPreferences.weeklyDigest = true',
          'Check your user collection structure'
        ]
      });
      
    } catch (error) {
      console.error('🚨 Debug error:', error);
      return res.status(500).json({
        success: false,
        debug: true,
        error: error.message
      });
    }
  }

  // Method check - FIXED: Allow GET requests from Vercel cron
  if (req.method !== 'POST' && !(req.method === 'GET' && isVercelCron)) {
    return res.status(405).json({ 
    error: 'Method not allowed',
    allowed: ['POST'],
    hint: 'Use POST for manual triggers, or GET for Vercel cron with ?debug=true to test'
  });
}

  try {
    console.log('📧 Starting weekly digest for Favored Online Projects...', {
      source: isVercelCron ? 'vercel-cron' : 'manual' 
    });

    // Validate environment variables
    const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      return res.status(500).json({
        success: false,
        error: `Missing required environment variables: ${missingVars.join(', ')}`
      });
    }

    // Create email transporter
    const transporter = nodemailer.createTransport({ 
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    });

    // Test email connection
    try {
      await transporter.verify();
      console.log('✅ Email connection verified');
    } catch (emailError) {
      console.error('❌ Email connection failed:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Email configuration error. Check EMAIL_USER and EMAIL_PASSWORD.',
        details: emailError.message
      });
    }

    // Get data from different timeframes - FIXED: Extended project timeframe
    const oneWeekAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);
    console.log(`📅 Fetching posts/events/group posts since: ${oneWeekAgo.toLocaleDateString()}`);
    console.log(`📅 Fetching projects since: ${thirtyDaysAgo.toLocaleDateString()}`);

    // Get projects from last 30 days - FIXED: Extended timeframe for better project coverage
    let projects = [];
    try {
      const projectsSnapshot = await db.collection('client_projects')
        .where('status', 'in', ['approved', 'active'])
        .where('postedDate', '>=', thirtyDaysAgo)
        .orderBy('postedDate', 'desc')
        .limit(10)
        .get();

      projects = projectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        postedDate: doc.data().postedDate?.toDate?.() || new Date()
      }));
    } catch (projectsError) {
      console.warn('⚠️ Could not fetch projects:', projectsError.message);
      // Fallback: try without status filter
      try {
        const fallbackSnapshot = await db.collection('client_projects')
          .where('postedDate', '>=', thirtyDaysAgo)
          .orderBy('postedDate', 'desc')
          .limit(10)
          .get();

        projects = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          postedDate: doc.data().postedDate?.toDate?.() || new Date()
        }));
        console.log('✅ Projects fetched using fallback query');
      } catch (fallbackError) {
        console.warn('⚠️ Fallback projects query also failed:', fallbackError.message);
        projects = [];
      }
    }

    // Get posts from last week
    let posts = [];
    try {
      const postsSnapshot = await db.collection('posts')
        .where('createdAt', '>=', oneWeekAgo)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      posts = postsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
    } catch (postsError) {
      console.warn('⚠️ Could not fetch posts:', postsError.message);
      posts = [];
    }

    // Get events from last week
    let events = [];
    try {
      const eventsSnapshot = await db.collection('tech_events')
        .where('status', '==', 'approved')
        .where('submissionDate', '>=', oneWeekAgo)
        .orderBy('submissionDate', 'desc')
        .limit(10)
        .get();

      events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        eventDate: doc.data().eventDate?.toDate?.() || new Date(),
        submissionDate: doc.data().submissionDate?.toDate?.() || new Date()
      }));
    } catch (eventsError) {
      console.warn('⚠️ Could not fetch events:', eventsError.message);
      // Fallback: try without status filter
      try {
        const fallbackSnapshot = await db.collection('tech_events')
          .where('submissionDate', '>=', oneWeekAgo)
          .orderBy('submissionDate', 'desc')
          .limit(10)
          .get();

        events = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventDate: doc.data().eventDate?.toDate?.() || new Date(),
          submissionDate: doc.data().submissionDate?.toDate?.() || new Date()
        }));
        console.log('✅ Events fetched using fallback query');
      } catch (fallbackError) {
        console.warn('⚠️ Fallback events query also failed:', fallbackError.message);
        events = [];
      }
    }

    // 🆕 NEW: Get group posts from last week
    let groupPosts = [];
    try {
      const groupPostsSnapshot = await db.collection('group_posts')
        .where('createdAt', '>=', oneWeekAgo)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      groupPosts = groupPostsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      console.log(`📝 Found ${groupPosts.length} group posts from last week`);
    } catch (groupPostsError) {
      console.warn('⚠️ Could not fetch group posts:', groupPostsError.message);
      groupPosts = [];
    }

    // Get users who want weekly emails with their group memberships
    const usersSnapshot = await db.collection('users')
      .where('emailPreferences.weeklyDigest', '==', true)
      .get();

    let users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName
    })).filter(user => user.email && user.email.includes('@'));

    // 🆕 NEW: Get group memberships for all users
    console.log(`👥 Getting group memberships for ${users.length} users...`);
    
    for (let user of users) {
      try {
        const membershipSnapshot = await db.collection('group_members')
          .where('userEmail', '==', user.email)
          .where('status', '==', 'active')
          .get();

        user.groupMemberships = membershipSnapshot.docs.map(doc => ({
          groupId: doc.data().groupId,
          role: doc.data().role,
          userName: doc.data().userName
        }));

        // Filter group posts relevant to this user
        user.relevantGroupPosts = groupPosts.filter(post => 
          user.groupMemberships.some(membership => membership.groupId === post.groupId)
        );

        console.log(`📝 User ${user.email}: ${user.groupMemberships.length} groups, ${user.relevantGroupPosts.length} relevant posts`);
      } catch (membershipError) {
        console.warn(`⚠️ Could not fetch memberships for ${user.email}:`, membershipError.message);
        user.groupMemberships = [];
        user.relevantGroupPosts = [];
      }
    }

    console.log(`📊 Found: ${projects.length} projects, ${posts.length} posts, ${events.length} events, ${groupPosts.length} group posts, ${users.length} subscribed users`);

    if (users.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No subscribed users found. Users need emailPreferences.weeklyDigest: true',
        stats: { 
          projects: projects.length, 
          posts: posts.length, 
          events: events.length, 
          groupPosts: groupPosts.length, // 🆕 Added group posts count
          users: 0 
        }
      });
    }

    // 🆕 ENHANCED: Generate email HTML template with group posts
    const generateEmail = (user) => {
      const userName = user.displayName || user.email.split('@')[0] || 'Developer';
      const userGroupPosts = user.relevantGroupPosts || [];
      
      return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Weekly Tech Digest - Favored Online</title>
          <style>
              body { 
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: #f5f5f5;
                  line-height: 1.6;
              }
              .container {
                  background: white;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #4CAF50, #45a049); 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center; 
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
                  font-weight: 800;
                  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              .header p {
                  margin: 15px 0 0 0;
                  font-size: 18px;
                  opacity: 0.9;
              }
              .content { 
                  padding: 40px 30px; 
              }
              .section { 
                  margin-bottom: 40px; 
              }
              .section h2 { 
                  color: #4CAF50; 
                  font-size: 22px; 
                  font-weight: 700;
                  border-bottom: 3px solid #4CAF50; 
                  padding-bottom: 10px;
                  margin-bottom: 25px;
                  display: flex;
                  align-items: center;
              }
              .section h2 .emoji {
                  margin-right: 12px;
                  font-size: 24px;
              }
              .item { 
                  background: #f8f9fa; 
                  padding: 20px; 
                  margin-bottom: 20px; 
                  border-radius: 12px; 
                  border-left: 4px solid #4CAF50;
                  transition: transform 0.2s ease;
              }
              .item h3 { 
                  margin: 0 0 12px 0; 
                  color: #333; 
                  font-size: 18px;
                  font-weight: 600;
                  line-height: 1.4;
              }
              .item p { 
                  margin: 0 0 10px 0; 
                  color: #666; 
                  font-size: 14px; 
                  line-height: 1.5;
              }
              .item .meta {
                  margin-top: 12px;
                  font-size: 12px;
                  color: #888;
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
              }
              .badge {
                  background: #4CAF50;
                  color: white;
                  padding: 4px 10px;
                  border-radius: 15px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              .event-item {
                  background: #f0f8ff;
                  padding: 20px;
                  margin-bottom: 20px;
                  border-radius: 12px;
                  border-left: 4px solid #2196F3;
              }
              .event-badge {
                  background: #2196F3;
                  color: white;
                  padding: 4px 10px;
                  border-radius: 15px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              .group-post-item {
                  background: #e8f5e8;
                  padding: 20px;
                  margin-bottom: 20px;
                  border-radius: 12px;
                  border-left: 4px solid #9C27B0;
              }
              .group-name {
                  background: #9C27B0;
                  color: white;
                  padding: 4px 10px;
                  border-radius: 15px;
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              .post-type-badge {
                  background: #666;
                  color: white;
                  padding: 2px 6px;
                  border-radius: 3px;
                  font-size: 10px;
                  font-weight: 600;
                  display: inline-block;
                  margin-left: 8px;
              }
              .stats {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                  gap: 15px;
                  margin: 30px 0;
              }
              .stat-card {
                  text-align: center;
                  background: #f8f9fa;
                  padding: 20px 15px;
                  border-radius: 10px;
                  border: 1px solid #e9ecef;
              }
              .stat-number {
                  font-size: 24px;
                  font-weight: bold;
                  color: #4CAF50;
                  margin-bottom: 5px;
              }
              .stat-label {
                  font-size: 11px;
                  color: #666;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
              }
              .cta { 
                  text-align: center; 
                  margin: 40px 0;
                  background: linear-gradient(135deg, #4CAF50, #45a049);
                  padding: 30px;
                  border-radius: 12px;
              }
              .cta h3 {
                  color: white;
                  margin: 0 0 20px 0;
                  font-size: 20px;
              }
              .cta a { 
                  background: rgba(255,255,255,0.2); 
                  color: white; 
                  padding: 15px 25px; 
                  text-decoration: none; 
                  border-radius: 25px; 
                  font-weight: 600; 
                  margin: 0 8px;
                  display: inline-block;
                  border: 2px solid rgba(255,255,255,0.3);
                  transition: all 0.3s ease;
              }
              .footer { 
                  background: #2c3e50; 
                  color: #bdc3c7; 
                  padding: 30px; 
                  text-align: center; 
                  font-size: 14px; 
              }
              .footer a { 
                  color: #4CAF50; 
                  text-decoration: none; 
              }
              .no-content {
                  text-align: center;
                  padding: 30px;
                  color: #666;
                  font-style: italic;
                  background: #f8f9fa;
                  border-radius: 10px;
                  border: 2px dashed #ddd;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🚀 Favored Online Weekly Digest</h1>
                  <p>Hi ${userName}! Here's what's happening this week in tech</p>
              </div>
              
              <div class="content">
                  <div class="section">
                      <h2><span class="emoji">📊</span>This Week's Activity</h2>
                      <div class="stats">
                          <div class="stat-card">
                              <div class="stat-number">${projects.length}</div>
                              <div class="stat-label">Recent Projects</div>
                          </div>
                          <div class="stat-card">
                              <div class="stat-number">${posts.length}</div>
                              <div class="stat-label">Community Posts</div>
                          </div>
                          <div class="stat-card">
                              <div class="stat-number">${events.length}</div>
                              <div class="stat-label">Tech Events</div>
                          </div>
                          <div class="stat-card">
                              <div class="stat-number">${userGroupPosts.length}</div>
                              <div class="stat-label">Your Groups</div>
                          </div>
                      </div>
                  </div>

                  ${projects.length > 0 ? `
                  <div class="section">
                      <h2><span class="emoji">💼</span>Recent Projects</h2>
                      ${projects.slice(0, 5).map(project => `
                      <div class="item">
                          <h3>${project.projectTitle || 'Untitled Project'}</h3>
                          <p>${(project.projectDescription || 'No description available').substring(0, 150)}${project.projectDescription?.length > 150 ? '...' : ''}</p>
                          <div class="meta">
                              <span><strong>Company:</strong> ${project.companyName || 'Not specified'}</span>
                              <span class="badge">${(project.projectType || 'general').replace('-', ' ')}</span>
                          </div>
                          <div class="meta">
                              <span><strong>Timeline:</strong> ${project.timeline || 'Flexible'}</span>
                              <span><strong>Posted:</strong> ${project.postedDate?.toLocaleDateString() || 'Recently'}</span>
                          </div>
                      </div>
                      `).join('')}
                  </div>
                  ` : `
                  <div class="section">
                      <h2><span class="emoji">💼</span>Recent Projects</h2>
                      <div class="no-content">
                          <p>No recent projects. Check back soon for exciting opportunities!</p>
                      </div>
                  </div>
                  `}

                  ${events.length > 0 ? `
                  <div class="section">
                      <h2><span class="emoji">🎯</span>Tech Events This Week</h2>
                      ${events.slice(0, 5).map(event => {
                        const eventDate = new Date(event.eventDate);
                        const formatEventType = (type) => {
                          const typeMap = {
                            'workshop': 'Workshop',
                            'webinar': 'Webinar', 
                            'talk': 'Talk/Panel',
                            'conference': 'Conference',
                            'meetup': 'Meetup'
                          };
                          return typeMap[type] || type;
                        };
                        
                        return `
                        <div class="event-item">
                            <h3>${event.eventTitle || 'Untitled Event'}</h3>
                            <p>${(event.eventDescription || 'No description available').substring(0, 150)}${event.eventDescription?.length > 150 ? '...' : ''}</p>
                            <div class="meta">
                                <span><strong>Host:</strong> ${event.organizerName || 'Not specified'}</span>
                                <span class="event-badge">${formatEventType(event.eventType)}</span>
                            </div>
                            <div class="meta">
                                <span><strong>Date:</strong> ${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                <span><strong>Duration:</strong> ${event.duration || 'TBD'}</span>
                            </div>
                        </div>
                        `;
                      }).join('')}
                  </div>
                  ` : `
                  <div class="section">
                      <h2><span class="emoji">🎯</span>Tech Events This Week</h2>
                      <div class="no-content">
                          <p>No new events this week. Stay tuned for upcoming workshops and learning sessions!</p>
                      </div>
                  </div>
                  `}

                  ${userGroupPosts.length > 0 ? `
                  <div class="section">
                      <h2><span class="emoji">👥</span>Your Project Groups Activity</h2>
                      ${userGroupPosts.slice(0, 5).map(groupPost => {
                        const getPostTypeEmoji = (type) => {
                          const typeMap = {
                            'discussion': '💬',
                            'announcement': '📢', 
                            'task': '✅',
                            'update': '📊'
                          };
                          return typeMap[type] || '💬';
                        };
                        
                        const formatPostType = (type) => {
                          const typeMap = {
                            'discussion': 'Discussion',
                            'announcement': 'Announcement',
                            'task': 'Task',
                            'update': 'Update'
                          };
                          return typeMap[type] || type;
                        };
                        
                        return `
                        <div class="group-post-item">
                            <div class="group-name">${groupPost.groupTitle || 'Project Group'}</div>
                            <h3>${getPostTypeEmoji(groupPost.type)} ${groupPost.title || 'Untitled Post'}</h3>
                            <p>${(groupPost.content || 'No content').substring(0, 120)}${groupPost.content?.length > 120 ? '...' : ''}</p>
                            <div class="meta">
                                <span><strong>By:</strong> ${groupPost.authorName || 'Anonymous'}</span>
                                <span class="post-type-badge">${formatPostType(groupPost.type)}</span>
                            </div>
                            <div class="meta">
                                <span><strong>Posted:</strong> ${groupPost.createdAt?.toLocaleDateString() || 'Recently'}</span>
                                ${groupPost.replyCount > 0 ? `<span style="color: #9C27B0;">💬 ${groupPost.replyCount} ${groupPost.replyCount === 1 ? 'reply' : 'replies'}</span>` : ''}
                            </div>
                        </div>
                        `;
                      }).join('')}
                      ${userGroupPosts.length > 5 ? `<p style="text-align: center; color: #666; font-style: italic;">... and ${userGroupPosts.length - 5} more updates from your project groups</p>` : ''}
                  </div>
                  ` : `
                  <div class="section">
                      <h2><span class="emoji">👥</span>Your Project Groups Activity</h2>
                      <div class="no-content">
                          <p>No activity in your project groups this week. Join a project group to stay connected with your team!</p>
                      </div>
                  </div>
                  `}

                  ${posts.length > 0 ? `
                  <div class="section">
                      <h2><span class="emoji">💡</span>Community Highlights</h2>
                      ${posts.slice(0, 5).map(post => {
                        // Handle both regular posts and reposts
                        const content = post.isRepost ? 
                          (post.repostComment || 'Shared a post') : 
                          (post.content || post.originalPost?.content || 'No content available');
                        const displayTitle = post.title || 
                          (post.isRepost ? '🔄 Community Repost' : '💬 Community Post');
                        
                        return `
                        <div class="item">
                            <h3>${displayTitle}</h3>
                            <p>${content.substring(0, 120)}${content.length > 120 ? '...' : ''}</p>
                            <div class="meta">
                                <span><strong>By:</strong> ${post.authorName || post.authorFirstName + ' ' + post.authorLastName || 'Anonymous'}</span>
                                <span><strong>Posted:</strong> ${post.createdAt?.toLocaleDateString() || 'Recently'}</span>
                            </div>
                        </div>
                        `;
                      }).join('')}
                  </div>
                  ` : `
                  <div class="section">
                      <h2><span class="emoji">💡</span>Community Highlights</h2>
                      <div class="no-content">
                          <p>No new community posts this week. Be the first to share your knowledge!</p>
                      </div>
                  </div>
                  `}

                  <div class="cta">
                      <h3>Ready to Take Action?</h3>
                      <a href="https://www.favoredonline.com/projects">Browse All Projects</a>
                      <a href="https://www.favoredonline.com/events">Join Events & Workshops</a>
                      <a href="https://www.favoredonline.com/my-groups">Your Project Groups</a>
                      <a href="https://www.favoredonline.com/career/dashboard">Career Dashboard</a>
                  </div>
              </div>
              
              <div class="footer">
                  <p><strong>Favored Online</strong> - Transforming careers with AI-powered technology</p>
                  <p style="margin: 15px 0;">
                      <a href="https://www.favoredonline.com/email-preferences">Update Email Preferences</a> | 
                      <a href="https://www.favoredonline.com/unsubscribe">Unsubscribe</a> | 
                      <a href="https://www.favoredonline.com">Visit Website</a>
                  </p>
                  <p style="font-size: 12px; opacity: 0.8;">
                      © ${new Date().getFullYear()} Favored Online. All rights reserved.<br>
                      You're receiving this because you subscribed to weekly updates.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
    };

    // Send emails in small batches
    let successful = 0;
    let failed = 0;
    const failedEmails = [];

    for (let i = 0; i < users.length; i += 3) {
      const batch = users.slice(i, i + 3);
      console.log(`📨 Processing batch ${Math.floor(i/3) + 1}/${Math.ceil(users.length/3)} (${batch.length} emails)`);
      
      for (const user of batch) {
        try {
          const userGroupPostsCount = user.relevantGroupPosts?.length || 0;
          console.log(`📧 Sending to ${user.email} (${userGroupPostsCount} group posts included)`);

          await transporter.sendMail({
            from: {
              name: 'Favored Online',
              address: process.env.EMAIL_USER
            },
            to: user.email,
            subject: `🚀 Your Weekly Tech Digest - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
            html: generateEmail(user),
            headers: {
              'List-Unsubscribe': `<https://www.favoredonline.com/unsubscribe?token=${user.uid}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
            }
          });
          
          console.log(`✅ Weekly email sent to ${user.email}`);
          successful++;
        } catch (error) {
          console.error(`❌ Failed to send to ${user.email}:`, error.message);
          failedEmails.push({ email: user.email, error: error.message });
          failed++;
        }
      }

      // Wait 3 seconds between batches
      if (i + 3 < users.length) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Close the transporter
    transporter.close();

    // 🆕 ENHANCED: Log results to Firebase with group posts
    try {
      await db.collection('email_logs').add({
        type: 'weekly_digest',
        timestamp: new Date(),
        stats: {
          totalRecipients: users.length,
          successful,
          failed,
          projectsIncluded: projects.length,
          postsIncluded: posts.length,
          eventsIncluded: events.length,
          groupPostsIncluded: groupPosts.length, // 🆕 Added group posts tracking
          averageGroupPostsPerUser: users.length > 0 ? 
            Math.round((users.reduce((sum, user) => sum + (user.relevantGroupPosts?.length || 0), 0) / users.length) * 10) / 10 
            : 0
        },
        failedEmails: failedEmails,
        service: 'vercel-cron-weekly-digest-with-groups'
      });
    } catch (logError) {
      console.warn('⚠️ Could not save email log:', logError.message);
    }

    console.log(`🎉 Weekly digest with group posts completed: ${successful} sent, ${failed} failed`);

    return res.json({
      success: true,
      message: `Weekly digest with group posts sent! ${successful} emails delivered successfully${failed > 0 ? `, ${failed} failed` : ''}.`,
      stats: {
        totalRecipients: users.length,
        successful,
        failed,
        projectsIncluded: projects.length,
        postsIncluded: posts.length,
        eventsIncluded: events.length,
        groupPostsIncluded: groupPosts.length, // 🆕 Added group posts tracking
        averageGroupPostsPerUser: users.length > 0 ? 
          Math.round((users.reduce((sum, user) => sum + (user.relevantGroupPosts?.length || 0), 0) / users.length) * 10) / 10 
          : 0
      },
      ...(failed > 0 && { failedEmails })
    });

  } catch (error) {
    console.error('💥 Error in weekly digest:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
