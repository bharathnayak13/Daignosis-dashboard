import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';
import { logActivity } from '../utils/activityLogger';

export const getAppointments = async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, doctorId, patientId, date } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = status;
  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (date) {
    const d = new Date(date as string);
    where.scheduledAt = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  // If patient, only show their own appointments
  if (req.user.role === 'PATIENT' && req.user.patient) {
    where.patientId = req.user.patient.id;
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      skip,
      take: Number(limit),
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        patient: {
          include: { user: { select: { firstName: true, lastName: true, phone: true } } },
        },
        doctor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({
    status: 'success',
    data: { appointments, total, page: Number(page), limit: Number(limit) },
  });
};

export const getAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      patient: {
        include: { user: { select: { firstName: true, lastName: true, phone: true, email: true } } },
      },
      doctor: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      labTests: true,
      invoice: true,
    },
  });

  if (!appointment) throw new AppError('Appointment not found.', 404);
  res.json({ status: 'success', data: { appointment } });
};

export const createAppointment = async (req: Request, res: Response) => {
  const { patientId, doctorId, scheduledAt, duration, type, notes, symptoms } = req.body;

  // Check doctor availability
  const conflicting = await prisma.appointment.findFirst({
    where: {
      doctorId,
      scheduledAt: {
        gte: new Date(new Date(scheduledAt).getTime() - (duration || 30) * 60000),
        lte: new Date(new Date(scheduledAt).getTime() + (duration || 30) * 60000),
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    },
  });

  if (conflicting) throw new AppError('Doctor is not available at this time.', 409);

  // Generate token number for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.appointment.count({
    where: { doctorId, scheduledAt: { gte: today }, status: { notIn: ['CANCELLED'] } },
  });

  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      type: type || 'consultation',
      notes,
      symptoms,
      queueNumber: todayCount + 1,
      tokenNumber: `T${String(todayCount + 1).padStart(3, '0')}`,
    },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  // Emit socket event for real-time queue update
  if (req.io) {
    req.io.emit('appointment:created', appointment);
    req.io.emit('queue:updated', { doctorId });
  }

  // Create notification for patient
  await prisma.notification.create({
    data: {
      userId: appointment.patient.userId,
      type: 'APPOINTMENT',
      title: 'Appointment Confirmed',
      message: `Your appointment has been scheduled. Token: ${appointment.tokenNumber}`,
      data: { appointmentId: appointment.id },
    },
  });

  await logActivity(req.user.id, 'CREATE', 'appointment', appointment.id, 'Appointment booked', req);

  res.status(201).json({ status: 'success', data: { appointment } });
};

export const updateAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const appointment = await prisma.appointment.update({
    where: { id },
    data: req.body,
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  if (req.io) req.io.emit('appointment:updated', appointment);
  res.json({ status: 'success', data: { appointment } });
};

export const cancelAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  if (req.io) req.io.emit('appointment:cancelled', { id });
  res.json({ status: 'success', data: { appointment } });
};

export const getQueue = async (req: Request, res: Response) => {
  const { doctorId, date } = req.query;
  const today = date ? new Date(date as string) : new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where: any = {
    scheduledAt: { gte: today, lt: tomorrow },
    status: { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] },
  };
  if (doctorId) where.doctorId = doctorId;

  const queue = await prisma.appointment.findMany({
    where,
    orderBy: { queueNumber: 'asc' },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  res.json({ status: 'success', data: { queue } });
};

export const updateQueue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, queueNumber } = req.body;

  const appointment = await prisma.appointment.update({
    where: { id },
    data: { status, queueNumber },
  });

  if (req.io) req.io.emit('queue:updated', { doctorId: appointment.doctorId });
  res.json({ status: 'success', data: { appointment } });
};

export const getDoctorSchedule = async (req: Request, res: Response) => {
  const { doctorId } = req.params;
  const { startDate, endDate } = req.query;

  const where: any = { doctorId, status: { notIn: ['CANCELLED'] } };
  if (startDate && endDate) {
    where.scheduledAt = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: 'asc' },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  res.json({ status: 'success', data: { appointments } });
};

export const getCalendarView = async (req: Request, res: Response) => {
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  const startDate = new Date(y, m - 1, 1);
  const endDate = new Date(y, m, 0, 23, 59, 59);

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: startDate, lte: endDate },
      status: { notIn: ['CANCELLED'] },
    },
    include: {
      patient: { include: { user: { select: { firstName: true, lastName: true } } } },
      doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
  });

  res.json({ status: 'success', data: { appointments } });
};
