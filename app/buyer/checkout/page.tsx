'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Lock, MapPin, CreditCard, Package, Truck, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text';
import { getUserData } from '@/lib/localStorage';
import NotificationContainer from '@/components/custom/NotificationContainer';
import Image from 'next/image';

interface Product {
  id: string;
  productTitle: string;
  pricing: number;
  unitOfMeasurement: string;
  currency: string;
  productImages: string[];
  location: string;
  selectedLogistics?: string;
  shippingMethod?: string;
  directShippingCost?: number;
  logisticsPartnerId?: string;
  agribusiness: {
    id: string;
    businessName: string;
    businessImage: string;
    user: {
      id: string;
      name: string;
    };
  };
}

interface ShippingRate {
  cost: number;
  estimatedDays: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const quantity = parseInt(searchParams.get('quantity') || '1');
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Bid mode params from query
  const isBid = (searchParams.get('isBid') || '').toLowerCase() === 'true';
  const bidUnitPriceParam = parseFloat(searchParams.get('bidUnitPrice') || '');
  const bidUnitPrice = !isNaN(bidUnitPriceParam) ? bidUnitPriceParam : null;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingCost, setShippingCost] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [buyerInfo, setBuyerInfo] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: ''
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tempDeliveryAddress, setTempDeliveryAddress] = useState('');
  const [userCompanyAddress, setUserCompanyAddress] = useState('');
  const [shippingLoading, setShippingLoading] = useState(false);
  // Track computed distance to send with order payload
  const [shippingDistance, setShippingDistance] = useState<number | null>(null);
  // Store BusinessBuyer profile ID for correct buyer relation in order creation
  const [buyerProfileId, setBuyerProfileId] = useState<string | null>(null);
  // Notifications state
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);
  const [logisticsPartner, setLogisticsPartner] = useState<{ id: string; companyName: string; businessImage?: string | null; estimatedDeliveryTime?: string | null; pricingModel?: string | null; pricingConfig?: string[] | null } | null>(null);
  
  // Loyalty state: available balance and points to redeem on this order
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);

  // Add notification function
  const addNotification = (message: string, type: 'success' | 'error') => {
    const icon = type === 'success' ? CheckCircle : AlertCircle;
    const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600';
    const titleColor = type === 'success' ? '' : 'text-red-700';
    
    setNotifications((prev) => [
      <div 
        key={`${type}-${Date.now()}`} 
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
        {React.createElement(icon, { className: `h-5 w-5 ${iconColor} mt-0.5` })}
        <div className="min-w-0">
          <div className={`text-sm font-medium ${titleColor}`}>{message}</div>
        </div>
      </div>,
      ...prev,
    ]);
  };

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      console.log("Initializing autocomplete");
      if (!locationInputRef.current) {
        console.log('locationInputRef.current is null, dialog might be closed');
        return;
      }
      
      // Check if Google Maps API is loaded
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('Google Maps API not loaded yet');
        return;
      }

      try {
        // Clear existing autocomplete if any
        if (autocompleteRef.current) {
          window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        }

        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'my' }
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            // Update the state
            setTempDeliveryAddress(place.formatted_address);
            
            // Also manually update the input field value to ensure it displays correctly
            if (locationInputRef.current) {
              locationInputRef.current.value = place.formatted_address;
            }
            
            console.log('Selected delivery address:', place.formatted_address);
            console.log("Lat:", place.geometry?.location?.lat());
            console.log("Lng:", place.geometry?.location?.lng());
          } else {
            console.log('No formatted address found in place result');
          }
        });

        autocompleteRef.current = autocomplete;
        console.log('Google Places Autocomplete initialized successfully for delivery address');
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    };

    // Only initialize when dialog is open
    if (!dialogOpen) {
      return;
    }

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      // Small delay to ensure DOM is ready
      setTimeout(initAutocomplete, 100);
    } else {
      // Wait for Google Maps API to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log("Google Maps API loaded");
          clearInterval(checkGoogleMaps);
          setTimeout(initAutocomplete, 100);
        }
      }, 100);

      // Cleanup after 10 seconds if API doesn't load
      const timeout = setTimeout(() => {
        clearInterval(checkGoogleMaps);
        console.error('Google Maps API failed to load within 10 seconds');
      }, 10000);

      return () => {
        clearInterval(checkGoogleMaps);
        clearTimeout(timeout);
      };
    }

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [dialogOpen]);

  // Fetch product details
  useEffect(() => {
    if (!productId) {
      setError('Product ID is required');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        console.log('Response:', response);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const response_data = await response.json();
        console.log('API Response:', response_data);
        
        if (response_data.success && response_data.data) {
          setProduct(response_data.data);
        } else {
          throw new Error(response_data.error || 'Invalid product data');
        }
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Set shipping cost for direct shipping products when product is loaded
  useEffect(() => {
    if (product?.shippingMethod === 'direct' && product?.directShippingCost !== undefined) {
      setShippingCost(product.directShippingCost);
      console.log(`Direct shipping product loaded with cost: ${product.directShippingCost}`);
    }
  }, [product]);

  // Function to fetch user's business buyer profile and prefill info
  const fetchUserCompanyAddress = async () => {
    try {
      // Get current user ID from localStorage
      const userData = getUserData();
      if (!userData || !userData.id) {
        console.error('User not authenticated or user ID not found');
        return;
      }

      const response = await fetch(`/api/user/businessBuyer?userId=${userData.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const buyer = data.data;
          // Store BusinessBuyer profile id for order creation
          if (buyer.id) {
            setBuyerProfileId(buyer.id);
          }
          // Set loyalty points balance
          if (typeof buyer.loyaltyPoints === 'number') {
            setLoyaltyBalance(buyer.loyaltyPoints);
          }
          // Prefill company address and delivery address
          if (buyer.companyAddress) {
            setUserCompanyAddress(buyer.companyAddress);
            setDeliveryAddress(buyer.companyAddress);
          }
          // Prefill buyer info fields
          setBuyerInfo(prev => ({
            ...prev,
            companyName: buyer.companyName || prev.companyName,
            contactName: buyer.user?.name || prev.contactName,
            email: buyer.user?.email || prev.email,
            phone: buyer.contactNo || prev.phone,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching user company address:', error);
    }
  };

  // Fetch user's company address and contact details
  useEffect(() => {
    fetchUserCompanyAddress();
  }, []);

  // Fetch logistics partner details when product is loaded
  useEffect(() => {
    const fetchPartner = async (partnerId: string) => {
      try {
        const res = await fetch(`/api/logistics-partners?id=${encodeURIComponent(partnerId)}`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && json.data) {
          setLogisticsPartner(json.data);
        } else {
          setLogisticsPartner(null);
        }
      } catch (e) {
        console.error('Error fetching logistics partner:', e);
        setLogisticsPartner(null);
      }
    };

    if (product && product.shippingMethod !== 'direct' && product.logisticsPartnerId) {
      fetchPartner(product.logisticsPartnerId);
    } else {
      setLogisticsPartner(null);
    }
  }, [product]);

  // Calculate distance between product location and delivery address using Google Maps Distance Matrix API
  const calculateDistance = async (origin: string, destination: string): Promise<number | null> => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps API not loaded');
        resolve(null);
        return;
      }

      const service = new window.google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0]?.elements[0];
          
          if (element && element.status === 'OK') {
            const distanceInMeters = element.distance?.value;
            if (distanceInMeters) {
              const distanceInKm = distanceInMeters / 1000;
              console.log(`Distance calculated: ${distanceInKm} km from ${origin} to ${destination}`);
              resolve(distanceInKm);
            } else {
              console.error('Distance value not found in response');
              resolve(null);
            }
          } else {
            console.error('Distance calculation failed:', element?.status);
            resolve(null);
          }
        } else {
          console.error('Distance Matrix API failed:', status);
          resolve(null);
        }
      });
    });
  };

  // Calculate shipping cost based on distance
  const calculateShipping = async (distance: number) => {
    if (!product) return;

    setShippingLoading(true);
    try {
      const response = await fetch('/api/calculate-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distance: distance,
          weight: quantity,
          logisticsProvider: product.selectedLogistics,
          logisticsPartnerId: product.logisticsPartnerId || undefined
        })
      });

      if (response.ok) {
        const data: ShippingRate = await response.json();
        setShippingCost(data.cost);
        setShippingDistance(distance);
        console.log(`Shipping cost calculated: ${data.cost} for ${distance} km`);
      } else {
        console.error('Failed to calculate shipping cost');
        addNotification('Failed to calculate shipping cost', 'error');
      }
    } catch (err) {
      console.error('Error calculating shipping:', err);
      addNotification('Error calculating shipping cost', 'error');
    } finally {
      setShippingLoading(false);
    }
  };

  // Handle saving the delivery address from the dialog
  const handleSaveDeliveryAddress = async () => {
    setDeliveryAddress(tempDeliveryAddress);
    setDialogOpen(false);
    
    // Check if product uses direct shipping method
    if (product?.shippingMethod === 'direct' && product?.directShippingCost !== undefined) {
      // Use direct shipping cost without distance calculation
      setShippingCost(product.directShippingCost);
      console.log(`Using direct shipping cost: ${product.directShippingCost}`);
    } else {
      // Calculate distance and shipping cost when delivery address is saved
      if (tempDeliveryAddress && product?.location) {
        const distance = await calculateDistance(product.location, tempDeliveryAddress);
        if (distance) {
          await calculateShipping(distance);
        } else {
          console.error('Failed to calculate distance, using fallback shipping cost');
          // You could set a default shipping cost here if needed
        }
      }
    }
  };

  // Handle opening the delivery address dialog
  const handleOpenDialog = () => {
    setTempDeliveryAddress(deliveryAddress);
    setDialogOpen(true);
  };

  /**
   * Initiates payment using a payment-first flow.
   * - Validates required buyer and shipping fields
   * - Sends full order + buyer + shipping payload to /api/create-checkout-session
   * - Redirects user to Stripe Checkout URL returned by the API
   */
  const handleProceedToPayment = async () => {
    console.log("payment process clicked")
    if (!product) {
      addNotification('Product not found.', 'error');
      return;
    }
    if (!deliveryAddress) {
      addNotification('Please set your delivery address.', 'error');
      return;
    }
    if (!buyerInfo.contactName || !buyerInfo.phone) {
      addNotification('Please provide your contact name and phone number.', 'error');
      return;
    }

    if (!product.agribusiness?.id || !product.agribusiness?.user?.id) {
      addNotification('Product seller information is missing. Please try again.', 'error');
      return;
    }

    // Ensure we have BusinessBuyer profile id to associate order correctly
    if (!buyerProfileId) {
      addNotification('Buyer profile not found. Please complete your business profile before proceeding.', 'error');
      return;
    }

    setPaymentLoading(true);
    setError(null);

    try {
      // Use bid unit price if in bid mode, otherwise product pricing
      const effectiveUnitPrice = isBid && bidUnitPrice !== null ? bidUnitPrice : Number(product.pricing || 0);
      const subtotal = effectiveUnitPrice * quantity;
      const totalAmount = subtotal + Number(shippingCost || 0);

      // Loyalty redemption calculation to enforce limits before sending to backend
      const POINT_VALUE_RM = 0.01; // 1 point = RM0.01
      const maxByTotal = Math.floor((Number(totalAmount) || 0) / POINT_VALUE_RM);
      const redeemPointsClamped = Math.max(0, Math.min(redeemPoints || 0, loyaltyBalance || 0, maxByTotal));

      // Create Stripe checkout session directly (payment-first)
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity,
          unitPrice: effectiveUnitPrice,
          subtotal,
          shippingCost,
          totalAmount,
          currency: product.currency,
          productName: product.productTitle,
          buyerInfo: {
            companyName: buyerInfo.companyName,
            contactName: buyerInfo.contactName,
            email: buyerInfo.email,
            phone: buyerInfo.phone,
            deliveryAddress,
          },
          shippingCalculation: {
            provider: logisticsPartner?.companyName || product.selectedLogistics || null,
            deliveryTime: logisticsPartner?.estimatedDeliveryTime || (product.selectedLogistics ? (product.selectedLogistics.toLowerCase() === 'fedex' ? '1-3 business days' : product.selectedLogistics.toLowerCase() === 'dhl' ? '1-2 business days' : product.selectedLogistics.toLowerCase() === 'pos laju' ? '2-5 business days' : product.selectedLogistics.toLowerCase() === 'j&t express' ? '2-4 business days' : null) : null),
            distance: shippingDistance,
          },
          // IMPORTANT: use BusinessBuyer.id for buyer relation
          buyerId: buyerProfileId,
          // Bid metadata
          isBid,
          bidUnitPrice: isBid && bidUnitPrice !== null ? bidUnitPrice : undefined,
          // Order notes
          notes: notes.trim() || null,
          // Logistics partner
          logisticsPartnerId: logisticsPartner?.id || null,
          // Loyalty redemption
          redeemPoints: redeemPointsClamped,
        })
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await checkoutResponse.json();
      window.location.href = url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // Use bid unit price if provided in query
  const effectiveUnitPrice = isBid && bidUnitPrice !== null ? bidUnitPrice : Number(product.pricing || 0);
  const subtotal = effectiveUnitPrice * quantity;
  const total = subtotal + Number(shippingCost || 0);

  // Loyalty derived values for UI display
  const POINT_VALUE_RM = 0.01; // 1 point = RM0.01
  const maxByTotal = Math.floor((Number(total) || 0) / POINT_VALUE_RM);
  const effectiveRedeemPoints = Math.max(0, Math.min(redeemPoints || 0, loyaltyBalance || 0, maxByTotal));
  const loyaltyDiscountRM = effectiveRedeemPoints * POINT_VALUE_RM;
  const adjustedTotal = Math.max(0, (Number(total) || 0) - loyaltyDiscountRM);

  // Get logistics details for display
  const logisticsDetails: Record<string, { deliveryTime: string; rateMethod: string }> = {
    'fedex': { deliveryTime: '1-3 business days', rateMethod: 'Distance × Weight × RM 0.15/kg' },
    'dhl': { deliveryTime: '1-2 business days', rateMethod: 'Distance × Weight × RM 0.18/kg' },
    'pos laju': { deliveryTime: '2-5 business days', rateMethod: 'Distance × Weight × RM 0.12/kg' },
    'j&t express': { deliveryTime: '2-4 business days', rateMethod: 'Distance × Weight × RM 0.10/kg' }
  };

  const selectedLogistics = product.selectedLogistics?.toLowerCase() || '';
  const logisticsInfo = logisticsDetails[selectedLogistics];

  // Helper to summarize partner pricing for display
  const summarizePricing = (pricingModel?: string | null, pricingConfig?: string[] | null) => {
    if (!pricingModel) return null;
    const model = pricingModel.toLowerCase();
    if (model === 'flat rate model' || model === 'flat rate') {
      const rate = pricingConfig?.[0] || '';
      return rate ? `Flat rate: RM ${rate}/kg/km` : 'Flat rate';
    }
    if (model === 'tiered rate by weight' || model === 'tiered by weight') {
      return 'Tiered by weight';
    }
    if (model === 'tiered rate by distance' || model === 'tiered by distance') {
      return 'Tiered by distance';
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Top-right notifications */}
      <NotificationContainer notifications={notifications} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-2">Review your order details before making payment.</p>
          </div>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Summary & Buyer Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                      {product.productImages?.[0] ? (
                        <Image
                          src={product.productImages[0]}
                          alt={product.productTitle}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-3">{product.productTitle}</h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Sold by:</span>
                          <span className="font-bold text-lg">{product.agribusiness?.businessName || 'Unknown Business'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          
                          <div className="flex items-center gap-2">
                            {product.agribusiness?.businessImage ? (
                              <div className="relative w-6 h-6 rounded-full overflow-hidden">
                                <Image
                                  src={product.agribusiness.businessImage}
                                  alt={product.agribusiness.user?.name || 'Contact'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">{product.agribusiness?.user?.name?.charAt(0) || 'U'}</span>
                              </div>
                            )}
                            <span className="text-gray-600">{product.agribusiness?.user?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-5">
                          <span className="text-gray-600">{isBid ? 'Bid price per' : 'Price per'} {product.unitOfMeasurement || 'unit'}:</span>
                          <span className="font-medium">{product.currency} {Number(isBid && bidUnitPrice !== null ? bidUnitPrice : (product.pricing || 0)).toFixed(2)}</span>
                          {isBid && <Badge variant="secondary" className="ml-2">Bid Mode</Badge>}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Ordered quantity:</span>
                          <span className="font-medium">{quantity}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-gray-600">Subtotal:</span>
                          <Badge variant="secondary" className="ml-auto">
                            {product.currency} {Number(subtotal || 0).toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 mt-6">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      <span className="font-medium">Shipping Method:</span>
                      {product.shippingMethod !== 'direct' && logisticsPartner?.businessImage && (
                        <span className="relative w-5 h-5 rounded-full overflow-hidden">
                          <Image src={logisticsPartner.businessImage} alt={logisticsPartner.companyName || 'Logistics Provider'} fill className="object-cover" />
                        </span>
                      )}
                      <span className="capitalize">
                        {product.shippingMethod === 'direct' ? 'Direct Shipping' :
                          (logisticsPartner?.companyName || (product.selectedLogistics ? 
                            product.selectedLogistics.split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ') : 'Standard'))
                        }
                      </span>
                    </div>
                    {product.shippingMethod !== 'direct' && logisticsPartner && (
                      <div className="text-sm text-gray-600 ml-6">
                        {logisticsPartner.estimatedDeliveryTime && (
                          <p>Estimated Delivery Time: {logisticsPartner.estimatedDeliveryTime}</p>
                        )}
                        {summarizePricing(logisticsPartner.pricingModel, logisticsPartner.pricingConfig) && (
                          <p className='mt-2'>Rate Method: {summarizePricing(logisticsPartner.pricingModel, logisticsPartner.pricingConfig)}</p>
                        )}
                      </div>
                    )}
                    {!logisticsPartner && logisticsInfo && product.shippingMethod !== 'direct' && (
                      <div className="text-sm text-gray-600 ml-6">
                        <p>Delivery Time: {logisticsInfo.deliveryTime}</p>
                        <p>Rate Method: {logisticsInfo.rateMethod}</p>
                      </div>
                    )}
                    {product.shippingMethod === 'direct' && (
                      <div className="text-sm text-gray-600 ml-6">
                        <p>Shipping handled directly by seller</p>
                      </div>
                    )}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <span className='font-semibold'>Shipping Cost:</span>
                        {product.shippingMethod !== 'direct' && (
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              Please enter your delivery address to view shipping cost calculation
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                        {product.shippingMethod === 'direct' && (
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs tracking-wide rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              Fixed shipping cost set by seller
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      {shippingLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-500">Calculating...</span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="ml-auto">
                          {product.currency} {Number(shippingCost || 0).toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total:</span>
                    {shippingLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">Calculating...</span>
                      </div>
                    ) : (
                      <span>{product.currency} {Number(total || 0).toFixed(2)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Buyer Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Your Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* <div>
                      <Label htmlFor="companyName">Company Name *</nLabel>
                      <Input
                        id="companyName"
                        value={buyerInfo.companyName}
                        onChange={(e) => setBuyerInfo(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Enter company name"
                        required
                      />
                    </div> */}
                    <div className='space-y-3'>
                      <Label htmlFor="contactName">Contact Name<span className="text-red-500">*</span></Label>
                      <Input
                        id="contactName"
                        value={buyerInfo.contactName}
                        onChange={(e) => setBuyerInfo(prev => ({ ...prev, contactName: e.target.value }))}
                        placeholder="Enter contact name"
                        required
                      />
                    </div>
                    {/* <div>
                      <Label htmlFor="email">Email *</nLabel>
                      <Input
                        id="email"
                        type="email"
                        value={buyerInfo.email}
                        onChange={(e) => setBuyerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email address"
                        required
                      />
                    </div> */}
                    <div className='space-y-3'>
                      <Label htmlFor="phone">Phone<span className="text-red-500">*</span></Label>
                      <Input
                        id="phone"
                        value={buyerInfo.phone}
                        onChange={(e) => setBuyerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className='mt-6'>
                    <Label>Delivery Address<span className="text-red-500">*</span></Label>
                    <p className="mt-3 text-xs text-gray-500">
                      Delivery address for your order
                    </p>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left h-auto p-3 cursor-pointer mt-2"
                          onClick={handleOpenDialog}
                        >
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">
                              {deliveryAddress || userCompanyAddress || 'No address set'}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              Click to {deliveryAddress || userCompanyAddress ? 'change' : 'set'} delivery address
                            </span>
                          </div>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className='tracking-wide font-bold'>Set Delivery Address</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label htmlFor="dialogDeliveryAddress">Delivery Address</Label>
                            <Input
                              ref={locationInputRef}
                              id="dialogDeliveryAddress"
                              type="text"
                              value={tempDeliveryAddress}
                              onChange={(e) => setTempDeliveryAddress(e.target.value)}
                              placeholder="Enter delivery address..."
                              className="mt-2"
                            />
                          </div>
                          <div className="flex justify-end space-x-2 mt-6">
                            <Button 
                              variant="outline" 
                              onClick={() => setDialogOpen(false)}
                              className='cursor-pointer'
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleSaveDeliveryAddress} className='cursor-pointer'>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className='space-y-3 mt-6'>
                    <Label htmlFor="notes">Order Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special instructions or notes for this order"
                      className="min-h-[80px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Section */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit/Debit Card
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Loyalty Rewards: Optional redemption to discount the payable amount */}
                  <div className="space-y-3 border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Loyalty Rewards</span>
                      <Badge variant="secondary">{loyaltyBalance} pts</Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      Available is worth approx. {product.currency} {(Number(loyaltyBalance || 0) * POINT_VALUE_RM).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={Math.max(0, Math.min(Number(loyaltyBalance || 0), Number(maxByTotal || 0)))}
                        value={Number(redeemPoints || 0)}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value || '0', 10);
                          const clamped = Math.max(0, Math.min(isNaN(raw) ? 0 : raw, Number(loyaltyBalance || 0), Number(maxByTotal || 0)));
                          setRedeemPoints(clamped);
                        }}
                        className="w-36"
                        aria-label="Points to redeem"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setRedeemPoints(Math.max(0, Math.min(Number(loyaltyBalance || 0), Number(maxByTotal || 0))))}
                      >
                        Use Max
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="cursor-pointer"
                        onClick={() => setRedeemPoints(0)}
                      >
                        Clear
                      </Button>
                    </div>
                    {effectiveRedeemPoints > 0 && (
                      <div className="flex items-center justify-between text-sm text-green-700">
                        <span>Discount</span>
                        <span>-
                          {" "}
                          {product.currency} {Number(loyaltyDiscountRM || 0).toFixed(2)} (−{effectiveRedeemPoints} pts)
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleProceedToPayment}
                    className="w-full cursor-pointer"
                    size="lg"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : shippingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating Shipping...
                      </>
                    ) : (
                      `Proceed to Payment - ${product.currency} ${Number(adjustedTotal || 0).toFixed(2)}`
                    )}
                  </Button>
                  <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Lock className="h-4 w-4" />
                    <AnimatedShinyText>
                      Secure payment powered by Stripe
                    </AnimatedShinyText>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

      </div>
    </div>
  );
}