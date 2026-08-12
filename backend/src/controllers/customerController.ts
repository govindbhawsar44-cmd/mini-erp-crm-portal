import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const customerSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().min(8, 'Mobile number must be at least 8 digits'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().min(5, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const followUpNoteSchema = z.object({
  note: z.string().min(2, 'Note content cannot be empty'),
});

export const getCustomers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || '';
  const customerType = (req.query.customerType as string) || '';

  const skip = (page - 1) * limit;

  const where: any = {};

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
    prisma.customer.findMany({
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
    prisma.customer.count({ where }),
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

export const getCustomerById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const customer = await prisma.customer.findUnique({
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

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const data = req.body;

  const customer = await prisma.customer.create({
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

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  const customer = await prisma.customer.update({
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

export const addFollowUpNote = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const userId = req.user!.id;

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Customer not found' });
    return;
  }

  const newNote = await prisma.followUpNote.create({
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
