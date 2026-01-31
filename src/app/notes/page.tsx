'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <header className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-zinc-900 mb-1">
            Your Notes
          </h1>
          <p className="text-zinc-500 text-sm">
            Preview your notes and download as PDF
          </p>
        </header>

        {/* Read-only Markdown Preview - A4 dimensions */}
        <div
          className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden mx-auto"
          style={{ width: '210mm', maxWidth: '100%', height: '297mm', maxHeight: '70vh' }}
        >
          <div className="overflow-y-auto h-full">
            {/* Notes Section */}
            <div className="border-b border-zinc-100">
              <div className="px-4 sm:px-6 py-3 bg-zinc-50 border-b border-zinc-100 sticky top-0">
                <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                  Notes
                </h2>
              </div>
              <div className="px-4 sm:px-6 py-4 markdown-content">
                <ReactMarkdown>{notes.notes}</ReactMarkdown>
              </div>
            </div>

            {/* Cues & Questions Section */}
            <div className="border-b border-zinc-100">
              <div className="px-4 sm:px-6 py-3 bg-amber-50 border-b border-zinc-100 sticky top-0">
                <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                  Cues & Questions
                </h2>
              </div>
              <div className="px-4 sm:px-6 py-4 markdown-content">
                <ReactMarkdown>{notes.cues}</ReactMarkdown>
              </div>
            </div>

            {/* Summary Section */}
            <div>
              <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-zinc-100 sticky top-0">
                <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                  Summary
                </h2>
              </div>
              <div className="px-4 sm:px-6 py-4 markdown-content">
                <ReactMarkdown>{notes.summary}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Refinement UI */}
        <div className="mt-6 max-w-2xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={refinementInput}
              onChange={(e) => setRefinementInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleRefine();
                }
              }}
              placeholder="Refine your notes..."
              disabled={isRefining}
              className="flex-1 px-4 py-3 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:bg-zinc-50 disabled:text-zinc-400"
            />
            <button
              onClick={handleRefine}
              disabled={isRefining || !refinementInput.trim()}
              className="px-4 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRefining ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Refining...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>
          {refineError && (
            <p className="mt-2 text-sm text-red-600">{refineError}</p>
          )}
          {previousNotes && (
            <button
              onClick={handleUndo}
              className="mt-2 text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo last refinement
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 py-6">
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
      </main>
    </div>
  );
}
