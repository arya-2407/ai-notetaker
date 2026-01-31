'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import PDFExport from '@/components/PDFExport';

interface CornellNotes {
  cues: string;
  notes: string;
  summary: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<CornellNotes | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refinement state
  const [previousNotes, setPreviousNotes] = useState<CornellNotes | null>(null);
  const [refinementInput, setRefinementInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  useEffect(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem('generatedNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch {
        console.error('Failed to parse saved notes');
      }
    }
    setIsLoading(false);
  }, []);

  const handleRefine = async () => {
    if (!notes || !refinementInput.trim() || isRefining) return;

    setIsRefining(true);
    setRefineError(null);

    try {
      const response = await fetch('/api/refine-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentNotes: notes,
          instruction: refinementInput.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine notes');
      }

      // Store previous notes for undo
      setPreviousNotes(notes);
      // Update notes
      setNotes(data.notes);
      // Save to localStorage
      localStorage.setItem('generatedNotes', JSON.stringify(data.notes));
      // Clear input
      setRefinementInput('');
    } catch (error) {
      setRefineError(error instanceof Error ? error.message : 'Failed to refine notes');
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndo = () => {
    if (!previousNotes) return;
    setNotes(previousNotes);
    localStorage.setItem('generatedNotes', JSON.stringify(previousNotes));
    setPreviousNotes(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!notes) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-600">No notes found</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
        >
          Go back
        </button>
      </div>
    );
  }

  const handleStartOver = () => {
    localStorage.removeItem('generatedNotes');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] py-6 sm:py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-zinc-900 mb-1">
            Your Notes
          </h1>
          <p className="text-zinc-500 text-sm">
            Preview, refine, and download as PDF
          </p>
        </header>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Left Column - Preview & Actions */}
          <div className="flex flex-col gap-4">
            {/* Read-only Markdown Preview - A4 dimensions */}
            <div
              className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden"
              style={{ height: '297mm', maxHeight: '70vh' }}
            >
              <div className="overflow-y-auto h-full">
                {/* Notes Section */}
                <div className="border-b border-zinc-100">
                  <div className="px-4 sm:px-6 py-3 bg-zinc-50 border-b border-zinc-100 sticky top-0">
                    <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                      Notes
                    </h2>
                  </div>
                  <div className="px-4 sm:px-6 py-4">
                    <MarkdownRenderer content={notes.notes} className="text-sm text-zinc-700" />
                  </div>
                </div>

                {/* Cues & Questions Section */}
                <div className="border-b border-zinc-100">
                  <div className="px-4 sm:px-6 py-3 bg-amber-50 border-b border-zinc-100 sticky top-0">
                    <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                      Cues & Questions
                    </h2>
                  </div>
                  <div className="px-4 sm:px-6 py-4">
                    <MarkdownRenderer content={notes.cues} className="text-sm text-zinc-700" />
                  </div>
                </div>

                {/* Summary Section */}
                <div>
                  <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-zinc-100 sticky top-0">
                    <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                      Summary
                    </h2>
                  </div>
                  <div className="px-4 sm:px-6 py-4">
                    <MarkdownRenderer content={notes.summary} className="text-sm text-zinc-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <PDFExport notes={notes} prominent />
              <button
                onClick={handleStartOver}
                className="px-8 py-4 text-lg font-medium rounded-xl border-2 border-zinc-300 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Start over
              </button>
            </div>
          </div>

          {/* Right Column - Refinement UI */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-6 h-fit sticky top-6">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 text-center">Refine Your Notes</h2>
            <p className="text-sm text-zinc-600 mb-4">
              Ask for changes to improve your notes
            </p>

            <div className="flex flex-col gap-2">
              <textarea
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleRefine();
                  }
                }}
                placeholder='"Make it more concise", "Add more depth to topic X", "link some YouTube videos in the summary"'
                disabled={isRefining}
                rows={4}
                className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400 resize-none"
              />
              <button
                onClick={handleRefine}
                disabled={isRefining || !refinementInput.trim()}
                className="w-full px-4 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isRefining ? (
                  <DotLottieReact
                    src="https://lottie.host/47c3870e-33fd-4f76-bbf7-f40fca2d71f7/U6WWKUzOWH.lottie"
                    loop
                    autoplay
                    style={{ width: 32, height: 32 }}
                  />
                ) : (
                  <>
                    Refine
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              {refineError && (
                <p className="text-sm text-red-600">{refineError}</p>
              )}
              {previousNotes && (
                <button
                  onClick={handleUndo}
                  className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo last refinement
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
