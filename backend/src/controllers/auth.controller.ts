import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/appError';
import { logActivity } from '../utils/activityLogger';

const generateToken = (id: string, email: string, role: string): string => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { email, password, firstName, lastName, phone, role } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('User with this email already exists.', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: role || 'PATIENT',
    },
    select: {
      id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true,
    },
  });

  // Auto-create patient profile if role is PATIENT
  if (user.role === 'PATIENT') {
    await prisma.patient.create({
      data: {
        userId: user.id,
        dateOfBirth: req.body.dateOfBirth || new Date('1990-01-01'),
        gender: req.body.gender || 'MALE',
      },
    });
  }

  const token = generateToken(user.id, user.email, user.role);

  await logActivity(user.id, 'REGISTER', 'user', user.id, 'User registered', req);

  res.status(201).json({
    status: 'success',
    data: { user, token },
  });
};

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      patient: { select: { id: true, patientId: true } },
      doctor: { select: { id: true, specialization: true } },
    },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact admin.', 403);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const token = generateToken(user.id, user.email, user.role);

  await logActivity(user.id, 'LOGIN', 'user', user.id, 'User logged in', req);

  const { password: _, ...userWithoutPassword } = user;

  res.json({
    status: 'success',
    data: { user: userWithoutPassword, token },
  });
};

export const logout = async (req: Request, res: Response) => {
  await logActivity(req.user.id, 'LOGOUT', 'user', req.user.id, 'User logged out', req);
  res.json({ status: 'success', message: 'Logged out successfully.' });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatar: true, role: true, createdAt: true, lastLogin: true,
      patient: true, doctor: true,
    },
  });

  res.json({ status: 'success', data: { user } });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { firstName, lastName, phone, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { firstName, lastName, phone, avatar },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, avatar: true, role: true,
    },
  });

  res.json({ status: 'success', data: { user } });
};

export const changePassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400);

  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) throw new AppError('User not found.', 404);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw new AppError('Current password is incorrect.', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  res.json({ status: 'success', message: 'Password changed successfully.' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  res.json({
    status: 'success',
    message: 'If this email exists, you will receive a password reset link.',
  });

  // TODO: Send email with reset token
  if (user) {
    // Generate reset token and send email
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    // await sendResetEmail(user.email, resetToken);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) throw new AppError('No token provided.', 400);

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || !user.isActive) throw new AppError('Invalid token.', 401);

  const newToken = generateToken(user.id, user.email, user.role);
  res.json({ status: 'success', data: { token: newToken } });
};
