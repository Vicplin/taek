import { createClient } from '@/lib/supabase/client';
import { Tournament } from './tournaments';

export interface Club {
  name: string;
  is_active?: boolean;
}

export interface Player {
  id: string;
  fullName: string;
  icNumber: string;
  dateOfBirth: string;
  gender: string;
  race: string;
  beltRank: string;
  weightKg: number;
  heightCm: number;
  club?: Club;
  clubId?: string;
  userId: string;
  createdAt: string;
}

export async function getClubs(): Promise<Club[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('name, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }
    
    // Add mock club data
    const clubs = data || [];
    // const mockClub = { name: 'Mock Data Club', is_active: true };
    return clubs;
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return [];
  }
}

export async function getRaces(): Promise<string[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('races')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }
    
    return data?.map(r => r.name) || [];
  } catch (error) {
    console.error('Error fetching races:', error);
    return [];
  }
}

export async function getBeltRanks(): Promise<string[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('belt_ranks')
      .select('name')
      .order('sort_order', { ascending: true });

    if (error) {
      throw error;
    }
    
    return data?.map(b => b.name) || [];
  } catch (error) {
    console.error('Error fetching belt ranks:', error);
    return [];
  }
}

export async function getGenders(): Promise<string[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('genders')
      .select('name')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }
    
    return data?.map(g => g.name) || [];
  } catch (error) {
    console.error('Error fetching genders:', error);
    return [];
  }
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  fighterId: string;
  category: string;
  status: string;
  createdAt: string;
  tournament?: Tournament;
  player?: Player;
}

export async function getMyPlayers(): Promise<Player[]> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${apiUrl}/api/dashboard/players`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch players: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching players from backend:', error);
    throw error;
  }
}

export async function getMyRegistrations(): Promise<TournamentRegistration[]> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${apiUrl}/api/dashboard/registrations`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch registrations: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching registrations from backend:', error);
    throw error;
  }
}
