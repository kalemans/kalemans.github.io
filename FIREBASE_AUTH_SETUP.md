# Firebase Authentication Setup Guide

## Overview

Your app now uses **Firebase Authentication** instead of storing passwords in code. This means:
- ✅ **No sensitive data in your public GitHub repo**
- ✅ **All user credentials stored securely in Firebase**
- ✅ **Industry-standard security**
- ✅ **Each person (you + partner) has their own login**

---

## Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kalemans-firebase**
3. Click **Authentication** in the left sidebar (🔐 icon)
4. If this is your first time:
   - Click **Get Started**
5. Click the **Sign-in method** tab at the top
6. Find **Email/Password** in the list
7. Click on it
8. Toggle **Enable** to ON
9. Click **Save**

**Screenshot locations:**
- Left sidebar: Authentication
- Top tabs: Sign-in method
- Providers list: Email/Password

---

## Step 2: Create User Accounts

Still in Firebase Console → Authentication → **Users** tab:

### Create Account for Yourself:
1. Click **Add user** button (top right)
2. Fill in the form:
   - **Email**: `your-email@example.com`
   - **Password**: `your-secure-password`
   - **User ID**: (leave blank, auto-generated)
3. Click **Add user**

### Create Account for Your Partner:
1. Click **Add user** again
2. Fill in the form:
   - **Email**: `partner-email@example.com`
   - **Password**: `partner-secure-password`
3. Click **Add user**

**Tips:**
- Use real email addresses (they won't receive emails, it's just for login)
- Choose memorable passwords - you'll use these to login
- Passwords should be secure but memorable

---

## Step 3: Test the Login

1. Visit your site: https://kalemans.github.io
2. You should see a login screen with:
   - Email field
   - Password field
   - "Remember me" checkbox
   - Login button

3. Login with one of the accounts you created:
   - Enter the email
   - Enter the password
   - Check "Remember me" (optional)
   - Click Login

4. If successful, you should see the app!

---

## Step 4: Share Credentials with Your Partner

Send your partner their login credentials securely:
- Email: `[the email you created for them]`
- Password: `[the password you set]`

**They can login from their phone or computer**

---

## How "Remember Me" Works

- **Checked**: Stays logged in even after closing browser
  - Session persists until they explicitly logout
  - Works across browser restarts

- **Unchecked**: Session expires when browser closes
  - Must login again next time they open browser

---

## Common Issues & Solutions

### "Invalid email or password"
- Double-check the email/password in Firebase Console
- Ensure no extra spaces
- Password is case-sensitive

### "Too many failed attempts"
- Firebase temporarily blocks login after multiple failures
- Wait 5-10 minutes and try again

### "User not found"
- Make sure you created the user in Firebase Console
- Check that you're using the exact email from Firebase

### Login screen shows but nothing happens
- Check browser console for errors (F12)
- Verify Firebase Auth is enabled in Console

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
