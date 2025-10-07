import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('file') as File | null;
    const registrationNumber = formData.get('registrationNumber') as string | null;

    if (!image || !registrationNumber) {
      return NextResponse.json({ error: 'Missing file or registration number' }, { status: 400 });
    }

    const buffer = await image.arrayBuffer();
    const blob = new Blob([buffer], { type: image.type });

    const ocrApiKey = process.env.OCR_API_KEY || '';
    console.log("ocrApiKey is: ", ocrApiKey);
    if (!ocrApiKey) {
      return NextResponse.json({ error: 'OCR_API_KEY is not configured' }, { status: 500 });
    }

    const ocrFormData = new FormData();
    ocrFormData.append('apikey', ocrApiKey);
    ocrFormData.append('language', 'eng');
    ocrFormData.append('isOverlayRequired', 'false');
    ocrFormData.append('file', blob, image.name);

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: 'OCR API error', details: text }, { status: 502 });
    }

    const result = await response.json();
    const parsedText: string = result?.ParsedResults?.[0]?.ParsedText || '';
    const match = parsedText.includes(registrationNumber);

    return NextResponse.json({ match, parsedText });
  } catch (error) {
    console.error('OCR route error:', error);
    return NextResponse.json({ error: 'OCR failed', details: String(error) }, { status: 500 });
  }
}