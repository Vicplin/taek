'use client';

import { useState } from 'react';

interface UniversalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: boolean;
}

export default function UniversalSearchInput({ 
  value, 
  onChange, 
  placeholder = "Search tournaments...",
  onFocus,
  onBlur,
  error = false
}: UniversalSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <div className="relative group h-full">
      <div className={`absolute inset-0 border pointer-events-none transition-colors duration-300 ${error ? 'border-arena-red' : 'border-white/10'}`} />
      
      {/* Corner Accents */}
      <div className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 transition-colors duration-300 ${isFocused || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />
      <div className={`absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 transition-colors duration-300 ${isFocused || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />
      <div className={`absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 transition-colors duration-300 ${isFocused || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />
      <div className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 transition-colors duration-300 ${isFocused || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />

      <div className="relative flex items-center bg-[#151515] h-14 px-4 w-full">
        <svg className={`w-5 h-5 mr-3 transition-colors ${isFocused || error ? 'text-arena-red' : 'text-arena-red/70 group-hover:text-arena-red'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 w-0 bg-transparent text-white placeholder-gray-500 focus:outline-none font-rajdhani text-lg"
        />
      </div>
    </div>
  );
}
