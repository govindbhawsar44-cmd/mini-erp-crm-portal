import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU code is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be a positive number'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative'),
  minStockAlert: z.number().int().min(0, 'Minimum stock alert must be 0 or positive'),
  location: z.string().min(2, 'Warehouse location is required'),
});

export const stockAdjustSchema = z.object({
  quantityChanged: z.number().int().positive('Quantity must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required'),
});

export const getProducts = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || '';
  const lowStock = req.query.lowStock === 'true';

  const skip = (page - 1) * limit;

  let products;
  let total;

  if (lowStock) {
    const allMatching = await prisma.product.findMany({
      where: {
        ...(search ? {
          OR: [
            { name: { contains: search } },
            { sku: { contains: search } },
          ],
        } : {}),
        ...(category ? { category } : {}),
      },
      orderBy: { name: 'asc' },
    });

    const filtered = allMatching.filter((p) => p.currentStock <= p.minStockAlert);
    total = filtered.length;
    products = filtered.slice(skip, skip + limit);
  } else {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ];
    }
    if (category) {
      where.category = category;
    }

    [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
  }

  res.json({
    data: products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockLogs: {
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json({ product });
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  const data = req.body;
  const userId = req.user!.id;

  const existingSku = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existingSku) {
    res.status(400).json({ message: `SKU '${data.sku}' already exists in catalog.` });
    return;
  }

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data,
    });

    if (data.currentStock > 0) {
      await tx.stockMovementLog.create({
        data: {
          productId: newProduct.id,
          quantityChanged: data.currentStock,
          movementType: 'IN',
          reason: 'Initial stock setup on product creation',
          createdById: userId,
        },
      });
    }

    return newProduct;
  });

  res.status(201).json({
    message: 'Product created successfully',
    product,
  });
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  if (data.sku && data.sku !== existing.sku) {
    const skuCheck = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (skuCheck) {
      res.status(400).json({ message: `SKU '${data.sku}' is already taken.` });
      return;
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
  });

  res.json({
    message: 'Product updated successfully',
    product,
  });
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantityChanged, movementType, reason } = req.body;
  const userId = req.user!.id;

  try {
    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) {
        const err: any = new Error('Product not found');
        err.statusCode = 404;
        throw err;
      }

      if (movementType === 'OUT' && product.currentStock < quantityChanged) {
        const err: any = new Error(
          `Insufficient stock! Available stock: ${product.currentStock} units, Requested reduction: ${quantityChanged} units`
        );
        err.statusCode = 400;
        throw err;
      }

      const newStock =
        movementType === 'IN'
          ? product.currentStock + quantityChanged
          : product.currentStock - quantityChanged;

      const p = await tx.product.update({
        where: { id },
        data: { currentStock: newStock },
      });

      await tx.stockMovementLog.create({
        data: {
          productId: id,
          quantityChanged,
          movementType,
          reason,
          createdById: userId,
        },
      });

      return p;
    });

    res.json({
      message: `Stock successfully adjusted (${movementType} ${quantityChanged})`,
      product: updatedProduct,
    });
  } catch (error: any) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(400).json({ message: error.message || 'Stock adjustment failed' });
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, parseInt(req.query.limit as string) || 15);
  const movementType = (req.query.movementType as string) || '';

  const skip = (page - 1) * limit;

  const where: any = {};
  if (movementType) {
    where.movementType = movementType;
  }

  const [logs, total] = await Promise.all([
    prisma.stockMovementLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true, currentStock: true },
        },
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    }),
    prisma.stockMovementLog.count({ where }),
  ]);

  res.json({
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
};
