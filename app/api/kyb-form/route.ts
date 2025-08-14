import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form fields
    const businessRegistrationNumber = formData.get("businessRegistrationNumber") as string;
    const businessAddress = formData.get("businessAddress") as string;
    const taxId = formData.get("taxId") as string;
    const businessLicenseFile = formData.get("businessLicense") as File;

    // Validate required fields
    if (!businessRegistrationNumber || !businessAddress) {
      return NextResponse.json(
        { error: "Business registration number and address are required" },
        { status: 400 }
      );
    }

    if (!businessLicenseFile) {
      return NextResponse.json(
        { error: "Business license document is required" },
        { status: 400 }
      );
    }

    // Get user ID from form data (sent from frontend)
    const userId = formData.get("userId") as string;
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the agribusiness record for this user
    const agribusiness = await prisma.agribusiness.findUnique({
      where: { userId: userId }
    });

    if (!agribusiness) {
      return NextResponse.json(
        { error: "Agribusiness profile not found" },
        { status: 404 }
      );
    }

    // Check if KYB form already exists
    const existingKYBForm = await prisma.kYBForm.findUnique({
      where: { agribusinessId: agribusiness.id }
    });

    if (existingKYBForm) {
      return NextResponse.json(
        { error: "KYB form has already been submitted" },
        { status: 400 }
      );
    }

    // Handle file upload
    let businessLicensePath = "";
    if (businessLicenseFile) {
      const bytes = await businessLicenseFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "kyb-documents");
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(businessLicenseFile.name);
      const fileName = `${agribusiness.id}-${Date.now()}${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      // Save file
      await writeFile(filePath, buffer);
      businessLicensePath = `/uploads/kyb-documents/${fileName}`;
    }

    // Create KYB form record
    const kybForm = await prisma.kYBForm.create({
      data: {
        agribusinessId: agribusiness.id,
        businessRegistrationNumber: businessRegistrationNumber || null,
        businessAddress,
        taxId: taxId || null,
        businessLicense: businessLicensePath,
        submittedAt: new Date(),
      },
    });

    console.log("KYB form id submitted successfully: ", kybForm.id);
    console.log("The KYB submitted is: ", kybForm);

    // Update agribusiness KYB status to PENDING
    await prisma.agribusiness.update({
      where: { id: agribusiness.id },
      data: {
        kybStatus: "PENDING",
      },
    });

    return NextResponse.json(
      {
        message: "Your KYB form has submitted successfully!",
        kybFormId: kybForm.id,
        status: "PENDING",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("KYB form submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from query parameters
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
      include: {
        kybForm: true,
      },
    });

    if (!agribusiness) {
      return NextResponse.json(
        { error: "Agribusiness profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      kybStatus: agribusiness.kybStatus,
      isKybVerified: agribusiness.isKybVerified,
      kybForm: agribusiness.kybForm ? {
        id: agribusiness.kybForm.id,
        businessRegistrationNumber: agribusiness.kybForm.businessRegistrationNumber,
        businessAddress: agribusiness.kybForm.businessAddress,
        taxId: agribusiness.kybForm.taxId,
        businessLicense: agribusiness.kybForm.businessLicense,
        submittedAt: agribusiness.kybForm.submittedAt,
        reviewedAt: agribusiness.kybForm.reviewedAt,
        rejectionReason: agribusiness.kybForm.rejectionReason,
      } : null,
    });
  } catch (error) {
    console.error("KYB form retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
