import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, HH:mm');
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount: number | string, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getStatusColor(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    CONFIRMED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    NO_SHOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    ORDERED: 'bg-blue-100 text-blue-800',
    SAMPLE_COLLECTED: 'bg-purple-100 text-purple-800',
    REPORTED: 'bg-green-100 text-green-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function getRoleColor(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800',
    DOCTOR: 'bg-blue-100 text-blue-800',
    LAB_TECHNICIAN: 'bg-purple-100 text-purple-800',
    RECEPTIONIST: 'bg-orange-100 text-orange-800',
    PATIENT: 'bg-green-100 text-green-800',
  };
  return map[role] ?? 'bg-gray-100 text-gray-800';
}

export function calculateAge(dob: string | Date) {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export function truncate(str: string, maxLength = 40) {
  if (!str) return '';
  return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}
