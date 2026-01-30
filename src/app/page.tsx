'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import AudioRecorder from '@/components/AudioRecorder';
import FileUpload from '@/components/FileUpload';

interface PdfFile {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
}

export default function Home() {
  const router = useRouter();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [notesReady, setNotesReady] = useState(false);

  const TRANSCRIPT_PREVIEW_LENGTH = 500;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handlePdfUpload = (file: File) => {
    const newPdf: PdfFile = {
      id: crypto.randomUUID(),
      file,
      fileName: file.name,
      fileSize: file.size,
    };
    setPdfFiles((prev) => [...prev, newPdf]);
  };

  const removePdf = (id: string) => {
    setPdfFiles((prev) => prev.filter((pdf) => pdf.id !== id));
  };

  const handleGenerateNotes = async () => {
    if (!transcript && pdfFiles.length === 0) return;

    setIsGenerating(true);
    setGenerateError(null);
    setNotesReady(false);

    try {
      const formData = new FormData();
      formData.append('transcript', transcript);

      pdfFiles.forEach((pdf) => {
        formData.append('pdfs', pdf.file);
      });

      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      // Save notes to localStorage for the /notes page
      localStorage.setItem('generatedNotes', JSON.stringify(data.notes));
      setNotesReady(true);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate notes');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewNotes = () => {
    router.push('/notes');
  };

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setTranscript('');
    setTranscribeError(null);
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;

    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transcription failed');
      }

      setTranscript(data.transcript);
    } catch (error) {
      setTranscribeError(error instanceof Error ? error.message : 'Transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-4xl font-serif font-semibold text-zinc-900 mb-3">
            Notetaker
          </h1>
          <p className="text-zinc-600">
            Record lectures, generate Cornell notes
          </p>
        </header>

        {/* Step 1: Audio Recording */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 text-white text-sm font-medium">
              1
            </span>
            <h2 className="text-xl font-medium text-zinc-900">Record Audio</h2>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100">
            <AudioRecorder onRecordingComplete={handleRecordingComplete} />
          </div>

          {audioBlob && (
            <p className="text-sm text-green-600 mt-4 text-center">
              Audio recorded successfully
            </p>
          )}
        </section>

        {/* Step 2: Transcribe */}
        <section className={`mb-12 ${!audioBlob ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium ${audioBlob ? 'bg-zinc-900' : 'bg-zinc-300'}`}>
              2
            </span>
            <h2 className={`text-xl font-medium ${audioBlob ? 'text-zinc-900' : 'text-zinc-400'}`}>Transcribe</h2>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100">
            {!audioBlob ? (
              <p className="text-center text-zinc-400">Record audio first</p>
            ) : transcript ? (
              <div className="relative">
                <p className="text-sm text-zinc-500 mb-2">Transcript:</p>
                <div className={isTranscriptExpanded ? 'max-h-96 overflow-y-auto pr-2' : ''}>
                  <p className="text-zinc-800 leading-relaxed">
                    {isTranscriptExpanded || transcript.length <= TRANSCRIPT_PREVIEW_LENGTH
                      ? transcript
                      : `${transcript.slice(0, TRANSCRIPT_PREVIEW_LENGTH)}...`}
                  </p>
                </div>
                {transcript.length > TRANSCRIPT_PREVIEW_LENGTH && (
                  <div className={isTranscriptExpanded ? 'sticky bottom-0 pt-3 bg-gradient-to-t from-white via-white to-transparent' : 'mt-3'}>
                    <button
                      onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                      className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                    >
                      {isTranscriptExpanded ? 'Collapse' : 'Keep reading'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleTranscribe}
                  disabled={isTranscribing}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
                </button>
                {isTranscribing && (
                  <p className="text-sm text-zinc-500 mt-3">This may take a moment...</p>
                )}
                {transcribeError && (
                  <p className="text-sm text-red-600 mt-3">{transcribeError}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Step 3: Upload Slides (Optional) */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium bg-zinc-900">
              3
            </span>
            <h2 className="text-xl font-medium text-zinc-900">Upload Slides (Optional)</h2>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100">
            {/* List of uploaded PDFs */}
            {pdfFiles.length > 0 && (
              <div className="space-y-3 mb-6">
                {pdfFiles.map((pdf) => (
                  <div key={pdf.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="text-zinc-800 text-sm font-medium">{pdf.fileName}</p>
                        <p className="text-xs text-zinc-500">
                          {formatFileSize(pdf.fileSize)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removePdf(pdf.id)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload area */}
            <div>
              <FileUpload
                onFileSelect={handlePdfUpload}
                accept=".pdf"
                label={pdfFiles.length > 0 ? "Add another PDF" : "Upload lecture slides (PDF)"}
              />
              <p className="text-sm text-zinc-400 mt-3 text-center">
                This step is optional - you can skip to generate notes
              </p>
            </div>
          </div>
        </section>

        {/* Step 4: Generate Notes */}
        <section className={`mb-12 ${!transcript && pdfFiles.length === 0 ? 'opacity-40' : ''}`}>
          <div className="flex items-center gap-3 mb-6">
            <span className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium ${transcript || pdfFiles.length > 0 ? 'bg-zinc-900' : 'bg-zinc-300'}`}>
              4
            </span>
            <h2 className={`text-xl font-medium ${transcript || pdfFiles.length > 0 ? 'text-zinc-900' : 'text-zinc-400'}`}>Generate Notes</h2>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100">
            {!transcript && pdfFiles.length === 0 ? (
              <p className="text-center text-zinc-400">Add a transcript or PDF first</p>
            ) : isGenerating ? (
              <div className="flex flex-col items-center py-8">
                <DotLottieReact
                  src="https://lottie.host/47c3870e-33fd-4f76-bbf7-f40fca2d71f7/U6WWKUzOWH.lottie"
                  loop
                  autoplay
                  style={{ width: 150, height: 150 }}
                />
                <p className="text-zinc-600 mt-4">Generating your notes...</p>
              </div>
            ) : notesReady ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-zinc-800 font-medium mb-4">Notes ready!</p>
                <button
                  onClick={handleViewNotes}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2"
                >
                  View Notes
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleGenerateNotes}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Generate Notes
                </button>
                {generateError && (
                  <p className="text-sm text-red-600 mt-3">{generateError}</p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
