const mongoose = require('mongoose');

// Flexible schema for different workout types in SAME collection
const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['Strength', 'Cardio', 'Yoga'], required: true },
  notes: { type: String },
  caloriesBurned: { type: Number, default: 0 },

  // ── Strength-specific fields
  exercise: { type: String },
  sets: { type: Number },
  reps: { type: Number },
  weight: { type: Number }, // in kg

  // ── Cardio-specific fields
  distance: { type: Number }, // in km
  duration: { type: Number }, // in minutes
  pace: { type: Number },     // min/km

  // ── Yoga-specific fields
  routine: { type: String }
  // duration already defined above (shared)
}, { timestamps: true });

// Compound index on userId and date for aggregation performance
workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, type: 1 });
workoutSchema.index({ date: -1 });

const Workout = mongoose.model('Workout', workoutSchema);
module.exports = Workout;
