# Firebase Security Setup Guide

## 🔒 Important: Secure Your Firebase Project

Your Firebase API key is **designed to be public** and is safe in your GitHub repo. However, you **MUST** configure proper security rules to protect your data.

**Without these security measures, anyone could potentially access your data!**

---

## ✅ Step 1: Apply Firestore Security Rules (CRITICAL)

These rules ensure only authenticated users can access your goals data.

### Method A: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kalemans-firebase**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top
5. You'll see an editor with existing rules

6. **Replace ALL existing rules** with this:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Goals collection - only accessible by authenticated users
    match /goals/{document=**} {
      // Allow read if user is authenticated
      allow read: if isAuthenticated();

      // Allow write (create, update, delete) if user is authenticated
      allow write: if isAuthenticated();
    }

    // Deny all other collections by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

7. Click **Publish** button (top right)
8. Confirm when prompted

**✅ Done! Your Firestore is now secured.**

### Method B: Using Firebase CLI (Advanced)

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

This will deploy the `firestore.rules` file from your project.

---

## ✅ Step 2: Configure Authorized Domains

This prevents others from using your API key on their own websites.

1. Still in [Firebase Console](https://console.firebase.google.com/)
2. Click **Authentication** in the left sidebar
3. Click the **Settings** tab at the top
4. Scroll down to **Authorized domains** section

5. **Verify these domains are listed:**
   - ✅ `kalemans.github.io`
   - ✅ `localhost` (for local testing)

6. **Remove any suspicious domains** you don't recognize

7. If `kalemans.github.io` is NOT listed:
   - Click **Add domain**
   - Enter: `kalemans.github.io`
   - Click **Add**

**✅ Done! Your API key can only be used from authorized domains.**

---

## ✅ Step 3: Restrict Authentication Methods (Optional but Recommended)

Limit how users can create accounts:

1. Firebase Console → **Authentication** → **Settings**
2. Scroll to **User actions** section
3. Find **Email enumeration protection**
   - Toggle **ON** (protects user emails from being discovered)

4. Under **Sign-up** section (if available):
   - Consider disabling **Create new users** if you don't want random people creating accounts
   - You can manually create all user accounts yourself

---

## ✅ Step 4: Set Up Firestore Indexes (Optional)

If you see "missing index" errors in console:

1. Firebase Console → **Firestore Database**
2. Click **Indexes** tab
3. Firebase will show recommended indexes
4. Click **Create Index** if any are suggested

**Most likely you won't need this for your simple app.**

---

## ✅ Step 5: Verify Your Security

### Test Authentication Requirement:

1. **Log out** of your app (or use incognito window)
2. Try to access: https://kalemans.github.io
3. You should see the **login screen** (not the app)
4. Try to login with invalid credentials
5. Should show error message
6. Login with valid credentials
7. Should see the app and your data

### Test Firestore Rules:

Open browser console (F12) and try this while **NOT logged in**:

```javascript
// This should FAIL with permission denied
firebase.firestore().collection('goals').get()
  .then(() => console.log('❌ BAD: Unauthenticated access allowed!'))
  .catch(() => console.log('✅ GOOD: Access denied as expected'));
```

If you see "✅ GOOD", your security rules are working!

---

## 🛡️ What Each Security Layer Does

### 1. **Firestore Security Rules** (Most Important)
- ✅ Blocks unauthenticated database access
- ✅ Requires valid Firebase Auth token
- ✅ Enforces read/write permissions
- ⚠️ **Without this: Anyone can read/write your data**

### 2. **Authorized Domains**
- ✅ Prevents API key use on other websites
- ✅ Blocks someone from copying your key to their site
- ⚠️ **Without this: People can use your Firebase quota**

### 3. **Firebase Authentication**
- ✅ Verifies user identity
- ✅ Only you can create user accounts
- ✅ Built-in brute force protection

---

## 🚨 Current Security Status

Check your current security:

### ❌ INSECURE (Before this setup):
```
Firebase API Key: Public (this is OK)
Firestore Rules: Probably too open ⚠️
Authorized Domains: May include untrusted domains ⚠️
Authentication: Enabled ✓
```

### ✅ SECURE (After this setup):
```
Firebase API Key: Public (this is OK)
Firestore Rules: Only authenticated users ✓
Authorized Domains: Only kalemans.github.io + localhost ✓
Authentication: Enabled ✓
```

---

## 📋 Security Checklist

Before considering your app secure, verify:

- [ ] Firestore Security Rules published (Step 1)
- [ ] Authorized domains configured (Step 2)
- [ ] Only trusted domains listed
- [ ] Tested login/logout works
- [ ] Tested unauthenticated access is blocked
- [ ] Email enumeration protection enabled (Step 3)

---

## ❓ Common Questions

### "Is my Firebase API key really safe to expose?"

**YES.** Firebase API keys are meant to be public. They identify your project, not authorize access. Real security comes from:
- Authentication (login required)
- Security Rules (what authenticated users can do)
- Authorized Domains (where the key can be used)

**Source:** [Firebase Official Docs](https://firebase.google.com/docs/projects/api-keys)

### "Can someone steal my data with the API key?"

**Not if you set up security rules correctly.** With the rules from Step 1:
- ❌ Unauthenticated users: Can't read or write
- ✅ Authenticated users: Can only access goals collection
- ❌ Anyone: Can't access other collections

### "Can someone create fake accounts?"

**Not easily.** You control who can create accounts:
- You manually create accounts in Firebase Console
- Or you can enable public signup (but then anyone can register)
- Firebase has built-in rate limiting and bot protection

### "Should I use environment variables to hide the API key?"

**Not necessary for Firebase.** It adds complexity without improving security because:
- API key is meant to be public
- Security comes from rules, not hiding the key
- Your GitHub Actions would still need the key

**However**, if you're paranoid, see Option 3 in the main discussion.

---

## 🆘 Troubleshooting

### "Permission denied" when logged in

**Cause:** Security rules too restrictive or not published

**Fix:**
1. Verify rules are published in Firebase Console
2. Check browser console for specific error
3. Make sure you're logged in (check `firebase.auth().currentUser`)

### "Missing or insufficient permissions"

**Cause:** User not authenticated or rules too strict

**Fix:**
1. Logout and login again
2. Clear browser cache
3. Verify rules match exactly from Step 1

### Data loads before implementing rules

**Cause:** Old rules still active

**Fix:**
1. Go to Firestore → Rules
2. Verify new rules are showing
3. Click Publish again
4. Wait 1-2 minutes for propagation

---

## 📚 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Auth Best Practices](https://firebase.google.com/docs/auth/web/start)
- [Understanding Firebase API Keys](https://firebase.google.com/docs/projects/api-keys)

---

## ✅ You're All Set!

After completing these steps:

1. Your data is protected by authentication
2. Your API key can only be used from your domain
3. Unauthorized access is blocked
4. Your public GitHub repo is safe

**The API key being public is not a security risk when properly configured!**
