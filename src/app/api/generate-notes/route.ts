import { NextRequest, NextResponse } from 'next/server';
import {
  getMoonshotClient,
  uploadFileToMoonshot,
  getFileContent,
  deleteFile,
  CORNELL_NOTES_PROMPT,
} from '@/lib/moonshot';
import { env } from '@/lib/env';
import { getObjectFromR2, deleteObjectFromR2 } from '@/lib/r2';

interface GenerateNotesRequest {
  transcript?: string;
  pdfR2Keys?: Array<{ key: string; fileName: string }>;
}

export async function POST(request: NextRequest) {
  const uploadedFileIds: string[] = [];
  const r2KeysToClean: string[] = [];

  try {
    const body = await request.json() as GenerateNotesRequest;
    const { transcript = '', pdfR2Keys = [] } = body;

    if (!transcript && pdfR2Keys.length === 0) {
      return NextResponse.json(
        { error: 'Provide a transcript or at least one PDF' },
        { status: 400 }
      );
    }

    // Fetch PDFs from R2, upload to Moonshot, and extract content
    const pdfContents: string[] = [];

    for (const { key, fileName } of pdfR2Keys) {
      if (!key.startsWith('pdf/')) {
        return NextResponse.json(
          { error: `Invalid R2 key: ${key}` },
          { status: 400 }
        );
      }

      r2KeysToClean.push(key);

      const buffer = await getObjectFromR2(key);
      const fileId = await uploadFileToMoonshot(buffer, fileName);
      uploadedFileIds.push(fileId);

      const content = await getFileContent(fileId);
      pdfContents.push(`--- Content from ${fileName} ---\n${content}`);
    }

    // Build the content for the AI
    let lectureContent = '';

    if (transcript) {
      lectureContent += `## Lecture Transcript\n\n${transcript}\n\n`;
    }

    if (pdfContents.length > 0) {
      lectureContent += `## Lecture Slides/Materials\n\n${pdfContents.join('\n\n')}\n\n`;
    }

    // Generate notes using Moonshot
    const client = getMoonshotClient();

    const completion = await client.chat.completions.create({
      model: env.moonshot.model,
      temperature: 1.0,
      messages: [
        { role: 'system', content: CORNELL_NOTES_PROMPT },
        { role: 'user', content: lectureContent },
      ],
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse the JSON response
    let notes;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      notes = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({ notes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate notes' },
      { status: 500 }
    );
  } finally {
    // Clean up Moonshot files
    for (const fileId of uploadedFileIds) {
      try {
        await deleteFile(fileId);
      } catch {
        // Non-critical
      }
    }
    // Clean up R2 objects
    for (const key of r2KeysToClean) {
      try {
        await deleteObjectFromR2(key);
      } catch {
        // Non-critical — lifecycle policy catches orphans
      }
    }
  }
}
