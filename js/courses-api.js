/* ==========================================================================
   Courses API Integration (API-01)
   Fetch + Normalize the ImpactMojo Education API into our internal
   course model. The rendering layer must NEVER know about the API shape.
   ========================================================================== */

const COURSES_API_URL = 'https://www.impactmojo.in/api/v1/courses';
const COURSES_API_TIMEOUT_MS = 15_000;

/* --------------------------------------------------------------------------
   Style Presets
   -------------------------------------------------------------------------- */
const STYLE_PRESETS = Object.freeze({
    data:         { icon: 'fa-solid fa-database',        iconColor: 'bg-success-subtle text-success', badge: 'bg-success-subtle text-success' },
    policy:       { icon: 'fa-solid fa-scale-balanced',  iconColor: 'bg-warning-subtle text-warning', badge: 'bg-warning-subtle text-warning' },
    governance:   { icon: 'fa-solid fa-gavel',           iconColor: 'bg-info-subtle text-info',       badge: 'bg-info-subtle text-info' },
    equity:       { icon: 'fa-solid fa-venus',           iconColor: 'bg-danger-subtle text-danger',   badge: 'bg-danger-subtle text-danger' },
    research:     { icon: 'fa-solid fa-chart-line',      iconColor: 'bg-primary-subtle text-primary', badge: 'bg-primary-subtle text-primary' },
    health:       { icon: 'fa-solid fa-heart-pulse',     iconColor: 'bg-danger-subtle text-danger',   badge: 'bg-danger-subtle text-danger' },
    flagship:     { icon: 'fa-solid fa-star',            iconColor: 'bg-warning-subtle text-warning', badge: 'bg-warning-subtle text-warning' },
    foundational: { icon: 'fa-solid fa-seedling',        iconColor: 'bg-success-subtle text-success', badge: 'bg-success-subtle text-success' },
    workbook:     { icon: 'fa-solid fa-pen-to-square',   iconColor: 'bg-info-subtle text-info',       badge: 'bg-info-subtle text-info' },
    labs:         { icon: 'fa-solid fa-flask',           iconColor: 'bg-primary-subtle text-primary', badge: 'bg-primary-subtle text-primary' },
    programs:     { icon: 'fa-solid fa-certificate',     iconColor: 'bg-primary-subtle text-primary', badge: 'bg-primary-subtle text-primary' }
});

/* --------------------------------------------------------------------------
    Category Normalization
   -------------------------------------------------------------------------- */
const CATEGORY_STYLES = Object.freeze({
    'Data & Technology':            STYLE_PRESETS.data,
    'Policy & Economics':           STYLE_PRESETS.policy,
    'Philosophy, Law & Governance': STYLE_PRESETS.governance,
    'Gender & Equity':              STYLE_PRESETS.equity,
    'Gender & Social':              STYLE_PRESETS.equity,
    'MEL & Research':               STYLE_PRESETS.research,
    'Health & Communication':       STYLE_PRESETS.health,
    'Flagship Courses':             STYLE_PRESETS.flagship,
    'Flagship':                     STYLE_PRESETS.flagship,
    '101 Foundational Courses':     STYLE_PRESETS.foundational,
    '101 Foundational Course':      STYLE_PRESETS.foundational,
    'Foundational (101)':           STYLE_PRESETS.foundational,
    'Practice Workbook':            STYLE_PRESETS.workbook,
    'Interactive Labs':             STYLE_PRESETS.labs,
    'Programs':                     STYLE_PRESETS.programs
});

const DEFAULT_STYLE = Object.freeze({
    icon:      'fa-solid fa-book',
    iconColor: 'bg-secondary-subtle text-dark',
    badge:     'bg-secondary-subtle text-secondary'
});

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

function normalizeCategory(rawTrack) {
    const track = asTrimmedString(rawTrack);
    return track || DEFAULT_CATEGORY;
}

function normalizeLevel(rawLevel) {
    const level = asTrimmedString(rawLevel);
    return level || DEFAULT_LEVEL;
}


function normalizeDuration() {
    return '';
}

/* --------------------------------------------------------------------------
   Main Normalization Function
   -------------------------------------------------------------------------- */
function normalizeCourse(apiCourse) {
    if (!apiCourse || typeof apiCourse !== 'object') return null;

    const id    = asTrimmedString(apiCourse.id ?? apiCourse.slug);
    const title = asTrimmedString(apiCourse.title);

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
        duration,           
        instructor: '',      
        rating:     null,   
        tags: Array.isArray(apiCourse.tags) ? apiCourse.tags.slice() : [],
        url:  asTrimmedString(apiCourse.url),

        visual: {
            type:  'icon',
            value: style.icon,
            color: style.iconColor
        },
        badgeColor: style.badge
    };
}

/* 
   Fetch Laye */
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