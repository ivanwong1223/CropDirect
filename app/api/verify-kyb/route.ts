import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const token = process.env.YOUVERIFY_API_KEY || '';
    if (!token) {
      return NextResponse.json({ status: 'error', message: 'YOUVERIFY_API_KEY not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.sandbox.youverify.co/v2/api/verifications/global/company-advance-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token,
      },
      body: JSON.stringify({
        registrationNumber: body.registrationNumber,
        countryCode: body.countryCode,
        isConsent: body.isConsent,
      }),
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return NextResponse.json({ status: 'error', message: 'Invalid JSON response', raw: text }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', data });
  } catch (err) {
    console.error('verify-kyb route error:', err);
    return NextResponse.json({ status: 'error', message: 'Something went wrong.' }, { status: 500 });
  }
}