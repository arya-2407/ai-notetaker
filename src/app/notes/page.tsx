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
