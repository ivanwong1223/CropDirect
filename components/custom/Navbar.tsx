'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdLanguage } from 'react-icons/md';
import { FaAngleDown } from "react-icons/fa";
import { Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
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


export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle login button click with smooth loading transition
  const handleLoginClick = async () => {
    setIsLoading(true);
    // Add a small delay for smooth transition effect
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      router.push('/sign-in');
    } catch (error) {
      console.error('Navigation error:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset loading state when component unmounts or navigation completes
  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(false);
    };

    // Reset loading state on route change
    return () => {
      setIsLoading(false);
    };
  }, []);

  return (
    <nav className={cn(
      'fixed top-0 z-50 w-full h-1/7 pt-4 transition-colors duration-700',
      scrolled ? 'bg-green-900' : 'bg-transparent'
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image 
                src="/cropdirect-logo(white-text).png" 
                alt="CropDirect Logo" 
                width={150} 
                height={40} 
                className="h-10 w-auto" 
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link href="/about" className="text-lg font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
              About Us
            </Link>
            <Link href="/market" className="text-lg font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
              Market
            </Link>
            <Link href="/services" className="text-lg font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
              Services
            </Link>
            <Link href="/solutions" className="text-lg font-semibold tracking-tight text-white hover:text-yellow-400 transition-colors">
              Solutions
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="hidden md:flex md:items-center">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-gray-700 hover:text-green-600 focus:outline-none">
                  <MdLanguage className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium text-white flex items-center gap-1">EN <FaAngleDown /></span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => { /* handle language change to English */ }}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { /* handle language change to Spanish */ }}>
                    Spanish
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { /* handle language change to French */ }}>
                    French
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center space-x-3">
              <button 
                onClick={handleLoginClick}
                disabled={isLoading}
                className="cursor-pointer bg-transparent border-[2px] border-yellow-400 text-white px-6 py-3 rounded-xl font-medium group overflow-hidden relative disabled:opacity-70 disabled:cursor-not-allowed transition-opacity duration-200"
              >
                <div className="relative overflow-hidden flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <p className="group-hover:-translate-y-7 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]">
                        Login
                      </p>
                      <p className="absolute top-7 left-0 group-hover:top-0 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]">
                        Login
                      </p>
                    </>
                  )}
                </div>
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="cursor-pointer bg-gradient-to-b from-yellow-400 to-yellow-500 shadow-[0px_4px_32px_0_rgba(250,204,21,.70)] px-6 py-3 rounded-xl border-[1px] border-yellow-500 text-black font-medium group">
                    <div className="relative overflow-hidden">
                      <p className="group-hover:-translate-y-7 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]">
                        Sign Up
                      </p>
                      <p className="absolute top-7 left-0 group-hover:top-0 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]">
                        Sign Up
                      </p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader className="text-center">
                    <AlertDialogCancel className="absolute right-4 top-4 opacity-70 ring-offset-white transition-opacity hover:opacity-100">
                      ✕
                    </AlertDialogCancel>
                    <AlertDialogTitle className="text-2xl font-semibold tracking-tight">
                      Choose Account Type
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base leading-6 text-gray-600 font-medium mt-2">
                      Please select below whether you would like to create a Buyer Account or a Seller Account
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex justify-center sm:justify-center gap-4">
                    <AlertDialogAction 
                      onClick={() => router.push('/sign-up/buyer')}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Buyer
                    </AlertDialogAction>
                    <AlertDialogAction 
                      onClick={() => router.push('/sign-up/seller')}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-2.5 rounded-lg transition-colors duration-200 cursor-pointer"
                    >
                      Seller
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
