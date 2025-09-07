import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET /api/logistics/orders/[id]
 * Returns full details for a specific order assigned to a logistics partner.
 * Query params:
 * - logisticsPartnerId: string (required) for access control
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const logisticsPartnerId = searchParams.get('logisticsPartnerId');

  if (!logisticsPartnerId) {
    return NextResponse.json(
      { success: false, error: 'Missing logisticsPartnerId' },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, logisticsPartnerId },
      include: {
        product: {
          select: {
            id: true,
            productTitle: true,
            unitOfMeasurement: true,
            location: true,
            productImages: true,
            storageConditions: true,
          }
        },
        seller: { include: { user: true } },
        buyer: { include: { user: true } },
        transactions: true,
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not assigned to this logistics partner' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PATCH /api/logistics/orders/[id]
 * Updates the status or estimated delivery time of an order.
 * Body: { status?: string, estimatedDeliveryTime?: string }
 * Query params:
 * - logisticsPartnerId: string (required) for access control
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const logisticsPartnerId = searchParams.get('logisticsPartnerId');

  if (!logisticsPartnerId) {
    return NextResponse.json(
      { success: false, error: 'Missing logisticsPartnerId' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { status, estimatedDeliveryTime } = body as { status?: string; estimatedDeliveryTime?: string };

    if (!status && !estimatedDeliveryTime) {
      return NextResponse.json(
        { success: false, error: 'Missing status or estimatedDeliveryTime' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const allowed = ['confirmed', 'Ready to Pickup', 'Picked Up', 'In Transit', 'Delivered'];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    // Ensure order belongs to this logistics partner
    const existing = await prisma.order.findFirst({ where: { id, logisticsPartnerId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not assigned to this logistics partner' },
        { status: 404 }
      );
    }

    // Build update data object
    const updateData: { status?: string; estimatedDeliveryTime?: string } = {};
    if (status) updateData.status = status;
    if (estimatedDeliveryTime) updateData.estimatedDeliveryTime = estimatedDeliveryTime;

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}