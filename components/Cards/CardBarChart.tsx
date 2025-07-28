import React from "react";
import { Chart } from "chart.js/auto";
import { mockOrdersData } from "@/lib/mockData";

// Bar chart component for displaying orders data over time
export default function CardBarChart() {
  React.useEffect(() => {
    const config = {
      type: "bar" as const,
      data: {
        labels: mockOrdersData.map(item => item.month),
        datasets: [
          {
            label: new Date().getFullYear().toString(),
            backgroundColor: "#ed64a6",
            borderColor: "#ed64a6",
            data: mockOrdersData.map(item => item.currentYear),
            fill: false,
            barThickness: 8,
          },
          {
            label: (new Date().getFullYear() - 1).toString(),
            fill: false,
            backgroundColor: "#4c51bf",
            borderColor: "#4c51bf",
            data: mockOrdersData.map(item => item.previousYear),
            barThickness: 8,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        plugins: {
          title: {
            display: false,
            text: "Orders Chart",
          },
          tooltip: {
            mode: "index" as const,
            intersect: false,
          },
          legend: {
            labels: {
              color: "rgba(0,0,0,.4)",
            },
            align: "end" as const,
            position: "bottom" as const,
          },
        },
        hover: {
          mode: "nearest" as const,
          intersect: true,
        },
        scales: {
          x: {
            display: false,
            title: {
              display: true,
              text: "Month",
            },
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
            title: {
              display: false,
              text: "Value",
            },
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
      const chartInstance = new Chart(ctx, config);
      
      // Cleanup function to destroy chart on unmount
      return () => {
        chartInstance.destroy();
      };
    }
  }, []);

  return (
    <>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 bg-transparent">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full max-w-full flex-grow flex-1">
              <h6 className="uppercase text-blueGray-400 mb-1 text-xs font-semibold">
                Performance
              </h6>
              <h2 className="text-blueGray-700 text-xl font-semibold">
                Total orders
              </h2>
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
