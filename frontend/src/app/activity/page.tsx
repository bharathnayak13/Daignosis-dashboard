'use client';
import { useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, Skeleton } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDateTime, getRoleColor } from '@/lib/utils';

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    api.get(`/activity?page=${page}&limit=${limit}`)
      .then(r => { setLogs(r.data.data.logs || []); setTotal(r.data.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const pages = Math.ceil(total / limit);

  const actionColor: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-purple-100 text-purple-800',
    LOGOUT: 'bg-gray-100 text-gray-700',
    REGISTER: 'bg-teal-100 text-teal-800',
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">Audit trail — {total} total events</p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                    : logs.length === 0
                      ? <tr><td colSpan={6} className="py-16 text-center text-muted-foreground">No activity logs</td></tr>
                      : logs.map((log: any) => (
                        <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-2.5">
                            <p className="font-medium">{log.user?.firstName} {log.user?.lastName}</p>
                            <span className={`text-xs rounded-full px-1.5 py-0.5 ${getRoleColor(log.user?.role)}`}>{log.user?.role}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${actionColor[log.action] || 'bg-gray-100 text-gray-700'}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground capitalize">{log.entity}</td>
                          <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{log.description || '—'}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{log.ipAddress || '—'}</td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">{formatDateTime(log.createdAt)}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">Page {page} of {pages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
