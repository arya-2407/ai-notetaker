export const env = {
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
    isConfigured: !!process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here',
  },
  moonshot: {
    apiKey: process.env.MOONSHOT_API_KEY || '',
    baseUrl: 'https://api.moonshot.ai/v1',
    model: 'kimi-k2.5-preview',
    isConfigured: !!process.env.MOONSHOT_API_KEY && process.env.MOONSHOT_API_KEY !== 'your_moonshot_api_key_here',
  },
};

export function validateEnv() {
  const missing: string[] = [];

  if (!env.assemblyai.isConfigured) {
    missing.push('ASSEMBLYAI_API_KEY');
  }

  if (!env.moonshot.isConfigured) {
    missing.push('MOONSHOT_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
