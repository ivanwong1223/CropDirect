"use client";

import React, { useState, useEffect, useRef } from 'react';
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
import { CalendarIcon, Upload, Info, MapPin, Package, DollarSign, Truck, Image as ImageIcon, HelpCircle } from 'lucide-react';
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
  
  // Section C: Additional Details & Media
  storageConditions: string;
  expiryDate: Date | undefined;
  location: string;
  productImages: File[];
  
  // Section D: Shipping Options
  shippingMethod: string;
  directShippingCost: string;
  selectedLogistics: string;
}

export default function AddProduct() {
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
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
    storageConditions: '',
    expiryDate: undefined,
    location: '',
    productImages: [],
    shippingMethod: '',
    directShippingCost: '',
    selectedLogistics: ''
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

  // Make handleInputChange strongly typed so that value matches the type of the selected field
  const handleInputChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle image upload
   * @param event - File input change event
   */
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + formData.productImages.length <= 3) {
      setFormData(prev => ({
        ...prev,
        productImages: [...prev.productImages, ...files]
      }));
    }
  };

  /**
   * Remove uploaded image
   * @param index - Index of image to remove
   */
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      if (!agribusinessData.success) {
        alert('Unable to find your agribusiness profile. Please contact support.');
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
        storageConditions: formData.storageConditions,
        expiryDate: formData.expiryDate?.toISOString(),
        location: formData.location,
        productImages: [], // TODO: Handle image upload
        shippingMethod: formData.shippingMethod,
        directShippingCost: formData.directShippingCost,
        selectedLogistics: formData.selectedLogistics
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
        alert('Product listing created successfully!');
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
          storageConditions: '',
          expiryDate: undefined,
          location: '',
          productImages: [],
          shippingMethod: '',
          directShippingCost: '',
          selectedLogistics: ''
        });
      } else {
        alert(`Error creating product: ${result.error}`);
      }

    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while creating the product listing. Please try again.');
    }
  };

  const cropCategories = ['Grains', 'Fruits', 'Vegetables', 'Legumes', 'Herbs & Spices', 'Nuts & Seeds'];
  const units = ['kg', 'ton', 'sack', 'crate', 'box', 'piece'];
  const currencies = ['RM', 'USD', 'SGD'];
  const locations = ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Kedah', 'Kelantan', 'Terengganu', 'Pahang', 'Negeri Sembilan', 'Melaka', 'Sabah', 'Sarawak'];
  
  const logisticsProviders = [
    { 
      name: 'FedEx', 
      deliveryTime: '1-3 business days', 
      rateMethod: 'Distance × Weight × RM 0.15/kg' 
    },
    { 
      name: 'DHL', 
      deliveryTime: '1-2 business days', 
      rateMethod: 'Distance × Weight × RM 0.18/kg' 
    },
    { 
      name: 'Pos Laju', 
      deliveryTime: '2-5 business days', 
      rateMethod: 'Distance × Weight × RM 0.12/kg' 
    },
    { 
      name: 'J&T Express', 
      deliveryTime: '2-4 business days', 
      rateMethod: 'Distance × Weight × RM 0.10/kg' 
    }
  ];

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
                <Select value={formData.cropCategory} onValueChange={(value) => handleInputChange('cropCategory', value)}>
                  <SelectTrigger className="w-full bg-white border-1 border-gray-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {cropCategories.map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  className="bg-white border-1 border-gray-300"
                />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="pricing">Pricing<span className='text-red-500'>*</span></Label>
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

              <div className="space-y-4">
                <Label>Allow Bidding / Negotiation</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowBidding"
                    checked={formData.allowBidding}
                    onCheckedChange={(checked) => handleInputChange('allowBidding', checked)}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <Label htmlFor="allowBidding" className="text-sm">
                    Enable if you want buyers to bid for your product
                  </Label>
                </div>
              </div>
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
              <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location of Crop / Pickup Point *</Label>
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
                    <Label htmlFor="imageUpload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Upload Images
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        You can upload up to 3 images (JPG/PNG)
                      </span>
                    </Label>
                    <Input
                      id="imageUpload"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              
              {formData.productImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                  {formData.productImages.map((file, index) => (
                    <div key={index} className="relative border-2 border-gray-200 rounded-lg shadow-sm bg-white">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 shadow-md"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
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
              <Label>Shipping Method *</Label>
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
                
                <RadioGroup
                  value={formData.selectedLogistics}
                  onValueChange={(value) => handleInputChange('selectedLogistics', value)}
                >
                  {logisticsProviders.map((provider) => (
                    <div key={provider.name} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={provider.name.toLowerCase()} id={provider.name.toLowerCase()} />
                        <Label htmlFor={provider.name.toLowerCase()} className="font-medium">
                          {provider.name}
                        </Label>
                      </div>
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Delivery: {provider.deliveryTime}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Rate: {provider.rateMethod}
                        </p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
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
