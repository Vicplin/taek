'use client';

export default function TrainingCentersSection() {
  return (
    <section className="py-20 bg-deep-black overflow-hidden">
      <div className="container mx-auto px-4 mb-10 text-center">
        <h2 className="text-4xl font-orbitron font-medium text-white mb-2">
          Featured <span className="text-arena-red">Training Centers</span>
        </h2>
        <p className="text-gray-500 font-rajdhani text-sm">
          Join elite dojangs across Malaysia
        </p>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="w-full border border-dashed border-gray-700 rounded-lg bg-[#111111] p-32 flex flex-col items-center justify-center text-center">
          <div className="mb-6 text-gray-600">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-white font-bold font-orbitron text-lg mb-2 uppercase tracking-wide">
            NO CLUBS AVAILABLE
          </h3>
          <p className="text-gray-500 font-mono text-sm">
            Club advertisements will appear here when available.
          </p>
        </div>
      </div>
    </section>
  );
}
