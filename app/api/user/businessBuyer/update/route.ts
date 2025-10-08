import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT - Update BusinessBuyer profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      companyName,
      companyAddress,
      companyType,
      contactNo,
      businessImage,
      name,
      email,
    } = body as {
      userId?: string;
      companyName?: string;
      companyAddress?: string;
      companyType?: string;
      contactNo?: string;
      businessImage?: string;
      name?: string;
      email?: string;
    };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Optionally update the User table (name/email)
      if (name !== undefined || email !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(email !== undefined ? { email } : {}),
          },
        });
      }

      // Update BusinessBuyer profile by userId
      const updatedBuyer = await tx.businessBuyer.update({
        where: { userId },
        data: {
          ...(companyName !== undefined ? { companyName } : {}),
          ...(companyAddress !== undefined ? { companyAddress } : {}),
          ...(companyType !== undefined ? { companyType } : {}),
          ...(contactNo !== undefined ? { contactNo } : {}),
          ...(businessImage !== undefined ? { businessImage } : {}),
        },
        select: {
          id: true,
          companyName: true,
          companyType: true,
          companyAddress: true,
          contactNo: true,
          businessImage: true,
          loyaltyPoints: true,
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      });

      return updatedBuyer;
    });

    return NextResponse.json({ success: true, message: 'Buyer profile updated successfully', data: result });

  } catch (error) {
    console.error('Error updating business buyer profile:', error);

    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { success: false, error: 'Buyer profile not found for user' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update buyer profile. Please try again.' },
      { status: 500 }
    );
  }
}