'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { useAuthStore } from '@/store/authStore';

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const limit = 15;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (status !== 'all') params.set('status', status);
      const res = await api.get(`/invoices?${params}`);
      setInvoices(res.data.data.invoices || []);
      setTotal(res.data.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const markPaid = async (id: string) => {
    try {
      await api.put(`/invoices/${id}/pay`);
      toast({ title: 'Invoice marked as paid!' });
      fetchInvoices();
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const downloadPDF = (id: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${id}/pdf`, '_blank');
  };

  const pages = Math.ceil(total / limit);
  const canEdit = ['ADMIN', 'RECEPTIONIST'].includes(user?.role || '');

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoices</h1>
            <p className="text-sm text-muted-foreground">{total} total invoices</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
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
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
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
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-muted-foreground">
                        <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        No invoices found
                      </td>
                    </tr>
                  ) : invoices.map((inv: any) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                          {inv.invoiceNumber?.slice(-8)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {inv.patient?.user?.firstName} {inv.patient?.user?.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => downloadPDF(inv.id)} title="Download PDF">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {canEdit && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => markPaid(inv.id)}
                            >
                              Mark Paid
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
                <p className="text-sm text-muted-foreground">Page {page} of {pages} — {total} invoices</p>
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
    </AppLayout>
  );
}
