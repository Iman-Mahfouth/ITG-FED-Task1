/* ==========================================================================
   Course Details Page Controller (API-03)
   Fetch happens in loadCourse(). Render functions are pure DOM builders.
   All API strings are rendered strictly via textContent (no innerHTML).
   ========================================================================== */

(function () {
    'use strict';

    const SLUG_RE = /^[a-z0-9-]+$/i;
    const STATE_NAMES = ['loading', 'error', 'not-found', 'success', 'no-sections'];
    const DEFAULT_TITLE = 'Course details · MyCourses';
    const MAX_TAGS = 6;

    // Mockup slots the API has no data for (duration, instructor, rating,
    // progress, project) are rendered with this value — never invented.
    const EMPTY_VALUE = '';

    const TECH_THEME_CLASSES = Object.freeze({
        warning:   'bg-warning-subtle text-warning',
        info:      'bg-info-subtle text-info',
        danger:    'bg-danger-subtle text-danger',
        secondary: 'bg-secondary-subtle text-dark',
        success:   'bg-success-subtle text-success',
        default:   'bg-light text-dark'
    });

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

    function icon(className) {
        const node = el('i', className);
        node.setAttribute('aria-hidden', 'true');
        return node;
    }

    function hasText(value) {
        return typeof value === 'string' && value.trim() !== '';
    }

    function emptyValue(className) {
        const node = el('span', `cd-empty-value ${className || ''}`.trim(), EMPTY_VALUE);
        node.dataset.empty = 'true';
        return node;
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
    function createTagsFragment(tags, excluded = []) {
        if (!Array.isArray(tags) || tags.length === 0) return null;

        const skip = new Set(excluded.filter(hasText).map((v) => v.trim().toLowerCase()));
        const frag = document.createDocumentFragment();
        let count = 0;

        tags.forEach((tag) => {
            if (count >= MAX_TAGS || !hasText(tag)) return;
            const label = tag.trim();
            if (skip.has(label.toLowerCase())) return;
            skip.add(label.toLowerCase());
            frag.appendChild(el('span', 'badge cd-tag-chip', label));
            count += 1;
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
            item.append(icon('fa-solid fa-check fa-fw cd-features-icon flex-shrink-0'), el('span', '', label));
            list.appendChild(item);
        });

        return list.childElementCount > 0 ? list : null;
    }

    /* --------------------------------------------------------------------------
       Hero Block (full-width green card + decorative art)
       -------------------------------------------------------------------------- */
    function createHeroBadges(course) {
        const badgeRow = el('div', 'd-flex flex-wrap align-items-center gap-2 mb-3');

        const rawTrack = hasText(course.rawTrack) ? course.rawTrack.trim() : '';
        const rawLevel = hasText(course.rawLevel) ? course.rawLevel.trim() : '';
        const highlight = hasText(course.tag) ? course.tag.trim() : '';

        if (rawTrack) badgeRow.appendChild(el('span', 'badge cd-tag-chip', rawTrack));
        if (rawLevel) {
            const levelChip = el('span', 'badge cd-tag-chip');
            levelChip.append(icon('fa-solid fa-signal me-1'), document.createTextNode(rawLevel));
            badgeRow.appendChild(levelChip);
        }
        if (highlight) {
            badgeRow.appendChild(el('span', 'badge cd-tag-chip cd-tag-chip--highlight', highlight));
        }

        const tagsFrag = createTagsFragment(course.tags, [rawTrack, rawLevel, highlight]);
        if (tagsFrag) badgeRow.appendChild(tagsFrag);

        return badgeRow.childElementCount > 0 ? badgeRow : null;
    }

    function createMetaItem(iconClass, text) {
        const item = el('span', 'd-inline-flex align-items-center gap-1');
        item.append(icon(iconClass), el('span', '', text));
        return item;
    }

    function createHeroMeta(course) {
        const meta = el('div', 'cd-hero-meta d-flex flex-wrap align-items-center column-gap-3 row-gap-2 small');

        const creator = el('span', 'd-inline-flex align-items-center gap-2');
        const avatar = el('span', 'cd-avatar cd-avatar--sm');
        avatar.setAttribute('aria-hidden', 'true');
        creator.append(avatar, el('span', '', 'Created by'), emptyValue('fw-semibold'));

        const rating = el('span', 'd-inline-flex align-items-center gap-1');
        rating.append(icon('fa-regular fa-star'), emptyValue('fw-semibold'), el('span', '', 'course rating'));

        meta.append(creator, rating);

        if (Number.isFinite(course.slides) && course.slides > 0) {
            meta.appendChild(createMetaItem('fa-regular fa-file-lines', `${course.slides} slides`));
        }
        if (hasText(course.format)) {
            meta.appendChild(createMetaItem('fa-solid fa-layer-group', course.format.trim()));
        }
        return meta;
    }

    function createHeroArt(course) {
        if (!hasText(course.bannerTheme) || !hasText(course.techIcon)) return null;

        const wrap = el('div', 'cd-hero-art');
        wrap.setAttribute('aria-hidden', 'true');

        const banner = el('div', `ml-card-banner ml-card-banner--${course.bannerTheme.trim()}`);
        if (hasText(course.tag)) banner.appendChild(el('span', 'ml-card-tag', course.tag.trim()));

        const art = el('div', 'ml-card-editor-art');
        const themeClass = TECH_THEME_CLASSES[course.techTheme] || TECH_THEME_CLASSES.default;
        const techBadge = el('div', `ml-card-tech-badge ${themeClass}`);
        techBadge.appendChild(icon(course.techIcon.trim()));
        art.appendChild(techBadge);

        if (hasText(course.codeSnippet)) {
            const editor = el('div', 'ml-card-editor');
            editor.append(
                el('span', 'ml-card-editor-dots', '•••'),
                el('span', 'ml-card-editor-code', course.codeSnippet.trim())
            );
            art.appendChild(editor);
        }

        banner.appendChild(art);
        wrap.appendChild(banner);
        return wrap;
    }

    function createHeroCard(course) {
        const card = el('section', 'cd-hero-card p-4 p-lg-5 mb-4');
        card.setAttribute('aria-labelledby', 'course-details-title');

        const row = el('div', 'row g-4 align-items-center');
        const textCol = el('div', 'col-12 col-md-7');

        const badges = createHeroBadges(course);
        if (badges) textCol.appendChild(badges);

        const title = el('h1', 'cd-hero-title fw-bold display-6 mb-3', course.title);
        title.id = 'course-details-title';
        title.tabIndex = -1;
        textCol.appendChild(title);

        if (hasText(course.description)) {
            textCol.appendChild(el('p', 'cd-hero-desc fs-6 mb-3', course.description.trim()));
        }

        textCol.appendChild(createHeroMeta(course));
        row.appendChild(textCol);

        const art = createHeroArt(course);
        if (art) {
            const artCol = el('div', 'col-12 col-md-5');
            artCol.appendChild(art);
            row.appendChild(artCol);
        }

        card.appendChild(row);
        return card;
    }

    /* --------------------------------------------------------------------------
       Stats Row (Duration / Sections / Pace)
       -------------------------------------------------------------------------- */
    function createStat(iconClass, value, label) {
        const item = el('div', 'col-12 col-sm-4 d-flex align-items-start gap-2');
        const text = el('div', 'd-flex flex-column min-w-0');
const valueNode = hasText(value) ? el('span', 'cd-stat-value', value) : emptyValue('cd-stat-value');        text.append(valueNode, el('span', 'cd-stat-label', label));
        item.append(icon(`${iconClass} cd-stat-icon`), text);
        return item;
    }

    function createStatsRow(course) {
        const row = el('div', 'row g-3 cd-stats pb-4 mb-4');
        const sectionCount = Array.isArray(course.sections) ? course.sections.length : 0;
        const selfPaced = Boolean(course.features && course.features.selfPaced === true);

        row.append(
            createStat('fa-regular fa-clock', null, 'Duration'),
            createStat('fa-solid fa-book-open', sectionCount > 0 ? `${sectionCount} ${sectionCount === 1 ? 'section' : 'sections'}` : null, 'In this course'),
            createStat('fa-regular fa-compass', selfPaced ? 'At your own pace' : null, 'Make room to grow')
        );
        return row;
    }

    /* --------------------------------------------------------------------------
       "What you'll build" (no API field — structure only)
       -------------------------------------------------------------------------- */
    function createBuildCard() {
        const card = el('div', 'cd-build-card d-flex align-items-start gap-3 p-3 p-md-4 mb-4');

        const badge = el('span', 'cd-build-icon');
        badge.appendChild(icon('fa-solid fa-wand-magic-sparkles'));

        const text = el('div', 'min-w-0');
        text.append(
            el('div', 'cd-eyebrow mb-1', 'From learning to doing'),
            el('h2', 'h5 fw-bold mb-1', "What you'll build"),
            emptyValue('d-block text-muted small')
        );

        card.append(badge, text);
        return card;
    }

    /* --------------------------------------------------------------------------
       Sections (string[] handling only)
       -------------------------------------------------------------------------- */
    function createSectionsHeader(count) {
        const header = el('div', 'mb-4');
        const titleRow = el('div', 'd-flex justify-content-between align-items-center mb-1 flex-wrap gap-2');
        titleRow.appendChild(el('h2', 'h4 fw-bold mb-0', 'Your course sections'));

        if (count > 0) {
            titleRow.appendChild(el(
                'span',
                'badge bg-body-tertiary text-body-secondary border rounded-pill px-3 py-2 fw-medium',
                `${count} ${count === 1 ? 'section' : 'sections'}`
            ));
        }

        header.append(
            el('div', 'cd-eyebrow mb-1', 'One step at a time'),
            titleRow,
            el('p', 'text-muted small mb-0', 'Sections from the original course.')
        );
        return header;
    }

    function toggleSectionRow(row, toggle, panel) {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        row.classList.toggle('is-open', open);
    }

    function createSectionsRoadmap(sections) {
    const card = el('section', 'cd-panel mb-4');
    const list = el('ol', 'cd-sections-list list-unstyled d-flex flex-column mb-0');
    const fragment = document.createDocumentFragment();
    let counter = 0;

    sections.forEach((title) => {
        if (!hasText(title)) return;
        counter += 1;

        const panelId = `cd-section-panel-${counter}`;
        const row = el('li', 'cd-section-row');

            const toggle = el('button', 'cd-section-toggle d-flex align-items-center justify-content-between w-100 p-3 text-start');
            toggle.type = 'button';
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-controls', panelId);

            const leftWrap = el('span', 'd-flex align-items-center gap-3 min-w-0');
            leftWrap.append(
                el('span', 'cd-section-num', String(counter).padStart(2, '0')),
                el('span', 'cd-section-title', title.trim())
            );
            toggle.append(leftWrap, icon('fa-solid fa-plus cd-section-icon flex-shrink-0 ms-2'));

            // Empty on purpose: the API has no per-section content.
            const panel = el('div', 'cd-section-panel');
            panel.id = panelId;
            panel.setAttribute('aria-hidden', 'true');
            panel.appendChild(el('div', 'cd-section-panel-body'));

            toggle.addEventListener('click', () => toggleSectionRow(row, toggle, panel));

            row.append(toggle, panel);
            fragment.appendChild(row);
        });

        list.appendChild(fragment);
        card.append(createSectionsHeader(list.childElementCount), list);
        return card;
    }

    function createEmptyRoadmap() {
        const card = el('section', 'cd-panel mb-4');

        const emptyBody = el('div', 'py-4 text-center');
        emptyBody.append(
            icon('fa-regular fa-folder-open fs-1 text-muted mb-3 d-block'),
            el('h3', 'h6 fw-semibold mb-1', 'No sections available yet'),
            el('p', 'text-muted small mb-0', 'This course does not include section information yet.')
        );

        card.append(createSectionsHeader(0), emptyBody);
        return card;
    }

    /* --------------------------------------------------------------------------
       Instructor (no API field — structure only)
       -------------------------------------------------------------------------- */
    function createInstructorCard() {
        const card = el('section', 'cd-panel d-flex align-items-center gap-3');

        const avatar = el('span', 'cd-avatar cd-avatar--lg');
        avatar.setAttribute('aria-hidden', 'true');

        const text = el('div', 'flex-grow-1 min-w-0');
        text.append(
            el('div', 'cd-eyebrow mb-1', 'Meet your instructor'),
            emptyValue('d-block h5 fw-bold mb-0'),
            emptyValue('d-block text-muted small')
        );

        card.append(avatar, text, icon('fa-solid fa-wand-magic-sparkles text-muted'));
        return card;
    }

    /* --------------------------------------------------------------------------
       Right Panel ("Keep your curiosity going" Aside)
       -------------------------------------------------------------------------- */
    function createProgressBlock() {
        const block = el('div', 'mb-3');

        const labelRow = el('div', 'd-flex justify-content-between align-items-center small mb-2');
        const percent = el('span', 'd-inline-flex gap-1 fw-semibold');
        percent.append(emptyValue(), el('span', '', 'complete'));
        labelRow.append(percent, emptyValue('text-muted'));

        const track = el('div', 'cd-progress-track mb-3');
        track.setAttribute('aria-hidden', 'true');

        const upNext = el('div', 'small');
        upNext.append(el('div', 'cd-eyebrow mb-1', 'Up next'), emptyValue('d-block fw-medium'));

        block.append(labelRow, track, upNext);
        return block;
    }

    function createFavoriteButton(course) {
        const isFav = isCourseFavorited(course.id);
        const favBtn = el('button', 'btn cd-btn-fav w-100 rounded-3 py-2 fw-medium d-flex align-items-center justify-content-center gap-2 mb-4');
        favBtn.type = 'button';
        favBtn.setAttribute('data-action', 'favorite');

        const favIcon = icon('');
        const favText = el('span');
        favBtn.append(favIcon, favText);

        const sync = (fav) => {
            favBtn.classList.toggle('is-favorited', fav);
            favBtn.setAttribute('aria-pressed', fav ? 'true' : 'false');
            favIcon.className = fav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            favText.textContent = fav ? 'Saved for later' : 'Save for later';
        };
        sync(isFav);

        favBtn.addEventListener('click', () => sync(!toggleCourseFavorited(course.id)));
        return favBtn;
    }

    function createCuriosityAside(course) {
        const wrap = el('aside', 'd-flex flex-column');
        const card = el('div', 'cd-panel');

        card.append(
            el('div', 'cd-eyebrow mb-1', 'Your next small step'),
            el('h2', 'cd-aside-title fw-bold mb-2', 'Keep your curiosity going.'),
            el('p', 'text-muted small mb-3', 'Explore the course sections at your own pace.'),
            createProgressBlock()
        );

        if (course.externalUrl && /^https:\/\//i.test(course.externalUrl)) {
            const primaryCta = el('a', 'btn cd-btn-lime w-100 rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 mb-2');
            primaryCta.href = course.externalUrl;
            primaryCta.target = '_blank';
            primaryCta.rel = 'noopener noreferrer';
            primaryCta.append(el('span', '', 'Open original course'), icon('fa-solid fa-arrow-up-right-from-square small'));
            primaryCta.setAttribute('aria-label', 'Open original course in new window');
            card.appendChild(primaryCta);
        }

        card.appendChild(createFavoriteButton(course));

        const featuresList = createFeatures(course.features);
        if (featuresList) card.appendChild(featuresList);

        const footerNote = el('div', 'text-center pt-3 border-top');
        footerNote.appendChild(el('span', 'text-muted small', 'A little progress, every single day.'));
        card.appendChild(footerNote);

        const quote = el('div', 'cd-quote d-flex justify-content-center align-items-start gap-2 mt-3 px-2');
        const quoteText = el('span');
        quoteText.append(
            el('span', 'd-block', "You don't have to see the whole staircase."),
            el('span', 'd-block fw-semibold', 'Just take the first step.')
        );
        quote.append(icon('fa-solid fa-wand-magic-sparkles cd-quote-icon'), quoteText);

        wrap.append(card, quote);
        return wrap;
    }

    /* --------------------------------------------------------------------------
       Top Navigation Bar (Back Link & Inspiration)
       -------------------------------------------------------------------------- */
    function createTopNav() {
        const wrap = el('div', 'd-flex justify-content-between align-items-center mb-3');

        const backLink = el('a', 'cd-back-link text-decoration-none d-inline-flex align-items-center gap-2');
        backLink.href = 'index.html';
        backLink.append(icon('fa-solid fa-arrow-left'), el('span', '', 'Back to courses'));

        const tag = el('span', 'text-muted small d-none d-md-inline');
        tag.append(icon('fa-regular fa-compass me-1'), el('span', '', 'A little learning. A world of possibility.'));

        wrap.append(backLink, tag);
        return wrap;
    }

    /* --------------------------------------------------------------------------
       Page Layout (hero full width, then 2 columns from xl up)
       -------------------------------------------------------------------------- */
    function buildLeftColumn(course, roadmapNode) {
        const mainCol = el('div', 'col-12 col-xl-8');
        mainCol.append(createStatsRow(course), createBuildCard(), roadmapNode, createInstructorCard());
        return mainCol;
    }

    function buildRightColumn(course) {
        const sideCol = el('div', 'col-12 col-xl-4');
        sideCol.appendChild(createCuriosityAside(course));
        return sideCol;
    }

    function renderTwoColumnLayout(course, roadmapNode) {
        const root = el('div', 'container my-3 my-lg-4');
        root.append(createTopNav(), createHeroCard(course));

        const row = el('div', 'row g-4');
        row.append(buildLeftColumn(course, roadmapNode), buildRightColumn(course));
        root.appendChild(row);
        return root;
    }

    /* --------------------------------------------------------------------------
       State Renderers
       -------------------------------------------------------------------------- */
    function renderSuccess(course) {
        return renderTwoColumnLayout(course, createSectionsRoadmap(course.sections));
    }

    function renderNoSections(course) {
        return renderTwoColumnLayout(course, createEmptyRoadmap());
    }

    function renderError() {
        const wrap = el('div', 'container my-5 py-5 text-center');
        wrap.setAttribute('role', 'alert');

        const title = el('h1', 'h4 fw-bold mb-2', 'Something went wrong. Please try again.');
        const desc = el('p', 'text-muted mb-4', "We couldn't load this course. Please check your connection and try again.");

        const retryBtn = el('button', 'btn btn-primary rounded-3 px-4 py-2 fw-medium', 'Try again');
        retryBtn.type = 'button';
        retryBtn.addEventListener('click', () => loadCourse(currentSlug), { once: true });

        wrap.append(icon('fa-solid fa-triangle-exclamation fs-1 text-danger mb-3 d-block'), title, desc, retryBtn);
        return wrap;
    }

    function renderNotFound() {
        const wrap = el('div', 'container my-5 py-5 text-center');
        wrap.setAttribute('role', 'alert');

        const title = el('h1', 'h4 fw-bold mb-2', 'Course not found');
        title.tabIndex = -1;
        const desc = el('p', 'text-muted mb-4', "The course you're looking for doesn't exist or was removed.");

        const backBtn = el('a', 'btn btn-outline-primary rounded-3 px-4 py-2 fw-medium', 'Browse courses');
        backBtn.href = 'index.html';

        wrap.append(icon('fa-regular fa-circle-question fs-1 text-muted mb-3 d-block'), title, desc, backBtn);
        return wrap;
    }

    /* --------------------------------------------------------------------------
       Footer Attribution Sync
       -------------------------------------------------------------------------- */
    function syncFooterAttribution(course) {
        const attrEl = document.getElementById('cd-footer-attribution');
        if (!attrEl) return;

        const parts = ['Content © ImpactMojo'];
        if (course && hasText(course.license)) parts.push(course.license.trim());
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
            if (node) node.hidden = stateName !== name;
        });

        if (main) {
            main.setAttribute('aria-busy', name === 'loading' ? 'true' : 'false');
        }

        const loadingStatus = document.querySelector('[data-loading-status]');
        if (loadingStatus) loadingStatus.textContent = name === 'loading' ? 'Loading course…' : '';

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

        if (node) target.replaceChildren(node);
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
        document.title = `${course.title} · MyCourses`;
        
        // Update breadcrumb dynamically
        document.dispatchEvent(new CustomEvent('course:loaded', {
            bubbles: true,
            detail: { title: course.title }
        }));
        
        focusPageHeading(getStateContainers()[stateName]);
        } catch (err) {
            document.title = DEFAULT_TITLE;
            if (err && (err.status === 404 || err.status === 400)) {
                setState('not-found');
                focusPageHeading(getStateContainers()['not-found']);
            } else {
                setState('error');
            }
        }
    }

    function init() {
        const params = new URLSearchParams(window.location.search);
        const slug = (params.get('course') || '').trim();

        if (!slug || !SLUG_RE.test(slug)) {
            setState('not-found');
            focusPageHeading(getStateContainers()['not-found']);
            return;
        }

        currentSlug = slug;
        loadCourse(currentSlug);
    }

    init();
})();
