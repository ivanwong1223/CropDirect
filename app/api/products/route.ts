import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// GET - Fetch all products or products by agribusiness
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agribusinessId = searchParams.get('agribusinessId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const whereClause: Record<string, string | undefined> = {};
    
    if (agribusinessId) {
      whereClause.agribusinessId = agribusinessId;
    }
    
    if (category) {
      whereClause.cropCategory = category;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        agribusiness: {
          select: {
            businessName: true,
            state: true,
            country: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products' 
      },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      agribusinessId,
      productTitle,
      cropCategory,
      description,
      unitOfMeasurement,
      minimumOrderQuantity,
      quantityAvailable,
      pricing,
      currency,
      allowBidding,
      storageConditions,
      expiryDate,
      location,
      productImages,
      shippingMethod,
      directShippingCost,
      selectedLogistics
    } = body;

    // Validate required fields
    if (!agribusinessId || !productTitle || !cropCategory || !unitOfMeasurement || 
        !minimumOrderQuantity || !quantityAvailable || !pricing || !location) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Verify agribusiness exists
    const agribusiness = await prisma.agribusiness.findUnique({
      where: { id: agribusinessId }
    });

    if (!agribusiness) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Agribusiness not found' 
        },
        { status: 404 }
      );
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        agribusinessId,
        productTitle,
        cropCategory,
        description,
        unitOfMeasurement,
        minimumOrderQuantity: parseInt(minimumOrderQuantity),
        quantityAvailable: parseInt(quantityAvailable),
        pricing: parseFloat(pricing),
        currency: currency || 'RM',
        allowBidding: allowBidding || false,
        storageConditions,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location,
        productImages: productImages || [],
        shippingMethod,
        directShippingCost: directShippingCost ? parseFloat(directShippingCost) : null,
        selectedLogistics,
        status: 'ACTIVE'
      },
      include: {
        agribusiness: {
          select: {
            businessName: true,
            state: true,
            country: true,
          }
        }
      }
    });

    console.log('Created product:', product);

    return NextResponse.json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create product' 
      },
      { status: 500 }
    );
  }
}