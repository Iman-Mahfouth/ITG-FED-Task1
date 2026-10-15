const PROFILE_STORAGE_KEY = 'ml_profile';

const DEFAULT_PROFILE = {
    fullName: 'Learner',
    email: 'learner@example.com',
    role: 'Student',
    about: '',
    weeklyGoal: '5'
};

function getProfile() {
    try {
        const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_PROFILE };

        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return { ...DEFAULT_PROFILE };
        }

        return { ...DEFAULT_PROFILE, ...parsed };
    } catch (error) {
        console.error('Failed to read profile from localStorage:', error);
        return { ...DEFAULT_PROFILE };
    }
}

function saveProfile(profile) {
    try {
        const safeProfile = {
            fullName: String(profile?.fullName || DEFAULT_PROFILE.fullName).trim(),
            email: String(profile?.email || DEFAULT_PROFILE.email).trim(),
            role: String(profile?.role || DEFAULT_PROFILE.role).trim(),
            about: String(profile?.about || '').trim(),
            weeklyGoal: String(profile?.weeklyGoal || DEFAULT_PROFILE.weeklyGoal)
        };

        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(safeProfile));
        return { success: true, profile: safeProfile };
    } catch (error) {
        console.error('Failed to save profile to localStorage:', error);
        return { success: false, profile: null };
    }
}

function getInitials(name) {
    const safeName = String(name || '').trim();
    if (!safeName) return '?';

    const parts = safeName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0][0].toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
}


function updateHeaderGreeting() {
    const nameEl = document.getElementById('header-greeting-name');
    const avatarEl = document.getElementById('header-avatar');

    const session = typeof getSession === 'function' ? getSession() : null;
    if (!session || !session.user) return;

    const user = session.user;
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

    if (nameEl) nameEl.textContent = `Hi, ${fullName}!`;

    if (avatarEl) {
        avatarEl.replaceChildren();

        const imageUrl = user.image ? String(user.image).trim() : '';
        if (imageUrl.startsWith('https://')) {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.style.borderRadius = 'inherit';

            img.onerror = function () {
                avatarEl.replaceChildren();
                avatarEl.textContent = getInitials(fullName);
            };

            avatarEl.appendChild(img);
        } else {
            avatarEl.textContent = getInitials(fullName);
        }
    }
}
updateHeaderGreeting();
document.addEventListener('auth:user', updateHeaderGreeting);