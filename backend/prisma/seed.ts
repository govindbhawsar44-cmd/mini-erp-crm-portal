import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.challanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovementLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // Create Hashed Password
  const passwordHash = await bcrypt.hash('admin123', 10);
  const salesPasswordHash = await bcrypt.hash('sales123', 10);
  const warehousePasswordHash = await bcrypt.hash('warehouse123', 10);
  const accountsPasswordHash = await bcrypt.hash('accounts123', 10);

  // 1. Create Users for all 4 roles
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@erp.com',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sales Manager',
      email: 'sales@erp.com',
      passwordHash: salesPasswordHash,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Warehouse Controller',
      email: 'warehouse@erp.com',
      passwordHash: warehousePasswordHash,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Accounts Executive',
      email: 'accounts@erp.com',
      passwordHash: accountsPasswordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('Created Users: Admin, Sales, Warehouse, Accounts');

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Sharma',
      mobile: '+91 9876543210',
      email: 'rajesh@apexdistributors.com',
      businessName: 'Apex Distributors Pvt Ltd',
      gstNumber: '24AAACA1234A1Z5',
      customerType: 'DISTRIBUTOR',
      address: '102 Industrial Estate, Sector 4, Vadodara, Gujarat',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days later
      notes: 'Key distributor for West region. Negotiating bulk pricing.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Patel',
      mobile: '+91 9812345678',
      email: 'priya@brighttech.in',
      businessName: 'Bright Traders',
      gstNumber: '24BBBCB5678B1Z2',
      customerType: 'WHOLESALE',
      address: '45 Commercial Market, Ahmedabad, Gujarat',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 86400000 * 1), // 1 day later
      notes: 'Interested in bulk orders of industrial sensors.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Amit Kumar',
      mobile: '+91 9765432109',
      email: 'amit@retailmart.com',
      businessName: 'Smart Retail Mart',
      customerType: 'RETAIL',
      address: '12 Station Road, Surat, Gujarat',
      status: 'ACTIVE',
      notes: 'Prompt payment history. Requires monthly invoice copies.',
    },
  });

  // Follow-up notes
  await prisma.followUpNote.create({
    data: {
      customerId: customer1.id,
      note: 'Discussed Q3 sales targets and credit limit terms.',
      createdById: salesUser.id,
    },
  });

  // 3. Create Products
  const product1 = await prisma.product.create({
    data: {
      name: 'Industrial Pressure Valve 50mm',
      sku: 'PRD-VALVE-001',
      category: 'Valves & Fittings',
      unitPrice: 1250.0,
      currentStock: 150,
      minStockAlert: 20,
      location: 'Warehouse A - Rack 04',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: 'Heavy Duty Stepper Motor 24V',
      sku: 'PRD-MTR-024',
      category: 'Motors & Actuators',
      unitPrice: 3450.0,
      currentStock: 45,
      minStockAlert: 15,
      location: 'Warehouse B - Bin 12',
    },
  });

  const product3 = await prisma.product.create({
    data: {
      name: 'Digital Temperature Controller Panel',
      sku: 'PRD-CTRL-100',
      category: 'Electronics',
      unitPrice: 890.0,
      currentStock: 8, // Low stock alert
      minStockAlert: 10,
      location: 'Warehouse A - Rack 01',
    },
  });

  const product4 = await prisma.product.create({
    data: {
      name: 'Stainless Steel Flange 100mm',
      sku: 'PRD-FLG-100',
      category: 'Valves & Fittings',
      unitPrice: 620.0,
      currentStock: 200,
      minStockAlert: 50,
      location: 'Warehouse C - Zone 3',
    },
  });

  // Stock Movement Logs
  await prisma.stockMovementLog.createMany({
    data: [
      {
        productId: product1.id,
        quantityChanged: 150,
        movementType: 'IN',
        reason: 'Initial Inventory Inward',
        createdById: warehouseUser.id,
      },
      {
        productId: product2.id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Vendor Batch Receipt PO #9081',
        createdById: warehouseUser.id,
      },
      {
        productId: product3.id,
        quantityChanged: 10,
        movementType: 'IN',
        reason: 'Stock Audit Adjustment',
        createdById: warehouseUser.id,
      },
    ],
  });

  // 4. Create Sample Sales Challans
  // Challan 1: Confirmed
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-202608-0001',
      customerId: customer1.id,
      totalQuantity: 5,
      totalAmount: 17250.0,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: product2.id,
            productName: product2.name,
            sku: product2.sku,
            unitPrice: product2.unitPrice,
            quantity: 5,
            subtotal: 17250.0,
          },
        ],
      },
    },
  });

  // Challan 2: Draft
  const challan2 = await prisma.salesChallan.create({
    data: {
      challanNumber: 'CH-202608-0002',
      customerId: customer2.id,
      totalQuantity: 10,
      totalAmount: 12500.0,
      status: 'DRAFT',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: product1.id,
            productName: product1.name,
            sku: product1.sku,
            unitPrice: product1.unitPrice,
            quantity: 10,
            subtotal: 12500.0,
          },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
