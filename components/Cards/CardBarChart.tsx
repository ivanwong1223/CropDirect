import React from "react";
import { Chart, ChartConfiguration } from "chart.js/auto";
import { getUserData } from "@/lib/localStorage";

// Type definitions for order data
interface OrderData {
  status: string;
  createdAt: string;
}

interface ApiOrderResponse {
  status?: string;
  createdAt?: string;
}

/**
 * Bar chart component for displaying orders count over time using real data
 * - Resolves current user's Agribusiness (seller) ID
 * - Fetches orders via /api/orders?sellerId=
 * - Aggregates monthly order counts for current and previous year
 */
export default function CardBarChart() {
  React.useEffect(() => {
    let chartInstance: Chart | null = null;

    const load = async () => {
      try {
        const user = getUserData();
        if (!user?.id) return;

        // Resolve seller (agribusiness) id
        const abResp = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const abJson = await abResp.json();
        const sellerId: string | undefined = abJson?.data?.id;
        if (!abResp.ok || !sellerId) return;

        // Fetch orders for seller
        const params = new URLSearchParams();
        params.set("sellerId", sellerId);
        const ordersResp = await fetch(`/api/orders?${params.toString()}`);
        const ordersJson = await ordersResp.json();
        if (!ordersResp.ok) return;

        const orders: OrderData[] = (ordersJson?.data || []).map((o: ApiOrderResponse) => ({
          status: String(o?.status || "unknown"),
          createdAt: String(o?.createdAt || new Date().toISOString()),
        }));

        const now = new Date();
        const thisYear = now.getFullYear();
        const lastYear = thisYear - 1;
        const labels = Array.from({ length: 12 }, (_, m) => new Date(thisYear, m, 1).toLocaleString("en-US", { month: "short" }));

        const includeStatuses = new Set(["pending", "paid", "shipped", "delivered", "confirmed", "ready_for_pickup"]);
        const validOrders = orders.filter((o) => o.status !== "cancelled" && o.status !== "payment_failed");

        const countByYearMonth = (year: number) => {
          const arr = Array(12).fill(0);
          validOrders.forEach((o) => {
            const d = new Date(o.createdAt);
            if (d.getFullYear() === year && includeStatuses.has(o.status)) {
              arr[d.getMonth()] += 1;
            }
          });
          return arr;
        };

        const currentYearCounts = countByYearMonth(thisYear);
        const previousYearCounts = countByYearMonth(lastYear);

        const config = {
          type: "bar" as const,
          data: {
            labels,
            datasets: [
              {
                label: thisYear.toString(),
                backgroundColor: "#ed64a6",
                borderColor: "#ed64a6",
                data: currentYearCounts,
                fill: false,
                barThickness: 8,
              },
              {
                label: lastYear.toString(),
                fill: false,
                backgroundColor: "#4c51bf",
                borderColor: "#4c51bf",
                data: previousYearCounts,
                barThickness: 8,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              title: { display: false, text: "Orders Chart" },
              tooltip: { mode: "index" as const, intersect: false },
              legend: {
                labels: { color: "rgba(0,0,0,.4)" },
                align: "end" as const,
                position: "bottom" as const,
              },
            },
            hover: { mode: "nearest" as const, intersect: true },
            scales: {
              x: {
                display: false,
                title: { display: true, text: "Month" },
                grid: {
                  borderDash: [2],
                  borderDashOffset: [2],
                  color: "rgba(33, 37, 41, 0.3)",
                  zeroLineColor: "rgba(33, 37, 41, 0.3)",
                  zeroLineBorderDash: [2],
                  zeroLineBorderDashOffset: [2],
                },
              },
              y: {
                display: true,
                title: { display: false, text: "Value" },
                grid: {
                  borderDash: [2],
                  drawBorder: false,
                  borderDashOffset: [2],
                  color: "rgba(33, 37, 41, 0.2)",
                  zeroLineColor: "rgba(33, 37, 41, 0.15)",
                  zeroLineBorderDash: [2],
                  zeroLineBorderDashOffset: [2],
                },
              },
            },
          },
        };

        const ctx = document.getElementById("bar-chart") as HTMLCanvasElement;
        if (ctx) {
          chartInstance = new Chart(ctx, config as ChartConfiguration);
        }
      } catch (e) {
        console.error("CardBarChart load error", e);
      }
    };

    load();

    return () => {
      if (chartInstance) chartInstance.destroy();
    };
  }, []);

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full max-w-full flex-grow flex-1">
              <h6 className="uppercase text-blueGray-400 mb-1 text-xs font-semibold">Performance</h6>
              <h2 className="text-blueGray-700 text-xl font-semibold">Total orders</h2>
            </div>
          </div>
        </div>
        <div className="p-4 flex-auto">
          {/* Chart */}
          <div className="relative h-350-px">
            <canvas id="bar-chart"></canvas>
          </div>
        </div>
      </div>
    </>
  );
}
