import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

let s3Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!env.r2.isConfigured) {
    throw new Error('R2 is not configured');
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: env.r2.endpoint,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }

  return s3Client;
}

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 600
): Promise<{ url: string; key: string }> {
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(client, command, { expiresIn });

  return { url, key };
}

export async function getObjectFromR2(key: string): Promise<Buffer> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error(`Object not found in R2: ${key}`);
  }

  const byteArray = await response.Body.transformToByteArray();
  return Buffer.from(byteArray);
}

export async function deleteObjectFromR2(key: string): Promise<void> {
  const client = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: env.r2.bucketName,
    Key: key,
  });

  await client.send(command);
}
