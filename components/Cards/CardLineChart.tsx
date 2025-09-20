import React from "react";
import { Chart } from "chart.js/auto";
import { getUserData } from "@/lib/localStorage";

/**
 * Line chart component for displaying sales data over time using real orders
 * - Resolves current user's Agribusiness ID
 * - Fetches orders for seller via /api/orders?sellerId=
 * - Aggregates monthly revenue for current and previous year
 */
export default function CardLineChart() {
  React.useEffect(() => {
    let chartInstance: Chart | null = null;
    const user = getUserData();

    const load = async () => {
      try {
        if (!user?.id) return;
        // Resolve seller agribusiness ID
        const abResp = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const abJson = await abResp.json();
        const sellerId: string | undefined = abJson?.data?.id;
        if (!abResp.ok || !sellerId) return;

        // Fetch orders for this seller
        const params = new URLSearchParams();
        params.set("sellerId", sellerId);
        const ordersResp = await fetch(`/api/orders?${params.toString()}`);
        const ordersJson = await ordersResp.json();
        if (!ordersResp.ok) return;

        const orders: Array<{ totalAmount: number; status: string; createdAt: string }> = (ordersJson?.data || []).map((o: any) => ({
          totalAmount: Number(o?.totalAmount || 0),
          status: String(o?.status || "unknown"),
          createdAt: String(o?.createdAt || new Date().toISOString()),
        }));

        const now = new Date();
        const thisYear = now.getFullYear();
        const lastYear = thisYear - 1;
        const labels = Array.from({ length: 12 }, (_, m) => new Date(thisYear, m, 1).toLocaleString("en-US", { month: "short" }));

        const revenueStatuses = new Set(["delivered", "shipped", "ready_for_pickup", "confirmed", "paid"]);
        const nonCancelled = orders.filter((o) => o.status !== "cancelled" && o.status !== "payment_failed");

        const byYearMonth = (year: number) => {
          const arr = Array(12).fill(0);
          nonCancelled.forEach((o) => {
            const d = new Date(o.createdAt);
            if (d.getFullYear() === year && revenueStatuses.has(o.status)) {
              const m = d.getMonth();
              arr[m] += o.totalAmount || 0;
            }
          });
          return arr.map((v) => Number(v.toFixed(2)));
        };

        const currentYearData = byYearMonth(thisYear);
        const previousYearData = byYearMonth(lastYear);

        const config = {
          type: "line" as const,
          data: {
            labels,
            datasets: [
              {
                label: thisYear.toString(),
                backgroundColor: "#4c51bf",
                borderColor: "#4c51bf",
                data: currentYearData,
                fill: false,
              },
              {
                label: lastYear.toString(),
                fill: false,
                backgroundColor: "#fff",
                borderColor: "#fff",
                data: previousYearData,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              title: { display: false, text: "Sales Charts", color: "white" },
              legend: { labels: { color: "white" }, align: "end" as const, position: "bottom" as const },
              tooltip: { mode: "index" as const, intersect: false },
            },
            hover: { mode: "nearest" as const, intersect: true },
            scales: {
              x: { ticks: { color: "rgba(255,255,255,.7)" }, display: true, title: { display: false, text: "Month", color: "white" }, grid: { display: false, borderDash: [2], borderDashOffset: [2], color: "rgba(33, 37, 41, 0.3)", zeroLineColor: "rgba(0, 0, 0, 0)", zeroLineBorderDash: [2], zeroLineBorderDashOffset: [2] } },
              y: { ticks: { color: "rgba(255,255,255,.7)" }, display: true, title: { display: false, text: "Value", color: "white" }, grid: { borderDash: [3], borderDashOffset: [3], drawBorder: false, color: "rgba(255, 255, 255, 0.15)", zeroLineColor: "rgba(33, 37, 41, 0)", zeroLineBorderDash: [2], zeroLineBorderDashOffset: [2] } },
            },
          },
        };

        const ctx = document.getElementById("line-chart") as HTMLCanvasElement;
        if (ctx) {
          chartInstance = new Chart(ctx, config as any);
        }
      } catch (e) {
        console.error("CardLineChart load error", e);
      }
    };

    load();

    // Cleanup function to destroy chart on unmount
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  }, []);

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-blueGray-700">
        <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full max-w-full flex-grow flex-1">
              <h6 className="uppercase text-blueGray-100 mb-1 text-xs font-semibold">Overview</h6>
              <h2 className="text-white text-xl font-semibold">Sales value</h2>
            </div>
          </div>
        </div>
        <div className="p-4 flex-auto">
          {/* Chart */}
          <div className="relative h-350-px">
            <canvas id="line-chart"></canvas>
          </div>
        </div>
      </div>
    </>
  );
}
