"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserData } from "@/lib/localStorage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Printer, Filter } from "lucide-react";

// Lightweight shapes based on /api/orders and related includes
interface ReportOrderItem {
  id: string; // formatted order number (e.g., ORD-XXXX)
  totalAmount: number;
  status: string;
  createdAt: string;
  product?: { productTitle?: string | null } | null;
}

// Helper: format a number as currency
function formatCurrency(amount: number, currency: string = "RM"): string {
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency === "RM" ? "MYR" : currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Helper: month label from Date
function monthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "long" });
}

export default function SellerSalesReportPage() {
  const router = useRouter();
  const user = getUserData();

  // Filters
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [status, setStatus] = useState<string>("all");

  // Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [agribusinessId, setAgribusinessId] = useState<string | null>(null);
  const [orders, setOrders] = useState<ReportOrderItem[]>([]);

  /**
   * Fetch current user's Agribusiness ID, then fetch seller orders using /api/orders?sellerId=
   */
  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setError("You must be signed in to view the report.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1) Get agribusiness id
      const abResp = await fetch(`/api/user/agribusiness?userId=${user.id}`);
      const abData = await abResp.json();
      const abId = abData?.data?.id as string | undefined;
      if (!abResp.ok || !abId) {
        throw new Error("Failed to resolve your Agribusiness profile.");
      }
      setAgribusinessId(abId);

      // 2) Build query to fetch orders for this seller
      const params = new URLSearchParams();
      params.set("sellerId", abId);
      if (status && status !== "all") params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const ordersResp = await fetch(`/api/orders?${params.toString()}`);
      const ordersJson = await ordersResp.json();
      if (!ordersResp.ok) {
        throw new Error(ordersJson?.error || "Failed to fetch orders.");
      }

      const items: ReportOrderItem[] = (ordersJson?.data || []).map((o: ReportOrderItem) => ({
        id: o?.id,
        totalAmount: Number(o?.totalAmount || 0),
        status: String(o?.status || "unknown"),
        createdAt: o?.createdAt,
        product: o?.product ? { productTitle: o.product.productTitle } : undefined,
      }));

      setOrders(items);
    } catch (e) {
      setError("Unexpected error while loading report.");
    } finally {
      setLoading(false);
    }
  }, [user?.id, status, dateFrom, dateTo]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived metrics
  const metrics = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        avgOrderValue: 0,
      };
    }

    const countByIncluded = (o: ReportOrderItem) => o.status !== "cancelled" && o.status !== "payment_failed";
    const revenueStatuses = new Set(["delivered", "shipped", "ready_for_pickup", "confirmed", "paid"]);

    const filtered = orders.filter(countByIncluded);

    const totalRevenue = filtered
      .filter((o) => revenueStatuses.has(o.status))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "delivered").length;
    const pendingOrders = orders.filter((o) => ["pending", "confirmed", "ready_for_pickup", "shipped"].includes(o.status)).length;
    const avgOrderValue = filtered.length ? totalRevenue / filtered.length : 0;

    return { totalRevenue, totalOrders, completedOrders, pendingOrders, avgOrderValue };
  }, [orders]);

  // Monthly breakdown for the current year
  const monthlyBreakdown = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const map: Record<number, { sales: number; count: number }> = {};

    for (let m = 0; m < 12; m++) map[m] = { sales: 0, count: 0 };

    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      if (d.getFullYear() === year && o.status !== "cancelled" && o.status !== "payment_failed") {
        const m = d.getMonth();
        map[m].count += 1;
        if (["delivered", "shipped", "ready_for_pickup", "confirmed", "paid"].includes(o.status)) {
          map[m].sales += Number(o.totalAmount || 0);
        }
      }
    });

    const rows = Array.from({ length: 12 }, (_, idx) => {
      const monthDate = new Date(year, idx, 1);
      return {
        month: monthLabel(monthDate),
        sales: map[idx].sales,
        count: map[idx].count,
      };
    });

    return rows;
  }, [orders]);

  // Top products by revenue
  const topProducts = useMemo(() => {
    const agg: Record<string, { sales: number; count: number }> = {};
    orders.forEach((o) => {
      const title = o.product?.productTitle || "Unknown Product";
      if (!agg[title]) agg[title] = { sales: 0, count: 0 };
      agg[title].count += 1;
      if (["delivered", "shipped", "ready_for_pickup", "confirmed", "paid"].includes(o.status)) {
        agg[title].sales += Number(o.totalAmount || 0);
      }
    });
    const arr = Object.entries(agg)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
    return arr;
  }, [orders]);

  /**
   * Trigger the browser's print dialog so the user can "Save as PDF" without extra dependencies
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-4 md:px-10 mx-auto w-full">
      {/* Toolbar - not printed */}
      <div className="no-print sticky top-0 z-10 bg-white/70 backdrop-blur border-b py-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div className="text-gray-500 text-sm hidden md:block">Seller Performance Report</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
              <select
                className="border rounded px-2 py-1 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                title="Status filter"
              >
                <option value="all">All statuses</option>
                <option value="active">Active (pending/paid/shipped)</option>
                <option value="completed">Completed (delivered)</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="ready_for_pickup">Ready for pickup</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
              <Button variant="secondary" className="flex items-center gap-2" onClick={fetchData}>
                <Filter className="w-4 h-4" /> Apply
              </Button>
            </div>
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Content area to print */}
      <div className="print-area space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-bold">Sales Performance Report</h1>
          <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
          {agribusinessId && (
            <p className="text-xs text-gray-400">Agribusiness ID: {agribusinessId}</p>
          )}
        </header>

        {/* Loading / Error states */}
        {loading && (
          <div className="text-center text-gray-500">Loading report...</div>
        )}
        {error && !loading && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Failed to load</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && !error && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="print-card">
                <CardHeader>
                  <CardTitle>Total Revenue</CardTitle>
                  <CardDescription>Delivered/paid orders</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCurrency(metrics.totalRevenue)}
                </CardContent>
              </Card>

              <Card className="print-card">
                <CardHeader>
                  <CardTitle>Total Orders</CardTitle>
                  <CardDescription>All orders</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {metrics.totalOrders}
                </CardContent>
              </Card>

              <Card className="print-card">
                <CardHeader>
                  <CardTitle>Completed</CardTitle>
                  <CardDescription>Delivered orders</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {metrics.completedOrders}
                </CardContent>
              </Card>

              <Card className="print-card">
                <CardHeader>
                  <CardTitle>Average Order Value</CardTitle>
                  <CardDescription>Delivered/paid only</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {formatCurrency(metrics.avgOrderValue)}
                </CardContent>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card className="print-card">
              <CardHeader>
                <CardTitle>Monthly Breakdown (Current Year)</CardTitle>
                <CardDescription>Sales and order count by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-2 border">Month</th>
                        <th className="text-right p-2 border">Sales</th>
                        <th className="text-right p-2 border">Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyBreakdown.map((row) => (
                        <tr key={row.month}>
                          <td className="p-2 border">{row.month}</td>
                          <td className="p-2 border text-right">{formatCurrency(row.sales)}</td>
                          <td className="p-2 border text-right">{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card className="print-card">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>By revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-sm text-gray-500">No products to display.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">Product</th>
                          <th className="text-right p-2 border">Revenue</th>
                          <th className="text-right p-2 border">Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((p) => (
                          <tr key={p.name}>
                            <td className="p-2 border">{p.name}</td>
                            <td className="p-2 border text-right">{formatCurrency(p.sales)}</td>
                            <td className="p-2 border text-right">{p.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="print-card">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest 20 orders</CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-sm text-gray-500">No orders found for the selected filters.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border">Order #</th>
                          <th className="text-left p-2 border">Product</th>
                          <th className="text-left p-2 border">Status</th>
                          <th className="text-right p-2 border">Amount</th>
                          <th className="text-left p-2 border">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders
                          .slice(0, 20)
                          .map((o) => (
                            <tr key={o.id}>
                              <td className="p-2 border">{o.id}</td>
                              <td className="p-2 border">{o.product?.productTitle || "-"}</td>
                              <td className="p-2 border capitalize">{o.status.replaceAll("_", " ")}</td>
                              <td className="p-2 border text-right">{formatCurrency(Number(o.totalAmount || 0))}</td>
                              <td className="p-2 border">{new Date(o.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="page-break" />
          </>
        )}
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-card { break-inside: avoid; }
          .page-break { page-break-after: always; }
          html, body { background: white; }
        }
      `}</style>
    </div>
  );
}