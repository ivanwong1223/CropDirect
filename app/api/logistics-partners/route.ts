import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/logistics-partners
 * - Without query params: returns a list of logistics partners
 * - With ?id=PARTNER_ID: returns a single logistics partner
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch a single logistics partner by id
      const partner = await prisma.logisticsPartner.findUnique({
        where: { id },
        select: {
          id: true,
          companyName: true,
          businessImage: true,
          estimatedDeliveryTime: true,
          pricingModel: true,
          pricingConfig: true,
          transportModes: true,
          serviceAreas: true,
        },
      });

      if (!partner) {
        return NextResponse.json(
          { success: false, error: 'Logistics partner not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: partner }, { status: 200 });
    }

    // Fetch all logistics partners
    const partners = await prisma.logisticsPartner.findMany({
      select: {
        id: true,
        companyName: true,
        businessImage: true,
        estimatedDeliveryTime: true,
        pricingModel: true,
        pricingConfig: true,
        transportModes: true,
        serviceAreas: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: partners }, { status: 200 });
  } catch (error) {
    console.error('Error fetching logistics partners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logistics partners' },
      { status: 500 }
    );
  }
}