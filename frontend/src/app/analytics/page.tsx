'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatCard } from '@/components/charts/StatCard';
import { Users, TrendingUp, FlaskConical, DollarSign } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function AnalyticsPage() {
  const [monthly, setMonthly] = useState<any>(null);
  const [patients, setPatients] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [lab, setLab] = useState<any>(null);
  const [doctors, setDoctors] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/monthly').catch(() => ({ data: { data: {} } })),
      api.get('/analytics/patients').catch(() => ({ data: { data: {} } })),
      api.get('/analytics/revenue').catch(() => ({ data: { data: {} } })),
      api.get('/analytics/lab').catch(() => ({ data: { data: {} } })),
      api.get('/analytics/doctors').catch(() => ({ data: { data: {} } })),
    ]).then(([m, p, r, l, d]) => {
      setMonthly(m.data.data);
      setPatients(p.data.data);
      setRevenue(r.data.data);
      setLab(l.data.data);
      setDoctors(d.data.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Insights and performance metrics</p>
        </div>

        {/* Monthly summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Appointments This Month" value={monthly?.appointments ?? '—'} icon={TrendingUp} iconColor="text-blue-600" iconBg="bg-blue-100" loading={loading} />
          <StatCard title="New Patients" value={monthly?.newPatients ?? '—'} icon={Users} iconColor="text-green-600" iconBg="bg-green-100" loading={loading} />
          <StatCard title="Lab Tests" value={monthly?.labTests ?? '—'} icon={FlaskConical} iconColor="text-orange-600" iconBg="bg-orange-100" loading={loading} />
          <StatCard title="Revenue" value={monthly?.revenue ? formatCurrency(monthly.revenue) : '—'} icon={DollarSign} iconColor="text-purple-600" iconBg="bg-purple-100" loading={loading} />
        </div>

        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (12 months)</CardTitle>
            <CardDescription>Monthly revenue from paid invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {revenue?.monthlyRevenue ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenue.monthlyRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: any) => [formatCurrency(v), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No revenue data</div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Patient gender */}
          <Card>
            <CardHeader>
              <CardTitle>Patient Demographics</CardTitle>
              <CardDescription>Gender distribution</CardDescription>
            </CardHeader>
            <CardContent>
              {patients?.genderDistribution ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={patients.genderDistribution.map((d: any) => ({ name: d.gender, value: d._count.gender }))}
                      cx="50%" cy="50%" outerRadius={85} innerRadius={50} paddingAngle={4} dataKey="value"
                    >
                      {patients.genderDistribution.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </CardContent>
          </Card>

          {/* Top lab tests */}
          <Card>
            <CardHeader>
              <CardTitle>Most Ordered Tests</CardTitle>
              <CardDescription>Top 8 lab tests by volume</CardDescription>
            </CardHeader>
            <CardContent>
              {lab?.topTests ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={lab.topTests.slice(0, 8).map((d: any) => ({ name: d.testName, count: d._count.testName }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                    <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Tests" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">No data</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Doctor workload */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor Workload</CardTitle>
            <CardDescription>Appointments per doctor this month</CardDescription>
          </CardHeader>
          <CardContent>
            {doctors?.doctors ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={doctors.doctors.map((d: any) => ({
                  name: `Dr. ${d.user.firstName} ${d.user.lastName}`,
                  appointments: d._count.appointments,
                  specialization: d.specialization,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Appointments" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Daily new patients */}
        {patients?.dailyPatients && (
          <Card>
            <CardHeader>
              <CardTitle>New Patients — Daily (Last 30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={patients.dailyPatients.map((d: any) => ({ date: d.date.slice(5), count: d.count }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} name="New Patients" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AppLayout>
  );
}
