export interface LandingStats {
  activePlayers: number;
  tournaments: number;
  partnerClubs: number;
}

export interface LandingData {
  featuredTournaments: any[];
  stats: LandingStats;
}

export async function getLandingData(): Promise<LandingData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${apiUrl}/api/landing`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch landing data: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching landing data from backend:', error);
    // Return empty data on error to prevent page crash
    return {
      featuredTournaments: [],
      stats: {
        activePlayers: 0,
        tournaments: 0,
        partnerClubs: 0,
      },
    };
  }
}
