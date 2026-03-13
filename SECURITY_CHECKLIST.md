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

## ✅ Step 3: Enable Firebase Authentication (1 min)

**Where:** Firebase Console → Authentication → Sign-in method

**What to do:**
1. Click **Email/Password**
2. Toggle **Enable** to ON
3. Click **Save**

**Why:** Required for user login

---

## ✅ Step 4: Create User Accounts (2 min)

**Where:** Firebase Console → Authentication → Users

**What to do:**
1. Click **Add user**
2. Enter email and password for yourself
3. Click **Add user** again
4. Enter email and password for your partner

**Why:** Creates accounts for you and your partner to login

---

## 🎯 Verify Security is Working

### Test 1: Unauthenticated Access Blocked
1. Open site in incognito window (NOT logged in)
2. Should see login screen, not your data ✓

### Test 2: Login Works
1. Login with credentials you created
2. Should see your goals data ✓

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
A: ~10 minutes total for all 4 steps.

**Q: Do I need to do this every time I deploy?**
A: NO. You only need to do this once. Rules persist in Firebase.

---

**✅ Once completed, your app is production-ready and secure!**
