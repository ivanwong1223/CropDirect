import React from "react";
import CardStats from "@/components/Cards/CardStats";
import { mockDashboardStats, mockStatsChanges } from "@/lib/mockData";
import { getUserData } from "@/lib/localStorage";

// Header component displaying dashboard statistics cards
export default function HeaderStats() {
  const userData = getUserData();
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
                  statTitle={`RM ${mockDashboardStats.totalSales.toLocaleString()}`}
                  statArrow={mockStatsChanges.totalSales.trend}
                  statPercent={mockStatsChanges.totalSales.percent.toString()}
                  statPercentColor="text-emerald-500"
                  statDescripiron={mockStatsChanges.totalSales.period}
                  statIconName="far fa-chart-bar"
                  statIconColor="bg-red-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Pending Orders"
                  statTitle={mockDashboardStats.pendingOrders.toLocaleString()}
                  statArrow={mockStatsChanges.pendingOrders.trend}
                  statPercent={mockStatsChanges.pendingOrders.percent.toString()}
                  statPercentColor="text-red-500"
                  statDescripiron={mockStatsChanges.pendingOrders.period}
                  statIconName="fas fa-chart-pie"
                  statIconColor="bg-orange-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="Completed Orders"
                  statTitle={mockDashboardStats.completedOrders.toString()}
                  statArrow={mockStatsChanges.completedOrders.trend}
                  statPercent={mockStatsChanges.completedOrders.percent.toString()}
                  statPercentColor="text-orange-500"
                  statDescripiron={mockStatsChanges.completedOrders.period}
                  statIconName="fa-solid fa-clipboard-check"
                  statIconColor="bg-pink-500"
                />
              </div>
              <div className="w-full lg:w-6/12 xl:w-3/12 px-4">
                <CardStats
                  statSubtitle="PERFORMANCE"
                  statTitle={`${mockDashboardStats.performance}%`}
                  statArrow={mockStatsChanges.performance.trend}
                  statPercent={mockStatsChanges.performance.percent.toString()}
                  statPercentColor="text-emerald-500"
                  statDescripiron={mockStatsChanges.performance.period}
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
