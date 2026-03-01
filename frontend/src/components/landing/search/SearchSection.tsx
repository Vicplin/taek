'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import CustomDropdown from '../../shared/CustomDropdown';
import UniversalSearchInput from '../../shared/UniversalSearchInput';
import GamingButton from '../../shared/GamingButton';
import { LOCATIONS } from '@/lib/constants';

const CATEGORIES = [
  { value: 'Kyorugi', label: 'Kyorugi' },
  { value: 'Poomsae', label: 'Poomsae' },
  { value: 'Breaking', label: 'Breaking' },
  { value: 'Virtual-Reality', label: 'Virtual Reality' },
  { value: 'SpeedKick', label: 'Speed Kicking' },
  { value: 'Freestyle', label: 'Freestyle' },
];

export default function SearchSection() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState(false);
  const controls = useAnimation();

  const handleSearch = () => {
    if (!query && !category && !location) {
      setError(true);
      controls.start({
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      });
      setTimeout(() => setError(false), 4000);
      return;
    }
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    if (location) params.set('location', location);

    const queryString = params.toString();
    const href = queryString ? `/tournaments?${queryString}` : '/tournaments';
    router.push(href);
  };

  return (
    <section className="relative z-20 container mx-auto px-4 mb-20 mt-10">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-orbitron font-medium text-white mb-2">
          Find Your Next <span className="text-arena-red">Battle</span>
        </h2>
        <p className="text-gray-500 font-rajdhani text-sm tracking-wide">
          Search by location, date, or category
        </p>
      </div>

      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        className="bg-[#0D0D0D] border border-white/5 p-8 relative rounded-lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Search Query */}
          <motion.div animate={controls} className="h-full">
            <UniversalSearchInput 
              value={query}
              onChange={setQuery}
              error={error}
            />
          </motion.div>

          {/* Category */}
          <motion.div animate={controls} className="h-full">
            <CustomDropdown 
              label="Category"
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              error={error}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              }
            />
          </motion.div>

          {/* Location */}
          <motion.div animate={controls} className="h-full">
            <CustomDropdown 
              label="Location"
              options={LOCATIONS}
              value={location}
              onChange={setLocation}
              error={error}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          </motion.div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="relative group bg-red-500/10 border border-red-500/50 p-4 rounded flex items-start gap-4">
              {/* Corner Accents for Error Box */}
              <div className="absolute -top-[1px] -left-[1px] w-2 h-2 border-t-2 border-l-2 border-red-500" />
              <div className="absolute -top-[1px] -right-[1px] w-2 h-2 border-t-2 border-r-2 border-red-500" />
              <div className="absolute -bottom-[1px] -left-[1px] w-2 h-2 border-b-2 border-l-2 border-red-500" />
              <div className="absolute -bottom-[1px] -right-[1px] w-2 h-2 border-b-2 border-r-2 border-red-500" />

              <div className="shrink-0 text-red-500 p-1 bg-red-500/10 rounded-full border border-red-500/20 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-red-500 font-orbitron font-bold text-sm tracking-widest uppercase mb-1">
                  VALIDATION ERROR
                </h4>
                <p className="text-gray-300 font-rajdhani text-sm">
                  Please enter a tournament name, select a category, or specify a location
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit Button */}
        <GamingButton 
          onClick={handleSearch} 
          fullWidth
          className="py-5 text-lg"
        >
          FIND YOUR TOURNAMENT
        </GamingButton>
      </motion.div>
    </section>
  );
}
