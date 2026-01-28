import { NextResponse } from 'next/server';
import { env, validateEnv } from '@/lib/env';

export async function GET() {
  const { valid, missing } = validateEnv();

  return NextResponse.json({
    status: valid ? 'ok' : 'missing_env',
    env: {
      assemblyai: env.assemblyai.isConfigured,
      moonshot: env.moonshot.isConfigured,
    },
    ...(missing.length > 0 && { missing }),
  });
}
