'use client';

import { motion } from 'framer-motion';
import TournamentCard from '@/components/shared/TournamentCard';
import GamingButton from '@/components/shared/GamingButton';
// import { Tournament } from '@/types/database';

interface Tournament {
  id: string;
  title: string;
  date: string;
  location: string;
  image: string;
  currentSpots: number;
  maxSpots: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  entryFeeMin: number;
  entryFeeMax: number;
  registrationDeadline: string;
}

export default function HotBracketsSection({ tournaments }: { tournaments?: Tournament[] }) {
  const hasTournaments = tournaments && tournaments.length > 0;

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:32px_32px]" />
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black to-transparent z-10" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10" />
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4"
            >
              UPCOMING <span className="text-arena-red">TOURNAMENTS</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 max-w-xl"
            >
              Tournaments filling up fast. Secure your spot in the arena before registration closes.
            </motion.p>
          </div>
          {hasTournaments && (
            <div className="hidden md:block">
              <GamingButton href="/tournaments" variant="outline">
                View All Tournaments
              </GamingButton>
            </div>
          )}
        </div>

        {hasTournaments ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments!.map((tournament, index) => {
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
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TournamentCard 
                    id={tournament.id}
                    name={tournament.title}
                    date={tournament.date}
                    location={tournament.location}
                    image={tournament.image || ''}
                    currentSpots={tournament.currentSpots}
                    maxSpots={tournament.maxSpots}
                    status={cardStatus}
                    priceRange={`${tournament.entryFeeMin || 0} - ${tournament.entryFeeMax || 0}`}
                    registrationEnd={tournament.registrationDeadline}
                    isHot={true}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="w-full border border-dashed border-gray-700 rounded-lg bg-[#111111] p-32 flex flex-col items-center justify-center text-center">
            <div className="mb-6 text-gray-600">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <h3 className="text-white font-bold font-orbitron text-lg mb-2 uppercase tracking-wide">
              NO TOURNAMENTS AVAILABLE
            </h3>
            <p className="text-gray-500 font-mono text-sm">
              Tournament details will appear here when available.
            </p>
          </div>
        )}

        {hasTournaments && (
          <div className="mt-12 text-center md:hidden">
            <GamingButton href="/tournaments" variant="outline" fullWidth>
              View All Tournaments
            </GamingButton>
          </div>
        )}
      </div>
    </section>
  );
}
