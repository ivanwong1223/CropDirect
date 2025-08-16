'use client';

import React from 'react';
import BuyerNavbar from '@/components/custom/BuyerNavbar';
import { usePathname } from 'next/navigation';

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const pathname = usePathname();
  // Check if current path is KYB form
  const isKybForm = pathname === '/seller/kyb-form';
  
  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Main Content Area */}
        <main 
          className={`flex-1 flex flex-col transition-all duration-300 ${
             !isKybForm 
          }`}
        >
          {/* Top Navbar - Only show if not on KYB form */}
          {!isKybForm && <BuyerNavbar />}
          
          {/* Page Content */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
