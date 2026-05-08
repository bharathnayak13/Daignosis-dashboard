'use client';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Upload, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/primitives';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { Label } from '@/components/ui/shared';
import { Input } from '@/components/ui/input';

const REPORT_TYPES = ['LAB_REPORT', 'RADIOLOGY', 'PRESCRIPTION', 'DISCHARGE_SUMMARY', 'OTHER'];

export default function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({ patientId: '', title: '', type: 'LAB_REPORT' });
  const [file, setFile] = useState<File | null>(null);
  const limit = 15;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await api.get(`/reports?${params}`);
      setReports(res.data.data.reports || []);
      setTotal(res.data.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    if (showUpload) {
      api.get('/patients?limit=100').then(r => setPatients(r.data.data.patients || []));
    }
  }, [showUpload]);

  const handleUpload = async () => {
    if (!file || !uploadData.patientId) {
      return toast({ title: 'Please select a patient and file', variant: 'destructive' });
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', uploadData.title || file.name);
      form.append('type', uploadData.type);
      await api.post(`/upload/report/${uploadData.patientId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Report uploaded successfully!' });
      setShowUpload(false);
      setFile(null);
      setUploadData({ patientId: '', title: '', type: 'LAB_REPORT' });
      fetchReports();
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const pages = Math.ceil(total / limit);
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">{total} total reports</p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" /> Upload Report
          </Button>
        </div>

        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={v => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-52"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {REPORT_TYPES.map(t => (
                <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Issued By</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-muted-foreground">
                        <FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        No reports found
                      </td>
                    </tr>
                  ) : reports.map((r: any) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          {r.title}
                        </div>
                        {r.fileName && (
                          <p className="text-xs text-muted-foreground ml-6">
                            {(r.fileSize / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {r.patient?.user?.firstName} {r.patient?.user?.lastName}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{r.type.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.issuedBy || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {r.fileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`${API_URL}${r.fileUrl}`, '_blank')}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        )}
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

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Patient</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={uploadData.patientId}
                onChange={e => setUploadData(d => ({ ...d, patientId: e.target.value }))}
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
              <Label>Report Title</Label>
              <Input
                placeholder="e.g. CBC Report - March 2024"
                value={uploadData.title}
                onChange={e => setUploadData(d => ({ ...d, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Report Type</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={uploadData.type}
                onChange={e => setUploadData(d => ({ ...d, type: e.target.value }))}
              >
                {REPORT_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>File (PDF, JPG, PNG)</Label>
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => document.getElementById('report-file-input')?.click()}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Click to select file</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
              </div>
              <input
                id="report-file-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload Report'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
