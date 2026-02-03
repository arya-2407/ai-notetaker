import { NextRequest, NextResponse } from 'next/server';
import {
  getMoonshotClient,
  uploadFileToMoonshot,
  getFileContent,
  deleteFile,
  CORNELL_NOTES_PROMPT,
} from '@/lib/moonshot';
import { env } from '@/lib/env';

export async function POST(request: NextRequest) {
  const uploadedFileIds: string[] = [];

  try {
    const formData = await request.formData();
    const transcript = formData.get('transcript') as string || '';
    const pdfFiles = formData.getAll('pdfs') as File[];

    if (!transcript && pdfFiles.length === 0) {
      return NextResponse.json(
        { error: 'Provide a transcript or at least one PDF' },
        { status: 400 }
      );
    }

    // Upload PDFs to Moonshot and get their content
    const pdfContents: string[] = [];

    for (const pdf of pdfFiles) {
      const arrayBuffer = await pdf.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileId = await uploadFileToMoonshot(buffer, pdf.name);
      uploadedFileIds.push(fileId);

      const content = await getFileContent(fileId);
      pdfContents.push(`--- Content from ${pdf.name} ---\n${content}`);
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
      // Extract JSON from response (handle potential markdown code blocks)
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
    console.error('Note generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate notes' },
      { status: 500 }
    );
  } finally {
    // Clean up uploaded files
    for (const fileId of uploadedFileIds) {
      try {
        await deleteFile(fileId);
      } catch {
        // File cleanup failed silently - non-critical
      }
    }
  }
}
