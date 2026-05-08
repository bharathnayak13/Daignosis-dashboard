'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, Avatar, AvatarFallback, AvatarImage, Skeleton } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/primitives';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDate, getInitials, calculateAge, cn } from '@/lib/utils';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('all');
  const limit = 15;

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      if (search.trim().length > 1) {
        const res = await api.get(`/patients/search?q=${search}&page=${page}&limit=${limit}`);
        setPatients(res.data.data.patients || []);
        setTotal(res.data.data.patients?.length || 0);
      } else {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (gender !== 'all') params.set('gender', gender);
        const res = await api.get(`/patients?${params}`);
        setPatients(res.data.data.patients || []);
        setTotal(res.data.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, gender]);

  useEffect(() => {
    const t = setTimeout(fetchPatients, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchPatients]);

  const pages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Patients</h1>
            <p className="text-sm text-muted-foreground">{total.toLocaleString()} total patients</p>
          </div>
          <Button onClick={() => router.push('/patients/new')}>
            <Plus className="h-4 w-4" /> Add Patient
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, phone…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={gender} onValueChange={v => { setGender(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Age / Gender</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Blood Group</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">City</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Visits</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : patients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground">
                        No patients found
                      </td>
                    </tr>
                  ) : (
                    patients.map((p: any) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.user?.avatar || ''} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(p.user?.firstName || '', p.user?.lastName || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{p.user?.firstName} {p.user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">{p.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{p.patientId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p>{calculateAge(p.dateOfBirth)} yrs</p>
                            <p className="text-xs text-muted-foreground capitalize">{p.gender?.toLowerCase()}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {p.bloodGroup ? (
                            <Badge variant="outline">{p.bloodGroup.replace('_', ' ')}</Badge>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{p.user?.phone || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.city || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 text-xs">
                            <span className="text-blue-600">{p._count?.appointments || 0} appts</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/patients/${p.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {pages} — {total} results
                </p>
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
