import RegistrationForm from '@/components/tournaments/RegistrationForm';

export default async function TournamentRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-orbitron mb-2">TOURNAMENT REGISTRATION</h1>
        <p className="text-gray-400">Complete your registration details below.</p>
      </div>
      
      <RegistrationForm tournamentId={id} />
    </div>
  );
}
