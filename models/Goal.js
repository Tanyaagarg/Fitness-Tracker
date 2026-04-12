const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'run_distance', 'strength', 'workout_streak', 'calorie_burn', 'custom'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, default: '' }, // kg, km, workouts, etc.
  deadline: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active'
  },
  progress: { type: Number, default: 0 }, // percentage 0-100
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Calculate progress before save
goalSchema.pre('save', function (next) {
  if (this.targetValue > 0) {
    this.progress = Math.min(
      parseFloat(((this.currentValue / this.targetValue) * 100).toFixed(2)),
      100
    );
    if (this.progress >= 100) {
      this.status = 'completed';
    } else if (this.deadline && new Date() > this.deadline && this.status !== 'completed') {
      this.status = 'failed';
    }
  }
  next();
});

goalSchema.index({ userId: 1 });
goalSchema.index({ userId: 1, status: 1 });

const Goal = mongoose.model('Goal', goalSchema);
module.exports = Goal;
