import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          There was a problem signing you in. The link may have expired or is invalid.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
