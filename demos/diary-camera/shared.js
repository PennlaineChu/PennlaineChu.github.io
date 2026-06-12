// Diary Camera Progress Tracker - Shared State Management

const STORAGE_KEY = 'auraCamProgress';

// Default state
let appState = {
    completedItems: new Set(),
    logEntries: [],
    notes: '',
    photos: [],
    startDate: new Date().toISOString()
};

// Load from localStorage
function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const parsed = JSON.parse(saved);
        appState.completedItems = new Set(parsed.completedItems);
        appState.logEntries = parsed.logEntries || [];
        appState.notes = parsed.notes || '';
        appState.photos = parsed.photos || [];
        appState.startDate = parsed.startDate || appState.startDate;
    }
    return appState;
}

// Save to localStorage
function saveState() {
    const toSave = {
        completedItems: Array.from(appState.completedItems),
        logEntries: appState.logEntries,
        notes: appState.notes,
        photos: appState.photos,
        startDate: appState.startDate
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

// Toggle checklist item
function toggleItem(id) {
    if (appState.completedItems.has(id)) {
        appState.completedItems.delete(id);
    } else {
        appState.completedItems.add(id);
    }
    saveState();
}

// Check if item is completed
function isCompleted(id) {
    return appState.completedItems.has(id);
}

// Calculate section progress
function getSectionProgress(listId) {
    const items = document.querySelectorAll(`#${listId} .checklist-item`).length;
    const completed = document.querySelectorAll(`#${listId} .checklist-item.completed`).length;
    return { items, completed, percent: items > 0 ? Math.round(completed / items * 100) : 0 };
}

// Get overall progress
function getOverallProgress() {
    const total = appState.completedItems.size;
    const allItems = ['hw1','hw2','hw3','hw4','hw5','hw6','hw7','hw8','hw9','hw10',
                      'fw1','fw2','fw3','fw4','fw5','fw6','fw7','fw8','fw9','fw10',
                      'sw1','sw2','sw3','sw4','sw5','sw6','sw7','sw8','sw9',
                      'des1','des2','des3','des4','des5','des6','des7','des8','des9',
                      'spike1','spike2','spike3','spike4','spike5'].length;
    return Math.round(total / allItems * 100);
}

// Add log entry (diary style - no title, just content with date/time)
function addLogEntry(type, content) {
    const entry = {
        id: Date.now(),
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type,
        content
    };
    appState.logEntries.unshift(entry);
    saveState();
    return entry;
}

// Delete log entry
function deleteLogEntry(id) {
    appState.logEntries = appState.logEntries.filter(e => e.id !== id);
    saveState();
}

// Add photo
function addPhoto(fileName, dataUrl) {
    const photo = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        caption: fileName,
        src: dataUrl,
        uploadedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    appState.photos.push(photo);
    try {
        saveState();
    } catch (e) {
        // Remove photo if save failed (storage quota exceeded)
        appState.photos.pop();
        throw new Error('Storage full - browser localStorage limit reached. Try deleting some photos or exporting your data.');
    }
    return photo;
}

// Get storage usage estimate
function getStorageInfo() {
    const data = JSON.stringify({
        completedItems: Array.from(appState.completedItems),
        logEntries: appState.logEntries,
        notes: appState.notes,
        photos: appState.photos,
        startDate: appState.startDate
    });
    return {
        used: (data.length / 1024).toFixed(2) + ' KB',
        photos: appState.photos.length
    };
}

// Delete photo
function deletePhoto(id) {
    appState.photos = appState.photos.filter(p => p.id !== id);
    saveState();
}

// Update notes
function updateNotes(text) {
    appState.notes = text;
    saveState();
}

// Get stats
function getStats() {
    return {
        overall: getOverallProgress(),
        days: Math.floor((new Date() - new Date(appState.startDate)) / (1000 * 60 * 60 * 24)) + 1,
        trials: appState.logEntries.filter(e => e.type === 'trial' || e.type === 'blocker').length,
        insights: appState.logEntries.filter(e => e.type === 'insight').length,
        totalLogs: appState.logEntries.length,
        totalPhotos: appState.photos.length
    };
}

// Export data
function exportData() {
    const data = {
        completedItems: Array.from(appState.completedItems),
        logEntries: appState.logEntries,
        notes: appState.notes,
        photos: appState.photos,
        startDate: appState.startDate,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary-camera-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import data
async function importData(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    appState.completedItems = new Set(data.completedItems || []);
    appState.logEntries = data.logEntries || [];
    appState.notes = data.notes || '';
    appState.photos = data.photos || [];
    appState.startDate = data.startDate || appState.startDate;
    saveState();
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize checklist items on page
function initChecklist() {
    document.querySelectorAll('.checklist-item').forEach(item => {
        const id = item.dataset.id;
        if (isCompleted(id)) {
            item.classList.add('completed');
        }
        item.addEventListener('click', () => {
            toggleItem(id);
            item.classList.toggle('completed', isCompleted(id));
        });
    });
}
