"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

interface BuyerInfo {
  id: string;
  companyName?: string | null;
  companyAddress?: string | null;
  contactNo?: string | null;
  companyType?: string | null;
  businessImage?: string | null;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}

interface ProductInfo {
  id: string;
  productTitle: string;
  cropCategory?: string | null;
  unitOfMeasurement?: string | null;
  pricing?: number | string;
  productImages?: string[];
  allowBidding?: boolean;
}

interface OrderDetail {
  id: string;
  orderNumber?: string;
  status: string;
  isBid?: boolean;
  bidPlacedAt?: string | Date | null;
  bidAcceptedAt?: string | Date | null;
  bidRejectedAt?: string | Date | null;
  product: ProductInfo;
  buyer: BuyerInfo;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  totalAmount: number | string;
  currency?: string;
  deliveryAddress: string;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  stripePaymentIntentId?: string | null;
  createdAt?: string | Date;
  notes?: string | null;
  transactions?: { id: string }[];
}

/**
 * Formats numeric amounts for display with a currency code/prefix.
 * Handles string inputs and ensures two decimal precision.
 *
 * @param amount - Amount to format (number or numeric string).
 * @param currency - Currency label (default: "RM").
 * @returns Formatted amount string or '-' when amount is undefined.
 */
function formatAmount(amount: number | string | undefined, currency: string = "RM") {
  if (amount === undefined) return "-";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${currency} 0.00`;
  return `${currency} ${n.toFixed(2)}`;
}

function capitalize(value?: string | null) {
  if (!value) return "-";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * StatusPill
 * Renders a compact colored badge that reflects the order status.
 * Unknown statuses fallback to a secondary-styled badge.
 *
 * @param props.status - The textual status of an order (e.g., pending, shipped).
 */
function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const common = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "pending") return <span className={`${common} bg-yellow-100 text-yellow-800`}>Pending</span>;
  if (s === "confirmed") return <span className={`${common} bg-green-100 text-green-800`}>Confirmed</span>;
  if (s === "ready_for_pickup") return <span className={`${common} bg-orange-100 text-orange-800`}>Ready for Pickup</span>;
  if (s === "cancelled") return <span className={`${common} bg-red-100 text-red-800`}>Cancelled</span>;
  if (s === "shipped") return <span className={`${common} bg-purple-100 text-purple-800`}>Shipped</span>;
  if (s === "delivered") return <span className={`${common} bg-blue-100 text-blue-800`}>Delivered</span>;
  return <Badge variant="secondary">{status}</Badge>;
}

/**
 * SellerOrderDetailsPage
 * Displays complete details of a single order for sellers, including product, buyer, payment info and bid actions.
 * Fetches the order by id from the orders API and updates bid status via PATCH actions.
 */
export default function SellerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local-only notes state for internal annotations; not persisted unless wired to an API.
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/orders?orderId=${orderId}`);
        const json = await res.json();
        if (!json?.success) throw new Error(json?.error || "Failed to load order");
        setOrder(json.data);
        setNotes(json.data?.notes || "");
      } catch (e) {
        console.error(e);
        setError("Failed to fetch order");
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  /**
   * Performs bid-related actions on the order (accept or reject) via the orders API.
   * On success, routes back to orders page with notification parameters.
   *
   * @param action - Either "accept_bid" or "reject_bid".
   */
  async function handleBidAction(action: "accept_bid" | "reject_bid") {
    if (!order) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Failed to update order");
      
      // Route back to orders page with notification parameters
      const bidAction = action === "accept_bid" ? "accepted" : "rejected";
      router.push(`/seller/orders?bidAction=${bidAction}&orderId=${order.id}`);
    } catch (e) {
      console.error(e);
      alert("Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Handles status updates for the order via the orders API.
   * On success, routes back to orders page with notification parameters.
   *
   * @param newStatus - The new status to set for the order.
   */
  async function handleStatusUpdate(newStatus: string) {
    if (!order) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action: "update_status", status: newStatus }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Failed to update status");
      
      // Route back to orders page with notification parameters
      router.push(`/seller/orders?statusUpdated=true&orderId=${order.id}`);
    } catch (e) {
      console.error(e);
      alert("Failed to update order status");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order Details</h1>
        <Button variant="outline" onClick={() => router.back()}>Back</Button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="py-10 text-center text-red-600 text-sm">{error}</div>
      ) : !order ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Order not found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Order ID</div>
                    <div className="font-mono text-sm">{order.id}</div>
                    <div className="text-sm text-muted-foreground mt-2">Created</div>
                    <div className="text-sm">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <Separator />
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 rounded-md overflow-hidden bg-muted">
                    {order.product?.productImages?.[0] ? (
                      <Image src={order.product.productImages[0]} alt={order.product.productTitle} fill className="object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{order.product?.productTitle}</div>
                    <div className="text-sm text-muted-foreground">Category: {order.product?.cropCategory || "-"}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground">Unit Price:</span>
                      <span className="text-lg font-semibold text-emerald-600">{formatAmount(order.unitPrice)}</span>
                      {order.product?.unitOfMeasurement ? (
                        <span className="text-xs text-muted-foreground">/ {order.product.unitOfMeasurement}</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground">Quantity: {order.quantity}</div>
                    <div className="text-black font-semibold mt-4">Total: {formatAmount(order.totalAmount)}</div>
                    {order.isBid ? (
                      <div className="text-xs text-amber-700">Bidding order • Bid placed at {order.bidPlacedAt ? new Date(order.bidPlacedAt).toLocaleString() : "-"}</div>
                    ) : null}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                  <div>
                    <div className="text-sm text-muted-foreground">Delivery Address</div>
                    <div className="text-sm tracking-wide">{order.deliveryAddress}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Shipping Cost</div>
                    <div className="text-sm">{formatAmount(order.shippingCost)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buyer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buyer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Company</div>
                    <div className="text-sm">{order.buyer?.companyName || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Contact No</div>
                    <div className="text-sm">{order.buyer?.contactNo || "-"}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-muted-foreground">Company Address</div>
                    <div className="text-sm">{order.buyer?.companyAddress || "-"}</div>
                  </div>
                </div>
                <div className="flex justify-end mt-6 pr-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-1/3 cursor-pointer" size="sm">View details</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Buyer Details</DialogTitle>
                        <DialogDescription>Comprehensive information about the buyer</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {order.buyer?.businessImage ? (
                          <div className="sm:col-span-2">
                            <div className="text-sm text-muted-foreground">Business Image</div>
                            <div className="relative mt-1 w-30 h-30 rounded-md overflow-hidden bg-muted">
                              <Image src={order.buyer.businessImage} alt="Business" fill className="object-cover" />
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <div className="text-sm text-muted-foreground">Company Name</div>
                          <div className="text-sm">{order.buyer?.companyName || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Company Type</div>
                          <div className="text-sm">{order.buyer?.companyType || "-"}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-sm text-muted-foreground">Company Address</div>
                          <div className="text-sm">{order.buyer?.companyAddress || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Contact No</div>
                          <div className="text-sm">{order.buyer?.contactNo || "-"}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Contact Name</div>
                          <div className="text-sm">{order.buyer?.user?.name || "-"}</div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-sm text-muted-foreground">Email</div>
                          <div className="text-sm">{order.buyer?.user?.email || "-"}</div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Method</div>
                  <div className="text-sm">{capitalize(order.paymentMethod || undefined)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="text-sm">{capitalize(order.paymentStatus || undefined)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Receipt</div>
                  <div className="text-sm font-mono">{order.transactions?.[0]?.id || "-"}</div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section (internal) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes From Buyer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea className="font-bold text-black" value={notes} onChange={(e) => setNotes(e.target.value)} disabled placeholder="Add internal notes here..." />
                <div className="text-xs text-muted-foreground">Notes are not visible to buyers.</div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Seller Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Seller Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Update */}
                 {order.status === 'confirmed' && (
                   <div>
                     <div className="text-sm font-medium mb-2">Update Order Status</div>
                     <Select
                       value={order.status}
                       onValueChange={handleStatusUpdate}
                       disabled={submitting}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="confirmed">Confirmed</SelectItem>
                         <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 )}
                
                {/* Bid Actions */}
                {order.isBid && order.status === "pending" ? (
                  <div>
                    <div className="text-sm font-medium mb-2">Bid Actions</div>
                    <div className="flex gap-3">
                      <Button className="cursor-pointer" disabled={submitting} onClick={() => handleBidAction("accept_bid")}>Accept Bid</Button>
                      <Button className="cursor-pointer" variant="destructive" disabled={submitting} onClick={() => handleBidAction("reject_bid")}>Reject Bid</Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}