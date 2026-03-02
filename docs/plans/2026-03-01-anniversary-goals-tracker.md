# Anniversary Goals Tracker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a mobile-first goal tracking website with GitHub backend, launching by March 10, 2026.

**Architecture:** Single-page vanilla JavaScript app with three tabs (Personal Goals, Couple Goals, Stats). Data stored in JSON file in GitHub repository, accessed via GitHub REST API. Optimistic UI updates with background sync.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (ES6), GitHub REST API, localStorage for caching, Canvas Confetti for celebrations.

---

## Task 1: Project Setup and Basic HTML Structure

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`
- Create: `config.js`

**Step 1: Create index.html with basic structure**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#A855F7">
    <title>Goals Tracker 🎯</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Auth Screen -->
    <div id="auth-screen" class="screen">
        <div class="auth-container">
            <h1>🎯 Goals Tracker</h1>
            <p>Track your personal and couple goals!</p>
            <button id="login-btn" class="primary-btn">Login with GitHub</button>
        </div>
    </div>

    <!-- Main App -->
    <div id="main-app" class="screen hidden">
        <!-- Header with Tabs -->
        <header>
            <nav class="tabs">
                <button class="tab active" data-tab="personal">Personal</button>
                <button class="tab" data-tab="couple">Couple</button>
                <button class="tab" data-tab="stats">Stats</button>
            </nav>
            <div id="sync-status" class="sync-indicator hidden">
                <span class="sync-icon">☁️</span>
            </div>
        </header>

        <!-- Tab Content -->
        <main>
            <!-- Personal Goals Tab -->
            <div id="personal-tab" class="tab-content active">
                <div class="stats-bar">
                    <div id="personal-stats"></div>
                </div>
                <div id="personal-categories" class="categories-container"></div>
            </div>

            <!-- Couple Goals Tab -->
            <div id="couple-tab" class="tab-content">
                <div class="stats-bar">
                    <div id="couple-stats"></div>
                </div>
                <div id="couple-categories" class="categories-container"></div>
            </div>

            <!-- Stats Tab -->
            <div id="stats-tab" class="tab-content">
                <div class="time-selector">
                    <button class="time-btn active" data-period="week">Week</button>
                    <button class="time-btn" data-period="month">Month</button>
                    <button class="time-btn" data-period="year">Year</button>
                </div>
                <div id="stats-content" class="stats-content"></div>
            </div>
        </main>

        <!-- Add Task FAB -->
        <button id="add-task-btn" class="fab">+</button>
    </div>

    <!-- Add/Edit Task Modal -->
    <div id="task-modal" class="modal hidden">
        <div class="modal-content">
            <h2 id="modal-title">Add Task</h2>
            <form id="task-form">
                <input type="text" id="task-name" placeholder="Task name" required>

                <label>Category</label>
                <select id="task-category" required>
                    <option value="">Select category...</option>
                </select>
                <input type="text" id="custom-category" placeholder="Or create new category" class="hidden">

                <label>Frequency</label>
                <div class="frequency-selector">
                    <button type="button" class="freq-btn active" data-freq="Daily">Daily</button>
                    <button type="button" class="freq-btn" data-freq="Weekly">Weekly</button>
                    <button type="button" class="freq-btn" data-freq="Anytime">Anytime</button>
                </div>

                <div class="modal-actions">
                    <button type="button" id="cancel-btn" class="secondary-btn">Cancel</button>
                    <button type="submit" class="primary-btn">Save</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Toast for notifications -->
    <div id="toast" class="toast hidden"></div>

    <!-- Loading Spinner -->
    <div id="loading" class="loading hidden">
        <div class="spinner"></div>
    </div>

    <script type="module" src="app.js"></script>
</body>
</html>
```

**Step 2: Create config.js for GitHub settings**

Create `config.js`:

```javascript
// GitHub Configuration
export const GITHUB_CONFIG = {
    owner: 'kalemans',  // Your GitHub username
    repo: 'kalemans.github.io',
    dataPath: 'data/goals.json',
    clientId: 'YOUR_GITHUB_OAUTH_CLIENT_ID', // TODO: Set up GitHub OAuth App
};

export const PREDEFINED_TASKS = {
    personal: [
        { id: 'workout', name: 'Workout', category: 'Active Stuff', frequency: 'Daily' },
        { id: 'litter-box', name: 'Clean Litter Box', category: 'Chores', frequency: 'Daily' },
        { id: 'chainmail', name: 'Do Chainmail', category: 'Hobbies', frequency: 'Weekly' },
        { id: 'turkish', name: 'Study Turkish', category: 'Learning', frequency: 'Daily' },
        { id: 'read-book', name: 'Read Book', category: 'Hobbies', frequency: 'Daily' },
        { id: 'npr', name: 'Listen to NPR', category: 'Learning', frequency: 'Daily' },
    ],
    couple: [
        { id: 'restaurant', name: 'Go to Restaurant', category: 'Dining', frequency: 'Weekly' },
        { id: 'cafe', name: 'Go to Cafe', category: 'Dining', frequency: 'Weekly' },
        { id: 'hike', name: 'Hike', category: 'Active', frequency: 'Weekly' },
        { id: 'cook', name: 'Cook Together', category: 'Creative', frequency: 'Weekly' },
        { id: 'walk', name: 'Take a Walk', category: 'Active', frequency: 'Daily' },
        { id: 'pingpong', name: 'Play Pingpong', category: 'Active', frequency: 'Weekly' },
        { id: 'billiards', name: 'Play Billiards', category: 'Active', frequency: 'Weekly' },
        { id: 'hottub', name: 'Hottub/Pool Time', category: 'Relaxation', frequency: 'Weekly' },
        { id: 'crafts', name: 'Do Arts/Crafts', category: 'Creative', frequency: 'Weekly' },
    ],
};
```

**Step 3: Create empty app.js and styles.css**

Create `app.js`:

```javascript
// Main application entry point
import { GITHUB_CONFIG, PREDEFINED_TASKS } from './config.js';

console.log('App loaded');
```

Create `styles.css`:

```css
/* Styles will be added in next task */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
```

**Step 4: Test in browser**

Run: `python -m http.server 8000`
Open: `http://localhost:8000`
Expected: Basic HTML structure visible, no styling yet

**Step 5: Commit**

```bash
git add index.html config.js app.js styles.css
git commit -m "Add basic HTML structure"
```

---

## Task 2: Mobile-First CSS Styling

**Files:**
- Modify: `styles.css`

**Step 1: Add CSS reset and variables**

Add to `styles.css`:

```css
:root {
    --primary: #A855F7;
    --primary-dark: #9333EA;
    --secondary: #EC4899;
    --success: #FBBF24;
    --gold: #FCD34D;
    --bg-gradient-start: #FDF4FF;
    --bg-gradient-end: #F0FDFA;
    --text-primary: #1F2937;
    --text-secondary: #6B7280;
    --border: #E5E7EB;
    --card-bg: #FFFFFF;
    --shadow: 0 1px 3px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(180deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
}

.screen {
    min-height: 100vh;
}

.hidden {
    display: none !important;
}
```

**Step 2: Add auth screen styles**

Add to `styles.css`:

```css
/* Auth Screen */
.auth-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;
    text-align: center;
}

.auth-container h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.auth-container p {
    font-size: 1.25rem;
    color: var(--text-secondary);
    margin-bottom: 2rem;
}

.primary-btn {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-lg);
    transition: transform 0.2s, box-shadow 0.2s;
}

.primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(168, 85, 247, 0.3);
}

.primary-btn:active {
    transform: translateY(0);
}

.secondary-btn {
    background: white;
    color: var(--primary);
    border: 2px solid var(--primary);
    padding: 1rem 2rem;
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.secondary-btn:hover {
    background: var(--primary);
    color: white;
}
```

**Step 3: Add header and tab styles**

Add to `styles.css`:

```css
/* Header and Tabs */
header {
    position: sticky;
    top: 0;
    background: white;
    box-shadow: var(--shadow);
    z-index: 100;
}

.tabs {
    display: flex;
    justify-content: space-around;
    padding: 0.5rem;
}

.tab {
    flex: 1;
    background: none;
    border: none;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
}

.tab.active {
    color: var(--primary);
}

.tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 10%;
    right: 10%;
    height: 3px;
    background: var(--primary);
    border-radius: 3px 3px 0 0;
}

.sync-indicator {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.25rem;
}

.sync-indicator.offline .sync-icon::after {
    content: '⚠️';
}
```

**Step 4: Add tab content and main styles**

Add to `styles.css`:

```css
/* Main Content */
main {
    padding-bottom: 5rem;
}

.tab-content {
    display: none;
    padding: 1rem;
    animation: fadeIn 0.2s ease-in;
}

.tab-content.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.stats-bar {
    background: white;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    box-shadow: var(--shadow);
}

.stats-bar h3 {
    font-size: 1.25rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
}

.categories-container {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.category-section h3 {
    font-size: 1.125rem;
    color: var(--text-secondary);
    margin-bottom: 0.75rem;
    padding-left: 0.5rem;
}

.tasks-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
```

**Step 5: Add task card styles**

Add to `styles.css`:

```css
/* Task Cards */
.task-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: var(--shadow);
    display: flex;
    align-items: center;
    gap: 1rem;
    min-height: 60px;
    transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:active {
    transform: scale(0.98);
}

.task-star {
    font-size: 2rem;
    cursor: pointer;
    user-select: none;
    transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.task-star:active {
    transform: scale(1.2);
}

.task-star.completed {
    animation: starPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes starPop {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.3) rotate(15deg); }
}

.task-info {
    flex: 1;
}

.task-name {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
}

.task-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.frequency-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    background: var(--primary);
    color: white;
    font-weight: 600;
}

.streak-indicator {
    font-size: 0.875rem;
}

.task-menu {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
}
```

**Step 6: Add FAB and modal styles**

Add to `styles.css`:

```css
/* Floating Action Button */
.fab {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    color: white;
    border: none;
    font-size: 2rem;
    box-shadow: var(--shadow-lg);
    cursor: pointer;
    transition: transform 0.2s;
    z-index: 90;
}

.fab:hover {
    transform: scale(1.1);
}

.fab:active {
    transform: scale(0.95);
}

/* Modal */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 1rem;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-content h2 {
    margin-bottom: 1.5rem;
    color: var(--primary);
}

.modal-content label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
    color: var(--text-secondary);
}

.modal-content input,
.modal-content select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.modal-content input:focus,
.modal-content select:focus {
    outline: none;
    border-color: var(--primary);
}

.frequency-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.freq-btn {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid var(--border);
    background: white;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.freq-btn.active {
    border-color: var(--primary);
    background: var(--primary);
    color: white;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
}

.modal-actions button {
    flex: 1;
}
```

**Step 7: Add toast, loading, and stats styles**

Add to `styles.css`:

```css
/* Toast Notifications */
.toast {
    position: fixed;
    bottom: 6rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--text-primary);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    z-index: 300;
    animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

/* Loading Spinner */
.loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 400;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Stats Tab */
.time-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.time-btn {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid var(--border);
    background: white;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.time-btn.active {
    border-color: var(--primary);
    background: var(--primary);
    color: white;
}

.stats-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.stat-card h3 {
    color: var(--text-secondary);
    font-size: 1rem;
    margin-bottom: 1rem;
}

.stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.streak-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.streak-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg-gradient-start);
    border-radius: 8px;
}

.streak-item-name {
    font-weight: 600;
}

.streak-item-value {
    font-size: 1.25rem;
    color: var(--primary);
}
```

**Step 8: Test styling in browser**

Run: `python -m http.server 8000`
Open: `http://localhost:8000`
Expected: Fully styled mobile-first interface, auth screen visible

**Step 9: Commit**

```bash
git add styles.css
git commit -m "Add mobile-first CSS styling"
```

---

## Task 3: GitHub Authentication

**Files:**
- Modify: `app.js`

**Step 1: Add GitHub OAuth initialization**

Replace `app.js` content:

```javascript
import { GITHUB_CONFIG } from './config.js';

// State
let authToken = null;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('main-app');
const loginBtn = document.getElementById('login-btn');

// Initialize app
init();

function init() {
    // Check for existing token
    authToken = localStorage.getItem('github_token');

    // Check for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !authToken) {
        // Handle OAuth callback
        handleOAuthCallback(code);
    } else if (authToken) {
        // Already authenticated
        showMainApp();
    } else {
        // Show login screen
        showAuthScreen();
    }
}

function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    loadApp();
}

// Login button handler
loginBtn.addEventListener('click', () => {
    initiateGitHubLogin();
});

function initiateGitHubLogin() {
    // For MVP: Use Personal Access Token approach (simpler than OAuth App)
    const token = prompt('Enter your GitHub Personal Access Token:\n\nCreate one at: https://github.com/settings/tokens\nRequired scope: repo');

    if (token) {
        authToken = token;
        localStorage.setItem('github_token', token);
        showMainApp();
    }
}

async function handleOAuthCallback(code) {
    // TODO: Implement OAuth flow with backend proxy
    // For now, use PAT approach
    showAuthScreen();
}

async function loadApp() {
    console.log('Loading app with token:', authToken ? 'present' : 'missing');
    // App initialization will be added in next tasks
}
```

**Step 2: Test authentication flow**

Run: `python -m http.server 8000`
Open: `http://localhost:8000`
Actions:
1. Click "Login with GitHub"
2. Enter a dummy token (for now)
3. Verify main app screen shows

Expected: Auth flow works, can switch between screens

**Step 3: Commit**

```bash
git add app.js
git commit -m "Add GitHub authentication flow"
```

---

## Task 4: GitHub Data Layer

**Files:**
- Modify: `app.js`
- Create: `data/goals.json`

**Step 1: Add GitHub API functions to app.js**

Add after `loadApp()` function in `app.js`:

```javascript
// GitHub API Functions
async function fetchGoalsData() {
    try {
        showLoading(true);
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`,
            {
                headers: {
                    'Authorization': `token ${authToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (response.status === 404) {
            // File doesn't exist, create initial data
            return await createInitialData();
        }

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const content = JSON.parse(atob(data.content));

        // Store SHA for future updates
        localStorage.setItem('goals_sha', data.sha);

        // Cache data
        localStorage.setItem('goals_data', JSON.stringify(content));

        return content;
    } catch (error) {
        console.error('Error fetching goals:', error);
        showToast('Error loading data. Using cached version.');

        // Return cached data if available
        const cached = localStorage.getItem('goals_data');
        return cached ? JSON.parse(cached) : getDefaultData();
    } finally {
        showLoading(false);
    }
}

async function saveGoalsData(data) {
    try {
        const sha = localStorage.getItem('goals_sha');
        const content = btoa(JSON.stringify(data, null, 2));

        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${authToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update goals data',
                    content: content,
                    sha: sha
                })
            }
        );

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const result = await response.json();

        // Update SHA
        localStorage.setItem('goals_sha', result.content.sha);

        // Update cache
        localStorage.setItem('goals_data', JSON.stringify(data));

        return true;
    } catch (error) {
        console.error('Error saving goals:', error);
        showToast('Error saving data. Will retry when online.');

        // Queue for later sync
        queueDataForSync(data);
        return false;
    }
}

async function createInitialData() {
    const data = getDefaultData();
    await saveGoalsData(data);
    return data;
}

function getDefaultData() {
    return {
        predefinedTasks: PREDEFINED_TASKS,
        customTasks: [],
        customCategories: [],
        completions: {},
        streaks: {}
    };
}

function queueDataForSync(data) {
    localStorage.setItem('sync_queue', JSON.stringify(data));
}

// UI Helper Functions
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}
```

**Step 2: Create initial data file structure**

Create `data/goals.json`:

```json
{
  "predefinedTasks": {
    "personal": [],
    "couple": []
  },
  "customTasks": [],
  "customCategories": [],
  "completions": {},
  "streaks": {}
}
```

**Step 3: Update loadApp to fetch data**

Modify `loadApp()` in `app.js`:

```javascript
async function loadApp() {
    console.log('Loading app...');

    // Fetch goals data
    const goalsData = await fetchGoalsData();

    console.log('Goals data loaded:', goalsData);

    // Initialize app with data (will implement in next tasks)
    initializeTabs();
    renderGoals(goalsData);
}

function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));

            // Add active to clicked
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function renderGoals(data) {
    // Will implement rendering in next task
    console.log('Rendering goals...', data);
}
```

**Step 4: Test data layer**

Run: `python -m http.server 8000`
Open browser console
Expected: See "Goals data loaded" with data object

**Step 5: Commit**

```bash
git add app.js data/goals.json
git commit -m "Add GitHub data layer"
```

---

## Task 5: Task Rendering

**Files:**
- Modify: `app.js`

**Step 1: Add task rendering functions**

Add to `app.js` after `renderGoals()`:

```javascript
let currentData = null;

function renderGoals(data) {
    currentData = data;

    // Render personal goals
    renderGoalSection('personal', data);

    // Render couple goals
    renderGoalSection('couple', data);

    // Render stats
    renderStats(data);
}

function renderGoalSection(type, data) {
    const container = document.getElementById(`${type}-categories`);
    const statsContainer = document.getElementById(`${type}-stats`);

    // Get tasks for this type
    const tasks = [
        ...(data.predefinedTasks[type] || []),
        ...data.customTasks.filter(t => t.type === type)
    ];

    // Group by category
    const grouped = groupByCategory(tasks);

    // Render stats bar
    const stats = calculateDailyStats(tasks, data.completions);
    statsContainer.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>${stats.completed}/${stats.total}</strong> tasks today
            </div>
            ${stats.streak > 0 ? `<div>🔥 ${stats.streak} day streak!</div>` : ''}
        </div>
    `;

    // Render categories
    container.innerHTML = '';
    Object.entries(grouped).forEach(([category, categoryTasks]) => {
        const section = document.createElement('div');
        section.className = 'category-section';

        section.innerHTML = `
            <h3>${category}</h3>
            <div class="tasks-grid">
                ${categoryTasks.map(task => renderTaskCard(task, data)).join('')}
            </div>
        `;

        container.appendChild(section);
    });

    // Add event listeners to task stars
    container.querySelectorAll('.task-star').forEach(star => {
        star.addEventListener('click', (e) => {
            const taskId = e.target.dataset.taskId;
            toggleTask(taskId);
        });
    });
}

function groupByCategory(tasks) {
    const grouped = {};
    tasks.forEach(task => {
        if (!grouped[task.category]) {
            grouped[task.category] = [];
        }
        grouped[task.category].push(task);
    });
    return grouped;
}

function renderTaskCard(task, data) {
    const today = getTodayString();
    const isCompleted = data.completions[today]?.[task.id]?.completed || false;
    const streak = data.streaks[task.id]?.current || 0;

    return `
        <div class="task-card">
            <div class="task-star ${isCompleted ? 'completed' : ''}" data-task-id="${task.id}">
                ${isCompleted ? '⭐' : '☆'}
            </div>
            <div class="task-info">
                <div class="task-name">${task.name}</div>
                <div class="task-meta">
                    <span class="frequency-badge">${task.frequency}</span>
                    ${streak > 0 ? `<span class="streak-indicator">🔥 ${streak}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

function calculateDailyStats(tasks, completions) {
    const today = getTodayString();
    const todayCompletions = completions[today] || {};

    const dailyTasks = tasks.filter(t => t.frequency === 'Daily');
    const completed = dailyTasks.filter(t => todayCompletions[t.id]?.completed).length;

    return {
        completed,
        total: dailyTasks.length,
        streak: 0 // Will calculate properly later
    };
}

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}
```

**Step 2: Test task rendering**

Run: `python -m http.server 8000`
Open: `http://localhost:8000`
Expected: See predefined tasks rendered in categories

**Step 3: Commit**

```bash
git add app.js
git commit -m "Add task rendering"
```

---

## Task 6: Task Completion with Celebration

**Files:**
- Modify: `app.js`
- Modify: `index.html`

**Step 1: Add confetti library to HTML**

Add before closing `</body>` tag in `index.html`:

```html
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script type="module" src="app.js"></script>
</body>
```

**Step 2: Add task toggle function**

Add to `app.js`:

```javascript
async function toggleTask(taskId) {
    const today = getTodayString();

    // Initialize today's completions if needed
    if (!currentData.completions[today]) {
        currentData.completions[today] = {};
    }

    // Toggle completion
    const isCurrentlyCompleted = currentData.completions[today][taskId]?.completed || false;

    if (isCurrentlyCompleted) {
        // Uncheck
        delete currentData.completions[today][taskId];
    } else {
        // Check - celebrate!
        currentData.completions[today][taskId] = {
            completed: true,
            timestamp: new Date().toISOString()
        };

        // Show celebration
        celebrate();

        // Update streak
        updateStreak(taskId);

        // Show progress toast
        showProgressToast();
    }

    // Optimistic UI update
    renderGoals(currentData);

    // Save to GitHub in background
    await saveGoalsData(currentData);
}

function celebrate() {
    // Confetti animation
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#EC4899', '#FBBF24']
    });
}

function updateStreak(taskId) {
    // Get task
    const task = findTask(taskId);
    if (!task || task.frequency !== 'Daily') return;

    // Calculate streak
    const streak = calculateStreak(taskId);

    if (!currentData.streaks[taskId]) {
        currentData.streaks[taskId] = { current: 0, longest: 0 };
    }

    currentData.streaks[taskId].current = streak;
    currentData.streaks[taskId].longest = Math.max(
        streak,
        currentData.streaks[taskId].longest || 0
    );
}

function calculateStreak(taskId) {
    let streak = 0;
    let date = new Date();

    // Count backwards from today
    while (true) {
        const dateStr = date.toISOString().split('T')[0];
        if (currentData.completions[dateStr]?.[taskId]?.completed) {
            streak++;
            date.setDate(date.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function findTask(taskId) {
    // Search in predefined tasks
    for (const type of ['personal', 'couple']) {
        const task = currentData.predefinedTasks[type]?.find(t => t.id === taskId);
        if (task) return task;
    }

    // Search in custom tasks
    return currentData.customTasks.find(t => t.id === taskId);
}

function showProgressToast() {
    const today = getTodayString();
    const todayCompletions = currentData.completions[today] || {};
    const completed = Object.values(todayCompletions).filter(c => c.completed).length;

    const messages = [
        "Great job! 🎉",
        "You're on fire! 🔥",
        "Keep it up! 💪",
        "Awesome! ⭐",
        "Crushing it! 🚀"
    ];

    const message = messages[Math.floor(Math.random() * messages.length)];
    showToast(`${message} ${completed} tasks completed today`);
}
```

**Step 3: Test task completion**

Run: `python -m http.server 8000`
Actions:
1. Click on a task star
2. Verify confetti animation plays
3. Verify star fills with gold
4. Verify toast shows progress

Expected: Celebration works, task toggles, data saves

**Step 4: Commit**

```bash
git add app.js index.html
git commit -m "Add task completion with celebration"
```

---

## Task 7: Add/Edit Task Modal

**Files:**
- Modify: `app.js`

**Step 1: Add modal event listeners**

Add to `app.js` after `initializeTabs()`:

```javascript
function initializeTabs() {
    // ... existing code ...
}

function initializeModals() {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const taskForm = document.getElementById('task-form');
    const categorySelect = document.getElementById('task-category');

    // Add task button
    addTaskBtn.addEventListener('click', () => {
        openTaskModal();
    });

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        closeTaskModal();
    });

    // Close on background click
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });

    // Frequency selector
    document.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Category select - show custom input
    categorySelect.addEventListener('change', (e) => {
        const customInput = document.getElementById('custom-category');
        if (e.target.value === 'custom') {
            customInput.classList.remove('hidden');
            customInput.required = true;
        } else {
            customInput.classList.add('hidden');
            customInput.required = false;
        }
    });

    // Form submit
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleTaskFormSubmit();
    });
}

function openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const categorySelect = document.getElementById('task-category');

    // Populate category dropdown
    const categories = getAllCategories();
    categorySelect.innerHTML = `
        <option value="">Select category...</option>
        ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        <option value="custom">+ Create new category</option>
    `;

    if (taskId) {
        // Edit mode
        modalTitle.textContent = 'Edit Task';
        // TODO: Populate form with task data
    } else {
        // Add mode
        modalTitle.textContent = 'Add Task';
        document.getElementById('task-form').reset();
        document.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.freq-btn[data-freq="Daily"]').classList.add('active');
    }

    modal.classList.remove('hidden');
}

function closeTaskModal() {
    const modal = document.getElementById('task-modal');
    modal.classList.add('hidden');
    document.getElementById('task-form').reset();
    document.getElementById('custom-category').classList.add('hidden');
}

function getAllCategories() {
    const categories = new Set();

    // Add predefined categories
    ['personal', 'couple'].forEach(type => {
        currentData.predefinedTasks[type]?.forEach(task => {
            categories.add(task.category);
        });
    });

    // Add custom categories
    currentData.customCategories?.forEach(cat => categories.add(cat));
    currentData.customTasks?.forEach(task => categories.add(task.category));

    return Array.from(categories).sort();
}

async function handleTaskFormSubmit() {
    const taskName = document.getElementById('task-name').value.trim();
    const categorySelect = document.getElementById('task-category').value;
    const customCategory = document.getElementById('custom-category').value.trim();
    const frequency = document.querySelector('.freq-btn.active').dataset.freq;

    // Determine category
    let category = categorySelect === 'custom' ? customCategory : categorySelect;

    if (!category) {
        showToast('Please select a category');
        return;
    }

    // Determine type based on current active tab
    const activeTab = document.querySelector('.tab.active').dataset.tab;
    const type = activeTab === 'personal' ? 'personal' : 'couple';

    // Create new task
    const newTask = {
        id: generateTaskId(),
        name: taskName,
        category: category,
        frequency: frequency,
        type: type
    };

    // Add to custom tasks
    if (!currentData.customTasks) {
        currentData.customTasks = [];
    }
    currentData.customTasks.push(newTask);

    // Add custom category if new
    if (categorySelect === 'custom' && !currentData.customCategories?.includes(category)) {
        if (!currentData.customCategories) {
            currentData.customCategories = [];
        }
        currentData.customCategories.push(category);
    }

    // Save and re-render
    await saveGoalsData(currentData);
    renderGoals(currentData);
    closeTaskModal();
    showToast('Task added! 🎉');
}

function generateTaskId() {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
```

**Step 2: Call initializeModals in loadApp**

Modify `loadApp()`:

```javascript
async function loadApp() {
    console.log('Loading app...');

    // Fetch goals data
    const goalsData = await fetchGoalsData();

    console.log('Goals data loaded:', goalsData);

    // Initialize app with data
    initializeTabs();
    initializeModals();
    renderGoals(goalsData);
}
```

**Step 3: Test add task modal**

Run: `python -m http.server 8000`
Actions:
1. Click FAB button
2. Fill in task name, select category, choose frequency
3. Submit form
4. Verify new task appears

Expected: Can add custom tasks successfully

**Step 4: Commit**

```bash
git add app.js
git commit -m "Add task creation modal"
```

---

## Task 8: Stats Tab Implementation

**Files:**
- Modify: `app.js`

**Step 1: Add stats rendering function**

Add to `app.js`:

```javascript
function renderStats(data) {
    const statsContent = document.getElementById('stats-content');
    const activePeriod = document.querySelector('.time-btn.active')?.dataset.period || 'week';

    // Calculate stats for period
    const stats = calculatePeriodStats(data, activePeriod);

    statsContent.innerHTML = `
        <div class="stat-card">
            <h3>Total Completions</h3>
            <div class="stat-value">${stats.totalCompletions}</div>
        </div>

        <div class="stat-card">
            <h3>Top Streaks</h3>
            <div class="streak-list">
                ${renderTopStreaks(data.streaks)}
            </div>
        </div>

        <div class="stat-card">
            <h3>Completions by Category</h3>
            <div class="category-stats">
                ${renderCategoryBreakdown(data, activePeriod)}
            </div>
        </div>

        <div class="stat-card">
            <h3>Activity This ${activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)}</h3>
            <div class="daily-breakdown">
                ${renderDailyBreakdown(data, activePeriod)}
            </div>
        </div>
    `;

    // Add time period selector listeners
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderStats(currentData);
        });
    });
}

function calculatePeriodStats(data, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let totalCompletions = 0;

    Object.entries(data.completions).forEach(([date, tasks]) => {
        const taskDate = new Date(date);
        if (taskDate >= startDate) {
            totalCompletions += Object.values(tasks).filter(t => t.completed).length;
        }
    });

    return {
        totalCompletions,
        period
    };
}

function renderTopStreaks(streaks) {
    if (!streaks || Object.keys(streaks).length === 0) {
        return '<p style="color: var(--text-secondary);">No streaks yet. Start completing tasks!</p>';
    }

    const sorted = Object.entries(streaks)
        .sort((a, b) => (b[1].current || 0) - (a[1].current || 0))
        .slice(0, 5);

    return sorted.map(([taskId, streak]) => {
        const task = findTask(taskId);
        if (!task) return '';

        return `
            <div class="streak-item">
                <span class="streak-item-name">${task.name}</span>
                <span class="streak-item-value">🔥 ${streak.current}</span>
            </div>
        `;
    }).join('');
}

function renderCategoryBreakdown(data, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const categoryCount = {};

    // Count completions by category
    Object.entries(data.completions).forEach(([date, tasks]) => {
        const taskDate = new Date(date);
        if (taskDate >= startDate) {
            Object.keys(tasks).forEach(taskId => {
                if (tasks[taskId].completed) {
                    const task = findTask(taskId);
                    if (task) {
                        categoryCount[task.category] = (categoryCount[task.category] || 0) + 1;
                    }
                }
            });
        }
    });

    if (Object.keys(categoryCount).length === 0) {
        return '<p style="color: var(--text-secondary);">No data for this period yet.</p>';
    }

    return Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => `
            <div class="streak-item">
                <span class="streak-item-name">${category}</span>
                <span class="streak-item-value">${count}</span>
            </div>
        `).join('');
}

function renderDailyBreakdown(data, period) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 14; // Show max 14 for year
    const breakdown = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = Object.values(data.completions[dateStr] || {}).filter(t => t.completed).length;

        breakdown.push({
            date: dateStr,
            count: count,
            label: i === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        });
    }

    const maxCount = Math.max(...breakdown.map(d => d.count), 1);

    return breakdown.map(day => {
        const barWidth = (day.count / maxCount) * 100;
        return `
            <div style="margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.875rem;">
                    <span>${day.label}</span>
                    <span style="color: var(--primary); font-weight: 600;">${day.count}</span>
                </div>
                <div style="background: var(--border); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, var(--primary), var(--secondary)); height: 100%; width: ${barWidth}%; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    }).join('');
}
```

**Step 2: Test stats tab**

Run: `python -m http.server 8000`
Actions:
1. Complete some tasks
2. Switch to Stats tab
3. Change time period (Week/Month/Year)
4. Verify stats calculate correctly

Expected: Stats display correctly with breakdown

**Step 3: Commit**

```bash
git add app.js
git commit -m "Add stats tab implementation"
```

---

## Task 9: Offline Support and Sync

**Files:**
- Modify: `app.js`

**Step 1: Add online/offline detection**

Add to `app.js`:

```javascript
// Add after init()
window.addEventListener('online', handleOnline);
window.addEventListener('offline', handleOffline);

function handleOnline() {
    console.log('Back online');
    document.getElementById('sync-status').classList.add('hidden');

    // Sync queued data
    syncQueuedData();
}

function handleOffline() {
    console.log('Gone offline');
    const syncStatus = document.getElementById('sync-status');
    syncStatus.classList.remove('hidden');
    syncStatus.classList.add('offline');
    showToast('You are offline. Changes will sync when online.');
}

async function syncQueuedData() {
    const queued = localStorage.getItem('sync_queue');
    if (!queued) return;

    try {
        const data = JSON.parse(queued);
        const success = await saveGoalsData(data);

        if (success) {
            localStorage.removeItem('sync_queue');
            showToast('Data synced successfully! ✅');
        }
    } catch (error) {
        console.error('Sync error:', error);
    }
}

// Check online status on load
if (!navigator.onLine) {
    handleOffline();
}
```

**Step 2: Test offline mode**

Run: `python -m http.server 8000`
Actions:
1. Open browser DevTools
2. Go to Network tab
3. Set to "Offline"
4. Try completing tasks
5. Go back "Online"
6. Verify sync happens

Expected: Offline indicator shows, data queues, syncs when online

**Step 3: Commit**

```bash
git add app.js
git commit -m "Add offline support and sync"
```

---

## Task 10: Initialize Data with Predefined Tasks

**Files:**
- Modify: `app.js`

**Step 1: Update getDefaultData to use PREDEFINED_TASKS**

Modify `getDefaultData()` in `app.js`:

```javascript
function getDefaultData() {
    return {
        predefinedTasks: {
            personal: PREDEFINED_TASKS.personal.map(t => ({...t, type: 'personal'})),
            couple: PREDEFINED_TASKS.couple.map(t => ({...t, type: 'couple'}))
        },
        customTasks: [],
        customCategories: [],
        completions: {},
        streaks: {}
    };
}
```

**Step 2: Test with fresh data**

Actions:
1. Clear localStorage
2. Reload page
3. Login again
4. Verify all predefined tasks appear

Expected: All predefined tasks from config.js visible

**Step 3: Commit**

```bash
git add app.js
git commit -m "Initialize with predefined tasks"
```

---

## Task 11: Manual Testing Checklist

**Step 1: Create testing checklist document**

Create `docs/testing-checklist.md`:

```markdown
# Manual Testing Checklist

## Authentication
- [ ] Login with GitHub token works
- [ ] Token persists across page refreshes
- [ ] Invalid token shows error

## Task Display
- [ ] Personal goals tab shows all personal tasks
- [ ] Couple goals tab shows all couple tasks
- [ ] Tasks grouped by category correctly
- [ ] Frequency badges display correctly

## Task Completion
- [ ] Click empty star → fills with gold
- [ ] Click filled star → becomes empty
- [ ] Confetti plays on completion
- [ ] Toast shows progress message
- [ ] Streak counter updates
- [ ] Stats bar updates immediately

## Add Custom Task
- [ ] FAB button opens modal
- [ ] Can enter task name
- [ ] Can select existing category
- [ ] Can create new category
- [ ] Can select frequency (Daily/Weekly/Anytime)
- [ ] New task appears in correct tab
- [ ] Cancel button closes modal

## Stats Tab
- [ ] Shows total completions
- [ ] Shows top streaks
- [ ] Shows category breakdown
- [ ] Shows daily activity chart
- [ ] Week/Month/Year selector works
- [ ] Stats update when tasks completed

## Offline Mode
- [ ] Offline indicator shows when offline
- [ ] Can complete tasks offline
- [ ] Changes queue for sync
- [ ] Syncs when back online
- [ ] Success toast shows after sync

## Mobile Testing
- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Touch targets are large enough (44px+)
- [ ] No horizontal scrolling
- [ ] Tabs switch smoothly
- [ ] Modal fits on screen
- [ ] Animations are smooth

## Data Persistence
- [ ] Tasks persist after page refresh
- [ ] Completions persist after refresh
- [ ] Streaks persist after refresh
- [ ] Custom tasks persist
- [ ] Works across devices (with same GitHub account)

## Edge Cases
- [ ] First time user (no data file)
- [ ] Multiple rapid task toggles
- [ ] Task completion at midnight
- [ ] Long task names wrap correctly
- [ ] Many tasks scroll properly
- [ ] Network errors handled gracefully
```

**Step 2: Perform manual testing**

Go through each item in the checklist.
Mark items as complete.
Fix any issues found.

**Step 3: Commit testing docs**

```bash
git add docs/testing-checklist.md
git commit -m "Add manual testing checklist"
```

---

## Task 12: GitHub OAuth App Setup (Optional Enhancement)

**Note:** For MVP, we're using Personal Access Token. This task is for post-launch if you want proper OAuth flow.

**Files:**
- Create: `api/oauth.js` (if using serverless functions)
- Modify: `app.js`

**Post-MVP Task:** Set up GitHub OAuth App and serverless function for token exchange.

**For now:** Document the PAT approach in README.

---

## Task 13: Documentation

**Files:**
- Create: `README.md`

**Step 1: Update README with usage instructions**

Replace `README.md`:

```markdown
# Goals Tracker 🎯

A mobile-first goal tracking website for personal and couple activities.

## Features

- ✅ Personal and couple goal tracking
- ⭐ Satisfying gold star completion
- 🎉 Celebration effects
- 📊 Statistics and streaks
- 📱 Mobile-optimized design
- ☁️ GitHub-backed storage (sync across devices)
- 🔌 Offline support

## Setup

### 1. Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name: "Goals Tracker"
4. Select scope: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't see it again!)

### 2. Login to the App

1. Visit https://kalemans.github.io
2. Click "Login with GitHub"
3. Paste your token
4. Start tracking goals!

## Usage

### Completing Tasks

- Tap the empty star (☆) to complete a task
- Tap the gold star (⭐) to uncomplete
- Enjoy the celebration confetti! 🎉

### Adding Custom Tasks

1. Tap the + button (bottom right)
2. Enter task name
3. Select or create category
4. Choose frequency (Daily/Weekly/Anytime)
5. Tap Save

### Viewing Stats

1. Switch to "Stats" tab
2. Select time period (Week/Month/Year)
3. View completions, streaks, and trends

## Tech Stack

- Vanilla JavaScript (ES6 modules)
- GitHub REST API for data storage
- Canvas Confetti for celebrations
- CSS Grid and Flexbox for layout

## Development

```bash
# Start local server
python -m http.server 8000

# Open browser
open http://localhost:8000
```

## Data Storage

All data is stored in `data/goals.json` in this repository. The file is automatically created on first use and synced via GitHub API.

## License

Personal project - all rights reserved.
```

**Step 2: Update CLAUDE.md**

Add to `CLAUDE.md`:

```markdown
## Development Commands

**Local development:**
```bash
python -m http.server 8000
```

**Deploy:**
Simply push to main branch - GitHub Pages auto-deploys.

**Data file:**
`data/goals.json` - contains all tasks and completion data

## Architecture

**Stack:** Vanilla HTML/CSS/JavaScript (no build process)

**Key Files:**
- `index.html` - Main page structure
- `styles.css` - Mobile-first styling
- `app.js` - Application logic
- `config.js` - GitHub settings and predefined tasks

**Data Flow:**
1. GitHub API (OAuth token) → fetch data
2. localStorage cache for offline support
3. Optimistic UI updates
4. Background sync to GitHub

**Predefined Tasks:**
Configured in `config.js` - modify PREDEFINED_TASKS object to add/remove default tasks.
```

**Step 3: Commit documentation**

```bash
git add README.md CLAUDE.md
git commit -m "Add project documentation"
```

---

## Final Task: Pre-Launch Checklist

**Step 1: Review all functionality**

- [ ] Authentication works
- [ ] Tasks render correctly
- [ ] Completion with celebration works
- [ ] Custom tasks can be added
- [ ] Stats display correctly
- [ ] Offline mode works
- [ ] Mobile-friendly
- [ ] No console errors

**Step 2: Mobile device testing**

- [ ] Test on actual iPhone
- [ ] Test on actual Android
- [ ] Test touch interactions
- [ ] Test animations smoothness

**Step 3: Final polish**

- [ ] Fix any visual bugs
- [ ] Optimize performance if needed
- [ ] Test with multiple days of data

**Step 4: Deploy**

```bash
git push origin main
```

**Step 5: Verify live site**

- Visit https://kalemans.github.io
- Test full flow on mobile
- Confirm ready for March 10 launch

---

## Post-Launch Enhancements (After March 10)

1. **Advanced Charts:** Add Chart.js for pie/bar/line charts
2. **Reminders:** Push notifications for daily tasks
3. **Export Data:** CSV/PDF export functionality
4. **Dark Mode:** Toggle for dark theme
5. **GitHub OAuth:** Proper OAuth flow instead of PAT
6. **Task Templates:** More predefined task options
7. **Achievements:** Badges for milestones
8. **Shared View:** Read-only view to share progress

---

**Plan Complete!** Ready for implementation using superpowers:executing-plans or superpowers:subagent-driven-development.
