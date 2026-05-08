'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage, Skeleton, Badge } from '@/components/ui/shared';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { getInitials, formatCurrency } from '@/lib/utils';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/doctors').then(r => setDoctors(r.data.data.doctors || [])).finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Doctors</h1>
          <p className="text-sm text-muted-foreground">{doctors.length} doctors on staff</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
            : doctors.map((d: any) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="sdc-card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={d.user?.avatar || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(d.user?.firstName || '', d.user?.lastName || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">Dr. {d.user?.firstName} {d.user?.lastName}</p>
                        <p className="text-sm text-primary font-medium">{d.specialization}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{d.experience} yrs experience</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Consultation Fee</span>
                      <span className="font-semibold">{formatCurrency(d.consultationFee)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Appointments</span>
                      <span className="font-semibold">{d._count?.appointments ?? 0}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant={d.isAvailable ? 'success' : 'secondary'}>
                        {d.isAvailable ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>
    </AppLayout>
  );
}
