'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      router.push('/'); // redirect to home
    };
    logout();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-600">Signing out...</p>
    </div>
  );
}
