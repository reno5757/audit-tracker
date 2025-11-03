import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type Overrides = {
  storage?: Storage;
  flowType?: "pkce" | "implicit";
};

// TypeScript doesn't expose `storage` on the SSR helper's type,
// so we cast that bit. It's valid at runtime.
export const createClient = (overrides: Overrides = {}) =>
  createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      flowType: overrides.flowType ?? "implicit", // 
      persistSession: true,
      autoRefreshToken: true,
      ...(overrides.storage ? ({ storage: overrides.storage } as any) : {}),
    },
  });
