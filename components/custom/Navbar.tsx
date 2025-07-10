'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MdLanguage } from 'react-icons/md';
import { FaAngleDown } from "react-icons/fa";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
              <button className="cursor-pointer bg-transparent border-[2px] border-yellow-400 text-white px-6 py-3 rounded-xl font-medium group overflow-hidden relative">
                <div className="relative overflow-hidden">
                  <p className="group-hover:-translate-y-7 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]">
                    Login
                  </p>
                  <p className="absolute top-7 left-0 group-hover:top-0 duration-[1.125s] ease-[cubic-bezier(0.19,1,0.22,1)]">
                    Login
                  </p>
                </div>
              </button>
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
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
