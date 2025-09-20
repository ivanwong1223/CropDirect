import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update user's agribusiness profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      businessName,
      name,
      email,
      tradingType,
      primaryCropCategory,
      country,
      state,
      bio,
      businessImage,
      facebookUrl,
      instagramUrl,
      websiteUrl,
      contactNo,
      // bank fields
      bankAccountHolderName,
      bankName,
      bankAccountNumber,
      bankSwiftCode,
      bankRoutingNumber,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'User ID is required' 
        },
        { status: 400 }
      );
    }

    // Start a transaction to update both User and Agribusiness tables
    const result = await prisma.$transaction(async (tx) => {
      // Update User table (name and email)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name: name,
          email: email
        }
      });

      // Update Agribusiness table
      const updatedAgribusiness = await tx.agribusiness.update({
        where: { userId: userId },
        data: {
          businessName,
          tradingType,
          primaryCropCategory,
          country,
          state,
          bio,
          businessImage,
          facebookUrl,
          instagramUrl,
          websiteUrl,
          contactNo,
          // bank fields
          bankAccountHolderName,
          bankName,
          bankAccountNumber,
          bankSwiftCode,
          bankRoutingNumber,
        }
      });

      return { user: updatedUser, agribusiness: updatedAgribusiness };
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Error updating agribusiness profile:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Email address is already in use by another account' 
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'User profile not found' 
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile. Please try again.' 
      },
      { status: 500 }
    );
  }
}
