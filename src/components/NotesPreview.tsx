'use client';

import { useState, useEffect } from 'react';

interface CornellNotes {
  cues: string;
  notes: string;
  summary: string;
}

interface NotesPreviewProps {
  notes: CornellNotes;
  onNotesChange: (notes: CornellNotes) => void;
}

export default function NotesPreview({ notes, onNotesChange }: NotesPreviewProps) {
  const [editedNotes, setEditedNotes] = useState<CornellNotes>(notes);

  useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);

  const handleChange = (field: keyof CornellNotes, value: string) => {
    const updated = { ...editedNotes, [field]: value };
    setEditedNotes(updated);
    onNotesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-serif font-semibold text-zinc-800">Your Notes</h3>
        <p className="text-xs text-zinc-500 mt-1">Click any section to edit</p>
      </div>

      {/* Notes Section */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200">
          <h4 className="text-sm font-medium text-zinc-700">Notes</h4>
        </div>
        <textarea
          value={editedNotes.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Detailed notes, explanations, examples..."
          className="w-full p-4 text-sm text-zinc-800 bg-white resize-none focus:outline-none focus:bg-zinc-50 transition-colors leading-relaxed min-h-[300px]"
        />
      </div>

      {/* Cues & Questions Section */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-amber-50 border-b border-zinc-200">
          <h4 className="text-sm font-medium text-zinc-700">Cues & Questions</h4>
        </div>
        <textarea
          value={editedNotes.cues}
          onChange={(e) => handleChange('cues', e.target.value)}
          placeholder="Key questions, terms, and prompts..."
          className="w-full p-4 text-sm text-zinc-700 bg-white resize-none focus:outline-none focus:bg-amber-50/30 transition-colors leading-relaxed min-h-[150px]"
        />
      </div>

      {/* Summary Section */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-blue-50 border-b border-zinc-200">
          <h4 className="text-sm font-medium text-zinc-700">Summary</h4>
        </div>
        <textarea
          value={editedNotes.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          placeholder="3-5 sentence summary of main concepts..."
          className="w-full p-4 text-sm text-zinc-800 bg-white resize-none focus:outline-none focus:bg-blue-50/30 transition-colors leading-relaxed min-h-[100px]"
        />
      </div>
    </div>
  );
}
