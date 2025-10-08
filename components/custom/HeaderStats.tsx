import React, { useEffect, useMemo, useState } from "react";
import CardStats from "@/components/Cards/CardStats";
import { getUserData } from "@/lib/localStorage";

interface ReportOrderItem {
  totalAmount: number;
  status: string;
  createdAt: string;
  product?: { productTitle?: string | null } | null;
}

// Type definition for API order response
interface ApiOrderResponse {
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  product?: {
    productTitle?: string | null;
  } | null;
}

/**
 * Header component displaying dashboard statistics using real seller data
 * - Resolves current user's Agribusiness ID
 * - Fetches orders for the seller via /api/orders?sellerId=
 * - Computes Total Sales (revenue-like statuses), Pending Orders, Completed Orders, and Performance Rate
 */
export default function HeaderStats() {
  const userData = getUserData();

  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<ReportOrderItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!userData?.id) return;
        // Get agribusiness id for current seller
        const abResp = await fetch(`/api/user/agribusiness?userId=${userData.id}`);
        const abJson = await abResp.json();
        const sellerId: string | undefined = abJson?.data?.id;
        if (!abResp.ok || !sellerId) return;

        // Fetch orders for this seller
        const params = new URLSearchParams();
        params.set("sellerId", sellerId);
        const ordersResp = await fetch(`/api/orders?${params.toString()}`);
        const ordersJson = await ordersResp.json();
        if (ordersResp.ok) {
          const items: ReportOrderItem[] = (ordersJson?.data || []).map((o: ApiOrderResponse) => ({
            totalAmount: Number(o?.totalAmount || 0),
            status: String(o?.status || "unknown"),
            createdAt: String(o?.createdAt || new Date().toISOString()),
            product: o?.product ? { productTitle: o.product.productTitle } : undefined,
          }));
          setOrders(items);
        }
      } catch (e) {
        // Silently fail to keep header rendering
        console.error("HeaderStats load error", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        performanceRate: 0,
      };
    }

    const revenueStatuses = new Set(["delivered", "shipped", "ready_for_pickup", "confirmed", "paid"]);
    const nonCancelled = orders.filter((o) => o.status !== "cancelled" && o.status !== "payment_failed");

    const totalRevenue = nonCancelled
      .filter((o) => revenueStatuses.has(o.status))
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "delivered").length;
    const pendingOrders = orders.filter((o) => ["pending", "confirmed", "ready_for_pickup", "shipped"].includes(o.status)).length;
    const performanceRate = nonCancelled.length
      ? Math.round(
          (nonCancelled.filter((o) => revenueStatuses.has(o.status)).length / nonCancelled.length) * 100
        )
      : 0;

    return { totalRevenue, totalOrders, completedOrders, pendingOrders, performanceRate };
  }, [orders]);

  return (
    <>
      {/* Header */}
      <div className="relative bg-blueGray-800 md:pt-20 pb-32 pt-12">
        <div className="px-4 md:px-10 mx-auto w-full">
          <div>
            {/* Card stats */}
            <div className="flex flex-wrap">
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Total Sales"
                  statTitle={`RM ${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                  statArrow={"up"}
                  statPercent={"0"}
                  statPercentColor="text-emerald-500"
                  statDescripiron="All time"
                  statIconName="far fa-chart-bar"
                  statIconColor="bg-red-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Pending Orders"
                  statTitle={metrics.pendingOrders.toLocaleString()}
                  statArrow={"up"}
                  statPercent={"0"}
                  statPercentColor="text-red-500"
                  statDescripiron="All time"
                  statIconName="fas fa-chart-pie"
                  statIconColor="bg-orange-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Completed Orders"
                  statTitle={metrics.completedOrders.toString()}
                  statArrow={"up"}
                  statPercent={"0"}
                  statPercentColor="text-orange-500"
                  statDescripiron="All time"
                  statIconName="fa-solid fa-clipboard-check"
                  statIconColor="bg-pink-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="PERFORMANCE"
                  statTitle={`${metrics.performanceRate}%`}
                  statArrow={"up"}
                  statPercent={"0"}
                  statPercentColor="text-emerald-500"
                  statDescripiron="Fulfillment Rate"
                  statIconName="fas fa-percent"
                  statIconColor="bg-lightBlue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
