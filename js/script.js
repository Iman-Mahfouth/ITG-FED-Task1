console.log("FED-13: JS file loaded successfully!");

async function loadCourses() {
    try {
        const response = await fetch('data/courses.json');  
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const courses = await response.json();
        return courses;
    } catch (error) {
        console.error('Failed to load course data:', error);
        throw error; 
    }
}

const categoryStyles = {
    'Frontend': 'bg-primary-subtle text-primary',
    'Backend': 'bg-success-subtle text-success',
    'Database': 'bg-secondary-subtle text-secondary'
};

const courseVisuals = {
    1: { type: 'icon', value: 'fa-brands fa-html5', color: 'bg-warning-subtle text-warning' },
    2: { type: 'icon', value: 'fa-brands fa-css3-alt', color: 'bg-info-subtle text-info' },
    3: { type: 'text', value: 'JS', color: 'bg-warning text-dark' },
    4: { type: 'text', value: '.NET', color: 'bg-danger-subtle text-danger' },
    5: { type: 'text', value: 'C#', color: 'bg-secondary-subtle text-dark' },
    6: { type: 'icon', value: 'fa-solid fa-database', color: 'bg-success-subtle text-success' }
};

const DEFAULT_VISUAL = { 
    type: 'icon', 
    value: 'fa-solid fa-book', 
    color: 'bg-secondary-subtle text-dark' 
};
const DEFAULT_BADGE = 'bg-secondary-subtle text-secondary';

function getCourseStyles(courseId, category) {
    const visual = courseVisuals[courseId] || DEFAULT_VISUAL;
    const badgeColorClass = categoryStyles[category] || DEFAULT_BADGE;

    return { 
        visualData: visual, 
        iconColorClass: visual.color, 
        badgeColorClass: badgeColorClass 
    };
}

function createIconElement(visualData) {
    if (visualData.type === 'icon') {
        const iconElement = document.createElement('i');
        iconElement.className = visualData.value;
        return iconElement;
    } else {
        const textElement = document.createElement('span');
        textElement.textContent = visualData.value; 
        return textElement;
    }
}

function createCourseCard(course) {
    const styles = getCourseStyles(course.id, course.category);

    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const card = document.createElement('div');
    card.className = 'card border-0 shadow-sm p-3 p-lg-4 rounded-4 h-100 course-card';

    const mobileDiv = document.createElement('div');
    mobileDiv.className = 'd-flex d-md-none align-items-center gap-3';

    const mobileIconDiv = document.createElement('div');
    mobileIconDiv.className = `course-icon-mobile ${styles.iconColorClass} rounded-4 d-flex align-items-center justify-content-center fw-bold`;
    mobileIconDiv.appendChild(createIconElement(styles.visualData)); 

    const mobileContentDiv = document.createElement('div');
    mobileContentDiv.className = 'flex-grow-1';

    const mobileTitle = document.createElement('h6');
    mobileTitle.className = 'fw-bold text-dark mb-1 fs-6';
    mobileTitle.textContent = course.title; 

    const mobileSub1 = document.createElement('p');
    mobileSub1.className = 'text-muted mb-1 small';
    mobileSub1.textContent = `${course.category} • ${course.instructor}`; 

    const mobileSub2 = document.createElement('p');
    mobileSub2.className = 'text-muted mb-0 small';
    mobileSub2.textContent = `${course.level} • ${course.duration}`;

    mobileContentDiv.append(mobileTitle, mobileSub1, mobileSub2);
    mobileDiv.append(mobileIconDiv, mobileContentDiv);

    const desktopDiv = document.createElement('div');
    desktopDiv.className = 'course-content d-none d-md-grid';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'course-header';

    const desktopIconDiv = document.createElement('div');
    desktopIconDiv.className = `course-icon ${styles.iconColorClass} rounded-3 d-flex align-items-center justify-content-center fw-bold`;
    desktopIconDiv.appendChild(createIconElement(styles.visualData)); 

    const infoDiv = document.createElement('div');
    infoDiv.className = 'course-info';

    const desktopTitle = document.createElement('h5');
    desktopTitle.className = 'card-title fw-bold text-dark mb-2';
    desktopTitle.textContent = course.title; 

    const badgeContainer = document.createElement('div');
    const badge = document.createElement('span');
    badge.className = `badge ${styles.badgeColorClass} rounded-pill px-3 py-1 fw-medium`;
    badge.textContent = course.category; 
    badgeContainer.appendChild(badge);

    infoDiv.append(desktopTitle, badgeContainer);
    headerDiv.append(desktopIconDiv, infoDiv);

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'course-details';

    const instructorDiv = document.createElement('div');
    instructorDiv.className = 'instructor d-flex align-items-center';
    
    const instructorIcon = document.createElement('i');
    instructorIcon.className = 'fa-solid fa-user text-secondary';
    
    const instructorSpan = document.createElement('span');
    instructorSpan.textContent = course.instructor; 
    
    instructorDiv.append(instructorIcon, instructorSpan);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'course-meta d-flex align-items-center gap-4';

    const durationDiv = document.createElement('div');
    durationDiv.className = 'd-flex align-items-center';
    const clockIcon = document.createElement('i');
    clockIcon.className = 'fa-solid fa-clock text-secondary';
    const durationSpan = document.createElement('span');
    durationSpan.textContent = course.duration; 
    durationDiv.append(clockIcon, durationSpan);

    const levelDiv = document.createElement('div');
    levelDiv.className = 'd-flex align-items-center';
    const levelIcon = document.createElement('i');
    levelIcon.className = 'fa-solid fa-chart-bar text-secondary';
    const levelSpan = document.createElement('span');
    levelSpan.textContent = course.level; 
    levelDiv.append(levelIcon, levelSpan);

    metaDiv.append(durationDiv, levelDiv);
    detailsDiv.append(instructorDiv, metaDiv);
    desktopDiv.append(headerDiv, detailsDiv);

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

function renderCourses(courses) {
    const container = document.getElementById('courses-container');

    if (!container) {
        console.error("Rendering failed: 'courses-container' element not found in the DOM.");
        return; 
    }

    const fragment = document.createDocumentFragment();

    courses.forEach(course => {
        const courseCard = createCourseCard(course);
        fragment.appendChild(courseCard);
    });

    container.replaceChildren(fragment);
}

function filterCourses(courses, searchTerm, selectedCategory) {
    const lowerCaseTerm = searchTerm.toLowerCase().trim();
    
    return courses.filter(course => {
        const matchesSearch = (course.title || '').toLowerCase().includes(lowerCaseTerm);
        const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    
        return matchesSearch && matchesCategory;
    });
}
function updateEmptyState(hasResults) {
    const noResultsElement = document.getElementById('no-results');

    if (!noResultsElement) {
        console.error("Empty state element 'no-results' not found in the DOM.");
        return;
    }

    noResultsElement.classList.toggle('d-none', hasResults);
}

function applyFilters(courses) {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const clearButton = document.getElementById('clear-search');

    if (!searchInput || !categoryFilter) return;

    const searchTerm = searchInput.value;
    const selectedCategory = categoryFilter.value;
    const filteredCourses = filterCourses(courses, searchTerm, selectedCategory);
    renderCourses(filteredCourses);
    updateEmptyState(filteredCourses.length > 0);
    
    if (clearButton) {
        clearButton.classList.toggle('d-none', !searchTerm.trim());
    }
}
function setupSearch(courses) {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');

    if (!searchInput) {
        console.error("Search setup failed: 'search-input' element not found");
        return;
    }

    let debounceTimer;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            applyFilters(courses);
        }, 300); 
    });

    if (clearButton) {
        clearButton.addEventListener('click', () => {
            clearTimeout(debounceTimer); 
            searchInput.value = '';
            applyFilters(courses); 
            searchInput.focus(); 
        });
    }
}

function setupCategoryFilter(courses) {
    const categoryFilter = document.getElementById('category-filter');

    if (!categoryFilter) {
        console.error("Category filter setup failed: 'category-filter' element not found.");
        return;
    }

    categoryFilter.addEventListener('change', () => {
        applyFilters(courses);
    });
}

function setupCourseActions(courses) {
    const container = document.getElementById('courses-container');

    if (!container) {
        console.error("Course actions setup failed: 'courses-container' element not found in the DOM.");
        return;
    }

    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="view-details"]');

        if (!button) return;

        const courseId = Number(button.dataset.courseId);
        const selectedCourse = courses.find(course => course.id === courseId);

        if (!selectedCourse) {
            console.error(`Course with id ${courseId} not found.`);
            return;
        }

        console.log('Selected course:', selectedCourse);
    });
}

async function init() { 
    try {
        const courses = await loadCourses();
        setupSearch(courses); 
        setupCategoryFilter(courses);
        setupCourseActions(courses);
        applyFilters(courses);

        return courses;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        return []; 
    }
}
init();
