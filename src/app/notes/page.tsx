'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotesPreview from '@/components/NotesPreview';
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

  // Save notes to localStorage when they change
  useEffect(() => {
    if (notes) {
      localStorage.setItem('generatedNotes', JSON.stringify(notes));
    }
  }, [notes]);

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

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>

          <h1 className="text-xl font-serif font-semibold text-zinc-900">Your Notes</h1>

          <div className="w-16" /> {/* Spacer for centering */}
        </header>

        {/* Notes Preview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100 mb-6">
          <NotesPreview notes={notes} onNotesChange={setNotes} />
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => {
              localStorage.removeItem('generatedNotes');
              router.push('/');
            }}
            className="px-4 py-2 text-zinc-600 hover:text-zinc-900 transition-colors text-sm"
          >
            Start over
          </button>
          <PDFExport notes={notes} />
        </div>
      </main>
    </div>
  );
}
