// dashboard.js — Dashboard Page Logic

let caloriesChart, typeChart, frequencyChart, nutritionChart;

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  // Show date
  document.getElementById('headerDate').textContent =
    new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  populateSidebarUser();
  await loadDashboard();
});

async function loadDashboard() {
  try {
    const data = await api.getDashboard();

    // Update user-level stats
    const user = data.user;
    if (user) {
      document.getElementById('statStreak').textContent = user.streak || 0;
      document.getElementById('statBMI').textContent = user.bmi ? user.bmi.toFixed(1) : '—';
      document.getElementById('statBMR').textContent = user.bmr ? Math.round(user.bmr) : '—';

      // Save updated user
      const stored = getStoredUser();
      saveUser({ ...stored, ...user });
      populateSidebarUser();
    }

    // Personal bests
    const pb = data.personalBests || {};
    document.getElementById('statPersonalBest').textContent = pb.maxWeight ? `${pb.maxWeight} kg` : '—';
    document.getElementById('statTotalWorkouts').textContent = pb.totalWorkouts || 0;

    // Render personal bests card
    renderPersonalBests(pb);

    // Weekly calories from workouts
    const weeklyCalories = data.weeklyCalories || [];
    const totalCals = weeklyCalories.reduce((s, d) => s + (d.totalCalories || 0), 0);
    document.getElementById('statTotalCalories').textContent = Math.round(totalCals).toLocaleString();

    // Charts
    renderCaloriesChart(weeklyCalories);
    renderTypeChart(data.typeDistribution || []);
    renderFrequencyChart(data.weeklyFrequency || []);
    renderNutritionChart(data.weightTrend || []);

    // Active goals
    renderActiveGoals(data.activeGoals || []);

    // Recent workouts table
    renderRecentWorkouts(data.recentWorkouts || []);

  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('Failed to load dashboard: ' + err.message, 'error');
  }
}

// ── Charts ──

function renderCaloriesChart(data) {
  const ctx = document.getElementById('caloriesChart').getContext('2d');
  if (caloriesChart) caloriesChart.destroy();

  const labels = data.map(d => d.date);
  const values = data.map(d => d.totalCalories);

  caloriesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [{
        label: 'Calories Burned',
        data: values.length ? values : [0],
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor: 'rgba(37, 99, 235, 0.9)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderTypeChart(data) {
  const ctx = document.getElementById('typeChart').getContext('2d');
  if (typeChart) typeChart.destroy();

  const colors = {
    'Strength': ['rgba(37,99,235,0.8)', 'rgba(37,99,235,0.1)'],
    'Cardio': ['rgba(22,163,74,0.8)', 'rgba(22,163,74,0.1)'],
    'Yoga': ['rgba(124,58,237,0.8)', 'rgba(124,58,237,0.1)']
  };

  typeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.length ? data.map(d => d._id) : ['No data'],
      datasets: [{
        data: data.length ? data.map(d => d.count) : [1],
        backgroundColor: data.length
          ? data.map(d => (colors[d._id] || ['#94a3b8', '#f1f5f9'])[0])
          : ['#e2e8f0'],
        borderWidth: 3,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { size: 12, weight: '600' } } }
      },
      cutout: '65%'
    }
  });
}

function renderFrequencyChart(data) {
  const ctx = document.getElementById('frequencyChart').getContext('2d');
  if (frequencyChart) frequencyChart.destroy();

  frequencyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.length ? data.map((_, i) => `Week ${i + 1}`) : ['W1', 'W2', 'W3', 'W4'],
      datasets: [{
        label: 'Workouts',
        data: data.length ? data.map(d => d.count) : [0, 0, 0, 0],
        borderColor: 'rgba(124, 58, 237, 0.9)',
        backgroundColor: 'rgba(124, 58, 237, 0.08)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(124, 58, 237, 0.9)',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderNutritionChart(data) {
  const ctx = document.getElementById('nutritionChart').getContext('2d');
  if (nutritionChart) nutritionChart.destroy();

  nutritionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.length ? data.map(d => d.date) : ['No data'],
      datasets: [{
        label: 'Avg Calories Intake',
        data: data.length ? data.map(d => d.avgCalories) : [0],
        borderColor: 'rgba(6, 182, 212, 0.9)',
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgba(6, 182, 212, 0.9)',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

function renderPersonalBests(pb) {
  const el = document.getElementById('personalBests');
  if (!pb || Object.keys(pb).length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>Log workouts to see your personal bests!</p></div>`;
    return;
  }
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="biometric-item">
        <div class="value">${pb.maxWeight ? pb.maxWeight + ' kg' : '—'}</div>
        <div class="label">Max Weight (Strength)</div>
      </div>
      <div class="biometric-item">
        <div class="value">${pb.maxDistance ? pb.maxDistance + ' km' : '—'}</div>
        <div class="label">Longest Run (Cardio)</div>
      </div>
      <div class="biometric-item">
        <div class="value">${pb.maxCaloriesInSession ? Math.round(pb.maxCaloriesInSession) : '—'}</div>
        <div class="label">Most Calories (session)</div>
      </div>
      <div class="biometric-item">
        <div class="value">${pb.maxDuration ? pb.maxDuration + ' min' : '—'}</div>
        <div class="label">Longest Session</div>
      </div>
      <div class="biometric-item" style="grid-column:span 2">
        <div class="value" style="color:var(--success)">${Math.round(pb.totalCaloriesBurned || 0).toLocaleString()}</div>
        <div class="label">Total Calories Burned (All Time)</div>
      </div>
    </div>
  `;
}

function renderActiveGoals(goals) {
  const el = document.getElementById('activeGoalsSection');
  if (!goals.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div><p>No active goals. <a href="goals.html" style="color:var(--primary)">Set a goal</a></p></div>`;
    return;
  }
  el.innerHTML = goals.map(g => `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-weight:600;font-size:0.9rem">${g.title}</span>
        <span style="font-size:0.82rem;color:var(--text-muted)">${getDaysUntil(g.deadline)}</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar ${g.progress >= 100 ? 'success' : g.progress >= 60 ? '' : 'warning'}"
             style="width:${Math.min(g.progress || 0, 100)}%"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.78rem;color:var(--text-muted)">
        <span>${g.currentValue} / ${g.targetValue} ${g.unit}</span>
        <span style="font-weight:700;color:var(--primary)">${(g.progress || 0).toFixed(1)}%</span>
      </div>
    </div>
  `).join('');
}

function renderRecentWorkouts(workouts) {
  const tbody = document.getElementById('recentWorkoutsTable');
  if (!workouts.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">🏋️</div><p>No workouts yet. <a href="workouts.html" style="color:var(--primary)">Log your first workout</a></p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = workouts.map(w => {
    let details = '';
    if (w.type === 'Strength') details = `${w.exercise || '-'} • ${w.sets || 0}×${w.reps || 0} @ ${w.weight || 0}kg`;
    else if (w.type === 'Cardio') details = `${w.distance || 0}km in ${w.duration || 0}min`;
    else details = `${w.routine || '-'} • ${w.duration || 0}min`;

    return `<tr>
      <td>${formatDate(w.date)}</td>
      <td>${getWorkoutTypeBadge(w.type)}</td>
      <td>${w.exercise || w.routine || 'Cardio Session'}</td>
      <td><strong>${Math.round(w.caloriesBurned || 0)}</strong> kcal</td>
      <td style="color:var(--text-secondary);font-size:0.82rem">${details}</td>
    </tr>`;
  }).join('');
}
