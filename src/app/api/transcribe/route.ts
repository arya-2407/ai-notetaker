import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/assemblyai';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const transcript = await transcribeAudio(buffer);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
