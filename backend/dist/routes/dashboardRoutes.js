"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboardController_js_1 = require("../controllers/dashboardController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.get('/metrics', auth_js_1.authenticateJWT, dashboardController_js_1.getDashboardMetrics);
exports.default = router;
