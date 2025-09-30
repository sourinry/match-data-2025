const express = require('express');
const router = express.Router();
const { getAllMatches } = require('../controller/matchController');

// GET /api/matches
router.get('/', getAllMatches);

module.exports = router;
