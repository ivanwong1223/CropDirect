"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { X, Filter } from "lucide-react";
import { locationOptions, servicesOptions, mockCategories } from "@/lib/mockData";

interface FilterState {
  location: string[];
  category: string[];
  priceRange: { min: string; max: string };
  services: string[];
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onFiltersChange: (filters: FilterState) => void;
}

export default function FilterSidebar({ isOpen, onClose, onFiltersChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<FilterState>({
    location: [],
    category: [],
    priceRange: { min: "", max: "" },
    services: []
  });

  const handleLocationChange = (value: string, checked: boolean) => {
    const newLocation = checked
      ? [...filters.location, value]
      : filters.location.filter(item => item !== value);
    
    const newFilters = { ...filters, location: newLocation };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    const newCategory = checked
      ? [...filters.category, value]
      : filters.category.filter(item => item !== value);
    
    const newFilters = { ...filters, category: newCategory };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleServiceChange = (value: string, checked: boolean) => {
    const newServices = checked
      ? [...filters.services, value]
      : filters.services.filter(item => item !== value);
    
    const newFilters = { ...filters, services: newServices };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: string) => {
    const newPriceRange = { ...filters.priceRange, [field]: value };
    const newFilters = { ...filters, priceRange: newPriceRange };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      location: [],
      category: [],
      priceRange: { min: "", max: "" },
      services: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:sticky top-0 left-0 h-screen lg:h-auto w-80 bg-white z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        overflow-y-auto border-r border-gray-200
      `}>
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Location Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`location-${option.value}`}
                    checked={filters.location.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleLocationChange(option.value, checked as boolean)
                    }
                    className="border-2 border-gray-400 data-[state=checked]:border-green-600"
                  />
                  <Label 
                    htmlFor={`location-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Category Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.category.includes(category.id)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.id, checked as boolean)
                    }
                    className="border-2 border-gray-400 data-[state=checked]:border-green-600"
                  />
                  <Label 
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category.icon} {category.name}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Price Range Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Price Range (RM)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-500">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Services Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {servicesOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`service-${option.value}`}
                    checked={filters.services.includes(option.value)}
                    onCheckedChange={(checked) => 
                      handleServiceChange(option.value, checked as boolean)
                    }
                    className="border-2 border-gray-400 data-[state=checked]:border-green-600"
                  />
                  <Label 
                    htmlFor={`service-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          <Separator />

          {/* Clear Filters Button */}
          <Button 
            variant="outline" 
            onClick={clearAllFilters}
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            Clear All Filters
          </Button>
        </div>
      </div>
    </>
  );
}