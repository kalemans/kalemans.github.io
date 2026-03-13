# Anniversary Goals Tracker

A personal goal tracking app for couples and individuals.

## 🔒 IMPORTANT: Security Setup Required

**Before using this app, you MUST configure Firebase security:**

👉 **Read: [FIREBASE_SECURITY_SETUP.md](FIREBASE_SECURITY_SETUP.md)**

This takes 10 minutes and protects your data. Without it, anyone with a Google account could access the app!

**Quick checklist:**
- [ ] Apply Firestore Security Rules with **Email Whitelist** (most important!)
- [ ] Configure Authorized Domains
- [ ] Enable Google Sign-In
- [ ] Update whitelist with your actual Gmail addresses

### 🔐 Email Whitelist Protection

The app uses an **email whitelist** - only specific Gmail addresses can access it:

✅ **Your email** → Can access
✅ **Partner's email** → Can access
❌ **Anyone else** → Blocked (even if they have the URL)

**Setup Guide:** [EMAIL_WHITELIST_GUIDE.md](EMAIL_WHITELIST_GUIDE.md)

---

## Features
- ✅ Secure Firebase Authentication (no passwords in code!)
- ✅ Edit previous days' data with date picker
- ✅ Category dropdown with option to add new categories
- ✅ Personal and Couple goal tabs
- ✅ Weekly overview charts
- ✅ Activity heatmap and statistics
- ✅ Firebase data sync

## Setup

### 1. Secure Your Firebase Project (REQUIRED)

**📖 Follow the complete guide: [FIREBASE_SECURITY_SETUP.md](FIREBASE_SECURITY_SETUP.md)**

Quick summary:
1. Apply Firestore Security Rules (blocks unauthorized access)
2. Configure Authorized Domains (prevents API key misuse)
3. Enable Firebase Authentication
4. Create user accounts

### 2. Firebase Configuration
Update `firebase-config.js` with your Firebase project credentials.

### 2. Enable Google Sign-In

**No passwords to manage - users sign in with their Google accounts!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Get Started** (if first time)
5. Click **Sign-in method** tab
6. Enable **Google** provider
7. Enter support email
8. Click **Save**

### 3. That's It!

No user accounts to create manually. When someone signs in with Google:
- Firebase automatically creates their account
- They stay logged in forever (until they logout)
- No password to remember or type

### 4. Share with Your Partner

Just send her the URL: https://kalemans.github.io

She'll:
1. Click "Sign in with Google"
2. Select her Google account
3. Start using the app immediately!

## Usage
- Click "Sign in with Google" button
- Select your Google account from the popup
- You're logged in and stay logged in forever
- Click dashboard date to select and edit previous days
- Logout button available in the Stats tab footer

## Security
✅ **Google-powered authentication** - Industry-leading security
✅ **No passwords in your code** - Google handles all credentials
✅ **Public repo safe** - No sensitive data exposed
✅ **Persistent sessions** - Stay logged in across browser restarts
✅ **One-click login** - Fastest authentication possible