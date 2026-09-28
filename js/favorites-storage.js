const FAVORITES_STORAGE_KEY = 'ml_favorite_ids';

function getFavoriteIds() {
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
    } catch (error) {
        console.error('Failed to parse favorites from localStorage:', error);
        return [];
    }
}

function setFavoriteIds(ids) {
    try {
        const unique = [...new Set(ids)].filter(Number.isInteger);
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(unique));
        return unique;
    } catch (error) {
        console.error('Failed to save favorites:', error);
        return [];
    }
}

function isFavorite(courseId) {
    return getFavoriteIds().includes(courseId);
}

function toggleFavorite(courseId) {
    const ids = getFavoriteIds();
    const exists = ids.includes(courseId);
    const next = exists ? ids.filter((id) => id !== courseId) : [...ids, courseId];
    return { removed: exists, ids: setFavoriteIds(next) };
}

function setupFavoriteActions({ containerId, removeCardOnUnfavorite = false } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="favorite"]');
        if (!button || !container.contains(button)) return;

        const courseId = Number(button.dataset.courseId);
        if (!Number.isInteger(courseId)) return;

        const { removed } = toggleFavorite(courseId);
        const icon = button.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-regular', removed);
            icon.classList.toggle('fa-solid', !removed);
        }
        button.classList.toggle('is-active', !removed);
        button.setAttribute('aria-pressed', String(!removed));

        if (removed && removeCardOnUnfavorite) {
            const column = button.closest('[data-course-card]');
            if (column) column.remove();
        }

        container.dispatchEvent(new CustomEvent('favorite:changed', {
            bubbles: true,
            detail: { courseId, removed }
        }));
    });
}
