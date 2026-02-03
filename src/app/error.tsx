'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
      <div className="text-center max-w-md">
        <h1 className="font-serif text-4xl text-[#1a1a1a] mb-4">
          Something went wrong
        </h1>
        <p className="text-[#666] mb-8">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#333] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
