/* ==========================================================================
   Favorites Page Logic (FED-27 / API-02)
   - Catalog source: ImpactMojo API (via API-01 layer, courses-api.js).
   - Favorite IDs: string-normalized in favorites-storage.js.
   ========================================================================== */

let allFavoriteCourses = [];
let activeFilter = 'all';

/**
 * Filters the normalized catalog down to only favorited courses.
 * Comparison is string-normalized on both sides so numeric legacy IDs
 * and string API IDs both resolve correctly.
 */
function getFavoriteCourses(catalog) {
    const favoriteIds = new Set(getFavoriteIds());
    return (Array.isArray(catalog) ? catalog : [])
        .filter((course) => favoriteIds.has(String(course.id)));
}

function filterCoursesByCategory(courses, category) {
    if (!category || category === 'all') return courses;
    return courses.filter((course) => course.category === category);
}

function renderFavoriteCards(courses) {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    (Array.isArray(courses) ? courses : []).forEach((course) => {
        const card = createLearningCard(course, null, { variant: 'favorites' });
        if (card) fragment.appendChild(card);
    });
    container.replaceChildren(fragment);
}

function updateFavoritesCollection(courses = allFavoriteCourses) {
    if (Array.isArray(courses)) {
        allFavoriteCourses = courses;
    }
    const totalCount = allFavoriteCourses.length;
    const filteredCourses = filterCoursesByCategory(allFavoriteCourses, activeFilter);
    const filteredCount = filteredCourses.length;

    document.querySelectorAll('.ml-favorites-filter-pill[data-filter]').forEach((pill) => {
        const filterValue = pill.dataset.filter;
        const countSpan = pill.querySelector('[data-filter-count]')
            || (filterValue === 'all'
                ? document.getElementById('favorites-all-count')
                : document.getElementById('favorites-frontend-count'));
        if (countSpan) {
            const count = filterValue === 'all'
                ? totalCount
                : allFavoriteCourses.filter((course) => course.category === filterValue).length;
            countSpan.textContent = String(count);
        }
    });

    const countLine = document.getElementById('favorites-count-line');
    if (countLine) {
        if (totalCount === 0) {
            countLine.textContent = '0 courses in your collection';
        } else if (activeFilter === 'all') {
            countLine.textContent = `Showing 1–${totalCount} of ${totalCount} courses in your collection`;
        } else {
            countLine.textContent = filteredCount
                ? `Showing 1–${filteredCount} of ${filteredCount} courses in ${activeFilter}`
                : `0 courses in ${activeFilter}`;
        }
    }

    renderFavoriteCards(filteredCourses);

    const emptyState = document.getElementById('favorites-empty-state');
    if (emptyState) {
        const isEmpty = filteredCount === 0;
        emptyState.classList.toggle('d-none', !isEmpty);

        const title = emptyState.querySelector('.ml-empty-state-title');
        const subtitle = emptyState.querySelector('.ml-empty-state-subtitle');
        const action = emptyState.querySelector('.ml-empty-state-action');

        if (title && subtitle) {
            if (totalCount === 0) {
                title.textContent = 'Keep a little inspiration here';
                subtitle.textContent = 'Tap the heart on any course to add it to your personal collection.';
                if (action) action.classList.remove('d-none');
            } else if (isEmpty) {
                title.textContent = `No ${activeFilter} courses saved`;
                subtitle.textContent = `You don't have any ${activeFilter} courses in your favorites yet.`;
                if (action) action.classList.add('d-none');
            }
        }
    }

    document.dispatchEvent(new CustomEvent('nav:badge', {
        detail: { id: 'favorites', value: totalCount }
    }));
}

function showFavoritesToast(message) {
    const toastElement = document.getElementById('favorites-toast');
    const messageElement = document.getElementById('favorites-toast-message');
    if (!toastElement || !messageElement) return;

    messageElement.textContent = message;
    bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3000 }).show();
}

function setupFavoritesFilters() {
    const filterGroup = document.querySelector('.ml-favorites-filter-left');
    if (!filterGroup) return;

    filterGroup.addEventListener('click', (event) => {
        const button = event.target.closest('.ml-favorites-filter-pill[data-filter]');
        if (!button) return;

        const filterValue = button.dataset.filter;
        if (filterValue === activeFilter) return;

        filterGroup.querySelectorAll('.ml-favorites-filter-pill').forEach((pill) => {
            pill.classList.remove('ml-favorites-filter-pill--active');
            pill.setAttribute('aria-selected', 'false');
        });

        button.classList.add('ml-favorites-filter-pill--active');
        button.setAttribute('aria-selected', 'true');
        activeFilter = filterValue;

        updateFavoritesCollection();
    });
}

function setupFavoritesListener() {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    container.addEventListener('favorite:changed', (event) => {
        const { courseId, removed } = event.detail || {};
        if (removed) {
            allFavoriteCourses = allFavoriteCourses
                .filter((course) => String(course.id) !== String(courseId));
            updateFavoritesCollection(allFavoriteCourses);
            showFavoritesToast('Removed from your favorites.');
        }
    });
}

async function initFavorites() {
    try {
        // API-01 layer — same normalization used by Courses and My Learning.
        const catalog = await loadCoursesFromApi();
        allFavoriteCourses = getFavoriteCourses(catalog);
        updateFavoritesCollection(allFavoriteCourses);
        setupFavoriteActions({ containerId: 'favorites-container', removeCardOnUnfavorite: true });
        setupFavoritesFilters();
        setupFavoritesListener();
    } catch (error) {
        console.error('Failed to initialize Favorites:', error);
    }
}

initFavorites();