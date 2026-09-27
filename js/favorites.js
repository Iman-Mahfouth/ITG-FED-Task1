let allFavoriteCourses = [];
let activeFilter = 'all';
function getFavoriteCourses(catalog) {
    const favoriteIds = new Set(getFavoriteIds());
    return (Array.isArray(catalog) ? catalog : []).filter((course) => favoriteIds.has(course.id));
}
function filterCoursesByCategory(courses, category) {
    if (!category || category === 'all') return courses;
    return courses.filter((course) => course.category === category);
}
function updateFavoritesCollection(courses) {
    const safeCourses = Array.isArray(courses) ? courses : [];
    const totalCount = safeCourses.length;
    document.querySelectorAll('.ml-favorites-filter-pill[data-filter]').forEach((pill) => {
        const filterValue = pill.dataset.filter;
        const countSpan = pill.querySelector('[data-filter-count]') 
            || (filterValue === 'all' ? document.getElementById('favorites-all-count') : document.getElementById('favorites-frontend-count'));
        if (countSpan) {
            const count = filterValue === 'all' 
                ? totalCount 
                : safeCourses.filter((course) => course.category === filterValue).length;
            countSpan.textContent = String(count);
        }
    });
 const countLine = document.getElementById('favorites-count-line');
    const emptyState = document.getElementById('favorites-empty-state');
    if (countLine) {
        countLine.textContent = totalCount
            ? `Showing 1–${totalCount} of ${totalCount} courses in your collection`
            : '0 courses in your collection';
    }
    if (emptyState) {
        emptyState.classList.toggle('d-none', totalCount !== 0);
    }
}
function showFavoritesToast(message) {
    const toastElement = document.getElementById('favorites-toast');
    const messageElement = document.getElementById('favorites-toast-message');
    if (!toastElement || !messageElement) return;
    messageElement.textContent = message;
    bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3000 }).show();
}
function renderFavoriteCards(courses) {
    const container = document.getElementById('favorites-container');
    if (!container) return;const fragment = document.createDocumentFragment();
    courses.forEach((course) => {
        const card = createLearningCard(course, null, { variant: 'favorites' });
        if (card) fragment.appendChild(card);
    });
    container.replaceChildren(fragment);
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
        activeFilter = filterValue;  const filtered = filterCoursesByCategory(allFavoriteCourses, activeFilter);
        renderFavoriteCards(filtered);
    });
}
function setupFavoritesListener() {
    const container = document.getElementById('favorites-container');
    if (!container) return;
    container.addEventListener('favorite:changed', (event) => {
        const { courseId, removed } = event.detail || {};
        if (removed) {
            allFavoriteCourses = allFavoriteCourses.filter((course) => course.id !== courseId);
            updateFavoritesCollection(allFavoriteCourses);
            showFavoritesToast('Removed from your favorites.');
            if (allFavoriteCourses.length === 0) {
                const emptyState = document.getElementById('favorites-empty-state');
                if (emptyState) emptyState.classList.remove('d-none');
            }
        }
    });
}
async function initFavorites() {
    try {
        const catalog = await fetchCourses();
        allFavoriteCourses = getFavoriteCourses(catalog);
        renderFavoriteCards(filterCoursesByCategory(allFavoriteCourses, activeFilter));
        updateFavoritesCollection(allFavoriteCourses);
        setupFavoriteActions({ containerId: 'favorites-container', removeCardOnUnfavorite: true });
        setupFavoritesFilters();
        setupFavoritesListener();
    } catch (error) {
        console.error('Failed to initialize Favorites:', error);
    }
}
initFavorites();