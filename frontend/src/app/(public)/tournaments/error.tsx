'use client';

import { useEffect } from 'react';
import GamingButton from '@/components/shared/GamingButton';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 mt-20">
      <h2 className="text-3xl font-orbitron font-bold text-arena-red mb-4">
        Something went wrong!
      </h2>
      <p className="text-gray-400 font-rajdhani mb-8 max-w-md">
        We couldn&apos;t load the tournaments. Please check your connection or try again.
      </p>
      <GamingButton onClick={() => reset()} variant="outline">
        Try again
      </GamingButton>
    </div>
  );
}
