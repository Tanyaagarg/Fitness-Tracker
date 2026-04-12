// auth.js — Login & Register Logic

function switchTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  }
}

// Redirect if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('coretrack_token');
  if (token) {
    window.location.href = '/dashboard.html';
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      try {
        const data = await api.login({
          email: document.getElementById('loginEmail').value.trim(),
          password: document.getElementById('loginPassword').value
        });
        saveUser(data);
        showToast('Welcome back, ' + data.name + '!', 'success');
        setTimeout(() => { window.location.href = '/dashboard.html'; }, 500);
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        btn.textContent = 'Sign In';
        btn.disabled = false;
      }
    });
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('registerBtn');
      btn.textContent = 'Creating account...';
      btn.disabled = true;

      try {
        const data = await api.register({
          name: document.getElementById('regName').value.trim(),
          email: document.getElementById('regEmail').value.trim(),
          password: document.getElementById('regPassword').value,
          age: parseInt(document.getElementById('regAge').value),
          gender: document.getElementById('regGender').value,
          height: parseFloat(document.getElementById('regHeight').value),
          weight: parseFloat(document.getElementById('regWeight').value),
          activityLevel: document.getElementById('regActivity').value
        });
        saveUser(data);
        showToast('Account created! Welcome, ' + data.name + '!', 'success');
        setTimeout(() => { window.location.href = '/dashboard.html'; }, 500);
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
        btn.textContent = 'Create Account';
        btn.disabled = false;
      }
    });
  }
});
