'use client';

import { motion } from 'framer-motion';
import GamingButton from '../../shared/GamingButton';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { LandingStats } from '@/lib/api/landing';
import AuthModal from '../../auth/AuthModal';

interface HeroContentProps {
  stats?: LandingStats;
}

export default function HeroContent({ stats }: HeroContentProps) {
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'signin' | 'signup'>('signin');
  
  const openSignIn = () => {
    setInitialAuthMode('signin');
    setAuthModalOpen(true);
  };
  
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  return (
    <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={initialAuthMode} />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl"
      >
        {/* Live Badge */}
        <div className="inline-flex items-center gap-2 bg-[#2A0E11] border border-arena-red/30 px-5 py-2 rounded-full mb-8 mt-16 backdrop-blur-sm">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-arena-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-arena-red"></span>
          </span>
          <span className="text-arena-red font-bold text-xs tracking-[0.2em] uppercase">LIVE REGISTRATIONS OPEN</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-6xl md:text-8xl font-orbitron font-bold text-white leading-[0.9] mb-8 tracking-wide">
          COMPETE.<br />
          DOMINATE.<br />
          <span className="text-arena-red">CONQUER.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg text-gray-400 mb-10 max-w-xl font-rajdhani leading-relaxed">
          Join Malaysia&apos;s premier Taekwondo tournament platform. 
          Register for competitions, track your rankings, and rise through 
          the ranks.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-6 mb-16">
          <GamingButton href="/tournaments" variant="primary" className="px-8 py-4 text-sm tracking-widest font-bold">
            FIND TOURNAMENTS
          </GamingButton>
          {user ? (
            <GamingButton href="/dashboard" variant="secondary" className="px-8 py-4 text-sm tracking-widest font-bold">
              DASHBOARD
            </GamingButton>
          ) : (
            <GamingButton onClick={openSignIn} variant="secondary" className="px-8 py-4 text-sm tracking-widest font-bold">
              JOIN NOW
            </GamingButton>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-12 max-w-2xl">
          <div>
            <div className="w-8 h-1 bg-arena-red mb-4"></div>
            <div className="text-4xl font-orbitron font-bold text-white mb-2">{stats?.activePlayers || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">ACTIVE PLAYERS</div>
          </div>
          <div>
            <div className="w-8 h-1 bg-arena-red mb-4"></div>
            <div className="text-4xl font-orbitron font-bold text-white mb-2">{stats?.tournaments || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">TOURNAMENTS</div>
          </div>
          <div>
            <div className="w-8 h-1 bg-arena-red mb-4"></div>
            <div className="text-4xl font-orbitron font-bold text-white mb-2">{stats?.partnerClubs || 0}</div>
            <div className="text-xs text-gray-400 uppercase tracking-widest font-bold">PARTNER CLUBS</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
