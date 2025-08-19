"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Filter, Search } from "lucide-react";
import ProductCard from "@/components/custom/ProductCard";
import FilterSidebar from "@/components/custom/FilterSidebar";
import { sortOptions } from "@/lib/mockData";

// Product interface based on Prisma schema
interface Product {
  id: string;
  productTitle: string;
  cropCategory: string;
  description?: string;
  unitOfMeasurement: string;
  minimumOrderQuantity: number;
  quantityAvailable: number;
  pricing: number;
  currency: string;
  allowBidding: boolean;
  storageConditions?: string;
  expiryDate?: string;
  location: string;
  productImages: string[];
  shippingMethod?: string;
  directShippingCost?: number;
  selectedLogistics?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  agribusiness: {
    businessName: string;
    state: string;
    country: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

interface FilterState {
  location: string[];
  category: string[];
  priceRange: { min: string; max: string };
  services: string[];
}

export default function MarketListsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 12
  });
  const [filters, setFilters] = useState<FilterState>({
    location: [],
    category: [],
    priceRange: { min: "", max: "" },
    services: []
  });

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: sortBy
      });
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (filters.location.length > 0) {
        // Convert filter location to API format
        const locationMap: { [key: string]: string } = {
          'Local': 'local',
          'West Malaysia': 'west-malaysia',
          'East Malaysia': 'east-malaysia',
          'Overseas': 'overseas'
        };
        const apiLocation = filters.location.map(loc => locationMap[loc] || loc.toLowerCase()).join(',');
        params.append('location', apiLocation);
      }
      
      if (filters.category.length > 0) {
        params.append('category', filters.category.join(','));
      }
      
      if (filters.priceRange.min) {
        params.append('minPrice', filters.priceRange.min);
      }
      
      if (filters.priceRange.max) {
        params.append('maxPrice', filters.priceRange.max);
      }
      
      if (filters.services.length > 0) {
        // Convert service names to API format
        const serviceMap: { [key: string]: string } = {
          'Free Shipping': 'free-shipping',
          'Negotiable Price': 'negotiable',
          'Bulk Discounts': 'bulk-discount'
        };
        const apiServices = filters.services.map(service => serviceMap[service] || service.toLowerCase().replace(' ', '-')).join(',');
        params.append('services', apiServices);
      }
      
      const response = await fetch(`/api/products?${params.toString()}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch products');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [searchQuery, sortBy, currentPage, filters]);
  
  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, sortBy, filters]);

  const handleViewDetails = (productId: string) => {
    // Navigate to product details page
    console.log('View details for product:', productId);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#E6F3D6]">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agricultural Marketplace</h1>
          <p className="text-gray-600">Discover fresh crops and agricultural products from verified sellers</p>
        </div>

        {/* Search and Sort Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Mobile Filter Button */}
            <Button
              variant="outline"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>

            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search crops, products, categories…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="w-full lg:w-48">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <FilterSidebar
              isOpen={true}
              onClose={() => {}}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Mobile Filter Sidebar - Only shown on mobile */}
          <div className="lg:hidden">
            <FilterSidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Count */}
            {!loading && (
              <div className="mb-4">
                <p className="text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.limit) + 1}-{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} products
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-3 rounded mb-2 w-3/4"></div>
                    <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              /* Product Grid */
              products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-8">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600">Try adjusting your search or filters to find what you are looking for.</p>
                </div>
              )
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasPrevPage) {
                          handlePageChange(pagination.currentPage - 1);
                        }
                      }}
                      className={!pagination.hasPrevPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.currentPage >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = pagination.currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(pageNumber);
                          }}
                          isActive={pagination.currentPage === pageNumber}
                          className={pagination.currentPage === pageNumber ? "bg-green-600 hover:bg-green-700 text-white" : "cursor-pointer"}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  {/* Show ellipsis if there are more pages */}
                  {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.hasNextPage) {
                          handlePageChange(pagination.currentPage + 1);
                        }
                      }}
                      className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}