import { NextRequest, NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/r2';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES: Record<string, string> = {
  audio: 'audio/webm',
  'audio-mp3': 'audio/mpeg',
  'audio-wav': 'audio/wav',
  'audio-mp4': 'audio/mp4',
  'audio-ogg': 'audio/ogg',
  pdf: 'application/pdf',
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileType = searchParams.get('type');
    const fileName = searchParams.get('name');

    if (!fileType || !ALLOWED_TYPES[fileType]) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${Object.keys(ALLOWED_TYPES).join(', ')}` },
        { status: 400 }
      );
    }

    const contentType = ALLOWED_TYPES[fileType];
    const prefix = fileType.startsWith('audio') ? 'audio' : 'pdf';
    const extension = fileType.startsWith('audio')
      ? contentType.split('/')[1]
      : 'pdf';

    const uuid = randomUUID();
    const safeName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `upload.${extension}`;
    const key = `${prefix}/${uuid}/${safeName}`;

    const { url } = await generatePresignedUploadUrl(key, contentType);

    return NextResponse.json({ url, key });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
