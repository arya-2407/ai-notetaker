export const env = {
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
    isConfigured: !!process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY !== 'your_assemblyai_api_key_here',
  },
  moonshot: {
    apiKey: process.env.MOONSHOT_API_KEY || '',
    baseUrl: 'https://api.moonshot.ai/v1',
    model: 'kimi-k2.5',
    isConfigured: !!process.env.MOONSHOT_API_KEY && process.env.MOONSHOT_API_KEY !== 'your_moonshot_api_key_here',
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || '',
    endpoint: process.env.R2_ENDPOINT || '',
    isConfigured: !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_ENDPOINT
    ),
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
