'use client';

import React, { useState } from 'react';
import SellerSidebar from '@/components/custom/SellerSidebar';
import SellerNavbar from '@/components/custom/SellerNavbar';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /**
   * Toggle sidebar open/close state
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <SellerSidebar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />
        
        {/* Main Content Area */}
        <main 
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarOpen ? 'ml-[16.5rem]' : 'ml-0'
          }`}
        >
          {/* Top Navbar */}
          <SellerNavbar />
          
          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
