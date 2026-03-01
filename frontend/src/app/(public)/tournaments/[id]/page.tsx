import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TournamentClient from "./TournamentClient";
// import { Tournament } from "@/types/database";

interface Tournament {
  id: string;
  title: string;
  description: string;
  date: string;
  registration_deadline: string;
  location: string;
  address: string;
  current_spots: number;
  max_spots: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image: string;
  categories: string[];
  entry_fee_min: number;
  entry_fee_max: number;
}

export default async function TournamentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tournamentData, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tournamentData) {
    console.error("Error fetching tournament:", error);
    notFound();
  }

  const tournament = tournamentData as unknown as Tournament;

  // Transform database tournament to client component props
  const clientTournament = {
    id: tournament.id,
    title: tournament.title,
    description: tournament.description || "",
    date: tournament.date,
    deadline: tournament.registration_deadline || tournament.date, // Fallback to event date
    location: tournament.location,
    address: tournament.address || tournament.location,
    spotsTaken: tournament.current_spots,
    totalSpots: tournament.max_spots || 0,
    status: tournament.status,
    fillingFast: (tournament.max_spots - tournament.current_spots) < 20 && (tournament.max_spots - tournament.current_spots) > 0,
    image: tournament.image || "https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2072&auto=format&fit=crop",
    unlimitedSpots: !tournament.max_spots,
  };

  // Generate categories from the JSONB array
  // If categories is null/undefined, provide defaults or empty array
  const rawCategories = Array.isArray(tournament.categories) 
    ? tournament.categories 
    : [];

  const clientCategories = rawCategories.map((cat: string, index: number) => {
    // Basic mapping logic - can be expanded
    const type = cat.toUpperCase();
    let name = cat;
    
    // Make names prettier
    if (type === 'KYORUGI') name = 'Kyorugi Individual';
    else if (type === 'POOMSAE') name = 'Poomsae Individual';
    else if (type === 'FREESTYLE') name = 'Freestyle Individual';
    else if (type === 'BREAKING') name = 'Breaking Challenge';
    else if (type === 'SPEED_KICKING') name = 'Speed Kicking';
    else if (type === 'VIRTUAL_REALITY') name = 'VR Sparring';

    return {
      id: index + 1, // Simple numeric ID generation
      name: name,
      type: type,
      price: tournament.entry_fee_min || 0,
    };
  });

  // If no categories found, provide at least one default based on title or generic
  if (clientCategories.length === 0) {
    clientCategories.push({
      id: 1,
      name: "General Entry",
      type: "ALL",
      price: tournament.entry_fee_min || 0,
    });
  }

  return (
    <TournamentClient
      tournament={clientTournament}
      categories={clientCategories}
    />
  );
}
