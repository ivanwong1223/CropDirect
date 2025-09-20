import { create } from 'zustand';

export interface MenuItem {
  id: string;
  name: string;
  route: string;
  isActive?: boolean;
  badge?: string; // For notification counts
  permission?: string; // For role-based access
  icon?: string; // Icon name from lucide-react
}

export interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
  userRole: 'agribusiness' | 'buyer' | 'logistics'; // Role-based sections
}

interface MenuStore {
  menuSections: MenuSection[];
  activeMenuItem: string;
  currentUserRole: 'agribusiness' | 'buyer' | 'logistics' | null;
  setActiveMenuItem: (itemId: string) => void;
  setUserRole: (role: 'agribusiness' | 'buyer' | 'logistics') => void;
  getMenuItemByRoute: (route: string) => MenuItem | undefined;
  getMenuSectionsByRole: (role: 'agribusiness' | 'buyer' | 'logistics') => MenuSection[];
}

const menuData: MenuSection[] = [
  {
    id: 'agribusinesses',
    title: 'Agribusinesses',
    userRole: 'agribusiness',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        route: '/seller/dashboard',
        icon: 'LayoutDashboard'
      },
      {
        id: 'product-list',
        name: 'Products',
        route: '/seller/product-list',
        icon: 'Package'
      },
      {
        id: 'orders',
        name: 'Orders',
        route: '/seller/orders',
        badge: '1',
        icon: 'ShoppingCart'
      },
      {
        id: 'message',
        name: 'Messages',
        route: '/seller/chat',
        badge: '5',
        icon: 'MessageSquare'
      },
      {
        id: 'market',
        name: 'Market Feed',
        route: '/seller/news-feed',
        icon: 'TrendingUp'
      },
      {
        id: 'payment-history',
        name: 'Sales Income',
        route: '/seller/payments',
        icon: 'Receipt'
      },
      {
        id: 'my-subscription',
        name: 'Subscriptions',
        route: '/seller/my-subscription',
        icon: 'ShoppingBag'
      }
    ]
  },
  {
    id: 'business-buyer',
    title: 'Business Buyer',
    userRole: 'buyer',
    items: [
      {
        id: 'category',
        name: 'Category',
        route: '/buyer/category',
        icon: 'Boxes'
      },
      {
        id: 'marketplace',
        name: 'Marketplace',
        route: '/buyer/marketplace/market-lists',
        icon: 'Store'
      },
      {
        id: 'news-feed',
        name: 'News Feed',
        route: '/buyer/news-feed',
        icon: 'Newspaper'
      },
      {
        id: 'featured-seller',
        name: 'Featured Seller',
        route: '/buyer/featured-seller',
        icon: 'Users'
      },
      {
        id: 'my-orders',
        name: 'My Orders',
        route: '/buyer/my-orders',
        icon: 'ShoppingCart'
      },
      {
        id: 'buyer-profile',
        name: 'Profile',
        route: '/buyer/my-profile',
        icon: 'User'
      }
    ]
  },
  {
    id: 'logistic-provider',
    title: 'Logistic Provider',
    userRole: 'logistics',
    items: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        route: '/logistics/dashboard',
        icon: 'LayoutDashboard'
      },
      {
        id: 'active-deliveries',
        name: 'Order Deliveries',
        route: '/logistics/delivery/list-page',
        icon: 'TruckElectric'
      },
      // {
      //   id: 'delivery-history',
      //   name: 'Delivery History',
      //   route: '/logistics/history',
      //   icon: 'History'
      // }
    ]
  }
];

export const useMenuStore = create<MenuStore>((set, get) => ({
  menuSections: menuData,
  activeMenuItem: 'dashboard',
  currentUserRole: null,
  
  setActiveMenuItem: (itemId: string) => {
    set({ activeMenuItem: itemId });
  },
  
  setUserRole: (role: 'agribusiness' | 'buyer' | 'logistics') => {
    set({ currentUserRole: role });
  },
  
  getMenuItemByRoute: (route: string) => {
    // Special case handling for profile-related routes
    if (route === '/seller/my-profile' || route === '/seller/change-password' || route === '/logistics/my-profile') {
      // Return a virtual menu item for profile pages
      const baseRoute = route.startsWith('/logistics') ? '/logistics/my-profile' : '/seller/my-profile';
      return {
        id: 'profile',
        name: 'My Profile',
        route: baseRoute,
        icon: 'User'
      };
    }
    
    const { menuSections } = get();
    for (const section of menuSections) {
      const item = section.items.find(item => item.route === route);
      if (item) return item;
    }
    return undefined;
  },
  
  getMenuSectionsByRole: (role: 'agribusiness' | 'buyer' | 'logistics') => {
    const { menuSections } = get();
    return menuSections.filter(section => section.userRole === role);
  }
}));
