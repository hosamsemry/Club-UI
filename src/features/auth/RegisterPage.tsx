import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegisterClubMutation } from '@/api/apiSlice';

const schema = z.object({
  club_name: z.string().min(2, 'Club name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

/** Extract the first human-readable message from a DRF error response */
function extractError(data: unknown): string {
  if (!data || typeof data !== 'object') return 'An unexpected error occurred.';
  const obj = data as Record<string, unknown>;
  for (const key of ['detail', 'non_field_errors', 'club_name', 'email', 'username', 'password']) {
    const v = obj[key];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
  }
  const firstKey = Object.keys(obj)[0];
  if (firstKey) {
    const v = obj[firstKey];
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && typeof v[0] === 'string') return `${firstKey}: ${v[0]}`;
  }
  return 'Registration failed. Please try again.';
}

const REDIRECT_DELAY = 4;

export function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successClubName, setSuccessClubName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY);
  const [registerClub, { isLoading }] = useRegisterClubMutation();

  useEffect(() => {
    if (!successClubName) return;
    if (countdown <= 0) {
      navigate('/login', { replace: true });
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [successClubName, countdown, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await registerClub({
        club_name: values.club_name.trim(),
        email: values.email.trim().toLowerCase(),
        username: values.username.trim(),
        password: values.password,
      }).unwrap();

      setSuccessClubName(values.club_name.trim());
    } catch (err: unknown) {
      const data = (err as { data?: unknown })?.data;
      setServerError(extractError(data));
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .reg-root {
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

        .anim-logo  { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.05s; }
        .anim-card  { animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.15s; }
        .anim-footer{ animation: fadeIn 0.6s ease both; animation-delay: 0.45s; }
        .anim-error { animation: scaleIn 0.2s ease both; }

        .reg-input {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 0 !important;
          color: #fff !important;
          padding-right: 0 !important;
          height: 44px !important;
          font-family: 'DM Sans', sans-serif !important;
          font-size: 0.9rem !important;
          transition: border-color 0.2s ease !important;
          box-shadow: none !important;
          outline: none !important;
        }
        .reg-input::placeholder { color: rgba(255,255,255,0.18) !important; }
        .reg-input:focus        { border-bottom-color: rgba(255,255,255,0.5) !important; box-shadow: none !important; }
        .reg-input.error        { border-bottom-color: rgba(239,68,68,0.6) !important; }

        .reg-submit-btn {
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
        .reg-submit-btn:hover:not(:disabled) { background: rgba(255,255,255,0.88) !important; }
        .reg-submit-btn:disabled             { opacity: 0.5 !important; }

        .reg-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .reg-back-link {
          color: rgba(255,255,255,0.35);
          font-size: 0.78rem;
          text-decoration: none;
          transition: color 0.15s ease;
          letter-spacing: 0.01em;
        }
        .reg-back-link:hover { color: rgba(255,255,255,0.7); }

        @keyframes checkPop {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        .anim-check { animation: checkPop 0.4s cubic-bezier(0.22,1,0.36,1) both; animation-delay: 0.05s; }

        .progress-bar-inner {
          height: 2px;
          background: rgba(255,255,255,0.6);
          border-radius: 2px;
          animation: progressShrink linear forwards;
        }
        @keyframes progressShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div
        className="reg-root"
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
        {/* Grid overlay */}
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

        <div style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 10 }}>

          {/* Success screen */}
          {successClubName && (
            <div className="anim-card" style={{ textAlign: 'center' }}>
              {/* Check icon */}
              <div
                className="anim-check"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 28px',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgb(34,197,94)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <div
                style={{
                  background: '#161616',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  padding: '32px 28px 28px',
                }}
              >
                <h1 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 300, letterSpacing: '-0.02em', marginBottom: '10px' }}>
                  Club created!
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  Your club{' '}
                  <span style={{ color: '#fff', fontWeight: 500 }}>"{successClubName}"</span>{' '}
                  was created successfully. You can now sign in with your owner account.
                </p>

                {/* Progress bar */}
                <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div
                    className="progress-bar-inner"
                    style={{ animationDuration: `${REDIRECT_DELAY}s` }}
                  />
                </div>

                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', marginBottom: '20px' }}>
                  Redirecting to sign in in {countdown}s…
                </p>

                <Button
                  onClick={() => navigate('/login', { replace: true })}
                  className="reg-submit-btn"
                  style={{ width: '100%' }}
                >
                  Sign in now
                </Button>
              </div>
            </div>
          )}

          {/* Registration form (hidden once success) */}
          {!successClubName && <>

          {/* Logo */}
          <div
            className="anim-logo"
            style={{ display: 'flex', alignItems: 'center', gap: '0px', marginBottom: '36px', width: '250px' }}
          >
            <div>
              <img src="logo.png" alt="Logo" width={100} height={100} />
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500, letterSpacing: '0.01em', lineHeight: 1.2 }}>
                Club Management
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '3px' }}>
                New Club
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
                Create a club
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', letterSpacing: '0.01em' }}>
                Set up your club and owner account
              </p>
            </div>

            <div className="reg-divider" style={{ margin: '0 28px' }} />

            {/* Card body */}
            <div style={{ padding: '24px 28px 28px' }}>
              <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

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

                {/* Club Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="club_name" style={labelStyle}>Club Name</label>
                  <Input
                    id="club_name"
                    type="text"
                    placeholder="e.g. Sunset Sports Club"
                    autoComplete="organization"
                    {...register('club_name')}
                    className={`reg-input ${errors.club_name ? 'error' : ''}`}
                  />
                  {errors.club_name && <FieldError msg={errors.club_name.message} />}
                </div>

                {/* Email */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="email" style={labelStyle}>Owner Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@example.com"
                    autoComplete="email"
                    {...register('email')}
                    className={`reg-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <FieldError msg={errors.email.message} />}
                </div>

                {/* Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="username" style={labelStyle}>Username</label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="your_username"
                    autoComplete="username"
                    {...register('username')}
                    className={`reg-input ${errors.username ? 'error' : ''}`}
                  />
                  {errors.username && <FieldError msg={errors.username.message} />}
                </div>

                {/* Password */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="password" style={labelStyle}>Password</label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('password')}
                    className={`reg-input ${errors.password ? 'error' : ''}`}
                  />
                  {errors.password && <FieldError msg={errors.password.message} />}
                </div>

                <Button
                  type="submit"
                  className="reg-submit-btn"
                  style={{ width: '100%', marginTop: '4px' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
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
                      Creating…
                    </span>
                  ) : (
                    'Create Club'
                  )}
                </Button>

              </form>
            </div>
          </div>

          {/* Footer */}
          <div
            className="anim-footer"
            style={{ textAlign: 'center', marginTop: '24px' }}
          >
            <Link to="/login" className="reg-back-link">
              Already have an account? Sign in
            </Link>
          </div>

          </>}

        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: '0.7rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 500,
};

function FieldError({ msg }: { msg?: string }) {
  return (
    <p style={{ color: 'rgb(239,68,68)', fontSize: '0.72rem', marginTop: '2px' }}>
      {msg}
    </p>
  );
}
