'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import PDFDocumentComponent from './PDFDocument';

interface CornellNotes {
  cues: string;
  notes: string;
  summary: string;
}

interface PDFExportProps {
  notes: CornellNotes;
  title?: string;
  prominent?: boolean;
}

export default function PDFExport({ notes, title = 'Lecture Notes', prominent = false }: PDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      const blob = await pdf(<PDFDocumentComponent notes={notes} title={title} />).toBlob();

      const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const baseClasses = prominent
    ? 'px-8 py-4 text-lg font-medium rounded-xl shadow-md'
    : 'px-6 py-3 rounded-lg';

  const iconSize = prominent ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={`${baseClasses} transition-colors flex items-center gap-2 ${
        isGenerating
          ? 'bg-zinc-400 cursor-not-allowed text-white'
          : 'bg-zinc-900 hover:bg-zinc-800 text-white'
      }`}
    >
      {isGenerating ? (
        <>
          <svg className={`animate-spin ${iconSize}`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </>
      )}
    </button>
  );
}
