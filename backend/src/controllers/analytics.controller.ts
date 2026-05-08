import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getDashboardStats = async (_req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalPatients, totalDoctors, todayAppointments, pendingLabTests,
    monthlyRevenue, totalAppointments, completedTests, activeAppointments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.doctor.count(),
    prisma.appointment.count({ where: { scheduledAt: { gte: today, lt: tomorrow } } }),
    prisma.labTest.count({ where: { status: { in: ['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'] } } }),
    prisma.invoice.aggregate({ where: { createdAt: { gte: thisMonth }, status: 'PAID' }, _sum: { total: true } }),
    prisma.appointment.count(),
    prisma.labTest.count({ where: { status: 'COMPLETED' } }),
    prisma.appointment.count({ where: { scheduledAt: { gte: today, lt: tomorrow }, status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] } } }),
  ]);

  res.json({
    status: 'success',
    data: {
      totalPatients,
      totalDoctors,
      todayAppointments,
      pendingLabTests,
      monthlyRevenue: monthlyRevenue._sum.total || 0,
      totalAppointments,
      completedTests,
      activeAppointments,
    },
  });
};

export const getPatientAnalytics = async (_req: Request, res: Response) => {
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const dailyPatients = await Promise.all(
    last30Days.map(async (date) => {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = await prisma.patient.count({
        where: { createdAt: { gte: date, lt: nextDay } },
      });
      return { date: date.toISOString().split('T')[0], count };
    })
  );

  const genderDistribution = await prisma.patient.groupBy({
    by: ['gender'],
    _count: { gender: true },
  });

  const bloodGroupDistribution = await prisma.patient.groupBy({
    by: ['bloodGroup'],
    _count: { bloodGroup: true },
    where: { bloodGroup: { not: null } },
  });

  res.json({ status: 'success', data: { dailyPatients, genderDistribution, bloodGroupDistribution } });
};

export const getRevenueAnalytics = async (_req: Request, res: Response) => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (11 - i));
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const monthlyRevenue = await Promise.all(
    months.map(async ({ year, month }) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      const result = await prisma.invoice.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: 'PAID' },
        _sum: { total: true },
      });
      return {
        month: new Date(year, month).toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: Number(result._sum.total) || 0,
      };
    })
  );

  const revenueByStatus = await prisma.invoice.groupBy({
    by: ['status'],
    _sum: { total: true },
    _count: true,
  });

  res.json({ status: 'success', data: { monthlyRevenue, revenueByStatus } });
};

export const getLabAnalytics = async (_req: Request, res: Response) => {
  const testsByCategory = await prisma.labTest.groupBy({
    by: ['category'],
    _count: { category: true },
    orderBy: { _count: { category: 'desc' } },
    take: 10,
  });

  const testsByStatus = await prisma.labTest.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const topTests = await prisma.labTest.groupBy({
    by: ['testName'],
    _count: { testName: true },
    orderBy: { _count: { testName: 'desc' } },
    take: 10,
  });

  res.json({ status: 'success', data: { testsByCategory, testsByStatus, topTests } });
};

export const getDoctorWorkload = async (_req: Request, res: Response) => {
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const doctors = await prisma.doctor.findMany({
    include: {
      user: { select: { firstName: true, lastName: true } },
      _count: {
        select: {
          appointments: {
            where: { createdAt: { gte: thisMonth } },
          },
        },
      },
    },
    take: 10,
  });

  res.json({ status: 'success', data: { doctors } });
};

export const getMonthlyReport = async (_req: Request, res: Response) => {
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  const [appointments, labTests, newPatients, revenue] = await Promise.all([
    prisma.appointment.count({ where: { createdAt: { gte: thisMonth, lt: nextMonth } } }),
    prisma.labTest.count({ where: { createdAt: { gte: thisMonth, lt: nextMonth } } }),
    prisma.patient.count({ where: { createdAt: { gte: thisMonth, lt: nextMonth } } }),
    prisma.invoice.aggregate({ where: { createdAt: { gte: thisMonth, lt: nextMonth }, status: 'PAID' }, _sum: { total: true } }),
  ]);

  res.json({
    status: 'success',
    data: { appointments, labTests, newPatients, revenue: Number(revenue._sum.total) || 0 },
  });
};
