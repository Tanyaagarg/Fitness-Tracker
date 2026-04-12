const Goal = require('../models/Goal');

// @desc    Create goal (CREATE)
// @route   POST /api/goals
const addGoal = async (req, res) => {
  try {
    const { type, title, description, targetValue, currentValue, unit, deadline } = req.body;

    const goal = new Goal({
      userId: req.user._id,
      type, title, description,
      targetValue,
      currentValue: currentValue || 0,
      unit: unit || '',
      deadline: new Date(deadline)
    });

    await goal.save();
    res.status(201).json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all goals (READ)
// @route   GET /api/goals
const getGoals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update goal (UPDATE - $set)
// @route   PUT /api/goals/:id
const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const fields = ['title', 'description', 'targetValue', 'currentValue', 'unit', 'deadline', 'status', 'type'];
    fields.forEach(f => { if (req.body[f] !== undefined) goal[f] = req.body[f]; });

    await goal.save(); // triggers progress recalculation

    res.json({ success: true, goal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete goal (DELETE)
// @route   DELETE /api/goals/:id
const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    await Goal.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addGoal, getGoals, updateGoal, deleteGoal };
