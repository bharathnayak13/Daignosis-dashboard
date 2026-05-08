'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/shared';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ui/toaster';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      toast({ title: 'Welcome back!', description: 'Logged in successfully.', variant: 'default' });
      router.push('/dashboard');
    } catch (err: any) {
      toast({
        title: 'Login failed',
        description: err?.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  const quickLogin = (email: string, password: string) => {
    onSubmit({ email, password });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 sdc-gradient flex-col items-center justify-center p-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <FlaskConical className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold">Smart Diagnostic Center</h1>
          <p className="mb-8 text-lg opacity-90">
            Comprehensive healthcare management for modern diagnostic centers.
            Manage patients, appointments, lab tests, and more.
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Patients Managed', value: '50,000+' },
              { label: 'Tests Processed', value: '2M+' },
              { label: 'Doctors', value: '500+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold">Smart Diagnostic Center</p>
              <p className="text-xs text-muted-foreground">Healthcare Management</p>
            </div>
          </div>

          <h2 className="mb-2 text-2xl font-bold">Sign in to your account</h2>
          <p className="mb-8 text-muted-foreground">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register('password')}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Register here
            </Link>
          </div>

          {/* Quick login for demo */}
          <div className="mt-8 rounded-xl border bg-muted/40 p-4">
            <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Admin', email: 'admin@sdc.com', pass: 'Admin@123' },
                { role: 'Doctor', email: 'dr.sharma@sdc.com', pass: 'Doctor@123' },
                { role: 'Receptionist', email: 'reception@sdc.com', pass: 'Recep@123' },
                { role: 'Lab Tech', email: 'lab@sdc.com', pass: 'Lab@12345' },
              ].map((d) => (
                <button
                  key={d.role}
                  onClick={() => quickLogin(d.email, d.pass)}
                  className="rounded-lg border bg-background px-3 py-2 text-xs font-medium hover:bg-accent transition-colors text-left"
                >
                  <span className="block font-semibold">{d.role}</span>
                  <span className="text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
