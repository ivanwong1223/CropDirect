"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Package, 
  MapPin, 
  Tag, 
  Layers, 
  ShoppingBasket, 
  ArrowLeft, 
  Upload, 
  CalendarIcon, 
  HelpCircle,
  ChevronsUpDown,
  X,
  Save,
  RotateCcw,
  Banknote
} from "lucide-react";
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Form data interface for editing
interface EditFormData {
  productTitle: string;
  cropCategory: string;
  description: string;
  unitOfMeasurement: string;
  minimumOrderQuantity: string;
  quantityAvailable: string;
  pricing: string;
  currency: string;
  allowBidding: boolean;
  minimumIncrement: string;
  auctionEndTime: Date | undefined;
  autoAcceptThreshold: string;
  storageConditions: string;
  expiryDate: Date | undefined;
  location: string;
  productImages: (File | string)[];
  shippingMethod: string;
  directShippingCost: string;
  logisticsPartnerId: string;
}

// Original product interface for API response
interface ProductDetail {
  id: string;
  productTitle: string;
  cropCategory: string;
  description?: string;
  unitOfMeasurement: string;
  minimumOrderQuantity?: number;
  quantityAvailable: number;
  pricing: number | string;
  currency: string;
  allowBidding: boolean;
  minimumIncrement?: number;
  auctionEndTime?: string;
  autoAcceptThreshold?: number;
  storageConditions?: string;
  expiryDate?: string;
  location: string;
  productImages: string[];
  shippingMethod?: string | null;
  logisticsPartnerId?: string | null;
  directShippingCost?: string | null;
  agribusiness?: {
    businessName: string;
    state: string | null;
    country: string | null;
    contactNo?: string | null;
  };
}

/**
 * Edit Product Page Component
 * Allows users to view and edit their product details with a comprehensive form
 */
export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Minimal partner shape used in the edit-product selection UI
  interface LogisticsPartnerLite {
    id: string;
    companyName: string;
    businessImage?: string | null;
    estimatedDeliveryTime?: string | null;
    pricingModel?: string | null;
    pricingConfig?: string[];
  }

  // State management
  const [formData, setFormData] = useState<EditFormData>({
    productTitle: '',
    cropCategory: '',
    description: '',
    unitOfMeasurement: '',
    minimumOrderQuantity: '',
    quantityAvailable: '',
    pricing: '',
    currency: 'RM',
    allowBidding: false,
    minimumIncrement: '',
    auctionEndTime: undefined,
    autoAcceptThreshold: '',
    storageConditions: '',
    expiryDate: undefined,
    location: '',
    productImages: [],
    shippingMethod: '',
    directShippingCost: '',
    logisticsPartnerId: ''
  });

  // Logistics partners state for third-party shipping
  const [partners, setPartners] = useState<LogisticsPartnerLite[]>([]);
  const [partnersLoading, setPartnersLoading] = useState<boolean>(false);
  const [partnersError, setPartnersError] = useState<string>('');

  // Constants for form options
  const cropCategories = ['Grains', 'Fruits', 'Specialty Coffee', 'Vegetables', 'Legumes', 'Herbs & Spices', 'Nuts & Seeds', 'Rice', 'Livestock', 'Wheat', 'Corn', 'Barley', 'Oats', 'Soybean', 'Cotton', 'Fabric', 'Cloth', 'Leather', 'Metal', 'Plastic', 'Glass', 'Wood', 'Paper', 'Cardboard'];
  const units = ['kg', 'ton', 'sack', 'crate', 'box', 'piece'];
  const currencies = ['RM', 'USD', 'EUR', 'SGD'];
  /**
   * Load logistics partners from API for third-party shipping selection
   */
  const loadPartners = async () => {
    setPartnersLoading(true);
    setPartnersError('');
    try {
      const res = await fetch('/api/logistics-partners');
      if (!res.ok) throw new Error('Failed to load logistics partners');
      const json = await res.json();
      if (json?.success) {
        setPartners(Array.isArray(json.data) ? json.data : []);
      } else {
        throw new Error(json?.error || 'Failed to load logistics partners');
      }
    } catch (err) {
      setPartnersError(err as string || 'Failed to load logistics partners');
    } finally {
      setPartnersLoading(false);
    }
  };

  /**
   * Fetch product data from API
   */
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
        console.log("The product fetched is: ", data)
        setProduct(data.data);
        // Populate form with existing data
        populateForm(data.data);
      } catch (e) {
        console.error(e);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  /**
   * Load logistics partners on component mount
   */
  useEffect(() => {
    loadPartners();
  }, []);

  /**
   * Initialize Google Places Autocomplete
   */
  useEffect(() => {
    const initAutocomplete = () => {
      if (!locationInputRef.current) return;
      
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        console.log('Google Maps API not loaded yet');
        return;
      }

      try {
        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          types: ['geocode'],
          componentRestrictions: { country: 'my' }
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            handleInputChange('location', place.formatted_address);
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
      }
    };

    const timer = setTimeout(initAutocomplete, 1000);
    return () => clearTimeout(timer);
  }, [isEditing]);

  /**
   * Populate form with existing product data
   */
  const populateForm = (productData: ProductDetail) => {
    setFormData({
      productTitle: productData.productTitle || '',
      cropCategory: productData.cropCategory || '',
      description: productData.description || '',
      unitOfMeasurement: productData.unitOfMeasurement || '',
      minimumOrderQuantity: productData.minimumOrderQuantity?.toString() || '',
      quantityAvailable: productData.quantityAvailable?.toString() || '',
      pricing: productData.pricing?.toString() || '',
      currency: productData.currency || 'RM',
      allowBidding: productData.allowBidding || false,
      minimumIncrement: productData.minimumIncrement?.toString() || '',
      auctionEndTime: productData.auctionEndTime ? new Date(productData.auctionEndTime) : undefined,
      autoAcceptThreshold: productData.autoAcceptThreshold?.toString() || '',
      storageConditions: productData.storageConditions || '',
      expiryDate: productData.expiryDate ? new Date(productData.expiryDate) : undefined,
      location: productData.location || '',
      productImages: productData.productImages || [],
      shippingMethod: productData.shippingMethod || '',
      directShippingCost: productData.directShippingCost || '',
      logisticsPartnerId: productData.logisticsPartnerId || ''
    });
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof EditFormData, value: string | boolean | Date | undefined | (File | string)[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle image upload
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + formData.productImages.length <= 3) {
      setFormData(prev => ({
        ...prev,
        productImages: [...prev.productImages, ...files]
      }));
    } else {
      alert('Maximum 3 images allowed');
    }
  };

  /**
   * Remove uploaded image
   */
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  /**
   * Convert File to base64 string for API
   */
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  /**
   * Save product changes
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Process images - convert File objects to base64, keep existing URLs
      const imageData: string[] = [];
      for (const img of formData.productImages) {
        if (typeof img === 'string') {
          imageData.push(img); // Existing image URL
        } else {
          const base64 = await readFileAsDataURL(img);
          imageData.push(base64); // New image as base64
        }
      }

      const payload = {
        productTitle: formData.productTitle,
        cropCategory: formData.cropCategory,
        description: formData.description,
        unitOfMeasurement: formData.unitOfMeasurement,
        minimumOrderQuantity: formData.minimumOrderQuantity,
        quantityAvailable: formData.quantityAvailable,
        pricing: formData.pricing,
        currency: formData.currency,
        allowBidding: formData.allowBidding,
        minimumIncrement: formData.allowBidding ? formData.minimumIncrement : null,
        auctionEndTime: formData.allowBidding ? formData.auctionEndTime?.toISOString() : null,
        autoAcceptThreshold: formData.allowBidding ? formData.autoAcceptThreshold : null,
        storageConditions: formData.storageConditions,
        expiryDate: formData.expiryDate?.toISOString() || null,
        location: formData.location,
        productImages: imageData,
        shippingMethod: formData.shippingMethod,
        directShippingCost: formData.directShippingCost,
        logisticsPartnerId: formData.logisticsPartnerId
      };

      const resp = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update product");
      }

      // Navigate back to product list with success message
      const productTitle = encodeURIComponent(formData.productTitle);
      router.push(`/seller/product-list?updated=true&productTitle=${productTitle}&action=edited`);
      
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Reset form to original values
   */
  const handleReset = () => {
    if (product) {
      populateForm(product);
    }
  };

  /**
   * Format price display
   */
  const formatPrice = (value: number | string, currency: string, unit: string) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return `${currency} - per ${unit}`;
    return `${currency} ${num.toFixed(2)} per ${unit}`;
  };

  /**
   * Title case conversion
   */
  const titleCase = (s: string) => s.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());

  // Loading state
  if (loading) {
    return (
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <Button variant="outline" className="mb-4 cursor-pointer" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="space-y-6">
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
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <Button variant="outline" className="mb-4 cursor-pointer" onClick={() => router.back()}>
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

  // Main render
  return (
    <TooltipProvider>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" className="cursor-pointer" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="flex gap-3">
            {isEditing && (
              <>
                <Button variant="outline" onClick={handleReset} className="cursor-pointer">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
                  <Save className="mr-2 h-4 w-4" /> 
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
            <Button 
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Product'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Images */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Image Upload Area - Only show if less than 3 images */}
                    {formData.productImages.length < 3 && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <Label htmlFor="imageUpload" className="cursor-pointer">
                          <div className="mt-2 text-sm font-medium text-gray-900">
                            Upload Images
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            You can upload up to 3 images (JPG/PNG) - {3 - formData.productImages.length} remaining
                          </div>
                        </Label>
                        <Input
                          id="imageUpload"
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </div>
                    )}

                    {/* Maximum images reached message */}
                    {formData.productImages.length >= 3 && (
                      <div className="border-2 border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                        <Package className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2 text-sm font-medium text-gray-600">
                          Maximum Images Reached
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          You have uploaded the maximum of 3 images. Remove an image to upload a new one.
                        </div>
                      </div>
                    )}

                    {/* Image Preview Grid - Vertical Layout */}
                    {formData.productImages.length > 0 && (
                      <div className="space-y-4">
                        {formData.productImages.map((image, index) => (
                          <div key={index} className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                              alt={`Product ${index + 1}`}
                              className="w-full h-auto object-contain rounded-lg border shadow-sm"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 cursor-pointer shadow-md"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {product.productImages.length > 0 ? (
                      product.productImages.map((image, index) => (
                        <div key={index}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image}
                            alt={`${product.productTitle} ${index + 1}`}
                            className="w-full h-auto object-contain rounded-lg border shadow-sm"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No images uploaded
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Product Details */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              {/* Product Information */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Product Information</CardTitle>
                  <CardDescription>
                    {isEditing ? 'Edit your product details' : 'View product details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Product Name and Category Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-4">
                    {/* Product Name */}
                    <div className="md:col-span-2 space-y-3">
                      <Label htmlFor="productTitle">Product Name <span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Input
                          id="productTitle"
                          placeholder="Enter product name"
                          value={formData.productTitle}
                          onChange={(e) => handleInputChange('productTitle', e.target.value)}
                          className="bg-white border-gray-300"
                          maxLength={50}
                        />
                      ) : (
                        <p className="font-semibold text-md">{product.productTitle}</p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-3">
                      <Label>Category <span className="text-red-500">*</span></Label>
                      {isEditing ? (
                        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between bg-white border-gray-300"
                            >
                              {formData.cropCategory ? titleCase(formData.cropCategory) : "Select category"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Input
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="border-0 border-b"
                            />
                            <div className="max-h-60 overflow-auto">
                              {cropCategories
                                .filter(category => 
                                  category.toLowerCase().includes(categorySearch.toLowerCase())
                                )
                                .map((category) => (
                                  <button
                                    key={category}
                                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${formData.cropCategory === category.toLowerCase() ? 'bg-gray-100' : ''}`}
                                    onClick={() => {
                                      handleInputChange('cropCategory', category.toLowerCase());
                                      setCategoryOpen(false);
                                      setCategorySearch('');
                                    }}
                                  >
                                    {category}
                                  </button>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit text-sm">
                          <Package className="h-3.5 w-3.5" /> {titleCase(product.cropCategory)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-3 pb-2">
                    <Label htmlFor="description">Description</Label>
                    {isEditing ? (
                      <Textarea
                        id="description"
                        placeholder="Write a brief description about your product..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="bg-white border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-700">{product.description || 'No description provided'}</p>
                    )}
                  </div>

                  {/* Pricing & Quantity Row */}
                  <div className="space-y-6">
                    {/* First Row: MOQ and Quantity Available */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Minimum Order Quantity */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="minimumOrderQuantity">Minimum Order Quantity (MOQ)</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The smallest quantity a buyer must purchase in a single order</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {isEditing ? (
                          <Input
                            id="minimumOrderQuantity"
                            type="number"
                            placeholder="0"
                            value={formData.minimumOrderQuantity}
                            onChange={(e) => handleInputChange('minimumOrderQuantity', e.target.value)}
                            className="bg-white border-gray-300"
                          />
                        ) : (
                          <p className="text-gray-700">{product.minimumOrderQuantity || 'Not specified'} {product.unitOfMeasurement}</p>
                        )}
                      </div>

                      {/* Quantity Available */}
                      <div className="space-y-3">
                        <Label htmlFor="quantityAvailable">Stock <span className="text-red-500">*</span></Label>
                        {isEditing ? (
                          <Input
                            id="quantityAvailable"
                            type="number"
                            placeholder="0"
                            value={formData.quantityAvailable}
                            onChange={(e) => handleInputChange('quantityAvailable', e.target.value)}
                            className="bg-white border-gray-300"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-gray-700">
                            <Layers className="h-4 w-4 text-blue-600" />
                            <span>{product.quantityAvailable} {product.unitOfMeasurement} in stock</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Second Row: Unit of Measurement */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                      {/* Unit of Measurement */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="unitOfMeasurement">Unit <span className="text-red-500">*</span></Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Unit used to measure your product (e.g., kg, pieces)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {isEditing ? (
                          <Select value={formData.unitOfMeasurement} onValueChange={(value) => handleInputChange('unitOfMeasurement', value)}>
                            <SelectTrigger className="bg-white border-gray-300">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-gray-700">{product.unitOfMeasurement}</p>
                        )}
                      </div>

                      {/* Allow Bidding Toggle */}
                      <div className="space-y-4">
                        <Label>Allow Bidding / Negotiation</Label>
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="allowBidding"
                              checked={formData.allowBidding}
                              onCheckedChange={(checked) => handleInputChange('allowBidding', checked)}
                              className="data-[state=checked]:bg-green-500 cursor-pointer"
                            />
                            <Label htmlFor="allowBidding" className="text-sm">
                              Enable for bidding your product
                            </Label>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant={product.allowBidding ? "default" : "secondary"}>
                              {product.allowBidding ? "Bidding Enabled" : "Fixed Price"}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing Section */}
                    <div className="space-y-6">
                      {isEditing ? (
                        !formData.allowBidding ? (
                          // Fixed Price Section
                          <div className="space-y-2">
                            <Label htmlFor="pricing">Fixed Price<span className='text-red-500'>*</span></Label>
                            <div className="flex gap-2">
                              <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                                <SelectTrigger className="w-20 bg-white border-1 border-gray-300">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {currencies.map((currency) => (
                                    <SelectItem key={currency} value={currency}>
                                      {currency}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                id="pricing"
                                type="number"
                                step="0.01"
                                placeholder="3.50"
                                value={formData.pricing}
                                onChange={(e) => handleInputChange('pricing', e.target.value)}
                                className="flex-1 bg-white border-1 border-gray-300"
                                required
                              />
                            </div>
                            <p className="text-sm text-gray-500">Price per {formData.unitOfMeasurement || 'unit'}</p>
                          </div>
                        ) : (
                          // Bidding Section
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Starting Price */}
                              <div className="space-y-2">
                                <Label htmlFor="pricing">Starting Price (Minimum Acceptable)<span className='text-red-500'>*</span></Label>
                                <div className="flex gap-2">
                                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                                    <SelectTrigger className="w-20 bg-white border-1 border-gray-300">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {currencies.map((currency) => (
                                        <SelectItem key={currency} value={currency}>
                                          {currency}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    id="pricing"
                                    type="number"
                                    step="0.01"
                                    placeholder="3.50"
                                    value={formData.pricing}
                                    onChange={(e) => handleInputChange('pricing', e.target.value)}
                                    className="flex-1 bg-white border-1 border-gray-300"
                                    required
                                  />
                                </div>
                                <p className="text-sm text-gray-500">Starting bid price per {formData.unitOfMeasurement || 'unit'}</p>
                              </div>

                              {/* Minimum Increment */}
                              <div className="space-y-2">
                                <Label htmlFor="minimumIncrement">Minimum Increment<span className='text-red-500'>*</span></Label>
                                <div className="flex gap-2">
                                  <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-sm text-gray-600">
                                    {formData.currency}
                                  </span>
                                  <Input
                                    id="minimumIncrement"
                                    type="number"
                                    step="0.01"
                                    placeholder="5.00"
                                    value={formData.minimumIncrement}
                                    onChange={(e) => handleInputChange('minimumIncrement', e.target.value)}
                                    className="flex-1 bg-white border-1 border-gray-300 rounded-l-none"
                                    required={formData.allowBidding}
                                  />
                                </div>
                                <p className="text-sm text-gray-500">Each bid must be at least this amount higher</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Auction End Time */}
                              <div className="space-y-2">
                                <Label>Auction End Time<span className='text-red-500'>*</span></Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={`w-full justify-start text-left font-normal bg-white border-1 border-gray-300 ${
                                        !formData.auctionEndTime && 'text-muted-foreground'
                                      }`}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {formData.auctionEndTime ? format(formData.auctionEndTime, 'PPP') : 'Select end date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={formData.auctionEndTime}
                                      onSelect={(date) => handleInputChange('auctionEndTime', date)}
                                      disabled={(date) => date < new Date()}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <p className="text-sm text-gray-500">When the bidding period ends</p>
                              </div>

                              {/* Auto-accept Threshold */}
                              <div className="space-y-2">
                                <Label htmlFor="autoAcceptThreshold">Auto-accept Bids Above (Optional)</Label>
                                <div className="flex gap-2">
                                  <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-sm text-gray-600">
                                    {formData.currency}
                                  </span>
                                  <Input
                                    id="autoAcceptThreshold"
                                    type="number"
                                    step="0.01"
                                    placeholder="10.00"
                                    value={formData.autoAcceptThreshold}
                                    onChange={(e) => handleInputChange('autoAcceptThreshold', e.target.value)}
                                    className="flex-1 bg-white border-1 border-gray-300 rounded-l-none"
                                  />
                                </div>
                                <p className="text-sm text-gray-500">Automatically accept bids above this amount</p>
                              </div>
                            </div>
                          </div>
                        )
                      ) : (
                        // View Mode
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Banknote className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700">
                              {product.allowBidding ? 
                                `Starting at ${formatPrice(product.pricing, product.currency || "RM", product.unitOfMeasurement)}` :
                                formatPrice(product.pricing, product.currency || "RM", product.unitOfMeasurement)
                              }
                            </span>
                          </div>
                          {product.allowBidding && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              {product.minimumIncrement && (
                                <div>
                                  <span className="font-medium">Min. Increment:</span> {product.currency} {product.minimumIncrement}
                                </div>
                              )}
                              {product.auctionEndTime && (
                                <div>
                                  <span className="font-medium">Ends:</span> {format(new Date(product.auctionEndTime), 'PPP')}
                                </div>
                              )}
                              {product.autoAcceptThreshold && (
                                <div>
                                  <span className="font-medium">Auto-accept:</span> {product.currency} {product.autoAcceptThreshold}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-3 mt-8">
                    <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                    {isEditing ? (
                      <Input
                        ref={locationInputRef}
                        id="location"
                        placeholder="Enter your location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="bg-white border-gray-300"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span>{product.location}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingBasket className="h-5 w-5" />
                    Additional Details
                  </CardTitle>
                  <CardDescription>
                    View your additional details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Storage Conditions */}
                  <div className="space-y-3">
                    <Label htmlFor="storageConditions">Storage Conditions</Label>
                    {isEditing ? (
                      <Textarea
                        id="storageConditions"
                        placeholder="Describe storage requirements..."
                        value={formData.storageConditions}
                        onChange={(e) => handleInputChange('storageConditions', e.target.value)}
                        rows={3}
                        className="bg-white border-gray-300"
                      />
                    ) : (
                      <p className="text-gray-700">{product.storageConditions || 'Not specified'}</p>
                    )}
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-3">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    {isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-white border-gray-300"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Select expiry date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.expiryDate}
                            onSelect={(date) => handleInputChange('expiryDate', date)}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="text-gray-700">
                        {product.expiryDate ? format(new Date(product.expiryDate), "PPP") : 'Not specified'}
                      </p>
                    )}
                  </div>

                  {/* Shipping Method */}
                  {isEditing && (
                    <div className="space-y-3">
                      <Label>Shipping Method</Label>
                      <RadioGroup
                        value={formData.shippingMethod}
                        onValueChange={(value) => handleInputChange('shippingMethod', value)}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="direct" id="direct" />
                          <Label htmlFor="direct">Direct Shipping</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="third-party" id="thirdparty" />
                          <Label htmlFor="thirdparty">Third-party Logistics</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  {/* Conditional fields based on shipping method */}
                  {formData.shippingMethod === 'direct' && isEditing && (
                    <div className="space-y-3">
                      <Label htmlFor="directShippingCost">Direct Shipping Cost</Label>
                      <div className="flex gap-2">
                        <span className="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 text-sm">
                          {formData.currency}
                        </span>
                        <Input
                          id="directShippingCost"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.directShippingCost}
                          onChange={(e) => handleInputChange('directShippingCost', e.target.value)}
                          className="bg-white border-gray-300"
                        />
                      </div>
                    </div>
                  )}

                  {formData.shippingMethod === 'third-party' && isEditing && (
                    <div className="space-y-3">
                      <Label>Logistics Partner</Label>
                      {partnersLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : partnersError ? (
                        <div className="text-red-600 text-sm">{partnersError}</div>
                      ) : (
                        <RadioGroup
                          value={formData.logisticsPartnerId}
                          onValueChange={(value) => handleInputChange('logisticsPartnerId', value)}
                          className="space-y-3"
                        >
                          {partners.map((provider) => (
                            <div key={provider.id} className="border rounded-lg p-3 hover:bg-gray-50">
                              <div className="flex items-center space-x-2 mb-2">
                                <RadioGroupItem value={provider.id} id={provider.id} />
                                <Label htmlFor={provider.id} className="font-medium">
                                  {provider.companyName}
                                </Label>
                              </div>
                              <div className="ml-6 space-y-1">
                                {provider.estimatedDeliveryTime && (
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      Delivery: {provider.estimatedDeliveryTime}
                                    </Badge>
                                  </div>
                                )}
                                <p className="mt-3 text-sm text-gray-600">
                                  {(() => {
                                    const model = provider.pricingModel;
                                    const cfg = provider.pricingConfig;
                                    if (!model) return 'Pricing: N/A';
                                    if (model === 'flat') {
                                      const v = cfg?.[0] ? Number(cfg[0]) : undefined;
                                      return v ? `Flat rate: RM ${v}/kg·km` : 'Flat rate';
                                    }
                                    if (model === 'weightTiers') return 'Tiered by weight';
                                    if (model === 'distanceTiers') return 'Tiered by distance';
                                    return `Model: ${model}`;
                                  })()
                                }
                                </p>
                                {/* Detailed Pricing Summary */}
                                {(() => {
                                  const model = provider.pricingModel as string | undefined;
                                  const arr = (provider.pricingConfig as string[] | undefined) ?? [];
                                  if (!model || arr.length === 0) return null;

                                  const isNumeric = (s: string) => /^\s*\d+(?:\.\d+)?\s*$/.test(s);

                                  if (model === 'flat' || model === 'Flat Rate Model') {
                                    const line = arr.find((l) => l.startsWith('flat:')) ?? arr.find((l) => isNumeric(l));
                                    const rate = line ? Number(line.startsWith('flat:') ? line.split(':')[1] ?? '' : line) : undefined;
                                    return (
                                      <div className="mt-2 bg-gray-50 rounded text-xs text-gray-700">
                                        <span className="font-medium">Pricing: </span>
                                        {Number.isFinite(rate as number) ? `Flat rate: RM ${rate}/kg·km` : 'Flat rate'}
                                      </div>
                                    );
                                  }

                                  if (model === 'weightTiers' || model === 'Tiered Rate by Weight') {
                                    const tiers: { min: number; max: number | null; rate: number }[] = [];
                                    for (const raw of arr) {
                                      const l = raw.startsWith('w:') ? raw.substring(2) : raw;
                                      if (!l.includes('@')) continue;
                                      const [range, rateStr] = l.split('@');
                                      const [minStr, maxStr] = (range ?? '').split('-');
                                      const min = Number(minStr ?? 0);
                                      const max = maxStr === '+' ? null : maxStr === undefined || maxStr === '' ? null : Number(maxStr);
                                      const rate = Number(rateStr ?? 0);
                                      if (Number.isFinite(min) && Number.isFinite(rate)) tiers.push({ min, max, rate });
                                    }
                                    const text = tiers.length
                                      ? tiers.map((t) => `${t.min}-${t.max == null ? '+' : t.max}kg @ RM ${t.rate}/kg·km`).join('; ')
                                      : 'No weight tiers defined';
                                    return (
                                      <div className="mt-2 bg-gray-50 rounded text-xs text-gray-700">
                                        <span className="font-medium">Pricing: </span>
                                        {tiers.length ? `Weight tiers: ${text}` : text}
                                      </div>
                                    );
                                  }

                                  if (model === 'distanceTiers' || model === 'Tiered Rate by Distance') {
                                    const tiers: { min: number; max: number | null; rate: number }[] = [];
                                    for (const raw of arr) {
                                      const l = raw.startsWith('d:') ? raw.substring(2) : raw;
                                      if (!l.includes('@')) continue;
                                      const [range, rateStr] = l.split('@');
                                      const [minStr, maxStr] = (range ?? '').split('-');
                                      const min = Number(minStr ?? 0);
                                      const max = maxStr === '+' ? null : maxStr === undefined || maxStr === '' ? null : Number(maxStr);
                                      const rate = Number(rateStr ?? 0);
                                      if (Number.isFinite(min) && Number.isFinite(rate)) tiers.push({ min, max, rate });
                                    }
                                    const text = tiers.length
                                      ? tiers.map((t) => `${t.min}-${t.max == null ? '+' : t.max}km @ RM ${t.rate}/kg·km`).join('; ')
                                      : 'No distance tiers defined';
                                    return (
                                      <div className="mt-2 bg-gray-50 rounded text-xs text-gray-700">
                                        <span className="font-medium">Pricing: </span>
                                        {tiers.length ? `Distance tiers: ${text}` : text}
                                      </div>
                                    );
                                  }

                                  return null;
                                })()
                                }
                              </div>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  )}

                  {/* Display current shipping info if not editing */}
                  {!isEditing && product.shippingMethod && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <ShoppingBasket className="h-4 w-4 text-purple-600" />
                      <span>
                        Shipping: {product.shippingMethod === 'third-party' ? (
                          <>third-party{product.logisticsPartnerId ? ` (${partners.find(p => p.id === product.logisticsPartnerId)?.companyName || 'Unknown Partner'})` : ""}</>
                        ) : (
                          <>
                            {product.shippingMethod}
                            {product.directShippingCost && ` - ${product.currency || 'RM'}${product.directShippingCost}`}
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
