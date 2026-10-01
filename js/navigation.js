/* ==========================================================================
   Sidebar Navigation (FED-29)
   Data-driven navigation with active-state detection
   ========================================================================== */

const navigationGroups = [
    {
        label: 'The learning studio',
        items: [
            { id: 'overview',  label: 'Overview',        icon: 'fa-solid fa-border-all',      href: '#' },
            { id: 'explore',   label: 'Explore courses', icon: 'fa-regular fa-compass',       href: 'index.html',      badge: '09' },
            { id: 'paths',     label: 'Learning paths',  icon: 'fa-solid fa-diagram-project', href: '#' },
            { id: 'learning',  label: 'My learning',     icon: 'fa-regular fa-book-open',     href: 'my-learning.html', badge: '3' },
            { id: 'favorites', label: 'Favorites',       icon: 'fa-regular fa-heart',         href: 'favorites.html',   badge: '0' }
        ]
    },
    {
        label: 'Make it a habit',
        items: [
            { id: 'planner',  label: 'Study planner',     icon: 'fa-regular fa-calendar',    href: '#' },
            { id: 'notebook', label: 'My notebook',       icon: 'fa-regular fa-file-lines',  href: '#' },
            { id: 'progress', label: 'Progress insights', icon: 'fa-solid fa-chart-simple',  href: '#' }
        ]
    },
    {
        items: [
            { id: 'profile', label: 'My profile', icon: 'fa-regular fa-user', href: 'profile.html' }
        ]
    }
];

const BREADCRUMB_LABELS = {
    explore:   'Explore courses',
    learning:  'My learning',
    favorites: 'Favorites',
    profile:   'My profile'
};

/* ============================================
   Helpers
   ============================================ */

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/* ============================================
   Builders — Logo
   ============================================ */

function createLogo() {
    const logo = el('a', 'sidebar-logo');
    logo.href = 'index.html';
    logo.setAttribute('aria-label', 'MyCourses home');

    const img = el('img', 'sidebar-logo-img');
    img.src = 'assets/images/brand.svg';
    img.alt = '';
    img.width = 48;
    img.height = 48;

    const text = el('span', 'sidebar-logo-text');
    text.innerHTML = 'My<span class="sidebar-logo-text-courses">Courses</span>';

    logo.append(img, text);
    return logo;
}

/* ============================================
   Builders — Nav Items & Groups
   ============================================ */

function createNavigationItem(item, currentPage) {
    const link = el('a', 'sidebar-nav-item');
    const isActive = item.id === currentPage;

    link.href = item.href;
    link.dataset.navigationId = item.id;
    if (isActive) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
    }

    const icon = el('i', item.icon);
    icon.setAttribute('aria-hidden', 'true');

    const label = el('span', 'sidebar-nav-label', item.label);

    link.append(icon, label);

    if (item.badge) {
        link.appendChild(el('span', 'sidebar-nav-badge', item.badge));
    }

    return link;
}

function createGroup(group, currentPage) {
    const section = el('div', 'sidebar-nav-group');

    if (group.label) {
        section.appendChild(el('p', 'sidebar-nav-group-label', group.label));
    }

    const list = el('div', 'sidebar-nav-list');
    group.items.forEach((item) => list.appendChild(createNavigationItem(item, currentPage)));
    section.appendChild(list);

    return section;
}

/* ============================================
   Builders — Footer
   ============================================ */

function createFooterLink({ label, icon, trailing }) {
    const link = el('a', 'sidebar-footer-link');
    link.href = '#';

    if (icon) {
        const iconEl = el('i', icon);
        iconEl.setAttribute('aria-hidden', 'true');
        link.appendChild(iconEl);
    }

    if (label) {
        link.appendChild(el('span', '', label));
    }

    if (trailing) {
        const trailingEl = el('i', trailing);
        trailingEl.setAttribute('aria-hidden', 'true');
        link.appendChild(trailingEl);
    }

    return link;
}

function createUserCard() {
    const card = el('a', 'sidebar-user');
    card.href = 'profile.html';

    const avatar = el('span', 'sidebar-user-avatar');
    avatar.dataset.sidebarUserAvatar = '';
    avatar.textContent = '?';

    const info = el('div', 'sidebar-user-info');
    const name = el('span', 'sidebar-user-name');
    name.dataset.sidebarUserName = '';
    name.textContent = 'Learner';
    const role = el('span', 'sidebar-user-role', 'Personal account');
    info.append(name, role);

    const chevron = el('i', 'fa-solid fa-chevron-right sidebar-user-chevron');
    chevron.setAttribute('aria-hidden', 'true');

    card.append(avatar, info, chevron);
    return card;
}

function createSidebarFooter() {
    const footer = el('div', 'sidebar-footer');

    const helpLink = createFooterLink({
        label: 'Help & getting started',
        icon: 'fa-regular fa-circle-question',
        trailing: 'fa-solid fa-arrow-up-right-from-square sidebar-footer-link-trailing'
    });

    const divider = el('div', 'sidebar-footer-divider');

    const userCard = createUserCard();

    const signOut = createFooterLink({
        label: 'Sign out',
        trailing: 'fa-solid fa-arrow-up-right-from-square sidebar-footer-link-trailing'
    });

    footer.append(helpLink, divider, userCard, signOut);
    return footer;
}

/* ============================================
   Sidebar Render
   ============================================ */

function renderSidebar(sidebar) {
    const currentPage = sidebar.dataset.current || '';

    const nav = el('nav', 'sidebar-nav-content');
    nav.setAttribute('aria-label', 'Main navigation');

    nav.appendChild(createLogo());

    navigationGroups.forEach((group) => {
        nav.appendChild(createGroup(group, currentPage));
    });

    nav.appendChild(createSidebarFooter());

    const closeButton = el('button', 'sidebar-nav-close');
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close navigation');
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    closeButton.addEventListener('click', () => sidebar.classList.remove('is-open'));

    sidebar.replaceChildren(closeButton, nav);
}

/* ============================================
   Breadcrumb Render
   ============================================ */

function renderBreadcrumb() {
    const breadcrumbEl = document.querySelector('[data-breadcrumb]');
    if (!breadcrumbEl) return;

    const sidebar = document.querySelector('[data-sidebar]');
    const currentPage = sidebar?.dataset.current || '';
    const label = BREADCRUMB_LABELS[currentPage] || '';

    const root = el('span', 'app-breadcrumb-root', 'Workspace');

    const sep = el('span', 'app-breadcrumb-sep', '/');
    sep.setAttribute('aria-hidden', 'true');

    const current = el('span', 'app-breadcrumb-current', label);

    breadcrumbEl.replaceChildren(root, sep, current);
}

/* ============================================
   Sidebar User Sync
   ============================================ */

function updateSidebarUser(profile) {
    const avatarEl = document.querySelector('[data-sidebar-user-avatar]');
    const nameEl = document.querySelector('[data-sidebar-user-name]');
    if (!avatarEl && !nameEl) return;

    const data = profile || (typeof getProfile === 'function' ? getProfile() : null);
    if (!data) return;

    if (avatarEl && typeof getInitials === 'function') {
        avatarEl.textContent = getInitials(data.fullName);
    }
    if (nameEl) {
        nameEl.textContent = data.fullName;
    }
}

/* ============================================
   Navigation Badges (Dynamic)
   ============================================ */

function setNavBadge(id, value) {
    const badge = document.querySelector(`[data-navigation-id="${id}"] .sidebar-nav-badge`);
    if (!badge) return;
    badge.textContent = String(value).padStart(2, '0');
}

function updateNavigationBadges() {
    if (typeof getFavoriteIds === 'function') {
        setNavBadge('favorites', getFavoriteIds().length);
    }
}

/* ============================================
   Setup
   ============================================ */

function setupNavigation() {
    document.querySelectorAll('[data-sidebar]').forEach((sidebar) => {
        renderSidebar(sidebar);

        const backdrop = el('div', 'sidebar-backdrop');
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);

        const toggle = document.querySelector(`[data-sidebar-toggle="${sidebar.id}"]`);

        const closeSidebar = () => {
            sidebar.classList.remove('is-open');
            backdrop.classList.remove('is-visible');
            document.body.classList.remove('sidebar-is-open');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        };

        sidebar.querySelector('.sidebar-nav-close').addEventListener('click', closeSidebar);

        if (toggle) {
            toggle.addEventListener('click', () => {
                const isOpen = sidebar.classList.toggle('is-open');
                backdrop.classList.toggle('is-visible', isOpen);
                document.body.classList.toggle('sidebar-is-open', isOpen);
                toggle.setAttribute('aria-expanded', String(isOpen));
            });
        }

        backdrop.addEventListener('click', closeSidebar);

        sidebar.addEventListener('click', (event) => {
            if (event.target.closest('a') && window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });

    renderBreadcrumb();
    updateSidebarUser();
    updateNavigationBadges();

     document.addEventListener('profile:updated', (e) => updateSidebarUser(e.detail));

    document.addEventListener('nav:badge', (e) => {
        const { id, value } = e.detail || {};
        if (id !== undefined && value !== undefined) {
            setNavBadge(id, value);
        }
    });

    document.addEventListener('favorite:changed', () => {
        updateNavigationBadges();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
} else {
    setupNavigation();
}