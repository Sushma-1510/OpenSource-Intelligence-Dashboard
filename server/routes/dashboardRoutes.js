const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Define general Dashboard and Analytics routes
router.get('/analytics', dashboardController.getAnalytics.bind(dashboardController));
router.get('/insights', dashboardController.getInsights.bind(dashboardController));

module.exports = router;
