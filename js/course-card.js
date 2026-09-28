const TECH_THEME_CLASSES = {
    warning: 'bg-warning-subtle text-warning',
    info: 'bg-info-subtle text-info',
    danger: 'bg-danger-subtle text-danger',
    secondary: 'bg-secondary-subtle text-dark',
    success: 'bg-success-subtle text-success',
    default: 'bg-light text-dark'
};

function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className || '';
    if (text !== undefined) element.textContent = text;
    return element;
}

const EMPTY_PROGRESS = { lessonsCompleted: 0, totalLessons: 0 };

function getProgress(progress) {
    if (!progress || progress.totalLessons === 0) return 0;
    return Math.round((progress.lessonsCompleted / progress.totalLessons) * 100);
}

function getInstructorInitials(instructor) {
    return String(instructor || '').trim().split(/\s+/).filter(Boolean)
        .map((name) => name[0]).join('').slice(0, 2).toUpperCase();
}

function createTechContent(techIcon) {
    if (typeof techIcon === 'string' && techIcon.includes('fa-')) {
        const icon = createElement('i', techIcon);
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }
    return createElement('span', '', techIcon || '');
}

function createCardBanner(course) {
    const banner = createElement('div', `ml-card-banner ml-card-banner--${course.bannerTheme || 'orange'}`);
    const tag = createElement('span', 'ml-card-tag', course.tag || 'New');
    const favoriteButton = document.createElement('button');
    const heart = createElement('i', 'fa-regular fa-heart');
    const art = createElement('div', 'ml-card-editor-art');
    const themeKey = course.techTheme || 'default';
    const themeClass = TECH_THEME_CLASSES[themeKey] || TECH_THEME_CLASSES.default;
    const techBadge = createElement('div', `ml-card-tech-badge ${themeClass}`.trim());
    const editor = createElement('div', 'ml-card-editor');

    favoriteButton.type = 'button';
    favoriteButton.className = 'ml-card-favorite';
    favoriteButton.dataset.action = 'favorite';
    favoriteButton.dataset.courseId = String(course.id);
    favoriteButton.setAttribute('aria-label', `Save ${course.title || 'course'} to favorites`);
    favoriteButton.setAttribute('aria-pressed', 'false');
    heart.setAttribute('aria-hidden', 'true');
    favoriteButton.appendChild(heart);

    const favorited = typeof isFavorite === 'function' ? isFavorite(course.id) : false;
    if (favorited) {
        favoriteButton.classList.add('is-active');
        heart.classList.remove('fa-regular');
        heart.classList.add('fa-solid');
        favoriteButton.setAttribute('aria-pressed', 'true');
    }

    techBadge.appendChild(createTechContent(course.techIcon));
    editor.append(
        createElement('span', 'ml-card-editor-dots', '•••'),
        createElement('span', 'ml-card-editor-code', course.codeSnippet || '')
    );
    art.append(techBadge, editor);
    banner.append(tag, favoriteButton, art);
    return banner;
}

function createProgressBar(course, progress) {
    const safeProgress = progress || EMPTY_PROGRESS;
    const percentage = getProgress(safeProgress);
    const progressWrapper = createElement('div', 'ml-card-progress');
    const progressTrack = createElement('div', 'ml-card-progress-track');
    const progressFill = createElement('div', 'ml-card-progress-fill');
    const progressLabel = createElement('span', 'ml-card-progress-label', 
        `${safeProgress.lessonsCompleted || 0} / ${safeProgress.totalLessons || 0} lessons`);

    progressFill.style.setProperty('--progress', `${percentage}%`);
    progressTrack.setAttribute('role', 'progressbar');
    progressTrack.setAttribute('aria-valuenow', String(percentage));
    progressTrack.setAttribute('aria-valuemin', '0');
    progressTrack.setAttribute('aria-valuemax', '100');
    progressTrack.setAttribute('aria-label', `${course.title || 'Course'} progress`);
    progressTrack.appendChild(progressFill);
    progressWrapper.append(progressTrack, progressLabel);
    return progressWrapper;
}

function createCardBody(course, progress, options = {}) {
    const body = createElement('div', 'ml-card-body');
    const meta = createElement('div', 'ml-card-meta');
    const rating = createElement('span', 'ml-card-rating');
    const ratingIcon = createElement('i', 'fa-solid fa-star');
    const instructor = createElement('div', 'ml-card-instructor');
    const avatar = createElement('span', 'ml-card-avatar', getInstructorInitials(course.instructor));

    ratingIcon.setAttribute('aria-hidden', 'true');
    avatar.setAttribute('aria-hidden', 'true');
    rating.append(ratingIcon, createElement('span', '', String(course.rating ?? '')));
    meta.append(createElement('span', 'ml-card-category', course.category || ''), rating);
    instructor.append(avatar, createElement('span', 'ml-card-instructor-name', course.instructor || ''));
    body.append(meta, createElement('h2', 'ml-card-title', course.title || ''), instructor);

    if (options.variant !== 'favorites' && progress) {
        body.appendChild(createProgressBar(course, progress));
    }
    return body;
}

function createFavoritesFooter(course) {
    const footer = createElement('div', 'ml-favorites-card-footer');
    const details = createElement('div', 'ml-favorites-card-details');
    const clockIcon = createElement('i', 'fa-regular fa-clock');
    clockIcon.setAttribute('aria-hidden', 'true');
    const durationSpan = createElement('span', '', course.duration || '');
    const levelIcon = createElement('i', 'fa-solid fa-chart-simple');
    levelIcon.setAttribute('aria-hidden', 'true');
    const levelSpan = createElement('span', '', course.level || '');
    details.append(clockIcon, durationSpan, levelIcon, levelSpan);

    const action = createElement('a', 'ml-favorites-card-action', 'Start course');
    action.href = '#';
    const actionIcon = createElement('i', 'fa-solid fa-arrow-right');
    actionIcon.setAttribute('aria-hidden', 'true');
    action.appendChild(actionIcon);

    footer.append(details, action);
    return footer;
}

function createLearningCard(course, progress, options = {}) {
    if (!course || typeof course !== 'object' || !course.title) return null;

    const safeProgress = progress || null;
    const lessonsCompleted = safeProgress ? (safeProgress.lessonsCompleted || 0) : 0;

    const column = createElement('div', 'col-12 col-md-6 col-lg-4');
    column.setAttribute('data-course-card', String(course.id));

    const card = createElement('article', 'ml-card h-100');
    const footer = createElement('div', 'ml-card-footer');
    const action = createElement(
        'button',
        'ml-card-action',
        lessonsCompleted > 0 ? 'Continue learning' : 'Start first lesson'
    );
    const actionIcon = createElement('i', 'fa-solid fa-play');

    action.type = 'button';
    actionIcon.setAttribute('aria-hidden', 'true');
    action.prepend(actionIcon);
    footer.appendChild(action);

    card.append(
        createCardBanner(course),
        createCardBody(course, safeProgress, options)
    );
    card.append(
        options.variant === 'favorites' ? createFavoritesFooter(course) : footer
    );
    column.appendChild(card);

    return column;
}