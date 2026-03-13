// Firebase Configuration
// INSTRUCTIONS: Replace these values with your Firebase project credentials
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Click "Add app" -> Web app (</> icon)
// 4. Copy the config values below
// 5. Enable Firestore Database in Firebase Console


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

// Authentication Configuration
// IMPORTANT: Change this password to something secure and private
export const AUTH_CONFIG = {
    // Simple password hash (SHA-256) - change "yourpassword" to your actual password
    // To generate: https://emn178.github.io/online-tools/sha256.html
    passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // Default: "password"
    tokenExpiryDays: 90 // How long "remember me" lasts
};
