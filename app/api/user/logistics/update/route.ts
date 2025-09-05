import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * PUT /api/user/logistics/update
 * Updates the logistics partner profile and basic user info in a transaction.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      // User fields
      name,
      email,
      // LogisticsPartner fields
      companyName,
      companyAddress,
      businessImage,
      contactNo,
      serviceAreas,
      transportModes,
      estimatedDeliveryTime,
      pricingModel,
      pricingConfig,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Normalize pricingConfig to string array
    let normalizedPricingConfig: string[] = [];
    if (Array.isArray(pricingConfig)) {
      normalizedPricingConfig = pricingConfig.map((v) => String(v));
    } else if (typeof pricingConfig === 'string') {
      // Accept comma-separated string or JSON string array
      try {
        const parsed = JSON.parse(pricingConfig);
        if (Array.isArray(parsed)) {
          normalizedPricingConfig = parsed.map((v: unknown) => String(v));
        } else {
          normalizedPricingConfig = [pricingConfig];
        }
      } catch {
        normalizedPricingConfig = pricingConfig
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      }
    }

    // Run transactional update for User and LogisticsPartner
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { name, email },
      });

      const updatedLogistics = await tx.logisticsPartner.update({
        where: { userId },
        data: {
          companyName,
          companyAddress,
          businessImage,
          contactNo,
          serviceAreas,
          transportModes,
          estimatedDeliveryTime,
          pricingModel,
          // Store pricing configuration as string array
          pricingConfig: normalizedPricingConfig,
        },
      });

      return { user: updatedUser, logisticsPartner: updatedLogistics };
    });

    return NextResponse.json({
      success: true,
      message: 'Logistics profile updated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error updating logistics partner profile:', error);

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { success: false, error: 'Email address is already in use by another account' },
          { status: 409 }
        );
      }

      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { success: false, error: 'User or logistics partner profile not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update logistics profile. Please try again.' },
      { status: 500 }
    );
  }
}