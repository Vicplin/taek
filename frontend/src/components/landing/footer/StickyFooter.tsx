'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GamingButton from '../../shared/GamingButton';

export default function StickyFooter() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling down 500px
      setIsVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-0 left-0 w-full bg-deep-black/90 backdrop-blur-md border-t border-arena-red/30 z-40 py-4 shadow-[0_-5px_20px_rgba(230,57,70,0.1)]"
        >
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="hidden md:block">
              <p className="text-white font-bold font-orbitron">READY TO COMPETE?</p>
              <p className="text-xs text-gray-400">Join 2,400+ players today</p>
            </div>
            <div className="w-full md:w-auto flex justify-center md:justify-end gap-4">
              <GamingButton href="/tournaments" variant="ghost" className="hidden sm:inline-flex">
                BROWSE
              </GamingButton>
              <GamingButton href="/auth/sign-up" variant="primary">
                REGISTER NOW
              </GamingButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
