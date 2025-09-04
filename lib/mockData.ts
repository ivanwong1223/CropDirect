/**
 * Payment-related type definitions for Stripe integration
 */

// Payment result interface for successful payments
export interface PaymentResult {
  paymentIntentId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency?: string;
  success?: boolean;
}

// Payment status types
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

// Stripe payment intent response
export interface StripePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// Payment confirmation response
export interface PaymentConfirmationResponse {
  success: boolean;
  paymentStatus: string;
  planId?: string;
  billingCycle?: 'monthly' | 'yearly';
  amount?: number;
  currency?: string;
  error?: string;
}

// Payment error interface
export interface PaymentError {
  type?: string;
  code?: string;
  message: string;
}

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

// Sales Transaction interface for payments page
export interface SalesTransaction {
  id: string;
  invoiceId: string;
  orderId: string;
  productTitle: string;
  quantity: number;
  paymentMethod: string;
  amountPaid: number;
  currency: string;
  paidAt: string;
  // Refund tracking fields
  isRefunded?: boolean;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  stripeRefundId?: string;
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

// Subscription Plan interfaces
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  icon: string;
  features: string[];
  isPopular?: boolean;
  trialDays: number;
}

// Mock subscription plans data
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Basic",
    description: "Perfect for new producer starting their digital journey",
    price: {
      monthly: 0,
      yearly: 0 // 15% discount applied
    },
    icon: "/icons/startup.svg",
    features: [
      "Up to 3 Product Listings",
      "3 Product Images per Listing",
      "Access Agricultural News-feed",
      "Generate Performance Reports"
    ],
    trialDays: 14
  },
  {
    id: "standard",
    name: "Standard",
    description: "Ideal for growing agricultural businesses",
    price: {
      monthly: 30,
      yearly: 27 // 15% discount applied
    },
    icon: "/icons/shield-plus.svg",
    features: [
      "Up to 10 Product Listings",
      "5 Product Images per Listing",
      "Access Agricultural News-feed",
      "Generate Performance Reports",
      "Upload Social Media Links"
    ],
    isPopular: true,
    trialDays: 14
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For established farming operations",
    price: {
      monthly: 50,
      yearly: 40 // 15% discount applied
    },
    icon: "/icons/enterprise.svg",
    features: [
      "Unlimited Product Listings",
      "10 Product Images per Listing",
      "Access Agricultural News-feed",
      "Generate Performance Reports",
      "Upload Social Media Links",
      "Featured Product Placement on Buyer Homepage"
    ],
    trialDays: 14
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

// Categories and subcategories interfaces for MegaMenu
export interface SubCategory {
  id: string;
  name: string;
  route: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  route: string;
  icon?: string;
  subcategories: SubCategory[];
}

// Mock categories data for MegaMenu
export const mockCategories: Category[] = [
  {
    id: "vegetables",
    name: "Vegetables",
    route: "/marketplace/vegetables",
    icon: "🥬",
    subcategories: [
      { id: "leafy-greens", name: "Leafy Greens", route: "/marketplace/vegetables/leafy-greens", description: "Lettuce, Spinach, Kale" },
      { id: "root-vegetables", name: "Root Vegetables", route: "/marketplace/vegetables/root-vegetables", description: "Carrots, Potatoes, Onions" },
      { id: "cruciferous", name: "Cruciferous", route: "/marketplace/vegetables/cruciferous", description: "Broccoli, Cauliflower, Cabbage" },
      { id: "nightshades", name: "Nightshades", route: "/marketplace/vegetables/nightshades", description: "Tomatoes, Eggplants, Peppers" }
    ]
  },
  {
    id: "fruits",
    name: "Fruits",
    route: "/marketplace/fruits",
    icon: "🍎",
    subcategories: [
      { id: "citrus", name: "Citrus Fruits", route: "/marketplace/fruits/citrus", description: "Oranges, Lemons, Limes" },
      { id: "berries", name: "Berries", route: "/marketplace/fruits/berries", description: "Strawberries, Blueberries, Raspberries" },
      { id: "tropical", name: "Tropical Fruits", route: "/marketplace/fruits/tropical", description: "Mangoes, Pineapples, Papayas" },
      { id: "stone-fruits", name: "Stone Fruits", route: "/marketplace/fruits/stone-fruits", description: "Peaches, Plums, Cherries" }
    ]
  },
  {
    id: "grains",
    name: "Grains & Cereals", 
    route: "/marketplace/grains",
    icon: "🌾",
    subcategories: [
      { id: "rice", name: "Rice", route: "/marketplace/grains/rice", description: "White Rice, Brown Rice, Basmati" },
      { id: "wheat", name: "Wheat", route: "/marketplace/grains/wheat", description: "Wheat Flour, Whole Wheat" },
      { id: "corn", name: "Corn", route: "/marketplace/grains/corn", description: "Sweet Corn, Feed Corn" },
      { id: "oats", name: "Oats", route: "/marketplace/grains/oats", description: "Rolled Oats, Steel Cut Oats, Instant Oats" }
    ]
  },
  {
    id: "legumes",
    name: "Legumes",
    route: "/marketplace/legumes", 
    icon: "🫘",
    subcategories: [
      { id: "beans", name: "Beans", route: "/marketplace/legumes/beans", description: "Black Beans, Kidney Beans, Navy Beans" },
      { id: "lentils", name: "Lentils", route: "/marketplace/legumes/lentils", description: "Red Lentils, Green Lentils" },
      { id: "peas", name: "Peas", route: "/marketplace/legumes/peas", description: "Green Peas, Split Peas" },
      { id: "chickpeas", name: "Chickpeas", route: "/marketplace/legumes/chickpeas", description: "Garbanzo Beans, Hummus Beans" }
    ]
  }
];

// Sort options for marketplace
export const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "latest", label: "Latest" },
  { value: "top-sales", label: "Top Sales" },
  { value: "price-low-high", label: "Price (Low → High)" },
  { value: "price-high-low", label: "Price (High → Low)" }
];

// Location filter options
export const locationOptions = [
  { value: "local", label: "Local" },
  { value: "west-malaysia", label: "West Malaysia" },
  { value: "east-malaysia", label: "East Malaysia" },
  { value: "overseas", label: "Overseas" }
];

// Services filter options
export const servicesOptions = [
  { value: "free-shipping", label: "Free Shipping" },
  { value: "negotiable-price", label: "Negotiable Price" },
  { value: "bulk-discounts", label: "Bulk Discounts" }
];

// Mock sales transactions for payments page
export const mockSalesTransactions: SalesTransaction[] = [
  {
    id: "1",
    invoiceId: "INV-2024-001",
    orderId: "ORD-2024-001",
    productTitle: "Premium Fresh Tomatoes",
    quantity: 50,
    paymentMethod: "Credit Card",
    amountPaid: 1250.00,
    currency: "RM",
    paidAt: "2024-01-15T10:30:00.000Z"
  },
  {
    id: "2",
    invoiceId: "INV-2024-002",
    orderId: "ORD-2024-002", 
    productTitle: "Organic Sweet Corn",
    quantity: 30,
    paymentMethod: "Bank Transfer",
    amountPaid: 890.50,
    currency: "RM",
    paidAt: "2024-01-14T14:22:00.000Z"
  },
  {
    id: "3",
    invoiceId: "INV-2024-003",
    orderId: "ORD-2024-003",
    productTitle: "Fresh Bell Peppers",
    quantity: 25,
    paymentMethod: "Online Banking",
    amountPaid: 675.25,
    currency: "RM",
    paidAt: "2024-01-13T09:15:00.000Z"
  },
  {
    id: "4",
    invoiceId: "INV-2024-004", 
    orderId: "ORD-2024-004",
    productTitle: "Premium Lettuce",
    quantity: 40,
    paymentMethod: "PayPal",
    amountPaid: 980.00,
    currency: "RM",
    paidAt: "2024-01-12T16:45:00.000Z"
  },
  {
    id: "5",
    invoiceId: "INV-2024-005",
    orderId: "ORD-2024-005",
    productTitle: "Organic Carrots",
    quantity: 60,
    paymentMethod: "Credit Card",
    amountPaid: 1380.75,
    currency: "RM",
    paidAt: "2024-01-11T11:20:00.000Z"
  },
  {
    id: "6",
    invoiceId: "INV-2024-006",
    orderId: "ORD-2024-006",
    productTitle: "Fresh Spinach",
    quantity: 35,
    paymentMethod: "Bank Transfer",
    amountPaid: 595.30,
    currency: "RM",
    paidAt: "2024-01-10T13:10:00.000Z"
  },
  {
    id: "7",
    invoiceId: "INV-2024-007",
    orderId: "ORD-2024-007",
    productTitle: "Premium Broccoli",
    quantity: 28,
    paymentMethod: "Online Banking",
    amountPaid: 756.80,
    currency: "RM",
    paidAt: "2024-01-09T08:30:00.000Z"
  },
  {
    id: "8",
    invoiceId: "INV-2024-008",
    orderId: "ORD-2024-008",
    productTitle: "Organic Cabbage",
    quantity: 45,
    paymentMethod: "Credit Card",
    amountPaid: 1123.25,
    currency: "RM",
    paidAt: "2024-01-08T15:55:00.000Z"
  }
];
