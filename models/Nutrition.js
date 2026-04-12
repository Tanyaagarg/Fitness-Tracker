const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 }, // in grams
  carbs: { type: Number, default: 0 },   // in grams
  fats: { type: Number, default: 0 },    // in grams
  mealTime: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'lunch' }
}, { _id: true });

const nutritionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  meals: [mealSchema],
  totalCalories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  dailyCalorieGoal: { type: Number, default: 2000 }
}, { timestamps: true });

// Auto-calculate totals before save
nutritionSchema.pre('save', function (next) {
  if (this.meals && this.meals.length > 0) {
    this.totalCalories = this.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    this.protein = this.meals.reduce((sum, m) => sum + (m.protein || 0), 0);
    this.carbs = this.meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    this.fats = this.meals.reduce((sum, m) => sum + (m.fats || 0), 0);
  }
  next();
});

// Indexes for fast lookup
nutritionSchema.index({ userId: 1, date: -1 });
nutritionSchema.index({ date: -1 });

const Nutrition = mongoose.model('Nutrition', nutritionSchema);
module.exports = Nutrition;
