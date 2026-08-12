import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../utils/prisma.js';

export const exportChallanPDF = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Search by primary UUID id or by challanNumber
    let challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: true,
        items: true,
      },
    });

    if (!challan) {
      challan = await prisma.salesChallan.findUnique({
        where: { challanNumber: id },
        include: {
          customer: true,
          createdBy: true,
          items: true,
        },
      });
    }

    if (!challan) {
      res.status(404).json({ message: 'Sales Challan not found' });
      return;
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfData.length);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="Challan_${challan.challanNumber}.pdf"`
      );
      res.send(pdfData);
    });

    // Header Company Info
    doc
      .fillColor('#1E293B')
      .fontSize(18)
      .text('MINI ERP & CRM OPERATIONS', 50, 40)
      .fontSize(9)
      .fillColor('#64748B')
      .text('Wholesale & Industrial Distribution Portal', 50, 62);

    // Challan Title & Details
    doc
      .fillColor('#0F172A')
      .fontSize(13)
      .text(`SALES DISPATCH CHALLAN / INVOICE`, 50, 90)
      .fontSize(9)
      .fillColor('#334155')
      .text(`Challan Number: ${challan.challanNumber}`, 50, 110)
      .text(`Status: ${challan.status}`, 50, 122)
      .text(`Date: ${new Date(challan.createdAt).toLocaleDateString()}`, 50, 134)
      .text(`Created By: ${challan.createdBy?.name || 'System'} (${challan.createdBy?.role || 'User'})`, 50, 146);

    // Customer Details
    doc
      .fillColor('#0F172A')
      .fontSize(11)
      .text('CUSTOMER DETAILS', 300, 90)
      .fontSize(9)
      .fillColor('#334155')
      .text(`Business: ${challan.customer.businessName}`, 300, 110)
      .text(`Contact: ${challan.customer.name}`, 300, 122)
      .text(`GST: ${challan.customer.gstNumber || 'N/A'}`, 300, 134)
      .text(`Mobile: ${challan.customer.mobile}`, 300, 146)
      .text(`Address: ${challan.customer.address}`, 300, 158, { width: 240 });

    doc.moveTo(50, 190).lineTo(550, 190).stroke('#CBD5E1');

    // Table Header
    let y = 200;
    doc.fillColor('#0F172A').fontSize(9);
    doc.text('Item Description', 50, y, { width: 200 });
    doc.text('SKU', 250, y, { width: 80 });
    doc.text('Unit Price', 330, y, { width: 70, align: 'right' });
    doc.text('Qty', 410, y, { width: 40, align: 'right' });
    doc.text('Subtotal', 460, y, { width: 90, align: 'right' });

    doc.moveTo(50, y + 14).lineTo(550, y + 14).stroke('#E2E8F0');
    y += 22;

    // Table Items
    challan.items.forEach((item) => {
      doc.fillColor('#334155').fontSize(9);
      doc.text(item.productName, 50, y, { width: 200 });
      doc.text(item.sku, 250, y, { width: 80 });
      doc.text(`INR ${item.unitPrice.toFixed(2)}`, 330, y, { width: 70, align: 'right' });
      doc.text(item.quantity.toString(), 410, y, { width: 40, align: 'right' });
      doc.text(`INR ${item.subtotal.toFixed(2)}`, 460, y, { width: 90, align: 'right' });
      y += 18;
    });

    doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke('#CBD5E1');
    y += 15;

    // Summary Totals
    doc.fillColor('#0F172A').fontSize(10);
    doc.text(`Total Dispatched Quantity: ${challan.totalQuantity} Units`, 50, y);
    doc
      .fontSize(11)
      .fillColor('#0284C7')
      .text(`Total Amount: INR ${challan.totalAmount.toFixed(2)}`, 350, y, {
        width: 200,
        align: 'right',
      });

    doc.end();
  } catch (err: any) {
    console.error('PDF Generation Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
    }
  }
};
