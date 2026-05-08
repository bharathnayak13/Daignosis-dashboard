'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FlaskConical, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/shared';
import { useToast } from '@/components/ui/toaster';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast({ title: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <p className="font-bold">Smart Diagnostic Center</p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check your email</h2>
            <p className="text-muted-foreground text-sm mb-6">
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4" /> Back to Login</Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1">Reset your password</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your email address and we'll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
