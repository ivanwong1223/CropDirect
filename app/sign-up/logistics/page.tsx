"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Typography, IconButton } from "@material-tailwind/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, Building, User2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { useSession, signIn } from "next-auth/react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function BuyerSignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleGoogleConnect = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      await signIn("google", { redirect: false, callbackUrl: "/sign-up/logistics?oauth=1" });
    } catch (e) {
      setError("Failed to connect to Google. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    const cameFromGoogle = searchParams?.get('oauth') === '1';
    const user = session?.user as { email?: string; requiresOnboarding?: boolean } | undefined;
    const needsOnboarding = Boolean(user?.requiresOnboarding);

    if (cameFromGoogle) {
      if (needsOnboarding) {
        setIsGoogleConnected(true);
        if (user?.email) {
          setFormData(prev => ({ ...prev, email: user.email }));
        }
        router.replace('/sign-up/logistics');
      } else if (user) {
        setError('This Google account is already registered. Please sign in.');
        router.replace('/sign-in');
      }
    }
  }, [session?.user, searchParams, router]);

  const togglePasswordVisibility = () => setShowPassword((p) => !p);

  // Handle form submission to create logistics partner account.
  // If Google is connected, omit the password field from the payload.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const { ...submitData } = formData;
      
      const response = await fetch("/api/createUser/logistic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isGoogleConnected
            ? (() => {
                const { password, ...rest } = submitData as typeof formData;
                return { ...rest, oauthOnboarding: true };
              })()
            : { ...submitData }
        ),
      });
      const data = await response.json();
      console.log("This is the data: ", data);
      console.log("The formdata submitted is: ", formData);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess("Account created successfully! Redirecting to sign in...");
      setTimeout(() => router.push("/sign-in"), 2000);
    } catch (err) {
      console.error("Logistics registration error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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

      <motion.div
        className="max-w-6xl w-full bg-white shadow-lg rounded-xl flex overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="w-1/2 hidden md:flex items-center justify-center">
          <Image src="/logistic-register.png" alt="CropDirect Logo" width={650} height={650} className="object-cover" />
        </div>

        <div className="w-full md:w-1/2 p-8 overflow-y-auto" style={{ maxHeight: "calc(100vh - 4rem)" }}>
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
              Register as a Logistics Partner Account
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
              Access trusted logistics partners across the globe.
            </Typography>
          </div>

          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Alert variant="destructive" className="mb-4 shadow-lg">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }} transition={{ duration: 0.3, ease: "easeOut" }}>
                <Alert className="mb-4 border-green-500 text-green-700 bg-green-50 shadow-lg">
                  <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-700">Success</AlertTitle>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Google Connect */}
            <div className="space-y-2">
              <Button type="button" onClick={handleGoogleConnect} disabled={googleLoading} className="w-full h-12 bg-white text-black border hover:bg-black hover:text-white">
                {googleLoading ? 'Connecting to Google…' : 'Sign in with Google'}
              </Button>
              {isGoogleConnected && (
                <p className="text-sm text-green-700">Google connected. You can edit your email below. Password not required.</p>
              )}
            </div>

            {/* Contact Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User2 className="text-gray-400 h-5 w-5" />
                Contact Name<span className='text-red-500'>*</span>
              </Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="Jane Doe" 
                onChange={handleChange} 
                required 
                className="pl-4" 
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="text-gray-400 h-5 w-5" />
                Email Address<span className='text-red-500'>*</span>
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="logistics@company.com" 
                onChange={handleChange} 
                required 
                className="pl-4" 
                value={formData.email}
                disabled={isGoogleConnected}
              />
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="flex items-center gap-2">
                <Building className="text-gray-400 h-5 w-5" />
                Company Name<span className='text-red-500'>*</span>
              </Label>
              <Input 
                id="companyName" 
                name="companyName" 
                placeholder="Acme Trading Ltd." 
                onChange={handleChange} 
                className="pl-4"
                required
              />
            </div>

            {/* Password */}
            {!isGoogleConnected && (
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="text-gray-400 h-5 w-5" />
                Password<span className='text-red-500'>*</span>
              </Label>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a strong password" 
                  onChange={handleChange} 
                  required 
                  className="pl-4 pr-10" 
                />
                <button 
                  type="button" 
                  onClick={togglePasswordVisibility} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-black hover:bg-white hover:text-black hover:border hover:border-black hover:cursor-pointer font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 cursor-pointer">
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