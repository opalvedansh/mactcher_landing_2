'use client';

// Ported from mymatcher src/screens/auth/LoginScreen.tsx: same modes, same
// Supabase calls, same error wording.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/matchr/auth';
import { Icon, MatchrLogo } from '@/components/portal/icons';
import { Spinner } from '@/components/portal/ui';

type AuthMode =
  | 'login' | 'signup' | 'email_login' | 'email_signup'
  | 'verify_email' | 'forgot_password' | 'reset_code' | 'reset_password';

// Must match the Supabase project's Auth → Email OTP length (currently 8).
const OTP_LENGTH = 8;
const MIN_PASSWORD_LENGTH = 6;

function mapSupabaseError(err: any): string {
  const msg = (err?.message || '').toLowerCase();
  const code = (err?.code || err?.error_code || '').toLowerCase();
  if (code.includes('invalid_credentials') || msg.includes('invalid login credentials')) return 'Invalid email or password';
  if (code.includes('user_already_exists') || msg.includes('already registered') || msg.includes('already exists')) return 'An account with this email already exists';
  if (code.includes('weak_password') || msg.includes('weak password')) return 'Password is too weak. Choose a stronger password.';
  if (code.includes('email_not_confirmed') || msg.includes('email not confirmed')) return 'Please verify your email first';
  if (code.includes('too_many_requests') || msg.includes('too many requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (code.includes('otp_expired') || msg.includes('expired')) return 'That code has expired. Request a new one.';
  if (code.includes('otp_disabled') || msg.includes('token has invalid') || msg.includes('invalid token')) return 'That code is not valid. Check it and try again.';
  if (code.includes('same_password') || msg.includes('should be different')) return 'Your new password must be different from your old one.';
  if (msg.includes('over_email_send_rate') || code.includes('over_email_send_rate')) return 'Too many emails sent. Please wait a minute and try again.';
  if (msg.includes('invalid email') || code.includes('validation_failed')) return 'Invalid email address';
  return err?.message || 'Authentication failed';
}

function Panel({ title, subtitle, onBack, children }: {
  title: string; subtitle?: React.ReactNode; onBack?: () => void; children: React.ReactNode;
}) {
  return (
    <main className="auth">
      <div className="auth__panel">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Back"><Icon name="back" /></button>
        ) : (
          <MatchrLogo size={48} />
        )}
        <h1 className="auth__title">{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
      </div>
    </main>
  );
}

function Submit({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button className="btn btn--primary btn--block" type="submit" disabled={loading}>
      {loading ? <Spinner small /> : label}
    </button>
  );
}

/** Runs a form action with loading and error state. */
function useAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(mapSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };
  return { loading, error, setError, run };
}

function EmailAuthForm({ mode, onBack, onVerifyEmail, onForgotPassword }: {
  mode: 'email_login' | 'email_signup';
  onBack: () => void;
  onVerifyEmail: (email: string) => void;
  onForgotPassword: (email: string) => void;
}) {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { loading, error, setError, run } = useAction();
  const isSignup = mode === 'email_signup';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return setError('Please fill in all fields');
    if (isSignup && password !== confirm) return setError('Passwords do not match');
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    run(async () => {
      if (isSignup) {
        await signUpWithEmail(email.trim(), password);
        onVerifyEmail(email.trim());
      } else {
        // onAuthStateChange takes it from here.
        await signInWithEmail(email.trim(), password);
      }
    });
  };

  return (
    <Panel
      title={isSignup ? 'Create\naccount' : 'Welcome\nback'}
      subtitle={isSignup ? 'Enter your email and password to get started' : 'Sign in with your email and password'}
      onBack={onBack}
    >
      <form className="stack" onSubmit={submit} noValidate>
        {error && <div className="alert" role="alert">{error}</div>}
        <label className="field"><span>Email</span>
          <input className="input" type="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>
        <label className="field"><span>Password</span>
          <input className="input" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {isSignup ? (
          <label className="field"><span>Confirm password</span>
            <input className="input" type="password" autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>
        ) : (
          <button type="button" className="btn btn--ghost btn--sm" style={{ alignSelf: 'flex-end' }} onClick={() => onForgotPassword(email)}>
            Forgot password?
          </button>
        )}
        <Submit loading={loading} label={isSignup ? 'Create Account' : 'Sign In'} />
      </form>
    </Panel>
  );
}

function OtpForm({ email, purpose, onBack, onVerified }: {
  email: string; purpose: 'signup' | 'recovery'; onBack: () => void; onVerified?: () => void;
}) {
  const { verifyOtpCode, resendOtp, verifyPasswordResetCode, resetPassword } = useAuth();
  const isRecovery = purpose === 'recovery';
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);
  const { loading, error, setError, run } = useAction();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return setError(`Please enter the full ${OTP_LENGTH}-digit code`);
    run(async () => {
      if (isRecovery) {
        await verifyPasswordResetCode(email, otp);
        onVerified?.();
      } else {
        await verifyOtpCode(email, otp);
      }
    });
  };

  const resend = async () => {
    setResending(true);
    setError('');
    try {
      // Recovery codes have no resend endpoint; re-requesting the reset issues a fresh one.
      if (isRecovery) await resetPassword(email);
      else await resendOtp(email);
      setOtp('');
      setCountdown(60);
    } catch (err) {
      setError(mapSupabaseError(err));
    } finally {
      setResending(false);
    }
  };

  const masked = email.replace(/^(.)(.*)(@.*)$/, (_, first, _m, domain) => `${first}***${domain}`);

  return (
    <Panel
      title={isRecovery ? 'Enter reset\ncode' : 'Verify your\nemail'}
      subtitle={<>We sent a {OTP_LENGTH}-digit code to <b style={{ color: 'var(--text)' }}>{masked}</b></>}
      onBack={onBack}
    >
      <form className="stack" onSubmit={submit} noValidate>
        {error && <div className="alert" role="alert">{error}</div>}
        <input
          className="input otp-input" inputMode="numeric" autoComplete="one-time-code" aria-label="Code"
          placeholder={'0'.repeat(OTP_LENGTH)} maxLength={OTP_LENGTH} autoFocus
          value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
        />
        <Submit loading={loading} label={isRecovery ? 'Continue' : 'Verify Email'} />
        <button type="button" className="btn btn--ghost" onClick={resend} disabled={countdown > 0 || resending}>
          {resending ? <Spinner small /> : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
        </button>
      </form>
    </Panel>
  );
}

function ForgotPasswordForm({ initialEmail, onBack, onSent }: {
  initialEmail: string; onBack: () => void; onSent: (email: string) => void;
}) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const { loading, error, setError, run } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email address');
    run(async () => {
      await resetPassword(email.trim());
      onSent(email.trim());
    });
  };
  return (
    <Panel title={'Forgot\npassword?'} subtitle="Enter your email and we'll send you a code to reset your password." onBack={onBack}>
      <form className="stack" onSubmit={submit} noValidate>
        {error && <div className="alert" role="alert">{error}</div>}
        <label className="field"><span>Email</span>
          <input className="input" type="email" autoComplete="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        </label>
        <Submit loading={loading} label="Send Code" />
      </form>
    </Panel>
  );
}

function NewPasswordForm({ onDone }: { onDone: () => void }) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { loading, error, setError, run } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return setError('Please enter a new password');
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    if (password !== confirm) return setError('Passwords do not match');
    run(async () => {
      await updatePassword(password);
      // The recovery session is already valid; leaving recovery mode lets the guard take them in.
      onDone();
    });
  };
  return (
    <Panel title={'New\npassword'} subtitle="Choose a new password for your account.">
      <form className="stack" onSubmit={submit} noValidate>
        {error && <div className="alert" role="alert">{error}</div>}
        <label className="field"><span>New password</span>
          <input className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        <label className="field"><span>Confirm password</span>
          <input className="input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        <Submit loading={loading} label="Update Password" />
      </form>
    </Panel>
  );
}

function AuthPage({ mode, onSwitchMode }: { mode: 'login' | 'signup'; onSwitchMode: (m: AuthMode) => void }) {
  const { signInWithGoogle, signInWithApple, signInWithLinkedIn } = useAuth();
  // One sign-in at a time: two OAuth redirects racing can leave the wrong session.
  const [pending, setPending] = useState<string | null>(null);
  const pendingRef = useRef<string | null>(null);
  const [error, setError] = useState('');
  const isLogin = mode === 'login';

  const runSignIn = async (provider: string, signIn: () => Promise<unknown>) => {
    if (pendingRef.current) return;
    pendingRef.current = provider;
    setPending(provider);
    setError('');
    try {
      // On success the browser leaves for the provider, so pending stays set.
      await signIn();
    } catch (err: any) {
      setError(err?.message || `${provider} sign-in failed`);
      pendingRef.current = null;
      setPending(null);
    }
  };

  return (
    <Panel title={isLogin ? 'Login' : 'Sign Up'} subtitle={isLogin ? "It's easier to login now" : "It's easier to sign up now"}>
      {error && <div className="alert" role="alert">{error}</div>}
      <button className="btn btn--primary btn--block" disabled={pending !== null} onClick={() => runSignIn('Google', signInWithGoogle)}>
        {pending === 'Google' ? <Spinner small /> : 'Continue with Google'}
      </button>
      <button className="btn btn--light btn--block" disabled={pending !== null} onClick={() => onSwitchMode(isLogin ? 'email_login' : 'email_signup')}>
        I&apos;ll use email instead
      </button>
      <div className="auth__social">
        <button className="icon-btn" aria-label="Continue with LinkedIn" disabled={pending !== null} onClick={() => runSignIn('LinkedIn', signInWithLinkedIn)}>
          {pending === 'LinkedIn' ? <Spinner small /> : <b>in</b>}
        </button>
        <button className="icon-btn" aria-label="Continue with Apple" disabled={pending !== null} onClick={() => runSignIn('Apple', signInWithApple)}>
          {pending === 'Apple' ? <Spinner small /> : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M16.37 12.6c-.03-2.7 2.2-4 2.3-4.07-1.26-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.98-4.08.98-.85 0-2.14-.96-3.52-.93-1.81.03-3.48 1.05-4.41 2.67-1.88 3.26-.48 8.08 1.35 10.73.9 1.3 1.96 2.75 3.36 2.7 1.35-.05 1.86-.87 3.49-.87 1.63 0 2.09.87 3.51.84 1.45-.03 2.37-1.32 3.26-2.62 1.03-1.5 1.45-2.96 1.47-3.04-.03-.01-2.82-1.08-2.85-4.29zM13.7 4.67c.74-.9 1.24-2.15 1.11-3.39-1.07.04-2.36.71-3.13 1.61-.68.79-1.28 2.06-1.12 3.27 1.19.09 2.4-.6 3.14-1.49z" />
            </svg>
          )}
        </button>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>
        {isLogin ? "Don't have an account? " : 'Already have an account? '}
        <button className="btn btn--ghost btn--sm accent" style={{ padding: 0, minHeight: 0 }} onClick={() => onSwitchMode(isLogin ? 'signup' : 'login')}>
          {isLogin ? 'Sign up' : 'Login'}
        </button>
      </p>
    </Panel>
  );
}

export default function LoginPage() {
  const { beginPasswordRecovery, endPasswordRecovery } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // Leaving the reset flow must always release the guard, or the user is
  // stranded here with a live session.
  const leaveRecovery = (next: AuthMode) => {
    endPasswordRecovery();
    setMode(next);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => endPasswordRecovery, []);

  if (mode === 'verify_email') return <OtpForm email={pendingEmail} purpose="signup" onBack={() => setMode('email_signup')} />;
  if (mode === 'forgot_password') {
    return (
      <ForgotPasswordForm
        initialEmail={pendingEmail}
        onBack={() => setMode('email_login')}
        onSent={(sent) => {
          setResetEmail(sent);
          // Guard before the code is verified: verifying creates the session.
          beginPasswordRecovery();
          setMode('reset_code');
        }}
      />
    );
  }
  if (mode === 'reset_code') {
    return <OtpForm email={resetEmail} purpose="recovery" onBack={() => leaveRecovery('forgot_password')} onVerified={() => setMode('reset_password')} />;
  }
  if (mode === 'reset_password') return <NewPasswordForm onDone={() => leaveRecovery('login')} />;
  if (mode === 'email_login' || mode === 'email_signup') {
    return (
      <EmailAuthForm
        mode={mode}
        onBack={() => setMode(mode === 'email_login' ? 'login' : 'signup')}
        onVerifyEmail={(email) => { setPendingEmail(email); setMode('verify_email'); }}
        onForgotPassword={(email) => { setPendingEmail(email); setMode('forgot_password'); }}
      />
    );
  }
  return <AuthPage mode={mode} onSwitchMode={setMode} />;
}
