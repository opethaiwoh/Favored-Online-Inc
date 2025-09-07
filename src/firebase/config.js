// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Added back for career data storage

// Your web app's Firebase configuration for Favored Online project
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Added back for storing career test data

// Configure auth persistence to handle Safari storage issues
const configurePersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn("Local persistence failed, falling back to session:", error);
    try {
      await setPersistence(auth, browserSessionPersistence);
    } catch (sessionError) {
      console.warn("Session persistence also failed:", sessionError);
    }
  }
};

// Call persistence configuration
configurePersistence();

// Safari and mobile detection
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isAndroid = /Android/i.test(navigator.userAgent);
const isChrome = /Chrome/i.test(navigator.userAgent);
const isSamsungBrowser = /SamsungBrowser/i.test(navigator.userAgent);
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isSafariMobile = isSafari && isMobile;
const isAndroidMobile = isAndroid && isMobile;
const isMobileWithStorageIssues = isSafariMobile || isAndroidMobile || isSamsungBrowser;

// Enhanced sign-in function that handles Safari issues
export const signInWithProvider = async (provider) => {
  try {
    if (isMobileWithStorageIssues) {
      // Use popup for mobile browsers with known storage issues
      console.log("Mobile browser with potential storage issues detected - using popup authentication");
      return await signInWithPopup(auth, provider);
    } else {
      // Use redirect for desktop browsers
      console.log("Using redirect authentication");
      return await signInWithRedirect(auth, provider);
    }
  } catch (error) {
    console.error("Auth error:", error);
    
    // Handle specific error codes
    switch (error.code) {
      case 'auth/missing-initial-state':
      case 'auth/web-storage-unsupported':
        // Mobile storage issues (Safari, Android Chrome, Samsung Browser, etc.)
        try {
          console.log("Storage issue detected - falling back to popup authentication");
          return await signInWithPopup(auth, provider);
        } catch (popupError) {
          console.error("Popup fallback also failed:", popupError);
          throw new Error("Authentication failed due to browser storage restrictions. Please try refreshing the page or using a different browser.");
        }

      case 'auth/popup-blocked':
        throw new Error("Popup was blocked. Please allow popups for this site and try again.");
      
      case 'auth/popup-closed-by-user':
        throw new Error("Sign-in was cancelled. Please try again.");
      
      case 'auth/cancelled-popup-request':
        // User opened multiple popups, ignore this error
        console.log("Multiple popup request cancelled");
        return null;
      
      case 'auth/network-request-failed':
        throw new Error("Network error. Please check your internet connection and try again.");
      
      case 'auth/too-many-requests':
        throw new Error("Too many failed attempts. Please try again later.");
      
      case 'auth/user-disabled':
        throw new Error("This account has been disabled. Please contact support.");
      
      case 'auth/operation-not-allowed':
        throw new Error("This sign-in method is not enabled. Please contact support.");
      
      case 'auth/invalid-credential':
        throw new Error("Invalid credentials. Please try again.");
      
      case 'auth/account-exists-with-different-credential':
        throw new Error("An account already exists with this email using a different sign-in method.");
      
      default:
        // Generic error message for unknown errors
        throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
    }
  }
};

// Handle auth state recovery and redirect results
const handleAuthRecovery = () => {
  // Check for redirect result on page load
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        console.log("Redirect authentication successful:", result.user.uid);
      }
    })
    .catch((error) => {
      console.error("Redirect result error:", error);
      
      // Handle specific recovery errors
      switch (error.code) {
        case 'auth/missing-initial-state':
        case 'auth/web-storage-unsupported':
          // Clear any stale auth state
          auth.signOut().then(() => {
            console.log("Cleared stale auth state due to storage issues");
          }).catch(signOutError => {
            console.error("Failed to clear auth state:", signOutError);
          });
          break;
        
        case 'auth/network-request-failed':
          console.log("Network error during auth recovery - will retry on next page load");
          break;
        
        default:
          console.error("Unhandled auth recovery error:", error);
      }
    });
};

// Utility function to get user-friendly error messages
const getAuthErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  switch (error?.code) {
    case 'auth/missing-initial-state':
    case 'auth/web-storage-unsupported':
      if (isAndroidMobile) {
        return "Android browser storage issue detected. Please try refreshing the page, clearing browser data, or using Chrome browser.";
      } else if (isSafariMobile) {
        return "Safari mobile storage issue detected. Please try refreshing the page or enabling cross-site tracking in Safari settings.";
      } else {
        return "Browser storage issue detected. Please try refreshing the page or using a different browser.";
      }
    
    case 'auth/popup-blocked':
      return "Popup was blocked by your browser. Please allow popups for this site and try again.";
    
    case 'auth/popup-closed-by-user':
      return "Sign-in was cancelled. Please try again.";
    
    case 'auth/network-request-failed':
      return "Network error. Please check your internet connection and try again.";
    
    case 'auth/too-many-requests':
      return "Too many failed attempts. Please wait a few minutes and try again.";
    
    case 'auth/user-disabled':
      return "This account has been disabled. Please contact support.";
    
    case 'auth/operation-not-allowed':
      return "This sign-in method is not enabled. Please contact support.";
    
    case 'auth/invalid-credential':
      return "Invalid credentials. Please try signing in again.";
    
    case 'auth/account-exists-with-different-credential':
      return "An account already exists with this email using a different sign-in method. Please try signing in with that method.";
    
    default:
      return error?.message || "An unexpected error occurred. Please try again.";
  }
};

// Initialize auth recovery on load
if (typeof window !== 'undefined') {
  handleAuthRecovery();
}

// Enhanced auth state listener
export const setupAuthListener = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("User authenticated:", user.uid);
      callback(user);
    } else {
      console.log("User not authenticated");
      callback(null);
    }
  });
};

// Utility function to check if current browser is Safari mobile
export const isSafariMobileDevice = () => isSafariMobile;

// Utility function to check if current browser is Android mobile  
export const isAndroidMobileDevice = () => isAndroidMobile;

// Utility function to check if current browser has known storage issues
export const hasPotentialStorageIssues = () => isMobileWithStorageIssues;

// Export the services for use in your app (added db back)
export { auth, analytics, db, getAuthErrorMessage };
