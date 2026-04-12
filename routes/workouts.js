const express = require('express');
const router = express.Router();
const {
  addWorkout, getWorkouts, getWorkoutById,
  updateWorkout, deleteWorkout, deleteAllWorkouts,
  getWorkoutAnalytics
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(addWorkout)
  .get(getWorkouts)
  .delete(deleteAllWorkouts);

router.get('/analytics', getWorkoutAnalytics);

router.route('/:id')
  .get(getWorkoutById)
  .put(updateWorkout)
  .delete(deleteWorkout);

module.exports = router;
