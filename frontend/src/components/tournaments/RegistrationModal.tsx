'use client';

import { motion, AnimatePresence } from 'framer-motion';
import RegistrationForm from './RegistrationForm';

interface Player {
  id: string;
  full_name: string;
  belt_rank: string;
  club: string;
  weight: number;
  height: number;
  gender: string;
  birth_date: string;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  selectedCategories: { id: number; type: string; name: string }[];
  currentPlayer: Player | null;
  tournamentStatus: string;
}

export default function RegistrationModal({ 
  isOpen, 
  onClose, 
  tournamentId,
  selectedCategories,
  currentPlayer,
  tournamentStatus
}: RegistrationModalProps) {
  // Pass selected categories to form logic
  // Since RegistrationForm uses URL params, we might need to adapt it 
  // or wrap it to accept props instead of reading from URL
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-3xl bg-[#0a0a0a] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.1)] border border-white/10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#151515]">
              <h2 className="text-xl font-orbitron font-bold text-white tracking-wide">
                TOURNAMENT REGISTRATION
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <RegistrationForm 
                tournamentId={tournamentId} 
                initialSelectedEvents={selectedCategories}
                player={currentPlayer}
                isModal={true}
                onClose={onClose}
                tournamentStatus={tournamentStatus}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
