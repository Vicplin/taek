'use client';

interface UniversalSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function UniversalSearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = ""
}: UniversalSearchBarProps) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute inset-0 border border-white/10 pointer-events-none" />
      
      {/* Corner Accents */}
      <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-arena-red/50 group-hover:border-arena-red transition-colors" />
      <div className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-arena-red/50 group-hover:border-arena-red transition-colors" />
      <div className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-arena-red/50 group-hover:border-arena-red transition-colors" />
      <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-arena-red/50 group-hover:border-arena-red transition-colors" />

      <div className="relative flex items-center bg-[#151515] h-14 px-4">
        <svg className="w-5 h-5 text-arena-red mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none font-rajdhani text-lg"
        />
      </div>
    </div>
  );
}
