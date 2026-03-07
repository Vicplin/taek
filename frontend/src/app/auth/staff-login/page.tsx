'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const ROLE_REDIRECTS: Record<string, string> = {
  coach: '/coach',
  organiser: '/organiser',
  admin: '/admin',
};

export default function StaffLoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Enter your staff email and password.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.session) {
        const token = data.session.access_token;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // DEBUG: Call debug endpoint instead of verify-staff
        const debugRes = await fetch(`${apiUrl}/api/auth/debug`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const debugData = await debugRes.json();
        console.log('DEBUG:', JSON.stringify(debugData, null, 2));

        // Verify staff role via API
        const res = await fetch(`${apiUrl}/api/auth/verify-staff`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          await supabase.auth.signOut();
          const resData = await res.json().catch(() => ({}));
          setError(resData.error || 'You do not have staff access.');
          return;
        }

        const { role } = await res.json();
        const redirect = ROLE_REDIRECTS[role];

        if (!redirect) {
          setError('Your account does not have staff access.');
          await supabase.auth.signOut();
          return;
        }

        router.push(redirect);
      } else {
        setError('Invalid response from server.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-black">
      <div className="relative w-full max-w-lg bg-[#151515] border border-white/10 rounded-2xl px-6 md:px-10 py-8 md:py-10 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-emerald-400 rounded-tl-sm" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-emerald-400 rounded-tr-sm" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-emerald-400 rounded-bl-sm" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-emerald-400 rounded-br-sm" />

        <Link
          href="/"
          aria-label="Close staff portal"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-md border border-white/10 bg-black/40 hover:bg-white/5 hover:text-white text-gray-400 transition-colors"
        >
          <span className="text-xl leading-none">×</span>
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3l7 4v5c0 4.418-3.134 8.418-7 9-3.866-.582-7-4.582-7-9V7l7-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-orbitron font-bold uppercase tracking-[0.35em] text-white mb-2">
            STAFF PORTAL
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-rajdhani">
            Sign in to access your portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.25em]">
              Email Address
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-black/60 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-rajdhani"
                placeholder="staff@taek.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-[0.25em]">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500 group-focus-within:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 15v3m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-11V7a4 4 0 10-8 0v2h8z" />
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 bg-black/60 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all font-rajdhani"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13.875 18.825A10.05 10.05 0 0112 19C7.523 19 3.732 16.057 2.458 12c.37-1.18.92-2.27 1.62-3.24M9.88 9.88A3 3 0 0114.12 14.12M9.88 9.88L5.88 5.88M9.88 9.88l4.24 4.24M14.12 14.12l4 4M9.88 9.88L5.88 5.88M14.12 14.12L18.12 18.12" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S3.732 16.057 2.458 12z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 font-rajdhani">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-emerald-500 text-black font-orbitron font-bold text-xs uppercase tracking-[0.35em] shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing In…' : 'Access Portal'}
          </button>
        </form>
      </div>
    </main>
  );
}
