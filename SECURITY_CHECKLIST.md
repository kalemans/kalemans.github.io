# 🔒 Firebase Security Quick Checklist

## Before Your App is Secure

Complete these 4 steps to protect your data:

---

## ✅ Step 1: Apply Firestore Security Rules (5 min)

**Where:** [Firebase Console](https://console.firebase.google.com/) → Firestore Database → Rules

**What to do:**
1. Open Firestore Database
2. Click **Rules** tab
3. Copy/paste rules from `firestore.rules` file
4. Click **Publish**

**Rule file location:** `firestore.rules` in your project

**Why:** Blocks unauthorized access to your data

---

## ✅ Step 2: Configure Authorized Domains (2 min)

**Where:** Firebase Console → Authentication → Settings → Authorized domains

**What to do:**
1. Verify `kalemans.github.io` is listed
2. Verify `localhost` is listed
3. Remove any unknown domains

**Why:** Prevents others from using your API key on their websites

---

## ✅ Step 3: Enable Google Sign-In (1 min)

**Where:** Firebase Console → Authentication → Sign-in method

**What to do:**
1. Click **Google**
2. Toggle **Enable** to ON
3. Enter your email as support email
4. Click **Save**

**Why:** Allows users to sign in with Google accounts

---

## ✅ Step 4: Done! (0 min)

**No user accounts to create!**

Google Sign-In automatically creates user accounts when someone signs in for the first time.

**Why:** Google handles all account creation and management

---

## 🎯 Verify Security is Working

### Test 1: Unauthenticated Access Blocked
1. Open site in incognito window (NOT logged in)
2. Should see Google Sign-In button, not your data ✓

### Test 2: Google Sign-In Works
1. Click "Sign in with Google"
2. Select your Google account in popup
3. Should see your goals data ✓

### Test 3: Firestore Rules Active
Open browser console (F12) while NOT logged in and run:
```javascript
firebase.firestore().collection('goals').get()
  .catch(() => console.log('✅ Security working!'))
```

Should see "✅ Security working!" message

---

## 📋 Final Security Status

After completing all steps:

| Security Layer | Status |
|---|---|
| Firestore Rules Applied | ✅ |
| Authorized Domains Set | ✅ |
| Firebase Auth Enabled | ✅ |
| User Accounts Created | ✅ |
| Tested & Verified | ✅ |

---

## 🆘 Need Help?

**Full detailed guide:** [FIREBASE_SECURITY_SETUP.md](FIREBASE_SECURITY_SETUP.md)

**Common issues:**
- "Permission denied" → Make sure rules are published
- "Invalid email/password" → Check credentials in Firebase Console
- Can't see login screen → Clear browser cache

---

## ❓ FAQ

**Q: Is the API key in firebase-config.js safe to be public?**
A: YES. Firebase API keys are designed to be public. Security comes from rules and authentication, not hiding the key.

**Q: Can someone access my data with just the API key?**
A: NO. Not if you applied the security rules. Unauthenticated users are blocked.

**Q: How long does this take?**
A: ~5 minutes total (no user accounts to create with Google Sign-In!)

**Q: Do I need to do this every time I deploy?**
A: NO. You only need to do this once. Rules persist in Firebase.

**Q: Do I need a Google account to use the app?**
A: YES. Both you and your partner need Google accounts to sign in.

---

**✅ Once completed, your app is production-ready and secure!**
