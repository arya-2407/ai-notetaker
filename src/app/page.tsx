'use client';

import { useState } from 'react';
import AudioRecorder from '@/components/AudioRecorder';

export default function Home() {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    console.log('Recording complete:', blob.size, 'bytes');
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

        {/* Placeholder for next steps */}
        <section className="mb-12 opacity-40">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-300 text-white text-sm font-medium">
              2
            </span>
            <h2 className="text-xl font-medium text-zinc-400">Transcribe</h2>
          </div>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-100 text-center text-zinc-400">
            Record audio first
          </div>
        </section>

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
