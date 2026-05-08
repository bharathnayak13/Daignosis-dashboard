import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';

// =================== REPORT CONTROLLER ===================
export const getReports = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, patientId, type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (patientId) where.patientId = patientId;
  if (type) where.type = type;
  if (req.user.role === 'PATIENT' && req.user.patient) where.patientId = req.user.patient.id;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      skip, take: Number(limit), where, orderBy: { createdAt: 'desc' },
      include: { patient: { include: { user: { select: { firstName: true, lastName: true } } } } },
    }),
    prisma.report.count({ where }),
  ]);
  res.json({ status: 'success', data: { reports, total } });
};

export const getReport = async (req: Request, res: Response) => {
  const report = await prisma.report.findUnique({ where: { id: req.params.id }, include: { patient: true } });
  if (!report) throw new AppError('Report not found.', 404);
  res.json({ status: 'success', data: { report } });
};

export const deleteReport = async (req: Request, res: Response) => {
  await prisma.report.delete({ where: { id: req.params.id } });
  res.json({ status: 'success', message: 'Report deleted.' });
};

// =================== DOCTOR CONTROLLER ===================
export const getDoctors = async (req: Request, res: Response) => {
  const { specialization } = req.query;
  const where: any = {};
  if (specialization) where.specialization = { contains: specialization as string, mode: 'insensitive' };

  const doctors = await prisma.doctor.findMany({
    where,
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
      _count: { select: { appointments: true } },
    },
  });
  res.json({ status: 'success', data: { doctors } });
};

export const getDoctor = async (req: Request, res: Response) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, phone: true, avatar: true } },
      _count: { select: { appointments: true } },
    },
  });
  if (!doctor) throw new AppError('Doctor not found.', 404);
  res.json({ status: 'success', data: { doctor } });
};

export const getDoctorAvailability = async (req: Request, res: Response) => {
  const { date } = req.query;
  const d = date ? new Date(date as string) : new Date();
  d.setHours(0, 0, 0, 0);
  const nextDay = new Date(d);
  nextDay.setDate(nextDay.getDate() + 1);

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: req.params.id, scheduledAt: { gte: d, lt: nextDay }, status: { notIn: ['CANCELLED'] } },
    select: { scheduledAt: true, duration: true },
  });

  res.json({ status: 'success', data: { bookedSlots: appointments } });
};

export const updateDoctor = async (req: Request, res: Response) => {
  const doctor = await prisma.doctor.update({ where: { id: req.params.id }, data: req.body });
  res.json({ status: 'success', data: { doctor } });
};

// =================== NOTIFICATION CONTROLLER ===================
export const getNotifications = async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unreadCount = notifications.filter(n => !n.isRead).length;
  res.json({ status: 'success', data: { notifications, unreadCount } });
};

export const markAsRead = async (req: Request, res: Response) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ status: 'success' });
};

export const markAllAsRead = async (req: Request, res: Response) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ status: 'success' });
};

export const deleteNotification = async (req: Request, res: Response) => {
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ status: 'success' });
};

// =================== UPLOAD CONTROLLER ===================
export const uploadFile = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);
  res.json({
    status: 'success',
    data: {
      url: `/uploads/${req.query.type === 'scan' ? 'scans' : 'reports'}/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    },
  });
};

export const uploadReport = async (req: Request, res: Response) => {
  if (!req.file) throw new AppError('No file uploaded.', 400);
  const { patientId } = req.params;
  const { title, type, labTestId } = req.body;

  const report = await prisma.report.create({
    data: {
      patientId,
      labTestId,
      type: type || 'LAB_REPORT',
      title: title || req.file.originalname,
      fileUrl: `/uploads/reports/${req.file.filename}`,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      issuedBy: `${req.user.firstName} ${req.user.lastName}`,
    },
  });

  res.status(201).json({ status: 'success', data: { report } });
};

// =================== SETTINGS CONTROLLER ===================
export const getSettings = async (_req: Request, res: Response) => {
  const settings = await prisma.setting.findMany();
  const settingsMap = settings.reduce((acc: any, s) => { acc[s.key] = s.value; return acc; }, {});
  res.json({ status: 'success', data: { settings: settingsMap } });
};

export const updateSetting = async (req: Request, res: Response) => {
  const { key } = req.params;
  const setting = await prisma.setting.upsert({
    where: { key },
    update: { value: req.body.value },
    create: { key, value: req.body.value, category: req.body.category || 'general' },
  });
  res.json({ status: 'success', data: { setting } });
};

// =================== ACTIVITY CONTROLLER ===================
export const getActivityLogs = async (req: Request, res: Response) => {
  const { page = 1, limit = 50, userId, entity } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (userId) where.userId = userId;
  if (entity) where.entity = entity;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      skip, take: Number(limit), where, orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  res.json({ status: 'success', data: { logs, total } });
};
