'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import TournamentCard from '@/components/shared/TournamentCard';
import UniversalSearchInput from '@/components/shared/UniversalSearchInput';
import CustomDropdown from '@/components/shared/CustomDropdown';
import { LOCATIONS } from '@/lib/constants';
import { getTournaments, Tournament } from '@/lib/api/tournaments';

// Types
type Category = 'Kyorugi' | 'Poomsae' | 'Virtual-Reality' | 'Breaking' | 'SpeedKick' | 'Freestyle';

// Category Configuration
const CATEGORY_CONFIG: Record<Category, { color: string; image: string; label: string }> = {
  Kyorugi: { color: '#FF0000', image: '/images/Kyorugi.png', label: 'KYORUGI' }, // Red
  Poomsae: { color: '#FFD700', image: '/images/Poomsae.png', label: 'POOMSAE' }, // Yellow
  'Virtual-Reality': { color: '#00FF00', image: '/images/Vr.png', label: 'VR TAEKWONDO' }, // Green
  Breaking: { color: '#FFA500', image: '/images/breaking.png', label: 'BREAKING' }, // Orange
  SpeedKick: { color: '#800080', image: '/images/SpeedKick.png', label: 'SPEED KICKING' }, // Purple
  Freestyle: { color: '#0000FF', image: '/images/Freestyle.png', label: 'FREESTYLE' }, // Blue
};

export default function TournamentsPage() {
  const searchParams = useSearchParams();

  const normalizeCategory = (value: string | null): string => {
    if (!value) return '';
    const match = Object.keys(CATEGORY_CONFIG).find(
      key => key.toLowerCase() === value.toLowerCase()
    );
    return match || value;
  };

  const initialSearchQuery = searchParams.get('q') || '';
  const initialCategory = normalizeCategory(searchParams.get('category'));
  const initialLocation = searchParams.get('location') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [filterCategory, setFilterCategory] = useState<string>(initialCategory);
  const [filterLocation, setFilterLocation] = useState<string>(initialLocation);
  const [activeSection, setActiveSection] = useState<'search' | 'category' | 'location' | null>(null);
  const [headerSource, setHeaderSource] = useState<'category' | 'location'>(
    initialCategory ? 'category' : (initialLocation ? 'location' : 'category')
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournamentsData = async () => {
      setLoading(true);
      try {
        const data = await getTournaments();
        setTournaments(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching tournaments:', err);
        setError('Failed to load tournaments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchTournamentsData();
  }, []);

  // Get all locations from constants
  const locationOptions = [
    { value: '', label: 'All Locations' },
    ...LOCATIONS.map(loc => ({
      value: loc.value,
      label: loc.label,
      image: loc.image
    }))
  ];

  // Filter tournaments
  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Handle categories which might be JSONB array or null
    const categories = Array.isArray(t.categories) ? t.categories : [];
    const matchesCategory = filterCategory ? categories.some((cat: any) => 
      typeof cat === 'string' && cat.toLowerCase() === filterCategory.toLowerCase()
    ) : true;
    
    const matchesLocation = filterLocation ? (
      t.location === LOCATIONS.find(l => l.value === filterLocation)?.label || 
      t.location === filterLocation
    ) : true;
    
    const isComplete = t.status === 'completed'; // Updated from COMPLETE to match DB enum
    return matchesSearch && matchesCategory && matchesLocation && !isComplete;
  });

  const TOURNAMENTS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / TOURNAMENTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * TOURNAMENTS_PER_PAGE;
  const visibleTournaments = filteredTournaments.slice(startIndex, startIndex + TOURNAMENTS_PER_PAGE);
  const hasFilters = Boolean(searchQuery || filterCategory || filterLocation);

  let unavailableTerm = '';
  if (searchQuery) {
    unavailableTerm = `"${searchQuery}"`;
  } else if (filterCategory) {
    unavailableTerm = CATEGORY_CONFIG[filterCategory as Category]?.label || filterCategory;
  } else if (filterLocation) {
    unavailableTerm = filterLocation;
  }

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...Object.keys(CATEGORY_CONFIG).map(cat => ({
      value: cat,
      label: CATEGORY_CONFIG[cat as Category].label
    }))
  ];

  const handleFilterCategoryChange = (value: string) => {
    setFilterCategory(value);
    setHeaderSource('category');
    setCurrentPage(1);
  };

  const handleFilterLocationChange = (value: string) => {
    setFilterLocation(value);
    setHeaderSource('location');
    setCurrentPage(1);
  };

  // Determine header image based on filter
  const activeLocation = filterLocation ? LOCATIONS.find(l => l.value === filterLocation || l.label === filterLocation) : null;
  const activeCategory = (filterCategory && filterCategory in CATEGORY_CONFIG) 
    ? (filterCategory as Category) 
    : 'Kyorugi';
  const categoryImage = CATEGORY_CONFIG[activeCategory].image;
  const categoryLabel = CATEGORY_CONFIG[activeCategory].label;

  let headerImage = categoryImage;
  let headerLabel = categoryLabel;

  if (headerSource === 'location' && activeLocation) {
    headerImage = activeLocation.image;
    headerLabel = activeLocation.label;
  } else if (headerSource === 'category' && filterCategory && filterCategory in CATEGORY_CONFIG) {
    headerImage = categoryImage;
    headerLabel = categoryLabel;
  } else if (activeLocation) {
    headerImage = activeLocation.image;
    headerLabel = activeLocation.label;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-rajdhani pb-20 overflow-x-hidden">
      {/* Header Section */}
      <div className="relative pt-20 pb-12 px-4 container mx-auto z-30">
        <div className="flex justify-between items-start relative z-10">
          <div className="w-full lg:w-2/3 max-w-3xl">
            <Link href="/" className="text-gray-500 hover:text-white mb-6 inline-flex items-center text-sm font-bold tracking-wider transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              Back to Home
            </Link>
            <h1 className="text-5xl md:text-6xl font-orbitron font-bold text-white mb-4 tracking-wide">
              Tournaments
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mb-8">
              Find your next competition. Register, compete, and rise through the ranks in the world&apos;s premier Taekwondo events.
            </p>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 relative z-50 mt-8">
              <div className={`w-full md:w-auto transition-all duration-500 ease-in-out ${
                activeSection === 'search' ? 'md:flex-[3]' : (!activeSection ? 'md:flex-[2]' : 'md:flex-[0.5]')
              }`}>
                <UniversalSearchInput 
                  value={searchQuery}
                  onChange={(value) => {
                    setSearchQuery(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search tournaments..."
                  onFocus={() => setActiveSection('search')}
                  onBlur={() => setActiveSection(null)}
                />
              </div>
              <div className={`w-full md:w-auto transition-all duration-500 ease-in-out ${
                activeSection === 'category' ? 'md:flex-[3]' : (!activeSection ? 'md:flex-1' : 'md:flex-[0.5]')
              }`}>
                <CustomDropdown 
                  label="Category"
                  options={categoryOptions}
                  value={filterCategory}
                  onChange={handleFilterCategoryChange}
                  onOpenChange={(isOpen) => setActiveSection(isOpen ? 'category' : null)}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  }
                />
              </div>
              <div className={`w-full md:w-auto transition-all duration-500 ease-in-out ${
                activeSection === 'location' ? 'md:flex-[3]' : (!activeSection ? 'md:flex-1' : 'md:flex-[0.5]')
              }`}>
                <CustomDropdown 
                  label="Location"
                  options={locationOptions}
                  value={filterLocation}
                  onChange={handleFilterLocationChange}
                  onOpenChange={(isOpen) => setActiveSection(isOpen ? 'location' : null)}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />
              </div>
            </div>
          </div>

          {/* Floating Header Image */}
          <motion.div 
            key={headerImage} // Re-animate on change
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0, y: [0, -15, 0] }}
            transition={{ 
              opacity: { duration: 0.5 },
              x: { duration: 0.5 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" } 
            }}
            className="hidden lg:flex absolute right-0 top-0 w-[500px] h-[600px] pointer-events-none z-0 items-center justify-center"
          >
             {activeLocation ? (
               // Flag Style - Consistent Size
               <div className="relative w-[500px] h-[333px] rounded-2xl overflow-hidden">
                 <Image 
                   src={headerImage}
                   alt={headerLabel}
                   fill
                   className="object-cover"
                   priority
                 />
               </div>
             ) : (
               // Character/Category Style
               <div className="relative w-full h-full">
                  <Image 
                    src={headerImage}
                    alt={headerLabel}
                    fill
                    className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                    priority
                  />
               </div>
             )}
          </motion.div>
        </div>


      </div>

      {/* Results Count */}
      <div className="container mx-auto px-4 mb-8 flex items-center gap-2">
        <p className="text-gray-500 font-bold">
          <span className="text-white">{loading ? '...' : filteredTournaments.length}</span> tournaments found
        </p>
        {(filterCategory || filterLocation) && (
          <div className="flex gap-2">
            {filterCategory && (
              <span 
                onClick={() => setFilterCategory('')}
                className="cursor-pointer hover:bg-arena-red/30 transition-colors flex items-center gap-1 text-xs bg-arena-red/20 text-arena-red px-2 py-1 rounded border border-arena-red/30"
              >
                {CATEGORY_CONFIG[filterCategory as Category]?.label || filterCategory}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
            {filterLocation && (
              <span 
                onClick={() => setFilterLocation('')}
                className="cursor-pointer hover:bg-blue-500/30 transition-colors flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30"
              >
                {filterLocation}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[400px] bg-[#151515] animate-pulse rounded-xl border border-white/5" />
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="container mx-auto px-4 mt-12 space-y-10">
          <div className="relative bg-gradient-to-r from-red-500/5 via-red-500/10 to-red-500/5 border border-red-500/40 rounded-xl px-6 py-10 md:px-10 md:py-12 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_#ef4444,_transparent_60%)]" />
            <div className="relative flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full border border-red-500/60 flex items-center justify-center text-red-400 mb-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 21h8m-4-4v4m-6-16h2m8 0h2m-12 0V5a2 2 0 012-2h8a2 2 0 012 2v2a5 5 0 01-5 5H9a5 5 0 01-5-5V5z"
                  />
                </svg>
              </div>
              <h2 className="text-lg md:text-xl font-orbitron font-bold tracking-widest uppercase text-white">
                TOURNAMENT NOT AVAILABLE
              </h2>
              <p className="text-sm md:text-base text-gray-300">
                {hasFilters && unavailableTerm
                  ? `We don't have ${unavailableTerm} available.`
                  : "No tournaments are currently available."}
              </p>
              <p className="text-xs md:text-sm text-gray-500">
                But check out these tournaments below!
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs md:text-sm font-orbitron font-bold tracking-[0.3em] uppercase text-gray-300 flex items-center gap-2">
              <span className="text-arena-red text-lg">→</span>
              TOURNAMENTS YOU MAY BE INTERESTED IN
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tournaments.slice(0, 3).map((tournament, index) => {
                const statusMap: Record<string, 'Open' | 'Closed' | 'Upcoming' | 'Full' | 'Registration Closed' | 'Ongoing' | 'Complete'> = {
                  open: 'Open',
                  closed: 'Closed',
                  upcoming: 'Upcoming',
                  full: 'Full',
                  registration_closed: 'Registration Closed',
                  ongoing: 'Ongoing',
                  completed: 'Complete',
                  cancelled: 'Closed',
                  published: 'Upcoming',
                };
                const cardStatus = statusMap[tournament.status] || 'Open';
                return (
                  <TournamentCard
                    key={tournament.id}
                    id={tournament.id}
                    name={tournament.title}
                    date={tournament.date}
                    location={tournament.location}
                    currentSpots={tournament.currentSpots}
                    maxSpots={tournament.maxSpots}
                    status={cardStatus}
                    image={tournament.image || [
                      "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1974&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2031&auto=format&fit=crop"
                    ][index % 3]}
                    categories={Array.isArray(tournament.categories) ? tournament.categories : []}
                    selectedCategory={filterCategory || undefined}
                    priceRange={`${tournament.entryFeeMin || 0} - ${tournament.entryFeeMax || 0}`}
                    registrationEnd={tournament.registrationDeadline}
                    isHot={tournament.status === 'upcoming' && tournament.currentSpots / tournament.maxSpots > 0.7}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {visibleTournaments.map((tournament, index) => {
              const statusMap: Record<string, 'Open' | 'Closed' | 'Upcoming' | 'Full' | 'Registration Closed' | 'Ongoing' | 'Complete'> = {
                open: 'Open',
                closed: 'Closed',
                upcoming: 'Upcoming',
                full: 'Full',
                registration_closed: 'Registration Closed',
                ongoing: 'Ongoing',
                completed: 'Complete',
                cancelled: 'Closed',
                published: 'Upcoming',
              };
              const cardStatus = statusMap[tournament.status] || 'Open';
              return (
                <TournamentCard
                  key={tournament.id}
                  id={tournament.id}
                  name={tournament.title}
                  date={tournament.date}
                  location={tournament.location}
                  currentSpots={tournament.currentSpots}
                  maxSpots={tournament.maxSpots}
                  status={cardStatus}
                  image={tournament.image || [
                    "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1974&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2031&auto=format&fit=crop"
                  ][index % 3]}
                  categories={Array.isArray(tournament.categories) ? tournament.categories : []}
                  selectedCategory={filterCategory || undefined}
                  priceRange={`${tournament.entryFeeMin || 0} - ${tournament.entryFeeMax || 0}`}
                  registrationEnd={tournament.registrationDeadline}
                  isHot={tournament.status === 'upcoming' && tournament.currentSpots / tournament.maxSpots > 0.7}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="container mx-auto px-4 mt-8 flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest">
              <span>
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-3 py-1 border border-white/20 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold tracking-widest"
                >
                  PREV
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-3 py-1 border border-white/20 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold tracking-widest"
                >
                  NEXT
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}