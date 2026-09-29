/*  Sidebar Navigation (FED-29) */

const NAV_STRUCTURE = [
    {
        label: 'The Learning Studio',
        items: [
            { id: 'overview',    label: 'Overview',        icon: 'fa-solid fa-table-cells-large', href: '#' },
            { id: 'explore',     label: 'Explore courses', icon: 'fa-regular fa-circle-play',     href: 'index.html',      badge: '09' },
            { id: 'paths',       label: 'Learning paths',  icon: 'fa-solid fa-diagram-project',   href: '#' },
            { id: 'my-learning', label: 'My learning',     icon: 'fa-solid fa-book-open',         href: 'my-learning.html', badge: '3' },
            { id: 'favorites',   label: 'Favorites',       icon: 'fa-regular fa-heart',           href: 'favorites.html',  badge: '1' }
        ]
    },
    {
        label: 'Make it a habit',
        items: [
            { id: 'planner',  label: 'Study planner',     icon: 'fa-regular fa-calendar',    href: '#' },
            { id: 'notebook', label: 'My notebook',       icon: 'fa-regular fa-file-lines',  href: '#' },
            { id: 'insights', label: 'Progress insights', icon: 'fa-solid fa-chart-simple',  href: '#' }
        ]
    },
    {
        label: null,
        className: 'sidebar-nav-group--profile',
        items: [
            { id: 'profile', label: 'My profile', icon: 'fa-regular fa-user', href: 'profile.html' }
        ]
    }
];

/* ----- Active state detection ----- */
function getActiveId() {
    const path = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (path === 'index.html' || path === '') return 'explore';
    if (path === 'my-learning.html') return 'my-learning';
    if (path === 'favorites.html')   return 'favorites';
    if (path === 'profile.html')     return 'profile';
    return null;
}

/* ----- Helpers ----- */
function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
}

/* ----- Builders ----- */
function buildLogo() {
    const logo = createEl('a', 'sidebar-logo');
    logo.href = 'index.html';
    logo.setAttribute('aria-label', 'MyCourses home');

    const iconWrap = createEl('span', 'sidebar-logo-icon');
    const icon = createEl('i', 'fa-solid fa-book-open');
    icon.setAttribute('aria-hidden', 'true');
    iconWrap.appendChild(icon);

    const text = createEl('span', 'sidebar-logo-text');
    text.innerHTML = 'My<strong>Courses.</strong>';

    logo.append(iconWrap, text);
    return logo;
}

function buildNavItem(item, activeId) {
    const link = createEl('a', 'sidebar-nav-item');
    link.href = item.href;

    if (item.id === activeId) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
    }

    const icon = createEl('i', item.icon);
    icon.setAttribute('aria-hidden', 'true');

    const label = createEl('span', '', item.label);

    link.append(icon, label);

    if (item.badge) {
        link.appendChild(createEl('span', 'sidebar-nav-badge', item.badge));
    }

    return link;
}

function buildGroup(group, activeId) {
    const fragment = document.createDocumentFragment();

    if (group.label) {
        fragment.appendChild(createEl('div', 'sidebar-group-label', group.label));
    }

    const navGroup = createEl('nav', 'sidebar-nav-group');
    if (group.className) navGroup.classList.add(group.className);

    group.items.forEach((item) => {
        navGroup.appendChild(buildNavItem(item, activeId));
    });

    fragment.appendChild(navGroup);
    return fragment;
}

/* ----- Render ----- */
function renderNavigation() {
    const container = document.getElementById('mainSidebarBody');
    if (!container) return;

    const activeId = getActiveId();
    const fragment = document.createDocumentFragment();

    fragment.appendChild(buildLogo());

    NAV_STRUCTURE.forEach((group) => {
        fragment.appendChild(buildGroup(group, activeId));
    });

    container.replaceChildren(fragment);
}

document.addEventListener('DOMContentLoaded', renderNavigation);