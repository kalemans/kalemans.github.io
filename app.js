import { PREDEFINED_TASKS } from './config.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Version
const APP_VERSION = '4.0.0';

// State Management
let currentData = null;
let db = null;

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const mainApp = document.getElementById('main-app');
const loadingScreen = document.getElementById('loading-screen');
const tokenInput = document.getElementById('github-token');
const authButton = document.getElementById('auth-button');
const syncButton = document.getElementById('sync-button');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Debug panel elements
let debugPanel = null;
let debugContent = null;
let debugToggle = null;

// Debug logging function
function debugLog(message, data = null) {
    console.log(message, data || '');

    if (!debugContent) {
        setTimeout(() => debugLog(message, data), 100);
        return;
    }

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'debug-entry';

    let logText = `<span class="debug-timestamp">${timestamp}</span>${message}`;
    if (data) {
        logText += `<br><pre style="margin: 0.25rem 0 0 0; font-size: 0.7rem; white-space: pre-wrap;">${JSON.stringify(data, null, 2)}</pre>`;
    }

    entry.innerHTML = logText;
    debugContent.appendChild(entry);
    debugContent.scrollTop = debugContent.scrollHeight;

    while (debugContent.children.length > 100) {
        debugContent.removeChild(debugContent.firstChild);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);

async function init() {
    loadingScreen.classList.add('hidden');

    // Initialize debug panel
    debugPanel = document.getElementById('debug-panel');
    debugContent = document.getElementById('debug-content');
    debugToggle = document.getElementById('debug-toggle');

    document.getElementById('debug-close').addEventListener('click', () => {
        debugPanel.classList.add('hidden');
    });

    debugToggle.addEventListener('click', () => {
        debugPanel.classList.toggle('hidden');
    });

    document.getElementById('debug-clear').addEventListener('click', () => {
        debugContent.innerHTML = '';
    });

    debugLog(`🚀 App v${APP_VERSION} started with Firebase`);

    // Initialize Firebase
    if (!isFirebaseConfigured()) {
        debugLog('⚠️ Firebase not configured yet! Edit firebase-config.js');
        authScreen.querySelector('.auth-container h1').textContent = 'Firebase Setup Required';
        authScreen.querySelector('.auth-subtitle').textContent = 'Please configure Firebase in firebase-config.js';
        authScreen.querySelector('.auth-form').style.display = 'none';
        authScreen.querySelector('.auth-help').style.display = 'none';
        showAuthScreen();
        return;
    }

    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        debugLog('✓ Firebase initialized', { projectId: firebaseConfig.projectId });
    } catch (error) {
        debugLog('✗ Firebase initialization failed', { error: error.message });
        showToast('Firebase error - check console', 'error');
        showAuthScreen();
        return;
    }

    // Hide auth screen (no login needed with Firebase)
    authScreen.style.display = 'none';
    showMainApp();
    await loadApp();

    // Set up event listeners
    setupTabs();
    syncButton.addEventListener('click', handleManualSync);
}

function showAuthScreen() {
    authScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

function showMainApp() {
    authScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
}

async function loadApp() {
    try {
        const data = await loadGoalsData();
        currentData = data;
        renderGoals(currentData);
        debugLog('✓ App loaded successfully');
    } catch (error) {
        debugLog('✗ Error loading app', { error: error.message });
        showToast('Error loading data', 'error');
        const cached = localStorage.getItem('goals_cache');
        currentData = cached ? JSON.parse(cached) : getDefaultData();
        renderGoals(currentData);
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
        showToast('Saved! ✓', 'success');
        return true;
    } catch (error) {
        debugLog('✗ Firebase save error', { error: error.message });
        showToast('Error saving data', 'error');
        return false;
    }
}

async function handleManualSync() {
    debugLog('🔄 Manual sync triggered');
    try {
        const data = await loadGoalsData();
        currentData = data;
        renderGoals(currentData);
        showToast('Synced! ✓', 'success');
    } catch (error) {
        debugLog('✗ Sync error', { error: error.message });
        showToast('Sync failed', 'error');
    }
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
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
}

function renderGoals(data) {
    renderPersonalGoals(data);
    renderCoupleGoals(data);
    renderStats(data);
}

function renderPersonalGoals(data) {
    const container = document.getElementById('personal-goals');
    container.innerHTML = '';

    const today = getTodayString();
    const tasks = [...data.predefinedTasks.personal, ...data.customTasks.filter(t => t.type === 'personal')];

    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No personal goals yet</p></div>';
        return;
    }

    tasks.forEach(task => {
        const completed = data.completions[today]?.[task.id]?.completed || false;
        const card = createGoalCard(task, completed, data);
        container.appendChild(card);
    });
}

function renderCoupleGoals(data) {
    const container = document.getElementById('couple-goals');
    container.innerHTML = '';

    const today = getTodayString();
    const tasks = [...data.predefinedTasks.couple, ...data.customTasks.filter(t => t.type === 'couple')];

    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No couple goals yet</p></div>';
        return;
    }

    tasks.forEach(task => {
        const completed = data.completions[today]?.[task.id]?.completed || false;
        const card = createGoalCard(task, completed, data);
        container.appendChild(card);
    });
}

function createGoalCard(task, completed, data) {
    const card = document.createElement('div');
    card.className = `goal-card ${completed ? 'completed' : ''}`;

    card.innerHTML = `
        <div class="goal-header">
            <div class="goal-info">
                <div class="goal-name">${task.name}</div>
                <div class="goal-meta">
                    <span class="goal-category">${task.category}</span>
                    <span class="goal-frequency">${task.frequency}</span>
                </div>
            </div>
            <div class="goal-actions">
                <button class="goal-action-btn star" data-id="${task.id}">
                    ${completed ? '★' : '☆'}
                </button>
            </div>
        </div>
    `;

    const starBtn = card.querySelector('.star');
    starBtn.addEventListener('click', () => toggleGoalCompletion(task.id, data));

    return card;
}

async function toggleGoalCompletion(taskId, data) {
    const today = getTodayString();

    if (!data.completions[today]) {
        data.completions[today] = {};
    }

    const isCurrentlyCompleted = data.completions[today][taskId]?.completed || false;
    data.completions[today][taskId] = {
        completed: !isCurrentlyCompleted,
        timestamp: new Date().toISOString()
    };

    currentData = data;
    renderGoals(currentData);

    await saveGoalsData(currentData);
}

function renderStats(data) {
    // Basic stats rendering
    document.getElementById('personal-stats').innerHTML = '<p>Stats coming soon</p>';
    document.getElementById('couple-stats').innerHTML = '<p>Stats coming soon</p>';
    document.getElementById('overall-stats').innerHTML = '<p>Stats coming soon</p>';
}

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}
