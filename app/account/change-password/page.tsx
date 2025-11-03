'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace('/login?redirectedFrom=/account/change-password');
        return;
      }
      setEmail(data.user.email ?? null);
    })();
  }, [router, supabase]);

  const validatePassword = (pw: string) => {
    const longEnough = pw.length >= 8;
    const hasLower = /[a-z]/.test(pw);
    const hasUpper = /[A-Z]/.test(pw);
    const hasDigit = /\d/.test(pw);
    return longEnough && hasLower && hasUpper && hasDigit;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('No logged-in user.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (!validatePassword(newPassword)) {
      setError(
        'Password must be at least 8 characters and include lowercase, uppercase, and a digit.'
      );
      return;
    }

    setLoading(true);
    try {
      // Re-verify the current password (re-auth)
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyErr) {
        setError('Current password is incorrect.');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updErr) {
        setError(updErr.message);
        setLoading(false);
        return;
      }

      // Force re-login on all devices (global sign out)
      await supabase.auth.signOut({ scope: 'global' });

      // also clear localStorage/sessionStorage in case a custom key is used
      localStorage.removeItem('supabase.auth.token');

      // Redirect to login with flag for a success message
      router.replace('/login?pwUpdated=1');
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
      >
        <h1 className="mb-1 text-center text-xl font-semibold">Change password</h1>
        {email && (
          <p className="mb-4 text-center text-sm text-slate-500">
            Signed in as <span className="font-medium text-slate-700">{email}</span>
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Current password
        </label>
        <input
          type={showPw ? 'text' : 'password'}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mb-3 w-full rounded border p-2"
          required
          autoComplete="current-password"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          New password
        </label>
        <input
          type={showPw ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-3 w-full rounded border p-2"
          required
          autoComplete="new-password"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Confirm new password
        </label>
        <input
          type={showPw ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-4 w-full rounded border p-2"
          required
          autoComplete="new-password"
        />

        <label className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPw}
            onChange={(e) => setShowPw(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show passwords
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-slate-600 hover:underline">
            ← Back to dashboard
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Password must be at least 8 characters and include lowercase, uppercase, and a number.
        </p>
      </form>
    </div>
  );
}
