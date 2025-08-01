// Mock data for CropDirect Seller Dashboard

export interface DashboardStats {
  totalSales: number;
  pendingOrders: number;
  completedOrders: number;
  performance: number;
}

export interface SalesData {
  month: string;
  currentYear: number;
  previousYear: number;
}

export interface OrdersData {
  month: string;
  currentYear: number;
  previousYear: number;
}

export interface PageVisit {
  pageName: string;
  visitors: number;
  uniqueUsers: string;
  bounceRate: string;
  trend: 'up' | 'down';
}

export interface TopProduct {
  name: string;
  sales: number;
  percentage: number;
}

// News Feed interfaces
export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  image: string | null;
  published_at: string;
}

export interface NewsFeedResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: NewsArticle[];
}

// Dashboard statistics
export const mockDashboardStats: DashboardStats = {
  totalSales: 350897,
  pendingOrders: 2356,
  completedOrders: 924,
  performance: 49.65
};

// Sales chart data (line chart)
export const mockSalesData: SalesData[] = [
  { month: "January", currentYear: 65000, previousYear: 40000 },
  { month: "February", currentYear: 78000, previousYear: 68000 },
  { month: "March", currentYear: 66000, previousYear: 86000 },
  { month: "April", currentYear: 44000, previousYear: 74000 },
  { month: "May", currentYear: 56000, previousYear: 56000 },
  { month: "June", currentYear: 67000, previousYear: 60000 },
  { month: "July", currentYear: 75000, previousYear: 87000 }
];

// Orders chart data (bar chart)
export const mockOrdersData: OrdersData[] = [
  { month: "January", currentYear: 30, previousYear: 27 },
  { month: "February", currentYear: 78, previousYear: 68 },
  { month: "March", currentYear: 56, previousYear: 86 },
  { month: "April", currentYear: 34, previousYear: 74 },
  { month: "May", currentYear: 100, previousYear: 10 },
  { month: "June", currentYear: 45, previousYear: 4 },
  { month: "July", currentYear: 13, previousYear: 87 }
];

// Page visits data
export const mockPageVisits: PageVisit[] = [
  {
    pageName: "Darren Ng",
    visitors: 4569,
    uniqueUsers: "Sweet Corn",
    bounceRate: "46.53%",
    trend: "up"
  },
  {
    pageName: "Jeremy Lim",
    visitors: 3985,
    uniqueUsers: "Australian Tomatoes",
    bounceRate: "46.53%",
    trend: "down"
  },
  {
    pageName: "John Paulose",
    visitors: 3513,
    uniqueUsers: "Sweet Corn",
    bounceRate: "36.49%",
    trend: "down"
  },
  {
    pageName: "Lionel Messi",
    visitors: 2050,
    uniqueUsers: "Sweet Corn",
    bounceRate: "50.87%",
    trend: "up"
  },
  {
    pageName: "Soh Zhe Hong",
    visitors: 1795,
    uniqueUsers: "Garlic",
    bounceRate: "46.53%",
    trend: "down"
  }
];

// Top selling products data
export const mockTopProducts: TopProduct[] = [
  {
    name: "Tomatoes",
    sales: 1480,
    percentage: 60
  },
  {
    name: "Fresh Lettuce",
    sales: 5480,
    percentage: 70
  },
  {
    name: "Sweet Corn",
    sales: 4807,
    percentage: 80
  },
  {
    name: "Bell Peppers",
    sales: 3678,
    percentage: 75
  },
  {
    name: "Carrots",
    sales: 2645,
    percentage: 30
  }
];

// Statistics change data
export const mockStatsChanges = {
  totalSales: { percent: 3.48, trend: "up" as const, period: "Since last month" },
  pendingOrders: { percent: 3.48, trend: "down" as const, period: "Since last week" },
  completedOrders: { percent: 1.10, trend: "down" as const, period: "Since yesterday" },
  performance: { percent: 12, trend: "up" as const, period: "Since last month" }
};
