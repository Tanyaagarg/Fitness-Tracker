const User = require('../models/User');
const Workout = require('../models/Workout');
const Nutrition = require('../models/Nutrition');
const Goal = require('../models/Goal');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'coretrack_secret_key_2024';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, age, height, weight, gender, activityLevel } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user (BMI/BMR auto-calculated in pre-save hook)
    const user = new User({ name, email, password, age, height, weight, gender, activityLevel });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      activityLevel: user.activityLevel,
      bmi: user.bmi,
      bmr: user.bmr,
      streak: user.streak,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      activityLevel: user.activityLevel,
      bmi: user.bmi,
      bmr: user.bmr,
      streak: user.streak,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { name, age, height, weight, gender, activityLevel, password } = req.body;

    if (name) user.name = name;
    if (age) user.age = age;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (gender) user.gender = gender;
    if (activityLevel) user.activityLevel = activityLevel;
    if (password) user.password = password; // will be hashed in pre-save

    // BMI/BMR recalculated in pre-save hook
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      activityLevel: user.activityLevel,
      bmi: user.bmi,
      bmr: user.bmr,
      streak: user.streak,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete account + all user data
// @route   DELETE /api/auth/profile
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Cascade delete all user data
    await Workout.deleteMany({ userId });
    await Nutrition.deleteMany({ userId });
    await Goal.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    res.json({ success: true, message: 'Account and all associated data deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, deleteAccount };
