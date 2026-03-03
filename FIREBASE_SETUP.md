# Firebase Setup Guide

Follow these steps to configure Firebase for your Goals Tracker app.

## Step 1: Create Firebase Project (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** (or select existing project)
3. Enter project name: `kalemans-goals` (or any name you want)
4. Click **Continue**
5. Disable Google Analytics (not needed) or keep it enabled
6. Click **Create project**
7. Wait for it to finish, then click **Continue**

## Step 2: Register Web App

1. In Firebase console, click the **Web icon** (`</>`) to add a web app
2. App nickname: `Goals Tracker` (or any name)
3. **DO NOT** check "Set up Firebase Hosting"
4. Click **Register app**
5. **Copy the firebaseConfig object** - you'll need this!

It looks like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

6. Click **Continue to console**

## Step 3: Enable Firestore Database

1. In the Firebase console left sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **"Start in test mode"** (we'll secure it later)
4. Click **Next**
5. Choose a location (pick closest to you, e.g., `us-central` or `europe-west`)
6. Click **Enable**
7. Wait for database to be created

## Step 4: Configure Your App

1. Open `firebase-config.js` in your code editor
2. Replace the placeholder values with your Firebase config:

```javascript
export const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",           // ← Replace this
    authDomain: "your-project.firebaseapp.com", // ← Replace this
    projectId: "your-project-id",            // ← Replace this
    storageBucket: "your-project.appspot.com", // ← Replace this
    messagingSenderId: "123456789",          // ← Replace this
    appId: "1:123456789:web:xxxxx"          // ← Replace this
};
```

3. Save the file
4. Commit and push:
```bash
git add firebase-config.js
git commit -m "Add Firebase configuration"
git push origin main
```

## Step 5: Test It!

1. Go to https://kalemans.github.io
2. The app should load automatically (no login needed!)
3. Try checking off a goal
4. Open the debug panel (🐛 button) to see Firebase logs
5. Open on mobile - changes should sync!

## Step 6: Secure Your Database (IMPORTANT!)

After testing, secure your Firestore:

1. In Firebase console, go to **Firestore Database** → **Rules**
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /goals/{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 4, 1);
    }
  }
}
```

This allows read/write until April 1, 2026 (plenty of time to add proper auth later).

3. Click **Publish**

## Troubleshooting

**"Firebase not configured yet!"**
- You haven't updated `firebase-config.js` with your actual values
- Make sure you saved and pushed the file

**"Permission denied" errors**
- Check Firestore rules are in "test mode"
- Wait a few minutes for rules to propagate

**Not syncing between devices**
- Clear cache on both devices
- Check debug panel for Firebase errors
- Make sure both devices are online

## Migration from GitHub (Optional)

Your existing data is in `data/goals.json`. To migrate:

1. Open your website on desktop
2. Open browser console (F12)
3. Paste this code:
```javascript
// This will copy your data to Firebase
fetch('https://kalemans.github.io/data/goals.json')
  .then(r => r.json())
  .then(data => {
    firebase.firestore().collection('goals').doc('main').set(data);
    console.log('✓ Data migrated to Firebase!');
  });
```

4. Reload the page - your data should be there!

---

**Need help?** Check the debug panel (🐛) for detailed logs of what's happening.
