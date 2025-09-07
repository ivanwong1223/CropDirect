"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { ArrowLeft, Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { setStoreData } from "@/lib/localStorage";
import { signIn } from 'next-auth/react'
import { FcGoogle } from 'react-icons/fc'
import { useSession } from 'next-auth/react'

// Animation variants for fade-in effect
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

// Narrow session.user to include our custom field
 type SessionUserWithOnboarding = {
   requiresOnboarding?: boolean
 } & (NonNullable<ReturnType<typeof useSession>>['data'] extends { user: infer U } ? NonNullable<U> : { name?: string | null; email?: string | null; image?: string | null })

 // Extend with fields exposed from NextAuth session callback for persisted storage
 type SessionUserExtended = SessionUserWithOnboarding & {
   id?: string | null
   role?: string | null
   email?: string | null
   isActive?: boolean | null
   createdAt?: string | null
   updatedAt?: string | null
   name?: string | null
 }

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);



  // Handle Google OAuth flow based on user existence
  // Show onboarding error only once immediately after explicit Google sign-in
  useEffect(() => {
    const initiated = typeof window !== 'undefined' ? localStorage.getItem('googleSignInInitiated') : null
    if (!initiated) return

    const user = session?.user as SessionUserWithOnboarding | undefined
    const needsOnboarding = Boolean(user?.requiresOnboarding)

    if (status === 'authenticated' && user) {
      if (needsOnboarding) {
        // User doesn't exist in database, show error message
        setError('This Google account is not registered. Please create an account first.')
        // Clear error message after 5 seconds
        setTimeout(() => {
          setError('')
        }, 5000)
      }
      // Clear the intent flag so reloading the page will NOT duplicate the message
      if (typeof window !== 'undefined') {
        localStorage.removeItem('googleSignInInitiated')
      }
    }
  }, [status, session]);

  // If user is already authenticated and does NOT require onboarding, persist to localStorage and redirect to dashboard
  // This ensures users who previously registered via Google skip the dialog and go straight to their page
  useEffect(() => {
    const user = session?.user as SessionUserExtended | undefined
    if (!user) return
    if (user.requiresOnboarding) return

    const { id, email, role, name, isActive, createdAt, updatedAt } = user
    // Only persist when we have sufficient data
    if (id && email && role) {
      setStoreData({
        id,
        email,
        name: name ?? '',
        role,
        isActive: isActive ?? true,
        createdAt: createdAt ?? new Date().toISOString(),
        updatedAt: updatedAt ?? new Date().toISOString(),
      })

      switch (role) {
        case 'AGRIBUSINESS':
          router.push('/seller/dashboard')
          break
        case 'BUSINESS_BUYER':
          router.push('/buyer/dashboard')
          break
        case 'LOGISTICS_PARTNER':
          router.push('/logistics/dashboard')
          break
        case 'ADMIN':
          router.push('/admin/dashboard')
          break
        default:
          router.push('/')
          break
      }
    }
  }, [session?.user, router])

  // Handle form submission for user login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Store user data in localStorage
      setStoreData(data.user);
      setSuccess("Login successful! Redirecting...");

      // Route based on user role
      setTimeout(() => {
        switch (data.user.role) {
          case "AGRIBUSINESS":
            router.push("/seller/dashboard");
            break;
          case "BUSINESS_BUYER":
            router.push("/buyer/dashboard");
            break;
          case "LOGISTICS_PARTNER":
            router.push("/logistics/dashboard");
            break;
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          default:
            router.push("/");
            break;
        }
      }, 1500);

    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      setError("") // Clear any previous errors

      // Mark that user explicitly initiated Google sign-in from this page
      if (typeof window !== 'undefined') {
        localStorage.setItem('googleSignInInitiated', '1')
      }
      
      // Sign in with Google without oauth parameter initially
      // The useEffect will handle the flow based on whether user exists
      const result = await signIn('google', { 
        callbackUrl: '/sign-in',
        redirect: false // Don't redirect immediately, let us handle the flow
      })
      
      // If sign-in was successful, the session will be updated
      // We'll let the useEffect handle the rest of the flow
      if (result?.error) {
        setError('Failed to connect to Google. Please try again.')
        if (typeof window !== 'undefined') {
          localStorage.removeItem('googleSignInInitiated')
        }
        return
      }

      // When redirect:false is used with an OAuth provider, a redirect URL is returned
      if (result?.url) {
        window.location.href = result.url as string
        return
      }
    } catch (e) {
      setError('Failed to start Google sign-in. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  };
  return (<div className="min-h-screen bg-[#F5F1E9] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <IconButton
          variant="text"
          color="blue-gray"
          size="lg"
          onClick={() => router.push("/")}
          className="rounded-full cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </IconButton>
      </div>

      {/* Main Content */}
      <motion.div
        className="max-w-4xl w-full bg-white shadow-lg rounded-xl flex overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Left Side - Image */}
        <div className="w-1/2 hidden md:block mt-12">
          <Image
            src="/cropdirect_loginlogo.png"
            alt="CropDirect Logo"
            width={700}
            height={700}
            className="object-cover w-full h-[500px]"
          />          
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Typography
              variant="h4"
              color="blue-gray"
              className="mb-2 font-bold"
            >
              Get Started Now
            </Typography>
            <Typography
              color="gray"
              className="font-normal text-gray-600"
            >
              Sign in to connect with agricultural opportunities
            </Typography>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="border-red-200 bg-red-50 shadow-lg">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800 font-semibold">Error</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="border-green-200 bg-green-50 shadow-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800 font-semibold">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              </motion.div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="relative">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="absolute right-0 mt-2 text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-black hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-8 bg-black hover:bg-white hover:text-black hover:border hover:border-black hover:cursor-pointer text-white font-medium rounded-lg transition-colors duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative px-4 text-sm text-gray-500 bg-white">
                Or
              </div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              variant="outline"
              className="cursor-pointer w-full h-12 border-gray-300 bg-white text-gray-800 hover:bg-gray-100 flex items-center justify-center gap-3 rounded-lg disabled:opacity-70"
            >
              <FcGoogle className="h-5 w-5" />
              {googleLoading ? 'Connecting to Google…' : 'Sign in with Google'}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <Typography
              variant="small"
              className="text-gray-600"
            >
              Dont have an account?{" "}
              <AlertDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <AlertDialogTrigger asChild>
                  <span
                    className="text-[rgb(14,34,7)] font-medium hover:underline cursor-pointer"
                    onClick={() => setRoleDialogOpen(true)}
                  >
                    Create your account
                  </span>
                </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-md">
                                <AlertDialogHeader className="text-center">
                                  <AlertDialogCancel className="absolute right-4 top-4 opacity-70 ring-offset-white transition-opacity hover:opacity-100">
                                    ✕
                                  </AlertDialogCancel>
                                  <AlertDialogTitle className="text-2xl font-semibold text-center">
                                    Choose Account Type
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-xl text-center leading-8 text-gray-600 font-medium mt-4 mb-2">
                                    Please select below whether you would like to create a Seller Account or a Buyer Account
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex justify-center sm:justify-center gap-4">
                                  <AlertDialogAction 
                                    onClick={() => router.push('/sign-up/seller')}
                                    className="bg-green-700 border-green-700 border-1 hover:border-1 hover:bg-white hover:border-green-700 hover:text-green-800 text-white font-bold tracking-wider text-md px-10 py-5.5 rounded-lg transition-colors duration-200 cursor-pointer"
                                  >
                                    Seller
                                  </AlertDialogAction>
                                  <AlertDialogAction 
                                    onClick={() => router.push('/sign-up/buyer')}
                                    className="bg-green-700 border-green-700 border-1 hover-border-1 hover:bg-white hover:border-green-700 hover:text-green-800 text-white font-bold tracking-wider text-md px-10 py-5.5 rounded-lg transition-colors duration-200 cursor-pointer"
                                  >
                                    Buyer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </Typography>
                        </div>
                        {/* Logistics Provider Section */}
                          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                            <Typography
                              onResize={() => {}}
                              onResizeCapture={() => {}}
                              variant="small"
                              className="text-gray-600 mb-2 tracking-wide"
                              placeholder={null}
                              onPointerEnterCapture={undefined}
                              onPointerLeaveCapture={undefined}
                            >
                              Interested in joining our logistics network?
                            </Typography>
                            <Link
                              href="/sign-up/logistics"
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                            >
                              Become a Logistics Partner
                            </Link>
                          </div>
                        </div>
                      </motion.div>
    </div>
  );
}
