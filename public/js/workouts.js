// workouts.js — Workout Page Logic

let weeklyCalChart;
let editingWorkoutId = null;

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  populateSidebarUser();

  // Set today's date as default
  document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];

  await loadWorkouts();
  await loadWorkoutAnalytics();
});

// ── Type Selector ──
function selectType(type) {
  document.getElementById('workoutType').value = type;

  ['Strength', 'Cardio', 'Yoga'].forEach(t => {
    const btn = document.getElementById(`typeBtn${t}`);
    const fields = document.getElementById(`${t.toLowerCase()}Fields`);
    if (btn) btn.classList.toggle('active', t === type);
    if (fields) fields.classList.toggle('active', t === type);
  });
}

// ── Load Workouts ──
async function loadWorkouts() {
  const type = document.getElementById('filterType').value;
  const start = document.getElementById('filterStart').value;
  const end = document.getElementById('filterEnd').value;

  let params = '?limit=100';
  if (type) params += `&type=${type}`;
  if (start) params += `&startDate=${start}`;
  if (end) params += `&endDate=${end}`;

  try {
    const data = await api.getWorkouts(params);
    renderWorkoutsTable(data.workouts || []);

    const title = document.getElementById('workoutsTableTitle');
    if (title) title.textContent = `All Workouts (${data.total || 0})`;
  } catch (err) {
    showToast('Failed to load workouts: ' + err.message, 'error');
  }
}

// ── Load Analytics ──
async function loadWorkoutAnalytics() {
  try {
    const data = await api.getWorkoutAnalytics();
    const pb = data.personalBests || {};

    document.getElementById('wMaxWeight').textContent = pb.maxWeight ? `${pb.maxWeight} kg` : '—';
    document.getElementById('wMaxDistance').textContent = pb.maxDistance ? `${pb.maxDistance} km` : '—';
    document.getElementById('wTotalCalories').textContent =
      pb.maxCalories !== undefined ? Math.round((data.weeklyCalories || []).reduce((s, d) => s + d.totalCalories, 0)).toLocaleString() : '—';

    // Count total workouts
    const total = (data.frequencyByType || []).reduce((s, t) => s + t.count, 0);
    document.getElementById('wTotalWorkouts').textContent = total;

    // Weekly calories chart
    renderWeeklyChart(data.weeklyCalories || []);
  } catch (err) {
    console.error('Analytics error:', err);
  }
}

function renderWeeklyChart(data) {
  const ctx = document.getElementById('weeklyCalChart').getContext('2d');
  if (weeklyCalChart) weeklyCalChart.destroy();

  weeklyCalChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.length ? data.map(d => d.date) : ['No data this week'],
      datasets: [{
        label: 'Calories Burned',
        data: data.length ? data.map(d => d.totalCalories) : [0],
        backgroundColor: 'rgba(37, 99, 235, 0.15)',
        borderColor: 'rgba(37, 99, 235, 0.9)',
        borderWidth: 2,
        borderRadius: 6
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

// ── Render Table ──
function renderWorkoutsTable(workouts) {
  const tbody = document.getElementById('workoutsTableBody');

  if (!workouts.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <h3>No workouts found</h3>
        <p>Log your first workout using the button above!</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = workouts.map(w => {
    const setsReps = w.type === 'Strength' ? `${w.sets || '—'} × ${w.reps || '—'}` : '—';
    const weightDist = w.type === 'Strength' ? `${w.weight || '—'} kg`
                     : w.type === 'Cardio' ? `${w.distance || '—'} km` : '—';
    const duration = (w.type === 'Cardio' || w.type === 'Yoga')
                     ? `${w.duration || '—'} min` : '—';
    const activity = w.type === 'Strength' ? (w.exercise || '—')
                   : w.type === 'Yoga' ? (w.routine || '—')
                   : 'Cardio Run';

    return `<tr>
      <td>${formatDate(w.date)}</td>
      <td>${getWorkoutTypeBadge(w.type)}</td>
      <td><strong>${activity}</strong></td>
      <td>${setsReps}</td>
      <td>${weightDist}</td>
      <td>${duration}</td>
      <td><strong style="color:var(--primary)">${Math.round(w.caloriesBurned || 0)}</strong> kcal</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-secondary btn-sm" onclick="editWorkout('${w._id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteWorkout('${w._id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── Add / Edit Workout ──
document.getElementById('workoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('workoutSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  const type = document.getElementById('workoutType').value;
  const payload = {
    date: document.getElementById('workoutDate').value,
    type,
    notes: document.getElementById('workoutNotes').value,
    caloriesBurned: parseFloat(document.getElementById('workoutCalories').value) || 0
  };

  if (type === 'Strength') {
    payload.exercise = document.getElementById('wExercise').value;
    payload.sets = parseInt(document.getElementById('wSets').value) || undefined;
    payload.reps = parseInt(document.getElementById('wReps').value) || undefined;
    payload.weight = parseFloat(document.getElementById('wWeight').value) || undefined;
  } else if (type === 'Cardio') {
    payload.distance = parseFloat(document.getElementById('wDistance').value) || undefined;
    payload.duration = parseInt(document.getElementById('wDuration').value) || undefined;
    payload.pace = parseFloat(document.getElementById('wPace').value) || undefined;
  } else if (type === 'Yoga') {
    payload.routine = document.getElementById('wRoutine').value;
    payload.duration = parseInt(document.getElementById('wYogaDuration').value) || undefined;
  }

  try {
    const editId = document.getElementById('editWorkoutId').value;
    if (editId) {
      await api.updateWorkout(editId, payload);
      showToast('Workout updated!', 'success');
    } else {
      await api.addWorkout(payload);
      showToast('Workout logged! 💪', 'success');
    }
    closeModal('workoutModal');
    resetWorkoutForm();
    await loadWorkouts();
    await loadWorkoutAnalytics();

    // Update streak in sidebar
    const profile = await api.getProfile();
    const stored = getStoredUser();
    saveUser({ ...stored, ...profile });
    populateSidebarUser();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Workout';
  }
});

function resetWorkoutForm() {
  document.getElementById('workoutForm').reset();
  document.getElementById('editWorkoutId').value = '';
  document.getElementById('workoutModalTitle').textContent = 'Log Workout';
  document.getElementById('workoutSubmitBtn').textContent = 'Save Workout';
  document.getElementById('workoutDate').value = new Date().toISOString().split('T')[0];
  selectType('Strength');
}

async function editWorkout(id) {
  try {
    const data = await api.request('GET', `/workouts/${id}`);
    const w = data.workout;

    document.getElementById('editWorkoutId').value = w._id;
    document.getElementById('workoutModalTitle').textContent = 'Edit Workout';
    document.getElementById('workoutSubmitBtn').textContent = 'Update Workout';
    document.getElementById('workoutDate').value = w.date ? w.date.split('T')[0] : '';
    document.getElementById('workoutCalories').value = w.caloriesBurned || '';
    document.getElementById('workoutNotes').value = w.notes || '';

    selectType(w.type);

    if (w.type === 'Strength') {
      document.getElementById('wExercise').value = w.exercise || '';
      document.getElementById('wSets').value = w.sets || '';
      document.getElementById('wReps').value = w.reps || '';
      document.getElementById('wWeight').value = w.weight || '';
    } else if (w.type === 'Cardio') {
      document.getElementById('wDistance').value = w.distance || '';
      document.getElementById('wDuration').value = w.duration || '';
      document.getElementById('wPace').value = w.pace || '';
    } else if (w.type === 'Yoga') {
      document.getElementById('wRoutine').value = w.routine || '';
      document.getElementById('wYogaDuration').value = w.duration || '';
    }

    openModal('workoutModal');
  } catch (err) {
    showToast('Failed to load workout: ' + err.message, 'error');
  }
}

async function deleteWorkout(id) {
  if (!confirmAction('Delete this workout?')) return;
  try {
    await api.deleteWorkout(id);
    showToast('Workout deleted', 'info');
    await loadWorkouts();
    await loadWorkoutAnalytics();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteAllWorkoutsConfirm() {
  if (!confirmAction('Delete ALL workouts? This cannot be undone.')) return;
  try {
    await api.delete('/workouts');
    showToast('All workouts deleted', 'info');
    await loadWorkouts();
    await loadWorkoutAnalytics();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function clearFilters() {
  document.getElementById('filterType').value = '';
  document.getElementById('filterStart').value = '';
  document.getElementById('filterEnd').value = '';
  loadWorkouts();
}

// Reset form when modal closes
document.getElementById('workoutModal').addEventListener('click', function(e) {
  if (e.target === this) resetWorkoutForm();
});
