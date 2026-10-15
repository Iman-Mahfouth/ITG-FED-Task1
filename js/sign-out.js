/* ==========================================================================
   Sign Out page — guard against authenticated access (no clearing)
   ========================================================================== */
(function () {
    'use strict';

    function checkAndRedirect() {
        try {
            if (sessionStorage.getItem(SIGNED_OUT_FLAG_KEY) === '1') {
                sessionStorage.removeItem(SIGNED_OUT_FLAG_KEY);
            }
        } catch (_) {
        }
    }

    checkAndRedirect();

    window.addEventListener('pageshow', function (event) {
        if (event.persisted) {
            checkAndRedirect();
        }
    });
})();
