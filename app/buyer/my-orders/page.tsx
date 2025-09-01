"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { getUserData } from "@/lib/localStorage";

// Type definitions for API responses we consume
interface BuyerProfile {
  id: string;
  companyName?: string | null;
  contactNo?: string | null;
  user: { id: string; name?: string | null; email?: string | null; role: string };
}

interface AgribusinessInfo {
  id: string;
  businessName: string;
}

interface ProductInfo {
  id: string;
  productTitle: string;
  cropCategory?: string | null;
  productImages?: string[];
  agribusiness: AgribusinessInfo;
}

interface FeedbackInfo {
  id: string;
  productRating: number;
  sellerRating: number;
  productReview?: string | null;
  sellerReview?: string | null;
}

interface OrderItem {
  id: string; // Serves as orderNumber too
  orderNumber?: string;
  status: string; // pending | confirmed | shipped | delivered | cancelled
  product: ProductInfo;
  seller?: { id: string; name?: string | null } | null;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  totalAmount: number | string;
  currency?: string;
  deliveryAddress: string;
  estimatedDeliveryTime?: string | null;
  shippingDistance?: number | null;
  paymentStatus?: string | null;
  feedback?: FeedbackInfo | null;
  createdAt?: string | Date;
  notes?: string | null;
}

// Helper: map internal status to badge styles and display label
function statusBadge(orderStatus: string) {
  const s = orderStatus.toLowerCase();
  const common = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "pending") return <span className={`${common} bg-yellow-100 text-yellow-800`}>Pending</span>;
  if (s === "confirmed") return <span className={`${common} bg-blue-100 text-blue-800`}>Paid</span>;
  if (s === "shipped") return <span className={`${common} bg-purple-100 text-purple-800`}>Shipped</span>;
  if (s === "delivered") return <span className={`${common} bg-green-100 text-green-800`}>Delivered</span>;
  if (s === "cancelled") return <span className={`${common} bg-red-100 text-red-800`}>Cancelled</span>;
  return <Badge variant="secondary">{orderStatus}</Badge>;
}

// Helper: format amount as RM
function formatAmount(amount: number | string | undefined, currency: string = "RM") {
  if (amount === undefined) return "-";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${currency} 0.00`;
  return `${currency} ${n.toFixed(2)}`;
}

// Debounce hook for search
function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function BuyerOrdersPage() {
  const [buyer, setBuyer] = useState<BuyerProfile | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sort, setSort] = useState<string>("newest");
  const debouncedSearch = useDebounced(search, 350);

  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [detailOpen, setDetailOpen] = useState<boolean>(false);

  // Feedback form state
  const [productRating, setProductRating] = useState<number>(5);
  const [sellerRating, setSellerRating] = useState<number>(5);
  const [productReview, setProductReview] = useState<string>("");
  const [sellerReview, setSellerReview] = useState<string>("");
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);

  // Fetch buyer profile first
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const user = getUserData();
        if (!user?.id) {
          setError("Please sign in to view your orders.");
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/user/businessBuyer?userId=${user.id}`);
        const json = await res.json();
        if (!json?.success || !json?.data) {
          setError("Business buyer profile not found. Please complete your profile.");
          setLoading(false);
          return;
        }
        setBuyer(json.data as BuyerProfile);
      } catch (e) {
        console.error(e);
        setError("Failed to load buyer profile.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch orders whenever filters change
  useEffect(() => {
    async function loadOrders() {
      if (!buyer?.id) return;
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("userId", buyer.id); // Note: buyer.id is BusinessBuyer.id
        if (activeTab && activeTab !== "all") params.set("status", activeTab);
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (sort) params.set("sort", sort);

        const res = await fetch(`/api/orders?${params.toString()}`);
        const json = await res.json();
        if (!json?.success) {
          setError(json?.error || "Failed to load orders");
          setOrders([]);
        } else {
          setOrders(Array.isArray(json.data) ? json.data : []);
        }
      } catch (e) {
        console.error(e);
        setError("Failed to load orders.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [buyer?.id, activeTab, debouncedSearch, sort]);

  // Actions
  async function handleCancelOrder(order: OrderItem) {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, action: "cancel" })
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to cancel order");
        return;
      }
      // Update state
      setOrders(prev => prev.map(o => (o.id === order.id ? json.data : o)));
      if (selectedOrder?.id === order.id) setSelectedOrder(json.data);
    } catch (e) {
      console.error(e);
      alert("Failed to cancel order");
    }
  }

  async function handleMarkReceived(order: OrderItem) {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: "delivered" })
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to update order status");
        return;
      }
      setOrders(prev => prev.map(o => (o.id === order.id ? json.data : o)));
      if (selectedOrder?.id === order.id) setSelectedOrder(json.data);
    } catch (e) {
      console.error(e);
      alert("Failed to update order");
    }
  }

  function handleReorder(order: OrderItem) {
    // Redirect to checkout with productId pre-selected
    window.location.href = `/buyer/checkout?productId=${order.product.id}`;
  }

  function openDetails(order: OrderItem) {
    setSelectedOrder(order);
    setDetailOpen(true);
    // Prefill feedback state when opening
    if (order.feedback) {
      setProductRating(order.feedback.productRating || 5);
      setSellerRating(order.feedback.sellerRating || 5);
      setProductReview(order.feedback.productReview || "");
      setSellerReview(order.feedback.sellerReview || "");
    } else {
      setProductRating(5);
      setSellerRating(5);
      setProductReview("");
      setSellerReview("");
    }
  }

  async function submitFeedback() {
    if (!selectedOrder) return;
    if (!buyer?.id) return;
    if (productRating < 1 || productRating > 5 || sellerRating < 1 || sellerRating > 5) {
      alert("Ratings must be between 1 and 5");
      return;
    }
    try {
      setSubmittingFeedback(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productRating,
          sellerRating,
          productReview: productReview || undefined,
          sellerReview: sellerReview || undefined,
        })
      });
      const json = await res.json();
      if (!json?.success) {
        alert(json?.error || "Failed to submit feedback");
        return;
      }
      const fb = json.data as FeedbackInfo;
      // Update local state
      setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? { ...o, feedback: fb } : o)));
      setSelectedOrder(prev => (prev ? { ...prev, feedback: fb } : prev));
      alert("Thank you for your feedback!");
    } catch (e) {
      console.error(e);
      alert("Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  }

  const tabs = useMemo(
    () => [
      { label: "All", value: "all" },
      { label: "Pending", value: "pending" },
      { label: "Paid", value: "confirmed" },
      { label: "Shipped", value: "shipped" },
      { label: "Delivered", value: "delivered" },
      { label: "Cancelled", value: "cancelled" },
    ],
    []
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My Orders</h1>
          <p className="text-sm text-gray-500">View and manage all your orders in one place.</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            placeholder="Search by product or seller"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full flex-wrap gap-2">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-sm text-gray-500">Loading orders...</div>
              ) : error ? (
                <div className="py-10 text-center text-sm text-red-600">{error}</div>
              ) : orders.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">No orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[240px]">Product</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Shipping</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => {
                        const firstImage = order.product?.productImages?.[0];
                        const sellerName = order.product?.agribusiness?.businessName || order.seller?.name || "-";
                        return (
                          <TableRow key={order.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {firstImage ? (
                                  <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                                    {/* Use next/image when possible; fallback to img for non-configured domains */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={firstImage} alt={order.product.productTitle} className="h-full w-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">No image</div>
                                )}
                                <div>
                                  <div className="line-clamp-1 font-medium text-gray-900">{order.product.productTitle}</div>
                                  <div className="text-xs text-gray-500">{new Date(order.createdAt || "").toLocaleDateString()}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{sellerName}</TableCell>
                            <TableCell className="text-sm font-mono">{order.id}</TableCell>
                            <TableCell className="text-sm">{order.quantity}</TableCell>
                            <TableCell className="text-sm">{formatAmount(Number(order.totalAmount), order.currency || "RM")}</TableCell>
                            <TableCell className="text-sm">{order.shippingDistance != null ? `${order.shippingDistance.toFixed(1)} km` : "-"}</TableCell>
                            <TableCell>{statusBadge(order.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="secondary" size="sm" onClick={() => openDetails(order)} className="cursor-pointer">Details</Button>
                                <Button variant="outline" size="sm" onClick={() => handleReorder(order)} className="cursor-pointer">Reorder</Button>
                                {/* {order.status === "shipped" && (
                                  <Button size="sm" onClick={() => handleMarkReceived(order)} className="cursor-pointer">Mark received</Button>
                                )}
                                {order.status !== "shipped" && order.status !== "delivered" && order.status !== "cancelled" && (
                                  <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order)} className="cursor-pointer">Cancel</Button>
                                )} */}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 md:space-y-6">
              {/* Top summary */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {selectedOrder.product.productImages?.[0] ? (
                    <div className="relative h-12 w-12 md:h-14 md:w-14 overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selectedOrder.product.productImages[0]} alt={selectedOrder.product.productTitle} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-md border bg-gray-100 text-xs text-gray-500">No image</div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900 text-sm md:text-base">{selectedOrder.product.productTitle}</div>
                    <div className="text-xs text-gray-500">Order ID: {selectedOrder.id}</div>
                  </div>
                </div>
                <div className="text-right mt-2 sm:mt-0">
                  <div className="text-xs md:text-sm">Total</div>
                  <div className="text-base md:text-lg font-semibold">{formatAmount(Number(selectedOrder.totalAmount), selectedOrder.currency || "RM")}</div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2">
                <Card className="p-3 md:p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xs md:text-sm">Product Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs md:text-sm p-0">
                    <div className="flex justify-between"><span className="text-gray-500">Title</span><span className="font-medium">{selectedOrder.product.productTitle}</span></div>
                    {selectedOrder.product.cropCategory && (
                      <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{selectedOrder.product.cropCategory}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-medium">{selectedOrder.quantity}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Unit Price</span><span className="font-medium">{formatAmount(Number(selectedOrder.unitPrice), selectedOrder.currency || "RM")}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatAmount(Number(selectedOrder.subtotal), selectedOrder.currency || "RM")}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-medium">{formatAmount(Number(selectedOrder.shippingCost), selectedOrder.currency || "RM")}</span></div>
                  </CardContent>
                </Card>

                <Card className="p-3 md:p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xs md:text-sm">Seller Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs md:text-sm p-0">
                    <div className="flex justify-between"><span className="text-gray-500">Business</span><span className="font-medium">{selectedOrder.product.agribusiness?.businessName || selectedOrder.seller?.name || "-"}</span></div>
                    <div className="flex items-center justify-between"><span className="text-gray-500">Status</span><span>{statusBadge(selectedOrder.status)}</span></div>
                  </CardContent>
                </Card>

                <Card className="p-3 md:p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xs md:text-sm">Delivery & Shipping</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs md:text-sm p-0">
                    <div className="text-gray-500">Address</div>
                    <div className="rounded-md border bg-white p-2 text-gray-900 text-xs md:text-sm">{selectedOrder.deliveryAddress}</div>
                    {selectedOrder.estimatedDeliveryTime && (
                      <div className="flex justify-between"><span className="text-gray-500">ETA</span><span className="font-medium">{selectedOrder.estimatedDeliveryTime}</span></div>
                    )}
                    {selectedOrder.shippingDistance != null && (
                      <div className="flex justify-between"><span className="text-gray-500">Distance</span><span className="font-medium">{selectedOrder.shippingDistance.toFixed(1)} km</span></div>
                    )}
                  </CardContent>
                </Card>

                <Card className="p-3 md:p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xs md:text-sm">Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs md:text-sm p-0">
                    <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-medium">Card</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium capitalize">{selectedOrder.paymentStatus || "paid"}</span></div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <Card className="p-3 md:p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xs md:text-sm">Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-md border bg-gray-50 p-2 text-gray-700 text-xs md:text-sm">
                      {selectedOrder.notes}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback form */}
              {selectedOrder.status === "delivered" && !selectedOrder.feedback && (
                <Card className="p-3 md:p-4">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="text-xs md:text-sm">Leave Feedback</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 text-xs md:text-sm p-0">
                    <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-gray-600">Product Rating (1-5)</div>
                        <Input type="number" min={1} max={5} value={productRating} onChange={(e) => setProductRating(Number(e.target.value))} className="h-8 md:h-9" />
                      </div>
                      <div>
                        <div className="mb-1 text-gray-600">Seller Rating (1-5)</div>
                        <Input type="number" min={1} max={5} value={sellerRating} onChange={(e) => setSellerRating(Number(e.target.value))} className="h-8 md:h-9" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-gray-600">Product Review (optional)</div>
                      <textarea className="min-h-[60px] md:min-h-[90px] w-full resize-y rounded-md border p-2 text-xs md:text-sm outline-none focus:ring-2 focus:ring-gray-900" value={productReview} onChange={(e) => setProductReview(e.target.value)} />
                    </div>
                    <div>
                      <div className="mb-1 text-gray-600">Seller Review (optional)</div>
                      <textarea className="min-h-[60px] md:min-h-[90px] w-full resize-y rounded-md border p-2 text-xs md:text-sm outline-none focus:ring-2 focus:ring-gray-900" value={sellerReview} onChange={(e) => setSellerReview(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setDetailOpen(false)}>Close</Button>
                      <Button size="sm" onClick={submitFeedback} disabled={submittingFeedback}>{submittingFeedback ? "Submitting..." : "Submit Feedback"}</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Footer actions */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-gray-500 text-center sm:text-left">Placed on {new Date(selectedOrder.createdAt || "").toLocaleString()}</div>
                <div className="flex gap-2 justify-center sm:justify-end">
                  <Button variant="outline" size="sm" className='cursor-pointer' onClick={() => handleReorder(selectedOrder)}>Reorder</Button>
                  {selectedOrder.status === "shipped" && (
                    <Button size="sm" className='cursor-pointer' onClick={() => handleMarkReceived(selectedOrder)}>Mark received</Button>
                  )}
                  {selectedOrder.status !== "shipped" && selectedOrder.status !== "delivered" && selectedOrder.status !== "cancelled" && (
                    <Button variant="destructive" size="sm" className='cursor-pointer' onClick={() => handleCancelOrder(selectedOrder)}>Cancel Order</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}