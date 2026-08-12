import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../utils/prisma.js';

export const exportChallanPDF = async (req: Request, res: Response) => {
  const { id } = req.params;

  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: true,
      items: true,
    },
  });

  if (!challan) {
    res.status(404).json({ message: 'Sales Challan not found' });
    return;
  }

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Challan_${challan.challanNumber}.pdf"`
  );

  doc.pipe(res);

  // Header Company Info
  doc
    .fillColor('#1E293B')
    .fontSize(20)
    .text('MINI ERP & CRM OPERATIONS', { align: 'left' })
    .fontSize(10)
    .fillColor('#64748B')
    .text('Industrial & Distribution Portal', { align: 'left' })
    .moveDown(1.5);

  // Challan Title & Details Box
  doc
    .fillColor('#0F172A')
    .fontSize(16)
    .text(`SALES CHALLAN / INVOICE`, { underline: true })
    .fontSize(10)
    .moveDown(0.5);

  doc
    .fillColor('#334155')
    .text(`Challan Number: ${challan.challanNumber}`)
    .text(`Status: ${challan.status}`)
    .text(`Date: ${new Date(challan.createdAt).toLocaleDateString()}`)
    .text(`Created By: ${challan.createdBy.name} (${challan.createdBy.role})`)
    .moveDown(1);

  // Customer Information Box
  doc
    .fillColor('#0F172A')
    .fontSize(12)
    .text('CUSTOMER DETAILS', { underline: true })
    .fontSize(10)
    .fillColor('#334155')
    .text(`Customer Name: ${challan.customer.name}`)
    .text(`Business Name: ${challan.customer.businessName}`)
    .text(`GST Number: ${challan.customer.gstNumber || 'N/A'}`)
    .text(`Mobile: ${challan.customer.mobile}`)
    .text(`Address: ${challan.customer.address}`)
    .moveDown(1.5);

  // Items Table Header
  doc.fillColor('#0F172A').fontSize(11).text('ITEMS LIST', { underline: true }).moveDown(0.5);

  // Table Columns
  let y = doc.y;
  doc.fontSize(10).fillColor('#1E293B');
  doc.text('Item Description', 50, y, { width: 200 });
  doc.text('SKU', 250, y, { width: 90 });
  doc.text('Unit Price', 340, y, { width: 70, align: 'right' });
  doc.text('Qty', 420, y, { width: 50, align: 'right' });
  doc.text('Subtotal', 480, y, { width: 70, align: 'right' });

  doc
    .moveTo(50, y + 15)
    .lineTo(550, y + 15)
    .stroke('#CBD5E1');

  y += 25;

  // Table Items
  challan.items.forEach((item) => {
    doc.fillColor('#475569');
    doc.text(item.productName, 50, y, { width: 200 });
    doc.text(item.sku, 250, y, { width: 90 });
    doc.text(`INR ${item.unitPrice.toFixed(2)}`, 340, y, { width: 70, align: 'right' });
    doc.text(item.quantity.toString(), 420, y, { width: 50, align: 'right' });
    doc.text(`INR ${item.subtotal.toFixed(2)}`, 480, y, { width: 70, align: 'right' });
    y += 20;
  });

  doc.moveTo(50, y).lineTo(550, y).stroke('#CBD5E1');
  y += 15;

  // Summary Totals
  doc.fillColor('#0F172A').fontSize(11);
  doc.text(`Total Quantity: ${challan.totalQuantity}`, 340, y, { width: 200, align: 'right' });
  y += 18;
  doc
    .fontSize(12)
    .fillColor('#0284C7')
    .text(`Total Amount: INR ${challan.totalAmount.toFixed(2)}`, 340, y, {
      width: 200,
      align: 'right',
    });

  doc.end();
};
