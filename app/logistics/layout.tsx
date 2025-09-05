'use client';

import React, { useState } from 'react';
import SellerSidebar from '@/components/custom/SellerSidebar';
import { usePathname } from 'next/navigation';

export default function LogisticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const isKybForm = pathname === '/seller/kyb-form';

  return (
    <div className="bg-gray-50">
      {/* Sidebar Navigation */}
      {!isKybForm && (
          <SellerSidebar 
            sidebarOpen={sidebarOpen} 
            toggleSidebar={toggleSidebar} 
          />
        )}
      
      {/* Main Content Area */}
      <main 
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen && !isKybForm ? 'ml-[16.5rem]' : 'ml-0'
          }`}
        >
          {/* Top Navbar - Only show if not on KYB form */}
          {!isKybForm}
          
          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
    </div>
  );
}