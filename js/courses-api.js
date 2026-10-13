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

const CARD_PRESENTATION = Object.freeze({
    'Data & Technology':            { bannerTheme: 'blue',   techTheme: 'success'   },
    'Policy & Economics':           { bannerTheme: 'yellow', techTheme: 'warning'   },
    'Philosophy, Law & Governance': { bannerTheme: 'orange', techTheme: 'info'      },
    'Gender & Equity':              { bannerTheme: 'purple', techTheme: 'danger'    },
    'Gender & Social':              { bannerTheme: 'purple', techTheme: 'danger'    },
    'MEL & Research':               { bannerTheme: 'purple', techTheme: 'info'      },
    'Health & Communication':       { bannerTheme: 'blue',   techTheme: 'danger'    },
    'Flagship Courses':             { bannerTheme: 'orange', techTheme: 'warning'   },
    'Flagship':                     { bannerTheme: 'orange', techTheme: 'warning'   },
    '101 Foundational Courses':     { bannerTheme: 'blue',   techTheme: 'info'      },
    '101 Foundational Course':      { bannerTheme: 'blue',   techTheme: 'info'      },
    'Foundational (101)':           { bannerTheme: 'blue',   techTheme: 'info'      },
    'Practice Workbook':            { bannerTheme: 'purple', techTheme: 'secondary' },
    'Interactive Labs':             { bannerTheme: 'orange', techTheme: 'warning'   },
    'Programs':                     { bannerTheme: 'purple', techTheme: 'info'      }
});

const DEFAULT_CARD_PRESENTATION = Object.freeze({
    bannerTheme: 'orange',
    techTheme:   'secondary'
});

function getCardPresentation(category) {
    return CARD_PRESENTATION[category] || DEFAULT_CARD_PRESENTATION;
}

function deriveCardTag(apiCourse) {
    const tier   = asTrimmedString(apiCourse.tier).toLowerCase();
    const format = asTrimmedString(apiCourse.format);

    if (tier === 'flagship' || /flagship/i.test(format)) return 'Flagship';
    if (tier === '101' || /101/i.test(format))           return '101';
    return '';
}

function deriveCodeSnippet(apiCourse) {
    const title = asDecodedString(apiCourse.title);
    if (!title) return '';
    const short = title.length > 42 ? `${title.slice(0, 39)}…` : title;
    return `// ${short}`;
}

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

const HTML_ENTITIES = Object.freeze({
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
    ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”'
});

// The API returns HTML-encoded strings; the UI renders via textContent, so decode here.
function decodeEntities(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const code = entity[1].toLowerCase() === 'x'
                ? parseInt(entity.slice(2), 16)
                : parseInt(entity.slice(1), 10);
            return Number.isInteger(code) && code > 0 && code <= 0x10FFFF
                ? String.fromCodePoint(code)
                : match;
        }
        return HTML_ENTITIES[entity.toLowerCase()] ?? match;
    });
}

function asDecodedString(value) {
    return decodeEntities(asTrimmedString(value)).trim();
}

function normalizeCategory(rawTrack) {
    const track = asTrimmedString(rawTrack);
    return track || DEFAULT_CATEGORY;
}

function normalizeLevel(rawLevel) {
    const level = asTrimmedString(rawLevel);
    return level || DEFAULT_LEVEL;
}

/* --------------------------------------------------------------------------
   Main Normalization Function (Catalog)
   -------------------------------------------------------------------------- */
function normalizeCourse(apiCourse) {
    if (!apiCourse || typeof apiCourse !== 'object') return null;

    const id    = String(apiCourse.id ?? apiCourse.slug ?? '').trim();
    const slug  = String(apiCourse.slug ?? apiCourse.id ?? '').trim();
    const title = asDecodedString(apiCourse.title);

    if (!id || !title) return null;

    const category     = decodeEntities(normalizeCategory(apiCourse.track));
    const level        = decodeEntities(normalizeLevel(apiCourse.level));
    const style        = getCategoryStyle(category);
    const presentation = getCardPresentation(category);

    return {
        id,
        slug,
        title,
        description: asDecodedString(apiCourse.description),

        category,
        level,
        duration: '',       
        instructor: '',
        rating:     null,
        tags: Array.isArray(apiCourse.tags)
            ? apiCourse.tags.map(asDecodedString).filter(Boolean)
            : [],
        url:  asTrimmedString(apiCourse.url),

        visual: {
            type:  'icon',
            value: style.icon,
            color: style.iconColor
        },
        badgeColor: style.badge,

        bannerTheme: presentation.bannerTheme,
        techIcon:    style.icon,
        techTheme:   presentation.techTheme,
        tag:         deriveCardTag(apiCourse),
        codeSnippet: deriveCodeSnippet(apiCourse)
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
            .filter(Boolean); 
    } finally {
        clearTimeout(timer);
    }
}

/* --------------------------------------------------------------------------
   Details Layer (API-03)
   -------------------------------------------------------------------------- */
function normalizeSections(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
        .map(asDecodedString)
        .filter(Boolean);
}

function normalizeCourseDetail(apiCourse) {
    const base = normalizeCourse(apiCourse);
    if (!base) return null;

    const slidesNum = Number(apiCourse.slides);
    const license   = asTrimmedString(apiCourse.license);
    const feats     = apiCourse.features;
    const hasFeats  = feats && typeof feats === 'object'
                    && !Array.isArray(feats)
                    && Object.entries(feats).some(([k, v]) =>
                         v === true || (k === 'interactiveCharts' && typeof v === 'number' && v > 0));

    const sections = normalizeSections(apiCourse.sections);

    return {
        ...base,
        format:      asTrimmedString(apiCourse.format) || null,
        slides:      Number.isFinite(slidesNum) && slidesNum > 0 ? slidesNum : null,
        features:    hasFeats ? { ...feats } : null,
        sections:    sections.length > 0 ? sections : null,
        externalUrl: typeof apiCourse.url === 'string' && /^https:\/\//i.test(apiCourse.url.trim()) ? apiCourse.url.trim() : null,
        license:     license || null,
        rawTrack:    asDecodedString(apiCourse.track),
        rawLevel:    asDecodedString(apiCourse.level)
    };
}

async function fetchCourseBySlug(slug) {
    if (typeof slug !== 'string' || !/^[a-z0-9-]+$/i.test(slug)) {
        const err = new Error('Invalid slug');
        err.status = 400;
        throw err;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), COURSES_API_TIMEOUT_MS);
    const url = `${COURSES_API_URL}/${encodeURIComponent(slug)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'default',
            signal: controller.signal
        });

        if (!response.ok) {
            const err = new Error(`HTTP ${response.status}`);
            err.status = response.status;
            throw err;
        }

        const payload = await response.json();
        const course = normalizeCourseDetail(payload?.course);

        if (!course) {
            const err = new Error('Not found');
            err.status = 404;
            throw err;
        }

        return course;
    } finally {
        clearTimeout(timer);
    }
}