const express = require('express');
const router = express.Router();
const { getSteps, updateSteps } = require('../controllers/stepsController');

router.get('/:userId', getSteps);
router.post('/update', updateSteps);

module.exports = router;
