'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FaAngleDown } from 'react-icons/fa6';
import { User, LogOut } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMenuStore } from '@/stores/menu';
import { getUserData } from '@/lib/localStorage';
import { mockCategories } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react'
import { clearStoreData } from '@/lib/localStorage'

// A simple item used inside the mega menu columns
function MenuItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50">
      <div className="mt-1 h-5 w-5 rounded bg-gray-200" />
      <div>
        <div className="font-medium leading-none">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
    </div>
  );
}

interface BuyerData {
  companyName: string;
  businessImage: string;
}

// Main navbar component matching the provided visual with Category as a hover MegaMenu
export default function BuyerNavbar() {
  // Track hover state for Category to show mega menu
  const [openCategory, setOpenCategory] = useState(false);

  // Pull buyer menu items from the global menu store
  const buyerSection = useMenuStore((s) => s.menuSections.find((sec) => sec.userRole === 'buyer'));
  const buyerItems = useMemo(() => buyerSection?.items ?? [], [buyerSection]);

  // Maintain required order for left and right sections
  const leftOrder = useMemo(() => ['category', 'marketplace', 'featured-seller', 'news-feed'], []);
  const rightOrder = useMemo(() => ['my-orders', 'buyer-profile'], []);

  const leftLinks = useMemo(() => leftOrder
    .map((id) => buyerItems.find((it) => it.id === id))
    .filter(Boolean) as typeof buyerItems, [buyerItems, leftOrder]);

  const rightLinks = useMemo(() => rightOrder
    .map((id) => buyerItems.find((it) => it.id === id))
    .filter(Boolean) as typeof buyerItems, [buyerItems, rightOrder]);

  // Current user basic data from local storage
  const userData = getUserData();

  // Buyer business data (image, name)
  const [buyerData, setBuyerData] = useState<BuyerData>();

  useEffect(() => {
    async function fetchBuyerData() {
      if (!userData?.id) return;
      try {
        const response = await fetch(`/api/user/businessBuyer?userId=${userData.id}`);
        const result = await response.json();
        if (result.success && result.data) {
          setBuyerData({
            companyName: result.data.companyName,
            businessImage: result.data.businessImage,
          });
        }
      } catch (err) {
        console.error('Error fetching business buyer data:', err);
      }
    }
    fetchBuyerData();
  }, [userData?.id]);

  // Helper to render lucide icon by name from store
  const renderIcon = (iconName?: string, className = 'h-4 w-4') => {
    if (!iconName) return null;
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  return (
    <nav className="w-full bg-green-900 py-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top bar: Logo, Links (left) and actions (right) */}
        <div className="flex h-20 items-center justify-between">
          {/* Left cluster: Logo + nav links */}
          <div className="flex items-center gap-10">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/buyer/dashboard" className="flex items-center">
                <Image 
                  src="/cropdirect-logo(white-text).png" 
                  alt="CropDirect Logo" 
                  width={120} 
                  height={32} 
                  className="h-8 w-auto" 
                />
              </Link>
            </div>

            {/* Inline links from store: Home, Category (with MegaMenu), Marketplace, News Feed */}
            <nav className="hidden md:flex items-center gap-6">
              {leftLinks.map((item) => (
                item?.id === 'category' ? (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setOpenCategory(true)}
                    onMouseLeave={() => setOpenCategory(false)}
                  >
                    <button className="flex items-center cursor-pointer gap-2 whitespace-nowrap text-md font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
                      {/* Icon for Category */}
                      {renderIcon(item.icon, 'h-5 w-5')}
                      <span>{item.name}</span>
                      <FaAngleDown className="h-3.5 w-3.5" />
                    </button>

                    {/* Mega Menu Panel */}
                    {openCategory && (
                      <div className="absolute left-0 top-full mt-2 w-screen max-w-6xl border bg-white shadow-xl rounded-lg overflow-hidden -ml-[40px] z-50">
                        <div className="flex flex-col">
                          {/* Categories Grid */}
                          <div className="grid grid-cols-4 gap-0 space-y-3">
                            {mockCategories.slice(0, 6).map((category, index) => (
                              <div key={category.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="text-2xl">{category.icon}</span>
                                  <div>
                                    <Link href={category.route} className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors">
                                      {category.name}
                                    </Link>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {category.subcategories.slice(0, 4).map((subcategory) => (
                                    <Link
                                      key={subcategory.id}
                                      href={subcategory.route}
                                      className="block group"
                                    >
                                      <div className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                        {subcategory.name}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {subcategory.description}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Featured Section */}
                          <div className="p-5 w-full bg-gradient-to-br from-green-50 to-green-100">
                            <div className="text-lg font-semibold text-gray-900 mb-4">Recommended for you</div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <div className="flex items-start gap-3 mb-4">
                                  <div className="h-16 w-20 rounded-lg bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-sm">
                                    <span className="text-2xl">🏆</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">Top-Selling Products</div>
                                    <div className="text-sm text-gray-600 mt-1">Discover the most popular crops and produce from our marketplace</div>
                                    <Link href="/marketplace?sort=popular" className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
                                      Shop Now →
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-3">
                                  <div className="h-16 w-20 rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-sm">
                                    <span className="text-2xl">⭐</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">Featured Sellers</div>
                                    <div className="text-sm text-gray-600 mt-1">Connect with top-rated farmers and agribusinesses in your area</div>
                                    <Link href="/sellers/featured" className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
                                      Explore →
                                    </Link>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-start gap-3">
                                  <div className="h-16 w-20 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                                    <span className="text-2xl">📰</span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">Agricultural News</div>
                                    <div className="text-sm text-gray-600 mt-1">Stay updated with the latest farming trends and industry insights</div>
                                    <Link href="/news" className="text-sm text-green-600 hover:text-green-700 font-medium mt-2 inline-block">
                                      Read More →
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-green-200">
                              <Link href="/marketplace" className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800">
                                View All Categories
                                <span className="ml-2">→</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.id} href={item.route} className="flex items-center gap-2 whitespace-nowrap text-md font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
                    {renderIcon(item.icon)}
                    <span>{item.name}</span>
                  </Link>
                )
              ))}
            </nav>
          </div>

          {/* Right cluster: My Orders + Profile dropdown */}
          <div className="flex items-center gap-4">
            {rightLinks.find((it) => it.id === 'my-orders') && (
              (() => {
                const ordersItem = rightLinks.find((it) => it.id === 'my-orders')!;
                return (
                  <Link href={ordersItem.route} className="flex items-center gap-2 whitespace-nowrap text-md font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
                    {renderIcon(ordersItem.icon)}
                    <span>{ordersItem.name}</span>
                  </Link>
                );
              })()
            )}

            {rightLinks.find((it) => it.id === 'buyer-profile') && (
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex items-center space-x-3 p-2 rounded-md hover:bg-yellow-400 transition-colors">
                  <Avatar className="h-8">
                    {/* Display buyer business image if available */}
                    <AvatarImage src={buyerData?.businessImage} alt={buyerData?.companyName || userData?.name} />
                    <AvatarFallback className="bg-gray-200">
                      <svg
                        className="h-4 w-4 text-gray-500"
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start whitespace-nowrap">
                    {userData?.name && (
                      <span className="text-sm font-medium text-white group-hover:text-black">{userData.name}</span>
                    )}
                    <span className="text-xs text-gray-300 group-hover:text-black">Buyer</span>
                  </div>
                  <FaAngleDown className="h-3 w-3 text-gray-300 group-hover:text-black" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href={rightLinks.find((it) => it.id === 'buyer-profile')!.route} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    try {
                      clearStoreData()
                      await signOut({ callbackUrl: '/sign-in' })
                    } catch (e) {
                      console.error('Error during sign out', e)
                    }
                  }} className="flex items-center cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}