/* ==========================================================================
   Course Details Page Controller (API-03)
   Fetch happens in loadCourse(). Render functions are pure DOM builders.
   All API strings are rendered strictly via textContent (no innerHTML).
   ========================================================================== */

const SLUG_RE = /^[a-z0-9-]+$/i;
const STATE_NAMES = ['loading', 'error', 'not-found', 'success', 'no-sections'];

let currentSlug = '';

/* --------------------------------------------------------------------------
   DOM Helpers (Pure builders)
   -------------------------------------------------------------------------- */
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
}

function hasText(value) {
    return typeof value === 'string' && value.trim() !== '';
}

function getStateContainers() {
    const map = {};
    document.querySelectorAll('[data-state]').forEach((node) => {
        const name = node.getAttribute('data-state');
        if (STATE_NAMES.includes(name)) map[name] = node;
    });
    return map;
}

/* --------------------------------------------------------------------------
   Favorites Integration (uses course.id, wired to favorites-storage)
   -------------------------------------------------------------------------- */
function isCourseFavorited(courseId) {
    return typeof isFavorite === 'function' ? isFavorite(courseId) : false;
}

function toggleCourseFavorited(courseId) {
    if (typeof toggleFavorite !== 'function') return false;
    const result = toggleFavorite(courseId);
    if (!result || typeof result.removed !== 'boolean') return false;

    document.dispatchEvent(new CustomEvent('favorite:changed', {
        bubbles: true,
        detail: { courseId, removed: result.removed }
    }));

    return result.removed;
}

/* --------------------------------------------------------------------------
   Tags & Badges
   -------------------------------------------------------------------------- */
function createTagsFragment(tags) {
    if (!Array.isArray(tags) || tags.length === 0) return null;

    const frag = document.createDocumentFragment();
    tags.slice(0, 12).forEach((tag) => {
        if (!hasText(tag)) return;
        frag.appendChild(
            el('span', 'badge rounded-pill cd-tag-chip', tag.trim())
        );
    });
    return frag.childNodes.length > 0 ? frag : null;
}

/* --------------------------------------------------------------------------
   Features Checklist (Object iteration only, no Array checks)
   -------------------------------------------------------------------------- */
const FEATURE_LABELS = Object.freeze({
    quiz:           'Quiz included',
    glossary:       'Glossary',
    furtherReading: 'Further reading',
    selfPaced:      'Self-paced',
    free:           'Free access'
});

function getFeatureLabel(key, value) {
    if (key === 'interactiveCharts' && typeof value === 'number' && value > 0) {
        return `${value} interactive charts`;
    }
    if (value === true && FEATURE_LABELS[key]) {
        return FEATURE_LABELS[key];
    }
    return '';
}

function createFeatures(features) {
    if (!features || typeof features !== 'object' || Array.isArray(features)) return null;

    const list = el('ul', 'list-unstyled mb-4 d-flex flex-column gap-2');
    const knownKeys = ['quiz', 'glossary', 'furtherReading', 'interactiveCharts', 'selfPaced', 'free'];

    knownKeys.forEach((key) => {
        const label = getFeatureLabel(key, features[key]);
        if (!label) return;

        const item = el('li', 'd-flex align-items-center gap-2 cd-features-item');
        const icon = el('i', 'fa-solid fa-check text-success flex-shrink-0');
        icon.setAttribute('aria-hidden', 'true');
        const text = el('span', '', label);

        item.append(icon, text);
        list.appendChild(item);
    });

    return list.childElementCount > 0 ? list : null;
}

/* --------------------------------------------------------------------------
   Sections / Roadmap (string[] handling only)
   -------------------------------------------------------------------------- */
function createSectionsRoadmap(sections) {
    const card = el('div', 'card border-0 shadow-sm p-4 p-md-5 cd-roadmap-card');
    
    // Header
    const smallLabel = el('div', 'small text-uppercase text-muted fw-semibold mb-1', 'One step at a time');
    const titleRow = el('div', 'd-flex justify-content-between align-items-center mb-1 flex-wrap gap-2');
    const heading = el('h2', 'h4 fw-bold text-dark mb-0', 'Your course roadmap');
    
    const countBadge = el('span', 'badge bg-light text-secondary border rounded-pill px-3 py-2 fw-medium');
    const count = Array.isArray(sections) ? sections.length : 0;
    countBadge.textContent = `${count} ${count === 1 ? 'section' : 'sections'}`;
    titleRow.append(heading, countBadge);

    const subtitle = el('p', 'text-muted small mb-4', 'Small lessons. Practical skills. Real progress.');

    // Sections List
    const list = el('div', 'cd-sections-list d-flex flex-column gap-2');
    const fragment = document.createDocumentFragment();

    sections.forEach((title, index) => {
        if (!hasText(title)) return;

        const row = el('div', 'cd-section-row d-flex align-items-center justify-content-between p-3');
        const leftWrap = el('div', 'd-flex align-items-center gap-3 min-w-0');
        
        const numBadge = el('span', 'cd-section-num', String(index + 1).padStart(2, '0'));
        const titleSpan = el('span', 'cd-section-title', title.trim());
        leftWrap.append(numBadge, titleSpan);

        const plusIcon = el('i', 'fa-solid fa-plus text-muted flex-shrink-0 ms-2');
        plusIcon.setAttribute('aria-hidden', 'true');

        row.append(leftWrap, plusIcon);
        fragment.appendChild(row);
    });

    list.appendChild(fragment);

    // Static Footer Note
    const footerNote = el('div', 'pt-3 border-top mt-3 d-flex align-items-center gap-2 text-muted small');
    const bookIcon = el('i', 'fa-regular fa-book-open text-muted');
    bookIcon.setAttribute('aria-hidden', 'true');
    footerNote.append(bookIcon, el('span', '', 'Short readings, code examples, and a little practice of your own.'));

    card.append(smallLabel, titleRow, subtitle, list, footerNote);
    return card;
}

/* --------------------------------------------------------------------------
   Empty Roadmap (NO-SECTIONS state)
   -------------------------------------------------------------------------- */
function createEmptyRoadmap() {
    const card = el('div', 'card border-0 shadow-sm p-4 p-md-5 cd-roadmap-card text-center');

    const smallLabel = el('div', 'small text-uppercase text-muted fw-semibold mb-1 text-start', 'One step at a time');
    const heading = el('h2', 'h4 fw-bold text-dark mb-4 text-start', 'Your course roadmap');

    const emptyBody = el('div', 'py-4 text-center');
    const icon = el('i', 'fa-regular fa-folder-open fs-1 text-muted mb-3 d-block');
    icon.setAttribute('aria-hidden', 'true');
    const title = el('h3', 'h6 fw-semibold text-dark mb-1', 'No sections available yet');
    const subtext = el('p', 'text-muted small mb-0', 'This course does not include section information yet.');

    emptyBody.append(icon, title, subtext);
    card.append(smallLabel, heading, emptyBody);
    return card;
}

/* --------------------------------------------------------------------------
   Hero Block (Top green card)
   -------------------------------------------------------------------------- */
function createHeroCard(course) {
    const card = el('div', 'cd-hero-card p-4 p-md-5 mb-4');

    // Tags & Badges
    const badgeRow = el('div', 'd-flex flex-wrap align-items-center gap-2 mb-3');
    
    const rawTrack = hasText(course.rawTrack) ? course.rawTrack.trim() : '';
    const rawLevel = hasText(course.rawLevel) ? course.rawLevel.trim() : '';

    if (rawTrack) {
        const trackBadge = el('span', 'badge rounded-pill cd-tag-chip', rawTrack);
        badgeRow.appendChild(trackBadge);
    }
    if (rawLevel) {
        const levelBadge = el('span', 'badge rounded-pill cd-tag-chip', rawLevel);
        badgeRow.appendChild(levelBadge);
    }

    const tagsFrag = createTagsFragment(course.tags);
    if (tagsFrag) badgeRow.appendChild(tagsFrag);

    if (badgeRow.childElementCount > 0) card.appendChild(badgeRow);

    // Title (h1 focused on render for a11y)
    const title = el('h1', 'cd-hero-title fw-bold display-6 mb-3', course.title);
    title.id = 'course-details-title';
    title.tabIndex = -1;
    card.appendChild(title);

    // Description (if present)
    if (hasText(course.description)) {
        const desc = el('p', 'cd-hero-desc fs-6 mb-3', course.description.trim());
        card.appendChild(desc);
    }

    // Meta row (Slides, Format, etc. — strictly NO fake data)
    const metaRow = el('div', 'd-flex flex-wrap align-items-center gap-3 text-muted small mt-3');
    if (Number.isFinite(course.slides) && course.slides > 0) {
        const slidesItem = el('span', 'd-inline-flex align-items-center gap-1');
        const icon = el('i', 'fa-solid fa-file-lines text-secondary');
        icon.setAttribute('aria-hidden', 'true');
        slidesItem.append(icon, el('span', '', `${course.slides} slides`));
        metaRow.appendChild(slidesItem);
    }
    if (hasText(course.format)) {
        const formatItem = el('span', 'd-inline-flex align-items-center gap-1');
        const icon = el('i', 'fa-solid fa-layer-group text-secondary');
        icon.setAttribute('aria-hidden', 'true');
        formatItem.append(icon, el('span', '', course.format.trim()));
        metaRow.appendChild(formatItem);
    }

    if (metaRow.childElementCount > 0) card.appendChild(metaRow);

    return card;
}

/* --------------------------------------------------------------------------
   Right Panel ("Keep your curiosity going" Aside)
   -------------------------------------------------------------------------- */
function createCuriosityAside(course) {
    const wrap = el('aside', 'd-flex flex-column');

    const card = el('div', 'card border-0 shadow-sm p-4 cd-curiosity-card');

    // Label & Heading
    const smallLabel = el('div', 'small text-uppercase text-muted fw-semibold mb-1', 'Your next small step');
    const heading = el('h2', 'h5 fw-bold text-dark mb-1', 'Keep your curiosity going.');
    const subtitle = el('p', 'text-muted small mb-3', 'Explore lessons and build your skills at your own pace.');
    card.append(smallLabel, heading, subtitle);

    // Slides count block (only if slides exist, strictly no fake progress)
    if (Number.isFinite(course.slides) && course.slides > 0) {
        const slidesBox = el('div', 'p-3 rounded-3 bg-light border mb-3 d-flex align-items-center gap-2');
        const icon = el('i', 'fa-solid fa-file-lines text-secondary');
        icon.setAttribute('aria-hidden', 'true');
        const text = el('span', 'small fw-semibold text-dark', `${course.slides} slides total`);
        slidesBox.append(icon, text);
        card.appendChild(slidesBox);
    }

    // Primary CTA: Open original course (external link)
    if (course.externalUrl && /^https:\/\//i.test(course.externalUrl)) {
        const primaryCta = el('a', 'btn cd-btn-lime w-100 rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-2');
        primaryCta.href = course.externalUrl;
        primaryCta.target = '_blank';
        primaryCta.rel = 'noopener noreferrer';
        primaryCta.append(el('span', '', 'Open original course'), el('i', 'fa-solid fa-arrow-up-right-from-square small'));
        primaryCta.setAttribute('aria-label', 'Open original course in new window');
        card.appendChild(primaryCta);
    }

    // Secondary CTA: Save to favorites button (wired to favorites storage)
    const isFav = isCourseFavorited(course.id);
    const favBtn = el('button', `btn btn-outline-secondary cd-btn-fav w-100 rounded-3 py-2 fw-medium d-flex align-items-center justify-content-center gap-2 mb-4 ${isFav ? 'is-favorited' : ''}`);
    favBtn.type = 'button';
    favBtn.setAttribute('data-action', 'favorite');
    favBtn.setAttribute('aria-pressed', isFav ? 'true' : 'false');
    
    const favIcon = el('i', isFav ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart');
    favIcon.setAttribute('aria-hidden', 'true');
    const favText = el('span', '', isFav ? 'Saved to favorites' : 'Save to favorites');
    favBtn.append(favIcon, favText);

    favBtn.addEventListener('click', () => {
        const removed = toggleCourseFavorited(course.id);
        const nextFav = !removed;
        favBtn.classList.toggle('is-favorited', nextFav);
        favBtn.setAttribute('aria-pressed', nextFav ? 'true' : 'false');
        favIcon.className = nextFav ? 'fa-solid fa-heart text-danger' : 'fa-regular fa-heart';
        favText.textContent = nextFav ? 'Saved to favorites' : 'Save to favorites';
    });

    card.appendChild(favBtn);

    // Features Checklist
    const featuresList = createFeatures(course.features);
    if (featuresList) {
        card.appendChild(featuresList);
    }

    // Card footer note
    const footerNote = el('div', 'text-center pt-3 border-top');
    footerNote.appendChild(el('span', 'text-muted small', 'A little progress, every single day.'));
    card.appendChild(footerNote);

    wrap.appendChild(card);

    // Decorative quote below card
    const quote = el('div', 'cd-quote text-center mt-3 px-2');
    const sparkle = el('i', 'fa-solid fa-wand-magic-sparkles text-warning me-1');
    sparkle.setAttribute('aria-hidden', 'true');
    quote.append(sparkle, el('span', '', "You don't have to see the whole staircase. Just take the first step."));
    wrap.appendChild(quote);

    return wrap;
}

/* --------------------------------------------------------------------------
   Top Navigation Bar (Back Link & Inspiration)
   -------------------------------------------------------------------------- */
function createTopNav() {
    const wrap = el('div', 'd-flex justify-content-between align-items-center mb-3');
    
    const backLink = el('a', 'cd-back-link text-decoration-none d-inline-flex align-items-center gap-2');
    backLink.href = 'index.html';
    const icon = el('i', 'fa-solid fa-arrow-left');
    icon.setAttribute('aria-hidden', 'true');
    backLink.append(icon, el('span', '', 'Back to courses'));

    const tag = el('span', 'text-muted small d-none d-md-inline');
    const compass = el('i', 'fa-regular fa-compass me-1');
    compass.setAttribute('aria-hidden', 'true');
    tag.append(compass, el('span', '', 'A little learning. A world of possibility.'));

    wrap.append(backLink, tag);
    return wrap;
}

/* --------------------------------------------------------------------------
   Two-Column Page Layout Builder (Desktop 2-col, Mobile single-col)
   -------------------------------------------------------------------------- */
function buildLeftColumn(course, roadmapNode) {
    const mainCol = el('div', 'col-12 col-lg-8');
    mainCol.append(createHeroCard(course), roadmapNode);
    return mainCol;
}

function buildRightColumn(course) {
    const sideCol = el('div', 'col-12 col-lg-4');
    sideCol.appendChild(createCuriosityAside(course));
    return sideCol;
}

function renderTwoColumnLayout(course, roadmapNode) {
    const root = el('div', 'container my-3 my-lg-4');
    root.appendChild(createTopNav());

    const row = el('div', 'row g-4');
    row.append(buildLeftColumn(course, roadmapNode), buildRightColumn(course));
    root.appendChild(row);
    return root;
}

/* --------------------------------------------------------------------------
   State Renderers
   -------------------------------------------------------------------------- */
function renderSuccess(course) {
    const roadmap = createSectionsRoadmap(course.sections);
    return renderTwoColumnLayout(course, roadmap);
}

function renderNoSections(course) {
    const emptyRoadmap = createEmptyRoadmap();
    return renderTwoColumnLayout(course, emptyRoadmap);
}

function renderError() {
    const wrap = el('div', 'container my-5 py-5 text-center');
    wrap.setAttribute('role', 'alert');

    const icon = el('i', 'fa-solid fa-triangle-exclamation fs-1 text-danger mb-3 d-block');
    icon.setAttribute('aria-hidden', 'true');

    const title = el('h1', 'h4 fw-bold text-dark mb-2', 'Something went wrong. Please try again.');
    const desc = el('p', 'text-muted mb-4', "We couldn't load this course. Please check your connection and try again.");
    
    const retryBtn = el('button', 'btn btn-primary rounded-3 px-4 py-2 fw-medium', 'Try again');
    retryBtn.type = 'button';
    retryBtn.addEventListener('click', () => loadCourse(currentSlug), { once: true });

    wrap.append(icon, title, desc, retryBtn);
    return wrap;
}

function renderNotFound() {
    const wrap = el('div', 'container my-5 py-5 text-center');

    const icon = el('i', 'fa-regular fa-circle-question fs-1 text-muted mb-3 d-block');
    icon.setAttribute('aria-hidden', 'true');

    const title = el('h1', 'h4 fw-bold text-dark mb-2', 'Course not found');
    const desc = el('p', 'text-muted mb-4', "The course you're looking for doesn't exist or was removed.");
    
    const backBtn = el('a', 'btn btn-outline-primary rounded-3 px-4 py-2 fw-medium', 'Browse courses');
    backBtn.href = 'index.html';

    wrap.append(icon, title, desc, backBtn);
    return wrap;
}

/* --------------------------------------------------------------------------
   Footer Attribution Sync
   -------------------------------------------------------------------------- */
function syncFooterAttribution(course) {
    const attrEl = document.getElementById('cd-footer-attribution');
    if (!attrEl) return;

    const parts = ['Content © ImpactMojo'];
    if (course && typeof course.license === 'string' && course.license.trim()) {
        parts.push(course.license.trim());
    }
    parts.push('https://impactmojo.in');

    attrEl.textContent = parts.join(' — ');
}

/* --------------------------------------------------------------------------
   State Controller
   -------------------------------------------------------------------------- */
function setState(name, payload = {}) {
    const containers = getStateContainers();
    const main = document.querySelector('main.course-details-page');

    STATE_NAMES.forEach((stateName) => {
        const node = containers[stateName];
        if (!node) return;
        const match = stateName === name;
        node.hidden = !match;
        if (match) node.removeAttribute('hidden');
    });

    if (main) {
        main.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');
    }

    if (name === 'loading') return;

    const target = containers[name];
    if (!target) return;

    let node = null;
    if (name === 'success') {
        node = renderSuccess(payload.course);
        syncFooterAttribution(payload.course);
    } else if (name === 'no-sections') {
        node = renderNoSections(payload.course);
        syncFooterAttribution(payload.course);
    } else if (name === 'error') {
        node = renderError();
    } else if (name === 'not-found') {
        node = renderNotFound();
    }

    if (node) {
        target.replaceChildren(node);
    }
}

function focusPageHeading(container) {
    if (!container) return;
    const heading = container.querySelector('h1');
    if (heading) heading.focus();
}

/* --------------------------------------------------------------------------
   Data Loading & Page Initialization
   -------------------------------------------------------------------------- */
async function loadCourse(slug) {
    setState('loading');

    try {
        const course = await fetchCourseBySlug(slug);
        const hasSections = Array.isArray(course.sections) && course.sections.length > 0;
        const stateName = hasSections ? 'success' : 'no-sections';
        setState(stateName, { course });
        focusPageHeading(getStateContainers()[stateName]);
    } catch (err) {
        if (err && (err.status === 404 || err.status === 400)) {
            setState('not-found');
        } else {
            setState('error');
        }
    }
}

function init() {
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get('course') || '').trim();

    // Missing or invalid slug -> immediately not-found (no fetch)
    if (!slug || !SLUG_RE.test(slug)) {
        setState('not-found');
        return;
    }

    currentSlug = slug;
    loadCourse(currentSlug);
}

init();
