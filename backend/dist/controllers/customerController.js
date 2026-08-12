"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollowUpNote = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = exports.followUpNoteSchema = exports.customerSchema = void 0;
const zod_1 = require("zod");
const prisma_js_1 = require("../utils/prisma.js");
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Customer name must be at least 2 characters'),
    mobile: zod_1.z.string().min(8, 'Mobile number must be at least 8 digits'),
    email: zod_1.z.string().email('Invalid email address'),
    businessName: zod_1.z.string().min(2, 'Business name must be at least 2 characters'),
    gstNumber: zod_1.z.string().optional().nullable(),
    customerType: zod_1.z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
    address: zod_1.z.string().min(5, 'Address is required'),
    status: zod_1.z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
    followUpDate: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
exports.followUpNoteSchema = zod_1.z.object({
    note: zod_1.z.string().min(2, 'Note content cannot be empty'),
});
const getCustomers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const customerType = req.query.customerType || '';
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { mobile: { contains: search } },
            { email: { contains: search } },
            { businessName: { contains: search } },
        ];
    }
    if (status) {
        where.status = status;
    }
    if (customerType) {
        where.customerType = customerType;
    }
    const [customers, total] = await Promise.all([
        prisma_js_1.prisma.customer.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { followUpNotes: true, challans: true },
                },
            },
        }),
        prisma_js_1.prisma.customer.count({ where }),
    ]);
    res.json({
        data: customers,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};
exports.getCustomers = getCustomers;
const getCustomerById = async (req, res) => {
    const { id } = req.params;
    const customer = await prisma_js_1.prisma.customer.findUnique({
        where: { id },
        include: {
            followUpNotes: {
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: { id: true, name: true, role: true },
                    },
                },
            },
            challans: {
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    challanNumber: true,
                    totalAmount: true,
                    totalQuantity: true,
                    status: true,
                    createdAt: true,
                },
            },
        },
    });
    if (!customer) {
        res.status(404).json({ message: 'Customer not found' });
        return;
    }
    res.json({ customer });
};
exports.getCustomerById = getCustomerById;
const createCustomer = async (req, res) => {
    const data = req.body;
    const customer = await prisma_js_1.prisma.customer.create({
        data: {
            ...data,
            followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        },
    });
    res.status(201).json({
        message: 'Customer created successfully',
        customer,
    });
};
exports.createCustomer = createCustomer;
const updateCustomer = async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const existing = await prisma_js_1.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
        res.status(404).json({ message: 'Customer not found' });
        return;
    }
    const customer = await prisma_js_1.prisma.customer.update({
        where: { id },
        data: {
            ...data,
            followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        },
    });
    res.json({
        message: 'Customer updated successfully',
        customer,
    });
};
exports.updateCustomer = updateCustomer;
const addFollowUpNote = async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.user.id;
    const existing = await prisma_js_1.prisma.customer.findUnique({ where: { id } });
    if (!existing) {
        res.status(404).json({ message: 'Customer not found' });
        return;
    }
    const newNote = await prisma_js_1.prisma.followUpNote.create({
        data: {
            customerId: id,
            note,
            createdById: userId,
        },
        include: {
            createdBy: {
                select: { id: true, name: true, role: true },
            },
        },
    });
    res.status(201).json({
        message: 'Follow-up note added',
        note: newNote,
    });
};
exports.addFollowUpNote = addFollowUpNote;
