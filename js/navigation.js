const navigationGroups = [
    {
        label: 'The learning studio',
        items: [
            { id: 'overview', label: 'Overview', icon: 'fa-solid fa-border-all', href: 'index.html' },
            { id: 'explore', label: 'Explore courses', icon: 'fa-regular fa-compass', href: 'index.html', badge: '09' },
            { id: 'paths', label: 'Learning paths', icon: 'fa-solid fa-diagram-project', href: '#' },
            { id: 'learning', label: 'My learning', icon: 'fa-regular fa-book-open', href: 'my-learning.html', badge: '3' },
            { id: 'favorites', label: 'Favorites', icon: 'fa-regular fa-heart', href: 'favorites.html', badge: '0' }
        ]
    },
    {
        label: 'Make it a habit',
        items: [
            { id: 'planner', label: 'Study planner', icon: 'fa-regular fa-calendar', href: '#' },
            { id: 'notebook', label: 'My notebook', icon: 'fa-regular fa-file-lines', href: '#' },
            { id: 'progress', label: 'Progress insights', icon: 'fa-solid fa-chart-simple', href: '#' }
        ]
    },
    {
        items: [
            { id: 'profile', label: 'My profile', icon: 'fa-regular fa-user', href: 'profile.html' }
        ]
    }
];

function createLogo() {
    const logo = document.createElement('a');
    logo.href = 'index.html';
    logo.className = 'sidebar-logo';
    logo.setAttribute('aria-label', 'MyCourses home');

    const img = document.createElement('img');
    img.src = 'assets/images/brand.svg';
    img.alt = '';
    img.className = 'sidebar-logo-img';
    img.width = 35;
    img.height = 35;

    const text = document.createElement('span');
    text.className = 'sidebar-logo-text';
    text.innerHTML = 'My<span class="sidebar-logo-text-courses">Courses</span>';

    logo.append(img, text);
    return logo;
}

function createNavigationItem(item, currentPage) {
    const link = document.createElement('a');
    const isActive = item.id === currentPage;

    link.className = `sidebar-nav-item${isActive ? ' active' : ''}`;
    link.href = item.href;
    link.dataset.navigationId = item.id;
    if (isActive) link.setAttribute('aria-current', 'page');

    const icon = document.createElement('i');
    icon.className = item.icon;
    icon.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'sidebar-nav-label';
    label.textContent = item.label;

    link.append(icon, label);

    if (item.badge) {
        const badge = document.createElement('span');
        badge.className = 'sidebar-nav-badge';
        badge.textContent = item.badge;
        link.appendChild(badge);
    }

    return link;
}

function renderSidebar(sidebar) {
    const currentPage = sidebar.dataset.current || '';
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav-content';
    nav.setAttribute('aria-label', 'Main navigation');

    navigationGroups.forEach((group) => {
        const section = document.createElement('div');
        section.className = 'sidebar-nav-group';

        if (group.label) {
            const heading = document.createElement('p');
            heading.className = 'sidebar-nav-group-label';
            heading.textContent = group.label;
            section.appendChild(heading);
        }

        const list = document.createElement('div');
        list.className = 'sidebar-nav-list';
        group.items.forEach((item) => list.appendChild(createNavigationItem(item, currentPage)));
        section.appendChild(list);
        nav.appendChild(section);
    });

    const closeButton = document.createElement('button');
    closeButton.className = 'sidebar-nav-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close navigation');
    closeButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
    closeButton.addEventListener('click', () => sidebar.classList.remove('is-open'));

    sidebar.replaceChildren(closeButton, nav);
}

function setupNavigation() {
    document.querySelectorAll('[data-sidebar]').forEach((sidebar) => {
        renderSidebar(sidebar);
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
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
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupNavigation);
} else {
    setupNavigation();
}
