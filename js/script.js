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


function getCourseStyles(courseId, category) {
    let iconHtml = '<i class="fa-solid fa-book"></i>';
    let iconColorClass = 'bg-secondary-subtle text-dark';
    let badgeColorClass = 'bg-secondary-subtle text-secondary';

    if (category === 'Frontend') badgeColorClass = 'bg-primary-subtle text-primary';
    else if (category === 'Backend') badgeColorClass = 'bg-success-subtle text-success';
    switch (courseId) {
        case 1: iconHtml = '<i class="fa-brands fa-html5"></i>'; iconColorClass = 'bg-warning-subtle text-warning'; break;
        case 2: iconHtml = '<i class="fa-brands fa-css3-alt"></i>'; iconColorClass = 'bg-info-subtle text-info'; break;
        case 3: iconHtml = 'JS'; iconColorClass = 'bg-warning text-dark'; break;
        case 4: iconHtml = '.NET'; iconColorClass = 'bg-danger-subtle text-danger'; break;
        case 5: iconHtml = 'C#'; iconColorClass = 'bg-secondary-subtle text-dark'; break;
        case 6: iconHtml = '<i class="fa-solid fa-database"></i>'; iconColorClass = 'bg-success-subtle text-success'; break;
    }
    return { iconHtml, iconColorClass, badgeColorClass };
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