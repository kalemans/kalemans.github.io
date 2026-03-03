import { PREDEFINED_TASKS } from './config.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Version
const APP_VERSION = '4.0.0';

// State Management
let currentData = null;
let db = null;

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
    setupMobileFeatures();
    setupFilters();
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

        // Show swipe hint on mobile
        showSwipeHint();
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
    syncButton.disabled = true;

    try {
        const docRef = db.collection('goals').doc('main');

        await docRef.set(data);

        debugLog('✓ Data saved to Firebase');

        // Also cache locally
        localStorage.setItem('goals_cache', JSON.stringify(data));

        // Brief success indicator
        syncButton.classList.remove('syncing');
        syncButton.classList.add('sync-success');
        setTimeout(() => {
            syncButton.classList.remove('sync-success');
        }, 600);

        syncButton.disabled = false;
        return true;
    } catch (error) {
        debugLog('✗ Firebase save error', { error: error.message });
        showToast('Error saving data', 'error');
        syncButton.classList.remove('syncing');
        syncButton.disabled = false;
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
    const tabContent = document.querySelector('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(`${tab}-tab`).classList.add('active');

            // Smooth scroll to top when switching tabs
            if (tabContent) {
                tabContent.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function renderGoals(data) {
    renderPersonalGoals(data);
    renderCoupleGoals(data);
    renderStats(data);
    updateDailyProgress(data);
}

function updateDailyProgress(data) {
    const today = getTodayString();
    const allTasks = [
        ...data.predefinedTasks.personal,
        ...data.predefinedTasks.couple,
        ...data.customTasks
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

    const today = getTodayString();
    let tasks = [...data.predefinedTasks.personal, ...data.customTasks.filter(t => t.type === 'personal')];

    // Update category filters
    updateCategoryFilters('personal', tasks);

    // Apply filters
    tasks = applyFilters(tasks, filters.personal);

    if (tasks.length === 0) {
        const allTasks = [...data.predefinedTasks.personal, ...data.customTasks.filter(t => t.type === 'personal')];
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
        const completed = data.completions[today]?.[task.id]?.completed || false;
        const card = createGoalCard(task, completed, data);
        card.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(card);
    });
}

function renderCoupleGoals(data) {
    const container = document.getElementById('couple-goals');
    container.innerHTML = '';

    const today = getTodayString();
    let tasks = [...data.predefinedTasks.couple, ...data.customTasks.filter(t => t.type === 'couple')];

    // Update category filters
    updateCategoryFilters('couple', tasks);

    // Apply filters
    tasks = applyFilters(tasks, filters.couple);

    if (tasks.length === 0) {
        const allTasks = [...data.predefinedTasks.couple, ...data.customTasks.filter(t => t.type === 'couple')];
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
        const completed = data.completions[today]?.[task.id]?.completed || false;
        const card = createGoalCard(task, completed, data);
        card.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(card);
    });
}

function createGoalCard(task, completed, data) {
    const card = document.createElement('div');
    card.className = `goal-card ${completed ? 'completed' : ''}`;

    const isCustom = task.id.startsWith('custom-');

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
                ${isCustom ? `
                    <button class="goal-action-btn edit" data-id="${task.id}" title="Edit goal">
                        ✎
                    </button>
                    <button class="goal-action-btn delete" data-id="${task.id}" title="Delete goal">
                        ×
                    </button>
                ` : ''}
                <button class="goal-action-btn star ${completed ? 'completed' : ''}" data-id="${task.id}" title="Complete goal">
                    ${completed ? '★' : '☆'}
                </button>
            </div>
        </div>
    `;

    const starBtn = card.querySelector('.star');
    starBtn.addEventListener('click', () => toggleGoalCompletion(task.id, data));

    if (isCustom) {
        const editBtn = card.querySelector('.edit');
        const deleteBtn = card.querySelector('.delete');

        editBtn.addEventListener('click', () => openEditModal(task));
        deleteBtn.addEventListener('click', () => confirmDeleteGoal(task));
    }

    // Add swipe gestures to card
    addSwipeToCard(card, task, isCustom);

    return card;
}

function addSwipeToCard(card, task, isCustom) {
    let startX = 0;
    let startY = 0;
    let isSwiping = false;
    let swipeDirection = null;

    card.addEventListener('touchstart', (e) => {
        // Don't interfere with button clicks
        if (e.target.closest('.goal-action-btn')) {
            return;
        }

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = false;
        swipeDirection = null;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
        if (!startX || e.target.closest('.goal-action-btn')) {
            return;
        }

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        // Determine if this is a horizontal swipe
        if (!isSwiping && Math.abs(diffX) > 10) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                isSwiping = true;
                swipeDirection = diffX > 0 ? 'right' : 'left';
            }
        }

        if (isSwiping) {
            // Visual feedback
            const opacity = Math.min(Math.abs(diffX) / 150, 0.3);
            if (swipeDirection === 'right') {
                card.style.backgroundColor = `rgba(70, 130, 180, ${opacity})`;
            } else if (swipeDirection === 'left' && isCustom) {
                card.style.backgroundColor = `rgba(255, 99, 71, ${opacity})`;
            }
        }
    }, { passive: true });

    card.addEventListener('touchend', (e) => {
        if (!startX) {
            return;
        }

        const endX = e.changedTouches[0].clientX;
        const diffX = endX - startX;

        // Trigger action if swiped far enough
        if (isSwiping) {
            if (diffX > 80 && swipeDirection === 'right') {
                // Swipe right to complete
                toggleGoalCompletion(task.id, currentData);
            } else if (diffX < -80 && swipeDirection === 'left' && isCustom) {
                // Swipe left to delete (custom goals only)
                confirmDeleteGoal(task);
            } else if (diffX < -80 && swipeDirection === 'left' && !isCustom) {
                showToast('Can only delete custom goals', 'info', 2000);
            }
        }

        // Reset visual feedback
        setTimeout(() => {
            card.style.backgroundColor = '';
        }, 100);

        // Reset
        startX = 0;
        startY = 0;
        isSwiping = false;
        swipeDirection = null;
    }, { passive: true });
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

        // Check if all goals are completed
        checkAllGoalsCompleted(data, today);
    } else {
        // Reset streak
        data.streaks[taskId].current = 0;
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
        // Epic celebration!
        setTimeout(() => {
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.5 },
                    colors: ['#FBBF24', '#FF8C00', '#D2691E', '#8B4513', '#4682B4'],
                    startVelocity: 45,
                    gravity: 0.8
                });
            }
            showToast('🎉 All goals completed! Amazing work!', 'success', 4000);
        }, 300);
    }
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

function openModal(goalType = 'personal', editMode = false) {
    const modal = document.getElementById('goal-modal');
    const modalTitle = document.getElementById('modal-title');
    const goalTypeSelect = document.getElementById('goal-type');
    const goalForm = document.getElementById('goal-form');
    const predefinedGoalsSelect = document.getElementById('predefined-goals');
    const submitBtn = document.querySelector('.btn-submit');

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

function closeModal() {
    const modal = document.getElementById('goal-modal');
    modal.classList.add('hidden');
    editingGoalId = null;
}

function openEditModal(task) {
    editingGoalId = task.id;

    // Pre-fill form with task data
    document.getElementById('goal-type').value = task.type;
    document.getElementById('goal-name').value = task.name;
    document.getElementById('goal-category').value = task.category;
    document.getElementById('goal-frequency').value = task.frequency;

    openModal(task.type, true);
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
    setupFilterButtons('personal');
    setupFilterButtons('couple');
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
    const threshold = 60;

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

        if (distance > 0 && distance < threshold * 2.5) {
            const progress = Math.min(distance / threshold, 1);
            syncButton.style.transform = `rotate(${progress * 360}deg)`;
        }
    }, { passive: true });

    tabContent.addEventListener('touchend', async (e) => {
        if (!pulling) return;

        const endY = e.changedTouches[0].pageY;
        const distance = endY - startY;

        syncButton.style.transform = '';

        if (distance > threshold) {
            debugLog('🔄 Pull-to-refresh triggered');
            await handleManualSync();
        }

        pulling = false;
        startY = 0;
    }, { passive: true });
}

function showSwipeHint() {
    // Show hint only once per session
    if (sessionStorage.getItem('swipe-hint-shown')) return;

    // Only show on mobile
    if (window.innerWidth > 768) return;

    setTimeout(() => {
        showToast('💡 Swipe right to complete, left to delete custom goals', 'info', 6000);
        sessionStorage.setItem('swipe-hint-shown', 'true');
    }, 3000);
}

async function handleGoalFormSubmit(e) {
    e.preventDefault();

    // Blur active input to dismiss mobile keyboard
    if (document.activeElement) {
        document.activeElement.blur();
    }

    const goalType = document.getElementById('goal-type').value;
    const goalName = document.getElementById('goal-name').value.trim();
    const goalCategory = document.getElementById('goal-category').value.trim();
    const goalFrequency = document.getElementById('goal-frequency').value;

    if (!goalName || !goalCategory) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    if (editingGoalId) {
        // EDIT MODE
        const customTaskIndex = currentData.customTasks.findIndex(t => t.id === editingGoalId);

        if (customTaskIndex === -1) {
            showToast('Goal not found', 'error');
            return;
        }

        // Check for duplicate names (excluding current goal)
        const isDuplicate = currentData.customTasks.some(task =>
            task.id !== editingGoalId &&
            task.name.toLowerCase() === goalName.toLowerCase() &&
            task.type === goalType
        );

        if (isDuplicate) {
            showToast('Goal with this name already exists', 'error');
            return;
        }

        // Update the goal
        currentData.customTasks[customTaskIndex] = {
            ...currentData.customTasks[customTaskIndex],
            name: goalName,
            category: goalCategory,
            frequency: goalFrequency,
            type: goalType
        };

        debugLog('✓ Updating custom goal', currentData.customTasks[customTaskIndex]);

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
