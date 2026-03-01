interface OccupancyMeterProps {
  current: number;
  max: number;
}

export default function OccupancyMeter({ current, max }: OccupancyMeterProps) {
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  
  // Color based on occupancy
  let colorClass = "bg-blue-500";
  if (percentage >= 90) colorClass = "bg-red-500";
  else if (percentage >= 70) colorClass = "bg-orange-500";
  else if (percentage >= 50) colorClass = "bg-yellow-500";

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 uppercase tracking-wider">
        <span className="text-gray-400">Occupancy</span>
        <span className="text-white font-bold">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
