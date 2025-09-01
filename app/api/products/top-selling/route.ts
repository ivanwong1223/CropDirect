import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET - Fetch top-selling products based on order frequency and ratings
 * Returns products sorted by popularity metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const category = searchParams.get('category');

    const whereClause: any = {
      status: 'ACTIVE'
    };
    
    if (category) {
      whereClause.cropCategory = category;
    }

    // Fetch products with order count and average ratings
    const topProducts = await prisma.product.findMany({
      where: whereClause,
      include: {
        agribusiness: {
          select: {
            businessName: true,
            state: true,
            country: true,
            businessImage: true
          }
        },
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: [
        {
          orders: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      take: limit
    });

    // Transform data to include popularity metrics
    const transformedProducts = topProducts.map(product => ({
      id: product.id,
      name: product.productTitle,
      description: product.description,
      price: product.pricing,
      unit: product.unitOfMeasurement,
      cropCategory: product.cropCategory,
      imageUrl: (product.productImages && product.productImages.length > 0) ? product.productImages[0] : null,
      orderCount: product._count.orders,
      seller: {
        name: product.agribusiness.businessName,
        location: `${product.agribusiness.state}, ${product.agribusiness.country}`,
        image: product.agribusiness.businessImage
      }
    }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
      message: 'Top-selling products fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching top-selling products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top-selling products',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}