// ── CoreTrack API Utility ──
const API_BASE = '/api';

const api = {
  // Get stored token
  getToken() {
    return localStorage.getItem('coretrack_token');
  },

  // Headers with auth
  headers() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  // Generic fetch wrapper
  async request(method, path, body = null) {
    try {
      const options = {
        method,
        headers: this.headers()
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE}${path}`, options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err) {
      throw err;
    }
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),

  // Auth
  async register(data) { return this.post('/auth/register', data); },
  async login(data) { return this.post('/auth/login', data); },
  async getProfile() { return this.get('/auth/profile'); },
  async updateProfile(data) { return this.put('/auth/profile', data); },

  // Workouts
  async addWorkout(data) { return this.post('/workouts', data); },
  async getWorkouts(params = '') { return this.get(`/workouts${params}`); },
  async updateWorkout(id, data) { return this.put(`/workouts/${id}`, data); },
  async deleteWorkout(id) { return this.delete(`/workouts/${id}`); },
  async getWorkoutAnalytics() { return this.get('/workouts/analytics'); },

  // Nutrition
  async addNutrition(data) { return this.post('/nutrition', data); },
  async getNutrition(params = '') { return this.get(`/nutrition${params}`); },
  async updateNutrition(id, data) { return this.put(`/nutrition/${id}`, data); },
  async deleteNutrition(id) { return this.delete(`/nutrition/${id}`); },
  async getNutritionAnalytics() { return this.get('/nutrition/analytics'); },

  // Goals
  async addGoal(data) { return this.post('/goals', data); },
  async getGoals(params = '') { return this.get(`/goals${params}`); },
  async updateGoal(id, data) { return this.put(`/goals/${id}`, data); },
  async deleteGoal(id) { return this.delete(`/goals/${id}`); },

  // Dashboard
  async getDashboard() { return this.get('/dashboard'); }
};

// ── Toast Notification System ──
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110%)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Auth Guards ──
function requireAuth() {
  const token = localStorage.getItem('coretrack_token');
  const user = localStorage.getItem('coretrack_user');
  if (!token || !user) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('coretrack_user') || '{}');
  } catch { return {}; }
}

function saveUser(user) {
  localStorage.setItem('coretrack_user', JSON.stringify(user));
  if (user.token) localStorage.setItem('coretrack_token', user.token);
}

function logout() {
  localStorage.removeItem('coretrack_token');
  localStorage.removeItem('coretrack_user');
  window.location.href = '/index.html';
}

// ── Format Helpers ──
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function formatDateTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getDaysUntil(deadline) {
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due today';
  return `${days} day${days !== 1 ? 's' : ''} left`;
}

function getWorkoutTypeBadge(type) {
  const badges = {
    'Strength': 'badge-blue',
    'Cardio': 'badge-green',
    'Yoga': 'badge-purple'
  };
  return `<span class="badge ${badges[type] || 'badge-gray'}">${type}</span>`;
}

function getGoalStatusBadge(status) {
  const badges = {
    'active': 'badge-blue',
    'completed': 'badge-green',
    'failed': 'badge-red'
  };
  return `<span class="badge ${badges[status] || 'badge-gray'}">${status}</span>`;
}

// ── Sidebar Active Link ──
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href && path.includes(href.replace('.html', '')) && href !== '/index.html') {
      link.classList.add('active');
    }
    if (path === '/' || path.endsWith('/dashboard.html')) {
      const dashLink = document.querySelector('[href="dashboard.html"]');
      if (dashLink) dashLink.classList.add('active');
    }
  });
}

// ── Populate sidebar user info ──
function populateSidebarUser() {
  const user = getStoredUser();
  const nameEl = document.getElementById('sidebarUserName');
  const streakEl = document.getElementById('sidebarStreak');
  const avatarEl = document.getElementById('sidebarAvatar');

  if (nameEl) nameEl.textContent = user.name || 'User';
  if (streakEl) streakEl.textContent = `🔥 ${user.streak || 0} day streak`;
  if (avatarEl) avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
}

// ── Mobile sidebar toggle ──
function initMobileSidebar() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay && overlay.classList.toggle('active');
    });
    overlay && overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// ── Modal helpers ──
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ── Confirm dialog ──
function confirmAction(message) {
  return confirm(message);
}

// Setup logout buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-logout]').forEach(btn => {
    btn.addEventListener('click', logout);
  });
  initMobileSidebar();
  setActiveNav();
  populateSidebarUser();
});
