'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { 
  Heart, 
  ShoppingCart, 
  MessageCircle, 
  MessagesSquare,
  MapPin, 
  Star, 
  Plus, 
  Minus,
  Truck,
  Calendar,
  Package,
  Shield,
  Instagram
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  productTitle: string;
  cropCategory: string;
  description: string | null;
  unitOfMeasurement: string;
  minimumOrderQuantity: number;
  quantityAvailable: number;
  pricing: number | string;
  currency: string;
  allowBidding: boolean;
  storageConditions: string | null;
  expiryDate: string | null;
  location: string;
  productImages: string[];
  shippingMethod: string | null;
  directShippingCost: number | string | null;
  selectedLogistics: string | null;
  status: string;
  createdAt: string;
  agribusiness: {
    businessName: string;
    tradingType: string;
    primaryCropCategory: string;
    bio: string;
    facebookUrl: string;
    instagramUrl: string;
    websiteUrl: string;
    subscriptionTier: string;
    businessImage: string;
    state: string;
    country: string;
    contactNo: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Product;
  error?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState<number | string>(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string);
    }
    
  }, [params.id]);


  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`);
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setProduct(data.data);
        setQuantity(data.data.minimumOrderQuantity);
      } else {
        toast.error('Product not found');
        router.push('/buyer/marketplace/market-lists');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };



  const handleQuantityChange = (change: number) => {
    const currentQty = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity;
    const newQuantity = currentQty + change;
    if (newQuantity >= (product?.minimumOrderQuantity || 1) && newQuantity <= (product?.quantityAvailable || 0)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    toast.success(`Added ${quantity} ${product?.unitOfMeasurement} of ${product?.productTitle} to cart`);
  };

  const handleBuyNow = () => {
    toast.success('Redirecting to checkout...');
  };

  const handleRequestQuotation = () => {
    toast.success('Quotation request sent to seller');
  };

  const handlePlaceBid = () => {
    toast.success('Bid placement feature coming soon');
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const totalPrice = product ? (Number(product.pricing) || 0) * (typeof quantity === 'string' ? parseInt(quantity) || 0 : quantity) : 0;

  // Helper function to safely format pricing
  const formatPrice = (price: number | string | null): string => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Button onClick={() => router.push('/buyer/marketplace/market-lists')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/buyer/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/buyer/marketplace/market-lists">Marketplace</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/buyer/marketplace/market-lists?search=${encodeURIComponent(product.cropCategory)}`}>
                  {product.cropCategory}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.productTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <motion.h1 
            className="text-3xl font-bold text-gray-900 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {product.productTitle}
          </motion.h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Product Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Image Gallery */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              {product.productImages.length > 0 ? (
                <Image
                  src={product.productImages[selectedImageIndex] || '/placeholder-product.jpg'}
                  alt={product.productTitle}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package size={64} />
                </div>
              )}
            </div>
            
            {/* Thumbnail Selector */}
            {product.productImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-green-600' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.productTitle} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right Column - Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.productTitle}</h2>
              <Badge variant="secondary" className="mb-4">{product.cropCategory}</Badge>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <MapPin size={16} />
                <span>{product.location}</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-green-50 p-4 rounded-lg mt-10">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {product.currency} {formatPrice(product.pricing)}
                <span className="text-lg font-normal text-gray-600">/{product.unitOfMeasurement}</span>
              </div>
              <div className="text-sm text-gray-600">
                Total: {product.currency} {totalPrice.toFixed(2)}
              </div>
            </div>

            {/* Quantity and Availability */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Available Quantity:</Label>
                <div className="text-lg font-semibold text-gray-900">
                  {product.quantityAvailable} {product.unitOfMeasurement}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Minimum Order:</Label>
                <div className="text-lg font-semibold text-gray-900">
                  {product.minimumOrderQuantity} {product.unitOfMeasurement}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</Label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={(typeof quantity === 'string' ? parseInt(quantity) || 0 : quantity) <= product.minimumOrderQuantity}
                >
                  <Minus size={16} />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    // Allow any numeric input during typing
                    if (!isNaN(val) || e.target.value === '') {
                      setQuantity(e.target.value === '' ? '' : val);
                    }
                  }}
                  onBlur={(e) => {
                    // Validate and correct value when input loses focus
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < product.minimumOrderQuantity) {
                      setQuantity(product.minimumOrderQuantity);
                    } else if (val > product.quantityAvailable) {
                      setQuantity(product.quantityAvailable);
                    }
                  }}
                  className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={product.minimumOrderQuantity}
                  max={product.quantityAvailable}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(1)}
                  disabled={(typeof quantity === 'string' ? parseInt(quantity) || 0 : quantity) >= product.quantityAvailable}
                >
                  <Plus size={16} />
                </Button>
                <span className="text-sm text-gray-600">{product.unitOfMeasurement}</span>
              </div>
            </div>

            {/* Key Highlights */}
            <div className="grid grid-cols-2 gap-4 text-sm mt-13">
              {product.storageConditions && (
                <div className="flex items-center space-x-2">
                  <Shield size={16} className="text-blue-600" />
                  <span>Storage: {product.storageConditions}</span>
                </div>
              )}
              {product.expiryDate && (
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-orange-600" />
                  <span>Expires: {new Date(product.expiryDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={handleAddToCart} 
                  variant="outline"
                  className="cursor-pointer w-full h-12 px-6 border-2 border-green-800 text-green-800 hover:bg-green-50 font-medium"
                >
                  <ShoppingCart size={16} className="mr-2" />
                  Add To Cart
                </Button>
                <Button 
                  onClick={handleBuyNow} 
                  className="cursor-pointer w-full h-12 px-6 bg-green-800 hover:bg-green-900 text-white font-medium"
                >
                  Buy Now
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleRequestQuotation} variant="outline" className="cursor-pointer w-full h-12 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                  Request Quote
                </Button>
                {product.allowBidding && (
                  <Button onClick={handlePlaceBid} variant="outline" className="cursor-pointer w-full h-12 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">
                    Place Bid
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Seller Information Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-4">
                {/* Business Image or Avatar */}
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  {product.agribusiness.businessImage ? (
                    <img 
                      src={product.agribusiness.businessImage} 
                      alt={product.agribusiness.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold text-xl">
                        {product.agribusiness.businessName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-xl font-bold">{product.agribusiness.businessName}</h3>
                    {/* Subscription Tier Badge */}
                    {(product.agribusiness.subscriptionTier === 'STANDARD' || product.agribusiness.subscriptionTier === 'ELITE') && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.agribusiness.subscriptionTier === 'ELITE' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {product.agribusiness.subscriptionTier}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{product.agribusiness.state}, {product.agribusiness.country}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            <strong>Trading Type:</strong> {product.agribusiness.tradingType}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="leading-7 [&:not(:first-child)]:mt-6">Trading Type indicates how the seller operates - whether they are a direct producer, distributor, or retailer of agricultural products.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span>•</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">
                            <strong>Primary Crop:</strong> {product.agribusiness.primaryCropCategory}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="leading-7 [&:not(:first-child)]:mt-6">Primary Crop Category represents the main type of agricultural products this seller specializes in growing or trading.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Bio Section */}
              {product.agribusiness.bio && (
                <div className="mb-6">
                  <Label className="text-sm font-medium text-gray-700">About</Label>
                  <p className="text-sm text-gray-600 mt-1">{product.agribusiness.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Contact</Label>
                  <p className="text-sm">{product.agribusiness.contactNo}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Rating</Label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className="text-yellow-400 fill-current" />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">4.8 (124 reviews)</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Social Media & Links</Label>
                  <div className="space-y-2 mt-1">
                    {product.agribusiness.facebookUrl && (
                      <div className="flex items-center space-x-2">
                        <a href={product.agribusiness.facebookUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:text-blue-800 flex-shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                        <a href={product.agribusiness.facebookUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate">
                          {product.agribusiness.facebookUrl}
                        </a>
                      </div>
                    )}
                    {product.agribusiness.instagramUrl && (
                      <div className="flex items-center space-x-2">
                        <a href={product.agribusiness.instagramUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-pink-600 hover:text-pink-800 flex-shrink-0">
                          <Instagram className="w-5 h-5" />
                        </a>
                        <a href={product.agribusiness.instagramUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-xs text-pink-600 hover:text-pink-800 hover:underline truncate">
                          {product.agribusiness.instagramUrl}
                        </a>
                      </div>
                    )}
                    {product.agribusiness.websiteUrl && (
                      <div className="flex items-center space-x-2">
                        <a href={product.agribusiness.websiteUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-gray-600 hover:text-gray-800 flex-shrink-0">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm5.568 13.8H15.57c-.185 1.4-.537 2.719-1.026 3.898-.489-1.179-.841-2.498-1.026-3.898h-1.998c.185 1.4.537 2.719 1.026 3.898.489-1.179.841-2.498 1.026-3.898zm-9.136 0H6.434c.185 1.4.537 2.719 1.026 3.898.489-1.179.841-2.498 1.026-3.898h1.998c-.185 1.4-.537 2.719-1.026 3.898-.489-1.179-.841-2.498-1.026-3.898z"/>
                          </svg>
                        </a>
                        <a href={product.agribusiness.websiteUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-xs text-gray-600 hover:text-gray-800 hover:underline truncate">
                          {product.agribusiness.websiteUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <div className="">
                  <Button 
                    onClick={handleAddToCart} 
                    variant="outline"
                    size="sm"
                    className="mr-2 cursor-pointer h-10 px-4 border-2 border-green-800 text-green-800 hover:bg-green-50 font-medium"
                  >
                    <MessagesSquare size={16} className="mr-3 text-green-800 fill-current" />
                    Chat with Seller
                  </Button>
                  <Button 
                    onClick={handleBuyNow} 
                    variant="outline"
                    size="sm"
                    className="cursor-pointer h-10 px-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    View Shop
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Product Info Tabs */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="storage">Storage & Expiry</TabsTrigger>
              <TabsTrigger value="harvest">Harvest Info</TabsTrigger>
              <TabsTrigger value="logistics">Logistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || 'No detailed description available for this product.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="storage" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Storage Conditions</Label>
                      <p className="text-gray-700">
                        {product.storageConditions || 'Standard storage conditions apply'}
                      </p>
                    </div>
                    {product.expiryDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Expiry Date</Label>
                        <p className="text-gray-700">
                          {new Date(product.expiryDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="harvest" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Harvest Date</Label>
                      <p className="text-gray-700">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Availability Window</Label>
                      <p className="text-gray-700">Available now - Limited stock</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logistics" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Truck size={20} className="text-blue-600" />
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Shipping Method</Label>
                        <p className="text-gray-700">
                          {product.shippingMethod || 'Standard shipping available'}
                        </p>
                      </div>
                    </div>
                    {product.directShippingCost && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Shipping Cost</Label>
                        <p className="text-gray-700">
                          {product.currency} {formatPrice(product.directShippingCost || 0)}
                        </p>
                      </div>
                    )}
                    {product.selectedLogistics && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Logistics Provider</Label>
                        <p className="text-gray-700">{product.selectedLogistics}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Buyer Interaction Section */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Buyer Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <MessageCircle size={16} />
                  <span>Chat with Seller</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={toggleWishlist}
                  className={`flex items-center space-x-2 ${
                    isWishlisted ? 'text-red-600 border-red-600' : ''
                  }`}
                >
                  <Heart size={16} className={isWishlisted ? 'fill-current' : ''} />
                  <span>{isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarProducts.map((similarProduct) => (
                <Card key={similarProduct.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <Link href={`/buyer/marketplace/${similarProduct.id}`}>
                    <CardContent className="p-4">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-4">
                        {similarProduct.productImages.length > 0 ? (
                          <Image
                            src={similarProduct.productImages[0]}
                            alt={similarProduct.productTitle}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package size={32} />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {similarProduct.productTitle}
                      </h3>
                      <p className="text-green-600 font-bold">
                        {similarProduct.currency} {formatPrice(similarProduct.pricing)}/{similarProduct.unitOfMeasurement}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {similarProduct.agribusiness.businessName}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}