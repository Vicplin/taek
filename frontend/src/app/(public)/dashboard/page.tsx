'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMyPlayers, getMyRegistrations, getClubs, getRaces, getBeltRanks, getGenders } from '@/lib/api/dashboard';
import { calculateWeightClass, calculateAge } from '@/lib/utils/weight-calculator';
import GamingButton from '@/components/shared/GamingButton';
import TournamentCard from '@/components/shared/TournamentCard';
import AddPlayerModal from '@/components/players/AddPlayerModal';
import EditAccountModal from '@/components/account/EditAccountModal';
import ChangePasswordModal from '@/components/account/ChangePasswordModal';
import BackLink from '@/components/shared/BackLink';

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  options: string[];
  onChange: (name: string, value: string) => void;
  placeholder?: string;
}

interface Player {
  id: string;
  name: string;
  gender: string;
  ageGroup: string;
  club: string;
  belt: string;
  weight: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  ic: string;
  birthday: string;
  race: string;
  heightCm: number;
  weightKg: number;
  phone: string;
}

interface PlayerRow {
  full_name: string;
  ic_number: string;
  date_of_birth: string;
  gender: string;
  race: string;
  belt_rank: string;
  weight_kg: number | null;
  height_cm: number | null;
  clubs: { name: string } | { name: string }[] | null;
}

interface RegisteredPlayer {
  name: string;
  club?: string;
  belt?: string;
  events?: string[];
  poomsaeCategory?: string;
}

const BRACKET_IMAGE_URL =
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1600&auto=format&fit=crop';

function SelectField({ label, name, value, options, onChange, placeholder = 'Select Option' }: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setCoords({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            bottom: window.innerHeight - rect.top + 4,
          });
        }
      };
      updatePosition();
      const handleScroll = (e: Event) => {
        if (dropdownRef.current && e.target === dropdownRef.current) return;
        setIsOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen]);

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 text-left bg-black/40 border rounded-lg transition-all font-rajdhani flex items-center justify-between ${isOpen ? 'border-arena-red ring-1 ring-arena-red' : 'border-white/10 hover:border-white/30'} ${!value ? 'text-gray-600' : 'text-white'}`}
        >
          <span className="truncate">{value || placeholder}</span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180 text-arena-red' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {mounted && createPortal(
          <AnimatePresence>
            {isOpen && (
              <div className="fixed inset-0 z-[9999] isolate">
                <div className="fixed inset-0 bg-transparent" onClick={() => setIsOpen(false)} />
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  style={{ position: 'absolute', bottom: coords.bottom, left: coords.left, width: coords.width }}
                  className="bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-white/5"
                >
                  {options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { onChange(name, option); setIsOpen(false); }}
                      className={`w-full px-4 py-3 text-left font-rajdhani transition-colors ${value === option ? 'bg-arena-red/10 text-arena-red' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      {option}
                    </button>
                  ))}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    </div>
  );
}

export default function UserDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null); // Placeholder
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/');
  };
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tournaments' | 'history'>('tournaments');
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(0);
  const [isPlayerDetailsOpen, setIsPlayerDetailsOpen] = useState(false);
  const [isEditPlayer, setIsEditPlayer] = useState(false);
  const [editForm, setEditForm] = useState<Player | null>(null);
  const [registeredTournaments, setRegisteredTournaments] = useState<any[]>([]);
  const [tournamentsPage, setTournamentsPage] = useState(1);
  const [selectedTournamentAction, setSelectedTournamentAction] = useState<any | null>(null);
  const [isTournamentActionsOpen, setIsTournamentActionsOpen] = useState(false);
  const [showBracketModal, setShowBracketModal] = useState(false);
  const [bracketPlayers, setBracketPlayers] = useState<RegisteredPlayer[]>([]);
  const [selectedBracketPlayer, setSelectedBracketPlayer] = useState<RegisteredPlayer | null>(null);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  const [genderOptions, setGenderOptions] = useState<string[]>([]);
  const [raceOptions, setRaceOptions] = useState<string[]>([]);
  const [beltOptions, setBeltOptions] = useState<string[]>([]);
  const [clubOptions, setClubOptions] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clubs, races, belts, genders] = await Promise.all([
          getClubs(),
          getRaces(),
          getBeltRanks(),
          getGenders()
        ]);
        
        if (clubs) setClubOptions(clubs.map((c: { name: string }) => c.name));
        if (races) setRaceOptions(races);
        if (belts) setBeltOptions(belts);
        if (genders) setGenderOptions(genders);
      } catch (error) {
        console.error('Failed to load data', error);
      }
    };
    fetchData();
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const email = user?.email || 'unknown@email.com';
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '15 Jan 2024';
  const phone = user?.user_metadata?.phone || user?.phone || '-';
  const isParentInitial = Boolean(user?.user_metadata?.is_parent);
  const [isParentLocal, setIsParentLocal] = useState(isParentInitial);

  const [players, setPlayers] = useState<Player[]>([]);
  const visiblePlayers = isParentLocal ? players : players.slice(0, Math.min(players.length, 1));
  const selected = players[selectedPlayerIndex] || players[0];
  const formatBirthday = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

  const TOURNAMENTS_PER_PAGE = 3;
  // Filter tournaments based on status
  const activeRegisteredTournaments = registeredTournaments.filter(t => t.status !== 'completed' && t.status !== 'COMPLETE');
  const completedRegisteredTournaments = registeredTournaments.filter(t => t.status === 'completed' || t.status === 'COMPLETE');
  
  const totalTournamentPages = Math.max(1, Math.ceil(activeRegisteredTournaments.length / TOURNAMENTS_PER_PAGE));
  const currentTournamentPage = Math.min(tournamentsPage, totalTournamentPages);
  const tournamentPageStart = (currentTournamentPage - 1) * TOURNAMENTS_PER_PAGE;
  const visibleTournaments = activeRegisteredTournaments.slice(tournamentPageStart, tournamentPageStart + TOURNAMENTS_PER_PAGE);

  const openTournamentActions = (tournament: any) => {
    setSelectedTournamentAction(tournament);
    setIsTournamentActionsOpen(true);
  };

  useEffect(() => {
    const loadPlayers = async () => {
      if (!user) {
        setPlayers([]);
        return;
      }

      try {
        const data = await getMyPlayers();

        const mapped: Player[] = data.map((row) => {
          const weightKg = row.weightKg || 0;
          const heightCm = row.heightCm || 0;
          const genderDisplay =
            row.gender === 'male' ? 'Male' : row.gender === 'female' ? 'Female' : row.gender;
          const clubName = row.club?.name || '';

          return {
            id: row.id,
            name: row.fullName,
            gender: genderDisplay,
            ageGroup: '',
            club: clubName,
            belt: row.beltRank,
            weight: '',
            status: 'APPROVED',
            ic: row.icNumber,
            birthday: row.dateOfBirth,
            race: row.race,
            heightCm,
            weightKg,
            phone,
          };
        });

        setPlayers(mapped);
      } catch (error) {
        console.error('Unexpected error loading players for dashboard', error);
        setPlayers([]);
      }
    };

    loadPlayers();
  }, [user, supabase]);

  // Fetch registered tournaments from Backend
  useEffect(() => {
    const fetchRegisteredTournaments = async () => {
      if (!user) return;
      
      setLoadingTournaments(true);
      try {
        const data = await getMyRegistrations();

        // Deduplicate tournaments (user might have multiple players in same tournament)
        const uniqueTournamentsMap = new Map();
        
        if (data) {
          data.forEach((item) => {
            if (item.tournament) {
              const t = item.tournament;
              if (!uniqueTournamentsMap.has(t.id)) {
                // Map DB fields to UI expected fields
                uniqueTournamentsMap.set(t.id, {
                  id: t.id,
                  title: t.title,
                  date: t.date,
                  location: t.location,
                  registered: t.currentSpots || 0,
                  capacity: t.maxSpots || 0,
                  deadline: t.registrationDeadline,
                  categories: Array.isArray(t.categories) ? t.categories : [],
                  entryFeeMin: t.entryFeeMin,
                  entryFeeMax: t.entryFeeMax,
                  status: t.status,
                  image: t.image || 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop',
                  registeredPlayers: []
                });
              }
              
              // Add player to the list
              const entry = uniqueTournamentsMap.get(t.id);
              if (item.player) {
                const clubName = item.player.club?.name || '';
                
                // Check if player already added (could be multiple registrations for same player in different categories)
                const existingPlayer = entry.registeredPlayers.find((p: any) => p.name === item.player!.fullName);
                
                if (existingPlayer) {
                  if (item.category && !existingPlayer.events?.includes(item.category)) {
                     existingPlayer.events = [...(existingPlayer.events || []), item.category];
                  }
                } else {
                  entry.registeredPlayers.push({
                    name: item.player.fullName,
                    belt: item.player.beltRank,
                    club: clubName,
                    events: item.category ? [item.category] : [],
                    poomsaeCategory: item.category && item.category.toLowerCase().includes('poomsae') ? item.category : undefined
                  });
                }
              }
            }
          });
        }
        
        setRegisteredTournaments(Array.from(uniqueTournamentsMap.values()));
      } catch (err) {
        console.error('Unexpected error fetching tournaments:', err);
      } finally {
        setLoadingTournaments(false);
      }
    };

    fetchRegisteredTournaments();
  }, [user]);

  useEffect(() => {
    setTimeout(() => {
      setTournamentsPage(1);
    }, 0);
  }, [registeredTournaments.length]);

  useEffect(() => {
    if (isPlayerDetailsOpen) {
      const p = players[selectedPlayerIndex];
      setTimeout(() => {
        setEditForm({ ...p });
        setIsEditPlayer(false);
      }, 0);
    }
  }, [isPlayerDetailsOpen, selectedPlayerIndex, players]);

  useEffect(() => {
    if (!isParentLocal && selectedPlayerIndex > 0) {
      setTimeout(() => {
        setSelectedPlayerIndex(0);
      }, 0);
    }
  }, [isParentLocal, selectedPlayerIndex]);

  useEffect(() => {
    if (!showBracketModal || !selectedTournamentAction) return;
    
    // Use the players we already fetched
    const players = selectedTournamentAction.registeredPlayers || [];
    setBracketPlayers(players);
  }, [showBracketModal, selectedTournamentAction]);

  const handleCloseBracketImage = () => {
    setSelectedBracketPlayer(null);
  };

  const handleDownloadBracketImage = () => {
    if (!selectedBracketPlayer) return;
    try {
      const link = document.createElement('a');
      link.href = BRACKET_IMAGE_URL;
      const safeName = selectedBracketPlayer.name.replace(/\s+/g, '_').toLowerCase();
      link.download = `${safeName}_bracket.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to open bracket image', error);
    }
  };

  const handleSavePlayer = async () => {
    if (!editForm || !editForm.id) return;
    
    try {
      const supabase = createClient();
      
      // Look up club_id if needed
      let clubId = null;
      if (editForm.club) {
        const { data: clubData } = await supabase
          .from('clubs')
          .select('id')
          .eq('name', editForm.club)
          .maybeSingle();
        if (clubData) clubId = clubData.id;
      }

      const { error } = await supabase
        .from('fighters')
        .update({
          full_name: editForm.name,
          ic_number: editForm.ic,
          date_of_birth: editForm.birthday,
          gender: editForm.gender === 'Female' ? 'female' : 'male',
          race: editForm.race,
          belt_rank: editForm.belt,
          weight_kg: editForm.weightKg,
          height_cm: editForm.heightCm,
          club_id: clubId
        })
        .eq('id', editForm.id);

      if (error) throw error;

      setPlayers(prev => prev.map((pl, idx) => idx === selectedPlayerIndex ? { ...pl, ...editForm } : pl));
      setIsEditPlayer(false);
      
      // Refresh data to ensure consistency
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // We could refetch here but local update is faster for UI
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player. Please try again.');
    }
  };

  const handleSignOutClick = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-rajdhani">
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="flex items-start justify-between mb-6">
          <div>
            <BackLink href="/" />
            <h1 className="text-4xl md:text-5xl font-orbitron font-bold tracking-wide">COMMAND CENTER</h1>
          </div>
          <GamingButton onClick={handleSignOutClick} variant="secondary" className="px-6 py-2 text-sm tracking-widest font-bold">
            SIGN OUT
          </GamingButton>
        </div>

        <div className="space-y-10">
          <div className="bg-[#131313] border border-white/10 rounded-xl p-6 relative">
            <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <h2 className="text-white text-lg md:text-xl font-orbitron font-bold uppercase tracking-widest">MY PLAYERS</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isParentLocal && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-arena-red/10 text-arena-red border border-arena-red/30">Parent</span>
                  )}
                  <button onClick={() => setIsEditOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg" title="Edit Account">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1 0v14m7-7H5" /></svg>
                  </button>
                  <button onClick={() => setIsPasswordOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg" title="Change Password">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3 1.343 3 3v3H9v-3c0-1.657 1.343-3 3-3zm0-7a5 5 0 00-5 5v3h10V9a5 5 0 00-5-5z" /></svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Name</div>
                  <div className="text-white font-bold">{displayName}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Email</div>
                  <div className="text-white font-bold">{email}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Phone</div>
                  <div className="text-white font-bold">{phone}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Member Since</div>
                  <div className="text-white font-bold">{joined}</div>
                </div>
              </div>
              
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-orbitron font-bold flex items-center gap-2 tracking-widest">MY PLAYERS <span className="text-gray-500 text-base">({visiblePlayers.length})</span></h2>
            </div>
            <div className="bg-[#151515] border border-white/10 rounded-xl p-6 relative overflow-hidden">
              <div className="relative z-10 mb-6">
            <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>Select Player</h3>
                  {players.length > 0 && selected?.status === 'APPROVED' && (<span className="px-3 py-1 rounded text-xs font-bold bg-green-600/20 text-green-400 border border-green-600/30">APPROVED</span>)}
                  {players.length > 0 && selected?.status === 'PENDING' && (<span className="px-3 py-1 rounded text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">PENDING</span>)}
                  {players.length > 0 && selected?.status === 'REJECTED' && (<span className="px-3 py-1 rounded text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/30">REJECTED</span>)}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  {visiblePlayers.map((p, idx) => (
                    <button key={idx} onClick={() => setSelectedPlayerIndex(idx)} className={`group relative h-[38px] px-6 flex items-center justify-center overflow-hidden transition-all duration-300 ${selectedPlayerIndex===idx ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
                      <div className={`absolute inset-0 transition-colors duration-300 ${selectedPlayerIndex===idx ? 'bg-arena-red' : 'bg-white/5 group-hover:bg-white/10'}`} style={{clipPath:'polygon(10px 0px, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0px 10px)'}} />
                      {selectedPlayerIndex===idx && <div className="absolute inset-0 bg-arena-red blur-[8px] -z-10" style={{clipPath:'polygon(10px 0px, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0px 10px)'}} />}
                      <span className="relative z-10 text-sm font-bold font-orbitron tracking-wide uppercase">{p.name}</span>
                    </button>
                  ))}
                  {(isParentLocal || visiblePlayers.length === 0) && (
                    <button onClick={() => setIsAddPlayerOpen(true)} className="relative group h-[38px] px-6 flex items-center justify-center overflow-hidden" title="Add new player">
                      <div className="absolute inset-0 bg-white/30 group-hover:bg-white transition-colors duration-300" style={{clipPath:'polygon(10px 0px, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0px 10px)'}} />
                      <div className="absolute inset-[1px] bg-[#151515] group-hover:bg-[#1a1a1a] transition-colors duration-300" style={{clipPath:'polygon(10px 0px, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0px 10px)'}} />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out z-20 pointer-events-none" />
                      <span className="relative z-10 flex items-center gap-2 text-xs font-bold font-orbitron tracking-wide text-gray-400 group-hover:text-white transition-colors uppercase"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Add New</span>
                    </button>
                  )}
                </div>
              </div>

              {players.length > 0 && (() => {
                const p = players[selectedPlayerIndex] || players[0];
                return (
                  <>
                    <div className="mb-2" />

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Gender</p>
                        <p className="text-white font-bold">{p.gender}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Age Group</p>
                        <p className="text-white font-bold">
                          {p.ageGroup} ({calculateAge(p.birthday)})
                        </p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Club</p>
                        <p className="text-white font-bold truncate">{p.club}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Belt</p>
                        <p className="text-white font-bold">{p.belt}</p>
                      </div>
                      <div className="bg-white/5 p-2 rounded border border-white/5">
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Weight Class</p>
                        <p className="text-white font-bold">{p.weight}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <a href="#" onClick={(e)=>{e.preventDefault(); setIsPlayerDetailsOpen(true);}} className="text-sm font-bold text-arena-red hover:text-white transition-colors uppercase tracking-wider inline-flex items-center gap-2">VIEW DETAILS<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></a>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => setActiveTab('tournaments')}
              className={`px-5 py-2 -skew-x-12 border text-sm font-bold tracking-widest uppercase ${activeTab==='tournaments' ? 'bg-arena-red text-white border-arena-red/60' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
            >
              <span className="skew-x-12">TOURNAMENTS</span>
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 -skew-x-12 border text-sm font-bold tracking-widest uppercase ${activeTab==='history' ? 'bg-arena-red text-white border-arena-red/60' : 'border-white/20 text-gray-300 hover:bg-white/10'}`}
            >
              <span className="skew-x-12">HISTORY</span>
            </button>
          </div>

          {activeTab === 'tournaments' ? (
            registeredTournaments.length === 0 ? (
              <div className="bg-[#151515] border border-white/10 rounded-xl p-12 text-center relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
                <div className="flex justify-center mb-4">
                  <svg className="w-10 h-10 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h10v2a5 5 0 01-5 5h0a5 5 0 01-5-5V4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v1a3 3 0 003 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v1a3 3 0 01-3 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15a3 3 0 006 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8" />
                  </svg>
                </div>
                <h3 className="text-2xl font-orbitron font-bold uppercase tracking-widest mb-2">TOURNAMENT NOT AVAILABLE</h3>
                <p className="text-gray-500 mb-6">But check out the tournaments below!</p>
                <GamingButton href="/tournaments" variant="primary" className="px-8 py-3 text-sm tracking-widest font-bold">BROWSE TOURNAMENTS</GamingButton>
              </div>
            ) : (
              <div className="bg-[#151515] border border-white/10 rounded-xl p-8 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-orbitron font-bold uppercase tracking-widest">My Tournaments</h3>
                  <GamingButton
                    href="/tournaments"
                    variant="outline"
                    className="hidden sm:inline-flex px-4 py-2 text-xs tracking-widest font-bold"
                  >
                    BROWSE MORE
                  </GamingButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleTournaments.map(t => {
                    const statusMap: Record<string, 'Open' | 'Closed' | 'Upcoming' | 'Full' | 'Registration Closed' | 'Ongoing' | 'Complete'> = {
                      OPEN: 'Open',
                      CLOSED: 'Closed',
                      UPCOMING: 'Upcoming',
                      FULL: 'Full',
                      REGISTRATION_CLOSED: 'Registration Closed',
                      ONGOING: 'Ongoing',
                      COMPLETE: 'Complete',
                      PUBLISHED: 'Upcoming',
                    };
                    const cardStatus = statusMap[t.status] || 'Open';
                    return (
                      <TournamentCard
                        key={t.id}
                        id={t.id}
                        name={t.title}
                        date={t.date}
                        location={t.location}
                        currentSpots={t.registered}
                        maxSpots={t.capacity}
                        status={cardStatus}
                        image={t.image}
                        categories={t.categories}
                        priceRange={`${t.entryFeeMin} - ${t.entryFeeMax}`}
                        registrationEnd={t.deadline}
                        isHot={t.status === 'OPEN' && t.registered / t.capacity > 0.7}
                        showBackFace
              registeredPlayers={t.registeredPlayers}
              onCardClick={() => openTournamentActions(t)}
            />
          );
        })}
                </div>
                <div className="mt-4 sm:hidden">
                  <GamingButton
                    href="/tournaments"
                    variant="outline"
                    className="w-full px-4 py-2 text-xs tracking-widest font-bold"
                  >
                    BROWSE MORE
                  </GamingButton>
                </div>

                {totalTournamentPages > 1 && (
                  <div className="mt-6 flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest">
                    <span>
                      Page {currentTournamentPage} of {totalTournamentPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTournamentsPage(p => Math.max(1, p - 1))}
                        disabled={currentTournamentPage === 1}
                        className="px-3 py-1 border border-white/20 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-bold tracking-widest"
                      >
                        PREV
                      </button>
                      <button
                        type="button"
                        onClick={() => setTournamentsPage(p => Math.min(totalTournamentPages, p + 1))}
                        disabled={currentTournamentPage === totalTournamentPages}
                        className="px-3 py-1 border border-arena-red/60 rounded-md bg-arena-red/80 hover:bg-arena-red text-[11px] font-bold tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        NEXT
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            completedRegisteredTournaments.length === 0 ? (
              <div className="bg-[#151515] border border-white/10 rounded-xl p-12 text-center relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
                <div className="flex justify-center mb-4">
                  <svg className="w-10 h-10 text-arena-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4h10v2a5 5 0 01-5 5h0a5 5 0 01-5-5V4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v1a3 3 0 003 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4v1a3 3 0 01-3 3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15a3 3 0 006 0" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v3" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8" />
                  </svg>
                </div>
                <h3 className="text-2xl font-orbitron font-bold uppercase tracking-widest mb-2">NO TOURNAMENT HISTORY</h3>
                <p className="text-gray-500">You haven&apos;t participated in any tournaments yet.</p>
                <p className="text-gray-500">Join a tournament to start building your legacy!</p>
              </div>
            ) : (
              <div className="bg-[#151515] border border-white/10 rounded-xl p-8 relative">
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-orbitron font-bold uppercase tracking-widest">Tournament History</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedRegisteredTournaments.map(t => {
                    const statusMap: Record<string, 'Open' | 'Closed' | 'Upcoming' | 'Full' | 'Registration Closed' | 'Ongoing' | 'Complete'> = {
                      OPEN: 'Open',
                      CLOSED: 'Closed',
                      UPCOMING: 'Upcoming',
                      FULL: 'Full',
                      REGISTRATION_CLOSED: 'Registration Closed',
                      ONGOING: 'Ongoing',
                      COMPLETE: 'Complete',
                      PUBLISHED: 'Upcoming',
                    };
                    const cardStatus = statusMap[t.status] || 'Complete';
                    return (
                      <TournamentCard
                        key={t.id}
                        id={t.id}
                        name={t.title}
                        date={t.date}
                        location={t.location}
                        currentSpots={t.registered}
                        maxSpots={t.capacity}
                        status={cardStatus}
                        image={t.image}
                        categories={t.categories}
                        priceRange={`${t.entryFeeMin} - ${t.entryFeeMax}`}
                        registrationEnd={t.deadline}
                        isHot={false}
                        showBackFace
                        onCardClick={() => openTournamentActions(t)}
                      />
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <AddPlayerModal 
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
        onSuccess={() => setIsAddPlayerOpen(false)}
      />
      {user && (
        <EditAccountModal 
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          userId={user.id}
          initialFullName={displayName}
          initialEmail={email}
          initialPhone={phone}
          isParent={isParentLocal}
          onSave={({ isParent }) => setIsParentLocal(isParent)}
        />
      )}
      <ChangePasswordModal 
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />

      {selectedTournamentAction && isTournamentActionsOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center px-4">
          <div
            onClick={() => {
              setIsTournamentActionsOpen(false);
              setSelectedTournamentAction(null);
            }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md bg-[#151515] rounded-xl overflow-hidden border border-white/5">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Tournament</p>
                <h2 className="text-xl font-orbitron font-bold text-white tracking-widest">
                  {selectedTournamentAction.title}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsTournamentActionsOpen(false);
                  setSelectedTournamentAction(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setIsTournamentActionsOpen(false);
                  if (selectedTournamentAction) {
                    router.push(`/tournaments/${selectedTournamentAction.id}`);
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-arena-red/20 flex items-center justify-center text-arena-red">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-4.553A1 1 0 0121 6.414V17a2 2 0 01-2 2H7.414a1 1 0 01-.707-1.707L11 13m4-3l-4 4m4-4H9" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-orbitron font-bold uppercase tracking-widest text-white">
                      View Tournament
                    </div>
                    <div className="text-xs text-gray-400">
                      Open full tournament details and registration
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (selectedTournamentAction) {
                    setShowBracketModal(true);
                  }
                  setIsTournamentActionsOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v4a1 1 0 001 1h4M18 3v4a1 1 0 01-1 1h-4M6 21v-4a1 1 0 011-1h4M18 21v-4a1 1 0 00-1-1h-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-orbitron font-bold uppercase tracking-widest text-white">
                      View Bracket
                    </div>
                    <div className="text-xs text-gray-400">
                      See bracket layout and match progression
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTournamentAction && showBracketModal && (
        <div className="fixed inset-0 z-[135] flex items-center justify-center px-4">
          <div
            onClick={() => setShowBracketModal(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-3xl bg-[#151515] rounded-xl overflow-hidden border border-white/5 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Tournament Bracket</p>
                <h2 className="text-xl font-orbitron font-bold text-white tracking-widest">
                  {selectedTournamentAction.title}
                </h2>
              </div>
              <button
                onClick={() => setShowBracketModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-orbitron font-bold uppercase tracking-widest text-gray-400">
                  Registered Players
                </h3>
                <span className="text-xs text-gray-500">
                  {bracketPlayers.length} player
                  {bracketPlayers.length === 1 ? '' : 's'} in this tournament
                </span>
              </div>
              {bracketPlayers.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  No registered players found for this tournament yet.
                </div>
              ) : (
                <ul className="divide-y divide-white/10">
                  {bracketPlayers.map((player, index) => (
                    <li
                      key={`${player.name}-${index}`}
                      className="py-4 flex items-center justify-between gap-4 hover:bg-white/5 px-3 rounded-lg cursor-pointer"
                      onClick={() => setSelectedBracketPlayer(player)}
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
                            Registered for: {player.events.join(', ')}
                          </div>
                        )}
                        {player.poomsaeCategory && (
                          <div className="text-[11px] text-gray-400 mt-1">
                            Poomsae: {player.poomsaeCategory}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedBracketPlayer && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={handleCloseBracketImage}
          />
          <div className="relative w-full max-w-lg bg-[#151515] rounded-xl border border-white/10 p-6 z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-orbitron font-bold text-white uppercase tracking-wide">
                  {selectedBracketPlayer.name}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedBracketPlayer.club}
                  {selectedBracketPlayer.club && selectedBracketPlayer.belt && ' • '}
                  {selectedBracketPlayer.belt}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseBracketImage}
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDownloadBracketImage}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors"
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

      {(() => {
        const playersLocal = players;
        const p = playersLocal[selectedPlayerIndex];
        return (
          isPlayerDetailsOpen ? (
            <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
              <div onClick={()=>setIsPlayerDetailsOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <div className="relative w-full max-w-2xl bg-[#151515] rounded-xl overflow-hidden border border-white/5 max-h-[90vh] flex flex-col">
                <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-arena-red rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-arena-red rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-arena-red rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-arena-red rounded-br-sm" />
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-orbitron font-bold text-white tracking-widest">PLAYER DETAILS</h2>
                    <button onClick={() => setIsPlayerDetailsOpen(false)} className="text-gray-400 hover:text-white" title="Close">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
                <div className="px-6 pt-4 pb-2 overflow-y-auto custom-scrollbar flex-1">
                  {!isEditPlayer ? (
                    <div className="space-y-4">
                      <div className="bg-black/60 border border-white/10 rounded-lg p-4">
                        <div>
                          <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Player</div>
                          <div className="text-lg md:text-xl font-orbitron font-bold text-white tracking-wide">{p.name}</div>
                          <div className="text-xs text-gray-400 uppercase tracking-widest mt-1">{p.club}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-3">
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Identity Card</div><div className="text-white font-bold">{p.ic}</div></div>
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Birthday</div><div className="text-white font-bold">{formatBirthday(p.birthday)}</div></div>
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Gender</div><div className="text-white font-bold">{p.gender}</div></div>
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Race</div><div className="text-white font-bold">{p.race}</div></div>
                        </div>
                        <div className="space-y-3">
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Belt Rank</div><div className="text-white font-bold">{p.belt}</div></div>
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Age</div><div className="text-white font-bold">{calculateAge(p.birthday)} yrs</div></div>
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Weight</div><div className="text-white font-bold">{p.weightKg} kg</div></div>
                          <div className="bg-black/40 border border-white/10 rounded-lg p-4"><div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Height</div><div className="text-white font-bold">{p.heightCm} cm</div></div>
                        </div>
                      </div>
                      <div className="mt-3 bg-black/40 border border-white/10 rounded-lg p-4">
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Club Affiliation</div>
                        <div className="text-white font-bold">{p.club}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                        <input
                          value={editForm?.name || ''}
                          onChange={e =>
                            setEditForm(prev => (prev ? { ...prev, name: e.target.value } : prev))
                          }
                          placeholder="Enter full name"
                          className="block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani border-white/10 focus:border-arena-red focus:ring-arena-red"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">IC Number</label>
                        <input
                          value={editForm?.ic || ''}
                          onChange={e =>
                            setEditForm(prev => (prev ? { ...prev, ic: e.target.value } : prev))
                          }
                          placeholder="Enter IC Number"
                          className="block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani border-white/10 focus:border-arena-red focus:ring-arena-red"
                        />
                      </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Birth</label>
                            {(editForm?.birthday || p.birthday) && (
                              <span className="text-xs font-bold text-arena-red font-orbitron">
                                {calculateAge(editForm?.birthday || p.birthday)} YEARS OLD
                              </span>
                            )}
                          </div>
                          <input
                            type="date"
                            value={editForm?.birthday || ''}
                            onChange={e =>
                              setEditForm(prev =>
                                prev ? { ...prev, birthday: e.target.value } : prev
                              )
                            }
                            placeholder="dd/mm/yyyy"
                            className="block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani border-white/10 focus:border-arena-red focus:ring-arena-red"
                          />
                        </div>
                        <SelectField
                          label="Gender"
                          name="gender"
                          value={editForm?.gender || ''}
                          options={genderOptions}
                          onChange={(n, v) =>
                            setEditForm(prev => (prev ? { ...prev, [n]: v } : prev))
                          }
                          placeholder="Select Gender"
                        />

                        <SelectField
                          label="Race"
                          name="race"
                          value={editForm?.race || ''}
                          options={raceOptions}
                          onChange={(n, v) =>
                            setEditForm(prev => (prev ? { ...prev, [n]: v } : prev))
                          }
                          placeholder="Select Race"
                        />
                        <SelectField
                          label="Belt Rank"
                          name="belt"
                          value={editForm?.belt || ''}
                          options={beltOptions}
                          onChange={(n, v) =>
                            setEditForm(prev => (prev ? { ...prev, [n]: v } : prev))
                          }
                          placeholder="Select Belt"
                        />

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Weight (kg)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={editForm?.weightKg ?? ''}
                              onChange={e =>
                                setEditForm(prev =>
                                  prev
                                    ? { ...prev, weightKg: Number(e.target.value) }
                                    : prev
                                )
                              }
                              placeholder="0.0"
                              className="block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani border-white/10 focus:border-arena-red focus:ring-arena-red pr-12"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500 font-bold text-xs">KG</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Height (cm)</label>
                          <div className="relative">
                            <input
                              type="number"
                              value={editForm?.heightCm ?? ''}
                              onChange={e =>
                                setEditForm(prev =>
                                  prev
                                    ? { ...prev, heightCm: Number(e.target.value) }
                                    : prev
                                )
                              }
                              placeholder="0.0"
                              className="block w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all font-rajdhani border-white/10 focus:border-arena-red focus:ring-arena-red pr-12"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500 font-bold text-xs">CM</div>
                          </div>
                        </div>

                        {/* Calculated Weight Class */}
                        {editForm?.weightKg && editForm?.gender && (() => {
                          const result = calculateWeightClass(editForm.weightKg, editForm.gender, editForm.birthday);
                          if (result) {
                            return (
                              <div className="md:col-span-2">
                                <div className="bg-arena-red/10 border border-arena-red/20 rounded-lg p-4 flex items-center justify-between shadow-[0_0_15px_rgba(230,57,70,0.1)]">
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold mb-0.5">Weight Class</span>
                                      <span className="text-white font-orbitron font-bold text-xl tracking-wide">{result.weightClass}</span>
                                    </div>
                                  </div>
                                  <div className="text-right border-l border-white/10 pl-4">
                                    <span className="text-xs text-gray-400 block uppercase tracking-wider font-bold mb-0.5">Age Group</span>
                                    <span className="text-arena-red font-bold text-lg">{result.ageGroup}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        <div className="md:col-span-2">
                          <SelectField
                            label="Club"
                            name="club"
                            value={editForm?.club || ''}
                            options={clubOptions}
                            onChange={(n, v) =>
                              setEditForm(prev => (prev ? { ...prev, [n]: v } : prev))
                            }
                            placeholder="Select Club"
                          />
                        </div>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-white/10">
                  {!isEditPlayer ? (
                    <button onClick={() => setIsEditPlayer(true)} className="relative inline-flex items-center justify-center px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all duration-300 clip-path-polygon group overflow-hidden bg-arena-red text-white hover:bg-red-700 shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.6)] w-full" style={{clipPath:'polygon(15px 0px, 100% 0px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0px 100%, 0px 15px)'}}>
                      <span className="relative z-10">EDIT PLAYER</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                    </button>
                  ) : (
                    <button onClick={handleSavePlayer} className="relative inline-flex items-center justify-center px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all duration-300 clip-path-polygon group overflow-hidden bg-arena-red text-white hover:bg-red-700 shadow-[0_0_20px_rgba(230,57,70,0.3)] hover:shadow-[0_0_30px_rgba(230,57,70,0.6)] w-full" style={{clipPath:'polygon(15px 0px, 100% 0px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0px 100%, 0px 15px)'}}>
                      <span className="relative z-10">SAVE PLAYER</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null
        );
      })()}
    </div>
  );
}
