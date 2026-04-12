// profile.js — Profile Page Logic

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  populateSidebarUser();
  await loadProfile();
});

async function loadProfile() {
  try {
    const user = await api.getProfile();
    renderProfile(user);
    saveUser({ ...getStoredUser(), ...user });
  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

function renderProfile(user) {
  const initial = (user.name || 'U')[0].toUpperCase();
  document.getElementById('profileAvatar').textContent = initial;
  document.getElementById('sidebarAvatar').textContent = initial;

  document.getElementById('profileName').textContent = user.name || '—';
  document.getElementById('profileEmail').textContent = user.email || '—';
  document.getElementById('profileGender').textContent = user.gender ? '⚥ ' + user.gender : '—';
  document.getElementById('profileAge').textContent = user.age ? `${user.age} yrs` : '—';
  document.getElementById('profileActivity').textContent = (user.activityLevel || '').replace(/_/g, ' ');

  document.getElementById('profileHeight').textContent = user.height ? `${user.height} cm` : '—';
  document.getElementById('profileWeight').textContent = user.weight ? `${user.weight} kg` : '—';
  document.getElementById('profileBMI').textContent = user.bmi ? user.bmi.toFixed(1) : '—';
  document.getElementById('profileBMR').textContent = user.bmr ? Math.round(user.bmr) : '—';
  document.getElementById('profileStreak').textContent = user.streak || 0;

  // BMI Status
  const bmi = user.bmi;
  const statusEl = document.getElementById('bmiStatus');
  if (bmi) {
    let status, color;
    if (bmi < 18.5) { status = '⚠️ Underweight'; color = '#fef3c7'; }
    else if (bmi < 25) { status = '✅ Normal Weight'; color = '#dcfce7'; }
    else if (bmi < 30) { status = '⚠️ Overweight'; color = '#ffedd5'; }
    else { status = '❗ Obese'; color = '#fee2e2'; }
    statusEl.style.background = color;
    statusEl.textContent = `BMI Status: ${status} (${bmi.toFixed(1)})`;
  }

  // Sidebar
  document.getElementById('sidebarUserName').textContent = user.name || 'User';
  document.getElementById('sidebarStreak').textContent = `🔥 ${user.streak || 0} day streak`;

  // Populate edit form
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editAge').value = user.age || '';
  document.getElementById('editGender').value = user.gender || 'male';
  document.getElementById('editHeight').value = user.height || '';
  document.getElementById('editWeight').value = user.weight || '';
  document.getElementById('editActivity').value = user.activityLevel || 'sedentary';
}

// ── Save Profile ──
document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('profileSaveBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const payload = {
    name: document.getElementById('editName').value.trim(),
    age: parseInt(document.getElementById('editAge').value),
    gender: document.getElementById('editGender').value,
    height: parseFloat(document.getElementById('editHeight').value),
    weight: parseFloat(document.getElementById('editWeight').value),
    activityLevel: document.getElementById('editActivity').value
  };

  try {
    const updated = await api.updateProfile(payload);
    saveUser({ ...getStoredUser(), ...updated });
    renderProfile(updated);
    populateSidebarUser();
    showToast('Profile updated! BMI & BMR recalculated ✅', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
});

// ── Change Password ──
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;

  if (newPass !== confirmPass) {
    showToast('Passwords do not match', 'error');
    return;
  }

  try {
    await api.updateProfile({ password: newPass });
    showToast('Password updated successfully!', 'success');
    closeModal('passwordModal');
    document.getElementById('passwordForm').reset();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// ── Delete Account ──
async function deleteAccount() {
  const user = getStoredUser();
  const typedName = document.getElementById('deleteConfirmName').value.trim();

  if (!typedName) {
    showToast('Please type your name to confirm', 'warning');
    return;
  }

  if (typedName.toLowerCase() !== (user.name || '').toLowerCase()) {
    showToast('Name does not match. Please type your exact name.', 'error');
    return;
  }

  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    await api.delete('/auth/profile');
    showToast('Account deleted. Goodbye! 👋', 'info');
    // Clear local storage and redirect to login
    setTimeout(() => {
      localStorage.removeItem('coretrack_token');
      localStorage.removeItem('coretrack_user');
      window.location.href = '/index.html';
    }, 1500);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Yes, Delete Everything';
  }
}
