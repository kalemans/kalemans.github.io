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

    // Permanently hide auth screen (no login needed with Firebase)
    authScreen.remove();
    showMainApp();
    await loadApp();

    // Set up event listeners
    setupTabs();
    setupModal();
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

    // Show syncing indicator
    const syncIcon = syncButton.querySelector('.sync-icon');
    syncButton.classList.add('syncing');

    try {
        const docRef = db.collection('goals').doc('main');

        await docRef.set(data);

        debugLog('✓ Data saved to Firebase');

        // Also cache locally
        localStorage.setItem('goals_cache', JSON.stringify(data));

        syncButton.classList.remove('syncing');
        return true;
    } catch (error) {
        debugLog('✗ Firebase save error', { error: error.message });
        showToast('Error saving data', 'error');
        syncButton.classList.remove('syncing');
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
    const nowCompleted = !isCurrentlyCompleted;

    data.completions[today][taskId] = {
        completed: nowCompleted,
        timestamp: new Date().toISOString()
    };

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
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FBBF24', '#FF8C00', '#D2691E', '#8B4513']
            });
        }
    } else {
        // Reset streak
        data.streaks[taskId].current = 0;
    }

    currentData = data;
    renderGoals(currentData);

    await saveGoalsData(currentData);
}

function renderStats(data) {
    renderPersonalStats(data);
    renderCoupleStats(data);
    renderOverallStats(data);
}

function renderPersonalStats(data) {
    const container = document.getElementById('personal-stats');
    const stats = calculateStats(data, 'personal');

    const today = getTodayString();
    const personalTasks = [...data.predefinedTasks.personal, ...data.customTasks.filter(t => t.type === 'personal')];
    const completedToday = personalTasks.filter(t => data.completions[today]?.[t.id]?.completed).length;
    const completionPercentage = personalTasks.length > 0 ? Math.round((completedToday / personalTasks.length) * 100) : 0;

    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Today's Progress</span>
            <span class="stat-value">${completedToday}/${personalTasks.length}</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${completionPercentage}%"></div>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Completions</span>
            <span class="stat-value">${stats.totalCompletions}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Active Days</span>
            <span class="stat-value">${stats.activeDays}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Current Streak</span>
            <span class="stat-value">${stats.currentStreak} days 🔥</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Longest Streak</span>
            <span class="stat-value">${stats.longestStreak} days ⭐</span>
        </div>
    `;
}

function renderCoupleStats(data) {
    const container = document.getElementById('couple-stats');
    const stats = calculateStats(data, 'couple');

    const today = getTodayString();
    const coupleTasks = [...data.predefinedTasks.couple, ...data.customTasks.filter(t => t.type === 'couple')];
    const completedToday = coupleTasks.filter(t => data.completions[today]?.[t.id]?.completed).length;
    const completionPercentage = coupleTasks.length > 0 ? Math.round((completedToday / coupleTasks.length) * 100) : 0;

    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Today's Progress</span>
            <span class="stat-value">${completedToday}/${coupleTasks.length}</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${completionPercentage}%"></div>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Completions</span>
            <span class="stat-value">${stats.totalCompletions}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Active Days</span>
            <span class="stat-value">${stats.activeDays}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Current Streak</span>
            <span class="stat-value">${stats.currentStreak} days 🔥</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Longest Streak</span>
            <span class="stat-value">${stats.longestStreak} days ⭐</span>
        </div>
    `;
}

function renderOverallStats(data) {
    const container = document.getElementById('overall-stats');
    const personalStats = calculateStats(data, 'personal');
    const coupleStats = calculateStats(data, 'couple');
    const totalCompletions = personalStats.totalCompletions + coupleStats.totalCompletions;
    const totalDays = Math.max(personalStats.activeDays, coupleStats.activeDays);

    const today = getTodayString();
    const allTasks = [
        ...data.predefinedTasks.personal,
        ...data.predefinedTasks.couple,
        ...data.customTasks
    ];
    const completedToday = allTasks.filter(t => data.completions[today]?.[t.id]?.completed).length;
    const completionPercentage = allTasks.length > 0 ? Math.round((completedToday / allTasks.length) * 100) : 0;

    container.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Today's Overall Progress</span>
            <span class="stat-value">${completedToday}/${allTasks.length}</span>
        </div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${completionPercentage}%"></div>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Completions</span>
            <span class="stat-value">${totalCompletions}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Days Active</span>
            <span class="stat-value">${totalDays}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Average Per Day</span>
            <span class="stat-value">${totalDays > 0 ? Math.round(totalCompletions / totalDays) : 0}</span>
        </div>
    `;
}

function calculateStats(data, type) {
    const tasks = [...data.predefinedTasks[type], ...data.customTasks.filter(t => t.type === type)];
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

// ===================================
// MODAL & CUSTOM GOALS
// ===================================

function setupModal() {
    const modal = document.getElementById('goal-modal');
    const modalClose = document.querySelector('.modal-close');
    const goalForm = document.getElementById('goal-form');
    const addGoalButtons = document.querySelectorAll('.add-goal-button');

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

    // Form submission
    goalForm.addEventListener('submit', handleGoalFormSubmit);
}

function openModal(goalType = 'personal') {
    const modal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('modal-title');
    const goalTypeSelect = document.getElementById('goal-type');
    const goalForm = document.getElementById('goal-form');
    const predefinedGoalsSelect = document.getElementById('predefined-goals');

    // Reset form
    goalForm.reset();
    goalTypeSelect.value = goalType;

    // Update modal title
    modalTitle.textContent = `Add ${goalType.charAt(0).toUpperCase() + goalType.slice(1)} Goal`;

    // Populate predefined goals dropdown
    populatePredefinedGoals(goalType);

    // Listen for predefined goal selection
    predefinedGoalsSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            const selectedGoal = JSON.parse(e.target.value);
            document.getElementById('goal-name').value = selectedGoal.name;
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
        populatePredefinedGoals(e.target.value);
        modalTitle.textContent = `Add ${e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1)} Goal`;
    });

    // Show modal and focus first input
    modal.classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('goal-name').focus();
    }, 100);

    debugLog(`📝 Opening modal for ${goalType} goal`);
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

function closeModal() {
    const modal = document.getElementById('goal-modal');
    modal.classList.add('hidden');
}

async function handleGoalFormSubmit(e) {
    e.preventDefault();

    const goalType = document.getElementById('goal-type').value;
    const goalName = document.getElementById('goal-name').value.trim();
    const goalCategory = document.getElementById('goal-category').value.trim();
    const goalFrequency = document.getElementById('goal-frequency').value;

    if (!goalName || !goalCategory) {
        showToast('Please fill in all fields', 'error');
        return;
    }

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

    // Save to Firebase
    await saveGoalsData(currentData);

    // Re-render goals
    renderGoals(currentData);

    // Close modal and show success
    closeModal();
    showToast(`${goalName} added! ✓`, 'success');
}
