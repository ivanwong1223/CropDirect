"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Package, Plus, MapPin, Tag, Layers, ShoppingBasket, Edit, Trash2, CheckCircle } from "lucide-react";
import { getUserData } from "@/lib/localStorage";
import NotificationContainer from "@/components/custom/NotificationContainer";
import KYBVerificationDialog from "@/components/custom/KYBVerificationDialog";

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
  directShippingCost?: string | null;
  createdAt: string;
  agribusiness?: {
    businessName: string;
    state: string | null;
    country: string | null;
  };
}

export default function ProductList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);
  const userData = getUserData();

  // State to manage the KYB status value and dialog open state
  const [kybStatus, setKybStatus] = useState<string | null>(null);
  const [kybDialogOpen, setKybDialogOpen] = useState(false);

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

  const askDelete = (id: string) => {
    setPendingDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const resp = await fetch(`/api/products/${pendingDeleteId}`, { method: "DELETE" });
      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || "Failed to delete product");
      }
      setProducts((prev) => prev.filter((p) => p.id !== pendingDeleteId));

      // push a new notification using AnimatedList item pattern
      const ts = new Date().toLocaleTimeString();
      setNotifications((prev) => [
        <div 
          key={`del-${pendingDeleteId}-${Date.now()}`} 
          className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
          onAnimationEnd={() => {
            setTimeout(() => {
              setNotifications(prev => prev.slice(1));
            }, 5000);
          }}
          style={{
            animation: 'fadeOut 300ms ease-in-out 5s forwards'
          }}
        >
          <style jsx>{`
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}</style>
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-medium">Deleted Successfully</div>
            <div className="text-xs text-gray-600">The product has been removed. {ts}</div>
          </div>
        </div>,
        ...prev,
      ]);
    } catch (e) {
      console.error(e);
      // show error notification
      const ts = new Date().toLocaleTimeString();
      setNotifications((prev) => [
        <div key={`err-${pendingDeleteId}-${Date.now()}`} className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm">
          <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-red-700">Failed to delete</div>
            <div className="text-xs text-gray-600">Please try again. {ts}</div>
          </div>
        </div>,
        ...prev,
      ]);
    } finally {
      setConfirmOpen(false);
      setPendingDeleteId(null);
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

  useEffect(() => {
    const fetchKybStatus = async () => {
      try {
        if (!userData?.id) return;
        const resp = await fetch(`/api/kyb-status?userId=${userData.id}`);
        const data = await resp.json();
        if (!resp.ok || !data?.data?.kybStatus) return;
        const status = data.data.kybStatus as string;
        setKybStatus(status);
      } catch (e) {
        console.error("Failed to fetch KYB status:", e);
      }
    };

    fetchKybStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for success notification from URL params
  useEffect(() => {
    const created = searchParams.get('created');
    const updated = searchParams.get('updated');
    const productTitle = searchParams.get('productTitle');
    const action = searchParams.get('action');
    
    if ((created === 'true' || updated === 'true') && productTitle) {
      // Show success notification only once
      setNotifications((prev) => {
        // Check if notification already exists to prevent duplicates
        const existingNotification = prev.find(n => 
          n && typeof n === 'object' && 'key' in n && 
          typeof n.key === 'string' && n.key.startsWith(`${action}-`)
        );
        
        if (existingNotification) {
          return prev; // Don't add duplicate
        }
        
        const message = action === 'edited' ? 'Product Updated Successfully!' : 'Product Created Successfully!';
        const description = `Your ${decodeURIComponent(productTitle)} has been ${action === 'edited' ? 'updated' : 'created'}.`;
        
        return [
          <div 
            key={`${action}-${Date.now()}`} 
            className="flex items-start gap-3 rounded-md border bg-white p-3 shadow-sm opacity-100 transition-opacity duration-300"
            onAnimationEnd={() => {
              setTimeout(() => {
                setNotifications(prev => prev.slice(1));
              }, 5000);
            }}
            style={{
              animation: 'fadeOut 300ms ease-in-out 5s forwards'
            }}
          >
            <style jsx>{`
              @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
              }
            `}</style>
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="min-w-0">
              <div className="text-sm font-medium">{message}</div>
              <div className="text-xs text-gray-600">{description}</div>
            </div>
          </div>,
          ...prev,
        ];
      });
      
      // Clean up URL params
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('created');
      newUrl.searchParams.delete('updated');
      newUrl.searchParams.delete('productTitle');
      newUrl.searchParams.delete('action');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const hasProducts = useMemo(() => products && products.length > 0, [products]);

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto relative">
      {/* Top-right notifications */}
      <NotificationContainer notifications={notifications} />

      <div className="mb-6 flex items-center justify-between mt-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Your Product List</h1>
          <p className="text-gray-600">View and manage the products you have created</p>
        </div>
        <Button
          className="cursor-pointer"
          onClick={() => {
                // Check KYB status before allowing navigation
                const shouldPrompt = [
                  "NOT_SUBMITTED",
                  "REJECTED",
                  "REQUIRES_RESUBMISSION",
                ].includes(kybStatus || "");
                
                if (shouldPrompt) {
                  setKybDialogOpen(true);
                } else {
                  router.push("/seller/add-product");
                }
              }}
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
            <Button className='cursor-pointer' onClick={() => {
                // Check KYB status before allowing navigation
                const shouldPrompt = [
                  "NOT_SUBMITTED",
                  "REJECTED",
                  "REQUIRES_RESUBMISSION",
                ].includes(kybStatus || "");
                
                if (shouldPrompt) {
                  setKybDialogOpen(true);
                } else {
                  router.push("/seller/add-product");
                }
              }}>
                Create Product
            </Button>
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
                          <>
                            {p.shippingMethod}
                            {p.directShippingCost && ` - ${p.currency || 'RM'}${p.directShippingCost}`}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                  <div>
                    <Separator />
                  </div>
                  <div className="pt-2 flex items-center justify-between gap-2">
                    <Button 
                      className="cursor-pointer" 
                      variant="outline"
                      onClick={() => router.push(`/seller/edit-product/${p.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Delete"
                      className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
                      onClick={() => askDelete(p.id)}
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='tracking-wide'>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription className='tracking-wide font-semibold'>
              This action cannot be undone. This will permanently delete the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" onClick={() => setConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 cursor-pointer">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* KYB Verification Dialog */}
      <KYBVerificationDialog
        open={kybDialogOpen}
        onOpenChange={setKybDialogOpen}
        kybStatus={kybStatus}
      />
    </div>
  );
}
