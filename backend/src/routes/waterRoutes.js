const express = require('express');
const router = express.Router();
const { getWater, updateWater } = require('../controllers/waterController');

router.get('/:userId', getWater);
router.post('/update', updateWater);

module.exports = router;
