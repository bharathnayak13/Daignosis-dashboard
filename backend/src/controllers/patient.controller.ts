import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';
import { logActivity } from '../utils/activityLogger';

export const getPatients = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      skip,
      take: Number(limit),
      orderBy: { [sortBy as string]: order },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
        _count: { select: { appointments: true, labTests: true, reports: true } },
      },
    }),
    prisma.patient.count(),
  ]);

  res.json({
    status: 'success',
    data: { patients, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
  });
};

export const getPatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patient = await prisma.patient.findFirst({
    where: { OR: [{ id }, { patientId: id }] },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true, role: true } },
      appointments: {
        orderBy: { scheduledAt: 'desc' },
        take: 5,
        include: { doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
      },
      labTests: { orderBy: { createdAt: 'desc' }, take: 5 },
      reports: { orderBy: { createdAt: 'desc' }, take: 5 },
      medicalHistory: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
      _count: { select: { appointments: true, labTests: true, reports: true } },
    },
  });

  if (!patient) throw new AppError('Patient not found.', 404);

  res.json({ status: 'success', data: { patient } });
};

export const createPatient = async (req: Request, res: Response) => {
  const {
    userId, dateOfBirth, gender, bloodGroup, address, city, state, zipCode,
    emergencyName, emergencyPhone, emergencyRel, allergies, chronicDiseases,
    // If creating new user alongside
    email, password, firstName, lastName, phone,
  } = req.body;

  let targetUserId = userId;

  if (!targetUserId && email) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password || 'Patient@123', 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName, phone, role: 'PATIENT' },
    });
    targetUserId = user.id;
  }

  if (!targetUserId) throw new AppError('User ID or user details required.', 400);

  const existingPatient = await prisma.patient.findUnique({ where: { userId: targetUserId } });
  if (existingPatient) throw new AppError('Patient profile already exists for this user.', 409);

  const patient = await prisma.patient.create({
    data: {
      userId: targetUserId,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      bloodGroup,
      address,
      city,
      state,
      zipCode,
      emergencyName,
      emergencyPhone,
      emergencyRel,
      allergies: allergies || [],
      chronicDiseases: chronicDiseases || [],
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  await logActivity(req.user.id, 'CREATE', 'patient', patient.id, `Created patient: ${patient.patientId}`, req);

  res.status(201).json({ status: 'success', data: { patient } });
};

export const updatePatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  const patient = await prisma.patient.update({
    where: { id },
    data: req.body,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  await logActivity(req.user.id, 'UPDATE', 'patient', id, 'Updated patient', req);
  res.json({ status: 'success', data: { patient } });
};

export const deletePatient = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.patient.delete({ where: { id } });
  await logActivity(req.user.id, 'DELETE', 'patient', id, 'Deleted patient', req);
  res.json({ status: 'success', message: 'Patient deleted.' });
};

export const searchPatients = async (req: Request, res: Response) => {
  const { q, page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  if (!q) throw new AppError('Search query required.', 400);

  const patients = await prisma.patient.findMany({
    skip,
    take: Number(limit),
    where: {
      OR: [
        { patientId: { contains: q as string, mode: 'insensitive' } },
        { user: { firstName: { contains: q as string, mode: 'insensitive' } } },
        { user: { lastName: { contains: q as string, mode: 'insensitive' } } },
        { user: { email: { contains: q as string, mode: 'insensitive' } } },
        { user: { phone: { contains: q as string, mode: 'insensitive' } } },
      ],
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
    },
  });

  res.json({ status: 'success', data: { patients } });
};

export const getPatientHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const history = await prisma.medicalHistory.findMany({
    where: { patientId: id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ status: 'success', data: { history } });
};

export const addMedicalHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { condition, diagnosedAt, treatedBy, treatment, notes } = req.body;

  const history = await prisma.medicalHistory.create({
    data: {
      patientId: id,
      condition,
      diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : undefined,
      treatedBy,
      treatment,
      notes,
    },
  });

  res.status(201).json({ status: 'success', data: { history } });
};
