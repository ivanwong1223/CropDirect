import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@/app/generated/prisma';
import { getUserData } from '@/lib/localStorage';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      quantity,
      unitPrice,
      subtotal,
      shippingCost,
      totalAmount,
      buyerInfo,
      shippingCalculation
    } = body;

    // Validate required fields
    if (!productId || !quantity || !unitPrice || !buyerInfo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from session/token (simplified for demo)
    // In a real app, you'd extract this from JWT token or session
    const userData = getUserData();
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Verify product exists and get seller info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        agribusiness: {
          include: {
            user: true
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        // Order details
        productId,
        quantity,
        unitPrice,
        subtotal,
        shippingCost: shippingCost || 0,
        totalAmount,
        status: 'pending',
        
        // Buyer information
        deliveryAddress: buyerInfo.deliveryAddress,
        
        // Shipping calculation details
        estimatedDeliveryTime: shippingCalculation?.deliveryTime || null,
        shippingDistance: shippingCalculation?.distance || null,
        
        // Relationships
        buyerId: userData.id,
        sellerId: product.agribusiness.id,
        
        // Timestamps
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Enhanced GET: supports fetching by orderId OR listing by buyer userId with status/search/sort
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const userId = searchParams.get('userId');

    const statusParam = searchParams.get('status'); // all | active | completed | cancelled | pending | paid | shipped | delivered | cancelled
    const search = searchParams.get('search')?.trim(); // product name / seller
    const sort = searchParams.get('sort') || 'newest'; // newest | oldest | amount

    if (orderId) {
      // Get specific order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          product: {
            include: {
              agribusiness: true
            }
          },
          buyer: true,
          seller: true,
          feedback: true,
        }
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...order,
          orderNumber: order.id
        }
      });
    }

    if (userId) {
      // Build filters for listing
      const whereClause: Prisma.OrderWhereInput = { buyerId: userId };

      if (statusParam && statusParam !== 'all') {
        if (statusParam === 'active') {
          whereClause.status = { in: ['pending', 'paid', 'shipped'] };
        } else if (statusParam === 'completed') {
          whereClause.status = 'delivered';
        } else if (statusParam === 'cancelled') {
          whereClause.status = 'cancelled';
        } else {
          // specific status value
          whereClause.status = statusParam;
        }
      }

      if (search && search.length > 0) {
        whereClause.OR = [
          // Product title
          { product: { is: { productTitle: { contains: search, mode: 'insensitive' } } } },
          // Seller business name (Order.seller -> Agribusiness.businessName)
          { seller: { is: { businessName: { contains: search, mode: 'insensitive' } } } },
          // Seller user name (Order.seller -> Agribusiness.user.name)
          { seller: { is: { user: { is: { name: { contains: search, mode: 'insensitive' } } } } } },
        ];
      }

      let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: 'desc' };
      if (sort === 'oldest') orderBy = { createdAt: 'asc' };
      if (sort === 'amount') orderBy = { totalAmount: 'desc' };

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          product: {
            include: {
              agribusiness: true
            }
          },
          seller: true,
          feedback: true,
        },
        orderBy,
      });

      const ordersWithNumbers = orders.map(order => ({
        ...order,
        orderNumber: order.id
      }));

      return NextResponse.json({
        success: true,
        data: ordersWithNumbers
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing required parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH: update order status/tracking details
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status, action } = body as { orderId?: string; status?: string; action?: string };

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId' },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Business rule: cancel only if not shipped/delivered/cancelled
    if (action === 'cancel') {
      if (['shipped', 'delivered', 'cancelled'].includes(existing.status)) {
        return NextResponse.json(
          { success: false, error: 'Order cannot be cancelled at this stage' },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<Prisma.OrderUpdateInput> = { updatedAt: new Date() };
    if (action === 'cancel') updateData.status = 'cancelled';
    if (status && action !== 'cancel') updateData.status = status;

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        product: { include: { agribusiness: true } },
        buyer: true,
        seller: true,
        feedback: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        orderNumber: order.id
      }
    });

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}