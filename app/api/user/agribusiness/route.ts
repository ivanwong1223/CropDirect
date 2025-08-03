import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get current user's agribusiness information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // Find the user's agribusiness profile
    const agribusiness = await prisma.agribusiness.findUnique({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        tradingType: true,
        primaryCropCategory: true,
        country: true,
        state: true,
        kybStatus: true,
        subscriptionTier: true,
        isKybVerified: true,
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

    if (!agribusiness) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agribusiness profile not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agribusiness
    });

  } catch (error) {
    console.error('Error fetching agribusiness:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch agribusiness information' 
      },
      { status: 500 }
    );
  }
}
