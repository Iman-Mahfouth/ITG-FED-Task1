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
        return safeProfile;
    } catch (error) {
        console.error('Failed to save profile to localStorage:', error);
        return { ...DEFAULT_PROFILE };
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
    const headerEl = document.getElementById('header-greeting-name');
    if (!headerEl) return;

    const profile = getProfile();
    headerEl.textContent = `Hi, ${profile.fullName}!`;
}

updateHeaderGreeting();