/* ==========================================================================
   Sign Up page — DOM orchestration, validation, registration simulation
   ========================================================================== */
(function () {
    'use strict';

    const STATES = {
        DEFAULT: 'default',
        LOADING: 'loading',
        VALIDATION_ERROR: 'validation-error',
        API_ERROR: 'api-error',
        NETWORK_ERROR: 'network-error',
        SUCCESS: 'success'
    };

    const MESSAGES = {
        FULL_NAME_REQUIRED: 'Enter your full name.',
        USERNAME_REQUIRED: 'Enter a username.',
        EMAIL_REQUIRED: 'Enter your email address.',
        EMAIL_INVALID: 'Enter a valid email address.',
        PASSWORD_REQUIRED: 'Create a password.',
        PASSWORD_TOO_SHORT: 'Use at least 8 characters.',
        CONFIRM_REQUIRED: 'Enter your password again.',
        PASSWORDS_MISMATCH: "Your passwords don't match.",
        API_ERROR: 'Registration failed. Please try again.',
        NETWORK_ERROR: 'Network error. Please check your connection and try again.',
        SUCCESS:
            'Registration request completed. This training API does not save new accounts. To explore Learning Studio, sign in using the provided test account.'
    };

    const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const FIELD_ORDER = ['fullName', 'username', 'email', 'password', 'confirmPassword'];

    let currentState = STATES.DEFAULT;
    let refs = null;

    function getRefs() {
        return {
            form: document.getElementById('sign-up-form'),
            formSection: document.getElementById('signup-form-section'),
            successSection: document.getElementById('signup-success'),
            successMessage: document.getElementById('signup-success-message'),
            formAlert: document.getElementById('form-alert'),
            submitBtn: document.getElementById('sign-up-btn'),
            passwordToggle: document.getElementById('password-toggle'),
            exploreBtn: document.getElementById('explore-demo-btn'),
            inputs: {
                fullName: document.getElementById('full-name-input'),
                username: document.getElementById('username-input'),
                email: document.getElementById('email-input'),
                password: document.getElementById('password-input'),
                confirmPassword: document.getElementById('confirm-password-input')
            },
            errors: {
                fullName: document.getElementById('full-name-error'),
                username: document.getElementById('username-error'),
                email: document.getElementById('email-error'),
                password: document.getElementById('password-error'),
                confirmPassword: document.getElementById('confirm-password-error')
            }
        };
    }

    function mapFormToPayload(formValues) {
        const trimmedName = String(formValues.fullName || '').trim();
        const parts = trimmedName.split(/\s+/).filter(Boolean);
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

        return {
            firstName: firstName,
            lastName: lastName,
            username: String(formValues.username || '').trim(),
            email: String(formValues.email || '').trim(),
            password: String(formValues.password || '')
        };
    }

    function readFormValues() {
        return {
            fullName: refs.inputs.fullName.value,
            username: refs.inputs.username.value,
            email: refs.inputs.email.value,
            password: refs.inputs.password.value,
            confirmPassword: refs.inputs.confirmPassword.value
        };
    }

    function validateFullName(value) {
        if (!String(value || '').trim()) {
            return MESSAGES.FULL_NAME_REQUIRED;
        }
        return '';
    }

    function validateUsername(value) {
        if (!String(value || '').trim()) {
            return MESSAGES.USERNAME_REQUIRED;
        }
        return '';
    }

    function validateEmail(value) {
        const email = String(value || '').trim();
        if (!email) {
            return MESSAGES.EMAIL_REQUIRED;
        }
        if (!EMAIL_PATTERN.test(email)) {
            return MESSAGES.EMAIL_INVALID;
        }
        return '';
    }

    function validatePassword(value) {
        const password = String(value || '');
        if (!password) {
            return MESSAGES.PASSWORD_REQUIRED;
        }
        if (password.length < 8) {
            return MESSAGES.PASSWORD_TOO_SHORT;
        }
        return '';
    }

    function validateConfirmPassword(password, confirmPassword) {
        const confirm = String(confirmPassword || '');
        if (!confirm) {
            return MESSAGES.CONFIRM_REQUIRED;
        }
        if (confirm !== String(password || '')) {
            return MESSAGES.PASSWORDS_MISMATCH;
        }
        return '';
    }

    function validateAllFields(values) {
        const errors = {
            fullName: validateFullName(values.fullName),
            username: validateUsername(values.username),
            email: validateEmail(values.email),
            password: validatePassword(values.password),
            confirmPassword: validateConfirmPassword(values.password, values.confirmPassword)
        };

        const valid = FIELD_ORDER.every(function (field) {
            return !errors[field];
        });

        return { valid: valid, errors: errors };
    }

    function setButtonLabel(button, text) {
        button.replaceChildren(document.createTextNode(text));
    }

    function setButtonLoading(button) {
        const spinner = document.createElement('span');
        spinner.className = 'spinner-border spinner-border-sm me-2';
        spinner.setAttribute('aria-hidden', 'true');
        button.replaceChildren(spinner, document.createTextNode('Creating account…'));
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
        const input = refs.inputs[field];
        const errorEl = refs.errors[field];
        if (!input || !errorEl) return;

        input.classList.remove('is-invalid');
        input.removeAttribute('aria-describedby');
        errorEl.textContent = '';
        errorEl.classList.add('d-none');
    }

    function showFieldError(field, message) {
        const input = refs.inputs[field];
        const errorEl = refs.errors[field];
        const errorId = errorEl && errorEl.id;
        if (!input || !errorEl || !message) return;

        input.classList.add('is-invalid');
        if (errorId) {
            input.setAttribute('aria-describedby', errorId);
        }
        errorEl.textContent = message;
        errorEl.classList.remove('d-none');
    }

    function clearAllFieldErrors() {
        FIELD_ORDER.forEach(clearFieldError);
    }

    function applyFieldErrors(errors) {
        FIELD_ORDER.forEach(function (field) {
            if (errors[field]) {
                showFieldError(field, errors[field]);
            } else {
                clearFieldError(field);
            }
        });
    }

    function focusFirstInvalidField(errors) {
        for (let i = 0; i < FIELD_ORDER.length; i += 1) {
            const field = FIELD_ORDER[i];
            if (errors[field] && refs.inputs[field]) {
                refs.inputs[field].focus();
                return;
            }
        }
    }

    function setInputsDisabled(disabled) {
        FIELD_ORDER.forEach(function (field) {
            if (refs.inputs[field]) {
                refs.inputs[field].disabled = disabled;
            }
        });
        if (refs.passwordToggle) {
            refs.passwordToggle.disabled = disabled;
        }
    }

    function showFormView() {
        if (refs.formSection) {
            refs.formSection.classList.remove('d-none');
        }
        if (refs.successSection) {
            refs.successSection.classList.add('d-none');
        }
    }

    function showSuccessView() {
        if (refs.formSection) {
            refs.formSection.classList.add('d-none');
        }
        if (refs.successSection) {
            refs.successSection.classList.remove('d-none');
        }
        if (refs.successMessage) {
            refs.successMessage.textContent = MESSAGES.SUCCESS;
        }
    }

    function clearPasswordFields() {
        if (refs.inputs.password) {
            refs.inputs.password.value = '';
        }
        if (refs.inputs.confirmPassword) {
            refs.inputs.confirmPassword.value = '';
        }
    }

    function setState(state, options) {
        currentState = state;
        const opts = options || {};

        switch (state) {
            case STATES.LOADING:
                hideAlert();
                clearAllFieldErrors();
                showFormView();
                refs.submitBtn.disabled = true;
                setButtonLoading(refs.submitBtn);
                refs.form.setAttribute('aria-busy', 'true');
                setInputsDisabled(true);
                break;

            case STATES.VALIDATION_ERROR:
                hideAlert();
                showFormView();
                applyFieldErrors(opts.errors || {});
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Create account');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                focusFirstInvalidField(opts.errors || {});
                break;

            case STATES.API_ERROR:
                clearAllFieldErrors();
                showFormView();
                showAlert(MESSAGES.API_ERROR);
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Create account');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;

            case STATES.NETWORK_ERROR:
                clearAllFieldErrors();
                showFormView();
                showAlert(MESSAGES.NETWORK_ERROR);
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Create account');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;

            case STATES.SUCCESS:
                hideAlert();
                clearAllFieldErrors();
                clearPasswordFields();
                showSuccessView();
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Create account');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;

            case STATES.DEFAULT:
            default:
                hideAlert();
                clearAllFieldErrors();
                showFormView();
                refs.submitBtn.disabled = false;
                setButtonLabel(refs.submitBtn, 'Create account');
                refs.form.removeAttribute('aria-busy');
                setInputsDisabled(false);
                break;
        }
    }

    function isNetworkFailure(error) {
        if (!error) return true;
        if (typeof error.status === 'number') return false;
        return error.message === 'Network request failed.';
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (currentState === STATES.LOADING) return;

        hideAlert();

        const values = readFormValues();
        const result = validateAllFields(values);

        if (!result.valid) {
            setState(STATES.VALIDATION_ERROR, { errors: result.errors });
            return;
        }

        setState(STATES.LOADING);

        try {
            await registerRequest(mapFormToPayload(values));
            setState(STATES.SUCCESS);
        } catch (error) {
            if (isNetworkFailure(error)) {
                setState(STATES.NETWORK_ERROR);
            } else {
                setState(STATES.API_ERROR);
            }
        }
    }

    function initPasswordToggle() {
        if (!refs.passwordToggle || !refs.inputs.password) return;

        refs.passwordToggle.addEventListener('click', function () {
            const isHidden = refs.inputs.password.type === 'password';
            refs.inputs.password.type = isHidden ? 'text' : 'password';
            refs.passwordToggle.textContent = isHidden ? 'Hide' : 'Show';
            refs.passwordToggle.setAttribute(
                'aria-label',
                isHidden ? 'Hide password' : 'Show password'
            );
        });
    }

    function initFieldListeners() {
        FIELD_ORDER.forEach(function (field) {
            const input = refs.inputs[field];
            if (!input) return;
            input.addEventListener('input', function () {
                clearFieldError(field);
            });
        });
    }

    // KEEP IN SYNC with sign-in.js — duplicated per AUTH-03.
    async function handleExploreDemo(event) {
        if (event) event.preventDefault();

        // Defensive guard: if already authenticated, just navigate
        if (typeof getSession === 'function' && getSession()) {
            window.location.replace('index.html');
            return;
        }

        const button = refs.exploreBtn;
        if (!button) return;

        // Set loading state
        button.setAttribute('aria-disabled', 'true');
        button.setAttribute('aria-busy', 'true');
        const originalText = button.textContent;
        button.textContent = 'Signing in to demo…';

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
            button.removeAttribute('aria-disabled');
            button.removeAttribute('aria-busy');
            button.textContent = originalText;

            // Show error
            showAlert('Demo sign-in failed. Please try again.');
        }
    }

    function initSecondaryActions() {
        if (!refs.exploreBtn) return;
        refs.exploreBtn.addEventListener('click', handleExploreDemo);
    }

    function init() {
        refs = getRefs();

        if (
            !refs.form ||
            !refs.submitBtn ||
            !refs.inputs.fullName ||
            !refs.inputs.username ||
            !refs.inputs.email ||
            !refs.inputs.password ||
            !refs.inputs.confirmPassword
        ) {
            return;
        }

        refs.form.addEventListener('submit', handleSubmit);
        initPasswordToggle();
        initFieldListeners();
        initSecondaryActions();
        setState(STATES.DEFAULT);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
