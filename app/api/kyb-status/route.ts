import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET method to retrieve KYB status for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the agribusiness record for this user
    const agribusiness = await prisma.agribusiness.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        businessName: true,
        kybStatus: true,
        isKybVerified: true,
        kybForm: {
          select: {
            id: true,
            businessRegistrationNumber: true,
            businessAddress: true,
            taxId: true,
            businessLicense: true,
            submittedAt: true,
            reviewedAt: true,
            rejectionReason: true,
          }
        },
      },
    });

    if (!agribusiness) {
      return NextResponse.json(
        { error: "Agribusiness profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        businessName: agribusiness.businessName,
        kybStatus: agribusiness.kybStatus,
        isKybVerified: agribusiness.isKybVerified,
        kybForm: agribusiness.kybForm,
      }
    });
  } catch (error) {
    console.error("KYB status retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
