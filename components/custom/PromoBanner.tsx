"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WordRotate } from "@/components/magicui/word-rotate";

export function PromoBanner() {
  const pathname = usePathname();
  const isMainPage = pathname === '/';
  
  const rotatingTitles = [
    "Easy Shopping, Quick Delivery",
    "Earn rewards with every trade!",
    "Fresh Products, Direct from Farm",
    "Build lasting partnerships"
  ];
  
  const rotatingDescriptions = [
    "No need to stress about shopping for agricultural products. Order online and have your crops delivered straight to your doorstep for free.",
    "Join now and enjoy loyalty rewards on your purchases. Build lasting partnerships with verified agribusinesses.",
    "Get the freshest agricultural products directly from trusted farmers and suppliers in your area with no hesitation.",
    "Connect with our verified agribusinesses and create long-term trading relationships that benefit everyone."
  ];

  return (
    <div>
      <section className="container mx-auto !rounded-lg bg-[url('/Background.png')] bg-center py-8 lg:px-16">
        <div className="!relative flex grid-cols-1 flex-col-reverse gap-6 px-10 py-14 md:grid md:grid-cols-5 md:gap-14 md:py-20">
          <div className="col-span-3 flex flex-col items-start justify-center">
            <div className="mb-5 text-xl font-normal text-white leading-relaxed">
              <WordRotate
                words={rotatingTitles}
                duration={2500}
                className="text-xl font-bold text-white mb-2"
              />
              <br />
              <WordRotate
                words={rotatingDescriptions}
                duration={2500}
                className="text-lg font-normal text-white/90"
              />
            </div>
            {isMainPage ? (
              <button 
                onClick={() => window.location.href = '/sign-in'}
                className="relative flex items-center gap-1 bg-yellow-400 px-9 py-3 border-2 border-transparent space-x-2 text-base rounded-lg font-bold text-black cursor-pointer overflow-hidden transition-all duration-600 ease-custom hover:bg-yellow-400 hover:text-black group"
              >
                <svg viewBox="0 0 24 24" className="absolute w-6 fill-white z-[9] transition-all duration-700 ease-custom -left-1/4 group-hover:left-4 group-hover:fill-black" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
                <span className="relative z-[1] transition-all duration-700 ease-custom -translate-x-3 group-hover:translate-x-3">
                  Get Started
                </span>
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-yellow-400 rounded-full opacity-0 transition-all duration-700 ease-custom group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100"></span>
                <svg viewBox="0 0 24 24" className="absolute w-6 fill-black z-[9] transition-all duration-700 ease-custom right-4 group-hover:-right-1/4 group-hover:fill-yellow-400" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z"></path>
                </svg>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <span className="font-medium uppercase text-white text-sm">
                  Trusted Partners
                </span>
              </div>
            )}
          </div>
          <div className="col-span-2 flex w-full shrink-0 md:!justify-end">
            <Image
              width={768}
              height={768}
              src="/cropdirect-logo(white-text).png"
              alt="promotional image"
              className="h-full w-2/4 object-contain md:!w-2/3"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default PromoBanner;