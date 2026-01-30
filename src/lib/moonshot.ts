import OpenAI from 'openai';
import { env } from './env';

export function getMoonshotClient() {
  if (!env.moonshot.isConfigured) {
    throw new Error('Moonshot API key is not configured');
  }

  return new OpenAI({
    apiKey: env.moonshot.apiKey,
    baseURL: env.moonshot.baseUrl,
  });
}

export async function uploadFileToMoonshot(file: Buffer, filename: string): Promise<string> {
  const client = getMoonshotClient();

  // Convert Buffer to Uint8Array for File constructor compatibility
  const uint8Array = new Uint8Array(file);
  const uploadedFile = await client.files.create({
    file: new File([uint8Array], filename, { type: 'application/pdf' }),
    purpose: 'file-extract' as unknown as 'assistants',
  });

  return uploadedFile.id;
}

export async function getFileContent(fileId: string): Promise<string> {
  const apiKey = env.moonshot.apiKey;

  const response = await fetch(`${env.moonshot.baseUrl}/files/${fileId}/content`, {
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get file content: ${response.statusText}`);
  }

  return response.text();
}

export async function deleteFile(fileId: string): Promise<void> {
  const apiKey = env.moonshot.apiKey;

  await fetch(`${env.moonshot.baseUrl}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${apiKey}`,
    },
  });
}

export const CORNELL_NOTES_PROMPT = `You are an expert academic note-taker. Generate comprehensive Cornell-format notes from the provided lecture content.

Cornell Notes Format:
1. **Cues (Left Column)**: Key questions, terms, and prompts that help recall main ideas
2. **Notes (Right Column)**: Detailed notes, explanations, examples, and important points. Do not make this concise, the objective here is to provide depth and complete understanding of the topic.
3. **Summary (Bottom)**: Infer subropics and write a 3-4 sentence summary for each

Instructions:
- Extract all key concepts, definitions, and important details
- Create meaningful cue questions that test understanding
- Organize notes logically by topic/theme
- Include any formulas, diagrams descriptions, or visual elements mentioned
- The summary should capture the essence of the entire lecture
- you are being fed: either a transcript of the professor talking or the lecture slides or both (most probably both).
- the professor may or may not reference the slides
- the professor may also reference the whiteboard they are writing on. However, you do not have context of the whiteboard, so do not try to fill in the gaps when unclear about something.

Return your response as JSON in this exact format:
{
  "cues": "Bullet points of questions and key terms, one per line",
  "notes": "Detailed notes organized by topic, using markdown formatting",
  "summary": "Summary per subtopic"
}

Only return the JSON, no additional text.`;
