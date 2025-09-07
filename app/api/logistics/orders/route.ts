import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/logistics/orders
 * Returns orders assigned to a logistics partner, filtered by status.
 * Query params:
 * - logisticsPartnerId: string (required)
 * - statusNot: string (optional, excludes orders with this status)
 * - status: string (optional, includes only orders with this status)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const logisticsPartnerId = searchParams.get('logisticsPartnerId');
  const statusNot = searchParams.get('statusNot');
  const status = searchParams.get('status');

  if (!logisticsPartnerId) {
    return NextResponse.json(
      { success: false, error: 'Missing logisticsPartnerId' },
      { status: 400 }
    );
  }

  try {
    // Build where clause based on status filtering
    const whereClause: {
      logisticsPartnerId: string;
      status?: string | { not: string };
    } = {
      logisticsPartnerId,
    };

    if (statusNot) {
      whereClause.status = { not: statusNot };
    } else if (status) {
      whereClause.status = status;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { productTitle: true, unitOfMeasurement: true, location: true }
        },
        seller: {
          select: { businessName: true, contactNo: true, businessImage: true }
        },
        buyer: {
          select: { companyName: true, contactNo: true, businessImage: true }
        }
      }
    });

    // Shape response with only the required fields for the list
    const data = orders.map(o => ({
      id: o.id,
      businessName: o.seller.businessName,
      companyName: o.buyer.companyName,
      location: o.product.location,
      deliveryAddress: o.deliveryAddress,
      shippingDistance: o.shippingDistance ?? null,
      status: o.status,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching logistics orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}