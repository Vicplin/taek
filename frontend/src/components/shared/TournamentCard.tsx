'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface TournamentCardProps {
  id: number | string;
  name: string;
  date: string;
  location: string;
  priceRange?: string; // Changed from price
  price?: string; // Backwards compatibility
  image: string;
  currentSpots: number;
  maxSpots: number;
  isHot?: boolean;
  status:
    | 'Published'
    | 'Open'
    | 'Closing Soon'
    | 'Almost Full'
    | 'Full'
    | 'Registration Closed'
    | 'Ongoing'
    | 'On going'
    | 'Complete'
    | 'Closed'
    | 'Upcoming';
  category?: string;
  categories?: string[];
  registrationEnd?: string;
  onCategoryClick?: (category: string) => void;
  selectedCategory?: string;
  showBackFace?: boolean;
  onCardClick?: () => void;
  registeredPlayers?: { name: string; club?: string; belt?: string }[];
}

export default function TournamentCard({
  id,
  name,
  date,
  location,
  priceRange,
  price,
  image,
  currentSpots,
  maxSpots,
  isHot = false,
  status,
  category,
  categories,
  registrationEnd = '2026-03-10T23:59:59',
  onCategoryClick,
  selectedCategory,
  showBackFace = false,
  onCardClick,
  registeredPlayers = [],
}: TournamentCardProps) {
  const user = null; // Placeholder
  const open = () => console.log('Open Auth Modal'); // Placeholder
  const router = useRouter();

  // Handle categories logic
  const allCategories = categories || (category ? [category] : ['SPARRING']);
  const primaryCategory = selectedCategory && allCategories.includes(selectedCategory)
    ? selectedCategory
    : allCategories[0];
  const secondaryCategories = allCategories.filter(c => c !== primaryCategory);
  const remainingCategories = secondaryCategories.length;

  // Handle status normalization and styling
  const rawStatus = status.trim().toLowerCase();

  const statusLabelMap: Record<string, string> = {
    published: 'Upcoming',
    open: 'Open',
    'closing soon': 'Closing Soon',
    'almost full': 'Almost Full',
    full: 'Full',
    'registration closed': 'Registration Closed',
    ongoing: 'On going',
    'on going': 'On going',
    complete: 'Complete',
    closed: 'Registration Closed',
    upcoming: 'Upcoming',
  };

  const defaultLabel = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  const statusLabel = statusLabelMap[rawStatus] ?? defaultLabel;

  let statusTextClass = 'text-green-400';
  let statusBorderClass = 'border-green-400';
  let statusGlowClass = 'group-hover:shadow-[0_0_15px_rgba(74,222,128,0.4)]';

  if (rawStatus === 'closing soon' || rawStatus === 'almost full') {
    statusTextClass = 'text-yellow-400';
    statusBorderClass = 'border-yellow-400';
    statusGlowClass = 'group-hover:shadow-[0_0_15px_rgba(250,204,21,0.4)]';
  } else if (rawStatus === 'full' || rawStatus === 'registration closed' || rawStatus === 'closed') {
    statusTextClass = 'text-red-400';
    statusBorderClass = 'border-red-400';
    statusGlowClass = 'group-hover:shadow-[0_0_15px_rgba(248,113,113,0.4)]';
  } else if (rawStatus === 'complete') {
    statusTextClass = 'text-blue-400';
    statusBorderClass = 'border-blue-400';
    statusGlowClass = 'group-hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]';
  }

  // Handle price/priceRange compatibility
  const displayPrice = priceRange || price?.replace('$', '') || '50 - 200';
  const normalizedPrimaryCategory = primaryCategory.toLowerCase();
  const categoryColorClasses = normalizedPrimaryCategory.includes('kyorugi')
    ? 'bg-[#0D0D0D] border border-red-500/40 text-red-400 hover:bg-red-500/10 shadow-[0_0_10px_rgba(248,113,113,0.3)]'
    : normalizedPrimaryCategory.includes('poomsae')
    ? 'bg-[#0D0D0D] border border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
    : normalizedPrimaryCategory.includes('virtual') || normalizedPrimaryCategory.includes('vr')
    ? 'bg-[#0D0D0D] border border-green-500/40 text-green-400 hover:bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
    : normalizedPrimaryCategory.includes('breaking')
    ? 'bg-[#0D0D0D] border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
    : normalizedPrimaryCategory.includes('speed')
    ? 'bg-[#0D0D0D] border border-purple-500/40 text-purple-400 hover:bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
    : normalizedPrimaryCategory.includes('freestyle')
    ? 'bg-[#0D0D0D] border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
    : 'bg-[#0D0D0D] border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]';
  
  // Calculate percentage for bar
  const percentage = Math.min((currentSpots / maxSpots) * 100, 100);
  const segments = 10;
  const filledSegments = Math.ceil((percentage / 100) * segments);

  // Format date to look like "2026-03-15" if it's not already
  const formatDate = (dateString: string) => {
    // If it's already YYYY-MM-DD or similar short format, return as is
    if (dateString.length <= 12) return dateString;
    try {
      const d = new Date(dateString);
      return d.toISOString().split('T')[0];
    } catch {
      return dateString;
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If no onCardClick, let Link handle navigation naturally
    if (!onCardClick) return;
    
    e.preventDefault();
    onCardClick();
  };

  if (!showBackFace) {
    return (
      <Link
        href={`/tournaments/${id}`}
        onClick={handleCardClick}
        className="group block relative h-[520px] w-full bg-[#151515] rounded-xl overflow-hidden border border-arena-red/30 hover:border-arena-red transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,70,85,0.2)] isolate cursor-pointer"
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
          <div className="absolute top-[-2px] left-[-2px]">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
            </svg>
          </div>
          <div className="absolute top-[-2px] right-[-2px] rotate-90">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
            </svg>
          </div>
          <div className="absolute bottom-[-2px] right-[-2px] rotate-180">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
            </svg>
          </div>
          <div className="absolute bottom-[-2px] left-[-2px] -rotate-90">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
            </svg>
          </div>
        </div>

        <div className="relative h-[45%] w-full">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#151515]/60 to-[#151515]" />

          <div className="absolute top-6 left-6 z-10">
            {isHot && (
              <div className="bg-arena-red text-white text-xs font-bold px-3 py-1 rounded-sm shadow-lg flex items-center gap-2 border border-white/20">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                HOT
              </div>
            )}
          </div>

          <div className="absolute top-6 right-6 z-10">
            <div
              className={`relative bg-[#1a1a1a] ${statusTextClass} text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider shadow-lg overflow-hidden transition-shadow duration-300 ${statusGlowClass}`}
            >
              <div className={`absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 ${statusBorderClass}`} />
              <div className={`absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 ${statusBorderClass}`} />
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 ${statusBorderClass}`} />
              <div className={`absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 ${statusBorderClass}`} />
              <span className="relative z-10">{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-[65%] p-5 flex flex-col justify-end bg-gradient-to-t from-[#151515] via-[#151515] to-transparent">
          <h3 className="text-xl font-orbitron font-bold text-white mb-4 leading-tight group-hover:text-arena-red transition-colors drop-shadow-lg">
            {name}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 text-gray-400 font-rajdhani hover:text-white transition-colors">
              <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-base tracking-wide">{formatDate(date)}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 font-rajdhani hover:text-white transition-colors">
              <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-base tracking-wide">{location}</span>
            </div>
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 font-rajdhani">
              <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-arena-red font-bold text-lg">{currentSpots}</span>
              <span className="text-gray-500 font-medium">/ {maxSpots} Registered</span>
            </div>

            <div className="flex items-center gap-2 font-rajdhani text-sm ml-1">
              <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-400">Ends:</span>
              <span className="text-white tracking-wide">{registrationEnd.split('T')[0]}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">
              <span>Capacity</span>
              <span>{currentSpots}/{maxSpots}</span>
            </div>
            <div className="flex gap-1 h-1.5">
              {[...Array(segments)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-500 ${
                    i < filledSegments
                      ? 'bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-end justify-between border-t border-white/10 pt-4 mt-auto">
            <div className="flex items-center gap-2">
              <div
                onClick={(e) => {
                  if (onCategoryClick) {
                    e.preventDefault();
                    e.stopPropagation();
                    onCategoryClick(primaryCategory);
                  }
                }}
                className={`${categoryColorClasses} px-4 py-1.5 text-xs font-bold uppercase tracking-wider -skew-x-12 max-w-[120px] truncate ${onCategoryClick ? 'cursor-pointer transition-colors' : ''}`}
              >
                <span className="skew-x-12 block truncate">{primaryCategory}</span>
              </div>
              {remainingCategories > 0 && (
                <div className="bg-[#0D0D0D] border border-white/20 text-gray-400 px-2 py-1.5 text-xs font-bold -skew-x-12" title={secondaryCategories.join(', ')}>
                  <span className="skew-x-12 block">+{remainingCategories}</span>
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-1">Entry Fee</div>
              <div className="font-orbitron font-bold text-white text-xl sm:text-2xl flex flex-wrap items-baseline justify-end gap-1 sm:gap-2">
                <span className="text-arena-red text-sm sm:text-base font-bold">RM</span>
                <span className="truncate max-w-[8rem] sm:max-w-none">{displayPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {isHot && (
          <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[30deg] animate-[shiny_2.5s_linear_infinite]" />
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link 
      href={`/tournaments/${id}`}
      onClick={handleCardClick}
      className="group block relative h-[520px] w-full bg-[#151515] rounded-xl overflow-hidden border border-arena-red/30 hover:border-arena-red transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,70,85,0.2)] isolate cursor-pointer"
    >
      <div className="relative w-full h-full card-3d">
        <div className="relative w-full h-full card-inner-3d">
          <div className="absolute inset-0 card-face">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
              <div className="absolute top-[-2px] left-[-2px]">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
                </svg>
              </div>
              <div className="absolute top-[-2px] right-[-2px] rotate-90">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
                </svg>
              </div>
              <div className="absolute bottom-[-2px] right-[-2px] rotate-180">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
                </svg>
              </div>
              <div className="absolute bottom-[-2px] left-[-2px] -rotate-90">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M2 38V2H38" stroke="#FF4655" strokeWidth="4" />
                </svg>
              </div>
            </div>

            <div className="relative h-[45%] w-full">
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#151515]/60 to-[#151515]" />

              <div className="absolute top-6 left-6 z-10">
                {isHot && (
                  <div className="bg-arena-red text-white text-xs font-bold px-3 py-1 rounded-sm shadow-lg flex items-center gap-2 border border-white/20">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    HOT
                  </div>
                )}
              </div>

              <div className="absolute top-6 right-6 z-10">
                <div
                  className={`relative bg-[#1a1a1a] ${statusTextClass} text-xs font-bold px-4 py-2 rounded-sm uppercase tracking-wider shadow-lg overflow-hidden transition-shadow duration-300 ${statusGlowClass}`}
                >
                  <div className={`absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 ${statusBorderClass}`} />
                  <div className={`absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 ${statusBorderClass}`} />
                  <div className={`absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 ${statusBorderClass}`} />
                  <div className={`absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 ${statusBorderClass}`} />
                  <span className="relative z-10">{statusLabel}</span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[65%] p-5 flex flex-col justify-end bg-gradient-to-t from-[#151515] via-[#151515] to-transparent">
              <h3 className="text-xl font-orbitron font-bold text-white mb-4 leading-tight group-hover:text-arena-red transition-colors drop-shadow-lg">
                {name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-3 text-gray-400 font-rajdhani hover:text-white transition-colors">
                  <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-base tracking-wide">{formatDate(date)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 font-rajdhani hover:text-white transition-colors">
                  <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-base tracking-wide">{location}</span>
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 font-rajdhani">
                  <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-arena-red font-bold text-lg">{currentSpots}</span>
                  <span className="text-gray-500 font-medium">/ {maxSpots} Registered</span>
                </div>

                <div className="flex items-center gap-2 font-rajdhani text-sm ml-1">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-400">Ends:</span>
                  <span className="text-white tracking-wide">{registrationEnd.split('T')[0]}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 font-bold mb-2 uppercase tracking-wider">
                  <span>Capacity</span>
                  <span>{currentSpots}/{maxSpots}</span>
                </div>
                <div className="flex gap-1 h-1.5">
                  {[...Array(segments)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm transition-all duration-500 ${
                        i < filledSegments
                          ? 'bg-[#4ADE80] shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-white/10 pt-4 mt-auto">
                <div className="flex items-center gap-2">
                  <div
                    onClick={(e) => {
                      if (onCategoryClick) {
                        e.preventDefault();
                        e.stopPropagation();
                        onCategoryClick(primaryCategory);
                      }
                    }}
                    className={`${categoryColorClasses} px-4 py-1.5 text-xs font-bold uppercase tracking-wider -skew-x-12 max-w-[120px] truncate ${onCategoryClick ? 'cursor-pointer transition-colors' : ''}`}
                  >
                    <span className="skew-x-12 block truncate">{primaryCategory}</span>
                  </div>
                  {remainingCategories > 0 && (
                    <div className="bg-[#0D0D0D] border border-white/20 text-gray-400 px-2 py-1.5 text-xs font-bold -skew-x-12" title={secondaryCategories.join(', ')}>
                      <span className="skew-x-12 block">+{remainingCategories}</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-1">Entry Fee</div>
                  <div className="font-orbitron font-bold text-white text-xl sm:text-2xl flex flex-wrap items-baseline justify-end gap-1 sm:gap-2">
                    <span className="text-arena-red text-sm sm:text-base font-bold">RM</span>
                    <span className="truncate max-w-[8rem] sm:max-w-none">{displayPrice}</span>
                  </div>
                </div>
              </div>
            </div>

            {isHot && (
              <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-[30deg] animate-[shiny_2.5s_linear_infinite]" />
              </div>
            )}
          </div>

          <div className="absolute inset-0 card-face card-back bg-[#0b0b0b] flex flex-col p-6">
            <h3 className="text-xl font-orbitron font-bold text-white mb-4 tracking-wide">
              Registered Players
            </h3>
            {registeredPlayers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 text-sm">
                <p className="uppercase tracking-widest mb-2">No players registered</p>
                <p className="text-xs text-gray-500">Hover to preview, click to view details and register.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest mb-1">
                  <span>Players</span>
                  <span>{registeredPlayers.length}</span>
                </div>
                <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {registeredPlayers.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white tracking-wide uppercase truncate max-w-[160px]">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {p.club}
                        </span>
                      </div>
                      {p.belt && (
                        <span className="text-[11px] font-bold text-arena-red uppercase tracking-wider">
                          {p.belt}
                        </span>
                      )}
                    </div>
                  ))}
                  {registeredPlayers.length > 4 && (
                    <div className="text-[11px] text-gray-400 uppercase tracking-widest mt-1">
                      +{registeredPlayers.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 uppercase tracking-[0.2em]">
              <span>Hover to flip</span>
              <span>Click for details</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
