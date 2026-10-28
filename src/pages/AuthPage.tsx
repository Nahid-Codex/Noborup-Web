import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../firebase/config';

type AuthMode = 'login' | 'register' | 'reset';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const explicitRedirect = searchParams.get('redirect');
  const redirectPath = explicitRedirect || '/account';

  const {
    user,
    isAdmin,
    signInWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
  } = useAuth();
  const { showToast } = useStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      if (!explicitRedirect && isAdmin) {
        navigate('/admin');
      } else {
        navigate(redirectPath);
      }
    }
  }, [user, isAdmin, navigate, redirectPath, explicitRedirect]);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        showToast('Signed in successfully!');
        const isLoggingInAdmin =
          email.trim().toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();
        navigate(!explicitRedirect && isLoggingInAdmin ? '/admin' : redirectPath);
      } else if (mode === 'register') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await registerWithEmail(name, email, password);
        showToast('Account created and signed in successfully!');
        navigate(redirectPath);
      } else if (mode === 'reset') {
        await resetPassword(email);
        setSuccessMsg(
          'Password reset complete! You can now sign in with your email and new password.'
        );
        showToast('Password reset successful!');
        setMode('login');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800/80 p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FF8618]/15 border border-[#FF8618]/30 flex items-center justify-center text-[#FF8618] mx-auto mb-3">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
            {mode === 'login' && 'Welcome Back to Noborup'}
            {mode === 'register' && 'Create Customer Account'}
            {mode === 'reset' && 'Reset Your Password'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {mode === 'login' && 'Sign in to track orders, manage your wishlist, and book servicing.'}
            {mode === 'register' && 'Join Noborup for verified orders and fast checkout across Bangladesh.'}
            {mode === 'reset' && 'Enter your email address to reset your account password.'}
          </p>
        </div>

        {/* Mode Switcher */}
        {mode !== 'reset' && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-stone-900 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#1B1D1C] text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#1B1D1C] text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              Create Account
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Instant Verified Google Sign-In */}
        {mode !== 'reset' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:border-[#FF8618] bg-stone-50 dark:bg-stone-900/70 text-stone-900 dark:text-stone-100 font-semibold text-xs flex items-center justify-center gap-2.5 transition mb-5"
            >
              <ShieldCheck className="w-4 h-4 text-[#FF8618]" />
              Continue with Google (Instant Verified Access)
            </button>

            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
              <span className="bg-white dark:bg-[#1B1D1C] px-3 text-[11px] uppercase tracking-wider text-stone-400">
                Or with Email
              </span>
              <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs text-[#FF8618] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#FF8618]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-5 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            {mode === 'login' && (loading ? 'Signing In...' : 'Sign In')}
            {mode === 'register' && (loading ? 'Creating Account...' : 'Create Account')}
            {mode === 'reset' && (loading ? 'Resetting Password...' : 'Reset Password')}
            <ArrowRight className="w-4 h-4" />
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 mt-2"
            >
              ← Back to Sign In
            </button>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
          <Link to="/" className="hover:text-[#FF8618]">
            ← Return to Storefront
          </Link>
          <Link to="/admin-login" className="inline-flex items-center gap-1 font-medium text-[#FF8618] hover:underline">
            <KeyRound className="w-3.5 h-3.5" />
            Admin Portal
          </Link>
        </div>
      </div>
    </div>
  );
};
