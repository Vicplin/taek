import HeroContent from './HeroContent';
import Image from 'next/image';
import type { LandingStats } from '@/lib/api/landing';

interface HeroSectionProps {
  stats?: LandingStats;
}

export default function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative h-screen min-h-[800px] w-full bg-deep-black overflow-hidden">
      {/* Background Gradient/Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-deep-black via-deep-black/90 to-transparent z-10" />
        <Image 
          src="/images/HomepageModel.png" 
          alt="Taekwondo Sparring" 
          fill
          className="object-cover object-center opacity-40"
          priority
        />
      </div>

      {/* Content */}
      <HeroContent stats={stats} />
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce hidden md:block">
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-2">
          <div className="w-1 h-1 bg-white rounded-full" />
        </div>
      </div>
    </section>
  );
}
