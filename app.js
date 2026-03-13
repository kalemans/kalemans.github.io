import { PREDEFINED_TASKS } from './config.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Version
const APP_VERSION = '4.2.2';

console.log('🚀 APP.JS LOADED - VERSION 4.2.2 - CRITICAL FIXES');

// State Management
let currentData = null;
let db = null;

// Date state - tracks the currently viewed date for each tab
let viewedDates = {
    personal: null,  // Will be initialized to today
    couple: null     // Will be initialized to today
};

// Filter state
let filters = {
    personal: {
        category: 'all',
        frequency: 'all'
    },
    couple: {
        category: 'all',
        frequency: 'all'
    }
};

// ===================================
// AUTHENTICATION HELPERS (Firebase Auth)
// ===================================

let auth = null; // Firebase Auth instance

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('main-app');
const loadingScreen = document.getElementById('loading-screen');
const googleSignInButton = document.getElementById('google-signin-button');
const authError = document.getElementById('auth-error');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Debug logging function (console only)
function debugLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });
    if (data) {
        console.log(`[${timestamp}] ${message}`, data);
    } else {
        console.log(`[${timestamp}] ${message}`);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);

async function init() {
    loadingScreen.classList.add('hidden');

    debugLog(`🚀 App v${APP_VERSION} started with Firebase`);

    // Initialize Firebase
    if (!isFirebaseConfigured()) {
        debugLog('⚠️ Firebase not configured yet! Edit firebase-config.js');
        authScreen.querySelector('.auth-container h1').textContent = 'Firebase Setup Required';
        authScreen.querySelector('.auth-subtitle').textContent = 'Please configure Firebase in firebase-config.js';
        authScreen.querySelector('.auth-form').style.display = 'none';
        showAuthScreen();
        return;
    }

    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        debugLog('✓ Firebase initialized', { projectId: firebaseConfig.projectId });
    } catch (error) {
        debugLog('✗ Firebase initialization failed', { error: error.message });
        showToast('Firebase error - check console', 'error');
        showAuthScreen();
        return;
    }

    // Set up Google Sign-In button (auth screen only)
    setupAuthScreen();

    // Set up auth state listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in
            debugLog('✓ User authenticated', { email: user.email });

            // Show loading indicator
            loadingScreen.classList.remove('hidden');

            showMainApp();

            // Always reload data and set up listeners on login
            await loadApp();

            // Set up event listeners (these are safe to call multiple times)
            setupTabs();
            updateDashboardDate();
            setupModal();
            setupMobileFeatures();
            setupFilters();
            setupDayMonthToggle();
            setupDatePickers();

            // Set up logout button now that main app is visible
            setupLogoutButton();

            // Hide loading indicator
            loadingScreen.classList.add('hidden');

        } else {
            // User is signed out - reset state
            debugLog('⚠️ User not authenticated - showing login');

            // Reset app state
            currentData = null;

            // Reset button state
            if (googleSignInButton) {
                googleSignInButton.disabled = false;
                googleSignInButton.innerHTML = `
                    <svg class="google-icon" viewBox="0 0 24 24" width="18" height="18">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                `;
            }

            showAuthScreen();
        }
    });
}

function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

function setupAuthScreen() {
    // Google Sign-In button handler
    if (googleSignInButton) {
        googleSignInButton.addEventListener('click', handleGoogleSignIn);
    }
}

function setupLogoutButton() {
    // Logout button handler (called after main app is shown)
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

async function handleGoogleSignIn() {
    // Clear any previous errors
    authError.textContent = '';

    // Show loading state
    googleSignInButton.disabled = true;
    const originalText = googleSignInButton.innerHTML;
    googleSignInButton.innerHTML = '<span style="opacity: 0.7;">Signing in...</span>';

    try {
        // Set persistence to LOCAL (stays logged in forever)
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

        // Create Google auth provider
        const provider = new firebase.auth.GoogleAuthProvider();

        // Sign in with popup
        const result = await auth.signInWithPopup(provider);

        debugLog('✓ Google Sign-In successful', {
            email: result.user.email,
            displayName: result.user.displayName
        });

        // onAuthStateChanged will handle the rest

    } catch (error) {
        debugLog('✗ Google Sign-In failed', { error: error.message, code: error.code });

        // User-friendly error messages
        let errorMessage = 'Sign in failed. Please try again.';

        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = 'Sign in cancelled';
        } else if (error.code === 'auth/popup-blocked') {
            errorMessage = 'Pop-up blocked. Please allow pop-ups and try again.';
        } else if (error.code === 'auth/unauthorized-domain') {
            errorMessage = 'This domain is not authorized. Contact the administrator.';
        } else if (error.code === 'auth/cancelled-popup-request') {
            // User opened multiple popups, ignore this error
            errorMessage = '';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Check your internet connection.';
        }

        if (errorMessage) {
            showAuthError(errorMessage);
        }

        // Restore button
        googleSignInButton.disabled = false;
        googleSignInButton.innerHTML = originalText;
    }
}

async function handleLogout() {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
        try {
            debugLog('🚪 User logging out');
            await auth.signOut();
            debugLog('✓ User logged out successfully');
            // onAuthStateChanged will handle showing login screen
        } catch (error) {
            debugLog('✗ Logout error', { error: error.message });
            showToast('Error logging out', 'error');
        }
    }
}

function showAuthError(message) {
    authError.textContent = message;
    authError.style.color = '#ff4444';
    authError.style.marginTop = '12px';
    authError.style.fontSize = '14px';
}

async function loadApp() {
    try {
        const data = await loadGoalsData();
        currentData = data;
        renderGoals(currentData);
        debugLog('✓ App loaded successfully');

        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
            debugLog('✓ Lucide icons initialized');
        }
    } catch (error) {
        debugLog('✗ Error loading app', { error: error.message });
        showToast('Error loading data', 'error');
        const cached = localStorage.getItem('goals_cache');
        currentData = cached ? JSON.parse(cached) : getDefaultData();
        renderGoals(currentData);

        // Initialize Lucide icons even on error
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// ===================================
// FIREBASE DATA LAYER
// ===================================

async function loadGoalsData() {
    debugLog('📥 Loading data from Firebase...');

    try {
        const docRef = db.collection('goals').doc('main');
        const doc = await docRef.get();

        debugLog('📥 Firebase response:', {
            exists: doc.exists,
            id: doc.id
        });

        if (doc.exists) {
            const data = doc.data();
            localStorage.setItem('goals_cache', JSON.stringify(data));
            debugLog('✓ Data loaded from Firebase');
            return data;
        } else {
            debugLog('📄 No data found, creating initial data');
            const defaultData = getDefaultData();
            await saveGoalsData(defaultData);
            return defaultData;
        }
    } catch (error) {
        debugLog('✗ Firebase error', { error: error.message });

        // Fall back to cached data
        const cached = localStorage.getItem('goals_cache');
        if (cached) {
            debugLog('⚠️ Using cached data');
            return JSON.parse(cached);
        }

        return getDefaultData();
    }
}

async function saveGoalsData(data) {
    debugLog('📤 Saving data to Firebase...');

    try {
        const docRef = db.collection('goals').doc('main');

        await docRef.set(data);

        debugLog('✓ Data saved to Firebase');

        // Also cache locally
        localStorage.setItem('goals_cache', JSON.stringify(data));

        return true;
    } catch (error) {
        debugLog('✗ Firebase save error', { error: error.message });
        showToast('Error saving data', 'error');
        return false;
    }
}

function handleHardRefresh() {
    debugLog('🔄 Hard refresh triggered - clearing cache');
    // Hard refresh with cache bypass
    window.location.reload(true);
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

// ===================================
// UI RENDERING
// ===================================

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContent = document.querySelector('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');

            // Change body background to match tab
            updateBodyBackground(tab);

            // Smooth scroll to top when switching tabs
            if (tabContent) {
                tabContent.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }

            // If switching to stats tab, scroll charts to show most recent data
            if (tab === 'stats') {
                scrollChartsToRight();
            }
        });
    });

    // Set initial background based on active tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        updateBodyBackground(activeTab.dataset.tab);
    }
}

function scrollChartsToRight() {
    setTimeout(() => {
        // Scroll Year Completion Trend chart to right
        const trendContainer = document.querySelector('.trend-chart-container');
        if (trendContainer) {
            trendContainer.scrollLeft = trendContainer.scrollWidth - trendContainer.clientWidth;
        }

        // Scroll Activity Calendar heatmap to right
        const heatmapContainer = document.getElementById('heatmap-chart');
        if (heatmapContainer) {
            heatmapContainer.scrollLeft = heatmapContainer.scrollWidth - heatmapContainer.clientWidth;
        }
    }, 200);
}

function updateBodyBackground(tab) {
    const body = document.body;
    const root = document.documentElement;

    if (tab === 'personal') {
        const personalBg = getComputedStyle(root).getPropertyValue('--wireframe-personal-bg').trim(); 
        body.style.backgroundColor = personalBg;
    } else if (tab === 'couple') {
        const coupleBg = getComputedStyle(root).getPropertyValue('--wireframe-bg').trim();
        body.style.backgroundColor = coupleBg;
    } else {
        body.style.backgroundColor = '#FFFFFF'; // Stats tab white background
    }
}

function updateDashboardDate() {
    // Initialize viewed dates if not set
    if (!viewedDates.personal) viewedDates.personal = getTodayString();
    if (!viewedDates.couple) viewedDates.couple = getTodayString();

    updateTabDate('personal');
    updateTabDate('couple');
}

function updateTabDate(tabType) {
    const viewedDate = viewedDates[tabType];
    const dateObj = new Date(viewedDate + 'T00:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const formattedDate = dateObj.toLocaleDateString('en-US', options);

    const dateEl = document.getElementById(`${tabType}-dashboard-date`);
    const datePickerEl = document.getElementById(`${tabType}-date-picker`);
    const bannerEl = document.getElementById(`${tabType}-date-banner`);
    const bannerTextEl = document.getElementById(`${tabType}-banner-text`);

    if (dateEl) dateEl.textContent = formattedDate;
    if (datePickerEl) datePickerEl.value = viewedDate;

    // Show/hide banner if viewing past date
    const isToday = viewedDate === getTodayString();
    if (bannerEl) {
        if (isToday) {
            bannerEl.classList.add('hidden');
        } else {
            bannerEl.classList.remove('hidden');
            if (bannerTextEl) {
                bannerTextEl.textContent = `Viewing ${formattedDate}`;
            }
        }
    }
}

function renderGoals(data) {
    renderPersonalGoals(data);
    renderCoupleGoals(data);
    renderStats(data);
    // Removed updateDailyProgress since we removed the header

    // Initialize Lucide icons after rendering
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function updateDailyProgress(data) {
    const today = getTodayString();
    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];

    if (allTasks.length === 0) {
        document.getElementById('daily-progress').classList.add('hidden');
        return;
    }

    const completedTasks = allTasks.filter(task =>
        data.completions[today]?.[task.id]?.completed === true
    ).length;

    const percentage = Math.round((completedTasks / allTasks.length) * 100);

    // Update progress ring
    const progressRing = document.getElementById('progress-ring-circle');
    const progressText = document.getElementById('progress-text');
    const dailyProgress = document.getElementById('daily-progress');
    const progressRingContainer = dailyProgress.querySelector('.progress-ring');

    if (progressRing && progressText) {
        const circumference = 94.25; // 2 * π * 15
        const offset = circumference - (percentage / 100) * circumference;
        progressRing.style.strokeDashoffset = offset;
        progressText.textContent = `${percentage}%`;
        dailyProgress.classList.remove('hidden');

        // Add complete class when 100%
        if (percentage === 100) {
            progressRingContainer.classList.add('complete');
        } else {
            progressRingContainer.classList.remove('complete');
        }
    }
}

function renderPersonalGoals(data) {
    const container = document.getElementById('personal-goals');
    container.innerHTML = '';

    // Render weekly overview
    renderWeeklyOverviewPersonal(data);

    // Use the viewed date for this tab
    const viewedDate = viewedDates.personal || getTodayString();
    let tasks = getAllTasksWithType(data, 'personal');

    // Update category filters for modal
    updateCategoryFiltersModal('personal', tasks);

    // Apply filters
    tasks = applyFilters(tasks, filters.personal);

    // Sort alphabetically by goal name
    tasks.sort((a, b) => a.name.localeCompare(b.name));

    if (tasks.length === 0) {
        const allTasks = getAllTasksWithType(data, 'personal');
        if (allTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎯</div>
                    <div class="empty-state-text">No personal goals yet</div>
                    <p class="empty-state-hint">Click "+ Add Goal" above to create your first personal goal!</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No goals match your filters</div>
                    <p class="empty-state-hint">Try selecting different category or frequency filters</p>
                </div>
            `;
        }
        return;
    }

    tasks.forEach((task, index) => {
        const completed = data.completions[viewedDate]?.[task.id]?.completed || false;
        const card = createGoalCard(task, completed, data);
        card.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(card);
    });
}

function renderCoupleGoals(data) {
    const container = document.getElementById('couple-goals');
    container.innerHTML = '';

    // Render weekly overview
    renderWeeklyOverview(data);

    // Use the viewed date for this tab
    const viewedDate = viewedDates.couple || getTodayString();
    let tasks = getAllTasksWithType(data, 'couple');

    // Update category filters for modal
    updateCategoryFiltersModal('couple', tasks);

    // Apply filters
    tasks = applyFilters(tasks, filters.couple);

    // Sort alphabetically by goal name
    tasks.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`📋 Rendering ${tasks.length} couple tasks:`, tasks.map(t => ({name: t.name, type: t.type, id: t.id})));

    if (tasks.length === 0) {
        const allTasks = getAllTasksWithType(data, 'couple');
        if (allTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💑</div>
                    <div class="empty-state-text">No couple goals yet</div>
                    <p class="empty-state-hint">Click "+ Add Goal" above to create your first couple goal!</p>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-text">No goals match your filters</div>
                    <p class="empty-state-hint">Try selecting different category or frequency filters</p>
                </div>
            `;
        }
        return;
    }

    tasks.forEach((task, index) => {
        const completed = data.completions[viewedDate]?.[task.id]?.completed || false;
        const card = createGoalCard(task, completed, data);
        card.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(card);
    });
}

function createGoalCard(task, completed, data) {
    const card = document.createElement('div');
    const isCustom = task.id.startsWith('custom-');

    console.log(`🎯 createGoalCard called - Task: ${task.name}, Type: ${task.type}, ID: ${task.id}`);

    // Render wireframe style for all goals (both personal and couple)
    console.log(`✅ WIREFRAME BRANCH - Rendering ${task.name} as wireframe card`);
    card.className = `wireframe-goal-card ${completed ? 'completed' : ''}`;

    card.innerHTML = `
        <div class="card-swipe-actions">
            <button class="card-action-btn edit-btn" data-action="edit">
                <i data-lucide="edit-2"></i>
                <span>Edit</span>
            </button>
            <button class="card-action-btn delete-btn" data-action="delete">
                <i data-lucide="trash-2"></i>
                <span>Delete</span>
            </button>
        </div>
        <div class="card-content">
            <div class="wireframe-goal-header">
                <div class="wireframe-goal-name">${task.name}</div>
                <div class="wireframe-goal-actions">
                    <svg class="wireframe-goal-star ${completed ? 'completed' : ''}" width="40" height="40" viewBox="0 0 24 24" data-id="${task.id}">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                              fill="${completed ? 'url(#gold-gradient)' : 'none'}"
                              stroke="var(--wireframe-border)"/>
                    </svg>
                </div>
            </div>
            <div class="wireframe-goal-meta">
                <span class="wireframe-goal-tag">${task.category}</span>
                <span class="wireframe-goal-tag">${task.frequency}</span>
            </div>
        </div>
    `;

    console.log(`✅ Wireframe HTML set for ${task.name}, className: ${card.className}`);

    const starBtn = card.querySelector('.wireframe-goal-star');
    starBtn.addEventListener('click', () => toggleGoalCompletion(task.id, task.type, data));

    // Add action button listeners for all goals
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
        openEditModal(task);
        closeCardActions(card);
    });

    deleteBtn.addEventListener('click', () => {
        confirmDeleteGoal(task);
        closeCardActions(card);
    });

    // Add swipe gestures to card
    addSwipeToReveal(card);

    return card;
}

function addSwipeToReveal(card) {
    const cardContent = card.querySelector('.card-content');
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isSwiping = false;
    const actionsWidth = 160; // Width of the actions buttons

    card.addEventListener('touchstart', (e) => {
        // Don't interfere with button clicks
        if (e.target.closest('.card-action-btn') || e.target.closest('.wireframe-goal-star')) {
            return;
        }

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentX = getTranslateX(cardContent);
        isSwiping = false;
    }, { passive: false });

    card.addEventListener('touchmove', (e) => {
        if (!startX) return;

        const touchX = e.touches[0].clientX;
        const touchY = e.touches[0].clientY;
        const diffX = touchX - startX;
        const diffY = touchY - startY;

        // Determine if this is a horizontal swipe
        if (!isSwiping && Math.abs(diffX) > 10) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isSwiping = true;
                e.preventDefault();
            }
        }

        if (isSwiping) {
            e.preventDefault();
            let newX = currentX + diffX;

            // Constrain: can slide left (negative) to reveal actions, or return to 0
            newX = Math.max(-actionsWidth, Math.min(0, newX));

            cardContent.style.transform = `translateX(${newX}px)`;
            cardContent.style.transition = 'none';
        }
    }, { passive: false });

    card.addEventListener('touchend', (e) => {
        if (!startX) return;

        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;
        const translateX = getTranslateX(cardContent);

        cardContent.style.transition = 'transform 0.3s ease';

        // Determine final position based on swipe distance and direction
        if (diffX < -50 && translateX > -actionsWidth) {
            // Swiped left - reveal actions
            cardContent.style.transform = `translateX(-${actionsWidth}px)`;
            card.classList.add('actions-revealed');
        } else if (diffX > 50 && translateX < 0) {
            // Swiped right - close actions
            cardContent.style.transform = 'translateX(0)';
            card.classList.remove('actions-revealed');
        } else {
            // Snap to nearest position
            if (Math.abs(translateX) > actionsWidth / 2) {
                cardContent.style.transform = `translateX(-${actionsWidth}px)`;
                card.classList.add('actions-revealed');
            } else {
                cardContent.style.transform = 'translateX(0)';
                card.classList.remove('actions-revealed');
            }
        }

        // Reset
        startX = 0;
        startY = 0;
        isSwiping = false;
    }, { passive: true });
}

function getTranslateX(element) {
    const style = window.getComputedStyle(element);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return matrix.m41;
}

function closeCardActions(card) {
    const cardContent = card.querySelector('.card-content');
    if (cardContent) {
        cardContent.style.transition = 'transform 0.3s ease';
        cardContent.style.transform = 'translateX(0)';
        card.classList.remove('actions-revealed');
    }
}

async function toggleGoalCompletion(taskId, taskType, data) {
    // Use the viewed date for the task's tab type
    const targetDate = viewedDates[taskType] || getTodayString();

    if (!data.completions[targetDate]) {
        data.completions[targetDate] = {};
    }

    const isCurrentlyCompleted = data.completions[targetDate][taskId]?.completed || false;
    const nowCompleted = !isCurrentlyCompleted;

    data.completions[targetDate][taskId] = {
        completed: nowCompleted,
        timestamp: new Date().toISOString()
    };

    // Only update streaks if editing today's date
    const isToday = targetDate === getTodayString();
    if (isToday) {
        // Update streaks
        if (!data.streaks) data.streaks = {};
        if (!data.streaks[taskId]) {
            data.streaks[taskId] = { current: 0, longest: 0 };
        }

        if (nowCompleted) {
            // Increment streak
            data.streaks[taskId].current += 1;
            if (data.streaks[taskId].current > data.streaks[taskId].longest) {
                data.streaks[taskId].longest = data.streaks[taskId].current;
            }

            // Celebrate with confetti!
            if (typeof confetti !== 'undefined') {
                // Rainbow colors for all celebrations
                const rainbowColors = ['#FF1744', '#FF9100', '#FFD600', '#00E676', '#2979FF', '#651FFF', '#E91E63'];

                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: rainbowColors
                });
            }

            // Check if all goals are completed
            checkAllGoalsCompleted(data, targetDate);
        } else {
            // Reset streak
            data.streaks[taskId].current = 0;
        }
    }

    currentData = data;
    renderGoals(currentData);

    await saveGoalsData(currentData);
}

function checkAllGoalsCompleted(data, today) {
    const allTasks = [
        ...data.predefinedTasks.personal,
        ...data.predefinedTasks.couple,
        ...data.customTasks
    ];

    const allCompleted = allTasks.every(task =>
        data.completions[today]?.[task.id]?.completed === true
    );

    if (allCompleted && allTasks.length > 0) {
        // Epic celebration with rainbow colors!
        setTimeout(() => {
            if (typeof confetti !== 'undefined') {
                const rainbowColors = ['#FF1744', '#FF9100', '#FFD600', '#00E676', '#2979FF', '#651FFF', '#E91E63'];
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.5 },
                    colors: rainbowColors,
                    startVelocity: 45,
                    gravity: 0.8
                });
            }
            showToast('🎉 All goals completed! Amazing work!', 'success', 4000);
        }, 300);
    }
}

function renderStats(data) {
    renderSummaryCards(data);
    renderTrendChart(data);
    // Render day or month chart based on current view
    if (isDayView) {
        renderDayOfWeekChart(data);
    } else {
        renderMonthOfYearChart(data);
    }
    renderCategoryChart(data);
    renderHeatmap(data);
    renderAchievements(data);
}

// ===================================
// SUMMARY CARDS
// ===================================

function renderSummaryCards(data) {
    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];

    // Calculate totals by frequency
    const dailyTasks = allTasks.filter(t => t.frequency === 'Daily');

    // Calculate total completions
    let totalCompletions = 0;
    let dailyCompletions = 0;
    let weeklyCompletions = 0;
    let anytimeCompletions = 0;

    Object.values(data.completions || {}).forEach(dayCompletions => {
        Object.entries(dayCompletions).forEach(([taskId, comp]) => {
            if (comp.completed) {
                totalCompletions++;
                const task = allTasks.find(t => t.id === taskId);
                if (task) {
                    if (task.frequency === 'Daily') dailyCompletions++;
                    else if (task.frequency === 'Weekly') weeklyCompletions++;
                    else if (task.frequency === 'Anytime') anytimeCompletions++;
                }
            }
        });
    });

    // Calculate current streak (Daily goals only)
    let maxStreak = 0;
    dailyTasks.forEach(task => {
        if (data.streaks && data.streaks[task.id]) {
            maxStreak = Math.max(maxStreak, data.streaks[task.id].current || 0);
        }
    });

    // Calculate this week completion rate
    const today = getPSTDate();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + mondayOffset + i);
        weekDays.push(formatDateToPST(date));
    }

    let weekCompletions = 0;
    let weekTotal = dailyTasks.length * weekDays.length;
    weekDays.forEach(dateStr => {
        dailyTasks.forEach(task => {
            if (data.completions[dateStr]?.[task.id]?.completed) {
                weekCompletions++;
            }
        });
    });
    const weekRate = weekTotal > 0 ? Math.round((weekCompletions / weekTotal) * 100) : 0;

    // Update summary cards
    document.querySelector('#summary-total .summary-value').textContent = totalCompletions;
    document.querySelector('#summary-daily .summary-value').textContent = dailyCompletions;
    document.querySelector('#summary-weekly .summary-value').textContent = weeklyCompletions;
    document.querySelector('#summary-anytime .summary-value').textContent = anytimeCompletions;
    document.querySelector('#summary-streak .summary-value').textContent = `🔥 ${maxStreak}`;
    document.querySelector('#summary-rate .summary-value').textContent = `${weekRate}%`;
}

// ===================================
// YEAR TREND CHART
// ===================================

let trendChartInstance = null;

function renderTrendChart(data) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Destroy existing chart
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }

    // Set canvas dimensions based on screen size (fixed width for scrollable chart)
    const isMobile = window.innerWidth < 768;
    const chartWidth = isMobile ? 1200 : 1800;
    const chartHeight = isMobile ? 180 : 220;

    canvas.width = chartWidth;
    canvas.height = chartHeight;
    canvas.style.width = chartWidth + 'px';
    canvas.style.height = chartHeight + 'px';

    // Get last 365 days (full year)
    const dates = [];
    const today = getPSTDate();
    for (let i = 364; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(formatDateToPST(date));
    }

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];

    const dailyTasks = allTasks.filter(t => t.frequency === 'Daily');
    const weeklyTasks = allTasks.filter(t => t.frequency === 'Weekly');
    const anytimeTasks = allTasks.filter(t => t.frequency === 'Anytime');

    // Calculate completions for each day
    const dailyData = dates.map(date => {
        return dailyTasks.filter(task =>
            data.completions[date]?.[task.id]?.completed
        ).length;
    });

    const weeklyData = dates.map(date => {
        return weeklyTasks.filter(task =>
            data.completions[date]?.[task.id]?.completed
        ).length;
    });

    const anytimeData = dates.map(date => {
        return anytimeTasks.filter(task =>
            data.completions[date]?.[task.id]?.completed
        ).length;
    });

    // Format labels (show first day of each month)
    const labels = dates.map((date, i) => {
        const d = new Date(date);
        // Show label on first of month
        if (d.getDate() === 1) {
            return `${d.toLocaleDateString('en-US', { month: 'short' })}`;
        }
        return '';
    });

    trendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Daily Goals',
                    data: dailyData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-daily').trim(),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-daily-bg').trim(),
                    tension: 0.3,
                    fill: true,
                    borderWidth: 1.5,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'Weekly Goals',
                    data: weeklyData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-weekly').trim(),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-weekly-bg').trim(),
                    tension: 0.3,
                    fill: true,
                    borderWidth: 1.5,
                    pointRadius: 2,
                    pointHoverRadius: 4
                },
                {
                    label: 'Anytime Goals',
                    data: anytimeData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-anytime').trim(),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-anytime-bg').trim(),
                    tension: 0.3,
                    fill: true,
                    borderWidth: 1.5,
                    pointRadius: 2,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 10,
                        font: {
                            size: isMobile ? 10 : 11
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: {
                            size: isMobile ? 10 : 11
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 0,
                        autoSkip: false,
                        font: {
                            size: isMobile ? 9 : 10
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    hitRadius: 10,
                    hoverRadius: 6
                }
            }
        }
    });

    // Scroll to the right (most recent data) after chart renders
    setTimeout(() => {
        const trendContainer = canvas.closest('.trend-chart-container');
        if (trendContainer && trendContainer.scrollWidth > trendContainer.clientWidth) {
            trendContainer.scrollLeft = trendContainer.scrollWidth - trendContainer.clientWidth;
        }
    }, 300);
}

// ===================================
// BEST DAY OF WEEK CHART
// ===================================

let dayChartInstance = null;
let isDayView = true; // Track which view is active (day vs month)

function renderDayOfWeekChart(data) {
    const canvas = document.getElementById('day-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (dayChartInstance) {
        dayChartInstance.destroy();
    }

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];
    const dailyTasks = allTasks.filter(t => t.frequency === 'Daily');

    // Calculate completions by day of week
    const dayStats = {
        Mon: { completed: 0, total: 0 },
        Tue: { completed: 0, total: 0 },
        Wed: { completed: 0, total: 0 },
        Thu: { completed: 0, total: 0 },
        Fri: { completed: 0, total: 0 },
        Sat: { completed: 0, total: 0 },
        Sun: { completed: 0, total: 0 }
    };

    Object.entries(data.completions || {}).forEach(([dateStr, dayCompletions]) => {
        const date = new Date(dateStr + 'T00:00:00');
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];

        dailyTasks.forEach(task => {
            dayStats[dayName].total++;
            if (dayCompletions[task.id]?.completed) {
                dayStats[dayName].completed++;
            }
        });
    });

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const percentages = labels.map(day => {
        const stats = dayStats[day];
        return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    });

    dayChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Completion Rate (%)',
                data: percentages,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-daily').trim(),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-daily').trim(),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function renderMonthOfYearChart(data) {
    const canvas = document.getElementById('day-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (dayChartInstance) {
        dayChartInstance.destroy();
    }

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];

    // Calculate completions by month
    const monthStats = {
        Jan: { completed: 0, total: 0 },
        Feb: { completed: 0, total: 0 },
        Mar: { completed: 0, total: 0 },
        Apr: { completed: 0, total: 0 },
        May: { completed: 0, total: 0 },
        Jun: { completed: 0, total: 0 },
        Jul: { completed: 0, total: 0 },
        Aug: { completed: 0, total: 0 },
        Sep: { completed: 0, total: 0 },
        Oct: { completed: 0, total: 0 },
        Nov: { completed: 0, total: 0 },
        Dec: { completed: 0, total: 0 }
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    Object.entries(data.completions || {}).forEach(([dateStr, dayCompletions]) => {
        const date = new Date(dateStr + 'T00:00:00');
        const monthName = monthNames[date.getMonth()];

        allTasks.forEach(task => {
            monthStats[monthName].total++;
            if (dayCompletions[task.id]?.completed) {
                monthStats[monthName].completed++;
            }
        });
    });

    const percentages = monthNames.map(month => {
        const stats = monthStats[month];
        return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
    });

    dayChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthNames,
            datasets: [{
                label: 'Completion Rate (%)',
                data: percentages,
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-weekly').trim(),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-weekly').trim(),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });
}

function toggleDayMonthChart() {
    isDayView = !isDayView;
    const titleEl = document.getElementById('day-month-chart-title');

    if (isDayView) {
        titleEl.textContent = 'Best Day of Week (Daily Goals)';
        renderDayOfWeekChart(currentData);
    } else {
        titleEl.textContent = 'Best Month of Year (All Goals)';
        renderMonthOfYearChart(currentData);
    }
}

function setupDayMonthToggle() {
    const toggleBtn = document.getElementById('day-month-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleDayMonthChart);
        // Initialize Lucide icons for the toggle button
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// ===================================
// DATE PICKER SETUP
// ===================================

function setupDatePickers() {
    // Personal tab date picker
    const personalDatePicker = document.getElementById('personal-date-picker');
    const personalBackToToday = document.getElementById('personal-back-to-today');

    if (personalDatePicker) {
        personalDatePicker.addEventListener('change', (e) => {
            changeViewedDate('personal', e.target.value);
        });
    }

    if (personalBackToToday) {
        personalBackToToday.addEventListener('click', () => {
            backToToday('personal');
        });
    }

    // Couple tab date picker
    const coupleDatePicker = document.getElementById('couple-date-picker');
    const coupleBackToToday = document.getElementById('couple-back-to-today');

    if (coupleDatePicker) {
        coupleDatePicker.addEventListener('change', (e) => {
            changeViewedDate('couple', e.target.value);
        });
    }

    if (coupleBackToToday) {
        coupleBackToToday.addEventListener('click', () => {
            backToToday('couple');
        });
    }
}

function changeViewedDate(tabType, newDate) {
    viewedDates[tabType] = newDate;
    updateTabDate(tabType);

    // Re-render the goals for this tab
    if (currentData) {
        if (tabType === 'personal') {
            renderPersonalGoals(currentData);
        } else if (tabType === 'couple') {
            renderCoupleGoals(currentData);
        }
    }

    // Initialize Lucide icons for the banner
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function backToToday(tabType) {
    changeViewedDate(tabType, getTodayString());
}

// ===================================
// CATEGORY BREAKDOWN CHART
// ===================================

let categoryChartInstance = null;

function renderCategoryChart(data) {
    const canvas = document.getElementById('category-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];

    // Count completions by category
    const categoryStats = {};
    Object.values(data.completions || {}).forEach(dayCompletions => {
        Object.entries(dayCompletions).forEach(([taskId, comp]) => {
            if (comp.completed) {
                const task = allTasks.find(t => t.id === taskId);
                if (task) {
                    categoryStats[task.category] = (categoryStats[task.category] || 0) + 1;
                }
            }
        });
    });

    const labels = Object.keys(categoryStats);
    const values = Object.values(categoryStats);

    // Use color palette matching the wireframe theme
    const colorPalette = [
        '#cd1c18',  // Couple accent (red)
        '#003B46',  // Personal border (dark teal)
        '#66A5AD',  // Personal accent (light teal)
        '#9b1313',  // Couple secondary (dark red)
        '#07575B',  // Personal secondary (teal)
        '#ffa896',  // Couple light accent (light red/pink)
        '#C4DFE6',  // Personal inactive (very light teal)
        '#6a737d',  // Anytime gray
        '#fad4d4ff', // Couple inactive (light pink)
        '#38000a'   // Couple border (dark brown-red)
    ];

    // Cycle through colors if more categories than colors
    const colors = labels.map((_, i) => colorPalette[i % colorPalette.length]);

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// ===================================
// PERSONAL VS COUPLE COMPARISON CHART
// ===================================

let comparisonChartInstance = null;

function renderComparisonChart(data) {
    const canvas = document.getElementById('comparison-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (comparisonChartInstance) {
        comparisonChartInstance.destroy();
    }

    const personalTasks = getAllTasksWithType(data, 'personal');
    const coupleTasks = getAllTasksWithType(data, 'couple');

    // Count completions
    let personalCompletions = 0;
    let coupleCompletions = 0;

    Object.values(data.completions || {}).forEach(dayCompletions => {
        Object.entries(dayCompletions).forEach(([taskId, comp]) => {
            if (comp.completed) {
                if (personalTasks.find(t => t.id === taskId)) {
                    personalCompletions++;
                } else if (coupleTasks.find(t => t.id === taskId)) {
                    coupleCompletions++;
                }
            }
        });
    });

    comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Personal', 'Couple'],
            datasets: [{
                label: 'Total Completions',
                data: [personalCompletions, coupleCompletions],
                backgroundColor: [
                    getComputedStyle(document.documentElement).getPropertyValue('--chart-personal').trim(),
                    getComputedStyle(document.documentElement).getPropertyValue('--chart-couple').trim()
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

// ===================================
// CALENDAR HEATMAP
// ===================================

function renderHeatmap(data) {
    const container = document.getElementById('heatmap-chart');
    if (!container) return;

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];
    const maxCompletions = allTasks.length;

    // Find the Monday of the current week (or most recent Monday)
    const today = getPSTDate();
    today.setHours(0, 0, 0, 0);
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate days to subtract to get to Monday
    // If today is Sunday (0), go back 6 days to Monday
    // If today is Monday (1), go back 0 days
    // If today is Tuesday (2), go back 1 day to Monday, etc.
    const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

    const mostRecentMonday = new Date(today);
    mostRecentMonday.setDate(today.getDate() - daysToMonday);

    // Build 52 weeks going backwards from the most recent Monday
    const weeks = [];

    for (let weekNum = 0; weekNum < 52; weekNum++) {
        const week = [];

        // Calculate the Monday of this week (going backwards)
        const weekStartDate = new Date(mostRecentMonday);
        weekStartDate.setDate(mostRecentMonday.getDate() - (weekNum * 7));

        // Build 7 consecutive days for this week (Monday through Sunday)
        for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + dayOfWeek);

            const dateStr = formatDateToPST(date);

            // Calculate completions for this day
            const completions = allTasks.filter(task =>
                data.completions[dateStr]?.[task.id]?.completed
            ).length;

            // Calculate level (0-4) based on completion percentage
            let level = 0;
            if (completions > 0 && maxCompletions > 0) {
                const percentage = completions / maxCompletions;
                if (percentage > 0 && percentage <= 0.25) {
                    level = 1;
                } else if (percentage > 0.25 && percentage <= 0.5) {
                    level = 2;
                } else if (percentage > 0.5 && percentage <= 0.75) {
                    level = 3;
                } else if (percentage > 0.75) {
                    level = 4;
                }
            }

            week.push({
                date: dateStr,
                completions,
                level,
                dateObj: new Date(date)
            });
        }

        weeks.push(week);
    }

    // Reverse weeks array so oldest is first (left to right)
    weeks.reverse();

    // Create month headers
    let monthHeaders = '<div class="heatmap-months">';
    let currentMonth = null;

    weeks.forEach((week, idx) => {
        const firstDayOfWeek = week[0].dateObj; // Monday
        const monthNum = firstDayOfWeek.getMonth();
        const year = firstDayOfWeek.getFullYear();

        if (currentMonth !== monthNum) {
            const month = firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' });
            monthHeaders += `<div class="heatmap-month-label" style="grid-column: ${idx + 1};">${month} ${year}</div>`;
            currentMonth = monthNum;
        }
    });
    monthHeaders += '</div>';

    // Create grid with day labels
    let html = '<div class="heatmap-wrapper">';
    html += monthHeaders;
    html += '<div class="heatmap-content">';
    html += '<div class="heatmap-grid">';

    // Output weeks (columns), each with 7 days (rows: Monday to Sunday)
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    weeks.forEach(week => {
        for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
            const { date, completions, level, dateObj } = week[dayIdx];
            const dayOfMonth = dateObj.getDate();
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            html += `
                <div class="heatmap-cell" data-level="${level}" title="${dateLabel}: ${completions}/${maxCompletions} goals completed">
                    <span class="heatmap-day-number">${dayOfMonth}</span>
                </div>
            `;
        }
    });

    html += '</div>'; // close heatmap-grid

    // Add day labels on the right
    html += '<div class="heatmap-day-labels">';
    dayLabels.forEach(day => {
        html += `<div class="heatmap-day-label">${day}</div>`;
    });
    html += '</div>';

    html += '</div>'; // close heatmap-content

    // Add legend
    html += `
        <div class="heatmap-legend">
            <div class="heatmap-legend-scale">
                <div class="heatmap-legend-box" data-level="0"></div>
                <div class="heatmap-legend-box" data-level="1"></div>
                <div class="heatmap-legend-box" data-level="2"></div>
                <div class="heatmap-legend-box" data-level="3"></div>
                <div class="heatmap-legend-box" data-level="4"></div>
            </div>
        </div>
    `;

    html += '</div>'; // close heatmap-wrapper

    container.innerHTML = html;

    // Scroll to the right (most recent weeks) after heatmap renders
    setTimeout(() => {
        if (container && container.scrollWidth > container.clientWidth) {
            container.scrollLeft = container.scrollWidth - container.clientWidth;
        }
    }, 300);
}

// ===================================
// ACHIEVEMENT BADGES
// ===================================

function renderAchievements(data) {
    const container = document.getElementById('achievements-grid');
    if (!container) return;

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];
    const dailyTasks = allTasks.filter(t => t.frequency === 'Daily');

    // Calculate achievement data
    let totalCompletions = 0;
    const daysActive = new Set();
    let maxStreak = 0;
    let perfectDays = 0;

    Object.entries(data.completions || {}).forEach(([dateStr, dayCompletions]) => {
        let dayCount = 0;
        Object.entries(dayCompletions).forEach(([_, comp]) => {
            if (comp.completed) {
                totalCompletions++;
                daysActive.add(dateStr);
                dayCount++;
            }
        });
        if (dayCount === allTasks.length && allTasks.length > 0) {
            perfectDays++;
        }
    });

    dailyTasks.forEach(task => {
        if (data.streaks && data.streaks[task.id]) {
            maxStreak = Math.max(maxStreak, data.streaks[task.id].current || 0);
        }
    });

    // Define achievements
    const achievements = [
        {
            id: 'first-goal',
            icon: '🎯',
            title: 'First Step',
            description: 'Complete your first goal',
            threshold: 1,
            current: totalCompletions,
            earned: totalCompletions >= 1
        },
        {
            id: 'week-streak',
            icon: '🔥',
            title: '7-Day Streak',
            description: 'Complete daily goals for 7 days',
            threshold: 7,
            current: maxStreak,
            earned: maxStreak >= 7
        },
        {
            id: 'month-streak',
            icon: '⭐',
            title: '30-Day Streak',
            description: 'Complete daily goals for 30 days',
            threshold: 30,
            current: maxStreak,
            earned: maxStreak >= 30
        },
        {
            id: 'century',
            icon: '💯',
            title: 'Century',
            description: 'Complete 100 total goals',
            threshold: 100,
            current: totalCompletions,
            earned: totalCompletions >= 100
        },
        {
            id: 'perfect-day',
            icon: '✨',
            title: 'Perfect Day',
            description: 'Complete all goals in one day',
            threshold: 1,
            current: perfectDays,
            earned: perfectDays >= 1
        },
        {
            id: 'dedicated',
            icon: '🏆',
            title: 'Dedicated',
            description: 'Active for 30 different days',
            threshold: 30,
            current: daysActive.size,
            earned: daysActive.size >= 30
        }
    ];

    const html = achievements.map(achievement => {
        const progress = Math.min(100, (achievement.current / achievement.threshold) * 100);
        return `
            <div class="achievement-badge ${achievement.earned ? 'earned' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                ${!achievement.earned ? `
                    <div class="achievement-progress">
                        <div class="achievement-progress-bar" style="width: ${progress}%"></div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function renderWeeklyOverview(data) {
    const container = document.getElementById('couple-weekly-chart');
    const weekRangeEl = document.getElementById('couple-week-range');

    if (!container || !weekRangeEl) return;

    // Get current week (Monday to Sunday)
    const today = getPSTDate();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days, else calculate offset to Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        days.push(date);
    }

    // Get couple tasks (only Daily frequency for weekly overview)
    const coupleTasks = getAllTasksWithType(data, 'couple').filter(task => task.frequency === 'Daily');
    const totalTasks = coupleTasks.length;

    const todayStr = formatDateToPST(today);

    // Calculate completions for each day
    const dailyStats = days.map(date => {
        const dateStr = formatDateToPST(date);
        const completed = coupleTasks.filter(task =>
            data.completions[dateStr]?.[task.id]?.completed
        ).length;
        const percentage = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
        const isToday = dateStr === todayStr;
        return { date, dateStr, completed, percentage, isToday };
    });

    // Render bars
    container.innerHTML = dailyStats.map(stat => {
        const dayName = stat.date.toLocaleDateString('en-US', { weekday: 'short' });
        const height = stat.percentage > 0 ? Math.max(stat.percentage, 3) : 3;
        const percentageLabel = Math.round(stat.percentage);

        return `
            <div class="weekly-bar-wrapper" title="${dayName}: ${stat.completed}/${totalTasks} goals">
                <div class="weekly-bar-percentage">${percentageLabel}%</div>
                <div class="weekly-bar ${stat.isToday ? 'active' : ''}" style="height: ${height}%"></div>
                <div class="weekly-bar-label">${dayName}</div>
            </div>
        `;
    }).join('');

    // Set week range
    const firstDay = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastDay = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weekRangeEl.textContent = `${firstDay} - ${lastDay}`;
}

function renderWeeklyOverviewPersonal(data) {
    const container = document.getElementById('personal-weekly-chart');
    const weekRangeEl = document.getElementById('personal-week-range');

    if (!container || !weekRangeEl) return;

    // Get current week (Monday to Sunday)
    const today = getPSTDate();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days, else calculate offset to Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        days.push(date);
    }

    // Get personal tasks (only Daily frequency for weekly overview)
    const personalTasks = getAllTasksWithType(data, 'personal').filter(task => task.frequency === 'Daily');
    const totalTasks = personalTasks.length;

    const todayStr = formatDateToPST(today);

    // Calculate completions for each day
    const dailyStats = days.map(date => {
        const dateStr = formatDateToPST(date);
        const completed = personalTasks.filter(task =>
            data.completions[dateStr]?.[task.id]?.completed
        ).length;
        const percentage = totalTasks > 0 ? (completed / totalTasks) * 100 : 0;
        const isToday = dateStr === todayStr;
        return { date, dateStr, completed, percentage, isToday };
    });

    // Render bars
    container.innerHTML = dailyStats.map(stat => {
        const dayName = stat.date.toLocaleDateString('en-US', { weekday: 'short' });
        const height = stat.percentage > 0 ? Math.max(stat.percentage, 3) : 3;
        const percentageLabel = Math.round(stat.percentage);

        return `
            <div class="weekly-bar-wrapper" title="${dayName}: ${stat.completed}/${totalTasks} goals">
                <div class="weekly-bar-percentage">${percentageLabel}%</div>
                <div class="weekly-bar ${stat.isToday ? 'active' : ''}" style="height: ${height}%"></div>
                <div class="weekly-bar-label">${dayName}</div>
            </div>
        `;
    }).join('');

    // Set week range
    const firstDay = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const lastDay = days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    weekRangeEl.textContent = `${firstDay} - ${lastDay}`;
}

function calculateStats(data, type) {
    const tasks = getAllTasksWithType(data, type);
    const taskIds = tasks.map(t => t.id);

    let totalCompletions = 0;
    const daysWithCompletions = new Set();
    let currentStreak = 0;
    let longestStreak = 0;

    // Count completions
    Object.entries(data.completions || {}).forEach(([date, dayCompletions]) => {
        const dayCount = Object.entries(dayCompletions).filter(([id, comp]) =>
            taskIds.includes(id) && comp.completed
        ).length;

        if (dayCount > 0) {
            totalCompletions += dayCount;
            daysWithCompletions.add(date);
        }
    });

    // Calculate streaks from stored data
    taskIds.forEach(taskId => {
        if (data.streaks && data.streaks[taskId]) {
            currentStreak = Math.max(currentStreak, data.streaks[taskId].current || 0);
            longestStreak = Math.max(longestStreak, data.streaks[taskId].longest || 0);
        }
    });

    return {
        totalCompletions,
        activeDays: daysWithCompletions.size,
        currentStreak,
        longestStreak
    };
}

// ===================================
// TIMEZONE HELPERS (PST/PDT)
// ===================================

// Get current date/time in PST/PDT timezone
function getPSTDate() {
    const now = new Date();
    // Convert to PST/PDT (America/Los_Angeles automatically handles DST)
    const pstString = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    return new Date(pstString);
}

// Format any date to YYYY-MM-DD in PST/PDT timezone
function formatDateToPST(date) {
    const year = date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric' });
    const month = date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', month: '2-digit' });
    const day = date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', day: '2-digit' });
    return `${year}-${month}-${day}`;
}

function getTodayString() {
    return formatDateToPST(new Date());
}

// Helper function to get all tasks with type property
function getAllTasksWithType(data, type) {
    return [
        ...data.predefinedTasks[type].map(t => ({...t, type})),
        ...data.customTasks.filter(t => t.type === type)
    ];
}

function showToast(message, type = 'info', duration = 3000) {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), duration);
}

// ===================================
// MODAL & CUSTOM GOALS
// ===================================

let editingGoalId = null;

function setupModal() {
    const modal = document.getElementById('goal-modal');
    const modalClose = document.querySelector('.modal-close');
    const goalForm = document.getElementById('goal-form');
    const addGoalButtons = document.querySelectorAll('.add-goal-button');
    const categorySelect = document.getElementById('goal-category');
    const newCategoryGroup = document.getElementById('new-category-group');

    // Open modal when clicking "Add Goal" buttons
    addGoalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const goalType = button.dataset.type;
            openModal(goalType);
        });
    });

    // Close modal
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Cancel button
    document.querySelector('.btn-cancel').addEventListener('click', closeModal);

    // Listen for category selection changes
    categorySelect.addEventListener('change', (e) => {
        if (e.target.value === '__new__') {
            newCategoryGroup.style.display = 'block';
            document.getElementById('new-category').required = true;
        } else {
            newCategoryGroup.style.display = 'none';
            document.getElementById('new-category').required = false;
            document.getElementById('new-category').value = '';
        }
    });

    // Form submission
    goalForm.addEventListener('submit', handleGoalFormSubmit);
}

function openModal(goalType = 'personal', editMode = false) {
    const modal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('modal-title');
    const goalTypeSelect = document.getElementById('goal-type');
    const goalForm = document.getElementById('goal-form');
    const predefinedGoalsSelect = document.getElementById('predefined-goals');
    const submitBtn = document.querySelector('.btn-submit');

    // Add class to modal based on goal type
    modal.classList.remove('modal-personal', 'modal-couple');
    modal.classList.add(`modal-${goalType}`);

    // Reset editing state if not in edit mode
    if (!editMode) {
        editingGoalId = null;
        goalForm.reset();
        goalTypeSelect.value = goalType;
    }

    // Update modal title and button
    modalTitle.textContent = editMode ?
        `Edit ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} Goal` :
        `Add ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} Goal`;
    submitBtn.textContent = editMode ? 'Update Goal' : 'Save Goal';

    // Disable goal type in edit mode
    goalTypeSelect.disabled = editMode;

    // Show/hide predefined goals dropdown (only for add mode)
    const predefinedGroup = predefinedGoalsSelect.parentElement;
    predefinedGroup.style.display = editMode ? 'none' : 'block';

    // Populate predefined goals dropdown
    if (!editMode) {
        populatePredefinedGoals(goalType);
    }

    // Populate categories dropdown
    populateCategories();

    // Listen for predefined goal selection
    predefinedGoalsSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            const selectedGoal = JSON.parse(e.target.value);
            document.getElementById('goal-name').value = selectedGoal.name;

            // Set category from predefined goal (will always exist in dropdown)
            document.getElementById('goal-category').value = selectedGoal.category;
            document.getElementById('goal-frequency').value = selectedGoal.frequency;
        } else {
            // Clear form when deselecting predefined goal
            document.getElementById('goal-name').value = '';
            document.getElementById('goal-category').value = '';
            document.getElementById('goal-frequency').value = 'Daily';
        }
    });

    // Listen for goal type changes to update predefined options
    goalTypeSelect.addEventListener('change', (e) => {
        if (!editMode) {
            populatePredefinedGoals(e.target.value);
            modalTitle.textContent = `Add ${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)} Goal`;
        }
    });

    // Show modal and focus first input
    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('goal-name').focus();
    }, 100);

    debugLog(`📝 Opening modal for ${goalType} goal (${editMode ? 'edit' : 'add'} mode)`);
}

function populatePredefinedGoals(goalType) {
    const predefinedGoalsSelect = document.getElementById('predefined-goals');
    predefinedGoalsSelect.innerHTML = '<option value="">-- Select a predefined goal --</option>';

    // Get available predefined tasks
    const availableTasks = PREDEFINED_TASKS[goalType] || [];

    availableTasks.forEach(task => {
        const option = document.createElement('option');
        option.value = JSON.stringify(task);
        option.textContent = task.name;
        predefinedGoalsSelect.appendChild(option);
    });
}

function populateCategories() {
    const categorySelect = document.getElementById('goal-category');
    const currentValue = categorySelect.value; // Save current selection

    // Clear existing options except the first one
    categorySelect.innerHTML = '<option value="">-- Select a category --</option>';

    // Collect all unique categories from all tasks
    const categories = new Set();

    // Add categories from predefined tasks
    Object.keys(PREDEFINED_TASKS).forEach(type => {
        PREDEFINED_TASKS[type].forEach(task => {
            if (task.category) {
                categories.add(task.category);
            }
        });
    });

    // Add categories from custom tasks
    if (currentData && currentData.customTasks) {
        currentData.customTasks.forEach(task => {
            if (task.category) {
                categories.add(task.category);
            }
        });
    }

    // Sort categories alphabetically and add to dropdown
    Array.from(categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Add "New Category..." option
    const newOption = document.createElement('option');
    newOption.value = '__new__';
    newOption.textContent = '+ New Category...';
    categorySelect.appendChild(newOption);

    // Restore previous selection if it exists
    if (currentValue && Array.from(categorySelect.options).some(opt => opt.value === currentValue)) {
        categorySelect.value = currentValue;
    }
}

function closeModal() {
    const modal = document.getElementById('goal-modal');
    modal.classList.add('hidden');
    editingGoalId = null;
}

function openEditModal(task) {
    editingGoalId = task.id;

    // Open modal first (this will populate categories)
    openModal(task.type, true);

    // Pre-fill form with task data after modal is opened
    document.getElementById('goal-type').value = task.type;
    document.getElementById('goal-name').value = task.name;
    document.getElementById('goal-category').value = task.category;
    document.getElementById('goal-frequency').value = task.frequency;
}

function confirmDeleteGoal(task) {
    // Use native confirm for simplicity
    const confirmed = confirm(`Delete "${task.name}"?\n\nThis will also delete all completion history for this goal.`);

    if (confirmed) {
        deleteGoal(task.id, task.name);
    }
}

async function deleteGoal(goalId, goalName) {
    debugLog(`🗑️ Deleting goal: ${goalId}`);

    // Remove from custom tasks
    currentData.customTasks = currentData.customTasks.filter(t => t.id !== goalId);

    // Remove from predefined tasks if not found in custom
    currentData.predefinedTasks.personal = currentData.predefinedTasks.personal.filter(t => t.id !== goalId);
    currentData.predefinedTasks.couple = currentData.predefinedTasks.couple.filter(t => t.id !== goalId);

    // Remove completion history for this goal
    Object.keys(currentData.completions || {}).forEach(date => {
        if (currentData.completions[date][goalId]) {
            delete currentData.completions[date][goalId];
        }
    });

    // Remove streak data
    if (currentData.streaks && currentData.streaks[goalId]) {
        delete currentData.streaks[goalId];
    }

    debugLog('✓ Goal deleted', { goalId });

    // Save to Firebase
    await saveGoalsData(currentData);

    // Re-render goals
    renderGoals(currentData);

    showToast(`${goalName} deleted`, 'success');
}

// ===================================
// FILTERS
// ===================================

function setupFilters() {
    setupPersonalModalFilters();
    setupPersonalFilterModal();
    setupPersonalWireframeAddGoal();
    setupCoupleModalFilters();
    setupCoupleFilterModal();
    setupWireframeAddGoal();
}

function setupPersonalModalFilters() {
    // Setup category filters in modal
    const categoryContainer = document.getElementById('personal-category-filters-modal');
    if (categoryContainer) {
        categoryContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                categoryContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                filters.personal.category = e.target.dataset.filter;
                renderGoals(currentData);
            }
        });
    }

    // Setup frequency filters in modal
    const frequencyContainer = document.getElementById('personal-frequency-filters-modal');
    if (frequencyContainer) {
        frequencyContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                frequencyContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                filters.personal.frequency = e.target.dataset.filter;
                renderGoals(currentData);
            }
        });
    }
}

function setupPersonalFilterModal() {
    const modal = document.getElementById('personal-filter-modal');
    const openBtn = document.getElementById('personal-filter-btn');
    const closeBtn = document.getElementById('personal-filter-close');
    const backdrop = modal?.querySelector('.filter-modal-backdrop');

    if (!modal || !openBtn) return;

    // Open modal
    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        // Initialize Lucide icons in modal
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    // Close modal
    const closeModal = () => {
        modal.classList.add('hidden');
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function setupPersonalWireframeAddGoal() {
    const addGoalBtn = document.getElementById('personal-add-goal-wireframe');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            openModal('personal');
        });
    }
}

function setupCoupleModalFilters() {
    // Setup category filters in modal
    const categoryContainer = document.getElementById('couple-category-filters-modal');
    if (categoryContainer) {
        categoryContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                categoryContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                filters.couple.category = e.target.dataset.filter;
                renderGoals(currentData);
            }
        });
    }

    // Setup frequency filters in modal
    const frequencyContainer = document.getElementById('couple-frequency-filters-modal');
    if (frequencyContainer) {
        frequencyContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                frequencyContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                filters.couple.frequency = e.target.dataset.filter;
                renderGoals(currentData);
            }
        });
    }
}

function setupCoupleFilterModal() {
    const modal = document.getElementById('couple-filter-modal');
    const openBtn = document.getElementById('couple-filter-btn');
    const closeBtn = document.getElementById('couple-filter-close');
    const backdrop = modal?.querySelector('.filter-modal-backdrop');

    if (!modal || !openBtn) return;

    // Open modal
    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        // Initialize Lucide icons in modal
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });

    // Close modal
    const closeModal = () => {
        modal.classList.add('hidden');
    };

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeModal);
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

function setupWireframeAddGoal() {
    const addGoalBtn = document.getElementById('couple-add-goal-wireframe');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            openModal('couple');
        });
    }
}

function setupFilterButtons(type) {
    const categoryContainer = document.getElementById(`${type}-category-filters`);
    const frequencyContainer = document.getElementById(`${type}-frequency-filters`);

    if (categoryContainer) {
        categoryContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                // Update active state
                categoryContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');

                // Update filter state
                filters[type].category = e.target.dataset.filter;

                // Re-render goals
                renderGoals(currentData);
            }
        });
    }

    if (frequencyContainer) {
        frequencyContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                // Update active state
                frequencyContainer.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');

                // Update filter state
                filters[type].frequency = e.target.dataset.filter;

                // Re-render goals
                renderGoals(currentData);
            }
        });
    }
}

function updateCategoryFilters(type, tasks) {
    const container = document.getElementById(`${type}-category-filters`);
    if (!container) return;

    // Get unique categories
    const categories = new Set();
    tasks.forEach(task => {
        if (task.category) {
            categories.add(task.category);
        }
    });

    // Sort categories alphabetically
    const sortedCategories = Array.from(categories).sort();

    // Build filter buttons HTML
    let html = '<button class="filter-btn active" data-filter="all">All</button>';
    sortedCategories.forEach(category => {
        const isActive = filters[type].category === category ? 'active' : '';
        html += `<button class="filter-btn ${isActive}" data-filter="${category}">${category}</button>`;
    });

    container.innerHTML = html;

    // Restore active state
    if (filters[type].category !== 'all') {
        const activeBtn = container.querySelector(`[data-filter="${filters[type].category}"]`);
        if (activeBtn) {
            container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            activeBtn.classList.add('active');
        } else {
            // Category no longer exists, reset to all
            filters[type].category = 'all';
            container.querySelector('[data-filter="all"]').classList.add('active');
        }
    }
}

function updateCategoryFiltersModal(type, tasks) {
    const container = document.getElementById(`${type}-category-filters-modal`);
    if (!container) return;

    // Get unique categories
    const categories = new Set();
    tasks.forEach(task => {
        if (task.category) {
            categories.add(task.category);
        }
    });

    // Sort categories alphabetically
    const sortedCategories = Array.from(categories).sort();

    // Build filter buttons HTML
    let html = '<button class="filter-btn active" data-filter="all">All</button>';
    sortedCategories.forEach(category => {
        const isActive = filters[type].category === category ? 'active' : '';
        html += `<button class="filter-btn ${isActive}" data-filter="${category}">${category}</button>`;
    });

    container.innerHTML = html;

    // Restore active state
    if (filters[type].category !== 'all') {
        const activeBtn = container.querySelector(`[data-filter="${filters[type].category}"]`);
        if (activeBtn) {
            container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            activeBtn.classList.add('active');
        } else {
            // Category no longer exists, reset to all
            filters[type].category = 'all';
            container.querySelector('[data-filter="all"]').classList.add('active');
        }
    }
}

function applyFilters(tasks, filterState) {
    let filtered = tasks;

    // Apply category filter
    if (filterState.category !== 'all') {
        filtered = filtered.filter(task => task.category === filterState.category);
    }

    // Apply frequency filter
    if (filterState.frequency !== 'all') {
        filtered = filtered.filter(task => task.frequency === filterState.frequency);
    }

    return filtered;
}

// ===================================
// MOBILE FEATURES
// ===================================

function setupMobileFeatures() {
    setupPullToRefresh();
}

function setupPullToRefresh() {
    let startY = 0;
    let pulling = false;
    const threshold = 80;

    const tabContent = document.querySelector('.tab-content');

    tabContent.addEventListener('touchstart', (e) => {
        // Only allow pull-to-refresh when scrolled to the top
        if (tabContent.scrollTop === 0) {
            startY = e.touches[0].pageY;
            pulling = true;
        }
    }, { passive: true });

    tabContent.addEventListener('touchmove', (e) => {
        if (!pulling) return;

        const currentY = e.touches[0].pageY;
        const distance = currentY - startY;

        // Visual feedback could be added here if needed
    }, { passive: true });

    tabContent.addEventListener('touchend', async (e) => {
        if (!pulling) return;

        const endY = e.changedTouches[0].pageY;
        const distance = endY - startY;

        if (distance > threshold) {
            debugLog('🔄 Pull-to-refresh triggered - hard refresh');
            handleHardRefresh();
        }

        pulling = false;
        startY = 0;
    }, { passive: true });
}

async function handleGoalFormSubmit(e) {
    e.preventDefault();

    // Blur active input to dismiss mobile keyboard
    if (document.activeElement) {
        document.activeElement.blur();
    }

    const goalType = document.getElementById('goal-type').value;
    const goalName = document.getElementById('goal-name').value.trim();
    let goalCategory = document.getElementById('goal-category').value.trim();
    const goalFrequency = document.getElementById('goal-frequency').value;

    // Check if user selected "New Category" option
    if (goalCategory === '__new__') {
        const newCategory = document.getElementById('new-category').value.trim();
        if (!newCategory) {
            showToast('Please enter a new category name', 'error');
            return;
        }
        goalCategory = newCategory;
    }

    if (!goalName || !goalCategory) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (editingGoalId) {
        // EDIT MODE
        // Check if it's a custom task
        const customTaskIndex = currentData.customTasks.findIndex(t => t.id === editingGoalId);

        // Check if it's a predefined task
        let predefinedTaskIndex = -1;
        let predefinedType = null;
        if (customTaskIndex === -1) {
            predefinedTaskIndex = currentData.predefinedTasks.personal.findIndex(t => t.id === editingGoalId);
            if (predefinedTaskIndex !== -1) {
                predefinedType = 'personal';
            } else {
                predefinedTaskIndex = currentData.predefinedTasks.couple.findIndex(t => t.id === editingGoalId);
                if (predefinedTaskIndex !== -1) {
                    predefinedType = 'couple';
                }
            }
        }

        if (customTaskIndex === -1 && predefinedTaskIndex === -1) {
            showToast('Goal not found', 'error');
            return;
        }

        // Check for duplicate names (excluding current goal)
        const allTasks = [
            ...currentData.predefinedTasks.personal,
            ...currentData.predefinedTasks.couple,
            ...currentData.customTasks
        ];
        const isDuplicate = allTasks.some(task =>
            task.id !== editingGoalId &&
            task.name.toLowerCase() === goalName.toLowerCase() &&
            task.type === goalType
        );

        if (isDuplicate) {
            showToast('Goal with this name already exists', 'error');
            return;
        }

        if (customTaskIndex !== -1) {
            // Update custom goal
            currentData.customTasks[customTaskIndex] = {
                ...currentData.customTasks[customTaskIndex],
                name: goalName,
                category: goalCategory,
                frequency: goalFrequency,
                type: goalType
            };
            debugLog('✓ Updating custom goal', currentData.customTasks[customTaskIndex]);
        } else {
            // Update predefined goal
            currentData.predefinedTasks[predefinedType][predefinedTaskIndex] = {
                ...currentData.predefinedTasks[predefinedType][predefinedTaskIndex],
                name: goalName,
                category: goalCategory,
                frequency: goalFrequency,
                type: goalType
            };
            debugLog('✓ Updating predefined goal', currentData.predefinedTasks[predefinedType][predefinedTaskIndex]);
        }

        await saveGoalsData(currentData);
        renderGoals(currentData);
        closeModal();
        showToast(`${goalName} updated! ✓`, 'success');

    } else {
        // ADD MODE
        // Check for duplicate names
        const allTasks = [
            ...currentData.predefinedTasks.personal,
            ...currentData.predefinedTasks.couple,
            ...(currentData.customTasks || [])
        ];

        const isDuplicate = allTasks.some(task =>
            task.name.toLowerCase() === goalName.toLowerCase() && task.type === goalType
        );

        if (isDuplicate) {
            showToast('Goal with this name already exists', 'error');
            return;
        }

        // Generate unique ID
        const goalId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const newGoal = {
            id: goalId,
            name: goalName,
            category: goalCategory,
            frequency: goalFrequency,
            type: goalType
        };

        // Add to custom tasks
        if (!currentData.customTasks) {
            currentData.customTasks = [];
        }
        currentData.customTasks.push(newGoal);

        debugLog('✓ Creating custom goal', newGoal);

        await saveGoalsData(currentData);
        renderGoals(currentData);
        closeModal();
        showToast(`${goalName} added! ✓`, 'success');
    }
}
