'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, FlaskConical, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { useForm } from 'react-hook-form';
import { Label } from '@/components/ui/shared';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';

const LAB_CATEGORIES = ['Hematology', 'Biochemistry', 'Microbiology', 'Immunology', 'Pathology', 'Radiology', 'Cardiology', 'Urine Analysis', 'Other'];

export default function LabPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [tests, setTests] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const limit = 15;
  const { register, handleSubmit, reset } = useForm();

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status !== 'all') params.set('status', status);
      const res = await api.get(`/lab-tests?${params}`);
      setTests(res.data.data.tests || []);
      setTotal(res.data.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  useEffect(() => {
    if (showNew) {
      api.get('/patients?limit=100').then(r => setPatients(r.data.data.patients || []));
    }
  }, [showNew]);

  const onCreateTest = async (data: any) => {
    try {
      await api.post('/lab-tests', data);
      toast({ title: 'Lab test ordered!' });
      setShowNew(false);
      reset();
      fetchTests();
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.response?.data?.message, variant: 'destructive' });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/lab-tests/${id}/status`, { status: newStatus });
      toast({ title: 'Status updated' });
      fetchTests();
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const downloadReport = (id: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/lab-tests/${id}/generate-report`, '_blank');
  };

  const pages = Math.ceil(total / limit);
  const canCreate = ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user?.role || '');
  const canUpdate = ['ADMIN', 'LAB_TECHNICIAN'].includes(user?.role || '');

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lab Tests</h1>
            <p className="text-sm text-muted-foreground">{total} total tests</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> Order Test
            </Button>
          )}
        </div>

        <div className="flex gap-3">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ORDERED">Ordered</SelectItem>
              <SelectItem value="SAMPLE_COLLECTED">Sample Collected</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REPORTED">Reported</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Test Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Priority</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ordered</th>
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
                  ) : tests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">No lab tests found</td>
                    </tr>
                  ) : tests.map((t: any) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        {t.testName}
                        {t.testCode && <p className="text-xs text-muted-foreground font-mono">{t.testCode}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {t.patient?.user?.firstName} {t.patient?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{t.category}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${t.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(t.status)}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canUpdate && t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                            <Select onValueChange={v => updateStatus(t.id, v)}>
                              <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Update status" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SAMPLE_COLLECTED">Collect Sample</SelectItem>
                                <SelectItem value="IN_PROGRESS">Start Processing</SelectItem>
                                <SelectItem value="COMPLETED">Mark Complete</SelectItem>
                                <SelectItem value="REPORTED">Mark Reported</SelectItem>
                                <SelectItem value="CANCELLED">Cancel</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {['COMPLETED', 'REPORTED'].includes(t.status) && (
                            <Button variant="ghost" size="sm" onClick={() => downloadReport(t.id)} title="Download Report">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
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

      {/* New Test Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Lab Test</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateTest)} className="space-y-4 mt-2">
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Test Name</Label>
                <Input placeholder="e.g. CBC" {...register('testName', { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>Test Code</Label>
                <Input placeholder="e.g. CBC-001" {...register('testCode')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register('category', { required: true })}
                >
                  <option value="">Select…</option>
                  {LAB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  {...register('priority')}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Cost (₹)</Label>
              <Input type="number" placeholder="0" {...register('cost')} />
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <textarea
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                {...register('notes')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Order Test</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
