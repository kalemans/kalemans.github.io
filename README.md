# Anniversary Goals Tracker

A personal goal tracking app for couples and individuals.

## Features
- ✅ Password authentication with "Remember Me" token (90 days)
- ✅ Edit previous days' data with date picker
- ✅ Category dropdown with option to add new categories
- ✅ Personal and Couple goal tabs
- ✅ Weekly overview charts
- ✅ Activity heatmap and statistics
- ✅ Firebase data sync

## Setup

### 1. Authentication
The app is password-protected. To change the password:

1. Go to https://emn178.github.io/online-tools/sha256.html
2. Enter your desired password
3. Copy the generated hash
4. Open `firebase-config.js`
5. Replace the `passwordHash` value in `AUTH_CONFIG`

**Default password**: `password` (change this immediately!)

### 2. Firebase Configuration
Update `firebase-config.js` with your Firebase project credentials.

## Usage
- Click the dashboard date to select and edit previous days
- "Remember me" keeps you logged in for 90 days
- Logout button available in the Stats tab footer