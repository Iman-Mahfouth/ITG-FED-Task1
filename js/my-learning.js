const LEARNING_COURSES = Object.freeze([
    {
        id: 1,
        title: 'HTML Fundamentals',
        category: 'Frontend',
        instructor: 'John Doe',
        instructorInitials: 'JD',
        rating: 4.9,
        tag: 'Bestseller',
        bannerTheme: 'orange',
        techIcon: 'fa-brands fa-html5',
        lessonsCompleted: 3,
        totalLessons: 5,
        progress: 60,
        actionLabel: 'Continue learning'
    },
    {
        id: 2,
        title: 'CSS Essentials',
        category: 'Frontend',
        instructor: 'Sarah Smith',
        instructorInitials: 'SS',
        rating: 4.8,
        tag: 'Popular',
        bannerTheme: 'purple',
        techIcon: 'fa-brands fa-css3-alt',
        lessonsCompleted: 1,
        totalLessons: 5,
        progress: 20,
        actionLabel: 'Continue learning'
    },
    {
        id: 3,
        title: 'React: From Idea to Interface',
        category: 'Frontend',
        instructor: 'Sarah Smith',
        instructorInitials: 'SS',
        rating: 4.9,
        tag: 'New',
        bannerTheme: 'blue',
        techIcon: 'fa-brands fa-react',
        lessonsCompleted: 0,
        totalLessons: 5,
        progress: 0,
        actionLabel: 'Start first lesson'
    }
]);

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function getProgress(course) {
    if (!course || !Number.isFinite(course.lessonsCompleted) || !Number.isFinite(course.totalLessons) || course.totalLessons <= 0) {
        return 0;
    }

    return Math.max(0, Math.min(100, Math.round((course.lessonsCompleted / course.totalLessons) * 100)));
}

function createCardBanner(course) {
    if (!course) {
        return document.createElement('div');
    }

    const banner = createElement('div', `ml-card-banner ml-card-banner--${course.bannerTheme}`);
    const tag = createElement('span', 'ml-card-tag', course.tag);

    const favoriteButton = document.createElement('button');
    favoriteButton.type = 'button';
    favoriteButton.className = 'ml-card-favorite';
    favoriteButton.dataset.action = 'favorite';
    favoriteButton.dataset.courseId = course.id;
    favoriteButton.setAttribute('aria-label', `Save ${course.title} to favorites`);

    const heart = document.createElement('i');
    heart.className = 'fa-regular fa-heart';
    heart.setAttribute('aria-hidden', 'true');
    favoriteButton.appendChild(heart);

    const art = createElement('div', 'ml-card-editor-art');

    const techBadge = createElement('div', 'ml-card-tech-badge');
    const techIcon = createElement('i', course.techIcon);
    techIcon.setAttribute('aria-hidden', 'true');
    techBadge.appendChild(techIcon);

    const editor = createElement('div', 'ml-card-editor');
    const editorDots = createElement('span', 'ml-card-editor-dots', '•••');
    const editorCode = createElement('span', 'ml-card-editor-code', 'Build something great.');
    editor.append(editorDots, editorCode);

    art.append(techBadge, editor);
    banner.append(tag, favoriteButton, art);

    return banner;
}

function createProgressBar(course) {
    if (!course) {
        return document.createElement('div');
    }

    const progress = getProgress(course);
    const progressWrapper = createElement('div', 'ml-card-progress');
    const progressTrack = createElement('div', 'ml-card-progress-track');
    const progressFill = createElement('div', 'ml-card-progress-fill');
    const progressLabel = createElement('span', 'ml-card-progress-label', `${course.lessonsCompleted} / ${course.totalLessons} lessons`);

    progressFill.style.setProperty('--progress', `${progress}%`);
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-valuenow', String(progress));
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', '100');
    progressTrack.setAttribute('aria-label', `${course.title} progress`);
    progressTrack.appendChild(progressFill);
    progressWrapper.append(progressTrack, progressLabel);

    return progressWrapper;
}

function createCardBody(course) {
    if (!course) {
        return document.createElement('div');
    }

    const body = createElement('div', 'ml-card-body');
    const meta = createElement('div', 'ml-card-meta');
    const category = createElement('span', 'ml-card-category', course.category);
    const rating = createElement('span', 'ml-card-rating');
    const ratingIcon = createElement('i', 'fa-solid fa-star');
    const ratingValue = createElement('span', '', String(course.rating));
    const title = createElement('h2', 'ml-card-title', course.title);
    const instructor = createElement('div', 'ml-card-instructor');
    const avatar = createElement('span', 'ml-card-avatar', course.instructorInitials);
    const instructorName = createElement('span', 'ml-card-instructor-name', course.instructor);

    ratingIcon.setAttribute('aria-hidden', 'true');
    avatar.setAttribute('aria-hidden', 'true');
    rating.append(ratingIcon, ratingValue);
    meta.append(category, rating);
    instructor.append(avatar, instructorName);
    body.append(meta, title, instructor, createProgressBar(course));

    return body;
}

function createLearningCard(course) {
    if (!course || typeof course !== 'object' || !course.title) {
        return null;
    }

    const column = createElement('div', 'col-12 col-md-6 col-lg-4');
    const card = createElement('article', 'ml-card h-100');
    const footer = createElement('div', 'ml-card-footer');
    const action = createElement('button', 'ml-card-action', course.actionLabel);
    const actionIcon = createElement('i', 'fa-solid fa-play');

    action.type = 'button';
    actionIcon.setAttribute('aria-hidden', 'true');
    action.prepend(actionIcon);
    footer.appendChild(action);
    card.append(createCardBanner(course), createCardBody(course), footer);
    column.appendChild(card);

    return column;
}

function renderLearningCards(courses) {
    const container = document.getElementById('learning-container');
    if (!container || !Array.isArray(courses)) {
        return;
    }

    const fragment = document.createDocumentFragment();
    courses.forEach((course) => {
        const card = createLearningCard(course);
        if (card) {
            fragment.appendChild(card);
        }
    });
    container.replaceChildren(fragment);
}
function setupFavoriteActions() {
    const container = document.getElementById('learning-container');

    if (!container) {
        console.error("Favorite actions setup failed: 'learning-container' not found.");
        return;
    }

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

function initMyLearning() {
    try {
        renderLearningCards(LEARNING_COURSES);
        setupFavoriteActions();
    } catch (error) {
        console.error('Unable to render learning cards:', error);
    }
}

initMyLearning();
