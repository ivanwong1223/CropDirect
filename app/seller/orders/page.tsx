"use client";

import React, { useEffect, useMemo, useState, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getUserData } from "@/lib/localStorage";
import NotificationContainer from "@/components/custom/NotificationContainer";
import { CheckCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";

// Types for API responses
interface AgribusinessProfile {
  id: string;
  businessName?: string | null;
}

interface BuyerInfo {
  id: string;
  companyName?: string | null;
  user?: { id: string; name?: string | null; email?: string | null } | null;
}

interface ProductInfo {
  id: string;
  productTitle: string;
  cropCategory?: string | null;
  productImages?: string[];
}

interface OrderItem {
  id: string;
  orderNumber?: string;
  status: string; // pending | confirmed | shipped | delivered | cancelled
  isBid?: boolean;
  product: ProductInfo;
  buyer: BuyerInfo;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
  shippingCost: number | string;
  totalAmount: number | string;
  currency?: string;
  createdAt?: string | Date;
}

/**
 * Formats numeric amounts for display with a currency prefix.
 * Ensures two decimal places and gracefully handles string inputs.
 *
 * @param amount - The amount to format, accepts number or numeric string.
 * @param currency - Currency prefix to display (default: "RM").
 * @returns A formatted string like "RM 10.00" or "-" if undefined.
 */
function formatAmount(amount: number | string | undefined, currency: string = "RM") {
  if (amount === undefined) return "-";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return `${currency} 0.00`;
  return `${currency} ${n.toFixed(2)}`;
}

/**
 * Renders a colored status badge based on the order status.
 * Known statuses are mapped to distinctive colors; unknown status renders a neutral badge.
 *
 * @param props.status - The textual status of an order (e.g., pending, confirmed).
 */
function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const common = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "pending") return <span className={`${common} bg-yellow-100 text-yellow-800`}>Pending</span>;
  if (s === "confirmed") return <span className={`${common} bg-green-100 text-green-800`}>Confirmed</span>;
  if (s === "ready_for_pickup") return <span className={`${common} bg-orange-100 text-orange-800`}>Ready for Pickup</span>;
  if (s === "cancelled") return <span className={`${common} bg-red-100 text-red-800`}>Cancelled</span>;
  if (s === "shipped") return <span className={`${common} bg-purple-100 text-purple-800`}>Shipped</span>;
  if (s === "delivered") return <span className={`${common} bg-blue-100 text-blue-800`}>Delivered</span>;
  return <span className={`${common} bg-gray-100 text-gray-800`}>{status}</span>;
}

/**
 * React hook: returns a debounced copy of a value that updates after the specified delay.
 * Useful for throttling user input (e.g., search fields) to reduce API calls.
 *
 * @param value - The source value to debounce.
 * @param delay - The debounce delay in milliseconds (default: 350ms).
 * @returns The debounced value.
 */
function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * SellerOrdersPage
 * Displays a paginated/filterable list of the seller's orders with search and date filters.
 * Pulls the current seller (agribusiness) profile, then fetches orders scoped to that seller.
 * Provides navigation to per-order details.
 */
function SellerOrdersForm() {
  const searchParams = useSearchParams();
  const [seller, setSeller] = useState<AgribusinessProfile | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);
  const processedNotifications = useRef<Set<string>>(new Set());

  // Filters
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [bidFilter, setBidFilter] = useState<string>("all");
  const debouncedSearch = useDebounced(search, 350);

  // Derived
  // Short utility to render compact IDs in the table
  const shortId = (id?: string) => (id ? id.slice(0, 8) : "-");

  /**
   * Handles status updates for orders via the orders API.
   * Updates the order status and shows notification immediately.
   *
   * @param orderId - The ID of the order to update.
   * @param newStatus - The new status to set for the order.
   */
  async function handleStatusUpdate(orderId: string, newStatus: string) {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action: "update_status", status: newStatus }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.error || "Failed to update status");
      
      // Update the local orders state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // Show success notification immediately
      setNotifications((prev) => {
        const message = 'Order Status Updated Successfully!';
        const description = `Order ${orderId.slice(0, 8)} status has been updated to ${newStatus}.`;
        
        return [
          <div 
            key={`status-${Date.now()}`} 
            className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
            onAnimationEnd={() => {
              setTimeout(() => {
                setNotifications(prev => prev.slice(1));
              }, 5000);
            }}
            style={{
              animation: 'fadeOut 300ms ease-in-out 5s forwards'
            }}
          >
            <style jsx>{`
              @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
            `}</style>
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{message}</div>
              <div className="text-xs text-gray-600">{description}</div>
            </div>
          </div>,
          ...prev,
        ];
      });
    } catch (e) {
      console.error(e);
      alert("Failed to update order status");
    }
  }

  // Fetch seller profile (agribusiness) for the signed-in user
  useEffect(() => {
    async function fetchSeller() {
      try {
        setLoading(true);
        const user = getUserData();
        if (!user?.id) throw new Error("Not authenticated");
        const res = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const json = await res.json();
        if (!json?.success) throw new Error(json?.error || "Failed to load seller profile");
        setSeller({ id: json.data.id, businessName: json.data.businessName });
      } catch (e) {
        console.error(e);
        setError("Failed to initialize");
      } finally {
        setLoading(false);
      }
    }
    fetchSeller();
  }, []);

  // Fetch orders for seller whenever filters or seller context change
  useEffect(() => {
    async function fetchOrders() {
      if (!seller?.id) return;
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("sellerId", seller.id);
        if (status && status !== "all") params.set("status", status);
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (bidFilter && bidFilter !== "all") params.set("isBid", bidFilter === "bid" ? "true" : "false");
        params.set("sort", "newest");

        const res = await fetch(`/api/orders?${params.toString()}`);
        const json = await res.json();
        if (!json?.success) throw new Error(json?.error || "Failed to fetch orders");
        setOrders(json.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [seller?.id, status, debouncedSearch, dateFrom, dateTo, bidFilter]);

  // Check for success notification from URL params (only from order details page)
  useEffect(() => {
    const statusUpdated = searchParams.get('statusUpdated');
    const bidAction = searchParams.get('bidAction');
    const orderId = searchParams.get('orderId');
    
    // Create a unique key for this notification
    const notificationKey = `${bidAction || 'status'}-${orderId}-${statusUpdated}`;
    
    // Only show notifications for bid actions or status updates from order details page
    // and only if we haven't already processed this notification
    if ((bidAction || statusUpdated === 'true') && orderId && !processedNotifications.current.has(notificationKey)) {
      // Mark this notification as processed
      processedNotifications.current.add(notificationKey);
      
      // Show success notification
      setNotifications((prev) => {
        const message = bidAction ? 
          (bidAction === 'accepted' ? 'Bid Accepted Successfully!' : 'Bid Rejected Successfully!') :
          'Order Status Updated Successfully!';
        const description = bidAction ? 
          `The bid for order ${orderId.slice(0, 8)} has been ${bidAction}.` :
          `Order ${orderId.slice(0, 8)} status has been updated.`;
        
        return [
          <div 
            key={`status-${Date.now()}`} 
            className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
            onAnimationEnd={() => {
              setTimeout(() => {
                setNotifications(prev => prev.slice(1));
              }, 5000);
            }}
            style={{
              animation: 'fadeOut 300ms ease-in-out 5s forwards'
            }}
          >
            <style jsx>{`
              @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
            `}</style>
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{message}</div>
              <div className="text-xs text-gray-600">{description}</div>
            </div>
          </div>,
          ...prev,
        ];
      });
      
      // Clean up URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('statusUpdated');
      newUrl.searchParams.delete('bidAction');
      newUrl.searchParams.delete('orderId');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const rows = useMemo(() => {
    const sortedOrders = [...(orders || [])];
    // Sort by status: Ready for Pickup at top, Cancelled at bottom
    sortedOrders.sort((a, b) => {
      const statusOrder = { 
        'ready_for_pickup': 1,
        'pending': 0, 
        'confirmed': 2, 
        'shipped': 3,
        'delivered': 4,
        'cancelled': 5          // Bottom priority
      };
      const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
      const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
      return aOrder - bOrder;
    });
    return sortedOrders;
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      <NotificationContainer notifications={notifications} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      {/* Filters & Search */}
      <div className="p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by product or buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-1/2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3 flex gap-4 justify-end">
            <Select value={bidFilter} onValueChange={setBidFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Bid Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="bid">Bid Orders Only</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" placeholder="Select Date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[180px]" />
            <Button variant="outline" onClick={() => { setSearch(""); setStatus("all"); setBidFilter("all"); setDateFrom(""); setDateTo(""); }}>Clear</Button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading orders...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600 text-sm">{error}</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total (RM)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead className="text-right pr-7">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden bg-muted">
                            {o.product?.productImages?.[0] ? (
                              <Image src={o.product.productImages[0]} alt={o.product.productTitle} fill className="object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{o.product?.productTitle}</div>
                            {o.isBid ? (
                              <div className="space-y-1">
                                <div className="text-xs text-amber-700">Bidding</div>
                                <div className="text-xs text-green-700">Bid Price: {formatAmount(o.unitPrice)}</div>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {o.buyer?.companyName || o.buyer?.user?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{o.quantity}</TableCell>
                      <TableCell className="text-right">{formatAmount(o.totalAmount)}</TableCell>
                      <TableCell><StatusBadge status={o.status} /></TableCell>
                      <TableCell className="text-center">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/seller/orders/${o.id}`}>
                            <Button className="cursor-pointer" size="sm">View Details</Button>
                          </Link>
                          {o.status === 'confirmed' && (
                            <Button 
                              variant="outline" 
                              className="cursor-pointer" 
                              size="sm"
                              onClick={() => handleStatusUpdate(o.id, 'ready_for_pickup')}
                            >
                              Ready to Pickup
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Main SellerOrdersPage component wrapped with Suspense boundary
 * to handle useSearchParams SSR compatibility
 */
export default function SellerOrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SellerOrdersForm />
    </Suspense>
  );
}
