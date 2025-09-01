import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    ...(process.env.AWS_SESSION_TOKEN && { sessionToken: process.env.AWS_SESSION_TOKEN })
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

/**
 * Upload a file to S3
 * @param file - The file buffer to upload
 * @param key - The S3 key (file path) for the uploaded file
 * @param contentType - The MIME type of the file
 * @returns Promise<string> - The S3 URL of the uploaded file
 */
export async function uploadToS3(file: Buffer, key: string, contentType: string): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read' // Make the file publicly accessible
    });

    await s3Client.send(command);
    
    // Return the public URL
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3');
  }
}

/**
 * Generate a unique file key for S3
 * @param originalName - The original filename
 * @param prefix - Optional prefix for the key (e.g., 'products/')
 * @returns string - The generated S3 key
 */
export function generateS3Key(originalName: string, prefix: string = 'products/'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${prefix}${timestamp}-${randomString}.${extension}`;
}

/**
 * Get a presigned URL for uploading (alternative approach)
 * @param key - The S3 key for the file
 * @param contentType - The MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Promise<string> - The presigned URL
 */
export async function getPresignedUploadUrl(
  key: string, 
  contentType: string, 
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read'
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
}

export { s3Client, BUCKET_NAME };