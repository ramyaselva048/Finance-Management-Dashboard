import React, { useState, useMemo } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Loader2,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { AuthPageMode, AuthUser } from '../types/auth';

interface AuthPagesProps {
  mode: AuthPageMode;
  onChangeMode: (mode: AuthPageMode) => void;
  onLoginSuccess: (user: AuthUser, token: string, expiresAt: number, rememberMe: boolean) => void;
  initialNotice?: string | null;
  initialError?: string | null;
  onClearMessages: () => void;
}

export function evaluatePasswordStrength(password: string) {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  const passedCount = Object.values(checks).filter(Boolean).length;

  let label = 'Too Weak';
  let color = '#dc3545';
  if (passedCount === 5) {
    label = 'Strong';
    color = '#2eb82e';
  } else if (passedCount === 4) {
    label = 'Good';
    color = '#3366ff';
  } else if (passedCount === 3) {
    label = 'Fair';
    color = '#f6b900';
  }

  return { checks, passedCount, label, color, isValid: passedCount === 5 };
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  mode,
  onChangeMode,
  onLoginSuccess,
  initialNotice,
  initialError,
  onClearMessages,
}) => {
  // Shared banners
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(initialNotice || null);
  const [loading, setLoading] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);

  // Forgot / Reset Password State
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [generatedCodePreview, setGeneratedCodePreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Sync external notices/errors when props update
  React.useEffect(() => {
    if (initialError) setErrorMsg(initialError);
  }, [initialError]);

  React.useEffect(() => {
    if (initialNotice) setSuccessMsg(initialNotice);
  }, [initialNotice]);

  const switchMode = (target: AuthPageMode) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    onClearMessages();
    if (target === 'forgot-password') {
      setForgotStep('request');
      setGeneratedCodePreview(null);
    }
    onChangeMode(target);
  };

  const regStrength = useMemo(() => evaluatePasswordStrength(regPassword), [regPassword]);
  const resetStrength = useMemo(() => evaluatePasswordStrength(newPassword), [newPassword]);

  // --- 1. HANDLE LOGIN ---
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = loginEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          password: loginPassword,
          rememberMe,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user, data.token, data.expiresAt, rememberMe);
    } catch {
      setErrorMsg('Network error while connecting to authentication server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. HANDLE REGISTER ---
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regFullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (at least 2 characters).');
      return;
    }
    const trimmedEmail = regEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!regStrength.isValid) {
      setErrorMsg(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          email: trimmedEmail,
          password: regPassword,
          confirmPassword: regConfirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Registration failed. Please check your inputs.');
        setLoading(false);
        return;
      }

      // Redirect to Login page with pre-filled email and clear success notification
      setLoginEmail(trimmedEmail);
      setLoginPassword('');
      setRegFullName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      onChangeMode('login');
      setSuccessMsg(
        data.message || 'Registration successful! Please sign in with your new account.'
      );
    } catch {
      setErrorMsg('Network error during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- 3. HANDLE FORGOT PASSWORD (STEP 1: REQUEST CODE) ---
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = forgotEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Could not process password reset request.');
        setLoading(false);
        return;
      }

      setGeneratedCodePreview(data.resetCode);
      setResetCode(data.resetCode || '');
      setForgotStep('reset');
      setSuccessMsg(
        `Verification code generated for ${trimmedEmail}. Enter your new password below to complete the reset.`
      );
    } catch {
      setErrorMsg('Network error while requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  // --- 4. HANDLE FORGOT PASSWORD (STEP 2: RESET PASSWORD) ---
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!resetCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (!resetStrength.isValid) {
      setErrorMsg(
        'New password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      );
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          resetCode: resetCode.trim(),
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to reset password.');
        setLoading(false);
        return;
      }

      // Redirect to Login with updated email and success notice
      setLoginEmail(forgotEmail.trim().toLowerCase());
      setLoginPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setResetCode('');
      setGeneratedCodePreview(null);
      onChangeMode('login');
      setSuccessMsg(
        data.message || 'Password reset successful! Please sign in with your new password.'
      );
    } catch {
      setErrorMsg('Network error while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[980px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 bg-white border border-[#dce1ec] rounded-[3px] shadow-xs overflow-hidden">
        {/* Left Branding & Financial Telemetry Panel (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-[#edeff5] border-b lg:border-b-0 lg:border-r border-[#dce1ec] p-7 sm:p-9 flex flex-col justify-between">
          <div>
            {/* Azia Logo Lockup */}
            <div className="flex items-center gap-2.5">
              <svg
                width="28"
                height="28"
                viewBox="0 0 26 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="2"
                  y="3"
                  width="22"
                  height="18"
                  rx="2.5"
                  stroke="#3b336a"
                  strokeWidth="2.2"
                  fill="#ffffff"
                />
                <rect x="6.5" y="11" width="2.6" height="6.5" rx="0.8" fill="#5b47fb" />
                <rect x="11.7" y="7.5" width="2.6" height="10" rx="0.8" fill="#5b47fb" />
                <rect x="16.9" y="9.5" width="2.6" height="8" rx="0.8" fill="#5b47fb" />
                <line
                  x1="2"
                  y1="24"
                  x2="24"
                  y2="24"
                  stroke="#3b336a"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-display text-[25px] font-bold tracking-[-0.03em] text-[#5b47fb] leading-none">
                azia
              </span>
            </div>

            <h2 className="font-display text-[21px] font-bold text-[#1c273c] mt-7 leading-snug">
              Finance Performance & Monitoring Platform
            </h2>
            <p className="text-[13px] text-[#596882] mt-2 leading-relaxed">
              Enterprise treasury surveillance, real-time profit margin tracking, liquidity ratios, and automated accounts receivable & payable management.
            </p>

            {/* Preview Metric Cards matching Dashboard Theme */}
            <div className="mt-7 space-y-3">
              <div className="bg-white border border-[#dce1ec] rounded-[2px] p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#7987a1]">
                    TREASURY BALANCE
                  </div>
                  <div className="font-display text-[18px] font-bold text-[#1c273c] tabular-nums mt-0.5">
                    $780,560.00
                  </div>
                </div>
                <div className="w-[46px] h-[28px] bg-[#3366ff] rounded-[3px] flex items-center justify-center">
                  <span className="font-display italic font-bold text-[12.5px] text-white">
                    VISA
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#dce1ec] rounded-[2px] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#7987a1]">
                    GROSS MARGIN
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#6f42c1] tabular-nums mt-0.5">
                    75%
                  </div>
                </div>
                <div className="bg-white border border-[#dce1ec] rounded-[2px] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#7987a1]">
                    NET MARGIN
                  </div>
                  <div className="font-display text-[17px] font-bold text-[#3366ff] tabular-nums mt-0.5">
                    68%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-[#d8deeb] flex items-center justify-between text-[11.5px] text-[#596882]">
            <span className="flex items-center gap-1.5 font-medium text-[#1c273c]">
              <ShieldCheck className="w-4 h-4 text-[#5b47fb]" /> Scrypt + JWT Auth
            </span>
            <span>Protected Financial Portal</span>
          </div>
        </div>

        {/* Right Authentication Form Panel (7 cols on desktop) */}
        <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-center">
          {/* Top Mode Switcher Tabs */}
          <div className="flex items-center gap-6 border-b border-[#e2e7f1] pb-3 mb-6 text-[13px]">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`pb-3 -mb-[13px] border-b-2 font-medium transition-colors ${
                mode === 'login'
                  ? 'border-[#5b47fb] text-[#5b47fb]'
                  : 'border-transparent text-[#7987a1] hover:text-[#1c273c]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`pb-3 -mb-[13px] border-b-2 font-medium transition-colors ${
                mode === 'register'
                  ? 'border-[#5b47fb] text-[#5b47fb]'
                  : 'border-transparent text-[#7987a1] hover:text-[#1c273c]'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => switchMode('forgot-password')}
              className={`pb-3 -mb-[13px] border-b-2 font-medium transition-colors ${
                mode === 'forgot-password'
                  ? 'border-[#5b47fb] text-[#5b47fb]'
                  : 'border-transparent text-[#7987a1] hover:text-[#1c273c]'
              }`}
            >
              Reset Password
            </button>
          </div>

          {/* Error & Success Feedback Alerts */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-[2px] flex items-start gap-2.5 text-[12.5px] text-[#b91c1c]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#dc3545]" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-[2px] flex items-start gap-2.5 text-[12.5px] text-[#15803d]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2eb82e]" />
              <div className="flex-1">{successMsg}</div>
            </div>
          )}

          {/* ==================== 1. LOGIN VIEW ==================== */}
          {mode === 'login' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-[22px] font-bold text-[#1c273c]">
                  Welcome back!
                </h1>
                <p className="text-[13.5px] text-[#596882] mt-1">
                  Please sign in to access your Finance Monitoring Dashboard.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full h-[42px] pl-10 pr-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13.5px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot-password')}
                      className="text-[12px] text-[#3366ff] hover:underline font-normal"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full h-[42px] pl-10 pr-10 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13.5px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7987a1] hover:text-[#1c273c] p-1"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-[#3b4863]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-[2px] border-[#dce1ec] text-[#5b47fb] focus:ring-[#5b47fb]"
                    />
                    Remember me for 30 days
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginEmail('alicia@aziafinance.com');
                      setLoginPassword('Finance@2026');
                      setErrorMsg(null);
                    }}
                    className="text-[11.5px] text-[#5b47fb] hover:underline font-medium"
                  >
                    Fill Demo CFO Credentials
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[42px] mt-2 bg-[#5b47fb] hover:bg-[#4a36e8] disabled:opacity-60 text-white font-display text-[13.5px] font-semibold rounded-[2px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#eef1f7] text-center text-[13px] text-[#596882]">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-[#5b47fb] font-semibold hover:underline"
                >
                  Create an Account
                </button>
              </div>
            </div>
          )}

          {/* ==================== 2. REGISTER VIEW ==================== */}
          {mode === 'register' && (
            <div>
              <div className="mb-5">
                <h1 className="font-display text-[22px] font-bold text-[#1c273c]">
                  Create Finance Account
                </h1>
                <p className="text-[13.5px] text-[#596882] mt-1">
                  Register a new operator profile to manage financial records and reports.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-fullname"
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g., Alicia Christensen"
                      className="w-full h-[40px] pl-10 pr-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13.5px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full h-[40px] pl-10 pr-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13.5px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-password"
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create strong password"
                        className="w-full h-[40px] pl-10 pr-9 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7987a1] hover:text-[#1c273c] p-1"
                      >
                        {showRegPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm"
                      className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-confirm"
                        type={showRegConfirm ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full h-[40px] pl-10 pr-9 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirm(!showRegConfirm)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7987a1] hover:text-[#1c273c] p-1"
                      >
                        {showRegConfirm ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-Time Password Strength Indicator */}
                <div className="p-3 bg-[#f8f9fc] border border-[#e2e7f1] rounded-[2px]">
                  <div className="flex items-center justify-between text-[11.5px] mb-1.5">
                    <span className="font-semibold text-[#3b4863]">Password Strength</span>
                    <span className="font-bold" style={{ color: regStrength.color }}>
                      {regPassword ? regStrength.label : 'Enter password'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 h-[5px] mb-2.5">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className="h-full rounded-xs transition-all duration-200"
                        style={{
                          backgroundColor:
                            regStrength.passedCount >= step ? regStrength.color : '#e2e7f1',
                        }}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-[#596882]">
                    <span className={regStrength.checks.minLength ? 'text-[#2eb82e] font-medium flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> 8+ Characters
                    </span>
                    <span className={regStrength.checks.hasUpper ? 'text-[#2eb82e] font-medium flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Uppercase (A-Z)
                    </span>
                    <span className={regStrength.checks.hasLower ? 'text-[#2eb82e] font-medium flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Lowercase (a-z)
                    </span>
                    <span className={regStrength.checks.hasNumber ? 'text-[#2eb82e] font-medium flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Number (0-9)
                    </span>
                    <span className={regStrength.checks.hasSpecial ? 'text-[#2eb82e] font-medium flex items-center gap-1' : 'flex items-center gap-1'}>
                      <Check className="w-3 h-3" /> Symbol (@#$!)
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[42px] bg-[#5b47fb] hover:bg-[#4a36e8] disabled:opacity-60 text-white font-display text-[13.5px] font-semibold rounded-[2px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-[#eef1f7] text-center text-[13px] text-[#596882]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#5b47fb] font-semibold hover:underline"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}

          {/* ==================== 3. FORGOT / RESET PASSWORD VIEW ==================== */}
          {mode === 'forgot-password' && (
            <div>
              <div className="mb-5">
                <h1 className="font-display text-[22px] font-bold text-[#1c273c]">
                  {forgotStep === 'request' ? 'Forgot Password' : 'Set New Password'}
                </h1>
                <p className="text-[13.5px] text-[#596882] mt-1">
                  {forgotStep === 'request'
                    ? 'Enter your registered email address to receive a password reset verification code.'
                    : 'Verify your 6-digit security code and choose a strong new password.'}
                </p>
              </div>

              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotRequest} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1.5"
                    >
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="forgot-email"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g., alicia@aziafinance.com"
                        className="w-full h-[42px] pl-10 pr-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13.5px] text-[#1c273c] placeholder-[#7987a1] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[42px] bg-[#5b47fb] hover:bg-[#4a36e8] disabled:opacity-60 text-white font-display text-[13.5px] font-semibold rounded-[2px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Verification Code...
                      </>
                    ) : (
                      <>
                        Send Reset Verification Code
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5" noValidate>
                  {generatedCodePreview && (
                    <div className="p-3 bg-[#f5f3ff] border border-[#ddd6fe] rounded-[2px] text-[12px] text-[#4c1d95] flex items-center justify-between">
                      <span>
                        Security Verification Code for <strong>{forgotEmail}</strong>:
                      </span>
                      <span className="font-mono font-bold text-[14px] tracking-widest bg-white px-2.5 py-0.5 border border-[#c4b5fd] rounded">
                        {generatedCodePreview}
                      </span>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="reset-code"
                      className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                    >
                      6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reset-code"
                        type="text"
                        required
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="w-full h-[40px] pl-10 pr-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13.5px] font-mono text-[#1c273c] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New strong password"
                          className="w-full h-[40px] pl-10 pr-9 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7987a1] hover:text-[#1c273c] p-1"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-new-password"
                        className="block text-[11.5px] font-bold uppercase tracking-wider text-[#3b4863] mb-1"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#7987a1] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="confirm-new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full h-[40px] pl-10 pr-3.5 bg-[#f8f9fc] border border-[#dce1ec] rounded-[2px] text-[13px] text-[#1c273c] focus:outline-none focus:border-[#5b47fb] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter for Reset */}
                  <div className="p-2.5 bg-[#f8f9fc] border border-[#e2e7f1] rounded-[2px]">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-[#3b4863]">New Password Strength</span>
                      <span className="font-bold" style={{ color: resetStrength.color }}>
                        {newPassword ? resetStrength.label : 'Enter password'}
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 h-[4px]">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <div
                          key={step}
                          className="h-full rounded-xs transition-all duration-200"
                          style={{
                            backgroundColor:
                              resetStrength.passedCount >= step ? resetStrength.color : '#e2e7f1',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[42px] bg-[#5b47fb] hover:bg-[#4a36e8] disabled:opacity-60 text-white font-display text-[13.5px] font-semibold rounded-[2px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        Reset Password & Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 pt-4 border-t border-[#eef1f7] flex items-center justify-between text-[13px] text-[#596882]">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-[#5b47fb] font-medium hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
                {forgotStep === 'reset' && (
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="text-[#7987a1] hover:text-[#1c273c] text-[12px]"
                  >
                    Change Email
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
