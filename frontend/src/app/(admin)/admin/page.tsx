'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import GamingButton from '@/components/shared/GamingButton';
import StaffManagement from '@/components/admin/StaffManagement';
import { useEffect, useState } from 'react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/staff-login/admin');
        return;
      }

      // We could double check role here via API, but the API endpoints are protected anyway
      // So if the user isn't admin, the API calls in StaffManagement will fail.
      // However, a quick check of local metadata or a "me" call is good UX.
      
      setCheckingAuth(false);
    };

    checkAdmin();
  }, [router, supabase]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-arena-red"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-rajdhani pt-24 pb-16 px-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white tracking-wide mb-2">
              ADMIN DASHBOARD
            </h1>
            <p className="text-gray-400 max-w-xl">
              Manage staff accounts, global settings, and system configurations.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/">
              <GamingButton variant="outline">
                Home
              </GamingButton>
            </Link>
            <GamingButton 
              variant="secondary"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
            >
              Sign Out
            </GamingButton>
          </div>
        </div>

        <StaffManagement />
      </div>
    </div>
  );
}
