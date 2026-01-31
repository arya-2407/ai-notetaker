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
    throw new Error(`Upload failed: ${uploadResponse.statusText}`);
  }

  const { upload_url } = await uploadResponse.json();

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
    throw new Error(`Transcription request failed: ${transcriptResponse.statusText}`);
  }

  const { id } = await transcriptResponse.json();

  // Step 3: Poll for completion
  const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${id}`;

  while (true) {
    const pollingResponse = await fetch(pollingEndpoint, {
      headers: { authorization: apiKey },
    });

    const result = await pollingResponse.json();

    if (result.status === 'completed') {
      return result.text || '';
    }

    if (result.status === 'error') {
      throw new Error(result.error || 'Transcription failed');
    }

    // Wait 3 seconds before polling again
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}
