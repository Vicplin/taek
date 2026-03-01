export default function BottomAd() {
  return (
    <div className="bg-stealth-grey border-t border-white/5 py-8">
      <div className="container mx-auto px-4 text-center">
        <div className="border border-dashed border-gray-700 rounded-lg p-8 bg-deep-black/50 hover:border-arena-red/30 transition-colors group cursor-pointer">
          <p className="text-gray-500 font-rajdhani uppercase tracking-widest text-sm mb-2 group-hover:text-arena-red transition-colors">Advertisement</p>
          <h3 className="text-2xl font-orbitron font-bold text-gray-300 group-hover:text-white transition-colors">
            YOUR BRAND HERE
          </h3>
          <p className="text-gray-600 mt-2 max-w-lg mx-auto group-hover:text-gray-400 transition-colors">
            Reach thousands of martial artists and tournament organisers. Contact us for sponsorship opportunities.
          </p>
        </div>
      </div>
    </div>
  );
}
