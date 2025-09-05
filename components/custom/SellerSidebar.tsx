'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMenuStore, MenuItem, MenuSection } from '@/stores/menu';
import { cn } from '@/lib/utils';
import { 
  SidebarClose, 
  Settings,
  ShoppingBag, 
  LogOut, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  MessageSquare, 
  Receipt,
  TruckElectric,
  History,
  User
} from 'lucide-react';
import { getUserData } from '@/lib/localStorage';

interface SellerSidebarProps {
  sidebarOpen?: boolean;
  toggleSidebar?: () => void;
}

export default function SellerSidebar({ 
  sidebarOpen = true, 
  toggleSidebar 
}: SellerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { menuSections, activeMenuItem, setActiveMenuItem, getMenuItemByRoute, getMenuSectionsByRole } = useMenuStore();
  
  const [isLgScreen, setIsLgScreen] = useState(false);

  /**
   * Determine user role based on current route
   * @returns User role based on the current pathname
   */
  const getCurrentUserRole = useCallback((): 'agribusiness' | 'buyer' | 'logistics' => {
    if (pathname.includes('/seller')) return 'agribusiness';
    if (pathname.includes('/buyer')) return 'buyer';
    if (pathname.includes('/logistics')) return 'logistics';
    return 'agribusiness'; // Default fallback
  }, [pathname]);

  // Get filtered menu sections based on current user role (memoized to prevent infinite loops)
  const currentUserRole = getCurrentUserRole();
  const filteredMenuSections = useMemo(() => {
    return getMenuSectionsByRole(currentUserRole);
  }, [getMenuSectionsByRole, currentUserRole]);


  // Check screen size for responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLgScreen(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update active menu item based on current route
  useEffect(() => {
    const currentItem = getMenuItemByRoute(pathname);
    if (currentItem) {
      setActiveMenuItem(currentItem.id);
    }
    console.log("The current item is: ", currentItem);
    console.log("The current user is: ", currentUserRole);
  }, [pathname, currentUserRole]); // Only depend on pathname and currentUserRole, not on functions

  /**
   * Handle menu item click navigation
   * - If navigating to seller chat, append devUserId from localStorage so chat API can identify the seller Ivan wong
   */
  const handleMenuItemClick = (item: MenuItem) => {
    setActiveMenuItem(item.id);

    if (item.route === '/seller/chat') {
      try {
        const uid = getUserData()?.id;
        if (uid) {
          router.push(`${item.route}?devUserId=${encodeURIComponent(uid)}`);
          return;
        }
      } catch (err) {
        // Swallow errors and fall back to default navigation
      }
    }

    router.push(item.route);
  };

  // Handle settings and logout navigation
  const handleSettingsClick = () => {
    // Route to the appropriate profile page based on current pathname
    if (pathname.includes('/logistics')) {
      router.push('/logistics/my-profile');
    } else {
      router.push('/seller/my-profile');
    }
    setActiveMenuItem('');
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logout clicked');
    router.push('/sign-in');
  };

  /**
   * Render the appropriate icon based on the icon name
   * @param iconName - Name of the icon from lucide-react
   * @returns The corresponding icon component
   */
  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    
    const iconProps = { className: "stroke-current stroke-[1.5px] mr-3 h-4 w-4" };
    
    switch (iconName) {
      case 'LayoutDashboard':
        return <LayoutDashboard {...iconProps} />;
      case 'Package':
        return <Package {...iconProps} />;
      case 'ShoppingCart':
        return <ShoppingCart {...iconProps} />;
      case 'TrendingUp':
        return <TrendingUp {...iconProps} />;
      case 'MessageSquare':
        return <MessageSquare {...iconProps} />;
      case 'Receipt':
        return <Receipt {...iconProps} />;
      case 'ShoppingBag':
        return <ShoppingBag {...iconProps} />;
      case 'TruckElectric':
        return <TruckElectric {...iconProps} />;
      case 'History':
        return <History {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 h-full bg-[#032320] text-white p-2 overflow-hidden transition-all duration-300",
        sidebarOpen ? "w-[16.5rem]" : "ml-[-16.5rem]",
        isLgScreen && "lg:w-[16.5rem]"
      )}
    >
      {/* CropDirect Logo */}
      <div className="flex items-center text-center space-x-3 hover:cursor-pointer">
        <Image
          src="/cropdirect-logo(white-text).png"
          alt="CropDirect Logo"
          width={150}
          height={36}
          className="w-auto h-9 mb-5 pl-3 mt-3"
          onClick={() => {
            router.push('/');
            setActiveMenuItem('');
          }}
        />
      </div>

      {/* Sidebar Close Button */}
      <SidebarClose
        className="stroke-white stroke-[2px] absolute top-6 right-5 cursor-pointer"
        onClick={toggleSidebar}
      />

      {/* Sidebar content with overflow */}
      <div className="h-[calc(100vh-8rem)] overflow-y-scroll no-scrollbar pb-20">
        {/* Direct menu items without sections */}
        <ul className="list-none p-0">
          {filteredMenuSections.flatMap((section: MenuSection) => 
            section.items.map((item: MenuItem) => (
              <li
                key={item.id}
                className="my-1 text-sm transition-all duration-100 rounded-lg hover:bg-[#083833]"
              >
                <button
                  onClick={() => handleMenuItemClick(item)}
                  className={cn(
                    "flex items-center no-underline py-3 px-3 rounded-lg w-full text-left cursor-pointer",
                    activeMenuItem === item.id
                      ? "text-white bg-[#097A6F]"
                      : "hover:bg-[#083833] hover:text-[#ccd1ce] text-white"
                  )}
                >
                  {renderIcon(item.icon)}
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto bg-red-700 text-white text-xs rounded-full px-1.5 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Settings and Logout */}
      <div className="absolute bottom-0 left-0 bg-[#032320] w-full">
        <div className="space-y-8 mb-5">
          <div className="border-t w-[14.7rem] mx-auto border-gray-500"></div>
          
          {/* Settings Button */}
          <button
            className="flex items-center text-white text-sm no-underline hover:text-gray-400 ml-5 cursor-pointer"
            onClick={handleSettingsClick}
          >
            <User className="mr-2 stroke-[1.5px] h-5 w-5" />
            My Profile
          </button>
          
          {/* Logout Button */}
          <button
            className="flex items-center text-white text-sm no-underline hover:text-gray-400 ml-5 cursor-pointer"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 stroke-[1.5px] h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
