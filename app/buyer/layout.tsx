'use client';

import React from 'react';
import SellerSidebar from '@/components/custom/SellerSidebar';

/**
 * Layout component specifically for buyer routes
 * Provides consistent sidebar navigation across all buyer pages
 */
export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <SellerSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}