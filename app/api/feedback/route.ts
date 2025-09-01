import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserData } from "@/lib/localStorage";

/**
 * POST /api/feedback
 * Creates buyer feedback for a delivered order.
 * Expects JSON body: { orderId, productRating, sellerRating, productReview?, sellerReview? }
 *
 * Validation rules:
 * - orderId is required and must exist
 * - order status must be 'delivered' (only delivered orders can be reviewed)
 * - productRating and sellerRating must be integers between 1 and 5
 * - Only one feedback per order (unique on orderId)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      productRating,
      sellerRating,
      productReview,
      sellerReview,
    } = body as {
      orderId?: string;
      productRating?: number;
      sellerRating?: number;
      productReview?: string | null;
      sellerReview?: string | null;
    };

    // Authenticate user (must be logged-in buyer)
    const userData = getUserData();
    if (!userData) {
      return NextResponse.json(
        { success: false, error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Basic validation
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: orderId" },
        { status: 400 }
      );
    }

    const isValidRating = (val: unknown) =>
      typeof val === "number" && Number.isInteger(val) && val >= 1 && val <= 5;

    if (!isValidRating(productRating) || !isValidRating(sellerRating)) {
      return NextResponse.json(
        { success: false, error: "Ratings must be integers between 1 and 5" },
        { status: 400 }
      );
    }

    if (
      (productReview && typeof productReview !== "string") ||
      (sellerReview && typeof sellerReview !== "string")
    ) {
      return NextResponse.json(
        { success: false, error: "Reviews must be strings if provided" },
        { status: 400 }
      );
    }

    // Ensure order exists, is delivered, and retrieve needed relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Ownership check: only the buyer who placed the order can submit feedback
    if (order.buyerId !== userData.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: you cannot submit feedback for this order" },
        { status: 403 }
      );
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { success: false, error: "Feedback can only be submitted for delivered orders" },
        { status: 400 }
      );
    }

    // Enforce single feedback per order
    const existing = await prisma.feedback.findUnique({ where: { orderId } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Feedback already submitted for this order" },
        { status: 409 }
      );
    }

    // Create feedback using relations from order
    const feedback = await prisma.feedback.create({
      data: {
        orderId: order.id,
        buyerId: order.buyerId,
        productId: order.productId,
        agribusinessId: order.product.agribusinessId,
        productRating: productRating!,
        sellerRating: sellerRating!,
        productReview: productReview ?? null,
        sellerReview: sellerReview ?? null,
      },
    });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create feedback" },
      { status: 500 }
    );
  }
}