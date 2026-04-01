import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .login-root {
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes lineDraw {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }

        .anim-logo {
          animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 0.05s;
        }
        .anim-card {
          animation: fadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: 0.15s;
        }
        .anim-footer {
          animation: fadeIn 0.6s ease both;
          animation-delay: 0.45s;
        }
        .anim-error {
          animation: scaleIn 0.2s ease both;
        }

        .login-input {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 0 !important;
          color: #fff !important;
          // padding-left:  !important;
          padding-right: 0 !important;
          height: 44px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.9rem !important;
          transition: border-color 0.2s ease !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.18) !important;
        }
        .login-input:focus {
          border-bottom-color: rgba(255,255,255,0.5) !important;
          box-shadow: none !important;
        }
        .login-input.error {
          border-bottom-color: rgba(239,68,68,0.6) !important;
        }

        .submit-btn {
          height: 44px !important;
          background: #fff !important;
          color: #000 !important;
          font-family: 'DM Sans', sans-serif !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          letter-spacing: 0.02em !important;
          border-radius: 6px !important;
          transition: background 0.15s ease, opacity 0.15s ease !important;
          border: none !important;
        }
        .submit-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.88) !important;
        }
        .submit-btn:disabled {
          opacity: 0.5 !important;
        }
        .divider-line {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 -24px;
        }
      `}</style>

      <div
        className="login-root"
        style={{
          minHeight: '100vh',
          background: '#0C0C0C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
        />
        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, #0C0C0C 100%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ width: '100%', maxWidth: '360px', position: 'relative', zIndex: 10 }}>

          {/* Logo */}
          <div className="anim-logo" style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '26px', width:'250px' }}>
            <div>
              <img src="logo.png" alt="Logo" width={100} height={100} />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1.2 }}>
                Club Management
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>
                Staff Portal
              </p>
            </div>
          </div>

          {/* Card */}
          <div
            className="anim-card"
            style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Card header */}
            <div style={{ padding: '28px 28px 24px' }}>
              <h1 style={{
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: 300,
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '4px',
              }}>
                Sign in
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', letterSpacing: '0.01em' }}>
                Enter your credentials to continue
              </p>
            </div>

            <div className="divider-line" style={{ margin: '0 28px' }} />

            {/* Card body */}
            <div style={{ padding: '24px 28px 28px' }}>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {serverError && (
                  <div
                    className="anim-error"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '6px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: 'rgb(239,68,68)',
                      fontSize: '0.8rem',
                      lineHeight: 1.5,
                    }}
                  >
                    {serverError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    htmlFor="email"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...register('email')}
                    className={`login-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && (
                    <p style={{ color: 'rgb(239,68,68)', fontSize: '0.72rem', marginTop: '2px' }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label
                    htmlFor="password"
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...register('password')}
                    className={`login-input ${errors.password ? 'error' : ''}`}
                  />
                  {errors.password && (
                    <p style={{ color: 'rgb(239,68,68)', fontSize: '0.72rem', marginTop: '2px' }}>
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="submit-btn"
                  style={{ width: '100%', marginTop: '4px' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '14px',
                          height: '14px',
                          border: '1.5px solid rgba(0,0,0,0.2)',
                          borderTopColor: '#000',
                          borderRadius: '50%',
                          animation: 'spin 0.7s linear infinite',
                          display: 'inline-block',
                        }}
                      />
                      Signing in…
                    </span>
                  ) : (
                    'Continue'
                  )}
                </Button>

              </form>
            </div>
          </div>

          {/* Footer */}
          <div
            className="anim-footer"
            style={{
              textAlign: 'center',
              marginTop: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <p
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.65rem',
                letterSpacing: '0.04em',
              }}
            >
              Staff access only · Contact your manager for credentials
            </p>
            <Link
              to="/register"
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '.9rem',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,1)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            >
              Create a new club &rarr;
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}

export { ErrorDisplay };