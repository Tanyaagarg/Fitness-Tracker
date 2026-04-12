// nutrition.js — Nutrition Page Logic

let nutritionTrendChart;
let mealRowCount = 0;

window.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;
  populateSidebarUser();

  document.getElementById('todayDate').textContent = formatDate(new Date());
  document.getElementById('nutritionDate').value = new Date().toISOString().split('T')[0];

  // Add initial meal row
  addMealRow();

  await loadNutrition();
  await loadNutritionAnalytics();
});

// ── Add Meal Row Builder ──
function addMealRow() {
  mealRowCount++;
  const container = document.getElementById('mealsContainer');
  const row = document.createElement('div');
  row.id = `mealRow${mealRowCount}`;
  row.style.cssText = 'background:var(--surface-2);border-radius:8px;padding:12px;margin-bottom:10px;border:1px solid var(--border)';
  row.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-weight:600;font-size:0.85rem;color:var(--text-secondary)">Meal ${mealRowCount}</span>
      <button type="button" onclick="removeMealRow('mealRow${mealRowCount}')"
        style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1rem">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:8px;margin-bottom:8px">
      <div>
        <label style="font-size:0.78rem">Meal Name</label>
        <input type="text" name="mealName" placeholder="e.g. Oatmeal with banana" required />
      </div>
      <div>
        <label style="font-size:0.78rem">Meal Time</label>
        <select name="mealTime">
          <option value="breakfast">Breakfast</option>
          <option value="lunch" selected>Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">
      <div>
        <label style="font-size:0.78rem">Calories</label>
        <input type="number" name="calories" placeholder="300" min="0" required />
      </div>
      <div>
        <label style="font-size:0.78rem">Protein (g)</label>
        <input type="number" name="protein" placeholder="20" min="0" step="0.1" />
      </div>
      <div>
        <label style="font-size:0.78rem">Carbs (g)</label>
        <input type="number" name="carbs" placeholder="40" min="0" step="0.1" />
      </div>
      <div>
        <label style="font-size:0.78rem">Fats (g)</label>
        <input type="number" name="fats" placeholder="10" min="0" step="0.1" />
      </div>
    </div>
  `;
  container.appendChild(row);
}

function removeMealRow(rowId) {
  const el = document.getElementById(rowId);
  if (el) el.remove();
}

// ── Load Nutrition Logs ──
async function loadNutrition() {
  try {
    const data = await api.getNutrition('?limit=30');
    renderNutritionTable(data.logs || []);

    // Update today's stats
    const today = new Date().toDateString();
    const todayLog = (data.logs || []).find(l => new Date(l.date).toDateString() === today);

    if (todayLog) {
      document.getElementById('todayCalories').textContent = Math.round(todayLog.totalCalories || 0);
      document.getElementById('todayProtein').textContent = Math.round(todayLog.protein || 0);
      document.getElementById('todayCarbs').textContent = Math.round(todayLog.carbs || 0);
      document.getElementById('todayFats').textContent = Math.round(todayLog.fats || 0);

      const goal = todayLog.dailyCalorieGoal || 2000;
      const pct = Math.min(((todayLog.totalCalories || 0) / goal) * 100, 100);
      document.getElementById('calorieGoalText').textContent = `${Math.round(todayLog.totalCalories)} / ${goal} kcal`;
      document.getElementById('calorieGoalBar').style.width = pct + '%';
      const bar = document.getElementById('calorieGoalBar');
      bar.classList.toggle('warning', pct > 80 && pct < 100);
      bar.classList.toggle('danger', pct >= 100);
    } else {
      ['todayCalories','todayProtein','todayCarbs','todayFats'].forEach(id => {
        document.getElementById(id).textContent = '0';
      });
    }

    const title = document.getElementById('nutritionTableTitle');
    if (title) title.textContent = `Nutrition Logs (${(data.logs || []).length})`;
  } catch (err) {
    showToast('Failed to load nutrition: ' + err.message, 'error');
  }
}

// ── Render Nutrition Table ──
function renderNutritionTable(logs) {
  const tbody = document.getElementById('nutritionTableBody');
  if (!logs.length) {
    tbody.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-icon">🥗</div>
        <h3>No nutrition logs yet</h3>
        <p>Start logging your meals to track macros!</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(log => {
    const goal = log.dailyCalorieGoal || 2000;
    const pct = Math.min(((log.totalCalories || 0) / goal) * 100, 100);
    const barColor = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';
    const mealCount = (log.meals || []).length;

    return `<tr>
      <td>${formatDate(log.date)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="viewMeals('${log._id}')">
          👁 ${mealCount} meal${mealCount !== 1 ? 's' : ''}
        </button>
      </td>
      <td><strong style="color:var(--primary)">${Math.round(log.totalCalories || 0)}</strong></td>
      <td style="color:var(--success)">${Math.round(log.protein || 0)}g</td>
      <td style="color:var(--warning)">${Math.round(log.carbs || 0)}g</td>
      <td style="color:var(--danger)">${Math.round(log.fats || 0)}g</td>
      <td style="min-width:120px">
        <div class="progress-container" style="height:6px">
          <div class="progress-bar ${barColor}" style="width:${pct.toFixed(0)}%"></div>
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">${Math.round(log.totalCalories)} / ${goal}</div>
      </td>
      <td>
        <div class="action-btns">
          <button class="btn btn-secondary btn-sm" onclick="editNutrition('${log._id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteNutritionLog('${log._id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ── View Meals ──
async function viewMeals(id) {
  try {
    const data = await api.request('GET', `/nutrition/${id}`);
    const log = data.log;
    const meals = log.meals || [];

    document.getElementById('viewMealsContent').innerHTML = `
      <div style="margin-bottom:12px;font-size:0.9rem;color:var(--text-secondary)">
        <strong>${formatDate(log.date)}</strong> &nbsp;|&nbsp;
        Goal: ${log.dailyCalorieGoal || 2000} kcal
      </div>
      ${meals.map(m => `
        <div class="meal-item">
          <div>
            <div class="meal-name">${m.name}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);text-transform:capitalize">${m.mealTime}</div>
          </div>
          <div style="text-align:right">
            <div class="meal-calories">${m.calories} kcal</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">
              P: ${m.protein || 0}g &nbsp; C: ${m.carbs || 0}g &nbsp; F: ${m.fats || 0}g
            </div>
          </div>
        </div>
      `).join('')}
      <div style="border-top:2px solid var(--border);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between">
        <strong>Total</strong>
        <strong style="color:var(--primary)">${Math.round(log.totalCalories)} kcal</strong>
      </div>
    `;
    openModal('viewMealsModal');
  } catch (err) {
    showToast('Failed to load meals: ' + err.message, 'error');
  }
}

// ── Load Analytics ──
async function loadNutritionAnalytics() {
  try {
    const data = await api.getNutritionAnalytics();
    renderNutritionChart(data.weeklyCalories || []);
  } catch (err) {
    console.error('Nutrition analytics error:', err);
  }
}

function renderNutritionChart(data) {
  const ctx = document.getElementById('nutritionTrendChart').getContext('2d');
  if (nutritionTrendChart) nutritionTrendChart.destroy();

  nutritionTrendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.length ? data.map(d => d.date) : ['No data'],
      datasets: [
        {
          label: 'Calories',
          data: data.map(d => d.avgCalories || 0),
          backgroundColor: 'rgba(37, 99, 235, 0.7)',
          borderRadius: 4,
          yAxisID: 'y'
        },
        {
          label: 'Protein (g)',
          data: data.map(d => d.totalProtein || 0),
          backgroundColor: 'rgba(22, 163, 74, 0.6)',
          borderRadius: 4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 16, font: { weight: '600' } } }
      },
      scales: {
        y: { beginAtZero: true, position: 'left', grid: { color: '#f1f5f9' } },
        y1: { beginAtZero: true, position: 'right', grid: { display: false } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── Form Submit ──
document.getElementById('nutritionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('nutritionSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  // Collect meal rows
  const mealRows = document.querySelectorAll('#mealsContainer > div');
  const meals = Array.from(mealRows).map(row => ({
    name: row.querySelector('[name="mealName"]')?.value || '',
    mealTime: row.querySelector('[name="mealTime"]')?.value || 'lunch',
    calories: parseFloat(row.querySelector('[name="calories"]')?.value) || 0,
    protein: parseFloat(row.querySelector('[name="protein"]')?.value) || 0,
    carbs: parseFloat(row.querySelector('[name="carbs"]')?.value) || 0,
    fats: parseFloat(row.querySelector('[name="fats"]')?.value) || 0
  })).filter(m => m.name && m.calories > 0);

  if (!meals.length) {
    showToast('Add at least one meal with a name and calories', 'warning');
    btn.disabled = false;
    btn.textContent = 'Save Log';
    return;
  }

  const payload = {
    date: document.getElementById('nutritionDate').value,
    meals,
    dailyCalorieGoal: parseInt(document.getElementById('dailyCalorieGoal').value) || 2000
  };

  try {
    const editId = document.getElementById('editNutritionId').value;
    if (editId) {
      await api.updateNutrition(editId, payload);
      showToast('Nutrition log updated!', 'success');
    } else {
      await api.addNutrition(payload);
      showToast('Meals logged! 🥗', 'success');
    }
    closeModal('nutritionModal');
    resetNutritionForm();
    await loadNutrition();
    await loadNutritionAnalytics();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Log';
  }
});

function resetNutritionForm() {
  document.getElementById('nutritionForm').reset();
  document.getElementById('editNutritionId').value = '';
  document.getElementById('nutritionModalTitle').textContent = 'Log Meals';
  document.getElementById('nutritionDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('dailyCalorieGoal').value = '2000';
  document.getElementById('mealsContainer').innerHTML = '';
  mealRowCount = 0;
  addMealRow();
}

async function editNutrition(id) {
  try {
    const data = await api.request('GET', `/nutrition/${id}`);
    const log = data.log;

    document.getElementById('editNutritionId').value = log._id;
    document.getElementById('nutritionModalTitle').textContent = 'Edit Nutrition Log';
    document.getElementById('nutritionDate').value = log.date ? log.date.split('T')[0] : '';
    document.getElementById('dailyCalorieGoal').value = log.dailyCalorieGoal || 2000;

    // Rebuild meal rows
    document.getElementById('mealsContainer').innerHTML = '';
    mealRowCount = 0;
    (log.meals || []).forEach(m => {
      addMealRow();
      const row = document.getElementById(`mealRow${mealRowCount}`);
      row.querySelector('[name="mealName"]').value = m.name || '';
      row.querySelector('[name="mealTime"]').value = m.mealTime || 'lunch';
      row.querySelector('[name="calories"]').value = m.calories || '';
      row.querySelector('[name="protein"]').value = m.protein || '';
      row.querySelector('[name="carbs"]').value = m.carbs || '';
      row.querySelector('[name="fats"]').value = m.fats || '';
    });

    openModal('nutritionModal');
  } catch (err) {
    showToast('Failed to load log: ' + err.message, 'error');
  }
}

async function deleteNutritionLog(id) {
  if (!confirmAction('Delete this nutrition log?')) return;
  try {
    await api.deleteNutrition(id);
    showToast('Log deleted', 'info');
    await loadNutrition();
    await loadNutritionAnalytics();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
