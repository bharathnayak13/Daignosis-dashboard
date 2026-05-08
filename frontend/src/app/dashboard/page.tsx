'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Calendar, FlaskConical, DollarSign, TrendingUp,
  Clock, CheckCircle, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { StatCard } from '@/components/charts/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/shared';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils';
import AppLayout from '@/components/layout/AppLayout';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [patientData, setPatientData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [labData, setLabData] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, apptRes] = await Promise.all([
        api.get('/analytics/dashboard').catch(() => ({ data: { data: {} } })),
        api.get('/appointments?limit=5').catch(() => ({ data: { data: { appointments: [] } } })),
      ]);
      setStats(statsRes.data.data);
      setAppointments(apptRes.data.data.appointments || []);

      if (['ADMIN', 'DOCTOR'].includes(user?.role || '')) {
        const [pRes, rRes, lRes] = await Promise.all([
          api.get('/analytics/patients').catch(() => ({ data: { data: {} } })),
          api.get('/analytics/revenue').catch(() => ({ data: { data: {} } })),
          api.get('/analytics/lab').catch(() => ({ data: { data: {} } })),
        ]);
        setPatientData(pRes.data.data);
        setRevenueData(rRes.data.data);
        setLabData(lRes.data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'LAB_TECHNICIAN'].includes(user?.role || '');

  return (
    <AppLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">Here's what's happening at Smart Diagnostic Center today.</p>
        </motion.div>

        {/* Stat cards */}
        <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Patients" value={stats?.totalPatients?.toLocaleString() ?? '—'} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100 dark:bg-blue-900/30" trend={{ value: 12, label: 'vs last month' }} loading={loading} />
          <StatCard title="Today's Appointments" value={stats?.todayAppointments ?? '—'} icon={Calendar} iconColor="text-green-600" iconBg="bg-green-100 dark:bg-green-900/30" subtitle={`${stats?.activeAppointments ?? 0} currently active`} loading={loading} />
          <StatCard title="Pending Lab Tests" value={stats?.pendingLabTests ?? '—'} icon={FlaskConical} iconColor="text-orange-600" iconBg="bg-orange-100 dark:bg-orange-900/30" loading={loading} />
          <StatCard title="Monthly Revenue" value={stats?.monthlyRevenue ? formatCurrency(stats.monthlyRevenue) : '—'} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-100 dark:bg-purple-900/30" trend={{ value: 8, label: 'vs last month' }} loading={loading} />
        </motion.div>

        {/* Charts */}
        {isAdmin && (
          <motion.div variants={item} className="grid gap-4 lg:grid-cols-3">
            {/* Revenue chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the past 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueData?.monthlyRevenue ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={revenueData.monthlyRevenue}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-60 items-center justify-center text-muted-foreground text-sm">No data available</div>
                )}
              </CardContent>
            </Card>

            {/* Lab tests by status */}
            <Card>
              <CardHeader>
                <CardTitle>Lab Test Status</CardTitle>
                <CardDescription>Current distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {labData?.testsByStatus ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={labData.testsByStatus.map((d: any) => ({ name: d.status, value: d._count.status }))} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                        {labData.testsByStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">No data</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent appointments */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Appointments</CardTitle>
                <CardDescription>Latest 5 appointments</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  No appointments found
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appt: any) => (
                    <div key={appt.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Dr. {appt.doctor?.user?.firstName} {appt.doctor?.user?.lastName} · {formatDateTime(appt.scheduledAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily patients bar chart */}
        {patientData?.dailyPatients && (
          <motion.div variants={item}>
            <Card>
              <CardHeader>
                <CardTitle>New Patients — Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={patientData.dailyPatients.slice(-14)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Patients" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
