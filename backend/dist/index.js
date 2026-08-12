"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const customerRoutes_js_1 = __importDefault(require("./routes/customerRoutes.js"));
const productRoutes_js_1 = __importDefault(require("./routes/productRoutes.js"));
const challanRoutes_js_1 = __importDefault(require("./routes/challanRoutes.js"));
const dashboardRoutes_js_1 = __importDefault(require("./routes/dashboardRoutes.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Base Status Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Mini ERP + CRM Backend Operational',
        timestamp: new Date().toISOString(),
    });
});
// API Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/customers', customerRoutes_js_1.default);
app.use('/api/products', productRoutes_js_1.default);
app.use('/api/challans', challanRoutes_js_1.default);
app.use('/api/dashboard', dashboardRoutes_js_1.default);
// Global Error Handler
app.use(errorHandler_js_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Mini ERP Backend Server running on port ${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
});
