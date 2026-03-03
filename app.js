import { GITHUB_CONFIG, PREDEFINED_TASKS } from './config.js';

// Version
const APP_VERSION = '3.0.0';

// State Management
let authToken = null;
let currentData = null;

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

    debugLog(`🚀 App v${APP_VERSION} started`);

    // Check for existing token
    const storedToken = localStorage.getItem('github_token');
    if (storedToken) {
        authToken = storedToken;
        debugLog('✓ Found stored token');
        showMainApp();
        await loadApp();
    } else {
        debugLog('No stored token, showing auth screen');
        showAuthScreen();
    }

    // Set up event listeners
    authButton.addEventListener('click', initiateGitHubLogin);
    tokenInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') initiateGitHubLogin();
    });
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

function initiateGitHubLogin() {
    const token = tokenInput.value.trim();
    if (!token) {
        showToast('Please enter a GitHub token', 'error');
        return;
    }

    authToken = token;
    localStorage.setItem('github_token', authToken);
    tokenInput.value = '';

    debugLog('Token saved to localStorage');
    showMainApp();
    loadApp();
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
// GITHUB DATA LAYER
// ===================================

async function loadGoalsData() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`;
    const headers = {
        'Authorization': `token ${authToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Access-Control-Allow-Origin': '*'
    };

    debugLog('📤 HTTP REQUEST:', {
        method: 'GET',
        url: url,
        headers: headers
    });

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });

        debugLog('📥 HTTP RESPONSE:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (response.ok) {
            const fileData = await response.json();
            const content = atob(fileData.content);
            const data = JSON.parse(content);
            localStorage.setItem('goals_cache', JSON.stringify(data));
            return data;
        } else if (response.status === 404) {
            debugLog('File not found, creating initial data');
            const defaultData = getDefaultData();
            await saveGoalsData(defaultData);
            return defaultData;
        } else {
            throw new Error(`GitHub API error: ${response.status}`);
        }
    } catch (error) {
        debugLog('✗ Fetch error', { error: error.message });
        const cached = localStorage.getItem('goals_cache');
        if (cached) {
            return JSON.parse(cached);
        }
        return getDefaultData();
    }
}

async function saveGoalsData(data) {
    const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`;
    const headers = {
        'Authorization': `token ${authToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Access-Control-Allow-Origin': '*'
    };

    debugLog('📤 HTTP REQUEST (GET SHA):', {
        method: 'GET',
        url: getUrl,
        headers: headers
    });

    try {
        // Get current file SHA
        const getResponse = await fetch(getUrl, { method: 'GET', headers: headers });

        debugLog('📥 HTTP RESPONSE (GET SHA):', {
            status: getResponse.status,
            ok: getResponse.ok,
            headers: Object.fromEntries(getResponse.headers.entries())
        });

        let sha = null;
        if (getResponse.ok) {
            const fileData = await getResponse.json();
            sha = fileData.sha;
        }

        // Prepare content
        const content = btoa(JSON.stringify(data, null, 2));
        const putHeaders = {
            ...headers,
            'Content-Type': 'application/json'
        };
        const body = {
            message: `Update goals data - ${new Date().toISOString()}`,
            content: content,
            sha: sha
        };

        debugLog('📤 HTTP REQUEST (PUT):', {
            method: 'PUT',
            url: getUrl,
            headers: putHeaders,
            body: body
        });

        const putResponse = await fetch(getUrl, {
            method: 'PUT',
            headers: putHeaders,
            body: JSON.stringify(body)
        });

        debugLog('📥 HTTP RESPONSE (PUT):', {
            status: putResponse.status,
            ok: putResponse.ok,
            headers: Object.fromEntries(putResponse.headers.entries())
        });

        if (putResponse.ok) {
            localStorage.setItem('goals_cache', JSON.stringify(data));
            showToast('Saved! ✓', 'success');
            return true;
        } else {
            const errorText = await putResponse.text();
            debugLog('✗ Save failed', { status: putResponse.status, error: errorText });
            showToast(`Error ${putResponse.status}: ${errorText.substring(0, 50)}`, 'error');
            return false;
        }
    } catch (error) {
        debugLog('✗ Save error', { error: error.message });
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
