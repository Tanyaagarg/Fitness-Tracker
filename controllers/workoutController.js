const Workout = require('../models/Workout');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Add a new workout (CREATE - insertOne)
// @route   POST /api/workouts
const addWorkout = async (req, res) => {
  try {
    const { date, type, notes, exercise, sets, reps, weight,
            distance, duration, pace, caloriesBurned, routine } = req.body;

    const workout = new Workout({
      userId: req.user._id,
      date: date || new Date(),
      type,
      notes,
      caloriesBurned: caloriesBurned || 0,
      // Strength fields
      exercise, sets, reps, weight,
      // Cardio fields
      distance, duration, pace,
      // Yoga fields
      routine
    });

    // Auto-calculate calories if not provided
    if (!caloriesBurned) {
      if (type === 'Cardio' && distance) {
        workout.caloriesBurned = Math.round(distance * 60); // ~60 cal/km
      } else if (type === 'Strength' && sets && reps && weight) {
        workout.caloriesBurned = Math.round(sets * reps * weight * 0.15);
      } else if (type === 'Yoga' && duration) {
        workout.caloriesBurned = Math.round(duration * 3); // ~3 cal/min
      }
    }

    await workout.save();

    // Update user streak using $inc (atomic update)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const user = await User.findById(req.user._id);

    if (user.lastActive) {
      const lastActiveDay = new Date(user.lastActive);
      lastActiveDay.setHours(0, 0, 0, 0);
      const diff = (today - lastActiveDay) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        // Consecutive day - increment streak
        await User.updateOne(
          { _id: req.user._id },
          { $inc: { streak: 1 }, $set: { lastActive: new Date() } }
        );
      } else if (diff > 1) {
        // Streak broken - reset
        await User.updateOne(
          { _id: req.user._id },
          { $set: { streak: 1, lastActive: new Date() } }
        );
      }
    } else {
      await User.updateOne(
        { _id: req.user._id },
        { $set: { streak: 1, lastActive: new Date() } }
      );
    }

    res.status(201).json({ success: true, workout });
  } catch (error) {
    console.error('Add workout error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all workouts for user (READ - find)
// @route   GET /api/workouts
const getWorkouts = async (req, res) => {
  try {
    const { type, limit = 50, page = 1, startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const workouts = await Workout.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Workout.countDocuments(filter);

    res.json({ success: true, workouts, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single workout
// @route   GET /api/workouts/:id
const getWorkoutById = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    res.json({ success: true, workout });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update workout (UPDATE - updateOne with $set)
// @route   PUT /api/workouts/:id
const updateWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    const updated = await Workout.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ success: true, workout: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete workout (DELETE - deleteOne)
// @route   DELETE /api/workouts/:id
const deleteWorkout = async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workout) return res.status(404).json({ message: 'Workout not found' });

    await Workout.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Workout deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete all workouts for user (DELETE - deleteMany)
// @route   DELETE /api/workouts
const deleteAllWorkouts = async (req, res) => {
  try {
    const result = await Workout.deleteMany({ userId: req.user._id });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workout analytics via Aggregation Pipeline
// @route   GET /api/workouts/analytics
const getWorkoutAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Weekly calories burned - $match, $group, $sort, $project
    const weeklyCalories = await Workout.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalCalories: { $sum: '$caloriesBurned' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          totalCalories: 1,
          workoutCount: '$count',
          _id: 0
        }
      }
    ]);

    // Workout frequency by type
    const frequencyByType = await Workout.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalCalories: { $sum: '$caloriesBurned' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Personal bests
    const personalBests = await Workout.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          maxWeight: { $max: '$weight' },
          maxDistance: { $max: '$distance' },
          maxCalories: { $max: '$caloriesBurned' },
          maxDuration: { $max: '$duration' }
        }
      },
      {
        $project: {
          _id: 0,
          maxWeight: 1,
          maxDistance: 1,
          maxCalories: 1,
          maxDuration: 1
        }
      }
    ]);

    // Workout frequency per week (last 4 weeks)
    const weeklyFrequency = await Workout.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $week: '$date' },
          count: { $sum: 1 },
          calories: { $sum: '$caloriesBurned' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      success: true,
      weeklyCalories,
      frequencyByType,
      personalBests: personalBests[0] || {},
      weeklyFrequency
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addWorkout, getWorkouts, getWorkoutById,
  updateWorkout, deleteWorkout, deleteAllWorkouts,
  getWorkoutAnalytics
};
