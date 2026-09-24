async function loadCoursesCatalog() {
    const response = await fetch('data/courses.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

async function loadMyLearningProgress() {
    const response = await fetch('data/my-learning.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
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
                progress: {
                    lessonsCompleted: Number.isFinite(Number(progress.lessonsCompleted)) ? Number(progress.lessonsCompleted) : 0,
                    totalLessons: Number.isFinite(Number(progress.totalLessons)) ? Number(progress.totalLessons) : 0
                }
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

function setupFavoriteActions() {
    const container = document.getElementById('learning-container');
    if (!container) return;

    container.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="favorite"]');
        if (!button) return;

        const icon = button.querySelector('i');
        if (!icon) return;

        const isActive = button.classList.toggle('is-active');
        icon.classList.toggle('fa-regular', !isActive);
        icon.classList.toggle('fa-solid', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

async function initMyLearning() {
    try {
        const [catalog, progressList] = await Promise.all([
            loadCoursesCatalog(),
            loadMyLearningProgress()
        ]);
        const items = mergeLearningData(catalog, progressList);
        renderLearningCards(items);
        setupFavoriteActions();
    } catch (error) {
        console.error('Failed to initialize My Learning:', error);
    }
}

initMyLearning();
