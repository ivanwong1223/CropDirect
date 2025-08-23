'use client';

import React, { useState } from 'react';
import SellerSidebar from '@/components/custom/SellerSidebar';
import SellerNavbar from '@/components/custom/SellerNavbar';
import { usePathname } from 'next/navigation';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  /**
   * Toggle sidebar open/close state
   */
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Check if current path is KYB form
  const isKybForm = pathname === '/seller/kyb-form';

  return (
    <>
      <div className="bg-gray-50">
        {/* Sidebar - Only show if not on KYB form */}
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
          {!isKybForm && <SellerNavbar />}
          
          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
