"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, Info, MapPin, Package, DollarSign, Truck, Image as ImageIcon, HelpCircle, ChevronsUpDown, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserData } from '@/lib/localStorage';


interface FormData {
  // Section A: Product Information
  productTitle: string;
  cropCategory: string;
  description: string;
  unitOfMeasurement: string;
  minimumOrderQuantity: string;
  quantityAvailable: string;
  
  // Section B: Pricing & Terms
  pricing: string;
  currency: string;
  allowBidding: boolean;
  // Bidding-specific fields
  minimumIncrement: string;
  auctionEndTime: Date | undefined;
  autoAcceptThreshold: string;
  
  // Section C: Additional Details & Media
  storageConditions: string;
  expiryDate: Date | undefined;
  location: string;
  productImages: File[];
  
  // Section D: Shipping Options
  shippingMethod: string;
  directShippingCost: string;
  logisticsPartnerId: string;
}

interface UploadedImage {
  file: File;
  url?: string;
  uploading?: boolean;
  error?: string;
}

// Interface for S3 upload response
interface S3UploadedFile {
  url: string;
  key: string;
  size: number;
}

// Minimal partner shape used in the add-product selection UI
interface LogisticsPartnerLite {
  id: string;
  companyName: string;
  businessImage?: string | null;
  estimatedDeliveryTime?: string | null;
  pricingModel?: string | null;
  pricingConfig?: string[];
}

export default function AddProduct() {
  const router = useRouter();
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Searchable combobox states for crop category
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  // Validation state for quantity available
  const [quantityValidationError, setQuantityValidationError] = useState('');
  
  // State for uploaded images with S3 URLs
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Logistics partners state for third-party shipping
  const [partners, setPartners] = useState<LogisticsPartnerLite[]>([]);
  const [partnersLoading, setPartnersLoading] = useState<boolean>(false);
  const [partnersError, setPartnersError] = useState<string>('');

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

  useEffect(() => {
    loadPartners();
  }, []);

  const [formData, setFormData] = useState<FormData>({
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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initAutocomplete = () => {
      if (!locationInputRef.current) return;
      
      // Check if Google Maps API is loaded
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
            console.log('Selected location:', place.formatted_address);
            console.log("Lat:", place.geometry?.location?.lat());
            console.log("Lng:", place.geometry?.location?.lng());
          } else {
            console.log('No formatted address found in place result');
          }
        });

        autocompleteRef.current = autocomplete;
        console.log('Google Places Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    };

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete();
    } else {
      // Wait for Google Maps API to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log("Google Maps API loaded");
          clearInterval(checkGoogleMaps);
          initAutocomplete();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handle location selection from Google Maps autocomplete
   * @param place - The selected place from Google Maps
   */
  // const handleLocationSelect = (place: google.maps.places.PlaceResult) => {
  //   if (place.formatted_address) {
  //     handleInputChange('location', place.formatted_address);
  //     console.log('Selected location:', place.formatted_address);
  //     console.log("Lat:", place.geometry?.location?.lat());
  //     console.log("Lng:", place.geometry?.location?.lng());
  //   } else {
  //     console.log('No formatted address found in place result');
  //   }
  // };

  /**
   * Handle form input changes
   * @param field - The field name to update
   * @param value - The new value
   */

  /**
   * Validate quantity available against minimum order quantity
   * @param quantityAvailable - The quantity available value
   * @param minimumOrderQuantity - The minimum order quantity value
   */
  const validateQuantityAvailable = (quantityAvailable: string, minimumOrderQuantity: string) => {
    const qty = parseFloat(quantityAvailable);
    const moq = parseFloat(minimumOrderQuantity);
    
    if (quantityAvailable && minimumOrderQuantity && !isNaN(qty) && !isNaN(moq)) {
      if (qty < moq) {
        setQuantityValidationError('Quantity Available cannot be less than Minimum Order Quantity');
        return false;
      }
    }
    setQuantityValidationError('');
    return true;
  };

  // Make handleInputChange strongly typed so that value matches the type of the selected field
  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Real-time validation for quantity available
      if (field === 'quantityAvailable' || field === 'minimumOrderQuantity') {
        const qtyAvailable = field === 'quantityAvailable' ? value as string : prev.quantityAvailable;
        const minOrderQty = field === 'minimumOrderQuantity' ? value as string : prev.minimumOrderQuantity;
        validateQuantityAvailable(qtyAvailable, minOrderQty);
      }
      
      return newFormData;
    });
  };

  /**
   * Handle image upload to S3
   * @param event - File input change event
   */
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + uploadedImages.length > 3) {
      alert('You can only upload up to 3 images');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create initial uploaded image objects
      const newImages: UploadedImage[] = files.map(file => ({
        file,
        uploading: true
      }));
      
      setUploadedImages(prev => [...prev, ...newImages]);
      
      // Upload files to S3
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/upload/s3', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update uploaded images with S3 URLs
        setUploadedImages(prev => {
          const updated = [...prev];
          const startIndex = updated.length - files.length;
          
          result.data.files.forEach((uploadedFile: S3UploadedFile, index: number) => {
            if (updated[startIndex + index]) {
              updated[startIndex + index] = {
                ...updated[startIndex + index],
                url: uploadedFile.url,
                uploading: false
              };
            }
          });
          
          return updated;
        });
        
        console.log('Images uploaded successfully:', result.data.files);
      } else {
        // Handle upload error
        setUploadedImages(prev => {
          const updated = [...prev];
          const startIndex = updated.length - files.length;
          
          for (let i = startIndex; i < updated.length; i++) {
            updated[i] = {
              ...updated[i],
              uploading: false,
              error: result.error || 'Upload failed'
            };
          }
          
          return updated;
        });
        
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      
      // Update images with error state
      setUploadedImages(prev => {
        const updated = [...prev];
        const startIndex = updated.length - files.length;
        
        for (let i = startIndex; i < updated.length; i++) {
          updated[i] = {
            ...updated[i],
            uploading: false,
            error: 'Upload failed'
          };
        }
        
        return updated;
      });
      
      alert('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  /**
   * Remove uploaded image
   * @param index - Index of image to remove
   */
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Read a File as a base64 data URL
   * @param file - The file to convert
   * @returns Promise that resolves with the data URL string
   */
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate quantity available before submission
    const isQuantityValid = validateQuantityAvailable(formData.quantityAvailable, formData.minimumOrderQuantity);
    if (!isQuantityValid) {
      alert('Invalid Quantity Available.');
      return;
    }
    
    console.log('The FormData submitted is: ', formData);
    
    try {
      // Get current user data from localStorage
      const userData = getUserData();
      if (!userData) {
        alert('Please log in to create a product listing');
        return;
      }

      // Get user's agribusiness ID
      const agribusinessResponse = await fetch(`/api/user/agribusiness?userId=${userData.id}`);
      const agribusinessData = await agribusinessResponse.json();
      console.log('The agribusinessData is: ', agribusinessData);
      
      if (!agribusinessData.success) {
        alert('Unable to find your agribusiness profile. Please contact support.');
        return;
      }

      // Get S3 URLs from uploaded images
      const imageUrls = uploadedImages
        .filter(img => img.url && !img.error)
        .map(img => img.url!);
      
      // Check if there are any images still uploading
      const stillUploading = uploadedImages.some(img => img.uploading);
      if (stillUploading) {
        alert('Please wait for all images to finish uploading.');
        return;
      }
      
      // Check for upload errors
      const hasErrors = uploadedImages.some(img => img.error);
      if (hasErrors) {
        alert('Some images failed to upload. Please remove them and try again.');
        return;
      }

      // Prepare form data for API submission
      const productData = {
        agribusinessId: agribusinessData.data.id,
        productTitle: formData.productTitle,
        cropCategory: formData.cropCategory,
        description: formData.description,
        unitOfMeasurement: formData.unitOfMeasurement,
        minimumOrderQuantity: formData.minimumOrderQuantity,
        quantityAvailable: formData.quantityAvailable,
        pricing: formData.pricing,
        currency: formData.currency,
        allowBidding: formData.allowBidding,
        minimumIncrement: formData.minimumIncrement,
        auctionEndTime: formData.auctionEndTime?.toISOString(),
        autoAcceptThreshold: formData.autoAcceptThreshold,
        storageConditions: formData.storageConditions,
        expiryDate: formData.expiryDate?.toISOString(),
        location: formData.location,
        productImages: imageUrls,
        shippingMethod: formData.shippingMethod,
        directShippingCost: formData.directShippingCost,
        logisticsPartnerId: formData.logisticsPartnerId,
      };

      // Submit product data to API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (result.success) {
        const productTitle = formData.productTitle || 'Your product';

        // Reset form or redirect to product list
        setFormData({
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
        setUploadedImages([]);
        // Redirect to product list with success notification data
        router.push(`/seller/product-list?created=true&productTitle=${encodeURIComponent(productTitle)}`);
      } else {
        alert(`Failed to create product: ${result.error || 'Please try again.'}`);
        console.error('Product creation failed:', result.error);
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while creating the product. Please try again.');
    }
  };

  const cropCategories = ['Grains', 'Fruits', 'Specialty Coffee', 'Vegetables', 'Legumes', 'Herbs & Spices', 'Nuts & Seeds', 'Rice', 'Livestock', 'Wheat', 'Corn', 'Barley', 'Oats', 'Soybean', 'Cotton', 'Fabric', 'Cloth', 'Leather', 'Metal', 'Plastic', 'Glass', 'Wood', 'Paper', 'Cardboard'];
  const units = ['kg', 'ton', 'sack', 'crate', 'box', 'piece'];
  const currencies = ['RM', 'USD', 'SGD'];
  
  // Logistics partners are now loaded dynamically from /api/logistics-partners

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Product Listing</h1>
        <p className="text-gray-600">Fill in the details below to list your agricultural product</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section A: New Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              Section A: New Product Information
            </CardTitle>
            <CardDescription>
              Provide basic information about your agricultural product
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="productTitle">Product Title<span className='text-red-500'>*</span></Label>
                <Input
                  id="productTitle"
                  placeholder="e.g., Premium Organic Rice"
                  value={formData.productTitle}
                  onChange={(e) => handleInputChange('productTitle', e.target.value)}
                  required
                  className="bg-white border-1 border-gray-300"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="cropCategory">Crop Category<span className='text-red-500'>*</span></Label>
                <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryOpen}
                      className="w-full justify-between bg-white border-1 border-gray-300 font-light tracking-wide"
                      onClick={() => setCategoryOpen((prev) => !prev)}
                    >
                      {(() => {
                        const selected = cropCategories.find(c => c.toLowerCase() === formData.cropCategory);
                        return selected ? selected : 'Select category';
                      })()}
                      <ChevronsUpDown className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2">
                    <Input
                      placeholder="Search category..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="mb-2 bg-white border-1 border-gray-300"
                    />
                    <div className="max-h-56 overflow-y-auto">
                      {cropCategories
                        .filter((c) => c.toLowerCase().includes(categorySearch.toLowerCase()))
                        .map((category) => (
                          <button
                            type="button"
                            key={category}
                            className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${formData.cropCategory === category.toLowerCase() ? 'bg-gray-100' : ''}`}
                            onClick={() => {
                              handleInputChange('cropCategory', category.toLowerCase() as FormData['cropCategory']);
                              setCategoryOpen(false);
                              setCategorySearch(''); // Clear search when selection is made
                            }}
                          >
                            {category}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Write a brief description about your product, quality, and origin."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="bg-white border-1 border-gray-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="unitOfMeasurement">Unit of Measurement<span className='text-red-500'>*</span></Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='tracking-wide'>Select the unit used to measure your product (e.g., kg for weight, pieces for count)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select value={formData.unitOfMeasurement} onValueChange={(value) => handleInputChange('unitOfMeasurement', value)}>
                  <SelectTrigger className="w-full bg-white border-1 border-gray-300">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="minimumOrderQuantity">Minimum Order Quantity (MOQ)<span className='text-red-500'>*</span></Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The smallest quantity a buyer must purchase in a single order</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="minimumOrderQuantity"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.minimumOrderQuantity}
                  onChange={(e) => handleInputChange('minimumOrderQuantity', e.target.value)}
                  required
                  className="bg-white border-1 border-gray-300"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quantityAvailable">Quantity Available (Current Stock)<span className='text-red-500'>*</span></Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total amount of product you currently have in stock and ready to sell</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="quantityAvailable"
                  type="number"
                  placeholder="e.g., 2000"
                  value={formData.quantityAvailable}
                  onChange={(e) => handleInputChange('quantityAvailable', e.target.value)}
                  required
                  className={`bg-white border-1 ${quantityValidationError ? 'border-red-500' : 'border-gray-300'}`}
                />
                {quantityValidationError && (
                  <p className="text-sm text-red-500 mt-1">{quantityValidationError}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Pricing & Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Section B: Pricing & Terms
            </CardTitle>
            <CardDescription>
              Set your pricing and negotiation preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              {/* Allow Bidding Toggle */}
              <div className="space-y-4">
                <Label>Allow Bidding / Negotiation</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowBidding"
                    checked={formData.allowBidding}
                    onCheckedChange={(checked) => handleInputChange('allowBidding', checked)}
                    className="data-[state=checked]:bg-green-500 cursor-pointer"
                  />
                  <Label htmlFor="allowBidding" className="text-sm">
                    Enable if you want buyers to bid for your product
                  </Label>
                </div>
              </div>

              {/* Conditional Pricing Fields */}
              {!formData.allowBidding ? (
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section C: Additional Details & Media Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-600" />
              Section C: Additional Details & Media Upload
            </CardTitle>
            <CardDescription className="text-gray-600">
              Provide additional product details and upload images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="storageConditions" className="text-sm font-semibold text-gray-700">Storage Conditions</Label>
                <Input
                  id="storageConditions"
                  placeholder="e.g., Store in a cool, dry place"
                  value={formData.storageConditions}
                  onChange={(e) => handleInputChange('storageConditions', e.target.value)}
                  className="bg-white border-1 border-gray-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Expiry Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal bg-white border-1 border-gray-300"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiryDate ? format(formData.expiryDate, "PPP") : "Select expiry date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expiryDate}
                      onSelect={(date) => handleInputChange('expiryDate', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location of Crop / Pickup Point<span className='text-red-500'>*</span></Label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <Input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Enter location..."
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="bg-white border-1 border-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold text-gray-700">Product Images</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors bg-gray-50 shadow-sm">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="imageUpload" className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {isUploading ? 'Uploading...' : 'Upload Images'}
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        You can upload up to 3 images (JPG/PNG/WebP)
                      </span>
                    </Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploading || uploadedImages.length >= 3}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((uploadedImage, index) => (
                    <div key={index} className="relative border-2 border-gray-200 rounded-lg shadow-sm bg-white">
                      {uploadedImage.uploading ? (
                        <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                            <span className="text-sm text-gray-600">Uploading...</span>
                          </div>
                        </div>
                      ) : uploadedImage.error ? (
                        <div className="w-full h-32 flex items-center justify-center bg-red-50 rounded-lg border-red-200">
                          <div className="text-center">
                            <span className="text-sm text-red-600">Upload failed</span>
                            <p className="text-xs text-red-500 mt-1">{uploadedImage.error}</p>
                          </div>
                        </div>
                      ) : uploadedImage.url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={uploadedImage.url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={URL.createObjectURL(uploadedImage.file)}
                          alt={`Product ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
                        onClick={() => removeImage(index)}
                        disabled={uploadedImage.uploading}
                      >
                        ×
                      </Button>
                      {uploadedImage.url && (
                        <div className="absolute bottom-1 right-1">
                          <CheckCircle className="w-4 h-4 text-green-600 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section D: Shipping Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              Section D: Shipping Options
            </CardTitle>
            <CardDescription>
              Choose your preferred shipping method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Shipping Method<span className='text-red-500'>*</span></Label>
              <RadioGroup
                value={formData.shippingMethod}
                onValueChange={(value) => handleInputChange('shippingMethod', value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="direct" id="direct" />
                  <Label htmlFor="direct">Direct Shipping (Seller handles delivery)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="third-party" id="third-party" />
                  <Label htmlFor="third-party">Third-party Logistics (e.g., FedEx, DHL...)</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.shippingMethod === 'direct' && (
              <div className="space-y-2">
                <Label htmlFor="directShippingCost">Shipping Cost (RM) *</Label>
                <Input
                  id="directShippingCost"
                  type="number"
                  step="0.01"
                  placeholder="Enter your shipping cost"
                  value={formData.directShippingCost}
                  onChange={(e) => handleInputChange('directShippingCost', e.target.value)}
                  required
                  className="bg-white border-2 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 shadow-sm"
                />
              </div>
            )}

            {formData.shippingMethod === 'third-party' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label>Select Preferred Logistics Provider *</Label>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Shipping cost will be determined upon order confirmation from the buyer.</span>
                  </div>
                </div>

                {partnersLoading && (
                  <div className="text-sm text-gray-600">Loading logistics partners...</div>
                )}

                {!!partnersError && (
                  <div className="flex items-center gap-3 p-3 rounded-md bg-red-50 border border-red-200">
                    <span className="text-sm text-red-700">{partnersError}</span>
                    <Button type="button" size="sm" variant="outline" onClick={loadPartners}>
                      Retry
                    </Button>
                  </div>
                )}

                {!partnersLoading && !partnersError && partners.length === 0 && (
                  <div className="text-sm text-gray-600">No logistics partners available. Please try again later.</div>
                )}

                {!partnersLoading && !partnersError && partners.length > 0 && (
                  <RadioGroup
                    value={formData.logisticsPartnerId}
                    onValueChange={(value) => handleInputChange('logisticsPartnerId', value)}
                  >
                    {partners.map((provider) => (
                      <div key={provider.id} className="border rounded-lg p-4">
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
                            })()}
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
                          })()}
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" className="cursor-pointer">
            Save as Draft
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 cursor-pointer">
            Upload Product Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
