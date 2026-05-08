'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useToast } from '@/components/ui/toaster';

export default function NewPatientPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.post('/patients', data);
      toast({ title: 'Patient created successfully!' });
      router.push(`/patients/${res.data.data.patient.id}`);
    } catch (err: any) {
      toast({ title: 'Failed to create patient', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-2xl font-bold">Add New Patient</h1>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Personal Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name *</Label>
                  <Input {...register('firstName', { required: true })} placeholder="John" />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name *</Label>
                  <Input {...register('lastName', { required: true })} placeholder="Doe" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Email *</Label>
                  <Input type="email" {...register('email', { required: true })} placeholder="patient@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input {...register('phone')} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of Birth *</Label>
                  <Input type="date" {...register('dateOfBirth', { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender *</Label>
                  <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('gender', { required: true })}>
                    <option value="">Select…</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Blood Group</Label>
                  <select className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" {...register('bloodGroup')}>
                    <option value="">Select…</option>
                    {['A_POSITIVE','A_NEGATIVE','B_POSITIVE','B_NEGATIVE','AB_POSITIVE','AB_NEGATIVE','O_POSITIVE','O_NEGATIVE'].map(bg => (
                      <option key={bg} value={bg}>{bg.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader><CardTitle className="text-base">Address</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label>Street Address</Label>
                  <Input {...register('address')} placeholder="123 Main Street" />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input {...register('city')} placeholder="Mangalore" />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input {...register('state')} placeholder="Karnataka" />
                </div>
                <div className="space-y-1.5">
                  <Label>ZIP Code</Label>
                  <Input {...register('zipCode')} placeholder="575001" />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader><CardTitle className="text-base">Emergency Contact</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contact Name</Label>
                  <Input {...register('emergencyName')} placeholder="Jane Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input {...register('emergencyPhone')} placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Relationship</Label>
                  <Input {...register('emergencyRel')} placeholder="Spouse, Parent, Sibling…" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4" /> {loading ? 'Creating…' : 'Create Patient'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AppLayout>
  );
}
