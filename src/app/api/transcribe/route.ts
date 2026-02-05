import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/assemblyai';
import { getObjectFromR2, deleteObjectFromR2 } from '@/lib/r2';

interface TranscribeRequest {
  r2Key: string;
}

export async function POST(request: NextRequest) {
  let r2Key: string | undefined;

  try {
    const body = await request.json() as TranscribeRequest;
    r2Key = body.r2Key;

    if (!r2Key || !r2Key.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid or missing r2Key' },
        { status: 400 }
      );
    }

    const buffer = await getObjectFromR2(r2Key);
    const transcript = await transcribeAudio(buffer);

    return NextResponse.json({ transcript });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  } finally {
    if (r2Key) {
      try {
        await deleteObjectFromR2(r2Key);
      } catch {
        // Non-critical — lifecycle policy catches orphans
      }
    }
  }
}
