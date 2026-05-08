import { Express } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import labTestRoutes from './labTest.routes';
import reportRoutes from './report.routes';
import invoiceRoutes from './invoice.routes';
import analyticsRoutes from './analytics.routes';
import notificationRoutes from './notification.routes';
import uploadRoutes from './upload.routes';
import settingsRoutes from './settings.routes';
import activityRoutes from './activity.routes';

export function setupRoutes(app: Express): void {
  const BASE = '/api';

  app.get(`${BASE}/health`, (_req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  app.use(`${BASE}/auth`, authRoutes);
  app.use(`${BASE}/patients`, patientRoutes);
  app.use(`${BASE}/doctors`, doctorRoutes);
  app.use(`${BASE}/appointments`, appointmentRoutes);
  app.use(`${BASE}/lab-tests`, labTestRoutes);
  app.use(`${BASE}/reports`, reportRoutes);
  app.use(`${BASE}/invoices`, invoiceRoutes);
  app.use(`${BASE}/analytics`, analyticsRoutes);
  app.use(`${BASE}/notifications`, notificationRoutes);
  app.use(`${BASE}/upload`, uploadRoutes);
  app.use(`${BASE}/settings`, settingsRoutes);
  app.use(`${BASE}/activity`, activityRoutes);
}
