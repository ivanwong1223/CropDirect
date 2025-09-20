'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell, LogOut, User } from 'lucide-react';
import { MdLanguage } from 'react-icons/md';
import { FaAngleDown } from 'react-icons/fa';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useMenuStore } from '@/stores/menu';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';
import { getUserData } from '@/lib/localStorage';
import { signOut } from 'next-auth/react'
import { clearStoreData } from '@/lib/localStorage'

interface SellerNavbarProps {
  className?: string;
}

interface AgribusinessData {
  businessName: string;
  businessImage: string;
}

export default function SellerNavbar({ className }: SellerNavbarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount] = useState(3);
  const [agribusinessData, setAgribusinessData] = useState<AgribusinessData>();
  const userData = getUserData();

  useEffect(() => {
    async function fetchAgribusinessData() {
      if (userData?.id) {
        try {
          const response = await fetch(`/api/user/agribusiness?userId=${userData.id}`);
          const result = await response.json();
          if (result.success && result.data) {
            setAgribusinessData({
              businessName: result.data.businessName,
              businessImage: result.data.businessImage
            });
          }
        } catch (error) {
          console.error('Error fetching agribusiness data:', error);
        }
      }
    }
    fetchAgribusinessData();
  }, [userData?.id]);

  // Get menu items from the store
  const getMenuItemByRoute = useMenuStore(state => state.getMenuItemByRoute);
  
  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Special handling for specific routes
    if (pathname === '/seller/add-product' || pathname.startsWith('/seller/edit-product/')) {
      breadcrumbs.push({
        label: 'Products',
        href: '/seller/product-list',
        isActive: false
      });
      
      if (pathname === '/seller/add-product') {
        breadcrumbs.push({
          label: 'Add New Product',
          href: '/seller/add-product',
          isActive: true
        });
      } else {
        breadcrumbs.push({
          label: 'Edit Product',
          href: pathname,
          isActive: true
        });
      }
      return breadcrumbs;
    }

    if (pathname.startsWith('/seller/orders/')) {
      breadcrumbs.push({
        label: 'Orders',
        href: '/seller/orders',
        isActive: false
      });
      breadcrumbs.push({
        label: 'Order Details',
        href: pathname,
        isActive: true
      });
      return breadcrumbs;
    }

    if (pathname === '/seller/my-profile') {
      breadcrumbs.push({
        label: 'My Profile',
        href: '/seller/my-profile',
        isActive: true
      });
      return breadcrumbs;
    }

    if (pathname === '/seller/change-password') {
      breadcrumbs.push({
        label: 'My Profile',
        href: '/seller/my-profile',
        isActive: false
      });
      breadcrumbs.push({
        label: 'Change Password',
        href: '/seller/change-password',
        isActive: true
      });
      return breadcrumbs;
    }

    // Get the current menu item based on the full path
    const fullPath = '/' + pathSegments.join('/');
    const currentMenuItem = getMenuItemByRoute(fullPath);
    
    if (currentMenuItem && fullPath !== '/seller/dashboard') {
      // Start with the menu item name
      breadcrumbs.push({
        label: currentMenuItem.name,
        href: currentMenuItem.route,
        isActive: true
      });
      console.log("For the breadcrumbs current menu item is: ", currentMenuItem);
    } else {
      // Default to Dashboard if not on a specific menu item or if on dashboard
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/seller/dashboard',
        isActive: pathname === '/seller/dashboard'
      });
      
      // Add additional segments if not on dashboard and not a direct menu item
      if (pathSegments.length > 2 && !currentMenuItem) {
        for (let i = 2; i < pathSegments.length; i++) {
          const segment = pathSegments[i];
          const href = '/' + pathSegments.slice(0, i + 1).join('/');
          const isActive = i === pathSegments.length - 1;
          
          // Check if this partial path has a menu item
          const partialMenuItem = getMenuItemByRoute(href);
          
          breadcrumbs.push({
            label: partialMenuItem ? partialMenuItem.name : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
            href,
            isActive
          });
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className={cn(
      "top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Section - Breadcrumb */}
        <div className="flex items-center space-x-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <React.Fragment key={breadcrumb.href}>
                  <BreadcrumbItem>
                    {breadcrumb.isActive ? (
                      <BreadcrumbPage className="text-foreground font-medium">
                        {breadcrumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link 
                          href={breadcrumb.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {breadcrumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right Section - Search, Notifications, Language, Profile */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 h-9 text-sm"
            />
          </form>

          {/* Notifications */}
          {/* <div className="relative">
            <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </div> */}

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent">
              <MdLanguage className="h-5 w-5" />
              <span className="text-sm font-medium flex items-center gap-1">
                EN <FaAngleDown className="h-3 w-3" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => { /* handle language change to English */ }}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { /* handle language change to Spanish */ }}>
                Spanish
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { /* handle language change to French */ }}>
                French
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={agribusinessData?.businessImage} 
                  alt={agribusinessData?.businessName}
                />
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
              <div className="flex flex-col items-start">
                {userData?.name && (
                  <span className="text-sm font-medium text-foreground">{userData.name}</span>
                )}
                <span className="text-xs text-muted-foreground">Seller</span>
              </div>
              <FaAngleDown className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/seller/my-profile" className="flex items-center">
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
        </div>
      </div>
    </header>
  );
}
