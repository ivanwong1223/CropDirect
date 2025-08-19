"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package } from "lucide-react";
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

interface ProductCardProps {
  product: Product;
  onViewDetails?: (productId: string) => void;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product.id);
    }
  };

  return (
    <Card className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="relative h-48 overflow-hidden rounded-lg mb-4">
        <Image
          src={product.productImages[0] || "/images/placeholder-product.jpg"}
          alt={product.productTitle}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Status and shipping badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {product.allowBidding && (
            <Badge
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Negotiable
            </Badge>
          )}
          {product.shippingMethod && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-800 hover:bg-green-200"
            >
              {product.shippingMethod}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4 space-y-2">
        {/* Product Title */}
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 group-hover:text-green-700 transition-colors">
          {product.productTitle}
        </h3>
        
        {/* Business Name */}
        <p className="text-sm text-gray-600 font-medium">
          {product.agribusiness.businessName}
        </p>
        
        {/* Category */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Package className="w-4 h-4" />
          <span>{product.cropCategory}</span>
        </div>
        
        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-green-600">
            {product.currency} {Number(product.pricing).toFixed(2)}
          </span>
          <span className="text-sm text-gray-500">/ {product.unitOfMeasurement}</span>
        </div>
        
        {/* Minimum Order */}
        <p className="text-xs text-gray-500">
          Min. order: {product.minimumOrderQuantity} {product.unitOfMeasurement}
        </p>
        
        {/* Location */}
        {/* <div className="flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{product.location}</span>
        </div> */}
        
        {/* View Details Button */}
        {/* <Button 
          onClick={handleViewDetails}
          className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white transition-colors"
          size="sm"
        >
          View Details
        </Button> */}
      </CardContent>
    </Card>
  );
}