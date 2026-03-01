'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateWeightClass } from '@/lib/utils/weight-calculator';
import { motion, AnimatePresence } from 'framer-motion';
import GamingButton from '@/components/shared/GamingButton';

// Define mock player data - REMOVED
// const MOCK_PLAYER = { ... };

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

interface RegistrationFormProps {
  tournamentId: string;
  initialSelectedEvents?: { id: number; type: string; name: string }[];
  onClose?: () => void;
  player?: Player | null;
  tournamentStatus?: string;
  isModal?: boolean;
}

export default function RegistrationForm({ 
  tournamentId, 
  initialSelectedEvents = [], 
  onClose,
  player: propPlayer,
  tournamentStatus,
  isModal
}: RegistrationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null); // Placeholder
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [calculatedClass, setCalculatedClass] = useState<{ category: string; weightClass: string } | null>(null);
  const status: string = 'PENDING';
  
  // Form State
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [poomsaeCategory, setPoomsaeCategory] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const normalizedTournamentStatus = tournamentStatus ? tournamentStatus.trim().toLowerCase() : undefined;
  const isRegistrationLocked = normalizedTournamentStatus ? ['full', 'registration closed', 'on going', 'ongoing', 'complete', 'completed', 'closed'].includes(normalizedTournamentStatus) : false;

  useEffect(() => {
    async function fetchPlayer() {
      // If player prop is provided, use it directly
      if (propPlayer) {
        setPlayer(propPlayer);
        
        // Auto calculate weight class
        const weightClass = calculateWeightClass(
          propPlayer.weight,
          propPlayer.gender as 'Male' | 'Female',
          propPlayer.birth_date
        );
        setCalculatedClass(weightClass);
        
        // Handle props based selection (from Modal)
        if (initialSelectedEvents.length > 0) {
          const events = new Set<string>();
          let pType = '';
          
          initialSelectedEvents.forEach(cat => {
            events.add(cat.type.toLowerCase());
            if (cat.type === 'POOMSAE') {
              if (cat.name.includes('INDIVIDUAL')) pType = 'individual';
              else if (cat.name.includes('PAIR')) pType = 'pair';
              else if (cat.name.includes('TEAM')) pType = 'team';
            }
          });
          
          setSelectedEvents(Array.from(events));
          setPoomsaeCategory(pType);
        } else {
            // Fallback if no events selected but player exists
             if (weightClass) {
                setSelectedEvents(['kyorugi']);
             }
        }
        
        setLoading(false);
        return;
      }

      // Fetch from Supabase if no prop provided
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('fighters')
          .select('*, clubs(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
           // If no rows found, single() returns error with code PGRST116
           if (error.code !== 'PGRST116') {
             console.error('Error fetching player:', error);
           }
           setLoading(false);
           return;
        }
        
        if (data) {
          const clubName = Array.isArray(data.clubs) 
            ? (data.clubs[0]?.name ?? '') 
            : (data.clubs?.name ?? '');

          const playerProfile: Player = {
            id: data.id,
            full_name: data.full_name,
            belt_rank: data.belt_rank,
            club: clubName,
            weight: Number(data.weight_kg),
            height: Number(data.height_cm),
            gender: data.gender === 'male' ? 'Male' : data.gender === 'female' ? 'Female' : data.gender,
            birth_date: data.date_of_birth
          };

          setPlayer(playerProfile);
          
          // Auto calculate weight class
          const weightClass = calculateWeightClass(
            playerProfile.weight,
            playerProfile.gender as 'Male' | 'Female',
            playerProfile.birth_date
          );
          setCalculatedClass(weightClass);
          
          // Check for pre-selected events from URL
          const urlEvents = searchParams.getAll('events');
          const urlPoomsaeType = searchParams.get('poomsaeType');
          
          if (initialSelectedEvents.length > 0) {
             // Logic repeated for consistency in case props passed but no player prop
             const events = new Set<string>();
             let pType = '';
             initialSelectedEvents.forEach(cat => {
                events.add(cat.type.toLowerCase());
                if (cat.type === 'POOMSAE') {
                    if (cat.name.includes('INDIVIDUAL')) pType = 'individual';
                    else if (cat.name.includes('PAIR')) pType = 'pair';
                    else if (cat.name.includes('TEAM')) pType = 'team';
                }
             });
             setSelectedEvents(Array.from(events));
             setPoomsaeCategory(pType);
          } else if (urlEvents.length > 0) {
            setSelectedEvents(urlEvents);
            setPoomsaeCategory(urlPoomsaeType || '');
          } else if (weightClass) {
            setSelectedEvents(['kyorugi']);
            setPoomsaeCategory('');
          } else {
            setSelectedEvents([]);
            setPoomsaeCategory('');
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching player:', err);
        setError('Could not load player data.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchPlayer();
  }, [user, supabase, propPlayer, initialSelectedEvents, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!player || isRegistrationLocked) return;
      
      setSubmitting(true);
      setError(null);
      
      try {
        const registrationsToCreate = [];

        if (initialSelectedEvents.length > 0) {
          // Use specific events passed from modal
          initialSelectedEvents.forEach(event => {
             registrationsToCreate.push({
               tournament_id: tournamentId,
               fighter_id: player.id,
               category: event.name,
               status: 'pending'
             });
          });
        } else {
          // Use form selections
          if (selectedEvents.includes('kyorugi') && calculatedClass) {
            registrationsToCreate.push({
               tournament_id: tournamentId,
               fighter_id: player.id,
               category: `KYORUGI ${calculatedClass.category} ${calculatedClass.weightClass}`,
               status: 'pending'
            });
          }
          
          if (selectedEvents.includes('poomsae') && poomsaeCategory) {
            registrationsToCreate.push({
               tournament_id: tournamentId,
               fighter_id: player.id,
               category: `POOMSAE ${poomsaeCategory.toUpperCase()}`,
               status: 'pending'
            });
          }
        }

        if (registrationsToCreate.length === 0) {
           throw new Error("No events selected for registration");
        }

        const { error: insertError } = await supabase
          .from('tournament_registrations')
          .insert(registrationsToCreate);

        if (insertError) throw insertError;
        
        // Show success state
        setIsSuccess(true);
        
      } catch (err: unknown) {
        console.error('Registration error:', err);
        setError(err instanceof Error ? err.message : 'Failed to register');
      } finally {
        setSubmitting(false);
      }
    };

  if (loading) {
    return <div className="text-white text-center py-10">Loading player profile...</div>;
  }

  if (!player) {
    return (
      <div className="text-center py-10 space-y-4">
        <h2 className="text-xl text-white font-bold">No Player Profile Found</h2>
        <p className="text-gray-400">You need to create a player profile before registering.</p>
        <GamingButton onClick={() => router.push(`/tournaments/${tournamentId}`)}>
          Go Back
        </GamingButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.form
            key="registration-form"
            initial={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-8 bg-[#151515] border border-white/10 rounded-xl p-8"
          >
        
        {/* Player Info Summary */}
        <div className="bg-[#151515] border border-white/10 rounded-xl p-6 relative overflow-hidden mb-6">
          <div className="relative z-10 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Selected Player
              </h3>
              {status === 'APPROVED' && (
                <span className="px-3 py-1 rounded text-xs font-bold bg-green-600/20 text-green-400 border border-green-600/30">APPROVED</span>
              )}
              {status === 'PENDING' && (
                <span className="px-3 py-1 rounded text-xs font-bold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">PENDING</span>
              )}
              {status === 'REJECTED' && (
                <span className="px-3 py-1 rounded text-xs font-bold bg-red-600/20 text-red-400 border border-red-600/30">REJECTED</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="group relative h-[38px] px-6 flex items-center justify-center overflow-hidden transition-all duration-300 text-white">
                <div 
                  className="absolute inset-0 transition-colors duration-300 bg-arena-red" 
                  style={{ clipPath: 'polygon(10px 0px, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0px 10px)' }}
                ></div>
                <div 
                  className="absolute inset-0 bg-arena-red blur-[8px] -z-10" 
                  style={{ clipPath: 'polygon(10px 0px, 100% 0px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0px 100%, 0px 10px)' }}
                ></div>
                <span className="relative z-10 text-sm font-bold font-orbitron tracking-wide uppercase">
                  {player.full_name}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm relative z-10">
            <div className="bg-white/5 p-2 rounded border border-white/5">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Club</p>
              <p className="text-white font-bold text-sm truncate">{player.club}</p>
            </div>
            <div className="bg-white/5 p-2 rounded border border-white/5">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Belt</p>
              <p className="text-white font-bold text-sm">{player.belt_rank}</p>
            </div>
            <div className="bg-white/5 p-2 rounded border border-white/5">
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Weight Class</p>
              <p className="text-white font-bold text-sm">{calculatedClass?.weightClass || player.weight + 'kg'}</p>
            </div>
          </div>
        </div>

        {/* Event Selection */}
        <div className="border border-red-500/30 bg-black/40 rounded-lg p-5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-arena-red">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
            </div>
            <h4 className="text-arena-red font-orbitron font-bold text-sm tracking-widest uppercase">Selected Competition Category</h4>
          </div>

          <ul className="space-y-3">
            {initialSelectedEvents.length > 0 ? (
              initialSelectedEvents.map((cat, idx) => (
                <li key={`${cat.id}-${idx}`} className="flex items-start gap-3 text-sm group/item">
                  <span className="text-arena-red mt-1.5 w-1.5 h-1.5 rounded-full bg-arena-red flex-shrink-0"></span>
                  <div className="flex-1 flex justify-between items-start gap-2">
                    <span className="text-white font-bold leading-tight group-hover/item:text-arena-red transition-colors uppercase">
                      {cat.name}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <>
                {/* Kyorugi Option */}
                {selectedEvents.includes('kyorugi') && (
                  <li className="flex items-start gap-3 text-sm group/item">
                    <span className="text-arena-red mt-1.5 w-1.5 h-1.5 rounded-full bg-arena-red flex-shrink-0"></span>
                    <div className="flex-1 flex justify-between items-start gap-2">
                      <span className="text-white font-bold leading-tight group-hover/item:text-arena-red transition-colors uppercase">
                        KYORUGI {calculatedClass ? `${calculatedClass.category} ${calculatedClass.weightClass}` : ''}
                      </span>
                    </div>
                  </li>
                )}

                {/* Poomsae Option */}
                {selectedEvents.includes('poomsae') && (
                  <li className="flex items-start gap-3 text-sm group/item">
                    <span className="text-arena-red mt-1.5 w-1.5 h-1.5 rounded-full bg-arena-red flex-shrink-0"></span>
                    <div className="flex-1 flex justify-between items-start gap-2">
                      <span className="text-white font-bold leading-tight group-hover/item:text-arena-red transition-colors uppercase">
                        POOMSAE {poomsaeCategory ? poomsaeCategory : ''}
                      </span>
                    </div>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="pt-4">
          <GamingButton 
            type="submit" 
            fullWidth 
            disabled={submitting || selectedEvents.length === 0 || (selectedEvents.includes('poomsae') && !poomsaeCategory) || isRegistrationLocked}
          >
            {submitting ? 'REGISTERING...' : `CONFIRM REGISTRATION • RM ${(selectedEvents.length * 150).toFixed(2)}`}
          </GamingButton>
          <p className="text-center text-xs text-gray-500 mt-4">
            By registering, you agree to the tournament rules and regulations.
          </p>
        </div>
          </motion.form>
        ) : (
          <motion.div
            key="success-message"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center p-12 text-center min-h-[400px] bg-[#151515] border border-white/10 rounded-xl"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white font-orbitron mb-4 tracking-wider">REGISTRATION SUBMITTED</h2>
            <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
              Your registration has been successfully submitted to your club. Please wait for your instructor&apos;s approval.
            </p>
            
            <GamingButton 
              onClick={() => {
                if (onClose) onClose();
              }} 
              className="px-12"
            >
              CLOSE
            </GamingButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
