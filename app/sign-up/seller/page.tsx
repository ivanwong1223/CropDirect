"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircleIcon, CheckCircle2Icon, PopcornIcon } from "lucide-react"

// Animation variants for fade-in effect
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Building, Hash, Briefcase, Leaf, MapPin, Globe } from "lucide-react";
import { getCountries, getStatesByCountry } from "@/lib/countries";

export default function SellerSignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    tradingType: "",
    primaryCrop: "",
    country: "",
    state: "",
    contactName: "",
    email: "",
    password: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableStates, setAvailableStates] = useState<Array<{code: string, name: string}>>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Get countries data
  const countries = getCountries();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError("");
  };

  
  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    if (error) setError("");
  };

  // Handle country selection and update available states
  const handleCountryChange = (countryCode: string) => {
    setFormData(prevState => ({
      ...prevState,
      country: countryCode,
      state: "" // Reset state when country changes
    }));
    
    // Update available states based on selected country
    const states = getStatesByCountry(countryCode);
    setAvailableStates(states);
    
    if (error) setError("");
  };

  const handleStateChange = (stateCode: string) => {
    setFormData(prevState => ({
      ...prevState,
      state: stateCode
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/createUser/seller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("the form that has submitted: ", formData);
      console.log("the response from the server: ", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess("Account created successfully! Redirecting to sign in...");      
      // Redirect to sign in page after 2 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <IconButton
          onResize={() => {}}
          onResizeCapture={() => {}}
          variant="text"
          color="blue-gray"
          size="lg"
          onClick={() => router.push("/")}
          className="rounded-full cursor-pointer"
          placeholder={null}
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
        >
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
      </div>

      {/* Main Content */}
      <motion.div
        className="max-w-6xl w-full bg-white shadow-lg rounded-xl flex overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Left Side - Image */}
        <div className="w-1/2 hidden md:flex items-center justify-center">
          <Image
            src="/Login_register.png"
            alt="CropDirect Logo"
            width={430}
            height={400}
            className="object-cover"
          />          
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {/* Header */}
          <div className="text-center mb-12">
            <Typography
              onResize={() => {}}
              onResizeCapture={() => {}}
              variant="h4"
              color="blue-gray"
              className="mb-2 font-bold"
              placeholder={null}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              Create a Seller Account
            </Typography>
            <Typography
              onResize={() => {}}
              onResizeCapture={() => {}}
              color="gray"
              className="font-normal text-gray-600"
              placeholder={null}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              Join our network of agricultural businesses.
            </Typography>
          </div>

          {/* Alert Messages - Fixed at top of screen */}
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Alert variant="destructive" className="mb-4 shadow-lg">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <Alert className="mb-4 border-green-500 text-green-700 bg-green-50 shadow-lg">
                  <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName"> <Building className="text-gray-400 h-5 w-5" />Business Name</Label>
                <div className="relative">
                  <Input id="businessName" name="businessName" placeholder="Your Company Ltd." onChange={handleChange} required className="pl-4" />
                </div>
              </div>

              {/* Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="contactName"><User className="text-gray-400 h-5 w-5" />Contact Name</Label>
                <div className="relative">
                    <Input id="contactName" name="contactName" placeholder="John Doe" onChange={handleChange} required className="pl-4" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trading Type */}
              <div className="space-y-2">
                <Label htmlFor="tradingType">Trading Type</Label>
                <Select name="tradingType" onValueChange={handleSelectChange('tradingType')}>
                  <SelectTrigger className="w-full">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <SelectValue placeholder="Select type" className="pl-10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Farmer">Farmer/Producer</SelectItem>
                    <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="Exporter">Exporter</SelectItem>
                    <SelectItem value="Processor">Processor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Primary Crop Category */}
              <div className="space-y-2">
                <Label htmlFor="primaryCrop">Primary Crop Category</Label>
                <Select name="primaryCrop" onValueChange={handleSelectChange('primaryCrop')}>
                  <SelectTrigger className="w-full">
                    <Leaf className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <SelectValue placeholder="Select category" className="pl-10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grains & Cereals">Grains & Cereals</SelectItem>
                    <SelectItem value="Wheats">Wheats</SelectItem>
                    <SelectItem value="Specialty Coffee">Specialty Coffee</SelectItem>
                    <SelectItem value="Fruits">Fruits</SelectItem>
                    <SelectItem value="Livestock">Livestock</SelectItem>
                    <SelectItem value="Fishery">Fishery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Country and State Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select name="country" onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-full">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <SelectValue placeholder="Select country" className="pl-10" />
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

              {/* State Selection */}
              <div className="space-y-2">
                <Label htmlFor="state">State/Region</Label>
                <Select 
                  name="state" 
                  onValueChange={handleStateChange}
                  disabled={!formData.country || availableStates.length === 0}
                >
                  <SelectTrigger className={`w-full ${!formData.country ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <SelectValue 
                      placeholder={!formData.country ? "Select country first" : "Select state"} 
                      className="pl-10" 
                    />
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

            {/* Email Address */}
            <div className="space-y-2 mt-6">
              <Label htmlFor="email"><Mail className="text-gray-400 h-5 w-5" />Email Address</Label>
              <div className="relative">
                <Input id="email" name="email" type="email" placeholder="your.email@company.com" onChange={handleChange} required className="pl-4" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password"><Lock className="text-gray-400 h-5 w-5" />Password</Label>
              <div className="relative">
                <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Create a strong password" onChange={handleChange} required className="pl-4 pr-10" />
                <button type="button" onClick={togglePasswordVisibility} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2 mt-12">
              <input type="checkbox" id="agreeTerms" name="agreeTerms" onChange={handleChange} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
              <Label htmlFor="agreeTerms" className="text-sm text-gray-600">
                I agree to the <Link href="/terms" className="text-green-700 hover:underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-green-700 hover:underline">Privacy Policy</Link>.
              </Label>
            </div>

            <Button type="submit" disabled={isLoading || !formData.agreeTerms} className="w-full h-12 bg-black hover:bg-white hover:text-black hover:border hover:border-black hover:cursor-pointer font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 cursor-pointer">
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-4 text-center">
            <Typography
              onResize={() => {}}
              onResizeCapture={() => {}}
              variant="small"
              className="text-gray-600"
              placeholder={null}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            >
              Already have an account?{" "}
              <Link href="/sign-in" className="text-green-700 font-medium hover:underline">
                Sign In
              </Link>
            </Typography>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
