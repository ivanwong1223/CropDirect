import { NextRequest, NextResponse } from 'next/server';
import { uploadToS3, generateS3Key } from '@/lib/s3';

// POST - Upload images to S3
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No files provided' 
        },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` 
          },
          { status: 400 }
        );
      }

      if (file.size > maxFileSize) {
        return NextResponse.json(
          { 
            success: false, 
            error: `File ${file.name} is too large. Maximum size is 5MB.` 
          },
          { status: 400 }
        );
      }
    }

    // Upload files to S3
    const uploadPromises = files.map(async (file) => {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const key = generateS3Key(file.name, 'products/');
        const url = await uploadToS3(buffer, key, file.type);
        
        return {
          originalName: file.name,
          url,
          key,
          size: file.size,
          type: file.type
        };
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}`);
      }
    });

    const uploadResults = await Promise.all(uploadPromises);
    console.log('S3 Bucket Upload results:', uploadResults);

    return NextResponse.json({
      success: true,
      data: {
        files: uploadResults,
        count: uploadResults.length
      },
      message: `Successfully uploaded ${uploadResults.length} file(s)`
    });

  } catch (error) {
    console.error('Error in S3 upload API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload files' 
      },
      { status: 500 }
    );
  }
}

// GET - Get presigned URLs for direct upload (alternative approach)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');

    if (!fileName || !fileType) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'fileName and fileType are required' 
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid file type: ${fileType}. Only JPEG, PNG, and WebP are allowed.` 
        },
        { status: 400 }
      );
    }

    const key = generateS3Key(fileName, 'products/');
    const { getPresignedUploadUrl } = await import('@/lib/s3');
    const presignedUrl = await getPresignedUploadUrl(key, fileType);
    
    const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        publicUrl,
        key,
        fileName
      }
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate presigned URL' 
      },
      { status: 500 }
    );
  }
}