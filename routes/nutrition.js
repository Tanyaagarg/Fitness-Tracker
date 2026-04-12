const express = require('express');
const router = express.Router();
const {
  addNutrition, getNutrition, getNutritionById,
  updateNutrition, deleteNutrition, getNutritionAnalytics
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .post(addNutrition)
  .get(getNutrition);

router.get('/analytics', getNutritionAnalytics);

router.route('/:id')
  .get(getNutritionById)
  .put(updateNutrition)
  .delete(deleteNutrition);

module.exports = router;
