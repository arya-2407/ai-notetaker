import { AssemblyAI } from 'assemblyai';
import { env } from './env';

export function getAssemblyAIClient() {
  if (!env.assemblyai.isConfigured) {
    throw new Error('AssemblyAI API key is not configured');
  }
  return new AssemblyAI({ apiKey: env.assemblyai.apiKey });
}

export async function transcribeAudio(audioData: Buffer): Promise<string> {
  const apiKey = env.assemblyai.apiKey;

  // Step 1: Upload the file to AssemblyAI
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/octet-stream',
    },
    body: new Uint8Array(audioData),
  });

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text();
    throw new Error(`Upload failed: ${uploadResponse.statusText}. ${errorBody}`);
  }

  const uploadResult = await uploadResponse.json();
  const upload_url = uploadResult.upload_url;

  // Validate response
  if (!upload_url) {
    throw new Error('Invalid upload response: missing upload_url');
  }

  // Step 2: Create transcription request
  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ audio_url: upload_url }),
  });

  if (!transcriptResponse.ok) {
    const errorBody = await transcriptResponse.text();
    throw new Error(`Transcription request failed: ${transcriptResponse.statusText}. ${errorBody}`);
  }

  const transcriptResult = await transcriptResponse.json();
  const id = transcriptResult.id;

  if (!id) {
    throw new Error('Invalid transcription response: missing id');
  }

  // Step 3: Poll for completion with timeout
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${id}`;
  const MAX_POLLS = 120; // 120 polls * 3s = 6 minutes max
  const POLL_INTERVAL = 3000;
  let pollCount = 0;

  while (pollCount < MAX_POLLS) {
    const pollingResponse = await fetch(pollingEndpoint, {
      headers: { authorization: apiKey },
    });

    if (!pollingResponse.ok) {
      const errorBody = await pollingResponse.text();
      throw new Error(`Polling failed: ${pollingResponse.statusText}. ${errorBody}`);
    }

    const result = await pollingResponse.json();

    if (result.status === 'completed') {
      return result.text || '';
    }

    if (result.status === 'error') {
      throw new Error(result.error || 'Transcription failed');
    }

    // Status is 'queued' or 'processing', continue polling
    pollCount++;
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }

  // Timeout reached
  throw new Error(`Transcription timeout: exceeded ${MAX_POLLS * POLL_INTERVAL / 1000} seconds`);
}
