"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LogisticsProfileDialog from "@/components/custom/LogisticsProfileDialog";
import { getUserData } from "@/lib/localStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, PackageSearch, CheckCircle2, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";

// Types for orders and statuses used by the dashboard
export type StatusType =
  | "pending"
  | "confirmed"
  | "Ready to Pickup"
  | "Picked Up"
  | "In Transit"
  | "Delivered"
  | "Cancelled"
  | string;

export interface LogisticsOrder {
  id: string;
  businessName?: string;
  companyName?: string;
  location?: string; // pickup
  deliveryAddress?: string; // destination
  shippingDistance?: number | null;
  status: StatusType;
  // Optional fields if backend provides them
  estimatedDeliveryTime?: string | null;
  logisticsFee?: number | null; // or shippingCost
  shippingCost?: number | null;
  createdAt?: string | null;
  deliveredAt?: string | null;
}

// Helper: format a number as currency
const formatCurrency = (n: number) =>
  n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

// Helper: build className strings conditionally
function classNames(...arr: (string | false | undefined)[]) {
  return arr.filter(Boolean).join(" ");
}

export default function LogisticsDashboard() {
  // Friendly page header message
  // const welcomeMessages = [
  //   "Welcome to your logistics command center! 🚚",
  //   "Ready to manage your deliveries? Let's get started! 📦",
  //   "Your logistics dashboard awaits - time to move some cargo! 🌟",
  //   "Welcome aboard the logistics express! 🚛",
  //   "Command your fleet from here - welcome back! 🗺️",
  // ];
  // const randomMessage = useMemo(
  //   () => welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
  //   []
  // );

  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [logisticsPartnerId, setLogisticsPartnerId] = useState<string>("");
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /** Check whether user has incomplete logistics profile and open the setup dialog if needed */
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const user = getUserData();
        if (!user?.id) return;
        const resp = await fetch(`/api/user/logistics?userId=${user.id}`);
        if (!resp.ok) return; // silently ignore if not found
        const data = await resp.json();
        if (!data?.success || !data?.data) return;
        const p = data.data as {
          id: string;
          companyAddress?: string | null;
          businessImage?: string | null;
          contactNo?: string | null;
          serviceAreas?: string[] | null;
          transportModes?: string[] | null;
        };
        setLogisticsPartnerId(p.id);
        const missing =
          !p.companyAddress ||
          !p.businessImage ||
          !p.contactNo ||
          !p.serviceAreas?.length ||
          !p.transportModes?.length;
        if (missing) setProfileDialogOpen(true);
      } catch (e) {
        console.error("Failed to check logistics profile:", e);
      }
    };
    checkProfile();
  }, []);

  /** Fetch all orders assigned to this logistics provider */
  const fetchOrders = async () => {
    if (!logisticsPartnerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/logistics/orders?logisticsPartnerId=${encodeURIComponent(logisticsPartnerId)}&statusNot=cancelled`
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Failed to load orders");
      setOrders(data.data as LogisticsOrder[]);
    } catch (e) {
      setError(e?.toString() || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (logisticsPartnerId) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logisticsPartnerId]);

  // Derived metrics for KPI cards and alerts
  const totalAssigned = orders.length;
  const inProgress = orders.filter((o) => ["Picked Up", "In Transit"].includes(o.status)).length;
  const completed = orders.filter((o) => o.status === "Delivered").length;
  const totalEarnings = orders.reduce(
    (sum, o) => sum + (o.logisticsFee || o.shippingCost || 0),
    0
  );

  const pendingPickups = orders.filter((o) => ["confirmed", "Ready to Pickup"].includes(o.status)).length;
  const cancelled = 0; // Cancelled orders are now excluded from the dataset
  const delayed = orders.filter((o) => {
    if (!o.estimatedDeliveryTime) return false;
    const eta = new Date(o.estimatedDeliveryTime);
    return eta.getTime() < Date.now() && o.status !== "Delivered";
  }).length;

  // Prepare a minimal bar chart data (Completed deliveries in last 7 days)
  const chartDays = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const deliveredByDay = chartDays.map((day) => {
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = orders.filter((o) => {
      if (o.status !== "Delivered") return false;
      const t = o.deliveredAt || o.createdAt || null;
      if (!t) return false;
      const dt = new Date(t);
      return dt >= day && dt < next;
    }).length;
    return count;
  });
  const maxDelivered = Math.max(1, ...deliveredByDay);

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <LogisticsProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Dashboard</h1>
          {/* <p className="text-gray-600 mt-1">{randomMessage}</p> */}
        </div>
        <Button variant="default" onClick={fetchOrders} className="bg-green-700 hover:bg-green-800">
          Refresh Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Shipments Assigned</CardTitle>
            <PackageSearch className="h-5 w-5 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAssigned}</div>
            <p className="text-xs text-gray-500 mt-1">All active and historical assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Shipments In Progress</CardTitle>
            <Truck className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgress}</div>
            <p className="text-xs text-gray-500 mt-1">Picked Up / In Transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed Deliveries</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completed}</div>
            <p className="text-xs text-gray-500 mt-1">Marked as Delivered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            <DollarSign className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-gray-500 mt-1">Based on available order fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Activity Chart */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Shipment Activity (Last 7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveredByDay.every((n) => n === 0) ? (
              <div className="text-sm text-gray-500">No deliveries recorded in the past week.</div>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {deliveredByDay.map((n, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end">
                    <div
                      className="w-8 rounded-md bg-gradient-to-t from-indigo-500 to-indigo-300 shadow-sm"
                      style={{ height: `${Math.max(6, Math.round((n / maxDelivered) * 140))}px` }}
                    />
                    <div className="mt-2 text-[10px] text-gray-500">
                      {chartDays[idx].toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                    <div className="text-[11px] text-gray-900 font-medium">{n}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications / Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Notifications & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Pending pickups</div>
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{pendingPickups}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Potentially delayed</div>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{delayed}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">Cancelled / Flagged</div>
              <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200">{cancelled}</Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Cancelled orders are not assigned to logistics partners
            </div>
            <div className="pt-2">
              <Link
                href="/logistics/delivery/list-page"
                className="text-sm text-indigo-600 hover:text-indigo-800 underline"
              >
                View all deliveries
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">Recent Orders</CardTitle>
          <Link href="/logistics/delivery/list-page">
            <Button variant="outline" className="h-8">View All Deliveries</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Order ID</TableHead>
                  <TableHead className="whitespace-nowrap">Pickup</TableHead>
                  <TableHead className="whitespace-nowrap">Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="whitespace-nowrap">ETA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-gray-500">
                      Loading orders...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-red-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-gray-500">
                      No orders assigned yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  [...orders]
                    .sort((a, b) => {
                      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return bt - at;
                    })
                    .slice(0, 5)
                    .map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{o.id}</span>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={o.location || "-"}>
                          {o.location || "-"}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate" title={o.deliveryAddress || "-"}>
                          {o.deliveryAddress || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={classNames(
                              "capitalize",
                              o.status === "Delivered" && "bg-green-100 text-green-800",
                              ["Picked Up", "In Transit"].includes(o.status) && "bg-indigo-100 text-indigo-800",
                              ["confirmed", "Ready to Pickup"].includes(o.status) && "bg-yellow-100 text-yellow-800"
                              // Removed cancelled status styling since cancelled orders are now excluded
                            )}
                          >
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {o.estimatedDeliveryTime
                            ? new Date(o.estimatedDeliveryTime).toLocaleDateString()
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
