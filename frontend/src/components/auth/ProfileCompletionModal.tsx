'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import GamingButton from '@/components/shared/GamingButton';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  userId: string;
  email: string;
  onComplete: () => void;
}

export default function ProfileCompletionModal({ isOpen, userId, email, onComplete }: ProfileCompletionModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          phone: phoneNumber,
          email: email,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      onComplete();
    } catch (err: unknown) {
      console.error('Error updating profile:', err);
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#151515] rounded-xl overflow-hidden shadow-2xl border border-white/5 flex flex-col p-8"
        >
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm z-10" />
          <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm z-10" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm z-10" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm z-10" />

          <div className="text-center mb-8">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-2 tracking-wide uppercase">
              Complete Your Profile
            </h2>
            <p className="text-gray-400 font-rajdhani">
              We need a few more details to finish setting up your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-500 group-focus-within:text-arena-red transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-arena-red focus:ring-1 focus:ring-arena-red transition-all font-rajdhani"
                  placeholder="+60 12-345 6789"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-bold">
                {error}
              </div>
            )}

            <GamingButton fullWidth disabled={loading}>
              {loading ? 'SAVING...' : 'COMPLETE REGISTRATION'}
              {!loading && (
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </GamingButton>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
