const Nutrition = require('../models/Nutrition');
const mongoose = require('mongoose');

// @desc    Add nutrition log (CREATE)
// @route   POST /api/nutrition
const addNutrition = async (req, res) => {
  try {
    const { date, meals, dailyCalorieGoal } = req.body;

    const nutrition = new Nutrition({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      meals: meals || [],
      dailyCalorieGoal: dailyCalorieGoal || 2000
    });

    await nutrition.save();
    res.status(201).json({ success: true, nutrition });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get nutrition logs (READ - find)
// @route   GET /api/nutrition
const getNutrition = async (req, res) => {
  try {
    const { limit = 30, startDate, endDate } = req.query;
    const filter = { userId: req.user._id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const logs = await Nutrition.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single nutrition log
// @route   GET /api/nutrition/:id
const getNutritionById = async (req, res) => {
  try {
    const log = await Nutrition.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: 'Nutrition log not found' });
    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update nutrition log (UPDATE - $set)
// @route   PUT /api/nutrition/:id
const updateNutrition = async (req, res) => {
  try {
    const log = await Nutrition.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: 'Nutrition log not found' });

    if (req.body.meals) log.meals = req.body.meals;
    if (req.body.dailyCalorieGoal) log.dailyCalorieGoal = req.body.dailyCalorieGoal;
    if (req.body.date) log.date = new Date(req.body.date);

    await log.save(); // triggers pre-save recalculation

    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete nutrition log (DELETE - deleteOne)
// @route   DELETE /api/nutrition/:id
const deleteNutrition = async (req, res) => {
  try {
    const log = await Nutrition.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: 'Nutrition log not found' });

    await Nutrition.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Nutrition log deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get nutrition analytics via Aggregation Pipeline
// @route   GET /api/nutrition/analytics
const getNutritionAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // Weekly calorie trend
    const weeklyCalories = await Nutrition.aggregate([
      {
        $match: {
          userId: userId,
          date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          avgCalories: { $avg: '$totalCalories' },
          totalProtein: { $sum: '$protein' },
          totalCarbs: { $sum: '$carbs' },
          totalFats: { $sum: '$fats' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          avgCalories: { $round: ['$avgCalories', 0] },
          totalProtein: 1,
          totalCarbs: 1,
          totalFats: 1,
          _id: 0
        }
      }
    ]);

    // Average macros
    const avgMacros = await Nutrition.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$totalCalories' },
          avgProtein: { $avg: '$protein' },
          avgCarbs: { $avg: '$carbs' },
          avgFats: { $avg: '$fats' }
        }
      }
    ]);

    res.json({
      success: true,
      weeklyCalories,
      avgMacros: avgMacros[0] || {}
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addNutrition, getNutrition, getNutritionById,
  updateNutrition, deleteNutrition, getNutritionAnalytics
};
