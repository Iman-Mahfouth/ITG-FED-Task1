/* ==========================================================================
   Application Shell (FED-30)
   JS builder for shared header + footer across all pages
   ========================================================================== */

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
   Header Builder
   ============================================ */

function createNotificationButton() {
    const button = el('button', 'app-icon-btn');
    button.type = 'button';
    button.setAttribute('aria-label', 'Notifications');

    const icon = el('i', 'fa-regular fa-bell');
    icon.setAttribute('aria-hidden', 'true');

    button.appendChild(icon);
    return button;
}

function createThemeToggle() {
    const button = el('button', 'app-theme-toggle');
    button.type = 'button';
    button.setAttribute('aria-label', 'Toggle appearance');
    button.setAttribute('data-theme-toggle', '');

    const moonIcon = el('i', 'fa-regular fa-moon theme-toggle-moon');
    moonIcon.setAttribute('aria-hidden', 'true');

    const sunIcon = el('i', 'fa-solid fa-sun theme-toggle-sun');
    sunIcon.setAttribute('aria-hidden', 'true');

    button.append(moonIcon, sunIcon);
    return button;
}

function createProfileSection() {
    const section = el('div', 'profile-section d-flex align-items-center gap-2 cursor-pointer flex-shrink-0');

    const avatarIcon = el('div', 'avatar-icon');
    const avatarInitials = el('span', 'avatar-initials', 'L');
    avatarInitials.id = 'header-avatar';
    avatarIcon.appendChild(avatarInitials);

    const greeting = el('span', 'fw-medium text-secondary fs-6 d-none d-lg-inline', 'Hi, Learner!');
    greeting.id = 'header-greeting-name';

    const chevron = el('i', 'fa-solid fa-chevron-down text-secondary fs-6 d-none d-lg-inline');

    section.append(avatarIcon, greeting, chevron);
    return section;
}

function createHeaderActions(hasBell) {
    const actions = el('div', 'header-actions');

    if (hasBell) {
        actions.appendChild(createNotificationButton());
    }

    actions.appendChild(createThemeToggle());
    actions.appendChild(createProfileSection());

    return actions;
}

function createHamburgerButton(sidebarId) {
    const button = el('button', 'navbar-toggler border-0 shadow-none d-md-none flex-shrink-0');
    button.type = 'button';
    button.setAttribute('data-sidebar-toggle', sidebarId);
    button.setAttribute('aria-controls', sidebarId);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Toggle navigation');

    const icon = el('span', 'navbar-toggler-icon');
    button.appendChild(icon);

    return button;
}

function createBreadcrumb() {
    const nav = el('nav', 'app-breadcrumb');
    nav.setAttribute('data-breadcrumb', '');
    nav.setAttribute('aria-label', 'Breadcrumb');
    return nav;
}

function createSearchBar() {
    const wrapper = el('div', 'header-search');
    wrapper.setAttribute('dir', 'ltr');

    const inputGroup = el('div', 'input-group rounded-3 overflow-hidden border bg-light');

    const iconSpan = el('span', 'input-group-text bg-transparent border-0 ps-3 text-muted');
    const icon = el('i', 'fa-solid fa-magnifying-glass');
    iconSpan.appendChild(icon);

    const input = el('input');
    input.type = 'search';
    input.className = 'form-control border-0 shadow-none bg-transparent';
    input.placeholder = 'Search courses, instructors, levels...';
    input.setAttribute('aria-label', 'Global search');

    inputGroup.append(iconSpan, input);
    wrapper.appendChild(inputGroup);

    return wrapper;
}

function createHeader(headerEl) {
    const hasBell = headerEl.dataset.hasBell === 'true';
    const sidebarId = 'mainSidebar';

    const header = el('header', 'navbar navbar-light bg-white border-bottom py-3 sticky-top');
    const container = el('div', 'container');
    const headerContainer = el('div', 'header-container d-flex w-100 align-items-center gap-2 gap-md-3');

    headerContainer.appendChild(createHamburgerButton(sidebarId));
    headerContainer.appendChild(createBreadcrumb());
    headerContainer.appendChild(createSearchBar());
    headerContainer.appendChild(createHeaderActions(hasBell));

    container.appendChild(headerContainer);
    header.appendChild(container);

    return header;
}

function renderHeader(headerEl) {
    if (!headerEl) return;
    const header = createHeader(headerEl);
    headerEl.replaceWith(header);
}

/* ============================================
   Footer Builder
   ============================================ */

function createFooter(footerEl) {
    const variant = footerEl.dataset.variant || 'standard';

    const footer = el('footer', 'bg-light border-top py-3 mt-auto');
    const container = el('div', 'container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2');

    const leftSpan = el('span', 'text-muted small', 'Made for your next chapter.');

    const rightSpan = el('span', 'text-muted small');

    if (variant === 'attribution') {
        rightSpan.id = 'cd-footer-attribution';
        rightSpan.textContent = 'Content © ImpactMojo — CC BY-NC-ND 4.0 — https://impactmojo.in';
    } else {
        rightSpan.textContent = 'MyCourses ✦ Keep growing.';
    }

    container.append(leftSpan, rightSpan);
    footer.appendChild(container);

    return footer;
}

function renderFooter(footerEl) {
    if (!footerEl) return;
    const footer = createFooter(footerEl);
    footerEl.replaceWith(footer);
}

/* ============================================
   Setup
   ============================================ */

function setupShell() {
    // Render all headers
    document.querySelectorAll('[data-header]').forEach(renderHeader);

    // Render all footers
    document.querySelectorAll('[data-footer]').forEach(renderFooter);

    // Emit ready event for coordination with other modules (e.g., profile-storage.js)
    document.dispatchEvent(new CustomEvent('shell:ready'));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupShell);
} else {
    setupShell();
}
