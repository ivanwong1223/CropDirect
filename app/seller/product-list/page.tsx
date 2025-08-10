"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator"
import { Package, Plus, MapPin, Tag, Layers, ShoppingBasket, Edit, Trash2 } from "lucide-react";
import { getUserData } from "@/lib/localStorage";

interface ProductItem {
  id: string;
  productTitle: string;
  cropCategory: string;
  unitOfMeasurement: string;
  quantityAvailable: number;
  pricing: number | string;
  currency: string;
  allowBidding: boolean;
  location: string;
  productImages: string[];
  shippingMethod?: string | null;
  selectedLogistics?: string | null;
  createdAt: string;
  agribusiness?: {
    businessName: string;
    state: string | null;
    country: string | null;
  };
}

export default function ProductList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);

  // Format a string to Title Case
  const titleCase = (s: string) => s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  // Format price as: "RM 3.50 per kg"
  const formatPrice = (value: number | string, currency: string, unit: string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return `${currency} - per ${unit}`;
    return `${currency} ${num.toFixed(2)} per ${unit}`;
  };

  // Truncate a text to a fixed length and append ellipsis if needed
  const truncate = (text: string, max = 8) => {
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max)}...` : text;
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this product? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const resp = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || "Failed to delete product");
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete product. Please try again.");
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = getUserData();
        if (!user) {
          setError("Please log in to view your products.");
          setLoading(false);
          return;
        }

        // Get user's agribusiness id first
        const agResp = await fetch(`/api/user/agribusiness?userId=${user.id}`);
        const agData = await agResp.json();
        if (!agData?.success || !agData?.data?.id) {
          setError("Unable to find your agribusiness profile.");
          setLoading(false);
          return;
        }

        // Fetch products for this agribusiness
        const resp = await fetch(`/api/products?agribusinessId=${agData.data.id}`);
        const data = await resp.json();
        if (!data?.success) {
          setError(data?.error || "Failed to fetch products");
          setLoading(false);
          return;
        }

        setProducts(data.data || []);
      } catch (error) {
        console.error(error);
        setError("Something went wrong while fetching products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const hasProducts = useMemo(() => products && products.length > 0, [products]);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between mt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Product List</h1>
          <p className="text-gray-600">View and manage the products you have created</p>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => router.push("/seller/add-product")}
        >
          <Plus className="mr-2" /> Add New Product
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-9 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && !hasProducts && (
        <Card>
          <CardHeader>
            <CardTitle>No products yet</CardTitle>
            <CardDescription>Start by creating your first product listing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/seller/add-product")}>Create Product</Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && hasProducts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const priceText = formatPrice(p.pricing, p.currency || "RM", p.unitOfMeasurement);
            const categoryText = titleCase(p.cropCategory || "");
            const firstImage = p.productImages?.[0] || "/placeholder.png";
            const isThirdParty = (p.shippingMethod || "").toLowerCase() === "third-party";
            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-40 w-full bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={firstImage}
                    alt={p.productTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-semibold leading-tight">{p.productTitle}</CardTitle>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" /> {categoryText}
                        </Badge>
                        {p.allowBidding && <Badge variant="outline">Bidding Allowed</Badge>}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Tag className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{priceText}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <span>
                      {p.quantityAvailable} {p.unitOfMeasurement} of current stock
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span className="text-sm">{truncate(p.location, 47)}</span>
                  </div>
                  {p.shippingMethod && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <ShoppingBasket className="h-4 w-4 text-purple-600" />
                      <span>
                        Shipping: {isThirdParty ? (
                          <>Third-party{p.selectedLogistics ? ` (${p.selectedLogistics.toUpperCase()})` : ""}</>
                        ) : (
                          p.shippingMethod
                        )}
                      </span>
                    </div>
                  )}
                  <div className="">
                    <Separator />
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <Button className="cursor-pointer" variant="outline" size="icon" aria-label="Edit" onClick={() => router.push(`/seller/edit-product/${p.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Delete"
                      className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
