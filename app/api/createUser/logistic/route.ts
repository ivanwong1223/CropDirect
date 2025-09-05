import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      password,
      companyName,
      companyAddress, // optional
      contactNo,      // optional (future use)
      businessImage,  // optional (future use)
    } = body;

    // Validate required fields
    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "Name, Email, Password and Company Name are required" },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
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

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Define default profile images (fallbacks)
    const defaultImages = [
      "/anonymous-business.svg",
      "https://avatars.githubusercontent.com/u/20110627",
      "https://avatars.githubusercontent.com/u/89768406",
    ];
    const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];

    // Create user and business buyer profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          role: "LOGISTICS_PARTNER",
          password: hashedPassword,
          isActive: true,
        },
      });

      const logisticsPartner = await tx.logisticsPartner.create({
        data: {
          userId: user.id,
          companyName,
          // Optional fields - only set if provided to avoid schema drift issues
          ...(companyAddress ? { companyAddress } : {}),
          ...(contactNo ? { contactNo } : {}),
          ...(businessImage ? { businessImage } : { businessImage: randomImage }),
          // verificationStatus defaults to PENDING
        },
      });
      console.log("the logistics partner created is: ", logisticsPartner)

      return { user, logisticsPartner };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Logistics partner account created successfully",
        data: {
          userId: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          logisticsPartner: {
            id: result.logisticsPartner.id,
            companyName: result.logisticsPartner.companyName,
            businessImage: result.logisticsPartner.businessImage,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating logistics partner account:", error);

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
