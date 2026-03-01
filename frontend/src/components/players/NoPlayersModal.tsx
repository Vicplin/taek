
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import GamingButton from '@/components/shared/GamingButton';

interface NoPlayersModalProps {
  isOpen: boolean;
  onCreatePlayer: () => void;
  onCancel: () => void;
}

export default function NoPlayersModal({ isOpen, onCreatePlayer, onCancel }: NoPlayersModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#151515] rounded-xl overflow-hidden shadow-2xl border border-white/5 p-8 text-center"
        >
          <div className="w-16 h-16 bg-arena-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>

          <h2 className="text-2xl font-orbitron font-bold text-white mb-2 uppercase tracking-wide">
            No Player Profile Found
          </h2>
          <p className="text-gray-400 font-rajdhani mb-8">
            You need a player profile to register for tournaments. It looks like you haven&apos;t created one yet.
          </p>

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold tracking-wider transition-colors uppercase text-sm"
            >
              Cancel
            </button>
            <div className="flex-1">
                <GamingButton onClick={onCreatePlayer} fullWidth>
                CREATE PLAYER
                </GamingButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
