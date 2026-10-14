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

    // Immediate session check (synchronous)
    const session = getSession();
    if (!session) {
        redirectTo(SIGN_IN_URL);
        // Script stops here - no further registration
    } else {
        // Session exists - register async validation and listeners

        // Background validation on DOMContentLoaded (ONE TIME)
        document.addEventListener('DOMContentLoaded', async function () {
            const snapshotToken = session.accessToken;

            try {
                const user = await fetchCurrentUser(snapshotToken);

                // Only update if session hasn't changed
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
                    // Network or other error - keep cached session, don't redirect
                    console.warn('Session validation failed, keeping cached session');
                }
            }
        }, { once: true });

        // Back/forward cache detection
        window.addEventListener('pageshow', function (event) {
            if (event.persisted && !getSession()) {
                redirectTo(SIGN_IN_URL);
            }
        });

        // Cross-tab logout detection
        window.addEventListener('storage', function (event) {
            if ((event.key === 'ml_session' || event.key === null) && !getSession()) {
                redirectTo(SIGN_IN_URL);
            }
        });
    }

    // Global sign-out function (idempotent)
    function signOutUser() {
        clearSession();
        
        // Verify session cleared
        if (getSession()) {
            try {
                localStorage.removeItem('ml_session');
            } catch (_) {
                // Ignore errors
            }
            
            // Re-verify after fallback
            if (getSession()) {
                console.warn('Session could not be cleared - sign-out proceeding anyway');
            }
        }
        
        // Set sessionStorage flag to prevent stale session restoration
        try {
            sessionStorage.setItem('ml_signed_out', '1');
        } catch (_) {
            // Ignore sessionStorage errors
        }
        
        // Always redirect regardless of clear success
        redirectTo(SIGN_OUT_URL);
    }

    global.signOutUser = signOutUser;
})(window);
