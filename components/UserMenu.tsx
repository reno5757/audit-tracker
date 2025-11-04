"use client";

import { KeyRound, LogOut, ShieldCheck, User2, ChevronDown } from "lucide-react";

type Props = {
  email?: string | null;
  isAdmin?: boolean;
};

export default function UserMenu({ email, isAdmin }: Props) {
  if (!email) return null;

  return (
    <details className="relative">
      <summary className="flex cursor-pointer select-none items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
        <User2 className="h-4 w-4" />
        <span className="max-w-[14rem] truncate">{email}</span>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </span>
        )}
        <ChevronDown className="h-4 w-4 opacity-70" />
      </summary>

      <div
        className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border bg-white shadow-lg"
        onClick={(e) => {
          // close the <details> when an item is clicked
          const el = (e.currentTarget.parentElement as HTMLDetailsElement) || null;
          if (el) el.open = false;
        }}
      >
        <div className="px-3 py-2 text-xs text-slate-500">
          Connecté :  <span className="font-medium text-slate-700">{email}</span>
        </div>
        <div className="h-px bg-slate-100" />

        <a
          href="/account/change-password"
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <KeyRound className="h-4 w-4" />
          Modifier mot de passe
        </a>

        <a
          href="/logout"
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </a>
      </div>
    </details>
  );
}
