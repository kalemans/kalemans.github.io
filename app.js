import { PREDEFINED_TASKS } from './config.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

// Version
const APP_VERSION = '4.2.2';

console.log('🚀 APP.JS LOADED - VERSION 4.2.2 - CRITICAL FIXES');

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
const refreshButton = document.getElementById('refresh-button');
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
    updateDashboardDate();
    setupModal();
    setupMobileFeatures();
    setupFilters();
    refreshButton.addEventListener('click', handleHardRefresh);
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
        });
    });

    // Set initial background based on active tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        updateBodyBackground(activeTab.dataset.tab);
    }
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
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const formattedDate = today.toLocaleDateString('en-US', options);

    const personalDateEl = document.getElementById('personal-dashboard-date');
    const coupleDateEl = document.getElementById('couple-dashboard-date');

    if (personalDateEl) personalDateEl.textContent = formattedDate;
    if (coupleDateEl) coupleDateEl.textContent = formattedDate;
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

    const today = getTodayString();
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
        const completed = data.completions[today]?.[task.id]?.completed || false;
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

    const today = getTodayString();
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
        const completed = data.completions[today]?.[task.id]?.completed || false;
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
                              stroke="var(--wireframe-border)"
                              stroke-width="1"/>
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
    starBtn.addEventListener('click', () => toggleGoalCompletion(task.id, data));

    // Add action button listeners
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
            // Get the task to determine colors
            const allTasks = [
                ...currentData.predefinedTasks.personal,
                ...currentData.predefinedTasks.couple,
                ...currentData.customTasks
            ];
            const task = allTasks.find(t => t.id === taskId);

            let colors;
            if (task && task.type === 'personal') {
                colors = ['#ffb343', '#42eaff', '#4272ff', '#ff7e42'];
            } else if (task && task.type === 'couple') {
                colors = ['#cd1c18', '#ffa896', '#9b1313', '#ff6b6b'];
            } else {
                colors = ['#FBBF24', '#FF8C00', '#D2691E', '#8B4513'];
            }

            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: colors
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
        // Epic celebration with both color palettes!
        setTimeout(() => {
            if (typeof confetti !== 'undefined') {
                confetti({
                    particleCount: 200,
                    spread: 120,
                    origin: { y: 0.5 },
                    colors: ['#ffb343', '#42eaff', '#4272ff', '#ff7e42', '#cd1c18', '#ffa896', '#9b1313'],
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
    renderDayOfWeekChart(data);
    renderCategoryChart(data);
    renderComparisonChart(data);
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
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + mondayOffset + i);
        weekDays.push(date.toISOString().split('T')[0]);
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
// 30-DAY TREND CHART
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

    // Get last 30 days
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
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

    // Format labels (show every 5 days)
    const labels = dates.map((date, i) => {
        const d = new Date(date);
        return i % 5 === 0 ? `${d.getMonth() + 1}/${d.getDate()}` : '';
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
                    fill: true
                },
                {
                    label: 'Weekly Goals',
                    data: weeklyData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-weekly').trim(),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-weekly-bg').trim(),
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Anytime Goals',
                    data: anytimeData,
                    borderColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-anytime').trim(),
                    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--chart-anytime-bg').trim(),
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// ===================================
// BEST DAY OF WEEK CHART
// ===================================

let dayChartInstance = null;

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

    // Generate colors for categories
    const colors = labels.map((_, i) => {
        const hue = (i * 137.5) % 360; // Golden angle for even distribution
        return `hsl(${hue}, 60%, 55%)`;
    });

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

    // Get last 12 weeks (84 days)
    const dates = [];
    for (let i = 83; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }

    const allTasks = [
        ...getAllTasksWithType(data, 'personal'),
        ...getAllTasksWithType(data, 'couple')
    ];

    // Calculate completions for each day
    const maxCompletions = allTasks.length;
    const dateData = dates.map(dateStr => {
        const completions = allTasks.filter(task =>
            data.completions[dateStr]?.[task.id]?.completed
        ).length;
        const level = maxCompletions > 0 ? Math.min(4, Math.ceil((completions / maxCompletions) * 4)) : 0;
        return { date: dateStr, completions, level };
    });

    // Organize by weeks (Sunday to Saturday)
    const firstDate = new Date(dates[0] + 'T00:00:00');
    const firstDay = firstDate.getDay(); // 0 = Sunday

    // Create grid HTML
    let html = '<div class="heatmap-grid">';

    // Add empty cells to align first week
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="heatmap-cell" style="opacity: 0;"></div>';
    }

    // Add all date cells
    dateData.forEach(({ date, completions, level }) => {
        const d = new Date(date + 'T00:00:00');
        const dateLabel = `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        html += `
            <div class="heatmap-cell" data-level="${level}" title="${dateLabel}: ${completions} completions">
                <div class="heatmap-tooltip">${dateLabel}: ${completions}</div>
            </div>
        `;
    });

    html += '</div>';

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

    container.innerHTML = html;
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
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days, else calculate offset to Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + mondayOffset + i);
        days.push(date);
    }

    // Get couple tasks (only Daily frequency for weekly overview)
    const coupleTasks = getAllTasksWithType(data, 'couple').filter(task => task.frequency === 'Daily');
    const totalTasks = coupleTasks.length;

    const todayStr = today.toISOString().split('T')[0];

    // Calculate completions for each day
    const dailyStats = days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
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
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // If Sunday, go back 6 days, else calculate offset to Monday

    const days = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + mondayOffset + i);
        days.push(date);
    }

    // Get personal tasks (only Daily frequency for weekly overview)
    const personalTasks = getAllTasksWithType(data, 'personal').filter(task => task.frequency === 'Daily');
    const totalTasks = personalTasks.length;

    const todayStr = today.toISOString().split('T')[0];

    // Calculate completions for each day
    const dailyStats = days.map(date => {
        const dateStr = date.toISOString().split('T')[0];
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

function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
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
            refreshButton.style.transform = `rotate(${progress * 360}deg)`;
        }
    }, { passive: true });

    tabContent.addEventListener('touchend', async (e) => {
        if (!pulling) return;

        const endY = e.changedTouches[0].pageY;
        const distance = endY - startY;

        refreshButton.style.transform = '';

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
