/* ==========================================================================
   Appearance Preferences (FED-40)
   ========================================================================== */
(function (global) {
    'use strict';

    const STORAGE_KEY   = 'mycourses:appearance';
    const THEME_EVENT   = 'theme:change';
    const VALID_VALUES  = ['light', 'dark', 'system'];
    const DEFAULT_VALUE = 'system';
    const THEME_LABELS  = { light: 'Light', dark: 'Dark', system: 'System' };


    let currentValue = DEFAULT_VALUE;
    let mediaQuery   = null;
    let initialized  = false;

    function readStoredValue() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return VALID_VALUES.includes(raw) ? raw : DEFAULT_VALUE;
        } catch (_) {
            return DEFAULT_VALUE;
        }
    }

    function writeStoredValue(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (_) {
        }
    }

    /* ---------------------------------------------------------------------
       Pure helpers
       --------------------------------------------------------------------- */
    function systemPrefersDark() {
        return !!(mediaQuery && mediaQuery.matches);
    }

    function resolveValue(value) {
        if (value === 'light' || value === 'dark') return value;
        return systemPrefersDark() ? 'dark' : 'light';
    }

    function applyToDocument(resolved) {
        document.documentElement.setAttribute('data-bs-theme', resolved);
    }

    /* ---------------------------------------------------------------------
       Broadcasting 
       --------------------------------------------------------------------- */
    function broadcast(value, resolved) {
        document.dispatchEvent(new CustomEvent(THEME_EVENT, {
            detail: { value, resolved }
        }));
    }

  
    function syncControls(value) {
        document.querySelectorAll('[data-theme-value]').forEach((input) => {
            input.checked = (input.value === value);
        });

        const label = THEME_LABELS[value] || THEME_LABELS[DEFAULT_VALUE];
        document.querySelectorAll('[data-theme-current]').forEach((el) => {
            el.textContent = label;
        });
    }

    /* ---------------------------------------------------------------------
       Toast
       --------------------------------------------------------------------- */
       function ensureToastElement() {
        const existing = document.getElementById('appearance-toast');
        if (existing) return existing;

        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container position-fixed bottom-0 start-50 translate-middle-x p-3';
            container.setAttribute('data-appearance-toast-container', '');
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.id = 'appearance-toast';
        toast.className = 'toast appearance-toast border-0 mb-2';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');

        const row = document.createElement('div');
        row.className = 'd-flex';

        const message = document.createElement('div');
        message.id = 'appearance-toast-message';
        message.className = 'toast-body';
        message.textContent = 'Appearance saved.';

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close btn-close-white me-2 m-auto';
        closeBtn.setAttribute('data-bs-dismiss', 'toast');
        closeBtn.setAttribute('aria-label', 'Close');

        row.append(message, closeBtn);
        toast.appendChild(row);
        container.appendChild(toast);

        return toast;
    }

    function showToast(value) {
        if (typeof bootstrap === 'undefined') return;

        const toastEl   = ensureToastElement();
        const messageEl = toastEl.querySelector('#appearance-toast-message');
        if (!messageEl) return;

        const label = THEME_LABELS[value] || THEME_LABELS[DEFAULT_VALUE];
        messageEl.textContent = `${label} appearance saved.`;
        bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3000 }).show();
    }

    /* ---------------------------------------------------------------------
       Public API
       --------------------------------------------------------------------- */
    function getValue()    { return currentValue; }
    function getResolved() { return resolveValue(currentValue); }

    function set(value) {
        if (!VALID_VALUES.includes(value)) return;

        const changed = currentValue !== value;
        currentValue = value;
        writeStoredValue(value);

        const resolved = resolveValue(value);
        applyToDocument(resolved);
        syncControls(value);
        broadcast(value, resolved);

        if (changed) showToast(value);
    }

    function toggle() {
        const resolved = resolveValue(currentValue);
        set(resolved === 'dark' ? 'light' : 'dark');
    }

    /* ---------------------------------------------------------------------
       Events 
       --------------------------------------------------------------------- */
    function bindEvents() {
        // Header toggle — delegated so future toggles work automatically
        document.addEventListener('click', (event) => {
            const toggleBtn = event.target.closest('[data-theme-toggle]');
            if (!toggleBtn) return;
            event.preventDefault();
            toggle();
        });

        document.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLInputElement && target.matches('[data-theme-value]')) {
                set(target.value);
            }
        });

        if (mediaQuery) {
            const handler = () => {
                if (currentValue !== 'system') return;
                const resolved = resolveValue(currentValue);
                applyToDocument(resolved);
                broadcast(currentValue, resolved);
            };

            if (typeof mediaQuery.addEventListener === 'function') {
                mediaQuery.addEventListener('change', handler);
            } else if (typeof mediaQuery.addListener === 'function') {
                mediaQuery.addListener(handler); // Legacy Safari
            }
        }
    }

    /* ---------------------------------------------------------------------
       Init
       --------------------------------------------------------------------- */
    function init() {
        if (initialized) return;
        initialized = true;

        mediaQuery   = window.matchMedia('(prefers-color-scheme: dark)');
        currentValue = readStoredValue();

        const resolved = resolveValue(currentValue);
        applyToDocument(resolved);
        syncControls(currentValue);
        broadcast(currentValue, resolved);

        bindEvents();
    }

    /* ---------------------------------------------------------------------
       Expose + auto-boot
       --------------------------------------------------------------------- */
    global.Theme = { init, get: getValue, getResolved, set, toggle };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(window);