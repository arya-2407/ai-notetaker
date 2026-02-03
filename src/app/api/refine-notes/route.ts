import { NextRequest, NextResponse } from 'next/server';
import { getMoonshotClient } from '@/lib/moonshot';
import { env } from '@/lib/env';

interface CornellNotes {
  cues: string;
  notes: string;
  summary: string;
}

interface RefineRequest {
  currentNotes: CornellNotes;
  instruction: string;
}

const REFINE_NOTES_PROMPT = `You are an expert academic note editor. You will receive Cornell-format notes and an instruction to refine them.

Your task:
1. Read the current notes carefully
2. Apply the user's refinement instruction
3. Return the refined notes in the same JSON format

Important:
- Preserve the Cornell Notes structure (cues, notes, summary)
- Only make changes relevant to the instruction
- Maintain markdown formatting in the notes
- Keep the academic quality high

Return your response as JSON in this exact format:
{
  "cues": "Bullet points of questions and key terms",
  "notes": "Detailed notes using markdown formatting",
  "summary": "Summary per subtopic"
}

Only return the JSON, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as RefineRequest;
    const { currentNotes, instruction } = body;

    if (!currentNotes || !instruction) {
      return NextResponse.json(
        { error: 'Provide currentNotes and instruction' },
        { status: 400 }
      );
    }

    const client = getMoonshotClient();

    const userContent = `## Current Notes (JSON)
${JSON.stringify(currentNotes, null, 2)}

## Refinement Instruction
${instruction}`;

    const completion = await client.chat.completions.create({
      model: env.moonshot.model,
      temperature: 1.0,
      messages: [
        { role: 'system', content: REFINE_NOTES_PROMPT },
        { role: 'user', content: userContent },
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
    console.error('Note refinement error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refine notes' },
      { status: 500 }
    );
  }
}
