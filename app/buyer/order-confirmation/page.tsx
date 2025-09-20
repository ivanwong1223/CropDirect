'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TypingAnimation } from "@/components/magicui/typing-animation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle,
  Package,
  Truck,
  ShoppingCart,
  MapPin,
  Calendar,
  CreditCard,
  Download,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface OrderDetails {
  id: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  quantity: number;
  unitPrice: number;
  deliveryAddress: string;
  estimatedDeliveryTime?: string;
  shippingDistance?: number;
  createdAt: string;
  isBid?: boolean;
  notes?: string;
  transactions?: {
    id: string;
    amountPaid: number;
    currency: string;
    paymentMethod: string;
    paidAt: string;
  }[];
  product: {
    id: string;
    productTitle: string;
    cropCategory: string;
    unitOfMeasurement: string;
    currency: string;
    location: string;
    productImages: string[];
    agribusiness: {
      businessName: string;
      contactName?: string;
      state: string;
      country: string;
    };
  };
}

interface PaymentSession {
  id: string;
  url: string;
  status: string;
  payment_status: string;
  amount_total: number;
  currency: string;
  payment_method_types?: string[];
  loyalty?: {
    // Discount in RM applied due to redemption
    discountRM?: number;
    // Number of points redeemed on this order
    redeemedPoints?: number;
    // Number of points earned from this order
    pointsEarned?: number;
    // Balance after transaction
    balanceAfter?: number | null;
  } | null;
}

// Adds confirmation UI for buyer after Stripe session and formats numeric fields safely.
export default function OrderConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalShown, setModalShown] = useState(false);

  useEffect(() => {
    const loadOrderConfirmation = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const orderId = searchParams.get('order_id');

        // Only require session_id for payment-first flow; order_id is optional for legacy support
        if (!sessionId) {
          setError('Missing session ID');
          setLoading(false);
          return;
        }

        // Verify payment session and get order details
        const response = await fetch(`/api/create-checkout-session?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setOrder(data.data.order);
          // Attach loyalty info from API response to the payment session for easier UI rendering
          setPaymentSession({
            ...data.data.session,
            loyalty: data.data.loyalty ?? null,
          });
          
          if (data.data.session.payment_status === 'paid' && !modalShown) {
            setShowSuccessModal(true);
            setModalShown(true);
          } else if (data.data.session.payment_status !== 'paid') {
            toast.error('Payment was not completed successfully.');
          }
        } else {
          setError(data.error || 'Failed to load order confirmation');
        }
      } catch (error) {
        console.error('Error loading order confirmation:', error);
        setError('Failed to load order confirmation');
      } finally {
        setLoading(false);
      }
    };

    loadOrderConfirmation();
  }, [searchParams]);

  const handleDownloadReceipt = () => {
    // In a real app, this would generate and download a PDF receipt
    toast.info('Receipt download feature coming soon.');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmation Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
          <Button onClick={() => router.push('/buyer/marketplace/market-lists')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const isPaymentSuccessful = paymentSession?.payment_status === 'paid';
  const isBidOrder = order?.isBid === true;
  const isOrderPending = order?.status === 'pending';
  const isOrderConfirmed = order?.status === 'confirmed';
  const estimatedDeliveryDate = new Date();
  estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 3); // Add 3 days as default

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Modal Banner */}
      <motion.div 
        className="bg-white border-b"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {!isPaymentSuccessful ? (
                <TypingAnimation>Payment Processing</TypingAnimation>
              ) : isBidOrder && isOrderPending ? (
                <TypingAnimation>Bid Submitted!</TypingAnimation>
              ) : (
                <TypingAnimation>Order Confirmed!</TypingAnimation>
              )}
            </h1>
            <p className="text-gray-600">
              {!isPaymentSuccessful 
                ? 'We are processing your payment. Please wait for confirmation.'
                : isBidOrder && isOrderPending
                ? 'Waiting for seller approval. Your payment will be automatically refunded if your bid is not accepted.'
                : 'Thank you for your purchase. Your order has been successfully placed.'}
            </p>
            <div className="mt-4">
              <Badge 
                variant={!isPaymentSuccessful ? 'secondary' : isBidOrder && isOrderPending ? 'outline' : 'default'} 
                className="text-sm px-3 py-1 tracking-wide"
              >
                {isBidOrder && isOrderPending ? 'Bid Pending' : `Order #${order.id}`}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Congratulations Dialog - opens after successful payment */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Congratulations! 🎉</DialogTitle>
            <DialogDescription>
              {typeof paymentSession?.loyalty?.pointsEarned === 'number' && paymentSession.loyalty.pointsEarned > 0
                ? `You've earned ${paymentSession.loyalty.pointsEarned} loyalty points on this order.`
                : 'Your payment was successful and your order has been confirmed.'}
            </DialogDescription>
          </DialogHeader>

          {/* Loyalty details if available */}
          {paymentSession?.loyalty && (
            <div className="space-y-2 text-sm">
              {typeof paymentSession.loyalty.redeemedPoints === 'number' && paymentSession.loyalty.discountRM ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Redeemed</span>
                  <span className="font-medium">
                    {paymentSession.loyalty.redeemedPoints} pts → -{order.product.currency} {Number(paymentSession.loyalty.discountRM).toFixed(2)}
                  </span>
                </div>
              ) : null}
              {typeof paymentSession.loyalty.pointsEarned === 'number' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Earned</span>
                  <span className="font-medium">{paymentSession.loyalty.pointsEarned} pts</span>
                </div>
              )}
              {typeof paymentSession.loyalty.balanceAfter === 'number' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Balance</span>
                  <span className="font-medium">{paymentSession.loyalty.balanceAfter} pts</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowSuccessModal(false)}>Close</Button>
            <Button onClick={() => { setShowSuccessModal(false); location.assign('/buyer/my-orders'); }}>View My Orders</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header Section - Only show if modal hasn't been shown */}
      {!modalShown && (
        <motion.div 
          className="bg-white border-b"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-600" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {!isPaymentSuccessful 
                  ? 'Payment Processing'
                  : isBidOrder && isOrderPending
                  ? 'Bid Submitted!'
                  : 'Order Confirmed!'}
              </h1>
              <p className="text-gray-600">
                {!isPaymentSuccessful 
                  ? 'We are processing your payment. Please wait for confirmation.'
                  : isBidOrder && isOrderPending
                  ? 'Your bid has been submitted and payment processed. Waiting for seller approval.'
                  : 'Thank you for your purchase. Your order has been successfully placed.'}
              </p>
              <div className="mt-4">
                <Badge 
                  variant={!isPaymentSuccessful ? 'secondary' : isBidOrder && isOrderPending ? 'outline' : 'default'} 
                  className="text-sm px-3 py-1"
                >
                  {isBidOrder && isOrderPending ? 'Bid Pending' : `Order #${order.id}`}
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content - Order Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Product Information */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {order.product.productImages.length > 0 ? (
                        <Image
                          src={order.product.productImages[0]}
                          alt={order.product.productTitle}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={32} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{order.product.productTitle}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Seller: {order.product.agribusiness.businessName}
                        {order.product.agribusiness.contactName && (
                          <span className="text-gray-500"> ({order.product.agribusiness.contactName})</span>
                        )}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {order.product.cropCategory}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Order Summary Table */}
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Unit Price</TableCell>
                        <TableCell className="text-right">
                          {order.product.currency} {Number(order.unitPrice).toFixed(2)}/{order.product.unitOfMeasurement}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Quantity</TableCell>
                        <TableCell className="text-right">
                          {order.quantity} {order.product.unitOfMeasurement}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Subtotal</TableCell>
                        <TableCell className="text-right">
                          {order.product.currency} {Number(order.subtotal).toFixed(2)}
                        </TableCell>
                      </TableRow>
                      {Number(order.shippingCost) > 0 && (
                        <TableRow>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Shipping
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <div>{order.product.currency} {Number(order.shippingCost).toFixed(2)}</div>
                              {order.estimatedDeliveryTime && (
                                <div className="text-xs text-gray-500">
                                  {order.estimatedDeliveryTime}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Loyalty discount and points rows (if applicable) */}
                      {/* {paymentSession?.loyalty?.discountRM && paymentSession.loyalty.discountRM > 0 && (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Loyalty</Badge>
                                Discount
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              - {order.product.currency} {Number(paymentSession.loyalty.discountRM).toFixed(2)}
                            </TableCell>
                          </TableRow>
                          {typeof paymentSession.loyalty.redeemedPoints === 'number' && (
                            <TableRow>
                              <TableCell className="font-medium text-gray-600">Points Redeemed</TableCell>
                              <TableCell className="text-right text-gray-600">
                                {paymentSession.loyalty.redeemedPoints} pts
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )} */}
                    </TableBody>
                  </Table>

                  <Separator className="my-4" />

                  {/* Total */}
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Paid</span>
                    <span className="text-green-600">
                      {order.product.currency} {Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>

                  {/* Order Notes */}
                  {order.notes && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Order Notes</h4>
                        <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
                          {order.notes}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Delivery Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Delivery Address</Label>
                    <p className="text-gray-900 mt-1">{order.deliveryAddress}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">From</Label>
                    <p className="text-gray-900 mt-1">{order.product.location}</p>
                  </div>

                  {order.shippingDistance && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Shipping Distance</Label>
                      <p className="text-gray-900 mt-1">{order.shippingDistance.toFixed(1)} km</p>
                    </div>
                  )}

                  {!isBidOrder && !isOrderPending && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Estimated delivery: {estimatedDeliveryDate.toLocaleDateString('en-MY', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Actions & Payment Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* <Button 
                    onClick={handleTrackOrder}
                    className="w-full cursor-pointer"
                    variant="default"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Track Order
                  </Button> */}
                  
                  <Button 
                    onClick={isBidOrder && isOrderPending 
                      ? () => router.push('/buyer/marketplace/market-lists')
                      : handleDownloadReceipt}
                    className="w-full cursor-pointer"
                    variant="outline"
                  >
                    {isBidOrder && isOrderPending ? (
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {isBidOrder && isOrderPending ? 'Continue Shopping' : 'Download Receipt'}
                  </Button>
                  
                  <Button 
                    onClick={() => router.push('/buyer/my-orders')}
                    className="w-full cursor-pointer"
                    variant="default"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    My Orders
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Status:</span>
                    <Badge variant={isPaymentSuccessful ? 'default' : 'secondary'}>
                      {isPaymentSuccessful ? 'Paid' : 'Processing'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Payment Method:</span>
                    <span className="text-sm font-medium">Credit/Debit Card</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <span className="text-sm font-mono text-gray-800">
                      {order?.transactions?.[0]?.id}
                    </span>
                  </div>

                  {/* Loyalty summary block */}
                  {paymentSession?.loyalty && (
                    <>
                      <Separator className="my-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 mb-2">Loyalty</div>
                        {typeof paymentSession.loyalty.redeemedPoints === 'number' && paymentSession.loyalty.discountRM ? (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Redeemed</span>
                            <span className="font-medium">
                              {paymentSession.loyalty.redeemedPoints} pts → -{order.product.currency} {Number(paymentSession.loyalty.discountRM).toFixed(2)}
                            </span>
                          </div>
                        ) : null}
                        {typeof paymentSession.loyalty.pointsEarned === 'number' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Earned</span>
                            <span className="font-medium">{paymentSession.loyalty.pointsEarned} pts</span>
                          </div>
                        )}
                        {typeof paymentSession.loyalty.balanceAfter === 'number' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">New Balance</span>
                            <span className="font-medium">{paymentSession.loyalty.balanceAfter} pts</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Order Date:</span>
                    <span className="text-sm">
                      {new Date(order.createdAt).toLocaleDateString('en-MY')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Support Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    If you have any questions about your order, please contact our support team.
                  </p>
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple label helper used for accessibility annotations in Delivery Information section.
function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={className}>{children}</label>;
}