# 🔒 Email Whitelist Security Guide

## Overview

Your app now uses an **email whitelist** to restrict access. This means:

✅ **Only specific Gmail addresses can access the app**
❌ **Everyone else is blocked (even if they have the URL)**

---

## 🎯 How It Works

### Before Email Whitelist:
```
Anyone with Google account
→ Signs in with Google
→ Can access the app ❌ (Security risk!)
```

### After Email Whitelist:
```
Your email (whitelisted)
→ Signs in with Google
→ ✅ Can access the app

Random person (NOT whitelisted)
→ Signs in with Google
→ ❌ Permission denied error
→ Cannot see or access any data
```

---

## 📝 Setting Up the Whitelist

### Step 1: Know Your Email Addresses

You need:
- **Your Gmail address** (e.g., `john.doe@gmail.com`)
- **Partner's Gmail address** (e.g., `jane.smith@gmail.com`)

**Important:**
- Must be Gmail addresses (or Google Workspace emails)
- Must be the EXACT email they'll use to sign in
- Case doesn't matter (`John@gmail.com` = `john@gmail.com`)

---

### Step 2: Update Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kalemans-firebase**
3. Click **Firestore Database** (left sidebar)
4. Click **Rules** tab
5. Find this section:

```javascript
function isAllowedUser() {
  return request.auth.token.email in [
    'your-email@gmail.com',        // ← Replace this
    'partner-email@gmail.com'      // ← Replace this
  ];
}
```

6. Replace with your actual emails:

```javascript
function isAllowedUser() {
  return request.auth.token.email in [
    'john.doe@gmail.com',          // ← Your actual Gmail
    'jane.smith@gmail.com'         // ← Partner's actual Gmail
  ];
}
```

7. Click **Publish** (top right)
8. Confirm when prompted

**✅ Done! Only these 2 emails can access the app.**

---

## 🧪 Testing the Whitelist

### Test 1: Whitelisted Email Works

1. Sign out of the app (if logged in)
2. Visit the site
3. Click "Sign in with Google"
4. Select whitelisted email (yours)
5. ✅ Should see your goals

### Test 2: Non-Whitelisted Email Blocked

1. Sign out
2. Try signing in with a different Google account (NOT in whitelist)
3. Sign-in succeeds BUT...
4. ❌ App shows error: "Missing or insufficient permissions"
5. Cannot see any data

**This is correct behavior!**

---

## ➕ Adding More Emails

Want to add a friend or family member?

1. Go to Firebase Console → Firestore Database → Rules
2. Add their email to the list:

```javascript
function isAllowedUser() {
  return request.auth.token.email in [
    'your-email@gmail.com',
    'partner-email@gmail.com',
    'friend-email@gmail.com',      // ← Add here
    'family-email@gmail.com'        // ← Or here
  ];
}
```

3. Click **Publish**
4. They can now sign in and access the app!

**No code changes needed** - just update the rules in Firebase Console.

---

## 🗑️ Removing Emails

Want to revoke someone's access?

1. Go to Firebase Console → Firestore Database → Rules
2. Remove their email from the list:

```javascript
function isAllowedUser() {
  return request.auth.token.email in [
    'your-email@gmail.com',
    'partner-email@gmail.com'
    // 'removed-email@gmail.com'  ← Removed this line
  ];
}
```

3. Click **Publish**
4. They're immediately blocked (even if currently signed in!)

---

## 🔐 Security Benefits

### What This Protects Against:

✅ **URL leaked publicly**
- Someone finds your URL and shares it
- Random people try to sign in
- ❌ Blocked by email whitelist

✅ **Social media sharing**
- URL accidentally posted on Twitter/Facebook
- Hundreds of people try to access
- ❌ All blocked except whitelisted emails

✅ **Unauthorized family/friends**
- Someone gives URL to their friend
- Friend tries to sign in
- ❌ Blocked unless you add their email

✅ **Future-proof security**
- Even if Firebase has a bug
- Even if someone bypasses client-side checks
- Firestore rules enforce at database level
- Cannot be bypassed

---

## ⚠️ Important Notes

### Email Format

**Must match exactly how they sign in:**

If partner signs in with: `JaneSmith@gmail.com`
Whitelist must have: `janesmith@gmail.com` (case-insensitive, but best to match)

**Recommendation:** Use lowercase for consistency.

### Multiple Google Accounts

If you have multiple Google accounts:
- Add ALL accounts you might use
- Or use the same account consistently

Example:
```javascript
return request.auth.token.email in [
  'personal@gmail.com',      // Personal account
  'work@company.com',        // Work account (Google Workspace)
  'partner@gmail.com'
];
```

### Google Workspace Emails

Works with Google Workspace (formerly G Suite) emails:
- `you@yourcompany.com` (if using Google Workspace)
- `partner@herdomain.com` (if using Google Workspace)

Just add them to the whitelist like regular Gmail addresses.

---

## 🐛 Troubleshooting

### "Missing or insufficient permissions" after sign-in

**Cause:** Your email is NOT in the whitelist

**Fix:**
1. Check what email you signed in with (check browser console or Firebase Auth dashboard)
2. Verify that EXACT email is in the Firestore rules whitelist
3. Update rules and Publish
4. Sign out and sign in again

### Works for you but not partner

**Cause:** Partner's email not in whitelist or spelled wrong

**Fix:**
1. Ask partner what email she's using to sign in
2. Verify it's spelled correctly in whitelist
3. Update rules and Publish
4. Partner signs out and signs in again

### Rules won't publish

**Cause:** Syntax error in rules

**Fix:**
1. Check for missing commas between emails
2. Check for missing quotes around emails
3. Copy the example from this guide exactly
4. Validate and Publish

---

## ✅ Best Practices

### 1. Use Lowercase Emails
```javascript
// Good
'john.doe@gmail.com'

// Works but less consistent
'John.Doe@Gmail.com'
```

### 2. Keep the List Short
Only add people who truly need access:
```javascript
// Good - just you and partner
return request.auth.token.email in [
  'you@gmail.com',
  'partner@gmail.com'
];

// Avoid - too many people
return request.auth.token.email in [
  'you@gmail.com',
  'partner@gmail.com',
  'friend1@gmail.com',
  'friend2@gmail.com',
  'cousin@gmail.com',
  // etc... (probably too many)
];
```

### 3. Document Who's Who
Add comments to remember:
```javascript
return request.auth.token.email in [
  'john.doe@gmail.com',          // You
  'jane.smith@gmail.com',        // Partner
  'bob.jones@gmail.com'          // Brother (temporary access)
];
```

### 4. Regular Audit
Periodically review the whitelist:
- Remove people who no longer need access
- Update emails if someone changed their account
- Keep it minimal

---

## 🎉 You're Protected!

With the email whitelist:

1. ✅ Only your emails can access the app
2. ✅ URL can be public without risk
3. ✅ Easy to add/remove people
4. ✅ Enforced at database level (can't be bypassed)
5. ✅ No code changes needed to manage

**Your data is now fully protected!** 🔒
