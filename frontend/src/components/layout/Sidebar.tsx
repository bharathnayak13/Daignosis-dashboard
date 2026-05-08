'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, Calendar, FlaskConical, FileText, BarChart3,
  Settings, Bell, CreditCard, Activity, ChevronLeft, ChevronRight,
  Stethoscope, UserCog, ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shared';
import { getInitials } from '@/lib/utils';
import React from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'PATIENT'] },
  { label: 'Patients', href: '/patients', icon: Users, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECHNICIAN'] },
  { label: 'Appointments', href: '/appointments', icon: Calendar, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'PATIENT'] },
  { label: 'Lab Tests', href: '/lab', icon: FlaskConical, roles: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'PATIENT'] },
  { label: 'Reports', href: '/reports', icon: FileText, roles: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'PATIENT'] },
  { label: 'Invoices', href: '/invoices', icon: CreditCard, roles: ['ADMIN', 'RECEPTIONIST', 'PATIENT'] },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['ADMIN', 'DOCTOR'] },
  { label: 'Doctors', href: '/doctors', icon: Stethoscope, roles: ['ADMIN', 'RECEPTIONIST'] },
  { label: 'Activity Logs', href: '/activity', icon: Activity, roles: ['ADMIN'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'PATIENT'] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filtered = navItems.filter(item => user?.role && item.roles.includes(user.role));

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex h-full flex-col border-r bg-card"
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-bold leading-none">Smart Diagnostic</p>
                <p className="text-xs text-muted-foreground">Center</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filtered.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="flex-1 truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <div className={cn('flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center')}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.avatar || ''} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user?.firstName || '', user?.lastName || '')}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="truncate text-xs font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </motion.aside>
  );
}
