import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/common/ErrorDisplay';
import { useAppDispatch } from '@/app/hooks';
import { loginSuccess } from '@/features/auth/authSlice';
import { getDefaultRoute } from '@/utils/roles';
import { parseJwt } from '@/utils/auth';
import type { UserRole } from '@/types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined);

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = {
      email: values.email.trim().toLowerCase(),
      password: values.password,
    };

    try {
      const { data } = await axios.post<{ access: string; refresh: string }>(
        `${API_BASE}/api/token/`,
        payload,
      );
      dispatch(loginSuccess(data));
      const tokenPayload = parseJwt(data.access);
      const role = (tokenPayload.role as UserRole) ?? null;
      navigate(getDefaultRoute(role), { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
        setServerError(detail ?? 'Invalid credentials. Please try again.');
      } else {
        setServerError('An unexpected error occurred.');
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-white/10 animate-float">
            <span className="text-black font-bold text-sm tracking-tight">CM</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Club Management</span>
        </div>

        <Card className="border border-white/[0.08] shadow-2xl shadow-black/50 bg-[#141414]">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white">Sign In</CardTitle>
            <CardDescription className="text-white/40">Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 animate-scale-in">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70 text-xs font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                  className={`bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 transition-all duration-200 h-11 ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70 text-xs font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:border-white/20 focus:ring-white/10 transition-all duration-200 h-11 ${errors.password ? 'border-destructive' : ''}`}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-white text-black hover:bg-white/90 font-semibold transition-all duration-200 press mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/20 text-xs mt-8 tracking-wide">
          Staff access only · Contact your manager for credentials
        </p>
      </div>
    </div>
  );
}

export { ErrorDisplay };
