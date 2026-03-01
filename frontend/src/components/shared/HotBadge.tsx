export default function HotBadge() {
  return (
    <span className="absolute top-2 right-2 flex items-center gap-1 bg-arena-red text-white text-xs font-bold px-2 py-1 rounded shadow-lg animate-pulse">
      <span className="w-2 h-2 bg-white rounded-full" />
      HOT
    </span>
  );
}
