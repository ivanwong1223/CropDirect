"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, MapPin, Tag, Layers, ShoppingBasket, ArrowLeft } from "lucide-react";

interface ProductDetail {
  id: string;
  productTitle: string;
  cropCategory: string;
  unitOfMeasurement: string;
  quantityAvailable: number;
  pricing: number;
  currency: string;
  allowBidding: boolean;
  location: string;
  productImages: string[];
  shippingMethod?: string | null;
  selectedLogistics?: string | null;
  agribusiness?: {
    businessName: string;
    state: string | null;
    country: string | null;
    contactNo?: string | null;
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch(`/api/products/${id}`);
        const data = await resp.json();
        if (!resp.ok || !data?.success) {
          throw new Error(data?.error || "Failed to fetch product");
        }
        setProduct(data.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const titleCase = (s: string) => s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  const formatPrice = (value: number, currency: string, unit: string) => `${currency} ${value.toFixed(2)} per ${unit}`;

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <Button variant="outline" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <Skeleton className="h-64 w-full" />
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <Button variant="outline" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Unable to load product</CardTitle>
            <CardDescription className="text-red-600">{error || "Unknown error"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const firstImage = product.productImages?.[0] || "/placeholder.png";
  const isThirdParty = (product.shippingMethod || "").toLowerCase() === "third-party";

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <Button variant="outline" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="overflow-hidden">
        <div className="h-64 w-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={firstImage} alt={product.productTitle} className="h-full w-full object-cover" />
        </div>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-2xl font-semibold leading-tight">{product.productTitle}</CardTitle>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> {titleCase(product.cropCategory)}
                </Badge>
                {product.allowBidding && <Badge variant="outline">Bidding Allowed</Badge>}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <Tag className="h-4 w-4 text-green-600" />
            <span className="font-medium">{formatPrice(product.pricing, product.currency || "RM", product.unitOfMeasurement)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Layers className="h-4 w-4 text-blue-600" />
            <span>
              {product.quantityAvailable} {product.unitOfMeasurement} in stock
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm">{product.location}</span>
          </div>
          {product.shippingMethod && (
            <div className="flex items-center gap-2 text-gray-700">
              <ShoppingBasket className="h-4 w-4 text-purple-600" />
              <span>
                Shipping: {isThirdParty ? (
                  <>Third-party{product.selectedLogistics ? ` (${product.selectedLogistics})` : ""}</>
                ) : (
                  product.shippingMethod
                )}
              </span>
            </div>
          )}
          <div className="pt-4">
            <Button onClick={() => alert("Editing UI can be implemented here. Let me know if you'd like me to build the full edit form.")}>Edit Product</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}