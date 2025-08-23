"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CircleUser,
  Building,
  Mail,
  MapPin,
  Globe,
  Briefcase,
  Leaf,
  Camera,
  Save,
  CreditCard,
  Crown,
  Calendar,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Key,
  Facebook,
  Instagram,
  ExternalLink,
  SquarePlus,
  History
} from "lucide-react";
import { getCountries, getStatesByCountry } from "@/lib/countries";
import { getUserData } from "@/lib/localStorage";
import ProfilePictureSection from "@/components/custom/ProfilePictureSection";
import KYBStatusCard from "@/components/custom/KYBStatusCard";
import NotificationContainer from "@/components/custom/NotificationContainer";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

interface UserProfile {
  id: string;
  businessName: string;
  tradingType: string;
  primaryCropCategory: string;
  country: string;
  state: string;
  kybStatus: string;
  subscriptionTier: string;
  isKybVerified: boolean;
  bio?: string;
  businessImage?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  subscription?: {
    tier: string;
    billingCycle: string;
    status: string;
    nextBillingDate?: string;
    billingHistory: Array<{
      tier: string;
      paidAt: string;
      amount: number;
      createdAt: string;
      billingCycle: string;
    }>;
  };
}

export default function Profile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [availableStates, setAvailableStates] = useState<Array<{code: string, name: string}>>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [notifications, setNotifications] = useState<React.ReactNode[]>([]);

  // Form data state
  const [formData, setFormData] = useState({
    businessName: "",
    name: "",
    email: "",
    tradingType: "",
    primaryCropCategory: "",
    country: "",
    state: "",
    bio: "",
    businessImage: "",
    facebookUrl: "",
    instagramUrl: "",
    websiteUrl: "",
    contactNo: ""
  });

  // Monitor formData changes
  useEffect(() => {
    console.log("formData updated:", formData);
    console.log("tradingType in formData:", formData.tradingType);
    console.log("primaryCropCategory in formData:", formData.primaryCropCategory);
  }, [formData]);

  // Debug render
  console.log("Rendering with formData:", formData);

  const countries = getCountries();
  const tradingTypes = ["Wholesaler", "Retailer", "Distributor", "Producer", "Exporter", "Importer"];
  const cropCategories = ["Fruits", "Vegetables", "Grains", "Legumes", "Herbs & Spices", "Nuts & Seeds"];

  // Check for KYB success notification
  useEffect(() => {
    const kybSuccess = searchParams.get('kybSuccess');
    if (kybSuccess === 'true') {
      setNotifications((prev) => {
        // Check if notification already exists to prevent duplicates
        const existingNotification = prev.find(n => 
          n && typeof n === 'object' && 'key' in n && 
          typeof n.key === 'string' && n.key.startsWith('kyb-success-')
        );
        
        if (existingNotification) {
          return prev; // Don't add duplicate
        }
        
        return [
          <div 
            key={`kyb-success-${Date.now()}`} 
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
              <div className="text-sm font-medium">KYB Form Submitted Successfully!</div>
              <div className="text-xs text-gray-600">Your application is now pending review.</div>
            </div>
          </div>,
          ...prev,
        ];
      });
      
      // Clean up URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('kybSuccess');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get userId from localStorage using the proper function
        const userData = getUserData();
        if (!userData) {
          router.push('/sign-in');
          return;
        }
        const userId = userData.id;
        console.log("the userId is: ", userId);
        
        const response = await fetch(`/api/user/agribusiness?userId=${userId}`);
        const data = await response.json();
        console.log("the fetched data is: ",data);

        if (data.success) {
          setProfile(data.data);
          console.log("Setting profile data:", data.data);
          console.log("Trading Type from API:", data.data.tradingType);
          console.log("Primary Crop Category from API:", data.data.primaryCropCategory);
          
          const formDataToSet = {
            businessName: data.data.businessName || "",
            name: data.data.user.name || "",
            email: data.data.user.email || "",
            tradingType: data.data.tradingType || "",
            primaryCropCategory: data.data.primaryCropCategory || "",
            country: data.data.country || "",
            state: data.data.state || "",
            bio: data.data.bio || "",
            businessImage: data.data.businessImage || "",
            facebookUrl: data.data.facebookUrl || "",
            instagramUrl: data.data.instagramUrl || "",
            websiteUrl: data.data.websiteUrl || "",
            contactNo: data.data.contactNo || ""
          };
          
          console.log("Setting form data:", formDataToSet);
          console.log("tradingType in formData:", formDataToSet.tradingType);
          console.log("primaryCropCategory in formData:", formDataToSet.primaryCropCategory);
          setFormData(formDataToSet);
          
          // Set available states based on country
          if (data.data.country) {
            const states = getStatesByCountry(data.data.country);
            setAvailableStates(states);
          }
          
          if (data.data.businessImage) {
            setImagePreview(data.data.businessImage);
          }
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // Handle select changes
  const handleSelectChange = (name: string) => (value: string) => {
    console.log(`Select change - ${name}:`, value);
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      console.log("updated formData:", updated);
      return updated;
    });
    
    if (error) setError("");
    
    // Update states when country changes
    if (name === 'country') {
      const states = getStatesByCountry(value);
      setAvailableStates(states);
      setFormData(prev => ({ ...prev, state: "" })); // Reset state
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData(prev => ({ ...prev, businessImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Create API endpoint for updating profile (you'll need to implement this)
      const response = await fetch('/api/user/agribusiness/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: profile?.user.id,
          ...formData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Profile updated successfully!");
        // Refresh profile data
        window.location.reload();
      } else {
        setError(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Get KYB status display
  const getKybStatusDisplay = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', text: 'Verified' };
      case 'PENDING':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Pending' };
      case 'REJECTED':
        return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', text: 'Rejected' };
      case 'REQUIRES_RESUBMISSION':
        return { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', text: 'Resubmission Required' };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', text: 'Not Submitted' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const kybStatus = profile ? getKybStatusDisplay(profile.kybStatus) : null;

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8 relative">
      <NotificationContainer notifications={notifications} />
      <div className="max-w-6xl mt-6">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 font-normal">
            Manage your business profile and subscription
          </p>
        </motion.div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Management Section */}
          <motion.div
            className="lg:col-span-2"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <CircleUser className="h-6 w-6 " />
                <h2 className="text-xl font-semibold text-gray-900">
                  Profile Information
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Section - Using Custom Component */}
                <ProfilePictureSection
                  businessName={formData.businessName}
                  businessImage={formData.businessImage}
                  onImageUpload={handleImageUpload}
                  imagePreview={imagePreview}
                />

                <Separator />

                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Business Name
                    </Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      placeholder="Enter business name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <CircleUser className="h-4 w-4" />
                      Contact Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter contact name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNo" className="flex items-center gap-2">
                      <CircleUser className="h-4 w-4" />
                      Contact Number
                    </Label>
                    <Input
                      id="contactNo"
                      name="contactNo"
                      type="tel"
                      value={formData.contactNo}
                      onChange={handleInputChange}
                      placeholder="Enter contact number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tradingType" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Trading Type
                    </Label>
                    <Select 
                      defaultValue={formData.tradingType || ""} 
                      onValueChange={handleSelectChange('tradingType')}
                    >
                      <SelectTrigger className="w-[250px]" id="tradingType">
                        <SelectValue placeholder="Select trading type">
                          {formData.tradingType || ""}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {tradingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryCropCategory" className="flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      Primary Crop Category
                    </Label>
                    <Select 
                      value={formData.primaryCropCategory || ""} 
                      onValueChange={handleSelectChange('primaryCropCategory')}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select crop category">
                          {formData.primaryCropCategory || "Select crop category"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {cropCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Country
                    </Label>
                    <Select 
                      value={formData.country || ""} 
                      onValueChange={handleSelectChange('country')}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select country">
                          {formData.country ? countries.find(c => c.code === formData.country)?.name || formData.country : "Select country"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      State/Province
                    </Label>
                    <Select 
                      value={formData.state || ""} 
                      onValueChange={handleSelectChange('state')}
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Select state">
                          {formData.state ? availableStates.find(s => s.code === formData.state)?.name || formData.state : "Select state"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Business Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about your business..."
                    rows={4}
                  />
                </div>

                <Separator />

                {/* Social Media Links Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Social Media Links
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
                          <path fill="#039be5" d="M24 5A19 19 0 1 0 24 43A19 19 0 1 0 24 5Z"></path>
                          <path fill="#fff" d="M26.572,29.036h4.917l0.772-4.995h-5.69v-2.73c0-2.075,0.678-3.915,2.619-3.915h3.119v-4.359c-0.548-0.074-1.707-0.236-3.897-0.236c-4.573,0-7.254,2.415-7.254,7.917v3.323h-4.701v4.995h4.701v13.729C22.089,42.905,23.032,43,24,43c0.875,0,1.729-0.08,2.572-0.194V29.036z"></path>
                        </svg>
                        Facebook URL
                      </Label>
                      <Input
                        id="facebookUrl"
                        name="facebookUrl"
                        type="url"
                        value={formData.facebookUrl}
                        onChange={handleInputChange}
                        placeholder="https://facebook.com/yourbusiness"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-pink-600" />
                        Instagram URL
                      </Label>
                      <Input
                        id="instagramUrl"
                        name="instagramUrl"
                        type="url"
                        value={formData.instagramUrl}
                        onChange={handleInputChange}
                        placeholder="https://instagram.com/yourbusiness"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="websiteUrl" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        Website URL
                      </Label>
                      <Input
                        id="websiteUrl"
                        name="websiteUrl"
                        type="url"
                        value={formData.websiteUrl}
                        onChange={handleInputChange}
                        placeholder="https://yourbusiness.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      // Navigate to change password page
                      router.push('/seller/change-password');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="h-4 w-4" />
                    Change Password
                  </Button>
                  
                  <div className="flex-1" />
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#032320] text-white px-8 py-2 flex items-center gap-2 cursor-pointer"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>

          {/* Subscription & Status Section */}
          <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            {/* KYB Status Card - Using Custom Component */}
            {profile && (
              <KYBStatusCard
                kybStatus={profile.kybStatus}
                isKybVerified={profile.isKybVerified}
              />
            )}

            {/* Enhanced Subscription Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-yellow-600" />
                  <CardTitle className="text-lg font-semibold">
                    Subscription Plan
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Current Plan
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {profile?.subscription?.tier || 'FREE'}
                      </p>
                      {(profile?.subscription?.tier === 'FREE' || !profile?.subscription?.tier) && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          Basic
                        </span>
                      )}
                      {profile?.subscription?.tier === 'STANDARD' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                          Pro
                        </span>
                      )}
                      {profile?.subscription?.tier === 'ELITE' && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                          Elite
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Status
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      {profile?.subscription?.status || 'Active'}
                    </p>
                  </div> */}

                  {(profile?.subscription?.tier === 'FREE' || !profile?.subscription?.tier) ? (
                    <>
                      <Separator />
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 mb-6 tracking-wide">
                          Upgrade to unlock premium features like social media advertise, priority support, and unlimited product listings.
                        </p>
                        <Button
                          onClick={() => router.push('/seller/my-subscription')}
                          className="w-full cursor-pointer bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white flex items-center justify-center gap-2"
                        >
                          <SquarePlus className="h-4 w-4" />
                          Manage Subscription
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Billing Cycle
                        </p>
                        <p className="text-sm text-gray-900">
                          Billed {profile?.subscription?.billingCycle?.toLowerCase() || 'monthly'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Next Billing Date
                        </p>
                        <p className="text-sm text-gray-900">
                          {profile?.subscription?.nextBillingDate 
                            ? new Date(profile.subscription.nextBillingDate).toLocaleDateString()
                            : 'Jan 15, 2025'
                          }
                        </p>
                      </div>

                      <Separator />

                      {/* Billing History Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <History className="h-4 w-4 text-gray-500" />
                          <h4 className="text-sm font-semibold text-gray-900">Recent Billing History</h4>
                        </div>
                        
                        {profile?.subscription?.billingHistory && profile.subscription.billingHistory.length > 0 ? (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {profile.subscription.billingHistory.slice(0, 3).map((bill, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div>
                                  <p className="text-xs font-medium text-gray-900">
                                    {bill.tier} Plan
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(bill.paidAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <p className="text-xs font-semibold text-gray-900">
                                  RM {bill.amount}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 text-center py-2">
                            No billing history available
                          </p>
                        )}
                      </div>

                      <Separator />

                      {/* <Button
                        onClick={() => router.push('/seller/billing-history')}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <History className="h-4 w-4" />
                        View Full Billing History
                      </Button> */}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
