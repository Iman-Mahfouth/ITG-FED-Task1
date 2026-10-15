/* ==========================================================================
   Sign In page — DOM orchestration, state machine, form handling
   ========================================================================== */
(function () {
    'use strict';

    const STATES = {
        DEFAULT: 'default',
        LOADING: 'loading',
        INVALID_CREDENTIALS: 'invalid',
        NETWORK_ERROR: 'network-error'
    };

    const MESSAGES = {
        INVALID_CREDENTIALS:
            "Those details don't match our records. Check your username and password, or explore the demo.",
        NETWORK_ERROR:
            'Network error. Please check your connection and try again.',
        USERNAME_REQUIRED: 'Enter your username.',
        PASSWORD_REQUIRED: 'Enter your password.'
    };

    let currentState = STATES.DEFAULT;
    let refs = null;

    function getRefs() {
        return {
            form: document.getElementById('sign-in-form'),
            usernameInput: document.getElementById('username-input'),
            passwordInput: document.getElementById('password-input'),
            usernameError: document.getElementById('username-error'),
            passwordError: document.getElementById('password-error'),
            submitBtn: document.getElementById('sign-in-btn'),
            formAlert: document.getElementById('form-alert'),
            passwordToggle: document.getElementById('password-toggle'),
            exploreBtn: document.getElementById('explore-demo-btn')
        };
    }

    function setButtonLabel(button, text) {
        button.replaceChildren(document.createTextNode(text));
    }

    function setButtonLoading(button) {
        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('aria-hidden', 'true');
        button.replaceChildren(
            spinner,
            document.createTextNode('Signing in…')
        );
    }

    function hideAlert() {
        if (!refs.formAlert) return;
        refs.formAlert.classList.add('d-none');
        refs.formAlert.textContent = '';
    }

    function showAlert(message) {
        if (!refs.formAlert) return;
        refs.formAlert.textContent = message;
        refs.formAlert.classList.remove('d-none');
    }

    function clearFieldError(field) {
        const input = field === 'username' ? refs.usernameInput : refs.passwordInput;
        const errorEl = field === 'username' ? refs.usernameError : refs.passwordError;
        if (!input || !errorEl) return;

        input.classList.remove('is-invalid');
        input.removeAttribute('aria-describedby');
        errorEl.textContent = '';
        errorEl.classList.add('d-none');
    }

    function showFieldError(field, message) {
        const input = field === 'username' ? refs.usernameInput : refs.passwordInput;
        const errorEl = field === 'username' ? refs.usernameError : refs.passwordError;
        const errorId = field === 'username' ? 'username-error' : 'password-error';
        if (!input || !errorEl) return;

        input.classList.add('is-invalid');
        input.setAttribute('aria-describedby', errorId);
        errorEl.textContent = message;
        errorEl.classList.remove('d-none');
    }

    function clearAllFieldErrors() {
        clearFieldError('username');
        clearFieldError('password');
    }

    function setInputsDisabled(disabled) {
        if (refs.usernameInput) refs.usernameInput.disabled = disabled;
        if (refs.passwordInput) refs.passwordInput.disabled = disabled;
        if (refs.passwordToggle) refs.passwordToggle.disabled = disabled;
    }

    function setState(state) {
        currentState = state;

        switch (state) {
            case STATES.LOADING:
                hideAlert();
                clearAllFieldErrors();
                refs.submitBtn.disabled = true;
                setButtonLoading(refs.submitBtn);
                refs.form.setAttribute('aria-busy', 'true');
                setInputsDisabled(true);
                break;

            case STATES.INVALID_CREDENTIALS:
                clearAllFieldErrors();
                showAlert(MESSAGES.INVALID_CREDENTIALS);
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Sign in');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;

            case STATES.NETWORK_ERROR:
                clearAllFieldErrors();
                showAlert(MESSAGES.NETWORK_ERROR);
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Sign in');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;

            case STATES.DEFAULT:
            default:
                hideAlert();
                clearAllFieldErrors();
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Sign in');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;
        }
    }

    function validateFields() {
        const username = String(refs.usernameInput.value || '').trim();
        const password = String(refs.passwordInput.value || '');

        let valid = true;

        if (!username) {
            showFieldError('username', MESSAGES.USERNAME_REQUIRED);
            valid = false;
        } else {
            clearFieldError('username');
        }

        if (!password) {
            showFieldError('password', MESSAGES.PASSWORD_REQUIRED);
            valid = false;
        } else {
            clearFieldError('password');
        }

        return valid;
    }

    function isClientError(status) {
        return typeof status === 'number' && status >= 400 && status < 500;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (currentState === STATES.LOADING) return;

        hideAlert();

        if (!validateFields()) return;

        const username = String(refs.usernameInput.value || '').trim();
        const password = String(refs.passwordInput.value || '');

        setState(STATES.LOADING);

        try {
            const loginData = await loginRequest(username, password);
            const userData = await fetchCurrentUser(loginData.accessToken);

            saveSession({
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken,
                user: userData
            });

            window.location.replace('index.html');
        } catch (error) {
            if (isClientError(error && error.status)) {
                setState(STATES.INVALID_CREDENTIALS);
            } else {
                setState(STATES.NETWORK_ERROR);
            }
        }
    }

    function initPasswordToggle() {
        if (!refs.passwordToggle || !refs.passwordInput) return;

        refs.passwordToggle.addEventListener('click', () => {
            const isHidden = refs.passwordInput.type === 'password';
            refs.passwordInput.type = isHidden ? 'text' : 'password';
            refs.passwordToggle.textContent = isHidden ? 'Hide' : 'Show';
            refs.passwordToggle.setAttribute(
                'aria-label',
                isHidden ? 'Hide password' : 'Show password'
            );
        });
    }

    // KEEP IN SYNC with sign-up.js — duplicated per AUTH-03.
    async function handleExploreDemo() {
        // Defensive guard: if already authenticated, just navigate
        if (typeof getSession === 'function' && getSession()) {
            window.location.replace('index.html');
            return;
        }

        if (!refs.exploreBtn) return;

        // Set loading state
        refs.exploreBtn.disabled = true;
        refs.exploreBtn.setAttribute('aria-busy', 'true');
        setButtonLabel(refs.exploreBtn, 'Signing in to demo…');

        try {
            // Auto-login with working DummyJSON test credentials
            const loginData = await loginRequest('emilys', 'emilyspass');
            const userData = await fetchCurrentUser(loginData.accessToken);

            saveSession({
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken,
                user: userData
            });

            window.location.replace('index.html');
        } catch (error) {
            // Restore button state
            refs.exploreBtn.disabled = false;
            refs.exploreBtn.removeAttribute('aria-busy');
            setButtonLabel(refs.exploreBtn, 'Explore the demo →');

            // Show error using existing alert helper
            showAlert('Demo sign-in failed. Please try again.');
        }
    }

    function initSecondaryActions() {
        if (!refs.exploreBtn) return;

        refs.exploreBtn.addEventListener('click', handleExploreDemo);
    }

    function initFieldListeners() {
        if (refs.usernameInput) {
            refs.usernameInput.addEventListener('input', () => {
                clearFieldError('username');
            });
        }

        if (refs.passwordInput) {
            refs.passwordInput.addEventListener('input', () => {
                clearFieldError('password');
            });
        }
    }

    function checkExistingSession() {
        const session = getSession();
        if (session && session.accessToken) {
            window.location.replace('index.html');
            return true;
        }
        return false;
    }

    function init() {
        refs = getRefs();

        if (!refs.form || !refs.submitBtn || !refs.usernameInput || !refs.passwordInput) {
            return;
        }

        if (checkExistingSession()) {
            return;
        }

        refs.form.addEventListener('submit', handleSubmit);
        initPasswordToggle();
        initSecondaryActions();
        initFieldListeners();
        setState(STATES.DEFAULT);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
