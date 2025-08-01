"use client";
import { getUserData } from "@/lib/localStorage";
import HeaderStats from "@/components/custom/HeaderStats";
import CardLineChart from "@/components/Cards/CardLineChart";
import CardBarChart from "@/components/Cards/CardBarChart";
import CardPageVisits from "@/components/Cards/CardPageVisits";
import CardSocialTraffic from "@/components/Cards/CardSocialTraffic";
import FooterAdmin from "@/components/custom/FooterAdmin";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SellerDashboard() {
  const router = useRouter();
  const userData = getUserData();

  return (
    <>
      {/* Header Section */}
      <div className="bg-blueGray-800 text-white px-4 md:px-10 pt-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Left Section - Welcome Message and Subtitle */}
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Welcome {userData?.name}!
            </h1>
            <p className="text-blueGray-200 text-lg">
              Here is your sales overview and analytics.
            </p>
          </div>
          
          {/* Right Section - Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-8">
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer"
              onClick={() => {
                router.push('/seller/add-product');
              }}
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </Button>
            
            <Button 
              className="border-2 border-white text-white hover:bg-white hover:text-black px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 cursor-pointer"
              onClick={() => {
                // Add navigation logic for generating report
                console.log('Generate Report clicked');
              }}
            >
              <FileText className="w-5 h-5" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>
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
