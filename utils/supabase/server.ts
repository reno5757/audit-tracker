// utils/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies(); // ✅ always defined on the server

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Next 15: cookieStore.set(name, value, options as CookieOptions)
            cookieStore.set(name, value, options as CookieOptions);
          });
        },
      },
    }
  );
}
