/* ==========================================================================
   Auth API (DummyJSON) — pure layer, no DOM, no localStorage
   ========================================================================== */
(function (global) {
    'use strict';

    const LOGIN_URL = 'https://dummyjson.com/auth/login';
    const ME_URL = 'https://dummyjson.com/auth/me';
    const REGISTER_URL = 'https://dummyjson.com/users/add';

    function createAuthError(message, status) {
        const error = new Error(message);
        if (typeof status === 'number') {
            error.status = status;
        }
        return error;
    }

    function pickUserFields(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }

        return {
            id: data.id,
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            image: data.image
        };
    }

    /**
     * POST /auth/login
     * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
     */
    async function loginRequest(username, password) {
        const safeUsername = String(username || '').trim();
        const safePassword = String(password || '');

        if (!safeUsername || !safePassword) {
            throw createAuthError('Username and password are required.', 400);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        let response;
        try {
            response = await fetch(LOGIN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: safeUsername, password: safePassword }),
                signal: controller.signal
            });
        } catch (_) {
            throw createAuthError('Network request failed.');
        } finally {
            clearTimeout(timer);
        }

        if (!response.ok) {
            throw createAuthError('Login failed.', response.status);
        }

        let data;
        try {
            data = await response.json();
        } catch (_) {
            throw createAuthError('Invalid login response.');
        }

        const accessToken = data.accessToken || data.token;
        const refreshToken = data.refreshToken;

        if (!accessToken || !refreshToken) {
            throw createAuthError('Login response missing tokens.');
        }

        return {
            accessToken,
            refreshToken
        };
    }

    /**
     * GET /auth/me with Bearer accessToken
     * @returns {Promise<{ id, username, firstName, lastName, image }>}
     */
  async function fetchCurrentUser(accessToken) {
    const token = String(accessToken || '').trim();
    if (!token) {
        throw createAuthError('Access token is required.', 401);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
        response = await fetch(ME_URL, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            },
            signal: controller.signal
        });
    } catch (_) {
        throw createAuthError('Network request failed.');
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        throw createAuthError('Failed to fetch current user.', response.status);
    }

    let data;
    try {
        data = await response.json();
    } catch (_) {
        throw createAuthError('Invalid user response.');
    }

    const user = pickUserFields(data);
    if (!user || user.id == null || !user.username) {
        throw createAuthError('User response missing required fields.');
    }

    return user;
}

    /**
     * POST /users/add — registration simulation (DummyJSON does not persist users)
     * @param {{ firstName: string, lastName: string, username: string, email: string, password: string }} payload
     * @returns {Promise<{ id, firstName, lastName, username, email }>}
     */
    async function registerRequest(payload) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);

        let response;
        try {
            response = await fetch(REGISTER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: payload.firstName,
                    lastName: payload.lastName,
                    username: payload.username,
                    email: payload.email,
                    password: payload.password
                }),
                signal: controller.signal
            });
        } catch (_) {
            throw createAuthError('Network request failed.');
        } finally {
            clearTimeout(timer);
        }

        if (!response.ok) {
            throw createAuthError('Registration failed.', response.status);
        }

        let data;
        try {
            data = await response.json();
        } catch (_) {
            throw createAuthError('Invalid registration response.');
        }

        return {
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email
        };
    }

    global.loginRequest = loginRequest;
    global.fetchCurrentUser = fetchCurrentUser;
    global.registerRequest = registerRequest;
})(window);
