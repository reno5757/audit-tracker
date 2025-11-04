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

  // ---- Real-time checks (same rules as previous page) ----
  const pwChecks = {
    len: newPassword.length >= 8,
    lower: /[a-z]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    match: confirm.length > 0 && newPassword === confirm,
  };

  const canSubmit =
    !!email &&
    currentPassword.length > 0 &&
    pwChecks.len &&
    pwChecks.lower &&
    pwChecks.upper &&
    pwChecks.digit &&
    pwChecks.match &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Utilisateur non enregistré.');
      return;
    }
    if (!pwChecks.match) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!(pwChecks.len && pwChecks.lower && pwChecks.upper && pwChecks.digit)) {
      setError(
        'Le mot de passe doit contenir au moins 8 caractères, dont une lettre minuscule, une majuscule et un chiffre.'
      );
      return;
    }

    setLoading(true);
    try {
      // Re-vérifier le mot de passe actuel (ré-authentification)
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyErr) {
        setError('Mot de passe actuel incorrect.');
        setLoading(false);
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updErr) {
        setError(updErr.message);
        setLoading(false);
        return;
      }

      // Déconnexion globale (tous les appareils)
      await supabase.auth.signOut({ scope: 'global' });

      // Nettoyage éventuel du stockage local
      try {
        localStorage.removeItem('supabase.auth.token');
      } catch {}

      // Redirection vers login avec indicateur de succès
      router.replace('/login?pwUpdated=1');
    } catch (err: any) {
      setError(err?.message ?? 'Erreur inattendue.');
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
        <h1 className="mb-1 text-center text-xl font-semibold">Modifier le mot de passe</h1>
        {email && (
          <p className="mb-4 text-center text-sm text-slate-500">
            Connecté sous <span className="font-medium text-slate-700">{email}</span>
          </p>
        )}

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Mot de passe actuel
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
          Nouveau mot de passe
        </label>
        <input
          type={showPw ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mb-2 w-full rounded border p-2"
          required
          autoComplete="new-password"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">
          Confirmer le nouveau mot de passe
        </label>
        <input
          type={showPw ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mb-3 w-full rounded border p-2"
          required
          autoComplete="new-password"
        />

        {/* Checklist temps réel */}
        <div className="mb-3 text-xs text-slate-600">
          <ul className="list-disc pl-5 space-y-1">
            <li className={pwChecks.len ? 'text-green-600' : ''}>Au moins 8 caractères</li>
            <li className={pwChecks.lower ? 'text-green-600' : ''}>Au moins une lettre minuscule</li>
            <li className={pwChecks.upper ? 'text-green-600' : ''}>Au moins une lettre majuscule</li>
            <li className={pwChecks.digit ? 'text-green-600' : ''}>Au moins un chiffre</li>
            <li className={pwChecks.match ? 'text-green-600' : ''}>Les mots de passe correspondent</li>
          </ul>
        </div>

        <label className="mb-4 flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPw}
            onChange={(e) => setShowPw(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Afficher les mots de passe
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded bg-blue-600 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
        </button>

        <div className="mt-4 text-center">
          <a href="/" className="text-sm text-slate-600 hover:underline">
            ← Retour
          </a>
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Le mot de passe doit contenir au moins 8 caractères, dont une lettre minuscule, une majuscule et un chiffre.
        </p>
      </form>
    </div>
  );
}
