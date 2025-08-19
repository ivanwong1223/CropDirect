import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

/**
 * GET - Fetch featured sellers based on ratings, product count, and activity
 * Returns top-performing agribusinesses
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const location = searchParams.get('location');

    const whereClause: any = {
      kybStatus: 'APPROVED'
    };
    
    if (location) {
      whereClause.OR = [
        { state: { contains: location, mode: 'insensitive' } },
        { country: { contains: location, mode: 'insensitive' } }
      ];
    }

    // Fetch featured sellers with their product count and recent activity
    const featuredSellers = await prisma.agribusiness.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: 'AVAILABLE'
              }
            }
          }
        },
        products: {
          where: {
            status: 'AVAILABLE'
          },
          select: {
            cropCategory: true,
            imageUrl: true
          },
          take: 3,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: [
        {
          products: {
            _count: 'desc'
          }
        },
        {
          createdAt: 'desc'
        }
      ],
      take: limit
    });

    // Transform data for frontend consumption
    const transformedSellers = featuredSellers.map(seller => {
      const categories = [...new Set(seller.products.map(p => p.cropCategory))];
      
      return {
        id: seller.id,
        businessName: seller.businessName,
        description: seller.description,
        location: `${seller.state}, ${seller.country}`,
        businessImage: seller.businessImage,
        productCount: seller._count.products,
        categories: categories.slice(0, 3), // Top 3 categories
        recentProducts: seller.products.map(p => p.imageUrl).filter(Boolean).slice(0, 3),
        joinedDate: seller.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedSellers,
      message: 'Featured sellers fetched successfully'
    });

  } catch (error) {
    console.error('Error fetching featured sellers:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured sellers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}