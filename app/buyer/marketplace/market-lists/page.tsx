"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
    category: initialCategory ? [initialCategory] : [],
    priceRange: { min: "", max: "" },
    services: []
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample suggestions - in real app, this would come from API
  const allSuggestions = [
    "Rice", "Wheat", "Corn", "Tomatoes", "Potatoes", "Onions", "Carrots", "Lettuce",
    "Spinach", "Broccoli", "Cabbage", "Bell Peppers", "Cucumbers", "Beans", "Peas",
    "Apples", "Bananas", "Oranges", "Grapes", "Strawberries", "Mangoes", "Pineapples",
    "Coconuts", "Avocados", "Lemons", "Coffee Beans", "Tea Leaves", "Spices", "Herbs",
    "Organic Vegetables", "Fresh Fruits", "Grains", "Cereals", "Pulses", "Nuts", "Seeds"
  ];

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
        // Check if 'Local' OR 'West Malaysia' is selected - if either is selected, show all products
        const hasLocalOrWestMalaysia = filters.location.includes('Local') || filters.location.includes('West Malaysia');
        
        if (!hasLocalOrWestMalaysia) {
          // Only apply location filter if neither 'Local' nor 'West Malaysia' is selected
          // Convert filter location to API format
          const locationMap: { [key: string]: string } = {
            'East Malaysia': 'east-malaysia',
            'Overseas': 'overseas'
          };
          const apiLocation = filters.location.map(loc => locationMap[loc] || loc.toLowerCase()).join(',');
          params.append('location', apiLocation);
        }
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
  
  // Fetch suggestions based on input
  const fetchSuggestions = (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    const filtered = allSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 8); // Limit to 8 suggestions
    
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  };

  // Handle input change for suggestions
  const handleInputChange = (value: string) => {
    setSearchInput(value);
    fetchSuggestions(value);
  };

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchTerm = query || searchInput;
    setSearchQuery(searchTerm);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    handleSearch(suggestion);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch products when dependencies change
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy, currentPage, filters]);
  
  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="mb-15">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight text-balance mb-4">
            {searchQuery ? `Search Result for '${searchQuery}'` : "Search Result for 'All'"}
          </h1>
          <p className="text-gray-600 tracking-wide">Discover fresh crops and agricultural products from verified sellers</p>
        </div>

        {/* Mobile Filter Button - Only shown on mobile */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
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
            {/* Search and Sort Bar - Above Product Cards */}
            <div className="bg-white p-2 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Bar */}
                <div ref={searchRef} className="relative flex-1">
                  <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Search crops, products, categories…"
                      value={searchInput}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onFocus={() => fetchSuggestions(searchInput)}
                      className="pl-4 pr-12 h-10 rounded-lg border-0 focus:ring-0 focus:border-0"
                    />
                    <button
                      onClick={() => handleSearch()}
                      className="cursor-pointer absolute right-0 top-0 h-full px-8 bg-green-600 hover:bg-green-700 text-white rounded-r-lg transition-colors duration-200 flex items-center justify-center"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Autocomplete Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-64 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                        >
                          <Search className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="w-full sm:w-48">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-10 border border-gray-400">
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