import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract form data from request body
    const {
      businessName,
      tradingType,
      primaryCrop,
      country,
      state,
      contactName,
      email,
      password,
      agreeTerms,
      oauthOnboarding // flag to indicate Google OAuth onboarding flow
    } = body;

    // Validate required fields
    if (!businessName || !tradingType || !primaryCrop || !country || !state || 
        !contactName || !email || (!oauthOnboarding && !password) || !agreeTerms) {
      return NextResponse.json(
        { error: !oauthOnboarding 
            ? "All fields are required and terms must be accepted"
            : "All fields except password are required and terms must be accepted" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength only if a password is provided
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password only if provided
    const saltRounds = 12;
    const hashedPassword = password ? await bcrypt.hash(password, saltRounds) : undefined;

    // Define default profile images
    const defaultImages = [
      "https://avatars.githubusercontent.com/u/106103625",
      "https://avatars.githubusercontent.com/u/59442788",
      "https://avatars.githubusercontent.com/u/59228569"
    ];
    
    // Randomly select an image
    const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];

    // Create user and agribusiness profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user record
      const user = await tx.user.create({
        data: {
          email,
          name: contactName,
          role: "AGRIBUSINESS",
          ...(hashedPassword ? { password: hashedPassword } : {}),
          isActive: true
        }
      });

      // Create agribusiness profile
      const agribusiness = await tx.agribusiness.create({
        data: {
          userId: user.id,
          businessName,
          tradingType,
          primaryCropCategory: primaryCrop,
          country,
          state,
          kybStatus: "NOT_SUBMITTED",
          businessImage: randomImage,
          subscription: {
            create: {
              tier: "FREE",
              status: "ACTIVE",
              billingCycle: "MONTHLY"
            }
          },
          isKybVerified: false
        }
      });

      return { user, agribusiness };
    });

    // Return success response (exclude password from response)
    return NextResponse.json({
      success: true,
      message: "Seller account created successfully",
      data: {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        agribusiness: {
          id: result.agribusiness.id,
          businessName: result.agribusiness.businessName,
          tradingType: result.agribusiness.tradingType,
          primaryCropCategory: result.agribusiness.primaryCropCategory,
          country: result.agribusiness.country,
          state: result.agribusiness.state,
          kybStatus: result.agribusiness.kybStatus,
          businessImage: result.agribusiness.businessImage,
          // Include subscription information
          subscription: {
            tier: "FREE",
            status: "ACTIVE",
            billingCycle: "MONTHLY"
          }
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating seller account:", error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
