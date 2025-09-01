import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// GET - Fetch a specific product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        agribusiness: {
          select: {
            id: true,
            businessName: true,
            tradingType: true,
            primaryCropCategory: true,
            bio: true,
            facebookUrl: true,
            instagramUrl: true,
            websiteUrl: true,
            subscription: {
              select: {
                tier: true,
                status: true,
                billingCycle: true,
                nextBillingDate: true
              }
            },
            businessImage: true,
            state: true,
            country: true,
            contactNo: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch product' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update a specific product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
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
      selectedLogistics,
      status
    } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        },
        { status: 404 }
      );
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(productTitle && { productTitle }),
        ...(cropCategory && { cropCategory }),
        ...(description !== undefined && { description }),
        ...(unitOfMeasurement && { unitOfMeasurement }),
        ...(minimumOrderQuantity && { minimumOrderQuantity: parseInt(minimumOrderQuantity) }),
        ...(quantityAvailable && { quantityAvailable: parseInt(quantityAvailable) }),
        ...(pricing && { pricing: parseFloat(pricing) }),
        ...(currency && { currency }),
        ...(allowBidding !== undefined && { allowBidding }),
        ...(minimumIncrement !== undefined && { minimumIncrement: parseFloat(minimumIncrement) }),
        ...(auctionEndTime !== undefined && { auctionEndTime: auctionEndTime ? new Date(auctionEndTime) : null }),
        ...(autoAcceptThreshold !== undefined && { autoAcceptThreshold: parseFloat(autoAcceptThreshold) }),
        ...(storageConditions !== undefined && { storageConditions }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(location && { location }),
        ...(productImages && { productImages }),
        ...(shippingMethod !== undefined && { shippingMethod }),
        ...(directShippingCost !== undefined && { directShippingCost: directShippingCost ? parseFloat(directShippingCost) : null }),
        ...(selectedLogistics !== undefined && { selectedLogistics }),
        ...(status && { status }),
        updatedAt: new Date()
      },
      include: {
        agribusiness: {
          select: {
            businessName: true,
            tradingType: true,
            primaryCropCategory: true,
            bio: true,
            facebookUrl: true,
            instagramUrl: true,
            websiteUrl: true,
            subscription: {
              select: {
                tier: true,
                status: true,
                billingCycle: true
              }
            },
            businessImage: true,
            state: true,
            country: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update product' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found' 
        },
        { status: 404 }
      );
    }

    // Delete the product
    await prisma.product.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete product' 
      },
      { status: 500 }
    );
  }
}