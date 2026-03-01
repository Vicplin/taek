interface TournamentStatusBadgeProps {
  status: 'Open' | 'Closed' | 'Ongoing' | 'Upcoming';
}

export default function TournamentStatusBadge({ status }: TournamentStatusBadgeProps) {
  const styles = {
    Open: "bg-green-500/10 text-green-500 border-green-500/50",
    Closed: "bg-red-500/10 text-red-500 border-red-500/50",
    Ongoing: "bg-blue-500/10 text-blue-500 border-blue-500/50",
    Upcoming: "bg-yellow-500/10 text-yellow-500 border-yellow-500/50",
  };

  return (
    <span className={`px-3 py-1 text-xs font-bold border rounded uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}
