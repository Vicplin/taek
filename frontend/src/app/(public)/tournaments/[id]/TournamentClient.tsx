'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import GamingButton from "@/components/shared/GamingButton";
import { AGE_CATEGORIES_DATA, WEIGHT_CLASSES_DATA, WEIGHT_CLASSES_DISPLAY_DATA } from '@/lib/data/tournament-data';
import { calculateAge, calculateWeightClass } from '@/lib/utils/weight-calculator';
import AddPlayerModal from '@/components/players/AddPlayerModal';
import NoPlayersModal from '@/components/players/NoPlayersModal';
import RegistrationModal from '@/components/tournaments/RegistrationModal';

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

interface RegisteredPlayer {
  name: string;
  club?: string;
  belt?: string;
  events?: string[];
  poomsaeCategory?: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
  price: number;
}

interface Tournament {
  id: string;
  title: string;
  description: string;
  date: string;
  deadline: string;
  location: string;
  address: string;
  spotsTaken: number;
  totalSpots: number;
  status: string;
  fillingFast: boolean;
  image: string;
  unlimitedSpots?: boolean;
}

const BRACKET_IMAGE_URL =
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1600&auto=format&fit=crop';

const CATEGORY_STYLES: Record<string, string> = {
  'KYORUGI': 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]',
  'POOMSAE': 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]',
  'VIRTUAL_REALITY': 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]',
  'BREAKING': 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]',
  'SPEED_KICKING': 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]',
  'FREESTYLE': 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]',
  'ALL': 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
};

const CATEGORY_UNSELECTED_STYLES: Record<string, string> = {
  'KYORUGI': 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30',
  'POOMSAE': 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/30',
  'VIRTUAL_REALITY': 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 hover:border-green-500/30',
  'BREAKING': 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 hover:border-orange-500/30',
  'SPEED_KICKING': 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-500/30',
  'FREESTYLE': 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30',
  'ALL': 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10 hover:border-white/20'
};

const CATEGORY_TYPE_CONFIG: Record<string, { image: string; label: string; color: string }> = {
  KYORUGI: { image: '/images/Kyorugi.png', label: 'KYORUGI (SPARRING)', color: '#FF0000' },
  POOMSAE: { image: '/images/Poomsae.png', label: 'POOMSAE', color: '#FFD700' },
  VIRTUAL_REALITY: { image: '/images/Vr.png', label: 'VR TAEKWONDO', color: '#00FF00' },
  BREAKING: { image: '/images/breaking.png', label: 'BREAKING', color: '#FFA500' },
  SPEED_KICKING: { image: '/images/SpeedKick.png', label: 'SPEED KICKING', color: '#800080' },
  FREESTYLE: { image: '/images/Freestyle.png', label: 'FREESTYLE', color: '#0000FF' },
};

interface TournamentClientProps {
  tournament: Tournament;
  categories: Category[];
}

export default function TournamentClient({ tournament, categories }: TournamentClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<Set<number>>(new Set());
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [activeTab, setActiveTab] = useState<'category' | 'information' | 'weight' | 'schedule'>('category');
  const [selectedAgeCategory, setSelectedAgeCategory] = useState<string>('senior');
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>('ALL');
  const [previewCategoryType, setPreviewCategoryType] = useState<string | null>(null);
  
  const [showNoPlayerModal, setShowNoPlayerModal] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [hasCheckedPlayers, setHasCheckedPlayers] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<RegisteredPlayer | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const normalizedStatus = tournament.status.trim().toLowerCase();
  const isUnlimited = Boolean(tournament.unlimitedSpots);
  const isRegistrationLocked = ['full', 'registration closed', 'on going', 'ongoing', 'complete', 'closed'].includes(normalizedStatus);
  const statusBadgeClasses =
    normalizedStatus === 'full' ||
    normalizedStatus === 'registration closed' ||
    normalizedStatus === 'closed'
      ? 'px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-wider rounded'
      : 'px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-bold uppercase tracking-wider rounded';
  const lockedButtonLabel =
    normalizedStatus === 'full'
      ? 'TOURNAMENT FULL'
      : normalizedStatus === 'registration closed' || normalizedStatus === 'closed'
      ? 'REGISTRATION CLOSED'
      : normalizedStatus === 'complete'
      ? 'TOURNAMENT COMPLETE'
      : 'TOURNAMENT LOCKED';

  const supabase = createClient();

  // Fetch user's players (available players)
  useEffect(() => {
    const fetchUserPlayers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAvailablePlayers([]);
        setHasCheckedPlayers(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('fighters')
          .select('*, clubs(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching players:', error);
          setAvailablePlayers([]);
        } else if (data) {
          const mappedPlayers: Player[] = data.map((f: any) => ({
            id: f.id,
            full_name: f.full_name,
            belt_rank: f.belt_rank,
            club: f.clubs?.name || '',
            weight: f.weight_kg || 0,
            height: f.height_cm || 0,
            gender: f.gender === 'male' ? 'Male' : f.gender === 'female' ? 'Female' : f.gender,
            birth_date: f.date_of_birth
          }));
          setAvailablePlayers(mappedPlayers);
          if (mappedPlayers.length > 0) {
            setCurrentPlayer(mappedPlayers[0]);
          } else {
             setShowNoPlayerModal(true);
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching players:', err);
      } finally {
        setHasCheckedPlayers(true);
      }
    };

    fetchUserPlayers();
  }, [supabase]);

  // Fetch registered players for this tournament (currently restricted to user's own registrations by RLS)
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .select(`
            category,
            player:fighters (
              full_name,
              belt_rank,
              clubs (name)
            )
          `)
          .eq('tournament_id', tournament.id);

        if (error) {
          console.error('Error fetching registrations:', error);
          return;
        }

        if (data) {
          // Group by player to handle multiple categories per player
          const playerMap = new Map<string, RegisteredPlayer>();
          
          data.forEach((reg: any) => {
            if (!reg.player) return;
            
            const name = reg.player.full_name;
            if (!playerMap.has(name)) {
              playerMap.set(name, {
                name: name,
                club: reg.player.clubs?.name || '',
                belt: reg.player.belt_rank,
                events: [],
                poomsaeCategory: undefined
              });
            }
            
            const player = playerMap.get(name)!;
            if (reg.category) {
              if (reg.category.toLowerCase().includes('poomsae')) {
                player.poomsaeCategory = reg.category;
              } else {
                player.events = [...(player.events || []), reg.category];
              }
            }
          });
          
          setRegisteredPlayers(Array.from(playerMap.values()));
        }
      } catch (err) {
         console.error('Unexpected error fetching registrations:', err);
      }
    };

    fetchRegistrations();
  }, [tournament.id, supabase, showRegistrationModal]); // Re-fetch when registration modal closes (assuming success)



  const handleOpenPlayerModal = (player: RegisteredPlayer) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
    setSelectedPlayer(null);
  };

  const handleDownloadBracketImage = () => {
    if (!selectedPlayer) return;
    try {
      const link = document.createElement('a');
      link.href = BRACKET_IMAGE_URL;
      const safeName = selectedPlayer.name.replace(/\s+/g, '_').toLowerCase();
      link.download = `${safeName}_bracket.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to open bracket image', error);
    }
  };

  const toggleCategory = (id: number) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCategories(newSelected);
  };

  const calculateTotal = () => {
    let total = 0;
    
    selectedCategories.forEach(id => {
      const category = categories.find(c => c.id === id);
      if (category) total += category.price;
    });

    if (hoveredCategory && !selectedCategories.has(hoveredCategory)) {
      const category = categories.find(c => c.id === hoveredCategory);
      if (category) total += category.price;
    }

    return total;
  };

  const handleRegister = () => {
    if (selectedCategories.size === 0) {
      setShowValidationError(true);
      return;
    }
    
    setShowRegistrationModal(true);
  };

  useEffect(() => {
    if (selectedCategories.size > 0) {
      setTimeout(() => {
        setShowValidationError(false);
      }, 0);
    }
  }, [selectedCategories]);

  const totalSpots = tournament.totalSpots;
  const spotsAvailable = isUnlimited ? 0 : Math.max(totalSpots - tournament.spotsTaken, 0);
  const percentageFull = !isUnlimited && totalSpots > 0
    ? Math.min(Math.round((tournament.spotsTaken / totalSpots) * 100), 100)
    : 0;

  // Get unique category types
  const categoryTypes = ['ALL', ...Array.from(new Set(categories.map(c => c.type)))];

  // Filter categories based on selected type
  const filteredCategories = selectedCategoryType === 'ALL' 
    ? categories 
    : categories.filter(c => c.type === selectedCategoryType);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-rajdhani pb-20">
      {/* Background Image Overlay */}
      <div className="fixed inset-0 z-0">
        <Image 
          src={tournament.image} 
          alt="Tournament Background" 
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/90 to-[#0a0a0a]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <NoPlayersModal 
          isOpen={showNoPlayerModal}
          onCreatePlayer={() => {
              setShowNoPlayerModal(false);
              setShowAddPlayerModal(true);
          }}
          onCancel={() => setShowNoPlayerModal(false)}
        />
        <AddPlayerModal
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          onSuccess={() => {
              setShowAddPlayerModal(false);
              setHasCheckedPlayers(false); // Trigger re-check to fetch new player
          }}
        />
        
        {showRegistrationModal && (
          <RegistrationModal
            isOpen={showRegistrationModal}
            onClose={() => setShowRegistrationModal(false)}
            tournamentId={tournament.id}
            selectedCategories={Array.from(selectedCategories).map(id => {
              const category = categories.find(c => c.id === id);
              return category ? { id: category.id, type: category.type, name: category.name } : null;
            }).filter(Boolean) as { id: number; type: string; name: string }[]}
            currentPlayer={currentPlayer}
            tournamentStatus={tournament.status}
          />
        )}

        {showPlayerModal && selectedPlayer && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/80"
              onClick={handleClosePlayerModal}
            />
            <div className="relative w-full max-w-lg bg-[#151515] rounded-xl border border-white/10 p-6 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-orbitron font-bold text-white uppercase tracking-wide">
                    {selectedPlayer.name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedPlayer.club}
                    {selectedPlayer.club && selectedPlayer.belt && ' • '}
                    {selectedPlayer.belt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClosePlayerModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4 text-xs text-gray-400">
                Click download to save this player bracket image.
              </div>

              <div className="w-full aspect-video mb-6 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                <Image
                  src={BRACKET_IMAGE_URL}
                  alt="Tournament bracket"
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-between items-center gap-4">
                {selectedPlayer.events && selectedPlayer.events.length > 0 && (
                  <div className="text-[11px] text-gray-400">
                    Registered for:{' '}
                    {selectedPlayer.events.map(e => e.toUpperCase()).join(', ')}
                    {selectedPlayer.poomsaeCategory
                      ? ` (${selectedPlayer.poomsaeCategory.toUpperCase()})`
                      : ''}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleDownloadBracketImage}
                  className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <Link href="/tournaments" className="inline-flex items-center text-gray-400 hover:text-white mb-8 text-sm font-bold tracking-widest transition-colors group">
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          BACK
        </Link>

          {/* Hero Section */}
        <div className="mb-12">
          {/* Badges */}
          <div className="flex gap-3 mb-6">
            <span className={statusBadgeClasses}>{tournament.status}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-orbitron font-bold text-white mb-6 uppercase tracking-wide leading-tight">
            {tournament.title}
          </h1>

          <p className="text-gray-400 text-lg max-w-3xl mb-12 leading-relaxed">
            {tournament.description}
          </p>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Date Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Event Date</p>
                  <p className="text-white font-bold font-orbitron">{tournament.date}</p>
                </div>
              </div>
            </div>

            {/* Deadline Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Registration Deadline</p>
                  <p className="text-white font-bold font-orbitron">{tournament.deadline}</p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tournament.location}, ${tournament.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors cursor-pointer block"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Venue</p>
                  <p className="text-white font-bold font-orbitron leading-tight mb-1">{tournament.location}</p>
                  <p className="text-gray-500 text-xs truncate max-w-[150px]">{tournament.address}</p>
                </div>
              </div>
            </a>

            {/* Spots Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm hover:border-white/20 transition-colors">
              <div className="flex items-start gap-4 w-full">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="w-full">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Spots Available</p>
                  <p className="text-white font-bold font-orbitron mb-2">
                    {isUnlimited ? 'Unlimited spots available' : `${spotsAvailable} of ${tournament.totalSpots}`}
                  </p>
                  <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-arena-red rounded-full"
                      style={{ width: `${percentageFull}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="border-b border-white/10 mb-8 flex gap-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('category')}
            className={`pb-4 border-b-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'category' 
                ? 'border-arena-red text-arena-red' 
                : 'border-transparent text-gray-500 hover:text-white'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Category
          </button>
          <button 
            onClick={() => setActiveTab('information')}
            className={`pb-4 border-b-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'information' 
                ? 'border-arena-red text-arena-red' 
                : 'border-transparent text-gray-500 hover:text-white'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Information
          </button>
          <button 
            onClick={() => setActiveTab('weight')}
            className={`pb-4 border-b-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'weight' 
                ? 'border-arena-red text-arena-red' 
                : 'border-transparent text-gray-500 hover:text-white'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            Weight
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`pb-4 border-b-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 transition-colors
              ${activeTab === 'schedule' 
                ? 'border-arena-red text-arena-red' 
                : 'border-transparent text-gray-500 hover:text-white'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'category' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-orbitron font-bold text-white flex items-center gap-3">
                    <span className="p-2 bg-red-500/10 rounded-lg text-arena-red border border-red-500/20">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </span>
                    CHOOSE YOUR BATTLEGROUND
                  </h2>
                  <p className="text-gray-400 text-sm mt-2">
                    Select your combat categories. Each category unlocks new challenges - total entry fee calculated based on your selections.
                  </p>
                </div>

                {/* Athlete Profile Card (Moved from Sidebar) */}
                {currentPlayer && (
                  <div className="bg-[#151515] border border-white/10 rounded-xl p-6 relative overflow-hidden mb-6">
                    <div className="relative z-10 mb-6">
                      <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
                        Select Player
                      </h3>
                      
                      {availablePlayers.length > 0 ? (
                        <div className="flex flex-wrap gap-2 items-center">
                          {availablePlayers.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setCurrentPlayer(p)}
                              className={`group relative h-[38px] px-6 flex items-center justify-center overflow-hidden transition-all duration-300 ${
                                currentPlayer.id === p.id
                                  ? 'text-white'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              {/* Active/Hover State Background */}
                              <div 
                                className={`absolute inset-0 transition-colors duration-300 ${
                                  currentPlayer.id === p.id 
                                    ? 'bg-arena-red' 
                                    : 'bg-white/5 group-hover:bg-white/10'
                                }`}
                                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                              />
                              
                              {/* Border Effect for Active Item */}
                              {currentPlayer.id === p.id && (
                                <div 
                                  className="absolute inset-0 bg-arena-red blur-[8px] -z-10"
                                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                                />
                              )}

                              <span className="relative z-10 text-sm font-bold font-orbitron tracking-wide uppercase">
                              {p.full_name}
                            </span>
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setShowAddPlayerModal(true)}
                            className="relative group h-[38px] px-6 flex items-center justify-center overflow-hidden"
                            title="Add new player"
                          >
                            {/* Border Layer */}
                            <div 
                              className="absolute inset-0 bg-white/30 group-hover:bg-white transition-colors duration-300"
                              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            />
                            
                            {/* Inner Background */}
                            <div 
                              className="absolute inset-[1px] bg-[#151515] group-hover:bg-[#1a1a1a] transition-colors duration-300"
                              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                            />
                            
                            {/* Shine Effect - ONLY on Hover of THIS button */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-20 pointer-events-none" />

                            {/* Content */}
                            <span className="relative z-10 flex items-center gap-2 text-xs font-bold font-orbitron tracking-wide text-gray-400 group-hover:text-white transition-colors uppercase">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add New
                            </span>
                          </button>
                        </div>
                      ) : (
                        <h2 className="text-2xl font-bold font-orbitron text-white tracking-wide">
                          {currentPlayer.full_name}
                        </h2>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm relative z-10">
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Gender</p>
                        <p className="text-white font-bold">{currentPlayer.gender}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Age Group</p>
                        <p className="text-white font-bold capitalize">
                          {(() => {
                            const dobString = currentPlayer.birth_date;
                            
                            const age = calculateAge(dobString);
                            
                            const result = calculateWeightClass(
                              currentPlayer.weight,
                              currentPlayer.gender as 'Male' | 'Female',
                              currentPlayer.birth_date
                            );
                            if (!result) return `(${age})`;
                            const label = result.category.replace('-', ' ');
                            return `${label} (${age})`;
                          })()}
                        </p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Club</p>
                        <p className="text-white font-bold truncate">{currentPlayer.club}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Belt</p>
                        <p className="text-white font-bold">{currentPlayer.belt_rank}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Weight Class</p>
                        <p className="text-white font-bold">
                          {calculateWeightClass(currentPlayer.weight, currentPlayer.gender as 'Male' | 'Female', currentPlayer.birth_date)?.weightClass || 'Open'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tournament Category Tabs */}
                <div className="mb-6">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">
                    Tournament Category
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categoryTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setSelectedCategoryType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold font-orbitron tracking-wide uppercase transition-all duration-300
                          ${selectedCategoryType === type 
                            ? (CATEGORY_STYLES[type] || 'bg-arena-red text-white shadow-[0_0_15px_rgba(255,70,85,0.4)]')
                            : (CATEGORY_UNSELECTED_STYLES[type] || 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10')
                          }`}
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-3">
                    Competition Category
                  </h3>
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategories.has(category.id);
                    return (
                      <div 
                        key={category.id}
                        onClick={() => {
                          toggleCategory(category.id);
                          if (CATEGORY_TYPE_CONFIG[category.type]) {
                            setPreviewCategoryType(category.type);
                          }
                        }}
                        onMouseEnter={() => setHoveredCategory(category.id)}
                        onMouseLeave={() => setHoveredCategory(null)}
                        className={`group relative border rounded-lg p-5 flex items-center justify-between transition-all cursor-pointer overflow-hidden
                          ${isSelected 
                            ? 'border-arena-red bg-white/10' 
                            : 'border-white/10 bg-white/5 hover:border-arena-red/50 hover:bg-white/10'
                          }`}
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isSelected ? 'bg-arena-red' : 'bg-transparent group-hover:bg-arena-red'}`} />
                        
                        <div className="flex items-center gap-3">
                          {isSelected && (
                            <div className="text-arena-red">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                          <h3 className={`font-bold text-lg font-orbitron tracking-wide transition-colors ${isSelected ? 'text-arena-red' : 'text-white group-hover:text-arena-red'}`}>
                            {category.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="block text-arena-red font-bold font-orbitron">RM {category.price}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'information' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 bg-red-500/10 rounded-lg text-arena-red border border-red-500/20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <h2 className="text-2xl font-orbitron font-bold text-white uppercase tracking-wide">
                      INTEL FILES
                    </h2>
                  </div>
                  <p className="text-gray-500 text-sm uppercase tracking-widest pl-14">
                    CLASSIFIED // TOURNAMENT DATA
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* File Card 1 */}
                  <div className="group relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden hover:border-arena-red/50 transition-all duration-300">
                    <div className="relative h-48 w-full">
                      <Image 
                        src="https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop"
                        alt="Tournament Bundle"
                        fill
                        className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                      <span className="absolute top-4 right-4 px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                        OFFICIAL
                      </span>
                    </div>
                    
                    <div className="p-6 relative">
                      <h3 className="text-xl font-orbitron font-bold text-white mb-2 group-hover:text-arena-red transition-colors">
                        TOURNAMENT BUNDLE
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 font-mono">
                        <span>PDF</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>5.2 MB</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>24 PAGES</span>
                      </div>
                      
                      <button className="w-full py-3 border border-white/20 rounded-lg text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        DOWNLOAD FILE
                      </button>
                    </div>
                  </div>

                  {/* File Card 2 */}
                  <div className="group relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden hover:border-arena-red/50 transition-all duration-300">
                    <div className="relative h-48 w-full">
                      <Image 
                        src="https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=2000&auto=format&fit=crop"
                        alt="Other Documents"
                        fill
                        className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                      <span className="absolute top-4 right-4 px-2 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                        OFFICIAL
                      </span>
                    </div>
                    
                    <div className="p-6 relative">
                      <h3 className="text-xl font-orbitron font-bold text-white mb-2 group-hover:text-arena-red transition-colors">
                        OTHERS
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-6 font-mono">
                        <span>PDF</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>3.1 MB</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>16 PAGES</span>
                      </div>
                      
                      <button className="w-full py-3 border border-white/20 rounded-lg text-sm font-bold uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        DOWNLOAD FILE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'weight' && (
              <div className="space-y-8">
                {/* Age Categories */}
                <div className="bg-[#151515] border border-white/10 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="p-2 bg-red-500/10 rounded-lg text-arena-red border border-red-500/20">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-xl font-orbitron font-bold text-white uppercase tracking-wide">AGE CATEGORIES</h3>
                      <p className="text-gray-500 text-xs mt-1">Official age divisions for competitions</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {AGE_CATEGORIES_DATA.map((cat) => {
                      const isActive = selectedAgeCategory === cat.id;
                      return (
                        <div 
                          key={cat.id} 
                          onClick={() => setSelectedAgeCategory(cat.id)}
                          className={`relative p-4 rounded-lg border transition-all cursor-pointer hover:opacity-80
                            ${isActive ? cat.activeBorder : cat.border}
                          `}
                        >
                          {isActive && (
                            <div className={`absolute top-2 right-2 ${cat.iconColor}`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                          <div className={`w-2 h-2 rounded-full ${cat.dot} mb-3`} />
                          <h4 className={`font-bold font-orbitron text-sm mb-1 ${cat.color}`}>{cat.name}</h4>
                          <p className="text-gray-400 text-xs">{cat.age}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Weight Classes */}
                {selectedAgeCategory && (
                  <div className="bg-[#151515] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500 border border-yellow-500/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </span>
                      <div>
                        <h3 className="text-xl font-orbitron font-bold text-white uppercase tracking-wide">WEIGHT CLASSES</h3>
                        <p className="text-gray-500 text-xs mt-1">
                          {AGE_CATEGORIES_DATA.find(c => c.id === selectedAgeCategory)?.details}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-xs text-gray-400 uppercase tracking-wider">
                            <th className="py-3 pl-4 font-bold">Weight Class</th>
                            <th className="py-3 font-bold">Male</th>
                            <th className="py-3 font-bold">Female</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {WEIGHT_CLASSES_DISPLAY_DATA[selectedAgeCategory]?.map((weight, idx) => {
                             const activeCategory = AGE_CATEGORIES_DATA.find(c => c.id === selectedAgeCategory);
                             return (
                              <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                <td className="py-4 pl-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${activeCategory?.dot}`} />
                                    <span className="text-white font-bold font-orbitron text-sm">{weight.name}</span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit group-hover:bg-green-500/20 transition-colors">
                                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-green-400 font-mono text-xs font-bold">{weight.male}</span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-lg w-fit group-hover:bg-pink-500/20 transition-colors">
                                    <svg className="w-3 h-3 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="text-pink-400 font-mono text-xs font-bold">{weight.female}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="bg-[#151515] border border-white/10 rounded-xl p-8">
                  <h2 className="text-xl font-orbitron font-bold text-white mb-4 uppercase tracking-wide">
                    TOURNAMENT SCHEDULE
                  </h2>
                  <p className="text-gray-400 font-mono text-sm mb-6">
                    Schedule and bracket information for this tournament.
                  </p>
                </div>

                <div className="bg-[#151515] border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-orbitron font-bold uppercase tracking-widest text-gray-400">
                        Registered Players
                      </h3>
                      <span className="text-xs text-gray-500">
                        {registeredPlayers.length} player
                        {registeredPlayers.length === 1 ? '' : 's'} in this tournament
                      </span>
                    </div>
                    {registeredPlayers.length === 0 ? (
                      <div className="text-gray-500 text-sm">
                        No registered players found for this tournament yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-white/10">
                        {registeredPlayers.map((player, index) => (
                          <li
                            key={`${player.name}-${index}`}
                            className="py-4 flex items-center justify-between gap-4 hover:bg-white/5 px-3 rounded-lg cursor-pointer"
                            onClick={() => handleOpenPlayerModal(player)}
                          >
                            <div>
                              <div className="text-white font-bold text-sm font-orbitron tracking-wide">
                                {player.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {player.club && <span>{player.club}</span>}
                                {player.club && player.belt && <span className="mx-1">•</span>}
                                {player.belt && <span>{player.belt}</span>}
                              </div>
                              {player.events && player.events.length > 0 && (
                                <div className="text-[11px] text-gray-400 mt-1">
                                  Registered for:{' '}
                                  {player.events
                                    .map(e => e.toUpperCase())
                                    .join(', ')}
                                  {player.poomsaeCategory
                                    ? ` (${player.poomsaeCategory.toUpperCase()})`
                                    : ''}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
            <div className="space-y-4 sticky top-8 self-start">
            
              {/* Register Card */}
              <div className="bg-[#151515] border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-orbitron font-bold mb-6">Register Now</h3>
                
                {/* Selected Categories List */}
                {selectedCategories.size > 0 && (
                  <div className="mb-6 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent opacity-50 rounded-lg -z-10" />
                    <div className="border border-red-500/30 bg-black/40 rounded-lg p-5 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="text-arena-red">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h4 className="text-arena-red font-orbitron font-bold text-sm tracking-widest uppercase">
                          {currentPlayer?.full_name || "Guest Player"}
                        </h4>
                      </div>
                      
                      <ul className="space-y-3">
                        {Array.from(selectedCategories).map(id => {
                          const cat = categories.find(c => c.id === id);
                          return cat ? (
                            <li key={id} className="flex items-start gap-3 text-sm group/item">
                              <span className="text-arena-red mt-1.5 w-1.5 h-1.5 rounded-full bg-arena-red flex-shrink-0" />
                              <div className="flex-1 flex justify-between items-start gap-2">
                                <span className="text-white font-bold leading-tight group-hover/item:text-arena-red transition-colors">
                                  {cat.name}
                                </span>
                              </div>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-end mb-6 pb-6 border-b border-white/10">
                  <span className="text-gray-400 text-lg font-medium">Entry</span>
                  <span className="text-3xl font-bold font-orbitron text-white transition-all duration-300">
                    RM {calculateTotal()}
                  </span>
                </div>
                
                {showValidationError && (
                  <div className="mb-4 relative overflow-hidden rounded-lg border border-red-500/50 bg-[#1a0505]">
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500" />
                    
                    <div className="p-4 flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center text-white">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-red-500 font-bold uppercase tracking-wider mb-1 font-orbitron">
                          Selection Required
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          Please select at least one category to register for the tournament.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <GamingButton 
                  onClick={handleRegister}
                  variant="primary" 
                  fullWidth 
                  className="mb-3"
                  disabled={isRegistrationLocked}
                >
                  {isRegistrationLocked ? lockedButtonLabel : 'REGISTER FOR TOURNAMENT'}
                </GamingButton>
                
                <p className="text-center text-gray-500 text-xs">
                  {isUnlimited ? 'Unlimited spots available' : `Only ${spotsAvailable} spots remaining`}
                </p>
              </div>

              {/* Organiser Contact */}
              <div className="bg-[#151515] border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-orbitron font-bold mb-4 text-sm uppercase tracking-wider">Organiser Contact</h3>
                <p className="text-gray-300 font-bold mb-4">Malaysian Taekwondo Association</p>
                
                <div className="space-y-3 text-sm">
                  <a href="mailto:info@klopen.my" className="flex items-center gap-3 text-gray-400 hover:text-arena-red transition-colors">
                    <svg className="w-4 h-4 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    info@klopen.my
                  </a>
                  <a href="tel:+60312345678" className="flex items-center gap-3 text-gray-400 hover:text-arena-red transition-colors">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    +60 3-1234 5678
                  </a>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-[#151515] border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-orbitron font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quick Tips
                </h3>
                
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-arena-red mt-1">▸</span>
                    Bring valid ID and Kukkiwon certificate
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-arena-red mt-1">▸</span>
                    Arrive 1 hour before weigh-in
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-arena-red mt-1">▸</span>
                    Ensure protective gear is WT-approved
                  </li>
                </ul>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
