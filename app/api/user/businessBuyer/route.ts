import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get current user's Business Buyer information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const buyer = await prisma.businessBuyer.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        companyType: true,
        companyAddress: true,
        contactNo: true,
        businessImage: true,
        loyaltyPoints: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!buyer) {
      return NextResponse.json(
        { success: false, error: 'Business buyer profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: buyer });
  } catch (error) {
    console.error('Error fetching business buyer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business buyer information' },
      { status: 500 }
    );
  }
}
