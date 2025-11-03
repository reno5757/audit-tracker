'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // forgot password modal
  const [fpOpen, setFpOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState('');
  const [fpMsg, setFpMsg] = useState<string | null>(null);
  const [fpErr, setFpErr] = useState<string | null>(null);
  const [fpLoading, setFpLoading] = useState(false);

  const pwUpdated = searchParams.get('pwUpdated') === '1';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Choose persistence based on “Remember me”
      const auth = createClient({
        storage: remember ? localStorage : sessionStorage,
      });

      const { error } = await auth.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      const redirectedFrom = searchParams.get('redirectedFrom');
      const dest =
        redirectedFrom && !redirectedFrom.startsWith('/auth')
          ? redirectedFrom
          : '/';
      router.push(dest);
    } catch (err: any) {
      setError(err?.message ?? 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpErr(null);
    setFpMsg(null);
    setFpLoading(true);

    try {
      const origin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL!;

      // Use persistent storage so the emailed link can establish a session
      const auth = createClient({ storage: localStorage });

      const { error } = await auth.auth.resetPasswordForEmail(fpEmail.trim(), {
        redirectTo: `${origin}/auth/reset`,
      });

      if (error) setFpErr(error.message);
      else setFpMsg('Check your inbox for the password reset link.');
    } catch (err: any) {
      setFpErr(err?.message ?? 'Unexpected error sending reset email.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <form
        onSubmit={handleLogin}
        className="p-6 bg-white rounded-2xl shadow-md w-80 border border-slate-200"
      >
        <h1 className="text-xl font-semibold mb-4 text-center">Login</h1>

        {pwUpdated && (
          <p className="mb-3 text-sm text-green-600">
            Password updated. Please sign in again.
          </p>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          required
          autoComplete="email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full mb-2 p-2 border rounded"
          required
          autoComplete="current-password"
        />

        <div className="mb-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Remember me
          </label>

          <button
            type="button"
            onClick={() => {
              setFpEmail(email || '');
              setFpErr(null);
              setFpMsg(null);
              setFpOpen(true);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Login'}
        </button>
      </form>

      {/* Forgot password modal */}
      {fpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Reset your password</h2>
              <button
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setFpOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForgotPassword}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-3 w-full rounded border p-2"
                required
                autoComplete="email"
              />

              {fpErr && <p className="mb-2 text-sm text-red-600">{fpErr}</p>}
              {fpMsg && <p className="mb-2 text-sm text-green-600">{fpMsg}</p>}

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFpOpen(false)}
                  className="rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fpLoading}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {fpLoading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>

            <p className="mt-3 text-xs text-slate-500">
              We’ll email a secure link. After clicking it, you’ll be redirected
              here to set a new password.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
