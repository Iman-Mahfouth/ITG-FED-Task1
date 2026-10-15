/* ==========================================================================
   Auth Guard — session validation and redirect (runs synchronously at load)
   ========================================================================== */
(function (global) {
    'use strict';

    const SIGN_IN_URL = 'sign-in.html';
    const SIGN_OUT_URL = 'sign-out.html';

    function redirectTo(url) {
        document.documentElement.style.visibility = 'hidden';
        location.replace(url);
    }

    const session = getSession();
    if (!session) {
        redirectTo(SIGN_IN_URL);
    } else {

        document.addEventListener('DOMContentLoaded', async function () {
            const snapshotToken = session.accessToken;

            try {
                const user = await fetchCurrentUser(snapshotToken);

                const currentSession = getSession();
                if (currentSession && currentSession.accessToken === snapshotToken) {
                    if (updateSessionUser(user)) {
                        document.dispatchEvent(new CustomEvent('auth:user', { detail: user }));
                    }
                }
            } catch (error) {
                const currentSession = getSession();
                if (!currentSession || currentSession.accessToken !== snapshotToken) {
                    return; // Session changed, ignore stale validation
                }

                if (error && (error.status === 401 || error.status === 403)) {
                    clearSession();
                    redirectTo(SIGN_IN_URL);
                } else {
                    console.warn('Session validation failed, keeping cached session');
                }
            }
        }, { once: true });

        window.addEventListener('pageshow', function (event) {
            if (event.persisted && !getSession()) {
                redirectTo(SIGN_IN_URL);
            }
        });

        window.addEventListener('storage', function (event) {
            if ((event.key === SESSION_STORAGE_KEY || event.key === null) && !getSession()) {
                redirectTo(SIGN_IN_URL);
            }
        });
    }

    function signOutUser() {
        clearSession();
        
        if (getSession()) {
            try {
                localStorage.removeItem(SESSION_STORAGE_KEY);
            } catch (_) {
            }
            
            if (getSession()) {
                console.warn('Session could not be cleared - sign-out proceeding anyway');
            }
        }
        
        try {
            sessionStorage.setItem(SIGNED_OUT_FLAG_KEY, '1');
        } catch (_) {
        }
        
        redirectTo(SIGN_OUT_URL);
    }

    global.signOutUser = signOutUser;
})(window);
