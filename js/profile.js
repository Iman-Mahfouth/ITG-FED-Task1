
const profileForm = document.getElementById('profile-form');
const fullNameInput = document.getElementById('profile-full-name');
const emailInput = document.getElementById('profile-email');
const roleInput = document.getElementById('profile-role');
const aboutInput = document.getElementById('profile-about');
const goalInput = document.getElementById('profile-goal');

const avatarEl = document.getElementById('profile-avatar');
const summaryNameEl = document.getElementById('profile-summary-name');
const summaryRoleEl = document.getElementById('profile-summary-role');

const saveBtn = document.getElementById('profile-save');
const cancelBtn = document.getElementById('profile-cancel');

function updateSummaryCard(profile) {
    if (avatarEl) avatarEl.textContent = getInitials(profile.fullName);
    if (summaryNameEl) summaryNameEl.textContent = profile.fullName;
    if (summaryRoleEl) summaryRoleEl.textContent = profile.role;
}

function fillFormWithProfile(profile) {
    if (fullNameInput) fullNameInput.value = profile.fullName;
    if (emailInput) emailInput.value = profile.email;
    if (roleInput) roleInput.value = profile.role;
    if (aboutInput) aboutInput.value = profile.about;
    if (goalInput) goalInput.value = profile.weeklyGoal;
}

function readFormValues() {
    return {
        fullName: fullNameInput?.value || '',
        email: emailInput?.value || '',
        role: roleInput?.value || '',
        about: aboutInput?.value || '',
        weeklyGoal: goalInput?.value || '5'
    };
}

/* Event Handlers */

function handleSave(event) {
    event.preventDefault();

    const formValues = readFormValues();
    const savedProfile = saveProfile(formValues);

    updateSummaryCard(savedProfile);
    updateHeaderGreeting();

    fillFormWithProfile(savedProfile);

    showProfileFeedback('Profile saved successfully.');
}

function handleCancel() {
    const savedProfile = getProfile();
    fillFormWithProfile(savedProfile);
    updateSummaryCard(savedProfile);
    showProfileFeedback('Changes discarded.');
}

function handleNameInput() {
    const name = fullNameInput?.value || '';
    if (avatarEl) avatarEl.textContent = getInitials(name);
}

function showProfileFeedback(message) {
    console.log('[Profile]', message);
}

function initProfile() {
    if (!profileForm) return;

    const savedProfile = getProfile();
    fillFormWithProfile(savedProfile);
    updateSummaryCard(savedProfile);

    profileForm.addEventListener('submit', handleSave);
    if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
    if (fullNameInput) fullNameInput.addEventListener('input', handleNameInput);
}

initProfile();