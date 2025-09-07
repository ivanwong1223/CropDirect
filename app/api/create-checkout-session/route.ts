import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@/app/generated/prisma';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const prisma = new PrismaClient();

/**
 * POST /api/create-checkout-session
 * Payment-first flow entrypoint: creates a Stripe Checkout Session from product, buyer, and shipping payload.
 * Does NOT create an Order upfront. The Order will be created after payment confirmation in the GET handler.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      quantity,
      unitPrice,
      subtotal,
      shippingCost,
      totalAmount,
      currency,
      productName,
      buyerInfo,
      shippingCalculation,
      buyerId,
      // Bid-specific fields
      isBid,
      bidUnitPrice,
      // Order notes
      notes,
      // Logistics partner
      logisticsPartnerId,
    } = body;

    // Validate required fields for payment-first flow
    if (!productId || !quantity || !totalAmount || !currency || !productName || !buyerInfo || !buyerInfo.deliveryAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify product exists and include agribusiness info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        agribusiness: {
          include: {
            user: true,
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Compute absolute success and cancel URLs using request origin to ensure explicit scheme exists
    const origin = new URL(request.url).origin;
    // IMPORTANT: keep the raw placeholder so Stripe can replace it (do NOT URL-encode)
    const successUrl = `${origin}/buyer/order-confirmation?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrlObj = new URL('/buyer/checkout', request.url);
    cancelUrlObj.searchParams.set('productId', product.id);
    cancelUrlObj.searchParams.set('quantity', String(quantity));
    cancelUrlObj.searchParams.set('error', 'payment_cancelled');

    // Normalize product image URL for Stripe (must be absolute URL with scheme)
    let imageUrl: string | undefined = undefined;
    const firstImage = Array.isArray(product.productImages)
      ? product.productImages[0]
      : (product.productImages as unknown as string | undefined);
    if (firstImage && typeof firstImage === 'string') {
      try {
        // If already absolute, this will succeed
        imageUrl = new URL(firstImage).toString();
      } catch {
        // Otherwise, build absolute URL from request origin
        const normalized = firstImage.startsWith('/') ? firstImage : `/${firstImage}`;
        imageUrl = new URL(normalized, request.url).toString();
      }
    }

    // Prepare Stripe checkout session
    // Normalize Stripe currency string (map RM -> myr)
    const stripeCurrency = (currency || '').toLowerCase() === 'rm' ? 'myr' : (currency || '').toLowerCase();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: stripeCurrency,
            product_data: {
              name: productName,
              description: `${quantity} units from ${product.agribusiness.businessName}`,
              images: imageUrl ? [imageUrl] : undefined,
            },
            unit_amount: Math.round(Number(totalAmount) * 100), // total in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrlObj.toString(),
      metadata: {
        // relationships
        productId: String(productId),
        buyerId: buyerId ? String(buyerId) : '',
        sellerId: String(product.agribusiness.id || ''),
        // order numbers
        quantity: String(quantity),
        unitPrice: unitPrice !== undefined ? String(unitPrice) : String(product.pricing || 0),
        subtotal: subtotal !== undefined ? String(subtotal) : String((Number(product.pricing || 0) * Number(quantity)).toFixed(2)),
        shippingCost: shippingCost !== undefined ? String(shippingCost) : '0',
        totalAmount: String(totalAmount),
        currency: String(currency),
        // buyer info
        deliveryAddress: buyerInfo.deliveryAddress || '',
        // shipping
        estimatedDeliveryTime: shippingCalculation?.deliveryTime || '',
        shippingDistance: shippingCalculation?.distance !== undefined && shippingCalculation?.distance !== null ? String(shippingCalculation.distance) : '',
        logisticsPartnerId: logisticsPartnerId ? String(logisticsPartnerId) : '',
        // bid metadata
        isBid: isBid ? 'true' : 'false',
        bidUnitPrice: bidUnitPrice !== undefined && bidUnitPrice !== null ? String(bidUnitPrice) : '',
        // order notes
        notes: notes || '',
      },
      customer_email: buyerInfo.email || undefined,
      // Collect only billing address on Stripe; shipping is handled in-app and sent via metadata
      billing_address_collection: 'required',
      payment_intent_data: {
        metadata: {
          productId: String(productId),
          buyerId: buyerId ? String(buyerId) : '',
          isBid: isBid ? 'true' : 'false',
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);

    // Type guard for Stripe error
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      return NextResponse.json(
        { success: false, error: `Stripe error: ${String((error).message)}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create checkout session' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/create-checkout-session?session_id=...
 * Retrieves the Stripe session, creates an Order if it does not exist (payment-first),
 * or updates/returns the existing Order (legacy pre-payment flow).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if an order already exists for this session to avoid duplicates
    const existingOrder = await prisma.order.findFirst({
      where: { stripeSessionId: session.id },
      include: {
        product: { include: { agribusiness: true } },
        transactions: true
      }
    });

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        data: {
          session: {
            id: session.id,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
          },
          order: {
             ...existingOrder,
             orderNumber: existingOrder.id
           }
        }
      });
    }

    try {
      // Get product and metadata for order creation
      const md = session.metadata!;

      const product = await prisma.product.findUnique({
        where: { id: md.productId as string },
        include: { agribusiness: true }
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const parseNum = (str: string | undefined): number | undefined => {
        if (!str) return undefined;
        const num = parseFloat(str);
        return isNaN(num) ? undefined : num;
      };

      const isBid = md?.isBid === 'true';
      const effectiveUnitPrice =
        parseNum(md.bidUnitPrice as string | undefined) ??
        parseNum(md.unitPrice as string | undefined) ??
        Number(product.pricing || 0);

      // Determine order status with bid auto-accept logic when paid
      let orderStatus = 'pending';
      if (session.payment_status === 'paid') {
        if (isBid) {
          const autoAccept = product.autoAcceptThreshold ? Number(product.autoAcceptThreshold) : undefined;
          if (autoAccept !== undefined && effectiveUnitPrice >= autoAccept) {
            orderStatus = 'confirmed';
          } else {
            orderStatus = 'pending'; // awaiting seller approval
          }
        } else {
          orderStatus = 'confirmed';
        }
      } else if (session.payment_status === 'unpaid') {
        orderStatus = 'payment_failed';
      }

      // Get order quantity for inventory and transaction operations
      const orderQuantity = parseNum(md.quantity as string | undefined) ?? 1;
      const orderTotalAmount = parseNum(md.totalAmount as string | undefined) ?? ((effectiveUnitPrice) * orderQuantity) + (parseNum(md.shippingCost as string | undefined) ?? 0);

      // Check if sufficient quantity is available
      if (product.quantityAvailable < orderQuantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient quantity available. Only ${product.quantityAvailable} units left.` },
          { status: 400 }
        );
      }

      // Use transaction to ensure atomicity: create order, update inventory, and create sales transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the order
        const tempOrder = await tx.order.create({
          data: {
            // Order details
            productId: product.id,
            quantity: orderQuantity,
            unitPrice: effectiveUnitPrice,
            subtotal: (parseNum(md.subtotal as string | undefined) ?? (Number(product.pricing || 0) * orderQuantity)),
            shippingCost: parseNum(md.shippingCost as string | undefined) ?? 0,
            totalAmount: orderTotalAmount,
            currency: (md.currency as string) || 'RM',
            status: orderStatus,

            // Buyer and seller info
            buyerId: md.buyerId as string,
            sellerId: product.agribusiness.id,

            // Delivery info
            deliveryAddress: md.deliveryAddress!,
            estimatedDeliveryTime: md.estimatedDeliveryTime as string | undefined,
            shippingDistance: parseNum(md.shippingDistance as string | undefined),

            // Payment details
            paymentMethod: 'card',
            paymentStatus: session.payment_status,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,

            // Bid-related fields
            isBid: isBid,
            bidPlacedAt: isBid ? new Date() : undefined,
            bidAcceptedAt: isBid && orderStatus === 'confirmed' ? new Date() : undefined,

            // Order notes
            notes: md.notes as string || null,
            
            // Logistics partner
            logisticsPartnerId: md.logisticsPartnerId as string || null,
          },
          include: {
            product: {
              include: { agribusiness: true }
            }
          }
        });

        // Generate the formatted order ID and update the record
        const formattedOrderId = `ORD-${tempOrder.id.slice(-8).toUpperCase()}`;
        const createdOrder = await tx.order.update({
          where: { id: tempOrder.id },
          data: { id: formattedOrderId },
          include: {
            product: {
              include: { agribusiness: true }
            },
            transactions: true
          }
        });

        // Update product inventory - decrease quantityAvailable
        await tx.product.update({
          where: { id: product.id },
          data: {
            quantityAvailable: {
              decrement: orderQuantity
            }
          }
        });

        // Create sales transaction record for receipt/invoice tracking (whenever payment is successful)
        // This includes both regular orders and bid orders - refunds will be handled separately if bids are rejected
        if (session.payment_status === 'paid') {
          const tempTransaction = await tx.salesTransaction.create({
            data: {
              orderId: createdOrder.id,
              amountPaid: orderTotalAmount,
              currency: (md.currency as string) || 'RM',
              paymentMethod: 'card',
              stripePaymentIntentId: session.payment_intent as string,
              paidAt: new Date(),
            }
          });

          // Generate formatted transaction ID and update the record
          const formattedTransactionId = `TXN-${tempTransaction.id.slice(-8).toUpperCase()}`;
          await tx.salesTransaction.update({
            where: { id: tempTransaction.id },
            data: { id: formattedTransactionId }
          });
        }

        return createdOrder;
      });

      const createdOrder = result;

      return NextResponse.json({
        success: true,
        data: {
          session: {
            id: session.id,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
            currency: session.currency,
          },
          order: {
            ...createdOrder,
            orderNumber: createdOrder.id
          }
        }
      });
    } catch (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error retrieving checkout session:', error);

    // Type guard for Stripe error
    if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
      return NextResponse.json(
        { success: false, error: `Stripe error: ${String((error).message)}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to retrieve checkout session' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
