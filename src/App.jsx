// src/App.jsx - COMPLETE VERSION with PWA Integration, Service Worker Registration, Notifications, Company Routes, Shop System, 
// and FIXED SinglePost Route

import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🔥 Error Boundary for better error handling
import ErrorBoundary from './components/ErrorBoundary';

// 🔥 PWA Components
import PWAInstallPrompt from './components/PWAInstallPrompt';
import PWAUpdateBanner from './components/PWAUpdateBanner';
import OfflineIndicator from './components/OfflineIndicator';
import { usePWA } from './hooks/usePWA';

// Authentication Components
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './Pages/auth/Login';
import Logout from './Pages/auth/Logout';

// User Components
import UserDashboard from './Pages/user/dashboard';
import UserProfile from './Pages/user/UserProfile';
import FollowersFollowing from './Pages/user/FollowersFollowing';

// Career Test Components
import CareerHome from './Pages/career/CareerHome';
import CareerTest from './Pages/career/CareerTest';
import CareerDashboard from './Pages/career/CareerDashboard';
import CareerResourcesHub from './Pages/career/resources';

// New Career Resource Components
import ProjectEnrollmentPage from './Pages/career/ProjectEnrollmentPage';

// Group Components
import ProjectGroupView from './Pages/career/ProjectGroupView';
import GroupPostView from './Pages/career/GroupPostView';
import MyGroups from './Pages/career/MyGroups';
import ProjectCompletionPage from './Pages/career/ProjectCompletionPage';
import ProjectCompletionForm from './Pages/career/ProjectCompletionForm';
import UserBadgesPage from './Pages/career/UserBadgesPage';

// New Public Pages
import CareerAbout from './Pages/career/CareerAbout';
import CareerContact from './Pages/career/CareerContact';
import Support from './Pages/career/Support';
import PrivacyPolicy from './Pages/career/PrivacyPolicy';
import TermsService from './Pages/career/TermsService';

// Project Components
import ProjectSubmission from './Pages/projects/ProjectSubmission';
import ProjectsListing from './Pages/projects/ProjectsListing';
import ProjectOwnerDashboard from './Pages/projects/ProjectOwnerDashboard';
import ProjectDetail from './Pages/projects/ProjectDetail';
import ProjectEditView from './Pages/projects/ProjectEditView';
import ProjectApplicationForm from './components/ProjectApplicationForm';

// 🎯 Events Components
import EventsListing from './Pages/events/EventsListing';
import EventSubmission from './Pages/events/EventSubmission';
import EventGroupDashboard from './Pages/events/EventGroupDashboard';

// 🔥 NEW: Company Components
import CompanyList from './Pages/companies/CompanyList';
import CreateCompany from './Pages/companies/CreateCompany';
import CompanyView from './Pages/companies/CompanyView';
import MyCompanies from './Pages/companies/MyCompanies';

// 🛍️ NEW: Shop Components
import ShopMain from './Pages/shop/ShopMain';
import DigitalProducts from './Pages/shop/categories/DigitalProducts';
import { Courses, Jobs, Hardware } from './Pages/shop/categories/DigitalProducts';
import ShopSearch from './Pages/shop/ShopSearch';
import { FeaturedListings } from './Pages/shop/ShopSearch';
import SubmitListing from './Pages/shop/SubmitListing';
import MyListings from './Pages/shop/MyListings';

// Community Components
import CommunityPosts from './Pages/community/CommunityPosts';
import SubmitPost from './Pages/community/SubmitPost';
import SinglePost from './Pages/community/SinglePost'; // 🔥 FIXED: Properly imported
import NotificationsPage from './Pages/Notifications';

// Application Components
import SubmitApplication from './Pages/applications/SubmitApplication';

// Admin Components
import AdminDashboard from './Pages/admin/AdminDashboard';
import TestDailyDigest from './Pages/admin/TestDailyDigest';

// TechTalent Badges Component
import TechTalentBadges from './Pages/TechTalentBadges';

// Members Directory for Recruiters/Hiring
import MembersDirectory from './Pages/MembersDirectory';

// Import services
import './services/googleFormService';

// 🔥 NEW: Route Redirect Component for Smart Navigation
const RouteRedirect = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect logged in users from landing pages to their home (community)
    if (currentUser && (location.pathname === '/' || location.pathname === '/career')) {
      navigate('/community', { replace: true });
    }
    
    // Redirect logged out users from protected pages to career landing
    if (!currentUser && ['/community', '/dashboard', '/career/dashboard'].includes(location.pathname)) {
      navigate('/career', { replace: true });
    }
  }, [currentUser, location.pathname, navigate]);

  return null; // This component doesn't render anything
};

// 🔥 Page Loading Component
const PageLoader = () => (
  <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-50 flex items-center justify-center">
    <div className="text-center">
      {/* Animated Logo */}
      <div className="w-20 h-20 mx-auto mb-6">
        <img 
          src="/Images/512X512.png" 
          alt="Favored Online" 
          className="w-full h-full rounded-xl shadow-2xl animate-pulse"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(76, 175, 80, 0.5))'
          }}
        />
      </div>
      
      {/* Loading Animation */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className="w-3 h-3 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
        <div className="w-3 h-3 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
        <div className="w-3 h-3 bg-lime-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
      </div>
      
      {/* Loading Text */}
      <p className="text-white font-bold text-xl mb-2" 
         style={{
           textShadow: '0 0 20px rgba(76, 175, 80, 0.5), 2px 2px 4px rgba(0,0,0,0.8)',
           fontFamily: '"Inter", sans-serif'
         }}>
        Loading Page...
      </p>
      <p className="text-gray-400 text-sm">Just a moment</p>
    </div>
  </div>
);

// 🔥 NEW: Enhanced Protected Route with better redirects
const EnhancedProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/career', { replace: true });
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return <PageLoader />;
  }

  return children;
};

function App() {
  // 🔥 PWA Integration
  const { cachePages } = usePWA();

  // 🔥 SERVICE WORKER REGISTRATION - THE MISSING PIECE!
  useEffect(() => {
    console.log('🚀 App mounted - Starting PWA setup...');
    
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        console.log('📱 Page loaded - Registering service worker...');
        
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('✅ SW registered successfully:', registration.scope);
            console.log('🔧 SW registration details:', registration);
            
            // Force check for updates
            registration.update();
            
            // Listen for install prompt - THIS IS THE KEY!
            window.addEventListener('beforeinstallprompt', (e) => {
              console.log('🎯 BEFOREINSTALLPROMPT FIRED! PWA is installable!');
              console.log('📱 Install prompt event:', e);
              e.preventDefault();
              // Your usePWA hook should catch this event
            });
            
            // Listen for successful app installation
            window.addEventListener('appinstalled', () => {
              console.log('✅ PWA was installed successfully!');
            });
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              console.log('🔄 Service worker update found');
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 New version available');
                }
              });
            });
            
            // Check if app is already running as PWA
            if (window.matchMedia('(display-mode: standalone)').matches) {
              console.log('📱 App is running as PWA (standalone mode)');
            }
            
          })
          .catch((error) => {
            console.error('❌ SW registration failed:', error);
          });
      });
      
      // Also listen for the install prompt immediately (in case it fires before load)
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('🎯 Early beforeinstallprompt fired!');
        e.preventDefault();
      });
      
    } else {
      console.log('⚠️ Service workers not supported in this browser');
    }
    
    // Debug PWA status
    console.log('🔍 PWA Debug Info:', {
      hasServiceWorker: 'serviceWorker' in navigator,
      hasManifest: !!document.querySelector('link[rel="manifest"]'),
      isHTTPS: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent.substring(0, 100) + '...'
    });
    
  }, []);

  // 🔥 Cache important pages when app loads
  useEffect(() => {
    const importantPages = [
      '/dashboard',
      '/career/dashboard',
      '/community',
      '/projects',
      '/my-groups',
      '/tech-badges',
      '/events',
      '/career/test',
      '/my-badges',
      '/notifications',
      '/companies', // 🔥 NEW: Cache company pages
      '/my-companies',
      '/companies/create',
      '/shop', // 🛍️ NEW: Cache shop pages
      '/shop/digital-products',
      '/shop/courses',
      '/shop/jobs',
      '/shop/hardware',
      '/my-listings'
    ];
    
    console.log('💾 Caching important pages:', importantPages);
    cachePages(importantPages);
  }, [cachePages]);

  // 🔥 Monitor PWA installation attempts
  useEffect(() => {
    let installPromptTimeout;
    
    // Set a timeout to check if install prompt fired
    installPromptTimeout = setTimeout(() => {
      console.log('⏰ 30 seconds passed - checking PWA status...');
      console.log('🔍 Install prompt status check:');
      console.log('- Service Worker registered:', !!navigator.serviceWorker.controller);
      console.log('- Manifest found:', !!document.querySelector('link[rel="manifest"]'));
      console.log('- HTTPS:', window.location.protocol === 'https:' || window.location.hostname === 'localhost');
      console.log('- Already standalone:', window.matchMedia('(display-mode: standalone)').matches);
      
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        console.log('💡 If install button not showing, try:');
        console.log('1. Check Chrome menu for "Install Favored Online"');
        console.log('2. Clear browser data and hard reload');
        console.log('3. Check Chrome://apps for existing installation');
      }
    }, 30000);
    
    return () => clearTimeout(installPromptTimeout);
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          {/* 🔥 PWA Components */}
          <PWAUpdateBanner />
          <OfflineIndicator />
          
          {/* 🔥 NEW: Smart Route Redirects */}
          <RouteRedirect />
          
          {/* 🔥 Wrap Routes with Suspense for loading states */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* 🔥 UPDATED: Home Routes - Smart Routing Based on Auth Status */}
              <Route path="/" element={<CareerHome />} />
              
              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/logout" element={<Logout />} />
              
              {/* Redirect old payment route to dashboard (since platform is now free) */}
              <Route path="/payment" element={<Navigate to="/dashboard" replace />} />
              
              {/* 🔥 UPDATED: Public Career Pages - Landing for logged out users */}
              <Route path="/career" element={<CareerHome />} />
              <Route path="/career/about" element={<CareerAbout />} />
              <Route path="/career/contact" element={<CareerContact />} />
              <Route path="/career/support" element={<Support />} />
              <Route path="/career/privacy" element={<PrivacyPolicy />} />
              <Route path="/career/terms" element={<TermsService />} />
              
              {/* Alternative routes for about/contact/support/legal (for compatibility) */}
              <Route path="/about" element={<CareerAbout />} />
              <Route path="/contact" element={<CareerContact />} />
              <Route path="/support" element={<Support />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsService />} />
              
              {/* Members Directory Routes - Multiple paths for accessibility */}
              <Route path="/hire-talents" element={<MembersDirectory />} />
              <Route path="/members" element={<MembersDirectory />} />
              <Route path="/directory" element={<MembersDirectory />} />
              <Route path="/talent-directory" element={<MembersDirectory />} />
              <Route path="/find-talent" element={<MembersDirectory />} />
              
              {/* 🛍️ SHOP ROUTES - FavoredOnline Shop System */}
              
              {/* Main Shop Landing Page */}
              <Route path="/shop" element={<ShopMain />} />
              <Route path="/marketplace" element={<ShopMain />} />
              <Route path="/store" element={<ShopMain />} />

              {/* Shop Category Pages */}
              <Route path="/shop/digital-products" element={<DigitalProducts />} />
              <Route path="/shop/courses" element={<Courses />} />
              <Route path="/shop/jobs" element={<Jobs />} />
              <Route path="/shop/hardware" element={<Hardware />} />

              {/* Alternative category route paths for better SEO */}
              <Route path="/digital-products" element={<DigitalProducts />} />
              <Route path="/ebooks" element={<DigitalProducts />} />
              <Route path="/templates" element={<DigitalProducts />} />
              <Route path="/ai-prompts" element={<DigitalProducts />} />
              <Route path="/dev-tools" element={<DigitalProducts />} />
              
              <Route path="/courses" element={<Courses />} />
              <Route path="/bootcamps" element={<Courses />} />
              <Route path="/learning" element={<Courses />} />
              
              <Route path="/tech-jobs" element={<Jobs />} />
              <Route path="/freelance" element={<Jobs />} />
              <Route path="/remote-jobs" element={<Jobs />} />
              <Route path="/startup-jobs" element={<Jobs />} />
              
              <Route path="/hardware" element={<Hardware />} />
              <Route path="/dev-kits" element={<Hardware />} />
              <Route path="/productivity-gear" element={<Hardware />} />
              <Route path="/workspace" element={<Hardware />} />

              {/* Shop Search and Featured */}
              <Route path="/shop/search" element={<ShopSearch />} />
              <Route path="/shop/featured" element={<FeaturedListings />} />

              {/* Vendor Routes - Protected */}
              <Route path="/shop/submit" element={
                <EnhancedProtectedRoute>
                  <SubmitListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/my-listings" element={
                <EnhancedProtectedRoute>
                  <MyListings />
                </EnhancedProtectedRoute>
              } />
              <Route path="/vendor-dashboard" element={
                <EnhancedProtectedRoute>
                  <MyListings />
                </EnhancedProtectedRoute>
              } />

              {/* Alternative vendor paths */}
              <Route path="/sell" element={
                <EnhancedProtectedRoute>
                  <SubmitListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/list-product" element={
                <EnhancedProtectedRoute>
                  <SubmitListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/create-listing" element={
                <EnhancedProtectedRoute>
                  <SubmitListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/vendor" element={
                <EnhancedProtectedRoute>
                  <MyListings />
                </EnhancedProtectedRoute>
              } />

              {/* 🎯 UPDATED: PROTECTED EVENTS ROUTES */}
              <Route path="/events" element={
                <EnhancedProtectedRoute>
                  <EventsListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/workshops" element={
                <EnhancedProtectedRoute>
                  <EventsListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/webinars" element={
                <EnhancedProtectedRoute>
                  <EventsListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/tech-events" element={
                <EnhancedProtectedRoute>
                  <EventsListing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/learning-events" element={
                <EnhancedProtectedRoute>
                  <EventsListing />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 UPDATED: Protected Event Submission Routes */}
              <Route path="/submit-event" element={
                <EnhancedProtectedRoute>
                  <EventSubmission />
                </EnhancedProtectedRoute>
              } />
              <Route path="/host-event" element={
                <EnhancedProtectedRoute>
                  <EventSubmission />
                </EnhancedProtectedRoute>
              } />
              <Route path="/create-event" element={
                <EnhancedProtectedRoute>
                  <EventSubmission />
                </EnhancedProtectedRoute>
              } />
              <Route path="/events/submit" element={
                <EnhancedProtectedRoute>
                  <EventSubmission />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 NEW: Edit Event Route */}
              <Route path="/edit-event/:eventId" element={
                <EnhancedProtectedRoute>
                  <EventSubmission />
                </EnhancedProtectedRoute>
              } />
              <Route path="/events/edit/:eventId" element={
                <EnhancedProtectedRoute>
                  <EventSubmission />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 NEW: Event Group Dashboard Route */}
              <Route path="/event-group/:eventGroupId" element={
                <EnhancedProtectedRoute>
                  <EventGroupDashboard />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 UPDATED: Public Project Pages with Enhanced Project Detail */}
              <Route path="/projects" element={<ProjectsListing />} />
              <Route path="/projects/:projectId" element={<ProjectDetail />} />
              <Route path="/projects/:projectId/edit" element={
                <EnhancedProtectedRoute>
                  <ProjectEditView />
                </EnhancedProtectedRoute>
              } />
              <Route path="/submit-project" element={<ProjectSubmission />} />
              
              {/* Protected Project Routes */}
              <Route path="/projects/owner-dashboard" element={
                <EnhancedProtectedRoute>
                  <ProjectOwnerDashboard />
                </EnhancedProtectedRoute>
              } />
              <Route path="/projects/:projectId/apply" element={
                <EnhancedProtectedRoute>
                  <ProjectApplicationForm />
                </EnhancedProtectedRoute>
              } />
              <Route path="/project-apply" element={
                <EnhancedProtectedRoute>
                  <ProjectApplicationForm />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 FIXED: PUBLIC Single Post View - Allow sharing to non-logged-in users */}
              <Route path="/community/post/:postId" element={<SinglePost />} />
              <Route path="/post/:postId" element={<SinglePost />} />
              
              {/* 🔥 UPDATED: PROTECTED Community Pages - Home for logged in users */}
              <Route path="/community" element={
                <EnhancedProtectedRoute>
                  <CommunityPosts />
                </EnhancedProtectedRoute>
              } />
              <Route path="/community/submit" element={
                <EnhancedProtectedRoute>
                  <SubmitPost />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 NEW: Notifications Page Route */}
              <Route path="/notifications" element={
                <EnhancedProtectedRoute>
                  <NotificationsPage />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 NEW: Company Routes - Business networking and team collaboration */}
              <Route path="/companies" element={
                <EnhancedProtectedRoute>
                  <CompanyList />
                </EnhancedProtectedRoute>
              } />
              <Route path="/companies/create" element={
                <EnhancedProtectedRoute>
                  <CreateCompany />
                </EnhancedProtectedRoute>
              } />
              <Route path="/companies/:companyId" element={
                <EnhancedProtectedRoute>
                  <CompanyView />
                </EnhancedProtectedRoute>
              } />
              <Route path="/my-companies" element={
                <EnhancedProtectedRoute>
                  <MyCompanies />
                </EnhancedProtectedRoute>
              } />
              
              {/* Alternative company route paths for better SEO and accessibility */}
              <Route path="/business" element={
                <EnhancedProtectedRoute>
                  <CompanyList />
                </EnhancedProtectedRoute>
              } />
              <Route path="/organizations" element={
                <EnhancedProtectedRoute>
                  <CompanyList />
                </EnhancedProtectedRoute>
              } />
              <Route path="/create-company" element={
                <EnhancedProtectedRoute>
                  <CreateCompany />
                </EnhancedProtectedRoute>
              } />
              <Route path="/start-company" element={
                <EnhancedProtectedRoute>
                  <CreateCompany />
                </EnhancedProtectedRoute>
              } />
              
              {/* Application Pages */}
              <Route path="/apply" element={<SubmitApplication />} />
              
              {/* TechTalent Badges Page */}
              <Route path="/tech-badges" element={<TechTalentBadges />} />
              <Route path="/badges" element={<TechTalentBadges />} />
              
              {/* 🔥 UPDATED: User Dashboard - Primary dashboard for logged in users */}
              <Route path="/dashboard" element={
                <EnhancedProtectedRoute>
                  <UserDashboard />
                </EnhancedProtectedRoute>
              } />
              <Route path="/user/dashboard" element={
                <EnhancedProtectedRoute>
                  <UserDashboard />
                </EnhancedProtectedRoute>
              } />
              
              {/* User Profile Route - View member profiles */}
              <Route path="/profile/:userEmail" element={
                <EnhancedProtectedRoute>
                  <UserProfile />
                </EnhancedProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <EnhancedProtectedRoute>
                  <UserProfile />
                </EnhancedProtectedRoute>
              } />
              
              {/* User Followers/Following Routes */}
              <Route path="/profile/:userEmail/followers" element={
                <EnhancedProtectedRoute>
                  <FollowersFollowing />
                </EnhancedProtectedRoute>
              } />
              <Route path="/profile/:userEmail/following" element={
                <EnhancedProtectedRoute>
                  <FollowersFollowing />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 UPDATED: Protected Career Assessment Routes - My Career for logged in users */}
              <Route path="/career/test" element={
                <EnhancedProtectedRoute>
                  <CareerTest />
                </EnhancedProtectedRoute>
              } />
              <Route path="/career/dashboard" element={
                <EnhancedProtectedRoute>
                  <CareerDashboard />
                </EnhancedProtectedRoute>
              } />

              <Route path="/career/resources" element={
                <EnhancedProtectedRoute>
                  <CareerResourcesHub />
                </EnhancedProtectedRoute>
              } />
              
              {/* Career resource routes */}
              <Route path="/career/projects" element={
                <EnhancedProtectedRoute>
                  <ProjectEnrollmentPage />
                </EnhancedProtectedRoute>
              } />
              
              {/* Project Groups - Protected routes for group collaboration */}
              <Route path="/my-groups" element={
                <EnhancedProtectedRoute>
                  <MyGroups />
                </EnhancedProtectedRoute>
              } />
              <Route path="/groups/:groupId" element={
                <EnhancedProtectedRoute>
                  <ProjectGroupView />
                </EnhancedProtectedRoute>
              } />
              <Route path="/groups/:groupId/posts/:postId" element={
                <EnhancedProtectedRoute>
                  <GroupPostView />
                </EnhancedProtectedRoute>
              } />
              
              {/* PROJECT COMPLETION ROUTES - Two-Phase Process */}
              
              {/* PHASE 1: Submit project URL for admin review */}
              <Route path="/groups/:groupId/complete" element={
                <EnhancedProtectedRoute>
                  <ProjectCompletionForm />
                </EnhancedProtectedRoute>
              } />
              
              {/* PHASE 2: Assign badges after admin approval */}
              <Route path="/career/project-completion/:groupId" element={
                <EnhancedProtectedRoute>
                  <ProjectCompletionPage />
                </EnhancedProtectedRoute>
              } />
              
              {/* User Badges and Achievements */}
              <Route path="/my-badges" element={
                <EnhancedProtectedRoute>
                  <UserBadgesPage />
                </EnhancedProtectedRoute>
              } />
              <Route path="/my-achievements" element={
                <EnhancedProtectedRoute>
                  <UserBadgesPage />
                </EnhancedProtectedRoute>
              } />
              
              {/* Admin Dashboard - Protected route for admin access */}
              <Route path="/admin/dashboard" element={
                <EnhancedProtectedRoute>
                  <AdminDashboard />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 NEW: Daily Digest Test Route for Admin */}
              <Route path="/admin/test-daily-digest" element={
                <EnhancedProtectedRoute>
                  <TestDailyDigest />
                </EnhancedProtectedRoute>
              } />
              
              {/* 🔥 UPDATED: 404 Route with Better UX */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center" 
                     style={{
                       backgroundImage: `url('/Images/backg.png')`,
                       backgroundSize: 'cover',
                       backgroundPosition: 'center',
                       backgroundRepeat: 'no-repeat',
                       backgroundAttachment: 'fixed'
                     }}>
                  <div className="bg-black/60 backdrop-blur-xl rounded-2xl p-12 border border-white/20 text-center max-w-md">
                    <div className="text-6xl mb-6">🔍</div>
                    <h1 className="text-4xl font-bold text-white mb-4">404</h1>
                    <p className="text-gray-300 mb-8">Oops! The page you're looking for doesn't exist.</p>
                    <div className="space-y-3">
                      <button 
                        onClick={() => window.location.href = '/career'}
                        className="w-full bg-gradient-to-r from-lime-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-lime-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
                      >
                        🏠 Go Home
                      </button>
                      <button 
                        onClick={() => window.history.back()}
                        className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 backdrop-blur-sm border border-white/20"
                      >
                        ← Go Back
                      </button>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </Suspense>
          
          {/* 🔥 UPDATED: Enhanced Toast Container */}
          <ToastContainer 
            position="top-right" 
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            toastStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '12px',
              color: 'white'
            }}
          />
          
          {/* 🔥 PWA Install Prompt */}
          <PWAInstallPrompt />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
