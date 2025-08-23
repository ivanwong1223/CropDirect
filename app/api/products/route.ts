import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// GET - Fetch products with marketplace filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Basic filters
    const agribusinessId = searchParams.get('agribusinessId');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'ACTIVE';
    
    // Marketplace filters
    const search = searchParams.get('search');
    const location = searchParams.get('location');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const services = searchParams.get('services')?.split(',') || [];
    
    // Sorting and pagination
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.ProductWhereInput = {
      status: status as Prisma.EnumProductStatusFilter,
      isActive: true
    };
    
    if (agribusinessId) {
      whereClause.agribusinessId = agribusinessId;
    }
    
    if (category && category !== 'all') {
      whereClause.cropCategory = category;
    }
    
    // Search functionality
    if (search) {
      whereClause.OR = [
        { productTitle: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { cropCategory: { contains: search, mode: 'insensitive' } },
        { agribusiness: { businessName: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Location filter
    if (location && location !== 'all') {
      if (location === 'local') {
        whereClause.agribusiness = {
          country: 'Malaysia'
        };
      } else if (location === 'west-malaysia') {
        whereClause.agribusiness = {
          country: 'Malaysia',
          state: {
            in: ['Kuala Lumpur', 'Selangor', 'Perak', 'Penang', 'Kedah', 'Perlis', 'Negeri Sembilan', 'Melaka', 'Johor']
          }
        };
      } else if (location === 'east-malaysia') {
        whereClause.agribusiness = {
          country: 'Malaysia',
          state: {
            in: ['Sabah', 'Sarawak']
          }
        };
      } else if (location === 'overseas') {
        whereClause.agribusiness = {
          country: { not: 'Malaysia' }
        };
      }
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      whereClause.pricing = {};
      if (minPrice) whereClause.pricing.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.pricing.lte = parseFloat(maxPrice);
    }
    
    // Services filter (simplified - would need additional fields in schema for full implementation)
    if (services.length > 0) {
      const serviceConditions: Prisma.ProductWhereInput[] = [];
      
      if (services.includes('free-shipping')) {
        serviceConditions.push({ directShippingCost: 0 });
      }
      if (services.includes('negotiable')) {
        serviceConditions.push({ allowBidding: true });
      }
      if (services.includes('bulk-discount')) {
        serviceConditions.push({ minimumOrderQuantity: { gte: 100 } });
      }
      
      if (serviceConditions.length > 0) {
        whereClause.OR = whereClause.OR ? 
          [...whereClause.OR, ...serviceConditions] : 
          serviceConditions;
      }
    }

    // Build orderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    
    switch (sortBy) {
      case 'latest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'price-low':
        orderBy = { pricing: 'asc' };
        break;
      case 'price-high':
        orderBy = { pricing: 'desc' };
        break;
      case 'top-sales':
        // Would need sales data - using quantity available as proxy
        orderBy = { quantityAvailable: 'desc' };
        break;
      default: // relevance
        orderBy = { createdAt: 'desc' };
    }

    // Get total count for pagination
    const totalCount = await prisma.product.count({
      where: whereClause
    });

    // Fetch products
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
      orderBy,
      skip,
      take: limit
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
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
      minimumIncrement,
      auctionEndTime,
      autoAcceptThreshold,
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

    // Validate bidding-specific fields when allowBidding is true
    if (allowBidding) {
      if (!minimumIncrement || !auctionEndTime) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Minimum increment and auction end time are required when bidding is enabled' 
          },
          { status: 400 }
        );
      }
      
      // Validate auction end time is in the future
      const endTime = new Date(auctionEndTime);
      if (endTime <= new Date()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Auction end time must be in the future' 
          },
          { status: 400 }
        );
      }
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
        // Bidding-specific fields (only set if allowBidding is true)
        minimumIncrement: allowBidding && minimumIncrement ? parseFloat(minimumIncrement) : null,
        auctionEndTime: allowBidding && auctionEndTime ? new Date(auctionEndTime) : null,
        autoAcceptThreshold: allowBidding && autoAcceptThreshold ? parseFloat(autoAcceptThreshold) : null,
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