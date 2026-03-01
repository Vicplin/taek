import NavigationHeader from '@/components/landing/NavigationHeader';
import HeroSection from '@/components/landing/hero/HeroSection';
import SearchSection from '@/components/landing/search/SearchSection';
import HotBracketsSection from '@/components/landing/hot-brackets/HotBracketsSection';
import TrainingCentersSection from '@/components/landing/training-centers/TrainingCentersSection';
import WhyChooseTaekSection from '@/components/landing/about/WhyChooseTaekSection';
import Footer from '@/components/landing/footer/Footer';
import { getLandingData } from '@/lib/api/landing';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function LandingPage() {
  const { featuredTournaments, stats } = await getLandingData();
  
  // Map tournaments to UI model
  const tournaments = (featuredTournaments || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    date: t.date,
    location: t.location || 'TBA',
    image: t.image || '/images/HomepageModel.png',
    currentSpots: t.currentSpots || t.current_spots || 0,
    maxSpots: t.maxSpots || t.max_spots || 100,
    status: t.status?.toLowerCase() as 'upcoming' | 'ongoing' | 'completed' | 'cancelled',
    entryFeeMin: t.entryFeeMin || t.entry_fee_min || 0,
    entryFeeMax: t.entryFeeMax || t.entry_fee_max || 0,
    registrationDeadline: t.registrationDeadline || t.registration_deadline,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-deep-black text-white selection:bg-arena-red selection:text-white">
      <NavigationHeader />

      <main className="flex-grow">
        <HeroSection stats={stats} />
        <SearchSection />
        <HotBracketsSection tournaments={tournaments} />
        <TrainingCentersSection />
        <WhyChooseTaekSection />
      </main>

      <Footer />
    </div>
  );
}
