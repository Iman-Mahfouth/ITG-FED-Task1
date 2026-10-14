/* ==========================================================================
   Sign Out page — guard against authenticated access (no clearing)
   ========================================================================== */
(function () {
    'use strict';

    function checkAndRedirect() {
        // Use the sign-out flag only. NEVER call getSession() here —
        // a failed clearSession() could leave a stale session and bounce
        // the learner back into the app as if still signed in.
        try {
            if (sessionStorage.getItem('ml_signed_out') === '1') {
                sessionStorage.removeItem('ml_signed_out');
            }
        } catch (_) {
            /* ignore sessionStorage errors */
        }
    }

    checkAndRedirect();

    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            checkAndRedirect();
        }
    });
})();
