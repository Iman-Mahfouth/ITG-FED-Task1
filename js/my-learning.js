/* ==========================================================================
   My Learning Page Logic (FED-26 / API-02)
   - Course metadata: ImpactMojo Courses API (via API-01 layer).
   - Learner progress: local data/my-learning.json.
   - Both sources are merged by stable course ID before rendering.
   - Data layer and render layer are strictly separated.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Module state
   -------------------------------------------------------------------------- */
let activeTab           = 'in-progress';
let allLearningItems    = [];   // matched records (rendered as cards)
let orphanedEnrollments = [];   // unmatched enrollment records
let learningEventsBound = false;

/* ==========================================================================
   Data Layer — Progress (local)
   ========================================================================== */

/**
 * Reads learner-specific progress. This file intentionally holds only
 * learner data — course metadata lives in the API.
 */
async function loadMyLearningProgress() {
    const response = await fetch('data/my-learning.json');
    if (!response.ok) {
        throw new Error(`Failed to load learning progress: HTTP ${response.status}`);
    }
    return response.json();
}

/**
 * Coerces raw progress into a guaranteed-valid shape.
 * Prevents NaN, negatives, and completed > total from reaching the UI.
 * Pure function — no side effects, trivially unit-testable.
 */
function normalizeProgress(progress) {
    const lessonsCompleted = Number(progress?.lessonsCompleted);
    const totalLessons     = Number(progress?.totalLessons);

    const safeTotal = Number.isFinite(totalLessons) && totalLessons > 0
        ? Math.floor(totalLessons)
        : 0;

    const safeCompleted = Number.isFinite(lessonsCompleted) && lessonsCompleted > 0
        ? Math.floor(lessonsCompleted)
        : 0;

    return {
        lessonsCompleted: Math.min(safeCompleted, safeTotal),
        totalLessons:     safeTotal
    };
}

/* ==========================================================================
   Data Layer — Merge (pure)
   Joins API-normalized courses with local progress by string-normalized
   course ID. Returns a richer object so the presentation layer can
   distinguish between "no enrollments at all" and "enrollments exist but
   none could be matched to the API".
   ========================================================================== */
function mergeLearningData(catalog, progressList) {
    const catalogById = new Map(
        (Array.isArray(catalog) ? catalog : [])
            .map((course) => [String(course.id), course])
    );

    const safeProgress = Array.isArray(progressList) ? progressList : [];

    const matched  = [];
    const orphaned = [];

    safeProgress.forEach((progress) => {
        if (!progress || typeof progress !== 'object') return;

        const courseId = String(progress.courseId ?? '').trim();
        if (!courseId) return;

        const course = catalogById.get(courseId);
        if (course) {
            matched.push({ course, progress: normalizeProgress(progress) });
        } else {
            // Preserve the full enrollment record (not just the ID) so any
            // future UI can explain the gap accurately.
            orphaned.push({
                courseId,
                progress: normalizeProgress(progress)
            });
        }
    });

    return { matched, orphaned };
}

/* ==========================================================================
   Rendering Layer — UI States
   ========================================================================== */

function setStateVisible(id, visible) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('d-none', !visible);
}

function hideOverlayStates() {
    setStateVisible('learning-empty',      false);
    setStateVisible('learning-orphaned',   false);
    setStateVisible('learning-no-results', false);
}

function createLearningSkeletonCard() {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    col.setAttribute('aria-hidden', 'true');

    const card = document.createElement('div');
    card.className = 'ml-card h-100';
    card.innerHTML = `
        <div class="ml-card-banner" style="background:#e7e9ee; min-height:14rem;"></div>
        <div class="ml-card-body">
            <div class="skeleton-box skeleton-line" style="width:40%;"></div>
            <div class="skeleton-box skeleton-line" style="width:80%;"></div>
            <div class="skeleton-box skeleton-line skeleton-line--short"></div>
        </div>
    `;
    col.appendChild(card);
    return col;
}

function resetLearningStats() {
    setTextContentById('stat-enrolled',          '--');
    setTextContentById('stat-in-progress',       '--');
    setTextContentById('stat-completed',         '--');
    setTextContentById('stat-lessons-completed', '--');

    setTextContentById('tab-count-in-progress', '0');
    setTextContentById('tab-count-completed',   '0');
    setTextContentById('tab-count-all',         '0');
}

function renderLearningLoading() {
    const container = document.getElementById('learning-container');
    if (!container) return;

    hideOverlayStates();
    resetLearningStats();


    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 3; i++) {
        fragment.appendChild(createLearningSkeletonCard());
    }
    container.replaceChildren(fragment);
}

function renderLearningError(message, onRetry) {
    const container = document.getElementById('learning-container');
    if (!container) return;

    hideOverlayStates();
    resetLearningStats();

    const wrapper = document.createElement('div');
    wrapper.className = 'col-12 text-center py-5';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-triangle-exclamation fs-1 text-danger mb-3';
    icon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h4');
    title.className = 'fw-bold text-dark mb-2';
    title.textContent = "Couldn't load your learning";

    const desc = document.createElement('p');
    desc.className = 'text-muted mb-4';
    desc.textContent = message || 'Please check your connection and try again.';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-primary rounded-3 px-4 py-2 fw-medium';
    retryBtn.textContent = 'Try again';
    retryBtn.addEventListener('click', onRetry, { once: true });

    wrapper.append(icon, title, desc, retryBtn);
    container.replaceChildren(wrapper);
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

function updateLearningEmptyState(matched, orphaned) {
    const isTrulyEmpty = matched.length === 0 && orphaned.length === 0;
    setStateVisible('learning-empty', isTrulyEmpty);
}

/**
 * Orphaned state: the learner has enrollment records, but none of them
 * could be matched to a course in the API. This must not be conflated
 * with the "never enrolled" state.
 */
function updateLearningOrphanedState(matched, orphaned) {
    const allOrphaned = matched.length === 0 && orphaned.length > 0;
    setStateVisible('learning-orphaned', allOrphaned);

    if (!allOrphaned) return;

    const countEl = document.getElementById('learning-orphaned-count');
    if (countEl) {
        const noun = orphaned.length === 1 ? 'course' : 'courses';
        countEl.textContent = `${orphaned.length} ${noun}`;
    }
}

/**
 * No-results state: user has matched items, but current tab filter yields none.
 */
function updateLearningNoResultsState(matched, filtered) {
    const hasAny     = matched.length > 0;
    const hasVisible = filtered.length > 0;
    setStateVisible('learning-no-results', hasAny && !hasVisible);
}

/* ==========================================================================
   Rendering Layer — Stats
   ========================================================================== */

function formatStatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return '00';
    return String(Math.floor(n)).padStart(2, '0');
}

function computeLearningStats(items) {
    const safeItems = Array.isArray(items) ? items : [];

    let inProgress = 0;
    let completed  = 0;
    let lessonsCompleted = 0;

    safeItems.forEach(({ progress }) => {
        const percentage = getProgress(progress);
        if (percentage >= 100) completed += 1;
        else inProgress += 1;

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

    setTextContentById('stat-enrolled',          formatStatNumber(stats.enrolled));
    setTextContentById('stat-in-progress',       formatStatNumber(stats.inProgress));
    setTextContentById('stat-completed',         formatStatNumber(stats.completed));
    setTextContentById('stat-lessons-completed', formatStatNumber(stats.lessonsCompleted));

    setTextContentById('tab-count-in-progress', String(stats.inProgress));
    setTextContentById('tab-count-completed',   String(stats.completed));
    setTextContentById('tab-count-all',         String(stats.allCourses));
}

/* ==========================================================================
   Rendering Layer — Tab filter + active render
   ========================================================================== */

function filterItemsByTab(items, tabId) {
    if (tabId === 'all') return items;

    return items.filter((item) => {
        const progress = getProgress(item.progress);
        if (tabId === 'completed')   return progress >= 100;
        if (tabId === 'in-progress') return progress < 100;
        return true;
    });
}

function renderActiveTab() {
    const filtered = filterItemsByTab(allLearningItems, activeTab);

    renderLearningCards(filtered);
    updateLearningEmptyState(allLearningItems, orphanedEnrollments);
    updateLearningOrphanedState(allLearningItems, orphanedEnrollments);
    updateLearningNoResultsState(allLearningItems, filtered);
}

/* ==========================================================================
   Event Setup — bound exactly once
   ========================================================================== */

function bindLearningEvents() {
    if (learningEventsBound) return;
    learningEventsBound = true;

    const tabContainer = document.querySelector('.my-learning-tabs-list');
    if (tabContainer) {
        tabContainer.addEventListener('click', (event) => {
            const button = event.target.closest('[role="tab"]');
            if (!button) return;

            const nextTab = button.dataset.tab;
            if (!nextTab || nextTab === activeTab) return;

            tabContainer.querySelectorAll('[role="tab"]').forEach((tab) => {
                tab.classList.remove('my-learning-tab--active');
                tab.setAttribute('aria-selected', 'false');
            });
            button.classList.add('my-learning-tab--active');
            button.setAttribute('aria-selected', 'true');

            activeTab = nextTab;
            renderActiveTab();
        });
    }

    const resetBtn = document.getElementById('learning-reset-tab');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            const allTab = document.querySelector('[data-tab="all"]');
            if (allTab) allTab.click();
        });
    }
}

/* ==========================================================================
   Controller
   ========================================================================== */

async function loadLearningPage() {
    renderLearningLoading();

    try {
        // Both fetches are independent — run in parallel.
        // Courses come from the API-01 layer; progress from the local file.
        const [catalog, progressList] = await Promise.all([
            loadCoursesFromApi(),
            loadMyLearningProgress()
        ]);

        const { matched, orphaned } = mergeLearningData(catalog, progressList);

        allLearningItems    = matched;
        orphanedEnrollments = orphaned;

        updateLearningStats(allLearningItems);
        renderActiveTab();

        document.dispatchEvent(new CustomEvent('nav:badge', {
            detail: { id: 'learning', value: allLearningItems.length }
        }));
    } catch (error) {
    console.error('Failed to load My Learning:', error);

    if (typeof clearNavBadge === 'function') {
        clearNavBadge('learning');
    } else {
        try { localStorage.removeItem('ml_badge_learning'); } catch (_) {}
    }

    renderLearningError(
        "We couldn't load your learning. Please check your connection and try again.",
        loadLearningPage
    );
}}


async function initMyLearning() {
    bindLearningEvents();
    setupFavoriteActions({ containerId: 'learning-container' });
    await loadLearningPage();
}

initMyLearning();