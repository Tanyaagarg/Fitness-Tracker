const Workout = require('../models/Workout');
const User = require('../models/User');
const Nutrition = require('../models/Nutrition');
const Goal = require('../models/Goal');
const mongoose = require('mongoose');

// @desc    Get full dashboard data using Aggregation Pipelines
// @route   GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const user = await User.findById(userId).select('-password');

    // 1. Weekly calories burned (last 7 days) — $match $group $sort $project
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
          workoutCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalCalories: 1,
          workoutCount: 1
        }
      }
    ]);

    // 2. Weight trend over time (from user's weight update history / workouts)
    // We track weight from nutrition logs as a proxy for user weight entries
    // For demonstration, we return the current weight and a simulated trend
    const weightTrend = await Nutrition.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgCalories: { $avg: '$totalCalories' }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', avgCalories: { $round: ['$avgCalories', 0] } } }
    ]);

    // 3. Personal Bests — $group with $max
    const personalBests = await Workout.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          maxWeight: { $max: '$weight' },
          maxDistance: { $max: '$distance' },
          maxCaloriesInSession: { $max: '$caloriesBurned' },
          maxDuration: { $max: '$duration' },
          totalWorkouts: { $sum: 1 },
          totalCaloriesBurned: { $sum: '$caloriesBurned' }
        }
      },
      {
        $project: {
          _id: 0,
          maxWeight: 1, maxDistance: 1,
          maxCaloriesInSession: 1, maxDuration: 1,
          totalWorkouts: 1, totalCaloriesBurned: 1
        }
      }
    ]);

    // 4. Workout frequency per week (last 4 weeks)
    const weeklyFrequency = await Workout.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            week: { $week: '$date' },
            year: { $year: '$date' }
          },
          count: { $sum: 1 },
          calories: { $sum: '$caloriesBurned' }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
      {
        $project: {
          _id: 0,
          week: '$_id.week',
          count: 1,
          calories: 1
        }
      }
    ]);

    // 5. Workout type distribution
    const typeDistribution = await Workout.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          calories: { $sum: '$caloriesBurned' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 6. Active goals
    const activeGoals = await Goal.find({ userId: userId, status: 'active' })
      .sort({ deadline: 1 })
      .limit(5);

    // 7. Recent workouts
    const recentWorkouts = await Workout.find({ userId: userId })
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      user,
      weeklyCalories,
      weightTrend,
      personalBests: personalBests[0] || {},
      weeklyFrequency,
      typeDistribution,
      activeGoals,
      recentWorkouts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
