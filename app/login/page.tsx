'use client';

import { Suspense, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Modale “mot de passe oublié”
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
      // Persistance selon “Se souvenir de moi”
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
      setError(err?.message ?? 'Erreur inattendue.');
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

      // Stockage persistant pour que le lien reçu puisse établir une session
      const auth = createClient({ storage: localStorage });

      const { error } = await auth.auth.resetPasswordForEmail(fpEmail.trim(), {
        redirectTo: `${origin}/auth/reset`,
      });

      if (error) setFpErr(error.message);
      else setFpMsg('Vérifiez votre boîte de réception pour le lien de réinitialisation du mot de passe.');
    } catch (err: any) {
      setFpErr(err?.message ?? 'Erreur inattendue lors de l’envoi de l’e-mail.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-md"
      >
        {/* Logo + nom de la société */}
        <div className="mb-4 flex flex-col items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={128}
            height={128}
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-md ring-1 ring-slate-200"
            priority
          />
          <span className="text-sm font-semibold text-slate-900">RFagnoni Consultant</span>
        </div>

        <h1 className="mb-3 text-center text-xl font-semibold">Connexion</h1>

        {pwUpdated && (
          <p className="mb-3 text-sm text-green-600">
            Mot de passe mis à jour. Veuillez vous reconnecter.
          </p>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full mb-3 p-2 border rounded"
          required
          autoComplete="email"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
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
            Se souvenir de moi
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
            Mot de passe oublié ?
          </button>
        </div>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {/* Modale “Mot de passe oublié” */}
      {fpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Réinitialiser votre mot de passe</h2>
              <button
                className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"
                onClick={() => setFpOpen(false)}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleForgotPassword}>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                type="email"
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                placeholder="vous@exemple.com"
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
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={fpLoading}
                  className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {fpLoading ? 'Envoi…' : 'Envoyer le lien'}
                </button>
              </div>
            </form>

            <p className="mt-3 text-xs text-slate-500">
              Nous vous enverrons un lien sécurisé. Après avoir cliqué dessus,
              vous serez redirigé ici pour définir un nouveau mot de passe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  // Wrap the part that uses useSearchParams with Suspense (required by Next)
  return (
    <Suspense fallback={<div className="text-center text-sm text-slate-500">Chargement…</div>}>
      <LoginInner />
    </Suspense>
  );
}
