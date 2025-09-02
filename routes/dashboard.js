const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboard');
const { checkJWT } = require('../middlewares/private');
const isAdmin = require('../middlewares/isAdmin');

router.get('/', checkJWT, isAdmin, dashboardService.renderDashboard);

module.exports = router;
