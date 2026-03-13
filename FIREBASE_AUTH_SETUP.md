# Firebase Authentication Setup Guide

## Overview

Your app uses **Google Sign-In** for authentication. This means:
- ✅ **No passwords to remember or manage**
- ✅ **One-click login with Google accounts**
- ✅ **Sessions persist forever (never re-login)**
- ✅ **Industry-standard security from Google**
- ✅ **Each person uses their own Google account**

---

## Step 1: Enable Google Sign-In

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kalemans-firebase**
3. Click **Authentication** in the left sidebar (🔐 icon)
4. If this is your first time:
   - Click **Get Started**
5. Click the **Sign-in method** tab at the top
6. Find **Google** in the list
7. Click on it
8. Toggle **Enable** to ON
9. Enter **Project support email** (your email address)
10. Click **Save**

**Screenshot locations:**
- Left sidebar: Authentication
- Top tabs: Sign-in method
- Providers list: Google

---

## Step 2: No User Accounts to Create!

**That's the beauty of Google Sign-In** - you don't need to create user accounts in Firebase!

Anyone with a Google account can sign in. The first time they sign in, Firebase automatically creates their user account.

### Who Can Sign In:
- ✅ You (using your Google account)
- ✅ Your partner (using her Google account)
- ❌ Random people (only if you share the URL, but data is still protected by Firestore rules)

### First-Time Login:
When someone clicks "Sign in with Google":
1. Google popup appears
2. They select their Google account
3. Firebase creates their user account automatically
4. They're logged in!

**No manual account creation needed!**

---

## Step 3: Test the Login

1. Visit your site: https://kalemans.github.io
2. You should see a login screen with:
   - **"Sign in with Google"** button

3. Click the button:
   - Google popup will appear
   - Select your Google account
   - Click "Allow" if prompted
   - You're logged in!

4. If successful, you should see the app!

---

## Step 4: Share with Your Partner

Send your partner the website URL:
- **URL**: https://kalemans.github.io

**That's it!** She can login with her own Google account.

### Partner's First Login:
1. Opens the URL
2. Clicks "Sign in with Google"
3. Selects her Google account
4. Done - logged in!

### Partner's Subsequent Visits:
1. Opens the URL
2. **Automatically logged in** - goes straight to the app!

**No re-authentication needed!**

---

## How Sessions Work with Google Sign-In

**Sessions persist FOREVER until manual logout:**
- ✅ Stays logged in after closing browser
- ✅ Stays logged in after restarting phone
- ✅ Stays logged in after days/weeks/months
- ✅ Works seamlessly across visits

**Only logged out when:**
- User clicks "Logout" button
- User clears browser data/cache
- User manually revokes access in Google account settings

---

## Common Issues & Solutions

### "Pop-up blocked" message
- Browser is blocking the Google sign-in popup
- Allow popups for your site
- Click the icon in address bar to allow popups
- Try signing in again

### "This domain is not authorized"
- kalemans.github.io is not in Firebase authorized domains
- Go to Firebase Console → Authentication → Settings → Authorized domains
- Add kalemans.github.io
- Try again

### Google popup appears but nothing happens
- Check browser console for errors (F12)
- Ensure Google provider is enabled in Firebase Console
- Try refreshing the page

### "Sign in cancelled" message
- You closed the Google popup before completing sign-in
- Click "Sign in with Google" again
- Select your Google account and click "Allow"

### Login works but shows error
- Check Firestore security rules are applied
- Verify authorized domains include kalemans.github.io
- Check browser console for specific error

---

## Security Notes

### What's Safe:
- ✅ Your public GitHub repo contains NO passwords
- ✅ Only people with valid Firebase accounts can login
- ✅ Firebase handles all security (encryption, rate limiting, etc.)
- ✅ You can add/remove users anytime in Firebase Console

### Managing Users:
- **Add new user**: Firebase Console → Authentication → Users → Add user
- **Delete user**: Click the user → Delete user (top right)
- **Change password**: Delete user and recreate with new password
- **See who's logged in**: Users tab shows all accounts

---

## Need Help?

If Firebase Authentication isn't working:

1. Verify Email/Password is enabled in Firebase Console
2. Verify you created users in Firebase Console (not in code)
3. Check browser console for error messages (F12)
4. Try logging in with exact credentials from Firebase Console

---

## What Changed in the Code?

For your reference, here's what was updated:

- **Removed**: Custom password hashing logic
- **Removed**: Password hash storage in `firebase-config.js`
- **Added**: Firebase Auth SDK import
- **Added**: Email input field on login screen
- **Added**: Firebase auth state listener
- **Updated**: Login/logout to use Firebase methods

**You don't need to change any code** - just follow the setup steps above!
