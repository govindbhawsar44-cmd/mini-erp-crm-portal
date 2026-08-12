import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';

export const getDashboardMetrics = async (req: Request, res: Response) => {
  const [
    totalCustomers,
    leadCustomers,
    totalProducts,
    allProducts,
    totalChallans,
    confirmedChallans,
    recentMovements,
    recentChallans,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.customer.count({ where: { status: 'LEAD' } }),
    prisma.product.count(),
    prisma.product.findMany({ select: { currentStock: true, minStockAlert: true } }),
    prisma.salesChallan.count(),
    prisma.salesChallan.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.stockMovementLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        createdBy: { select: { name: true, role: true } },
      },
    }),
    prisma.salesChallan.findMany({
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
