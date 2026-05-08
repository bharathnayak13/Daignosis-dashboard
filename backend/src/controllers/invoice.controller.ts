import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';
import PDFDocument from 'pdfkit';

export const getInvoices = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, patientId } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;
  if (req.user.role === 'PATIENT' && req.user.patient) where.patientId = req.user.patient.id;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      skip, take: Number(limit), where, orderBy: { createdAt: 'desc' },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    }),
    prisma.invoice.count({ where }),
  ]);

  res.json({ status: 'success', data: { invoices, total } });
};

export const getInvoice = async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
    },
  });
  if (!invoice) throw new AppError('Invoice not found.', 404);
  res.json({ status: 'success', data: { invoice } });
};

export const createInvoice = async (req: Request, res: Response) => {
  const { patientId, appointmentId, items, tax = 0, discount = 0, notes, dueDate } = req.body;
  const subtotal = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + Number(tax) - Number(discount);

  const invoice = await prisma.invoice.create({
    data: {
      patientId, appointmentId, items, subtotal, tax, discount, total, notes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    },
  });

  res.status(201).json({ status: 'success', data: { invoice } });
};

export const updateInvoice = async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
  res.json({ status: 'success', data: { invoice } });
};

export const markAsPaid = async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.update({
    where: { id: req.params.id },
    data: { status: 'PAID', paidAt: new Date() },
  });
  res.json({ status: 'success', data: { invoice } });
};

export const generateInvoicePDF = async (req: Request, res: Response) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include: { patient: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } },
  });
  if (!invoice) throw new AppError('Invoice not found.', 404);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(24).font('Helvetica-Bold').text('Smart Diagnostic Center', { align: 'center' });
  doc.fontSize(18).font('Helvetica').text('INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice #: ${invoice.invoiceNumber}`);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
  doc.text(`Status: ${invoice.status}`);
  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('Bill To:');
  doc.fontSize(12).font('Helvetica');
  doc.text(`${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`);
  doc.text(`Email: ${invoice.patient.user.email}`);
  doc.moveDown();

  const items = invoice.items as any[];
  doc.fontSize(14).font('Helvetica-Bold').text('Items:');
  items.forEach((item: any) => {
    doc.fontSize(11).font('Helvetica').text(`${item.name} — Qty: ${item.quantity} × ₹${item.unitPrice} = ₹${item.quantity * item.unitPrice}`);
  });

  doc.moveDown();
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(`Subtotal: ₹${invoice.subtotal}`);
  doc.text(`Tax: ₹${invoice.tax}`);
  doc.text(`Discount: ₹${invoice.discount}`);
  doc.text(`Total: ₹${invoice.total}`);

  doc.end();
};
