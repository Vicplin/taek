import Link from 'next/link';
import GamingButton from '@/components/shared/GamingButton';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-rajdhani flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-6 tracking-wide">
        ADMIN DASHBOARD
      </h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        System administration, user management, and global settings.
      </p>
      <div className="bg-[#131313] border border-white/10 rounded-xl p-8 w-full max-w-md text-center">
        <div className="text-arena-red font-bold uppercase tracking-widest mb-4">Coming Soon</div>
        <p className="text-sm text-gray-500 mb-6">
          This section is currently under development.
        </p>
        <Link href="/">
          <GamingButton variant="outline" fullWidth>
            Return Home
          </GamingButton>
        </Link>
      </div>
    </div>
  );
}
