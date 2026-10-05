/* ==========================================================================
   Courses API Integration (API-01)
   Fetch + Normalize the ImpactMojo Education API into our internal
   course model. The rendering layer must NEVER know about the API shape.
   ========================================================================== */

const COURSES_API_URL = 'https://www.impactmojo.in/api/v1/courses';
const COURSES_API_TIMEOUT_MS = 10_000;

/* --------------------------------------------------------------------------
   Visual styles — keyed by the API's `track` value.
   Presentation-only concern; the renderer never sees raw tracks, only
   the derived `visual` + `badgeColor` fields produced below.
   -------------------------------------------------------------------------- */
const CATEGORY_STYLES = {
    'Data & Technology':            { icon: 'fa-solid fa-database',     iconColor: 'bg-success-subtle text-success', badge: 'bg-success-subtle text-success' },
    'Policy & Economics':           { icon: 'fa-solid fa-scale-balanced', iconColor: 'bg-warning-subtle text-warning', badge: 'bg-warning-subtle text-warning' },
    'Philosophy, Law & Governance': { icon: 'fa-solid fa-gavel',        iconColor: 'bg-info-subtle text-info',       badge: 'bg-info-subtle text-info' },
    'Gender & Equity':              { icon: 'fa-solid fa-venus',        iconColor: 'bg-danger-subtle text-danger',   badge: 'bg-danger-subtle text-danger' },
    'Gender & Social':              { icon: 'fa-solid fa-venus',        iconColor: 'bg-danger-subtle text-danger',   badge: 'bg-danger-subtle text-danger' },
    'MEL & Research':               { icon: 'fa-solid fa-chart-line',   iconColor: 'bg-primary-subtle text-primary', badge: 'bg-primary-subtle text-primary' },
    'Health & Communication':       { icon: 'fa-solid fa-heart-pulse',  iconColor: 'bg-danger-subtle text-danger',   badge: 'bg-danger-subtle text-danger' },
    'Flagship Courses':             { icon: 'fa-solid fa-star',         iconColor: 'bg-warning-subtle text-warning', badge: 'bg-warning-subtle text-warning' },
    'Flagship':                     { icon: 'fa-solid fa-star',         iconColor: 'bg-warning-subtle text-warning', badge: 'bg-warning-subtle text-warning' },
    '101 Foundational Courses':     { icon: 'fa-solid fa-seedling',     iconColor: 'bg-success-subtle text-success', badge: 'bg-success-subtle text-success' },
    '101 Foundational Course':      { icon: 'fa-solid fa-seedling',     iconColor: 'bg-success-subtle text-success', badge: 'bg-success-subtle text-success' },
    'Foundational (101)':           { icon: 'fa-solid fa-seedling',     iconColor: 'bg-success-subtle text-success', badge: 'bg-success-subtle text-success' },
    'Practice Workbook':            { icon: 'fa-solid fa-pen-to-square',iconColor: 'bg-info-subtle text-info',       badge: 'bg-info-subtle text-info' },
    'Interactive Labs':             { icon: 'fa-solid fa-flask',        iconColor: 'bg-primary-subtle text-primary', badge: 'bg-primary-subtle text-primary' },
    'Programs':                     { icon: 'fa-solid fa-certificate',  iconColor: 'bg-primary-subtle text-primary', badge: 'bg-primary-subtle text-primary' }
};

const DEFAULT_STYLE = {
    icon:      'fa-solid fa-book',
    iconColor: 'bg-secondary-subtle text-dark',
    badge:     'bg-secondary-subtle text-secondary'
};

const DEFAULT_CATEGORY = 'General';
const DEFAULT_LEVEL    = 'All Levels';

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
function getCategoryStyle(category) {
    return CATEGORY_STYLES[category] || DEFAULT_STYLE;
}

function asTrimmedString(value) {
    return typeof value === 'string' ? value.trim() : '';
}

/* --------------------------------------------------------------------------
   Field-level normalizers — defensive against missing / malformed values
   -------------------------------------------------------------------------- */
function normalizeCategory(rawTrack) {
    const track = asTrimmedString(rawTrack);
    return track || DEFAULT_CATEGORY;
}

function normalizeLevel(rawLevel) {
    const level = asTrimmedString(rawLevel);
    return level || DEFAULT_LEVEL;
}

/**
 * ImpactMojo does not expose a duration field.
 * Kept as a named function so the *reason* for the empty value lives next
 * to the model definition, not as an inline magic string. Returns '' so the
 * rendering layer treats it as "no value to show" and hides the field.
 * (Maram's rule: derive only if we have enough info; otherwise hide.)
 */
function normalizeDuration() {
    return '';
}

/* --------------------------------------------------------------------------
   Normalization Layer (API course → internal App course)
   Returns `null` for records we cannot render — filtered out by caller.
   -------------------------------------------------------------------------- */
function normalizeCourse(apiCourse) {
    if (!apiCourse || typeof apiCourse !== 'object') return null;

    const id    = asTrimmedString(apiCourse.id ?? apiCourse.slug);
    const title = asTrimmedString(apiCourse.title);

    // Required fields — drop invalid records instead of rendering blanks
    if (!id || !title) return null;

    const category = normalizeCategory(apiCourse.track);
    const level    = normalizeLevel(apiCourse.level);
    const duration = normalizeDuration();
    const style    = getCategoryStyle(category);

    return {
        // --- Identity ---
        id,
        title,
        description: asTrimmedString(apiCourse.description),

        // --- Classification ---
        category,
        level,
        duration,           // '' → UI hides it
        instructor: '',     // not provided → UI hides it
        rating:     null,   // not provided → UI hides it

        // --- Extras ---
        tags: Array.isArray(apiCourse.tags) ? apiCourse.tags.slice() : [],
        url:  asTrimmedString(apiCourse.url),

        // --- Visual intent (consumed only by the rendering layer) ---
        visual: {
            type:  'icon',
            value: style.icon,
            color: style.iconColor
        },
        badgeColor: style.badge
    };
}

/* --------------------------------------------------------------------------
   Fetch Layer
   Uses AbortController so a hung network surfaces the error state instead
   of leaving the loading skeleton on screen indefinitely.
   -------------------------------------------------------------------------- */
async function loadCoursesFromApi() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), COURSES_API_TIMEOUT_MS);

    try {
        const response = await fetch(COURSES_API_URL, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Failed to load courses: HTTP ${response.status}`);
        }

        const payload = await response.json();
        const list = Array.isArray(payload?.courses) ? payload.courses : [];

        return list
            .map(normalizeCourse)
            .filter(Boolean); // drop invalid records
    } finally {
        clearTimeout(timer);
    }
}