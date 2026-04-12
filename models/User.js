const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  age: { type: Number, required: true },
  height: { type: Number, required: true }, // in cm
  weight: { type: Number, required: true }, // in kg
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  activityLevel: {
    type: String,
    enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
    default: 'sedentary'
  },
  bmi: { type: Number },
  bmr: { type: Number },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date }
}, { timestamps: true });

// Calculate BMI: weight(kg) / (height(m))^2
userSchema.methods.calculateBMI = function () {
  const heightM = this.height / 100;
  return parseFloat((this.weight / (heightM * heightM)).toFixed(2));
};

// Calculate BMR using Mifflin-St Jeor Equation
userSchema.methods.calculateBMR = function () {
  let bmr;
  if (this.gender === 'male') {
    bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age + 5;
  } else {
    bmr = 10 * this.weight + 6.25 * this.height - 5 * this.age - 161;
  }
  return parseFloat(bmr.toFixed(2));
};

// Pre-save hook to hash password and calculate BMI/BMR
userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // Always recalculate BMI and BMR
  this.bmi = this.calculateBMI();
  this.bmr = this.calculateBMR();
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index on createdAt for sorting
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
