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

  // erreurs distinctes :
  const [fatalError, setFatalError] = useState<string | null>(null); // lien/parse/jeton manquant -> pas de formulaire
  const [formError, setFormError] = useState<string | null>(null);   // validation/màj -> formulaire visible

  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // après un verifyOtp réussi, on garde la session et on ne revérifie pas
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
        setFatalError('Ce lien de réinitialisation est invalide ou a expiré.');
        setLoading(false);
        return;
      }

      setTokenHash(th);
      setReady(true);
      setLoading(false);
    } catch (e: any) {
      setFatalError(e?.message ?? 'Impossible d’analyser le lien de réinitialisation.');
      setLoading(false);
    }
  }, []);

  const isPwValid = (pw: string) =>
    pw.length >= 8 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email) return setFormError('Veuillez saisir l’adresse e-mail qui a reçu le lien de réinitialisation.');
    if (newPw !== confirm) return setFormError('Les nouveaux mots de passe ne correspondent pas.');
    if (!isPwValid(newPw))
      return setFormError('Le mot de passe doit contenir au moins 8 caractères, dont une lettre minuscule, une majuscule et un chiffre.');
    if (!tokenHash && !sessionReady)
      return setFormError('Jeton de réinitialisation manquant. Veuillez recommencer la procédure.');

    setSubmitting(true);
    try {
      // Vérifier l’OTP une seule fois, puis réutiliser la session pour les nouveaux essais
      if (!sessionReady) {
        const { error: vErr } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash: tokenHash as string,
          //email,
        });
        if (vErr) {
          setSubmitting(false);
          return setFormError(vErr.message || 'Impossible de vérifier le jeton de réinitialisation.');
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
      setFormError(e?.message ?? 'Erreur inattendue lors de la mise à jour de votre mot de passe.');
      setSubmitting(false);
    }
  };

  // Optionnel : checklist en direct pour l’UX (désactive le bouton tant que non valide)
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
        <h1 className="mb-1 text-center text-xl font-semibold">Définir un nouveau mot de passe</h1>

        {loading && <p className="mt-4 text-center text-sm text-slate-600">Validation de votre lien…</p>}

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
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 w-full rounded border p-2"
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="mb-2 w-full rounded border p-2"
              required
              autoComplete="new-password"
            />

            <label className="mb-1 block text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</label>
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
                <li className={pwChecks.len ? 'text-green-600' : ''}>Au moins 8 caractères</li>
                <li className={pwChecks.lower ? 'text-green-600' : ''}>Au moins une lettre minuscule</li>
                <li className={pwChecks.upper ? 'text-green-600' : ''}>Au moins une lettre majuscule</li>
                <li className={pwChecks.digit ? 'text-green-600' : ''}>Au moins un chiffre</li>
                <li className={pwChecks.match ? 'text-green-600' : ''}>Les mots de passe correspondent</li>
              </ul>
            </div>

            <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showPw}
                onChange={(e) => setShowPw(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Afficher les mots de passe
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
                {submitting ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
              </button>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="rounded border px-3 py-2 text-sm"
                aria-label="Effacer l’erreur"
              >
                Effacer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
