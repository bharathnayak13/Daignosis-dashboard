'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Mail, MapPin, AlertTriangle, Edit, FlaskConical, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, Avatar, AvatarFallback, AvatarImage, Skeleton } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { formatDate, formatDateTime, getInitials, calculateAge, getStatusColor } from '@/lib/utils';

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/patients/${id}`)
      .then(res => setPatient(res.data.data.patient))
      .catch(() => router.push('/patients'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <AppLayout>
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    </AppLayout>
  );

  if (!patient) return null;

  const { user } = patient;

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm text-muted-foreground">Patient ID: {patient.patientId}</p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" onClick={() => router.push(`/patients/${id}/edit`)}>
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </div>
        </div>

        {/* Profile header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar || ''} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(user?.firstName || '', user?.lastName || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Age / Gender</p>
                  <p className="font-semibold">{calculateAge(patient.dateOfBirth)} years / {patient.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Blood Group</p>
                  <p className="font-semibold">{patient.bloodGroup?.replace('_', ' ') || '—'}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" /> {user?.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {user?.phone || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {[patient.city, patient.state].filter(Boolean).join(', ') || '—'}
                </div>
              </div>
            </div>

            {/* Allergies & chronic */}
            {(patient.allergies?.length > 0 || patient.chronicDiseases?.length > 0) && (
              <div className="mt-5 flex flex-wrap gap-4 pt-5 border-t">
                {patient.allergies?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-orange-500" /> Allergies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map((a: string) => (
                        <Badge key={a} variant="warning">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {patient.chronicDiseases?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Chronic Diseases</p>
                    <div className="flex flex-wrap gap-1.5">
                      {patient.chronicDiseases.map((d: string) => (
                        <Badge key={d} variant="destructive">{d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Recent Appointments */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patient.appointments?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No appointments</p>
              ) : patient.appointments?.map((a: any) => (
                <div key={a.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.scheduledAt)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(a.status)}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Lab Tests */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" /> Recent Lab Tests
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patient.labTests?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No lab tests</p>
              ) : patient.labTests?.map((t: any) => (
                <div key={t.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{t.testName}</p>
                  <p className="text-xs text-muted-foreground">{t.category} · {formatDate(t.createdAt)}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Medical History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patient.medicalHistory?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No history recorded</p>
              ) : patient.medicalHistory?.map((h: any) => (
                <div key={h.id} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{h.condition}</p>
                  {h.diagnosedAt && <p className="text-xs text-muted-foreground">Diagnosed: {formatDate(h.diagnosedAt)}</p>}
                  {h.treatment && <p className="text-xs text-muted-foreground">Treatment: {h.treatment}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
