'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { isSupabaseConfigured } from 'shared-lib';

const AuthUI = dynamic(() => import('@/components/Auth').then((m) => m.AuthUI), {
  ssr: false,
  loading: () => <AuthLoading />,
});

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F6] dark:bg-[#0F151D]">
      <div className="w-12 h-12 border-4 border-[#FF7448] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // Demo mode (no Supabase keys): there is no real account to log into — the
  // open prototype is the entry point. Redirect home instead of crashing.
  // Live mode (Supabase configured): render the real auth card.
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      router.replace('/');
    }
  }, [configured, router]);

  if (!configured) {
    return <AuthLoading />;
  }

  return (
    <AuthUI
      onAuthSuccess={() => {
        // Session cookie established by @supabase/ssr; middleware now lets us in.
        router.replace('/');
        router.refresh();
      }}
    />
  );
}
