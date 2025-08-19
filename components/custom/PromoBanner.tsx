"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { WordRotate } from "@/components/magicui/word-rotate";

export function PromoBanner() {
  const rotatingTitles = [
    "Easy Shopping, Quick Delivery",
    "Earn rewards with every trade!",
    "Fresh Products, Direct from Farm",
    "Build lasting partnerships"
  ];
  
  const rotatingDescriptions = [
    "No need to stress about shopping for agricultural products. Order online and have your crops delivered straight to your doorstep for free.",
    "Join now and enjoy loyalty rewards on your purchases. Build lasting partnerships with verified agribusinesses.",
    "Get the freshest agricultural products directly from trusted farmers and suppliers in your area.",
    "Connect with verified agribusinesses and create long-term trading relationships that benefit everyone."
  ];

  return (
    <div className="px-8 py-20">
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
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              <span className="font-medium uppercase text-white text-sm">
                Trusted Partners
              </span>
            </div>
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