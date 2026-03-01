export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Search Section Skeleton */}
      <div className="mb-12 space-y-6">
        <div className="h-12 w-full max-w-2xl bg-white/5 rounded-lg animate-pulse" />
        <div className="flex gap-4">
          <div className="h-10 w-40 bg-white/5 rounded animate-pulse" />
          <div className="h-10 w-40 bg-white/5 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-[520px] bg-[#151515] rounded-xl border border-white/5 overflow-hidden">
            <div className="h-64 bg-white/5 animate-pulse" />
            <div className="p-6 space-y-4">
              <div className="h-8 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
              <div className="flex justify-between pt-4">
                <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
                <div className="h-6 w-20 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
