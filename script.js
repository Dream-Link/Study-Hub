document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let state = { records: [], filteredTestType: 'all', sortBy: 'newest', activeView: 'dashboard-view', currentTheme: 'cosmic-dark' };

    // --- DOM ELEMENTS ---
    const views = document.querySelectorAll('.view');
    const navButtons = document.querySelectorAll('.nav-btn');
    const dashboardView = document.getElementById('dashboard-view');
    const historyList = document.getElementById('history-list');
    const formModal = document.getElementById('form-modal');
    const testForm = document.getElementById('test-form');
    const formTitle = document.getElementById('form-title');
    const addBtnMobile = document.getElementById('add-btn-mobile');
    const addBtnSidebar = document.getElementById('add-btn-sidebar');
    const cancelBtn = document.querySelector('.btn-cancel');
    const filterSelect = document.getElementById('filter-test-type');
    const sortSelect = document.getElementById('sort-history');
    const themeBtn = document.getElementById('theme-btn');
    const themeModal = document.getElementById('theme-modal');
    const themeOptionsGrid = document.getElementById('theme-options-grid');
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    const toast = document.getElementById('achievement-toast');
    const confirmModal = document.getElementById('confirm-modal');

    // --- CONSTANTS ---
    const TOTAL_QUESTIONS = 120;
    const THEMES = { 'cosmic-dark': 'Cosmic Dark', 'royal-gold': 'Royal Gold', 'sunset-glow': 'Sunset Glow', 'deep-ocean': 'Deep Ocean', 'emerald-shine': 'Emerald Shine', 'neon-punk': 'Neon Punk', 'minimalist-light': 'Minimalist Light', 'lush-forest': 'Lush Forest', 'strawberry-cream': 'Strawberry Cream', 'cherry-blossom': 'Cherry Blossom', 'moonlit-asteroid': 'Moonlit Asteroid', 'burning-orange': 'Burning Orange', 'amethyst': 'Amethyst', 'sharp-blues': 'Sharp Blues', 'soft-mint': 'Soft Mint', 'grapefruit': 'Grapefruit', 'earth': 'Earth', 'vintage': 'Vintage', 'rose-water': 'Rose Water', 'midnight-green': 'Midnight Green' };
    
    // --- DATA HANDLING ---
    const loadState = () => {
        state.records = JSON.parse(localStorage.getItem('testRecords')) || [];
        state.currentTheme = localStorage.getItem('appTheme') || 'cosmic-dark';
        applyTheme(state.currentTheme);
    };

    const saveState = () => {
        localStorage.setItem('testRecords', JSON.stringify(state.records));
        localStorage.setItem('appTheme', state.currentTheme);
    };
    
    // --- VIEW & NAVIGATION ---
    const switchView = (viewId) => {
        const currentView = document.querySelector('.view.active');
        if (currentView.id === viewId) return;
        const nextView = document.getElementById(viewId);
        
        currentView.classList.add('exiting');
        currentView.addEventListener('animationend', () => {
            currentView.classList.remove('active', 'exiting');
            nextView.classList.add('active');
            state.activeView = viewId;
            navButtons.forEach(b => b.classList.toggle('active', b.dataset.view === viewId));
        }, { once: true });
    };

    // --- RENDERING ---
    const renderDashboard = () => {
        dashboardView.innerHTML = getSkeletonDashboard(); // Show skeleton first
        setTimeout(() => { // Simulate async loading for UX
            if (state.records.length === 0) {
                dashboardView.innerHTML = `<div class="card no-data">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 1l-8.59 8.59L21 18.18V1zM4.22 2.47L2.81 3.88L5.59 6.66C3.93 7.82 3 9.81 3 12c0 3.87 3.13 7 7 7c2.19 0 4.18-1.01 5.48-2.58l3.65 3.65l1.41-1.41L4.22 2.47zM10 17c-2.76 0-5-2.24-5-5c0-1.48.65-2.8 1.67-3.71L15.71 17.34C14.8 17.75 13.51 18 12 18c-1.51 0-2.91-.49-4-1.32z"/></svg>
                    <h3>No Data Found</h3><p>Add your first test record to see your dashboard.</p></div>`;
                return;
            }
            const latest = state.records[0];
            const averages = calculateAverages();
            dashboardView.innerHTML = `
                <div class="summary-cards">
                    <div class="card summary-card"><div class="label">Latest Score</div><div class="value" data-value="${latest.score}">0</div></div>
                    <div class="card summary-card"><div class="label">Average Score</div><div class="value" data-value="${averages.avgScore.toFixed(2)}">0</div></div>
                    <div class="card summary-card"><div class="label">Best Rank</div><div class="value" data-value="${averages.bestRank}">0</div></div>
                    <div class="card summary-card"><div class="label">Avg. Accuracy</div><div class="value" data-value="${averages.avgAccuracy.toFixed(2)}">0%</div></div>
                </div>`;
            document.querySelectorAll('.value[data-value]').forEach(animateValue);
        }, 100);
    };

    const renderHistory = () => {
        historyList.innerHTML = getSkeletonHistory(); // Show skeleton first
        setTimeout(() => {
            const filteredAndSorted = getFilteredAndSortedRecords();
            if (filteredAndSorted.length === 0) {
                historyList.innerHTML = `<div class="card no-data">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 1l-8.59 8.59L21 18.18V1zM4.22 2.47L2.81 3.88L5.59 6.66C3.93 7.82 3 9.81 3 12c0 3.87 3.13 7 7 7c2.19 0 4.18-1.01 5.48-2.58l3.65 3.65l1.41-1.41L4.22 2.47zM10 17c-2.76 0-5-2.24-5-5c0-1.48.65-2.8 1.67-3.71L15.71 17.34C14.8 17.75 13.51 18 12 18c-1.51 0-2.91-.49-4-1.32z"/></svg>
                    <h3>No Records Found</h3><p>Your test history will appear here.</p></div>`; return;
            }
            historyList.innerHTML = filteredAndSorted.map(rec => `
                <div class="card history-item">
                    <div class="history-item-header">
                        <div><h4>${rec.testName}</h4><small>Correct: ${rec.correct}, Incorrect: ${rec.incorrect}, Skipped: ${rec.skipped}</small></div>
                        <span>Score: ${rec.score}/${rec.totalScore}</span>
                    </div>
                    <div class="history-item-actions">
                        <button class="action-btn edit-btn" data-id="${rec.id}" title="Edit">✏️</button>
                        <button class="action-btn delete-btn" data-id="${rec.id}" title="Delete">🗑️</button>
                    </div>
                </div>`).join('');
        }, 100);
    };
    
    // --- SKELETON LOADERS ---
    const getSkeletonDashboard = () => `
        <div class="summary-cards">
            <div class="card summary-card skeleton"><div class="skeleton-text"></div><div class="skeleton-text" style="width: 60%;"></div></div>
            <div class="card summary-card skeleton"><div class="skeleton-text"></div><div class="skeleton-text" style="width: 60%;"></div></div>
            <div class="card summary-card skeleton"><div class="skeleton-text"></div><div class="skeleton-text" style="width: 60%;"></div></div>
            <div class="card summary-card skeleton"><div class="skeleton-text"></div><div class="skeleton-text" style="width: 60%;"></div></div>
        </div>`;

    const getSkeletonHistory = () => Array(3).fill('<div class="card skeleton skeleton-card" style="height: 80px;"></div>').join('');

    // --- ANIMATIONS & UX ---
    const animateValue = (el) => {
        const target = parseFloat(el.dataset.value);
        if (isNaN(target)) { el.textContent = el.dataset.value; return; }
        const duration = 1000;
        let start = 0;
        const stepTime = 15;
        const steps = duration / stepTime;
        const increment = target / steps;
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                clearInterval(timer);
                start = target;
            }
            el.textContent = el.dataset.value.includes('%') ? start.toFixed(2) + '%' : Math.round(start);
        }, stepTime);
    };

    const vibrate = () => { if(navigator.vibrate) navigator.vibrate(50); };

    // --- CUSTOM CONFIRM MODAL ---
    const showConfirm = (title, message) => {
        return new Promise((resolve) => {
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            confirmModal.classList.add('active');
            
            const okBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');

            const close = (result) => {
                confirmModal.classList.remove('active');
                resolve(result);
            };

            okBtn.onclick = () => close(true);
            cancelBtn.onclick = () => close(false);
        });
    };

    // --- FORM HANDLING ---
    const handleFormSubmit = (e) => {
        e.preventDefault();
        vibrate();
        const id = document.getElementById('test-id').value;
        const correct = parseInt(document.getElementById('correct').value) || 0;
        const incorrect = parseInt(document.getElementById('incorrect').value) || 0;
        if (correct + incorrect > TOTAL_QUESTIONS) {
            alert(`Error: Correct + Incorrect questions cannot exceed ${TOTAL_QUESTIONS}.`); return;
        }
        const newRecord = {
            id: id ? parseInt(id) : Date.now(),
            testName: document.getElementById('testName').value, testType: document.getElementById('testType').value,
            score: parseFloat(document.getElementById('score').value), totalScore: parseFloat(document.getElementById('totalScore').value),
            rank: parseInt(document.getElementById('rank').value), totalStudents: parseInt(document.getElementById('totalStudents').value),
            percentile: parseFloat(document.getElementById('percentile').value), accuracy: parseFloat(document.getElementById('accuracy').value),
            correct, incorrect, attempted: correct + incorrect, skipped: TOTAL_QUESTIONS - (correct + incorrect)
        };
        if (id) {
            const index = state.records.findIndex(r => r.id === newRecord.id);
            state.records[index] = newRecord;
        } else {
            const oldBestScore = state.records.length > 0 ? Math.max(...state.records.map(r => r.score)) : 0;
            state.records.unshift(newRecord);
            if(newRecord.score > oldBestScore && oldBestScore > 0) showAchievement('🏆 New High Score!');
        }
        state.records.sort((a, b) => b.id - a.id);
        saveState(); renderAll(); formModal.classList.remove('active');
    };
    
    // --- EVENT LISTENERS ---
    historyList.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) { const record = state.records.find(r => r.id === parseInt(editBtn.dataset.id)); showForm(record); }
        
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            vibrate();
            const confirmed = await showConfirm('Delete Record', 'Are you sure you want to permanently delete this record?');
            if (confirmed) {
                state.records = state.records.filter(r => r.id !== parseInt(deleteBtn.dataset.id));
                saveState();
                renderAll();
                showAchievement('Record Deleted');
            }
        }
    });

    // --- INITIALIZATION ---
    const init = () => {
        Object.keys(THEMES).forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'theme-button';
            document.body.className = `theme-${key}`;
            btn.style.backgroundImage = getComputedStyle(document.body).backgroundImage;
            btn.onclick = () => { applyTheme(key); saveState(); themeModal.classList.remove('active'); };
            themeOptionsGrid.appendChild(btn);
        });
        loadState();
        renderAll();
        switchView('dashboard-view');
        if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
    };
    
    // --- Unchanged functions ---
    const calculateAverages = () => { if(state.records.length === 0) return { avgScore: 0, bestRank: 'N/A', avgAccuracy: 0}; const totalScore = state.records.reduce((sum, r) => sum + r.score, 0); const bestRank = Math.min(...state.records.map(r => r.rank)); const totalAccuracy = state.records.reduce((sum, r) => sum + r.accuracy, 0); return { avgScore: totalScore / state.records.length, bestRank, avgAccuracy: totalAccuracy / state.records.length }; };
    const getFilteredAndSortedRecords = () => { let records = [...state.records]; if (state.filteredTestType !== 'all') records = records.filter(r => r.testType === state.filteredTestType); switch (state.sortBy) { case 'score': records.sort((a, b) => b.score - a.score); break; case 'rank': records.sort((a, b) => a.rank - b.rank); break; } return records; };
    const showForm = (record = null) => { testForm.reset(); if (record) { formTitle.textContent = 'Edit Record'; Object.keys(record).forEach(key => { const input = document.getElementById(key); if(input) input.value = record[key]; }); } else { formTitle.textContent = 'Add New Record'; document.getElementById('test-id').value = ''; } formModal.classList.add('active'); };
    const showAchievement = (message) => { toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 4000); };
    const applyTheme = (themeKey) => { document.body.className = `theme-${themeKey}`; state.currentTheme = themeKey; };
    navButtons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
    addBtnMobile.addEventListener('click', () => showForm());
    addBtnSidebar.addEventListener('click', () => showForm());
    cancelBtn.addEventListener('click', () => formModal.classList.remove('active'));
    testForm.addEventListener('submit', handleFormSubmit);
    filterSelect.addEventListener('change', (e) => { state.filteredTestType = e.target.value; renderHistory(); });
    sortSelect.addEventListener('change', (e) => { state.sortBy = e.target.value; renderHistory(); });
    themeBtn.addEventListener('click', () => themeModal.classList.add('active'));
    themeModal.addEventListener('click', (e) => e.target === themeModal && themeModal.classList.remove('active'));
    exportBtn.addEventListener('click', () => { const dataStr = JSON.stringify(state.records, null, 2); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([dataStr], {type: 'application/json'})); a.download = `performance_backup_${new Date().toISOString().split('T')[0]}.json`; a.click(); URL.revokeObjectURL(a.href); });
    importFile.addEventListener('change', (e) => { const file = e.target.files[0]; if(!file) return; const reader = new FileReader(); reader.onload = (event) => { try { const imported = JSON.parse(event.target.result); if(Array.isArray(imported) && confirm(`Import ${imported.length} records? This will overwrite existing data.`)){ state.records = imported; saveState(); renderAll(); } } catch (err) { alert('Invalid file format.'); } }; reader.readAsText(file); });
    const renderAll = () => { renderDashboard(); renderHistory(); };
    init();
});