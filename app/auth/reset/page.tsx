'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const ranRef = useRef(false);

  const [email, setEmail] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // separate errors:
  const [fatalError, setFatalError] = useState<string | null>(null); // link/parse/ token missing -> no form
  const [formError, setFormError] = useState<string | null>(null);   // validation/update -> keep form visible

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // after first successful verifyOtp, we keep a session and won't verify again
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    try {
      const href = window.location.href;
      const url = new URL(href);
      const type = url.searchParams.get('type');
      const th = url.searchParams.get('token_hash') || url.searchParams.get('token');
      const presetEmail = url.searchParams.get('email');
      if (presetEmail) setEmail(presetEmail);

      if (type !== 'recovery' || !th) {
        setFatalError('This reset link is invalid or has expired.');
        setLoading(false);
        return;
      }

      setTokenHash(th);
      setReady(true);
      setLoading(false);
    } catch (e: any) {
      setFatalError(e?.message ?? 'Unable to parse the reset link.');
      setLoading(false);
    }
  }, []);

  const isPwValid = (pw: string) =>
    pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email) return setFormError('Please enter the email that received the reset link.');
    if (newPw !== confirm) return setFormError('New passwords do not match.');
    if (!isPwValid(newPw))
      return setFormError('Password must be at least 8 characters and include lowercase, uppercase, and a digit.');
    if (!tokenHash && !sessionReady)
      return setFormError('Missing reset token. Please restart the reset process.');

    setSubmitting(true);
    try {
      // Verify the OTP exactly once, then reuse the session for retries
      if (!sessionReady) {
        const { error: vErr } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash as string,
          //email,
        });
        if (vErr) {
          setSubmitting(false);
          return setFormError(vErr.message || 'Unable to verify the reset token.');
        }
        setSessionReady(true);
      }

      const { error: updErr } = await supabase.auth.updateUser({ password: newPw });
      if (updErr) {
        setSubmitting(false);
        return setFormError(updErr.message);
      }

      await supabase.auth.signOut({ scope: 'global' });
      router.replace('/login?pwUpdated=1');
    } catch (e: any) {
      setFormError(e?.message ?? 'Unexpected error while updating your password.');
      setSubmitting(false);
    }
  };

  // Optional: live checklist for UX (keeps button disabled until valid)
  const pwChecks = {
    len: newPw.length >= 8,
    lower: /[a-z]/.test(newPw),
    upper: /[A-Z]/.test(newPw),
    digit: /\d/.test(newPw),
    match: confirm.length > 0 && newPw === confirm,
  };
  const canSubmit = !submitting && email && pwChecks.len && pwChecks.lower && pwChecks.upper && pwChecks.digit && pwChecks.match;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow">
        <h1 className="mb-1 text-center text-xl font-semibold">Set a new password</h1>

        {loading && <p className="mt-4 text-center text-sm text-slate-600">Validating your link…</p>}

        {!loading && fatalError && (
          <>
            <p className="mt-4 text-center text-sm text-red-600">{fatalError}</p>
            <pre className="mt-3 overflow-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
              {typeof window !== 'undefined' ? window.location.href : ''}
            </pre>
          </>
        )}

        {!loading && !fatalError && ready && (
          <form onSubmit={handleSubmit} className="mt-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 w-full rounded border p-2"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="mb-2 w-full rounded border p-2"
              required
              autoComplete="new-password"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mb-2 w-full rounded border p-2"
              required
              autoComplete="new-password"
            />

            <div className="mb-3 text-xs text-slate-600">
              <ul className="list-disc pl-5 space-y-1">
                <li className={pwChecks.len ? 'text-green-600' : ''}>At least 8 characters</li>
                <li className={pwChecks.lower ? 'text-green-600' : ''}>At least one lowercase letter</li>
                <li className={pwChecks.upper ? 'text-green-600' : ''}>At least one uppercase letter</li>
                <li className={pwChecks.digit ? 'text-green-600' : ''}>At least one digit</li>
                <li className={pwChecks.match ? 'text-green-600' : ''}>Passwords match</li>
              </ul>
            </div>

            <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPw}
                onChange={(e) => setShowPw(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Show passwords
            </label>

            {formError && (
              <p className="mb-3 text-sm text-red-600">{formError}</p>
            )}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Clear error"
              >
                Clear
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
