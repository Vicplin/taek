'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  value: string;
  label: string;
  image?: string;
}

interface CustomDropdownProps {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  onOpenChange?: (isOpen: boolean) => void;
  error?: boolean;
}

export default function CustomDropdown({
  label,
  options,
  value,
  onChange,
  icon,
  placeholder,
  onOpenChange,
  error = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options based on search
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  const toggleOpen = (newState: boolean) => {
    setIsOpen(newState);
    onOpenChange?.(newState);
    if (!newState) setSearch(''); // Reset search on close
  };

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          setIsOpen(false);
          onOpenChange?.(false);
          setSearch('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onOpenChange]);

  return (
    <div className="relative group h-full" ref={containerRef}>
      {/* Trigger Area */}
      <div className="relative h-full">
        <div className={`absolute inset-0 border pointer-events-none transition-colors duration-300 ${error ? 'border-arena-red' : 'border-white/10'}`} />
        
        {/* Corner Accents */}
        <div className={`absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 transition-colors duration-300 ${isOpen || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />
        <div className={`absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 transition-colors duration-300 ${isOpen || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />
        <div className={`absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 transition-colors duration-300 ${isOpen || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />
        <div className={`absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 transition-colors duration-300 ${isOpen || error ? 'border-arena-red' : 'border-arena-red/50 group-hover:border-arena-red'}`} />

        <div 
          className="relative flex items-center bg-[#151515] h-14 px-4 cursor-pointer w-full"
          onClick={() => toggleOpen(!isOpen)}
        >
          {icon && <div className={`mr-3 transition-colors ${isOpen || error ? 'text-arena-red' : 'text-arena-red/70 group-hover:text-arena-red'}`}>{icon}</div>}
          
          <input
            type="text"
            className="flex-1 w-0 bg-transparent text-white placeholder-gray-500 focus:outline-none font-rajdhani text-lg cursor-pointer truncate"
            placeholder={selectedOption ? selectedOption.label : (placeholder || label)}
            value={isOpen ? search : (selectedOption ? selectedOption.label : '')}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!isOpen) toggleOpen(true);
            }}
            readOnly={!isOpen} // Only allow typing when open to act as filter
          />

          <motion.div 
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="text-gray-500 ml-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#151515] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-arena-red text-xs font-bold tracking-[0.2em] uppercase font-orbitron">
                {label.toUpperCase()}
              </span>
            </div>

            {/* Options List */}
            <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`px-6 py-4 cursor-pointer transition-colors font-rajdhani text-lg border-l-2 flex items-center ${
                      value === option.value 
                        ? 'bg-white/5 border-arena-red text-white' 
                        : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 hover:border-arena-red/50'
                    }`}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-gray-500 font-rajdhani">
                  No matches found
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#0D0D0D] border-t border-white/5">
              <span className="text-gray-600 text-xs font-mono">
                {filteredOptions.length} {filteredOptions.length === 1 ? 'item' : 'items'} found
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0D0D0D;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E63946;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ff4d5a;
        }
      `}</style>
    </div>
  );
}
