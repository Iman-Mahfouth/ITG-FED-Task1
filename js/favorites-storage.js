const FAVORITES_STORAGE_KEY = 'ml_favorite_ids';

/**
 * Normalizes any ID
 */
function toFavoriteId(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function getFavoriteIds() {
    try {
        const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(toFavoriteId)
            .filter((id) => id.length > 0);
    } catch (error) {
        console.error('Failed to parse favorites from localStorage:', error);
        return [];
    }
}

function setFavoriteIds(ids) {
    try {
        const unique = [...new Set((Array.isArray(ids) ? ids : []).map(toFavoriteId).filter(Boolean))];
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(unique));
        return unique;
    } catch (error) {
        console.error('Failed to save favorites:', error);
        return [];
    }
}

function isFavorite(courseId) {
    const id = toFavoriteId(courseId);
    if (!id) return false;
    return getFavoriteIds().includes(id);
}

function toggleFavorite(courseId) {
    const id = toFavoriteId(courseId);
    if (!id) return { removed: false, ids: getFavoriteIds() };

    const ids = getFavoriteIds();
    const exists = ids.includes(id);
    const next = exists ? ids.filter((v) => v !== id) : [...ids, id];
    return { removed: exists, ids: setFavoriteIds(next) };
}

function setupFavoriteActions({ containerId, removeCardOnUnfavorite = false } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="favorite"]');
        if (!button || !container.contains(button)) return;

        event.preventDefault();
        event.stopPropagation();

        const courseId = toFavoriteId(button.dataset.courseId);
        if (!courseId) return;

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