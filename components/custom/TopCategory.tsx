"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wheat,
  Apple,
  Coffee
} from "lucide-react";

interface CategoryCardProps {
  img: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

function CategoryCard({ img, title, desc, icon: Icon }: CategoryCardProps) {
  return (
    <Card className="relative grid min-h-[12rem] w-full overflow-hidden">
      <Image
        width={768}
        height={768}
        src={img}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 h-full w-full bg-black/70" />
      <CardContent className="relative flex flex-col justify-between p-4">
        <Icon className="h-8 w-8 text-white" />
        <div>
          <h5 className="mb-1 text-xl font-semibold text-white">
            {title}
          </h5>
          <p className="text-xs font-bold text-white opacity-50">
            {desc}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const CATEGORIES = [
  {
    img: "/top-purchased-grains.jpg",
    icon: Wheat,
    title: "Cereals", 
    desc: "Most Popular",
  },
  {
    img: "/top-purchased-fruit.jpg",
    icon: Apple,
    title: "Fresh Fruits",
    desc: "Seasonal Picks",
  },
  {
    img: "/top-purchased-coffee.jpg",
    icon: Coffee,
    title: "Specialty Coffee",
    desc: "Premium Quality",
  },
  {
    img: "/top-purchased-rice.jpg",
    icon: Wheat,
    title: "Rice Products",
    desc: "Premium Quality",
  },
];

export function TopCategory() {
  return (
    <section className="mt-15 container mx-auto px-8 pb-20 pt-20 lg:pt-0">
      <div className="mb-20 grid place-items-center text-center">
        <h2 className="my-3 text-3xl font-bold text-gray-900">
          Top Purchased Categories
        </h2>
        <p className="text-gray-500 lg:w-6/12 text-lg leading-relaxed">
          Discover our most popular agricultural categories and find the best 
          products from verified agribusinesses across different regions.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="relative grid h-full w-full place-items-center overflow-hidden text-center">
          <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
          <CardContent className="relative w-full p-8">
            <p className="text-xs font-bold text-white opacity-50">
              TRENDING NOW
            </p>
            <h4 className="mt-9 text-2xl font-bold text-white">
              Best Selling Products
            </h4>
            <p className="mt-4 mb-14 font-normal text-white opacity-50 tracking-wide">
              Explore our extensive collection of agricultural products, from fresh 
              produce to specialty items. Quality guaranteed from farm to your table.
            </p>
            <Button size="sm" variant="secondary" className="bg-white text-gray-900 cursor-pointer hover:bg-gray-100">
              Explore More
            </Button>
          </CardContent>
        </Card>
        <div className="col-span-1 flex flex-col gap-6">
          {CATEGORIES.slice(0, 2).map((props, key) => (
            <CategoryCard key={key} {...props} />
          ))}
        </div>
        <div className="col-span-1 flex flex-col gap-6">
          {CATEGORIES.slice(2, 4).map((props, key) => (
            <CategoryCard key={key} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopCategory;