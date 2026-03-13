# Anniversary Goals Tracker

A personal goal tracking app for couples and individuals.

## 🔒 IMPORTANT: Security Setup Required

**Before using this app, you MUST configure Firebase security:**

👉 **Read: [FIREBASE_SECURITY_SETUP.md](FIREBASE_SECURITY_SETUP.md)**

This takes 5 minutes and protects your data. Without it, your goals data may be publicly accessible!

**Quick checklist:**
- [ ] Apply Firestore Security Rules
- [ ] Configure Authorized Domains
- [ ] Enable Firebase Authentication
- [ ] Create user accounts

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

### 2. Enable Firebase Authentication

**Important: All user credentials are stored securely in Firebase, NOT in your public code!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Get Started** (if first time)
5. Click **Sign-in method** tab
6. Enable **Email/Password** provider
7. Click **Save**

### 3. Create User Accounts

In Firebase Console → Authentication → Users tab:

1. Click **Add user**
2. Enter email: `your-email@example.com`
3. Enter password: `your-secure-password`
4. Click **Add user**
5. Repeat for your partner's account

**Example:**
- User 1: `you@example.com` / `password123`
- User 2: `partner@example.com` / `password456`

### 4. Login to the App

Visit your site and login with the credentials you created in Firebase Console.

## Usage
- Login with email/password (created in Firebase Console)
- Check "Remember me" to stay logged in across browser sessions
- Click dashboard date to select and edit previous days
- Logout button available in the Stats tab footer

## Security
✅ **No passwords in your code** - All credentials stored securely in Firebase
✅ **Industry-standard authentication** - Firebase handles security
✅ **Public repo safe** - No sensitive data exposed
✅ **Multiple users** - Each person has their own login