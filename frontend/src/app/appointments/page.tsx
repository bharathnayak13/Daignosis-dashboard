'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Calendar, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDateTime, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/shared';

export default function AppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const limit = 15;

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status !== 'all') params.set('status', status);
      const res = await api.get(`/appointments?${params}`);
      setAppointments(res.data.data.appointments || []);
      setTotal(res.data.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    if (showNew) {
      api.get('/patients?limit=100').then(r => setPatients(r.data.data.patients || []));
      api.get('/doctors').then(r => setDoctors(r.data.data.doctors || []));
    }
  }, [showNew]);

  const { register, handleSubmit, reset, setValue } = useForm();

  const onBook = async (data: any) => {
    try {
      await api.post('/appointments', data);
      toast({ title: 'Appointment booked!', variant: 'default' });
      setShowNew(false);
      reset();
      fetchAppointments();
    } catch (err: any) {
      toast({ title: 'Failed to book', description: err?.response?.data?.message, variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/appointments/${id}`, { status: newStatus });
      toast({ title: 'Status updated' });
      fetchAppointments();
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Appointments</h1>
            <p className="text-sm text-muted-foreground">{total} total appointments</p>
          </div>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" /> Book Appointment
          </Button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Token</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Doctor</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date & Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">No appointments found</td>
                    </tr>
                  ) : appointments.map((a: any) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                          {a.tokenNumber || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {a.patient?.user?.firstName} {a.patient?.user?.lastName}
                        <p className="text-xs text-muted-foreground">{a.patient?.user?.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(a.scheduledAt)}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{a.type}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(a.status)}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Select onValueChange={v => updateStatus(a.id, v)}>
                          <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Update" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CONFIRMED">Confirm</SelectItem>
                            <SelectItem value="IN_PROGRESS">Start</SelectItem>
                            <SelectItem value="COMPLETED">Complete</SelectItem>
                            <SelectItem value="NO_SHOW">No Show</SelectItem>
                            <SelectItem value="CANCELLED">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onBook)} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('patientId', { required: true })}
              >
                <option value="">Select patient…</option>
                {patients.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.user?.firstName} {p.user?.lastName} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Doctor</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('doctorId', { required: true })}
              >
                <option value="">Select doctor…</option>
                {doctors.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user?.firstName} {d.user?.lastName} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input type="datetime-local" {...register('scheduledAt', { required: true })} />
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register('type')}
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="emergency">Emergency</option>
                <option value="check-up">Check-up</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <textarea
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Symptoms, reason for visit…"
                {...register('symptoms')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Book Appointment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
