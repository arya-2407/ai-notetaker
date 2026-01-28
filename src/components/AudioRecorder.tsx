'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioSize, setAudioSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const startRecording = async () => {
    try {
      setError(null);
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
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioSize(blob.size);
        onRecordingComplete(blob);

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

    } catch (err) {
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

  // Start waveform visualization when recording
  useEffect(() => {
    if (isRecording) {
      drawWaveform();
    }
  }, [isRecording, drawWaveform]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-6">
        {/* Waveform visualization */}
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
              {audioUrl ? (
                <audio src={audioUrl} controls className="w-full max-w-md px-4" />
              ) : (
                <p className="text-zinc-400 text-sm">Ready to record</p>
              )}
            </div>
          )}
        </div>

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
          className={`
            relative w-20 h-20 rounded-full transition-all duration-300
            flex items-center justify-center
            ${isRecording
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : 'bg-zinc-900 hover:bg-zinc-800'
            }
          `}
        >
          <div
            className={`
              transition-all duration-300
              ${isRecording
                ? 'w-6 h-6 rounded-sm bg-white'
                : 'w-6 h-6 rounded-full bg-red-500'
              }
            `}
          />
          {isRecording && (
            <span className="absolute -bottom-8 text-sm text-zinc-600">
              Recording...
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
