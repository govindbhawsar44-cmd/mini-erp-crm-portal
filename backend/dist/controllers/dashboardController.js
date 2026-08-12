"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardMetrics = void 0;
const prisma_js_1 = require("../utils/prisma.js");
const getDashboardMetrics = async (req, res) => {
    const [totalCustomers, leadCustomers, totalProducts, allProducts, totalChallans, confirmedChallans, recentMovements, recentChallans,] = await Promise.all([
        prisma_js_1.prisma.customer.count(),
        prisma_js_1.prisma.customer.count({ where: { status: 'LEAD' } }),
        prisma_js_1.prisma.product.count(),
        prisma_js_1.prisma.product.findMany({ select: { currentStock: true, minStockAlert: true } }),
        prisma_js_1.prisma.salesChallan.count(),
        prisma_js_1.prisma.salesChallan.aggregate({
            where: { status: 'CONFIRMED' },
            _sum: { totalAmount: true },
            _count: true,
        }),
        prisma_js_1.prisma.stockMovementLog.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { name: true, sku: true } },
                createdBy: { select: { name: true, role: true } },
            },
        }),
        prisma_js_1.prisma.salesChallan.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true, businessName: true } },
            },
        }),
    ]);
    const lowStockCount = allProducts.filter((p) => p.currentStock <= p.minStockAlert).length;
    res.json({
        metrics: {
            totalCustomers,
            leadCustomers,
            totalProducts,
            lowStockCount,
            totalChallans,
            confirmedChallansCount: confirmedChallans._count,
            totalConfirmedRevenue: confirmedChallans._sum.totalAmount || 0,
        },
        recentMovements,
        recentChallans,
    });
};
exports.getDashboardMetrics = getDashboardMetrics;
