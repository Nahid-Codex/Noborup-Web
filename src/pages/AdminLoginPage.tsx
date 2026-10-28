import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Lock,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BOOTSTRAPPED_ADMIN_EMAIL } from '../firebase/config';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, publicProfile, signInWithGoogle, loginWithEmail, logout } = useAuth();

  const [email, setEmail] = useState(BOOTSTRAPPED_ADMIN_EMAIL);
  const [password, setPassword] = useState('Noborup@2026');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (user && isAdmin) {
    const adminPhoto = publicProfile?.photoURL || user.photoURL || '';
    return (
      <div className="min-h-[80vh] bg-[#F7F7F5] dark:bg-[#111312] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200 dark:border-stone-800 p-8 text-center">
          {adminPhoto ? (
            <img
              src={adminPhoto}
              alt={publicProfile?.displayName || user.displayName || 'Admin'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FF8618] mx-auto mb-4"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-1">
            Admin Access Verified
          </h1>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            {publicProfile?.displayName || user.displayName || 'Nahid Hasan'}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mb-6">
            {user.email}
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="w-full py-3 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-sm transition"
          >
            Enter Noborup Admin Dashboard →
          </button>
        </div>
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="min-h-[80vh] bg-[#F7F7F5] dark:bg-[#111312] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-[#1B1D1C] rounded-2xl border border-red-500/30 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
            Administrator Privilege Required
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
            Your current account (<span className="font-mono">{user.email}</span>) does not have
            administrator permissions in Firestore (<code className="font-mono">/admins/&#123;uid&#125;</code>).
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={logout}
              className="w-full py-2.5 rounded-xl bg-stone-900 dark:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out & Switch to Admin Account
            </button>
            <Link
              to="/account"
              className="w-full py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 text-xs font-medium text-stone-600 dark:text-stone-400"
            >
              Go to Customer Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/admin');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/admin');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#111312] text-stone-900 dark:text-stone-100 flex items-center justify-center py-12 px-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#1B1D1C] rounded-2xl border border-stone-200/80 dark:border-stone-800 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-[#FF8618]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Storefront
          </Link>
          <span className="text-[#FF8618] font-mono text-[11px] font-semibold">
            ADMINISTRATION
          </span>
        </div>

        <h1 className="font-display text-2xl font-bold text-stone-900 dark:text-white mb-1">
          Noborup Admin Console
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
          Sign in with Google or use your Admin ID (<span className="font-mono text-stone-800 dark:text-stone-200">{BOOTSTRAPPED_ADMIN_EMAIL}</span>) and Password (<span className="font-mono text-stone-800 dark:text-stone-200">Noborup@2026</span>).
        </p>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleAdminGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-[#FF8618] hover:bg-[#e6750f] text-white font-semibold text-xs flex items-center justify-center gap-2 transition mb-5"
        >
          <ShieldCheck className="w-4 h-4" />
          Sign In with Authorized Google Admin Account
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
          <span className="bg-white dark:bg-[#1B1D1C] px-3 text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
            Or Admin Credentials
          </span>
          <div className="border-t border-stone-200 dark:border-stone-800 w-full" />
        </div>

        <form onSubmit={handleAdminEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={BOOTSTRAPPED_ADMIN_EMAIL}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#FF8618]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white focus:outline-none focus:border-[#FF8618]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-900 dark:bg-stone-800 hover:bg-stone-800 dark:hover:bg-stone-700 text-white font-semibold text-xs transition"
          >
            {loading ? 'Verifying Admin Role...' : 'Sign In with Email & Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
