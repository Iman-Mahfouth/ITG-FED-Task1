let activeTab = 'in-progress';
let allLearningItems = []; 



async function loadMyLearningProgress() {
    const response = await fetch('data/my-learning.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}
function normalizeProgress(progress) {
    const lessonsCompleted = Number(progress?.lessonsCompleted);
    const totalLessons = Number(progress?.totalLessons);
    const safeTotal = Number.isFinite(totalLessons) && totalLessons > 0 ? Math.floor(totalLessons) : 0;
    const safeCompleted = Number.isFinite(lessonsCompleted) && lessonsCompleted > 0 ? Math.floor(lessonsCompleted) : 0;
    return {
     lessonsCompleted: Math.min(safeCompleted, safeTotal),
        totalLessons: safeTotal
    };
}
function mergeLearningData(catalog, progressList) {
    const catalogById = new Map((Array.isArray(catalog) ? catalog : []).map((course) => [course.id, course]));

    return (Array.isArray(progressList) ? progressList : [])
        .map((progress) => {
            if (!progress || typeof progress !== 'object') return null;
            const course = catalogById.get(progress.courseId);
            if (!course) return null;

            return {
                course,
                progress: normalizeProgress(progress)   
            };
        })
        .filter(Boolean);
}

function renderLearningCards(items) {
    const container = document.getElementById('learning-container');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    items.forEach(({ course, progress }) => {
        const card = createLearningCard(course, progress);
        if (card) fragment.appendChild(card);
    });
    container.replaceChildren(fragment);
}


function formatStatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '00';
    return String(Math.floor(n)).padStart(2, '0');
}

function computeLearningStats(items) {
    const safeItems = Array.isArray(items) ? items : [];

    let inProgress = 0;
    let completed = 0;
    let lessonsCompleted = 0;

    safeItems.forEach(({ progress }) => {
        const percentage = getProgress(progress);
        if (percentage >= 100) {
            completed += 1;
        } else {
            inProgress += 1;
        }

        const lessons = Number(progress?.lessonsCompleted);
        if (Number.isFinite(lessons) && lessons > 0) {
            lessonsCompleted += lessons;
        }
    });

    return {
        enrolled: safeItems.length,
        inProgress,
        completed,
        lessonsCompleted,
        allCourses: safeItems.length
    };
}


function setTextContentById(elementId, text) {
    const element = document.getElementById(elementId);
    if (!element) return false;
    element.textContent = text;
    return true;
}

function updateLearningStats(items) {
    const stats = computeLearningStats(items);

    setTextContentById('stat-enrolled', formatStatNumber(stats.enrolled));
    setTextContentById('stat-in-progress', formatStatNumber(stats.inProgress));
    setTextContentById('stat-completed', formatStatNumber(stats.completed));
    setTextContentById('stat-lessons-completed', formatStatNumber(stats.lessonsCompleted));

    setTextContentById('tab-count-in-progress', String(stats.inProgress));
    setTextContentById('tab-count-completed', String(stats.completed));
    setTextContentById('tab-count-all', String(stats.allCourses));
}

function filterItemsByTab(items, tabId) {
    if (tabId === 'all') return items;
    
    return items.filter(item => {
        const progress = getProgress(item.progress);
        if (tabId === 'completed') return progress >= 100;
        if (tabId === 'in-progress') return progress < 100;
        return true;
    });
}

function setupTabs() {
    const tabContainer = document.querySelector('.my-learning-tabs-list');
    if (!tabContainer) return;

    tabContainer.addEventListener('click', (event) => {
        const button = event.target.closest('[role="tab"]');
        if (!button) return;

        const nextTab = button.dataset.tab;
        
        if (nextTab === activeTab) return;

        tabContainer.querySelectorAll('[role="tab"]').forEach(tab => {
            tab.classList.remove('my-learning-tab--active');
            tab.setAttribute('aria-selected', 'false');
        });
        button.classList.add('my-learning-tab--active');
        button.setAttribute('aria-selected', 'true');
        
        activeTab = nextTab;

        const filteredItems = filterItemsByTab(allLearningItems, activeTab);
        renderLearningCards(filteredItems);
    });
}
async function initMyLearning() {
    try {
        const [catalog, progressList] = await Promise.all([
            fetchCourses(),
            loadMyLearningProgress()
        ]);
        allLearningItems = mergeLearningData(catalog, progressList);
        const filteredItems = filterItemsByTab(allLearningItems, activeTab);
        renderLearningCards(filteredItems);
        updateLearningStats(allLearningItems);
        setupFavoriteActions({ containerId: 'learning-container' });
        setupTabs();
    } catch (error) {
        console.error('Failed to initialize My Learning:', error);
    }
}

initMyLearning();
