'use client';

import React from 'react';
import BuyerNavbar from '@/components/custom/BuyerNavbar';
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import { usePathname } from 'next/navigation';
import Footer from '@/components/custom/Footer';
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
    <PrimeReactProvider>
      <div className="flex h-screen bg-[#E6F3D6]">
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
          <Footer />
        </main>
      </div>
    </PrimeReactProvider>
    </>
  );
}
