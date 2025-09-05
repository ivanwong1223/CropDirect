import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/logistics?userId=UUID
 * Fetches the logistics partner profile associated with the given userId.
 * Returns core profile details used by the dashboard and profile page, along with basic user info.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch the logistics partner profile by userId with selected fields
    const logistics = await prisma.logisticsPartner.findUnique({
      where: { userId },
      select: {
        id: true,
        companyName: true,
        companyAddress: true,
        businessImage: true,
        contactNo: true,
        serviceAreas: true,
        transportModes: true,
        estimatedDeliveryTime: true,
        pricingModel: true,
        pricingConfig: true,
        kybStatus: true,
        isKybVerified: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!logistics) {
      return NextResponse.json(
        {
          success: false,
          error: 'Logistics partner profile not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: logistics,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching logistics partner profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch logistics partner information',
      },
      { status: 500 }
    );
  }
}