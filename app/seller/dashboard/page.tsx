"use client";
import { getUserData } from "@/lib/localStorage";
import HeaderStats from "@/components/Headers/HeaderStats";
import CardLineChart from "@/components/Cards/CardLineChart";
import CardBarChart from "@/components/Cards/CardBarChart";
import CardPageVisits from "@/components/Cards/CardPageVisits";
import CardSocialTraffic from "@/components/Cards/CardSocialTraffic";
import FooterAdmin from "@/components/Footers/FooterAdmin";

export default function SellerDashboard() {
  const userData = getUserData();

  return (
    <>
      {/* Header with stats */}
      <HeaderStats />
      {/* Main content */}
      <div className="px-4 md:px-10 mx-auto w-full -m-24">
        <div className="flex flex-wrap">
          {/* Charts section */}
          <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
            <CardLineChart />
          </div>
          <div className="w-full xl:w-4/12 px-4">
            <CardBarChart />
          </div>
        </div>
        
        {/* Tables section */}
        <div className="flex flex-wrap mt-4">
          <div className="w-full xl:w-8/12 mb-12 xl:mb-0 px-4">
            <CardPageVisits />
          </div>
          <div className="w-full xl:w-4/12 px-4">
            <CardSocialTraffic />
          </div>
        </div>
        
        {/* Footer */}
        <FooterAdmin />
      </div>
    </>
  );
}
