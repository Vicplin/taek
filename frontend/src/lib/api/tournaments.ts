
export interface Tournament {
  id: string;
  createdAt: string;
  title: string;
  date: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  image: string;
  currentSpots: number;
  maxSpots: number;
  categories: string[];
  description: string;
  registrationDeadline: string;
  organizer: string;
  prizePool: string;
  entryFeeMin?: number;
  entryFeeMax?: number;
}

export async function getTournaments(): Promise<Tournament[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${apiUrl}/api/tournaments`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tournaments: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching tournaments from backend:', error);
    return [];
  }
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${apiUrl}/api/tournaments/${id}`, {
      next: { revalidate: 60 }
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch tournament: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching tournament ${id} from backend:`, error);
    return null;
  }
}
