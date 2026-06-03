const express = require('express');
const router = express.Router();
const {
  getExercises,
  getWeeklyExerciseStats,
  addExercise,
  deleteExercise,
} = require('../controllers/exerciseController');

router.get('/weekly/:userId', getWeeklyExerciseStats);
router.get('/:userId', getExercises);
router.post('/add', addExercise);
router.delete('/:id', deleteExercise);

module.exports = router;
