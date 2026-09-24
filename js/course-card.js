function createElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className || '';
    if (text !== undefined) element.textContent = text;
    return element;
}

function getProgress(progress) {
    const lessonsCompleted = Number(progress?.lessonsCompleted);
    const totalLessons = Number(progress?.totalLessons);
    if (!Number.isFinite(lessonsCompleted) || !Number.isFinite(totalLessons) || totalLessons <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((lessonsCompleted / totalLessons) * 100)));
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
    const techBadge = createElement('div', `ml-card-tech-badge ${course.techColor || ''}`.trim());
    const editor = createElement('div', 'ml-card-editor');

    favoriteButton.type = 'button';
    favoriteButton.className = 'ml-card-favorite';
    favoriteButton.dataset.action = 'favorite';
    favoriteButton.dataset.courseId = String(course.id);
    favoriteButton.setAttribute('aria-label', `Save ${course.title || 'course'} to favorites`);
    favoriteButton.setAttribute('aria-pressed', 'false');
    heart.setAttribute('aria-hidden', 'true');
    favoriteButton.appendChild(heart);

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
    const safeProgress = {
        lessonsCompleted: Number.isFinite(Number(progress?.lessonsCompleted)) ? Number(progress.lessonsCompleted) : 0,
        totalLessons: Number.isFinite(Number(progress?.totalLessons)) ? Number(progress.totalLessons) : 0
    };
    const percentage = getProgress(safeProgress);
    const progressWrapper = createElement('div', 'ml-card-progress');
    const progressTrack = createElement('div', 'ml-card-progress-track');
    const progressFill = createElement('div', 'ml-card-progress-fill');
    const progressLabel = createElement('span', 'ml-card-progress-label', `${safeProgress.lessonsCompleted} / ${safeProgress.totalLessons} lessons`);

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

function createCardBody(course, progress) {
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
    body.append(meta, createElement('h2', 'ml-card-title', course.title || ''), instructor, createProgressBar(course, progress));
    return body;
}

function createLearningCard(course, progress) {
    if (!course || typeof course !== 'object' || !course.title) return null;

    const lessonsCompleted = Number.isFinite(Number(progress?.lessonsCompleted)) ? Number(progress.lessonsCompleted) : 0;
    const column = createElement('div', 'col-12 col-md-6 col-lg-4');
    const card = createElement('article', 'ml-card h-100');
    const footer = createElement('div', 'ml-card-footer');
    const action = createElement('button', 'ml-card-action', lessonsCompleted > 0 ? 'Continue learning' : 'Start first lesson');
    const actionIcon = createElement('i', 'fa-solid fa-play');

    action.type = 'button';
    actionIcon.setAttribute('aria-hidden', 'true');
    action.prepend(actionIcon);
    footer.appendChild(action);
    card.append(createCardBanner(course), createCardBody(course, progress), footer);
    column.appendChild(card);
    return column;
}
