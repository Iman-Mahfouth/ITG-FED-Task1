/* ==========================================================================
   Courses Page Logic (FED-06 / API-01)
   Renders courses loaded from the Education API.
   ========================================================================== */

/* ==========================================================================
   State
   ========================================================================== */
let searchDebounceTimer;
function joinMeta(parts, sep = ' • ') {
    return parts
        .map(p => (p == null ? '' : String(p).trim()))
        .filter(Boolean)
        .join(sep);
}
/* ==========================================================================
   Card Builders (Unchanged API — consume normalized model)
   ========================================================================== */
function createIconElement(visual) {
    if (!visual) return document.createTextNode('');

    if (visual.type === 'icon') {
        const icon = document.createElement('i');
        icon.className = visual.value;
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    const span = document.createElement('span');
    span.textContent = visual.value || '';
    return span;
}

function createCourseCard(course) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const card = document.createElement('div');
    card.className = 'card border-0 shadow-sm p-3 p-lg-4 rounded-4 h-100 course-card';

    /* --- Mobile --- */
    const mobileDiv = document.createElement('div');
    mobileDiv.className = 'd-flex d-md-none align-items-center gap-3';

    const mobileIconDiv = document.createElement('div');
    mobileIconDiv.className = `course-icon-mobile ${course.visual.color} rounded-4 d-flex align-items-center justify-content-center fw-bold`;
    mobileIconDiv.appendChild(createIconElement(course.visual));

    const mobileContentDiv = document.createElement('div');
    mobileContentDiv.className = 'flex-grow-1';

    const mobileTitle = document.createElement('h6');
    mobileTitle.className = 'fw-bold text-dark mb-1 fs-6';
    mobileTitle.textContent = course.title;

    const mobileSub1 = document.createElement('p');
    mobileSub1.className = 'text-muted mb-1 small';
    mobileSub1.textContent = joinMeta([course.category, course.instructor]);

    const mobileSub2 = document.createElement('p');
    mobileSub2.className = 'text-muted mb-0 small';
    mobileSub2.textContent = joinMeta([course.level, course.duration]);

    mobileContentDiv.append(mobileTitle, mobileSub1, mobileSub2);
    mobileDiv.append(mobileIconDiv, mobileContentDiv);

    /* --- Desktop --- */
    const desktopDiv = document.createElement('div');
    desktopDiv.className = 'course-content d-none d-md-grid';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'course-header';

    const desktopIconDiv = document.createElement('div');
    desktopIconDiv.className = `course-icon ${course.visual.color} rounded-3 d-flex align-items-center justify-content-center fw-bold`;
    desktopIconDiv.appendChild(createIconElement(course.visual));

    const infoDiv = document.createElement('div');
    infoDiv.className = 'course-info';

    const desktopTitle = document.createElement('h5');
    desktopTitle.className = 'card-title fw-bold text-dark mb-2';
    desktopTitle.textContent = course.title;

    const badgeContainer = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = `badge ${course.badgeColor} rounded-pill px-3 py-1 fw-medium`;
    badge.textContent = course.category;
    badgeContainer.appendChild(badge);

    infoDiv.append(desktopTitle, badgeContainer);
    headerDiv.append(desktopIconDiv, infoDiv);

    /* --- Details: only render rows that actually have values --- */
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'course-details';

    if (course.instructor) {
        const instructorDiv = document.createElement('div');
        instructorDiv.className = 'instructor d-flex align-items-center';
        const instructorIcon = document.createElement('i');
        instructorIcon.className = 'fa-solid fa-user text-secondary';
        const instructorSpan = document.createElement('span');
        instructorSpan.textContent = course.instructor;
        instructorDiv.append(instructorIcon, instructorSpan);
        detailsDiv.appendChild(instructorDiv);
    }

    const metaDiv = document.createElement('div');
    metaDiv.className = 'course-meta d-flex align-items-center gap-4';

    if (course.duration) {
        const durationDiv = document.createElement('div');
        durationDiv.className = 'd-flex align-items-center';
        const clockIcon = document.createElement('i');
        clockIcon.className = 'fa-solid fa-clock text-secondary';
        const durationSpan = document.createElement('span');
        durationSpan.textContent = course.duration;
        durationDiv.append(clockIcon, durationSpan);
        metaDiv.appendChild(durationDiv);
    }

    if (course.level) {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'd-flex align-items-center';
        const levelIcon = document.createElement('i');
        levelIcon.className = 'fa-solid fa-chart-bar text-secondary';
        const levelSpan = document.createElement('span');
        levelSpan.textContent = course.level;
        levelDiv.append(levelIcon, levelSpan);
        metaDiv.appendChild(levelDiv);
    }

    if (metaDiv.childElementCount > 0) detailsDiv.appendChild(metaDiv);

    desktopDiv.appendChild(headerDiv);
    if (detailsDiv.childElementCount > 0) desktopDiv.appendChild(detailsDiv);

    /* --- Action --- */
    const viewDetailsButton = document.createElement('button');
    viewDetailsButton.type = 'button';
    viewDetailsButton.className = 'btn btn-outline-primary w-100 rounded-3 py-2 fw-medium mt-3';
    viewDetailsButton.textContent = 'View Details';
    viewDetailsButton.dataset.action = 'view-details';
    viewDetailsButton.dataset.courseId = course.id;
    viewDetailsButton.setAttribute('aria-label', `View details for ${course.title}`);

    card.append(mobileDiv, desktopDiv, viewDetailsButton);
    col.appendChild(card);
    return col;
}

/* ==========================================================================
   Loading / Error States
   ========================================================================== */
function createSkeletonCard() {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const card = document.createElement('div');
    card.className = 'card border-0 shadow-sm p-3 p-lg-4 rounded-4 h-100 course-card';
    card.setAttribute('aria-hidden', 'true');

    card.innerHTML = `
        <div class="d-flex align-items-center gap-3 mb-3">
            <div class="skeleton-box skeleton-square"></div>
            <div class="flex-grow-1">
                <div class="skeleton-box skeleton-line" style="width: 70%;"></div>
                <div class="skeleton-box skeleton-line skeleton-line--short"></div>
            </div>
        </div>
        <div class="skeleton-box skeleton-line"></div>
        <div class="skeleton-box skeleton-line skeleton-line--short"></div>
    `;

    col.appendChild(card);
    return col;
}

function renderLoadingSkeleton() {
    const container = document.getElementById('courses-container');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 6; i++) {
        fragment.appendChild(createSkeletonCard());
    }
    container.replaceChildren(fragment);
}

function renderError(message, onRetry) {
    const container = document.getElementById('courses-container');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'col-12 text-center py-5';

    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-triangle-exclamation fs-1 text-danger mb-3';
    icon.setAttribute('aria-hidden', 'true');

    const title = document.createElement('h4');
    title.className = 'fw-bold text-dark mb-2';
    title.textContent = 'Something went wrong';

    const desc = document.createElement('p');
    desc.className = 'text-muted mb-4';
    desc.textContent = message || 'We couldn\'t load the courses. Please try again.';

    const retryBtn = document.createElement('button');
    retryBtn.type = 'button';
    retryBtn.className = 'btn btn-primary rounded-3 px-4 py-2 fw-medium';
    retryBtn.textContent = 'Try again';
    retryBtn.addEventListener('click', onRetry, { once: true });

    wrapper.append(icon, title, desc, retryBtn);
    container.replaceChildren(wrapper);
}

function renderCourses(courses) {
    const container = document.getElementById('courses-container');
    if (!container) return;

    const fragment = document.createDocumentFragment();
    courses.forEach(course => fragment.appendChild(createCourseCard(course)));
    container.replaceChildren(fragment);
}

/* ==========================================================================
   Modal
   ========================================================================== */
function setModalField(valueElId, value) {
    const valueEl = document.getElementById(valueElId);
    if (!valueEl) return;

    const row = valueEl.closest('.modal-info-row');
    const hasValue = value != null && String(value).trim() !== '';

    if (row) row.classList.toggle('d-none', !hasValue);
    valueEl.textContent = hasValue ? value : '';
}

function populateModal(course) {
    const iconContainer = document.getElementById('modal-icon');
    if (iconContainer) {
        iconContainer.className = `course-icon ${course.visual.color} rounded-3 d-flex align-items-center justify-content-center fw-bold`;
        iconContainer.replaceChildren(createIconElement(course.visual));
    }

    const titleEl = document.getElementById('modal-title');
    if (titleEl) titleEl.textContent = course.title;

    const badgeEl = document.getElementById('modal-category-badge');
    if (badgeEl) {
        badgeEl.textContent = course.category;
        badgeEl.className = `badge rounded-pill px-3 py-1 fw-medium ${course.badgeColor}`;
    }

    setModalField('modal-instructor', course.instructor);
    setModalField('modal-duration',   course.duration);
    setModalField('modal-level',      course.level);

    const descEl = document.getElementById('modal-description');
    if (descEl) {
        const descriptionBlock = descEl.closest('div');
        if (course.description) {
            descEl.textContent = course.description;
            if (descriptionBlock) descriptionBlock.classList.remove('d-none');
        } else {
            descEl.textContent = '';
            if (descriptionBlock) descriptionBlock.classList.add('d-none');
        }
    }
}

function openCourseDetails(course) {
    const modalEl = document.getElementById('course-details-modal');
    if (!modalEl) return;

    populateModal(course);
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* ==========================================================================
   Filters / Search
   ========================================================================== */
function filterCourses(courses, searchTerm, selectedCategory) {
    const term = searchTerm.toLowerCase().trim();

    return courses.filter(course => {
        const matchesSearch = (course.title || '').toLowerCase().includes(term);
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
}

function updateEmptyState(hasResults) {
    const noResults = document.getElementById('no-results');
    if (noResults) noResults.classList.toggle('d-none', hasResults);
}

function applyFilters(courses) {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const clearButton = document.getElementById('clear-search');

    if (!searchInput || !categoryFilter) return;

    const searchTerm = searchInput.value;
    const selectedCategory = categoryFilter.value;
    const filtered = filterCourses(courses, searchTerm, selectedCategory);

    renderCourses(filtered);
    updateEmptyState(filtered.length > 0);

    if (clearButton) clearButton.classList.toggle('d-none', !searchTerm.trim());
}

function populateCategoryFilter(courses) {
    const select = document.getElementById('category-filter');
    if (!select) return;

    const previousValue = select.value || 'All';

    // Unique, sorted categories — derived from the normalized model
    const categories = Array.from(
        new Set(courses.map(c => c.category).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));

    const fragment = document.createDocumentFragment();

    const allOption = document.createElement('option');
    allOption.value = 'All';
    allOption.textContent = 'All Categories';
    fragment.appendChild(allOption);

    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        fragment.appendChild(opt);
    });

    select.replaceChildren(fragment);

    // Preserve previous selection when it still exists
    const stillValid = previousValue === 'All' || categories.includes(previousValue);
    select.value = stillValid ? previousValue : 'All';
}

function resetFilters(courses, { resetCategory = false } = {}) {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    if (!searchInput || !categoryFilter) return;

    clearTimeout(searchDebounceTimer);
    searchInput.value = '';

    if (resetCategory) categoryFilter.value = 'All';

    applyFilters(courses);
    searchInput.focus();
}

/* ==========================================================================
   Event Setup
   ========================================================================== */
function setupSearch(courses) {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => applyFilters(courses), 300);
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => resetFilters(courses));
    }
}

function setupCategoryFilter(courses) {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;
    categoryFilter.addEventListener('change', () => applyFilters(courses));
}

function setupCourseActions(courses) {
    const container = document.getElementById('courses-container');
    if (!container) return;

    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="view-details"]');
        if (!button) return;

        const courseId = button.dataset.courseId;
        const course = courses.find(c => c.id === courseId);
        if (course) openCourseDetails(course);
    });
}

function setupClearFilters(courses) {
    const clearBtn = document.getElementById('clear-filters');
    if (!clearBtn) return;
    clearBtn.addEventListener('click', () => resetFilters(courses, { resetCategory: true }));
}

/* ==========================================================================
   Init
   ========================================================================== */
async function init() {
    renderLoadingSkeleton();

    try {
        const courses = await loadCoursesFromApi();

        populateCategoryFilter(courses);
        setupSearch(courses);
        setupCategoryFilter(courses);
        setupCourseActions(courses);
        setupClearFilters(courses);
        applyFilters(courses);

        // Sync sidebar badge
        document.dispatchEvent(new CustomEvent('nav:badge', {
            detail: { id: 'explore', value: courses.length }
        }));

        return courses;
    } catch (error) {
        console.error('Failed to initialize courses:', error);
        renderError(
            'We couldn\'t load the courses. Please check your connection and try again.',
            () => init()
        );
        return [];
    }
}

init();