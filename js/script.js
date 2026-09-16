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
    1: { icon: '<i class="fa-brands fa-html5"></i>', color: 'bg-warning-subtle text-warning' },
    2: { icon: '<i class="fa-brands fa-css3-alt"></i>', color: 'bg-info-subtle text-info' },
    3: { icon: 'JS', color: 'bg-warning text-dark' },
    4: { icon: '.NET', color: 'bg-danger-subtle text-danger' },
    5: { icon: 'C#', color: 'bg-secondary-subtle text-dark' },
    6: { icon: '<i class="fa-solid fa-database"></i>', color: 'bg-success-subtle text-success' }
};

function getCourseStyles(courseId, category) {
    const defaultVisual = { icon: '<i class="fa-solid fa-book"></i>', color: 'bg-secondary-subtle text-dark' };
    const defaultBadge = 'bg-secondary-subtle text-secondary';

    const visual = courseVisuals[courseId] || defaultVisual;
    const badgeColorClass = categoryStyles[category] || defaultBadge;

    return { 
        iconHtml: visual.icon, 
        iconColorClass: visual.color, 
        badgeColorClass: badgeColorClass 
    };
}
function renderCourses(courses) {
    const container = document.getElementById('courses-container');
    container.innerHTML = '';

    courses.forEach(course => {
        const styles = getCourseStyles(course.id, course.category); 
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4';

        col.innerHTML = `
            <div class="card border-0 shadow-sm p-3 p-lg-4 rounded-4 h-100 course-card">
                <div class="d-flex d-md-none align-items-center gap-3">
                    <div class="course-icon-mobile ${styles.iconColorClass} rounded-4 d-flex align-items-center justify-content-center fw-bold">
                        ${styles.iconHtml}
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="fw-bold text-dark mb-1 fs-6">${course.title}</h6>
                        <p class="text-muted mb-1 small">${course.category} &bull; ${course.instructor}</p>
                        <p class="text-muted mb-0 small">${course.level} &bull; ${course.duration}</p>
                    </div>
                </div>

                <div class="course-content d-none d-md-grid">
                    <div class="course-header">
                        <div class="course-icon ${styles.iconColorClass} rounded-3 d-flex align-items-center justify-content-center fw-bold">
                            ${styles.iconHtml}
                        </div>
                        <div class="course-info">
                            <h5 class="card-title fw-bold text-dark mb-2">${course.title}</h5>
                            <div>
                                <span class="badge ${styles.badgeColorClass} rounded-pill px-3 py-1 fw-medium">
                                    ${course.category}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="course-details">
                        <div class="instructor d-flex align-items-center">
                            <i class="fa-solid fa-user text-secondary"></i>
                            <span>${course.instructor}</span>
                        </div>
                        <div class="course-meta d-flex align-items-center gap-4">
                            <div class="d-flex align-items-center">
                                <i class="fa-solid fa-clock text-secondary"></i>
                                <span>${course.duration}</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <i class="fa-solid fa-chart-bar text-secondary"></i>
                                <span>${course.level}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}
async function init() { 
    try {
        const courses = await loadCourses();
        console.log('Courses loaded successfully:', courses);
        console.log(`Number of courses: ${courses.length}`);
        renderCourses(courses);
        return courses;
    } catch (error) {
        console.error('Failed to initialize app:', error);
        return []; 
    }
}
init();