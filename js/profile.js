
const profileForm = document.getElementById('profile-form');
const fullNameInput = document.getElementById('profile-full-name');
const emailInput = document.getElementById('profile-email');
const roleInput = document.getElementById('profile-role');
const aboutInput = document.getElementById('profile-about');
const goalInput = document.getElementById('profile-goal');

const avatarEl = document.getElementById('profile-avatar');
const summaryNameEl = document.getElementById('profile-summary-name');
const summaryRoleEl = document.getElementById('profile-summary-role');

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

function validateForm() {
    if (profileForm.checkValidity()) {
        profileForm.classList.remove('was-validated');
        return true;
    }

    profileForm.classList.add('was-validated');
    return false;
}
/* Event Handlers */

function handleSave(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const formValues = readFormValues();
    const result = saveProfile(formValues);

    if (!result.success) {
        showProfileFeedback('Could not save profile. Please try again.');
        return;
    }

    updateSummaryCard(result.profile);
    updateHeaderGreeting();
    fillFormWithProfile(result.profile);

    showProfileFeedback('Profile saved successfully.');
}

function handleCancel() {
    const savedProfile = getProfile();
    fillFormWithProfile(savedProfile);
    updateSummaryCard(savedProfile);

    // Clear validation UI
    profileForm.classList.remove('was-validated');

    showProfileFeedback('Changes discarded.');
}

function handleNameInput() {
    const name = fullNameInput?.value || '';
    if (avatarEl) avatarEl.textContent = getInitials(name);
}

function showProfileFeedback(message) {
    const toastElement = document.getElementById('profile-toast');
    const messageElement = document.getElementById('profile-toast-message');
    if (!toastElement || !messageElement) return;

    messageElement.textContent = message;
    bootstrap.Toast.getOrCreateInstance(toastElement, { delay: 3000 }).show();
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