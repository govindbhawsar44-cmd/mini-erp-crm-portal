"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateChallanStatus = exports.createChallan = exports.getChallanById = exports.getChallans = exports.updateStatusSchema = exports.challanSchema = exports.challanItemSchema = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../utils/prisma.js");
exports.challanItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    quantity: zod_1.z.number().int().positive('Quantity must be greater than 0'),
});
exports.challanSchema = zod_1.z.object({
    customerId: zod_1.z.string().min(1, 'Customer ID is required'),
    status: zod_1.z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
    items: zod_1.z.array(exports.challanItemSchema).min(1, 'At least one product line item is required'),
});
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
});
// Helper to auto-generate unique Challan number resistant to collisions
async function generateChallanNumber() {
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', ''); // e.g. 202608
    const count = await prisma_js_1.prisma.salesChallan.count();
    const timestampSuffix = Date.now().toString().slice(-4);
    const seq = (count + 1).toString().padStart(3, '0');
    return `CH-${dateStr}-${seq}${timestampSuffix}`;
}
const getChallans = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const search = req.query.search || '';
    const status = req.query.status || '';
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.OR = [
            { challanNumber: { contains: search } },
            { customer: { name: { contains: search } } },
            { customer: { businessName: { contains: search } } },
        ];
    }
    if (status) {
        where.status = status;
    }
    const [challans, total] = await Promise.all([
        prisma_js_1.prisma.salesChallan.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: {
                    select: { id: true, name: true, businessName: true, mobile: true },
                },
                createdBy: {
                    select: { id: true, name: true, role: true },
                },
                _count: {
                    select: { items: true },
                },
            },
        }),
        prisma_js_1.prisma.salesChallan.count({ where }),
    ]);
    res.json({
        data: challans,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    });
};
exports.getChallans = getChallans;
const getChallanById = async (req, res) => {
    const { id } = req.params;
    const challan = await prisma_js_1.prisma.salesChallan.findUnique({
        where: { id },
        include: {
            customer: true,
            createdBy: {
                select: { id: true, name: true, role: true, email: true },
            },
            items: {
                include: {
                    product: {
                        select: { id: true, currentStock: true, minStockAlert: true, location: true },
                    },
                },
            },
        },
    });
    if (!challan) {
        res.status(404).json({ message: 'Sales Challan not found' });
        return;
    }
    res.json({ challan });
};
exports.getChallanById = getChallanById;
const createChallan = async (req, res) => {
    const { customerId, status, items } = req.body;
    const userId = req.user.id;
    // Verify Customer exists
    const customer = await prisma_js_1.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
        res.status(404).json({ message: 'Customer not found' });
        return;
    }
    const challanNumber = await generateChallanNumber();
    try {
        // Atomic Database Transaction for Creation + Stock Validation + Stock Deduction
        const createdChallan = await prisma_js_1.prisma.$transaction(async (tx) => {
            const productIds = items.map((i) => i.productId);
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
            });
            const productMap = new Map(products.map((p) => [p.id, p]));
            // Verify all products exist
            for (const item of items) {
                if (!productMap.has(item.productId)) {
                    throw new Error(`Product ID '${item.productId}' not found in inventory.`);
                }
            }
            // If status is CONFIRMED, validate stock sufficiency inside transaction
            if (status === 'CONFIRMED') {
                const insufficient = [];
                for (const item of items) {
                    const p = productMap.get(item.productId);
                    if (p.currentStock < item.quantity) {
                        insufficient.push(`'${p.name}' (SKU: ${p.sku}) - Available Stock: ${p.currentStock}, Requested: ${item.quantity}`);
                    }
                }
                if (insufficient.length > 0) {
                    const err = new Error('Stock insufficient to confirm Challan dispatch');
                    err.statusCode = 400;
                    err.errors = insufficient;
                    throw err;
                }
            }
            // Compute total quantity & amount with snapshots
            let totalQuantity = 0;
            let totalAmount = 0;
            const itemSnapshots = items.map((item) => {
                const p = productMap.get(item.productId);
                const subtotal = p.unitPrice * item.quantity;
                totalQuantity += item.quantity;
                totalAmount += subtotal;
                return {
                    productId: p.id,
                    productName: p.name,
                    sku: p.sku,
                    unitPrice: p.unitPrice,
                    quantity: item.quantity,
                    subtotal,
                };
            });
            const challan = await tx.salesChallan.create({
                data: {
                    challanNumber,
                    customerId,
                    totalQuantity,
                    totalAmount,
                    status,
                    createdById: userId,
                    items: {
                        create: itemSnapshots,
                    },
                },
                include: {
                    items: true,
                    customer: true,
                },
            });
            // Update product stock and log OUT movement inside transaction if CONFIRMED
            if (status === 'CONFIRMED') {
                for (const item of items) {
                    const p = productMap.get(item.productId);
                    await tx.product.update({
                        where: { id: p.id },
                        data: { currentStock: { decrement: item.quantity } },
                    });
                    await tx.stockMovementLog.create({
                        data: {
                            productId: p.id,
                            quantityChanged: item.quantity,
                            movementType: 'OUT',
                            reason: `Sales Challan #${challanNumber} Confirmed Dispatch`,
                            createdById: userId,
                        },
                    });
                }
            }
            return challan;
        });
        res.status(201).json({
            message: `Sales Challan ${challanNumber} created as ${status}`,
            challan: createdChallan,
        });
    }
    catch (error) {
        if (error.statusCode === 400) {
            res.status(400).json({
                message: error.message,
                errors: error.errors || [error.message],
            });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to create Sales Challan' });
    }
};
exports.createChallan = createChallan;
const updateChallanStatus = async (req, res) => {
    const { id } = req.params;
    const { status: targetStatus } = req.body;
    const userId = req.user.id;
    try {
        const result = await prisma_js_1.prisma.$transaction(async (tx) => {
            const existing = await tx.salesChallan.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!existing) {
                const err = new Error('Sales Challan not found');
                err.statusCode = 404;
                throw err;
            }
            if (existing.status === targetStatus) {
                return { message: `Challan is already in '${targetStatus}' status`, challan: existing };
            }
            // Prevent re-confirming already confirmed or cancelled challan
            if (existing.status === 'CONFIRMED' && targetStatus === 'CONFIRMED') {
                const err = new Error('Challan is already confirmed. Duplicate confirmation blocked.');
                err.statusCode = 400;
                throw err;
            }
            // Transition DRAFT -> CONFIRMED
            if (existing.status === 'DRAFT' && targetStatus === 'CONFIRMED') {
                const productIds = existing.items.map((i) => i.productId);
                const products = await tx.product.findMany({
                    where: { id: { in: productIds } },
                });
                const productMap = new Map(products.map((p) => [p.id, p]));
                const insufficient = [];
                for (const item of existing.items) {
                    const p = productMap.get(item.productId);
                    if (!p || p.currentStock < item.quantity) {
                        insufficient.push(`'${item.productName}' (SKU: ${item.sku}) - Available Stock: ${p ? p.currentStock : 0}, Requested: ${item.quantity}`);
                    }
                }
                if (insufficient.length > 0) {
                    const err = new Error('Cannot confirm Challan due to insufficient inventory stock');
                    err.statusCode = 400;
                    err.errors = insufficient;
                    throw err;
                }
                const updated = await tx.salesChallan.update({
                    where: { id },
                    data: { status: 'CONFIRMED' },
                    include: { items: true, customer: true },
                });
                for (const item of existing.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { currentStock: { decrement: item.quantity } },
                    });
                    await tx.stockMovementLog.create({
                        data: {
                            productId: item.productId,
                            quantityChanged: item.quantity,
                            movementType: 'OUT',
                            reason: `Sales Challan #${existing.challanNumber} Confirmed Dispatch`,
                            createdById: userId,
                        },
                    });
                }
                return {
                    message: `Challan #${existing.challanNumber} confirmed and stock deducted`,
                    challan: updated,
                };
            }
            // Transition CONFIRMED -> CANCELLED (Restores Stock)
            if (existing.status === 'CONFIRMED' && targetStatus === 'CANCELLED') {
                const updated = await tx.salesChallan.update({
                    where: { id },
                    data: { status: 'CANCELLED' },
                    include: { items: true, customer: true },
                });
                for (const item of existing.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { currentStock: { increment: item.quantity } },
                    });
                    await tx.stockMovementLog.create({
                        data: {
                            productId: item.productId,
                            quantityChanged: item.quantity,
                            movementType: 'IN',
                            reason: `Sales Challan #${existing.challanNumber} Cancelled - Stock Restored`,
                            createdById: userId,
                        },
                    });
                }
                return {
                    message: `Challan #${existing.challanNumber} cancelled and stock restored`,
                    challan: updated,
                };
            }
            // DRAFT -> CANCELLED
            const updated = await tx.salesChallan.update({
                where: { id },
                data: { status: targetStatus },
                include: { items: true, customer: true },
            });
            return {
                message: `Challan #${existing.challanNumber} status updated to ${targetStatus}`,
                challan: updated,
            };
        });
        res.json(result);
    }
    catch (error) {
        if (error.statusCode) {
            res.status(error.statusCode).json({
                message: error.message,
                ...(error.errors && { errors: error.errors }),
            });
            return;
        }
        res.status(400).json({ message: error.message || 'Failed to update challan status' });
    }
};
exports.updateChallanStatus = updateChallanStatus;
