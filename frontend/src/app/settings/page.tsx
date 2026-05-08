'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, User, Building, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/shared';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/toaster';
import { useForm } from 'react-hook-form';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data.data.settings || {})).catch(() => {});
    reset({ firstName: user?.firstName, lastName: user?.lastName, phone: user?.phone });
  }, [user]);

  const onSaveProfile = async (data: any) => {
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', data);
      setUser(res.data.data.user);
      toast({ title: 'Profile updated!' });
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and system preferences</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input {...register('firstName')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input {...register('lastName')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input {...register('phone')} placeholder="+91 98765 43210" />
              </div>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4" /> Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* System info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Clinic Name</span>
              <span className="font-medium">{settings.clinic_name || 'Smart Diagnostic Center'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium">{settings.clinic_address || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{settings.clinic_phone || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-medium">{settings.currency || 'INR'}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}

function ChangePasswordForm() {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast({ title: 'Passwords do not match', variant: 'destructive' });
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast({ title: 'Password changed!' });
      reset();
    } catch (err: any) {
      toast({ title: 'Failed', description: err?.response?.data?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Current Password</Label>
        <Input type="password" {...register('currentPassword', { required: true })} />
      </div>
      <div className="space-y-1.5">
        <Label>New Password</Label>
        <Input type="password" {...register('newPassword', { required: true, minLength: 8 })} />
      </div>
      <div className="space-y-1.5">
        <Label>Confirm New Password</Label>
        <Input type="password" {...register('confirmPassword', { required: true })} />
      </div>
      <Button type="submit" variant="outline" disabled={loading}>
        <Save className="h-4 w-4" /> Update Password
      </Button>
    </form>
  );
}
