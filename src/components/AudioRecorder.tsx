'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioSize, setAudioSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#faf9f7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1a1a1a';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, [isRecording]);

  const cleanupAudioUrl = useCallback(() => {
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
    }
  }, [currentAudioUrl]);

  const startRecording = async () => {
    // Prevent double-click
    if (isRecording || isInitializing) return;

    setIsInitializing(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context for visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

        // Cleanup old URL before creating new one
        cleanupAudioUrl();

        const url = URL.createObjectURL(blob);
        setCurrentAudioUrl(url);
        setAudioUrl(url);
        setAudioSize(blob.size);
        onRecordingComplete(blob);

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      // Clear any existing timer BEFORE starting new one
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Start recording FIRST for immediate feedback
      mediaRecorder.start(100);
      setIsRecording(true);
      setIsInitializing(false);
      setDuration(0);
      setAudioUrl(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

    } catch (err) {
      setIsInitializing(false);
      setError('Could not access microphone. Please grant permission.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cleanup old URL
    cleanupAudioUrl();

    const url = URL.createObjectURL(file);
    setCurrentAudioUrl(url);
    setAudioUrl(url);
    setAudioSize(file.size);
    setDuration(0);
    onRecordingComplete(file);
  };

  // Start waveform visualization when recording
  useEffect(() => {
    if (isRecording) {
      drawWaveform();
    }
  }, [isRecording, drawWaveform]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioUrl(); // Revoke URL on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentAudioUrl]);

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-6">
        {/* Waveform / Audio player */}
        {audioUrl && !isRecording ? (
          <div className="flex items-center gap-2 w-full max-w-md px-4">
            <audio src={audioUrl} controls className="w-full" />
            <a
              href={audioUrl}
              download="recording.webm"
              title="Download recording"
            >
              <svg className="w-6 h-6 text-zinc-900 hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
              </svg>
            </a>
          </div>
        ) : (
          <div className="w-full h-24 bg-[#faf9f7] rounded-lg overflow-hidden border border-zinc-200">
            {isRecording ? (
              <canvas
                ref={canvasRef}
                width={600}
                height={96}
                className="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-400 text-sm">Ready to record</p>
              </div>
            )}
          </div>
        )}

        {/* Duration display */}
        <div className="text-center">
          <p className="text-4xl font-light tracking-tight text-zinc-900 font-mono">
            {formatDuration(duration)}
          </p>
          {audioSize > 0 && !isRecording && (
            <p className="text-sm text-zinc-500 mt-1">
              {formatFileSize(audioSize)}
            </p>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {/* Record button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isInitializing}
          className={`
            relative w-20 h-20 rounded-full transition-all duration-300
            flex items-center justify-center
            ${isInitializing
              ? 'bg-zinc-400 cursor-not-allowed'
              : isRecording
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : 'bg-zinc-900 hover:bg-zinc-800'
            }
          `}
        >
          {isInitializing ? (
            <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <div
              className={`
                transition-all duration-300
                ${isRecording
                  ? 'w-6 h-6 rounded-sm bg-white'
                  : 'w-6 h-6 rounded-full bg-red-500'
                }
              `}
            />
          )}
          {isInitializing && (
            <span className="absolute -bottom-8 text-sm text-zinc-600">
              Initializing...
            </span>
          )}
          {isRecording && (
            <span className="absolute -bottom-8 text-sm text-zinc-600">
              Recording...
            </span>
          )}
        </button>

        {/* File upload option */}
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <span>or</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-zinc-700 underline hover:text-zinc-900"
          >
            upload an audio file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
