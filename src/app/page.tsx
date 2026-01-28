'use client';

import { useState } from 'react';
import AudioRecorder from '@/components/AudioRecorder';

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);

  const TRANSCRIPT_PREVIEW_LENGTH = 500;

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
        <section className="mb-12 opacity-40">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-300 text-white text-sm font-medium">
              3
            </span>
            <h2 className="text-xl font-medium text-zinc-400">Upload Slides (Optional)</h2>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100 text-center text-zinc-400">
            Optional: Upload lecture slides
          </div>
        </section>

        {/* Step 4: Generate Notes */}
        <section className="mb-12 opacity-40">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-300 text-white text-sm font-medium">
              4
            </span>
            <h2 className="text-xl font-medium text-zinc-400">Generate Notes</h2>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100 text-center text-zinc-400">
            Generate Cornell notes
          </div>
        </section>
      </main>
    </div>
  );
}
