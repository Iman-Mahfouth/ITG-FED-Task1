/* ==========================================================================
   Auth Storage — ml_session localStorage only, no DOM, no API calls
   ========================================================================== */
(function (global) {
    'use strict';

    const SESSION_STORAGE_KEY = 'ml_session';
    // Shared with auth-guard.js / sign-out.js — keep a single source of truth
    const SIGNED_OUT_FLAG_KEY = 'ml_signed_out';

    function isValidUser(user) {
        return !!(
            user &&
            typeof user === 'object' &&
            user.id != null &&
            typeof user.username === 'string' &&
            user.username.length > 0
        );
    }

    function normalizeUser(user) {
        if (!isValidUser(user)) return null;

        return {
            id: user.id,
            username: String(user.username),
            firstName: String(user.firstName || ''),
            lastName: String(user.lastName || ''),
            image: String(user.image || '')
        };
    }

    function writeSession(raw) {
        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(raw));
        } catch (_) {
            const error = new Error('Failed to persist session.');
            error.status = 500;
            throw error;
        }
    }
    
    function getSession() {
        try {
            const raw = localStorage.getItem(SESSION_STORAGE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return null;

            const accessToken = String(parsed.accessToken || '').trim();
            const refreshToken = String(parsed.refreshToken || '').trim();
            const user = normalizeUser(parsed.user);

            if (!accessToken || !refreshToken || !user) return null;

            return {
                accessToken,
                refreshToken,
                user
            };
        } catch (_) {
            return null;
        }
    }

    function saveSession({ accessToken, refreshToken, user }) {
        const safeAccessToken = String(accessToken || '').trim();
        const safeRefreshToken = String(refreshToken || '').trim();
        const safeUser = normalizeUser(user);

        if (!safeAccessToken || !safeRefreshToken || !safeUser) {
            throw new Error('Cannot save session: missing required fields.');
        }

        const session = {
            accessToken: safeAccessToken,
            refreshToken: safeRefreshToken,
            user: safeUser
        };
        writeSession(session);
    }

    function clearSession() {
        try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch (_) {
            /* ignore storage failures on clear */
        }
    }

    function updateSessionUser(user) {
        const session = getSession();
        if (!session) return false;

        const normalizedUser = normalizeUser(user);
        if (!normalizedUser) return false;

        try {
            writeSession({
                accessToken: session.accessToken,
                refreshToken: session.refreshToken,
                user: normalizedUser
            });
            return true;
        } catch (_) {
            return false;
        }
    }

    global.getSession = getSession;
    global.saveSession = saveSession;
    global.clearSession = clearSession;
    global.updateSessionUser = updateSessionUser;
    global.SESSION_STORAGE_KEY = SESSION_STORAGE_KEY;
    global.SIGNED_OUT_FLAG_KEY = SIGNED_OUT_FLAG_KEY;
})(window);
