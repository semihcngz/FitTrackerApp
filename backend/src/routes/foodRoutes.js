const express = require('express');
const router = express.Router();
const { analyzeFoodPhoto } = require('../controllers/foodController');

router.post('/analyze', analyzeFoodPhoto);

module.exports = router;
