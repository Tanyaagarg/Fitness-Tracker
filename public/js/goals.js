// goals.js — Goals Page Logic

const GOAL_TYPE_LABELS = {
  weight_loss: '⬇ Weight Loss',
  weight_gain: '⬆ Weight Gain',
  run_distance: '🏃 Run Distance',
  strength: '💪 Strength',
  workout_streak: '🔥 Workout Streak',
  calorie_burn: '🔥 Calorie Burn',
  custom: '✨ Custom'
};

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  populateSidebarUser();

  // Set default deadline to 30 days from now
  const defaultDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  document.getElementById('goalDeadline').value = defaultDeadline.toISOString().split('T')[0];

  await loadGoals();
});

async function loadGoals() {
  const status = document.getElementById('goalStatusFilter').value;
  let params = status ? `?status=${status}` : '';

  try {
    const data = await api.getGoals(params);
    const goals = data.goals || [];

    // Stats
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const active = goals.filter(g => g.status === 'active').length;
    const failed = goals.filter(g => g.status === 'failed').length;

    document.getElementById('gTotalGoals').textContent = total;
    document.getElementById('gCompleted').textContent = completed;
    document.getElementById('gActive').textContent = active;
    document.getElementById('gFailed').textContent = failed;

    renderGoalCards(goals);
    renderGoalsTable(goals);
  } catch (err) {
    showToast('Failed to load goals: ' + err.message, 'error');
  }
}

// ── Render Goal Cards ──
function renderGoalCards(goals) {
  const grid = document.getElementById('goalsGrid');

  if (!goals.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:span 3">
        <div class="empty-icon">🎯</div>
        <h3>No goals yet</h3>
        <p>Set a fitness goal to track your progress!</p>
      </div>`;
    return;
  }

  grid.innerHTML = goals.map(g => {
    const pct = Math.min(g.progress || 0, 100);
    const barClass = pct >= 100 ? 'success' : pct >= 60 ? '' : 'warning';
    const daysLeft = getDaysUntil(g.deadline);
    const statusBadge = getGoalStatusBadge(g.status);

    return `<div class="goal-card">
      <div class="goal-card-header">
        <div>
          <div class="goal-card-title">${g.title}</div>
          <div class="goal-card-type">${GOAL_TYPE_LABELS[g.type] || g.type}</div>
        </div>
        ${statusBadge}
      </div>

      <div class="goal-progress-text">
        <span>${g.currentValue} ${g.unit} / ${g.targetValue} ${g.unit}</span>
        <span class="goal-progress-pct">${pct.toFixed(1)}%</span>
      </div>
      <div class="progress-container">
        <div class="progress-bar ${barClass}" style="width:${pct}%"></div>
      </div>

      ${g.description ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-top:10px">${g.description}</p>` : ''}

      <div class="goal-card-footer">
        <span>📅 ${daysLeft}</span>
        <div class="action-btns">
          <button class="btn btn-secondary btn-sm" onclick="openUpdateProgress('${g._id}', '${g.title}', ${g.currentValue}, '${g.unit}')">📈 Update</button>
          <button class="btn btn-secondary btn-sm" onclick="editGoal('${g._id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g._id}')">🗑</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Render Goals Table ──
function renderGoalsTable(goals) {
  const tbody = document.getElementById('goalsTableBody');

  if (!goals.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No goals found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = goals.map(g => {
    const pct = Math.min(g.progress || 0, 100);
    const barClass = pct >= 100 ? 'success' : pct >= 60 ? '' : 'warning';

    return `<tr>
      <td><strong>${g.title}</strong></td>
      <td>${GOAL_TYPE_LABELS[g.type] || g.type}</td>
      <td style="min-width:120px">
        <div class="progress-container" style="height:6px">
          <div class="progress-bar ${barClass}" style="width:${pct.toFixed(0)}%"></div>
        </div>
        <div style="font-size:0.72rem;margin-top:2px;color:var(--primary);font-weight:600">${pct.toFixed(1)}%</div>
      </td>
      <td>${g.currentValue} / ${g.targetValue} ${g.unit}</td>
      <td>${formatDate(g.deadline)}</td>
      <td>${getGoalStatusBadge(g.status)}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-secondary btn-sm" onclick="openUpdateProgress('${g._id}', '${g.title}', ${g.currentValue}, '${g.unit}')">📈</button>
          <button class="btn btn-secondary btn-sm" onclick="editGoal('${g._id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteGoal('${g._id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Form Submit ──
document.getElementById('goalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('goalSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const payload = {
    title: document.getElementById('goalTitle').value.trim(),
    type: document.getElementById('goalType').value,
    unit: document.getElementById('goalUnit').value.trim(),
    targetValue: parseFloat(document.getElementById('goalTarget').value),
    currentValue: parseFloat(document.getElementById('goalCurrent').value) || 0,
    deadline: document.getElementById('goalDeadline').value,
    description: document.getElementById('goalDescription').value.trim()
  };

  try {
    const editId = document.getElementById('editGoalId').value;
    if (editId) {
      await api.updateGoal(editId, payload);
      showToast('Goal updated!', 'success');
    } else {
      await api.addGoal(payload);
      showToast('Goal created! 🎯', 'success');
    }
    closeModal('goalModal');
    resetGoalForm();
    await loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = document.getElementById('editGoalId').value ? 'Update Goal' : 'Create Goal';
  }
});

function resetGoalForm() {
  document.getElementById('goalForm').reset();
  document.getElementById('editGoalId').value = '';
  document.getElementById('goalModalTitle').textContent = 'New Goal';
  document.getElementById('goalSubmitBtn').textContent = 'Create Goal';
  const defaultDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  document.getElementById('goalDeadline').value = defaultDeadline.toISOString().split('T')[0];
}

async function editGoal(id) {
  try {
    const data = await api.getGoals();
    const goal = (data.goals || []).find(g => g._id === id);
    if (!goal) throw new Error('Goal not found');

    document.getElementById('editGoalId').value = goal._id;
    document.getElementById('goalModalTitle').textContent = 'Edit Goal';
    document.getElementById('goalSubmitBtn').textContent = 'Update Goal';
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalType').value = goal.type;
    document.getElementById('goalUnit').value = goal.unit || '';
    document.getElementById('goalTarget').value = goal.targetValue;
    document.getElementById('goalCurrent').value = goal.currentValue;
    document.getElementById('goalDeadline').value = goal.deadline ? goal.deadline.split('T')[0] : '';
    document.getElementById('goalDescription').value = goal.description || '';

    openModal('goalModal');
  } catch (err) {
    showToast('Failed to load goal: ' + err.message, 'error');
  }
}

async function deleteGoal(id) {
  if (!confirmAction('Delete this goal?')) return;
  try {
    await api.deleteGoal(id);
    showToast('Goal deleted', 'info');
    await loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openUpdateProgress(id, title, current, unit) {
  document.getElementById('updateGoalId').value = id;
  document.getElementById('updateProgressLabel').textContent = `Current Value (${unit})`;
  document.getElementById('updateCurrentValue').value = current;
  openModal('updateProgressModal');
}

document.getElementById('updateProgressForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('updateGoalId').value;
  const val = parseFloat(document.getElementById('updateCurrentValue').value);

  try {
    await api.updateGoal(id, { currentValue: val });
    showToast('Progress updated! 📈', 'success');
    closeModal('updateProgressModal');
    await loadGoals();
  } catch (err) {
    showToast(err.message, 'error');
  }
});
