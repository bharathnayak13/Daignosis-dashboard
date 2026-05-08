import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';
import { logActivity } from '../utils/activityLogger';
import PDFDocument from 'pdfkit';

export const getLabTests = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, patientId, category } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;
  if (category) where.category = { contains: category as string, mode: 'insensitive' };

  if (req.user.role === 'PATIENT' && req.user.patient) {
    where.patientId = req.user.patient.id;
  }

  const [tests, total] = await Promise.all([
    prisma.labTest.findMany({
      skip, take: Number(limit), where, orderBy: { createdAt: 'desc' },
      include: {
        patient: { include: { user: { select: { firstName: true, lastName: true } } } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.labTest.count({ where }),
  ]);

  res.json({ status: 'success', data: { tests, total, page: Number(page), limit: Number(limit) } });
};

export const getLabTest = async (req: Request, res: Response) => {
  const test = await prisma.labTest.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
      reports: true,
    },
  });
  if (!test) throw new AppError('Lab test not found.', 404);
  res.json({ status: 'success', data: { test } });
};

export const createLabTest = async (req: Request, res: Response) => {
  const test = await prisma.labTest.create({
    data: {
      patientId: req.body.patientId,
      doctorId: req.body.doctorId,
      appointmentId: req.body.appointmentId,
      testName: req.body.testName,
      testCode: req.body.testCode,
      category: req.body.category,
      priority: req.body.priority || 'normal',
      sampleType: req.body.sampleType,
      cost: req.body.cost || 0,
      notes: req.body.notes,
    },
  });

  if (req.io) req.io.emit('labTest:created', test);
  await logActivity(req.user.id, 'CREATE', 'labTest', test.id, `Lab test ordered: ${test.testName}`, req);

  res.status(201).json({ status: 'success', data: { test } });
};

export const updateLabTest = async (req: Request, res: Response) => {
  const test = await prisma.labTest.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json({ status: 'success', data: { test } });
};

export const updateTestStatus = async (req: Request, res: Response) => {
  const { status, result, referenceRange } = req.body;
  const updateData: any = { status };
  if (result) updateData.result = result;
  if (referenceRange) updateData.referenceRange = referenceRange;
  if (status === 'COMPLETED') updateData.completedAt = new Date();
  if (status === 'SAMPLE_COLLECTED') updateData.sampleCollected = new Date();

  const test = await prisma.labTest.update({
    where: { id: req.params.id },
    data: updateData,
    include: { patient: { include: { user: true } } },
  });

  if (status === 'COMPLETED') {
    await prisma.notification.create({
      data: {
        userId: test.patient.userId,
        type: 'LAB_RESULT',
        title: 'Lab Results Ready',
        message: `Your ${test.testName} results are ready.`,
        data: { testId: test.id },
      },
    });
  }

  if (req.io) req.io.emit('labTest:updated', test);
  res.json({ status: 'success', data: { test } });
};

export const collectSample = async (req: Request, res: Response) => {
  const test = await prisma.labTest.update({
    where: { id: req.params.id },
    data: { status: 'SAMPLE_COLLECTED', sampleCollected: new Date(), technicianId: req.user.id },
  });
  if (req.io) req.io.emit('labTest:sampleCollected', test);
  res.json({ status: 'success', data: { test } });
};

export const generateReport = async (req: Request, res: Response) => {
  const test = await prisma.labTest.findUnique({
    where: { id: req.params.id },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (!test) throw new AppError('Lab test not found.', 404);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="report-${test.id}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('Smart Diagnostic Center', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Lab Report', { align: 'center' });
  doc.moveDown();

  // Patient Info
  doc.fontSize(14).font('Helvetica-Bold').text('Patient Information');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Name: ${test.patient.user.firstName} ${test.patient.user.lastName}`);
  doc.text(`Test: ${test.testName}`);
  doc.text(`Category: ${test.category}`);
  doc.text(`Date: ${new Date(test.createdAt).toLocaleDateString()}`);
  if (test.completedAt) doc.text(`Completed: ${new Date(test.completedAt).toLocaleDateString()}`);

  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text('Results');
  doc.fontSize(11).font('Helvetica');
  if (test.result) {
    const result = test.result as any;
    Object.entries(result).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`);
    });
  }
  if (test.referenceRange) {
    doc.moveDown();
    doc.text(`Reference Range: ${test.referenceRange}`);
  }

  doc.moveDown(2);
  doc.fontSize(10).text('This is a computer-generated report.', { align: 'center' });

  doc.end();
};

export const getLabStats = async (_req: Request, res: Response) => {
  const [total, pending, inProgress, completed] = await Promise.all([
    prisma.labTest.count(),
    prisma.labTest.count({ where: { status: 'ORDERED' } }),
    prisma.labTest.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.labTest.count({ where: { status: 'COMPLETED' } }),
  ]);

  res.json({ status: 'success', data: { total, pending, inProgress, completed } });
};
