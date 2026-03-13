// Firebase Configuration
// INSTRUCTIONS: Replace these values with your Firebase project credentials
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Click "Add app" -> Web app (</> icon)
// 4. Copy the config values below
// 5. Enable Firestore Database in Firebase Console

// ⚠️ IMPORTANT: The API key below is SAFE to be public in GitHub
// Firebase API keys are not secret - they just identify your project.
// Real security comes from:
// - Firestore Security Rules (see FIREBASE_SECURITY_SETUP.md)
// - Firebase Authentication (only logged-in users can access data)
// - Authorized Domains (prevents API key use on other websites)
//
// Learn more: https://firebase.google.com/docs/projects/api-keys

export const firebaseConfig = {
    apiKey: "AIzaSyBYrHYxTZGZkNbo-vXiQ7fR7PX6oEZaM90",
    authDomain: "kalemans-firebase.firebaseapp.com",
    projectId: "kalemans-firebase",
    storageBucket: "kalemans-firebase.firebasestorage.app",
    messagingSenderId: "843702658668",
    appId: "1:843702658668:web:8086344d0120fe0e641a49"
};

// Flag to check if Firebase is configured
export const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey !== "YOUR_API_KEY";
};
