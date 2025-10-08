"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { Chip } from 'primereact/chip';
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button"
import SearchField from '@/components/custom/SearchField';
import { mockCategories } from '@/lib/mockData';
import { ArrowRightIcon } from "@radix-ui/react-icons";
import TopCategory from '@/components/custom/TopCategory';
import PromoBanner from '@/components/custom/PromoBanner';
 
import { cn } from "@/lib/utils";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

// Types inferred from API responses
interface AgribusinessInfo {
  businessName: string;
  state?: string | null;
  country?: string | null;
}

interface Product {
  id: string;
  productTitle: string;
  cropCategory: string;
  description?: string | null;
  unitOfMeasurement: string;
  minimumOrderQuantity: number;
  quantityAvailable: number;
  pricing: number;
  currency: string;
  allowBidding: boolean;
  storageConditions?: string | null;
  location: string;
  productImages: string[];
  agribusiness: AgribusinessInfo;
}

interface NewsArticle {
  author?: string | null;
  title: string;
  description?: string | null;
  url: string;
  source?: string | null;
  image?: string | null;
  category?: string | null;
  published_at?: string | null;
}

export default function BuyerDashboard() {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [news, setNews] = useState<NewsArticle[] | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);

  // Function to map dashboard category display names to database crop categories
  const getCategoryMapping = (displayCategory: string): string => {
    const categoryMap: { [key: string]: string } = {
      '🥬Vegetables': 'Vegetables',
      '🌾Grains': 'grains, rice',
      '🍎Fruits': 'fruits',
      '☕Specialty Coffee': 'specialty coffee',
      '🥜Nuts & Seeds': 'Nuts & Seeds',
      '🌾Barley': 'barley',
      '🌽Cereals': 'corn, cereals'
    };
    return categoryMap[displayCategory] || displayCategory.replace(/^[^\w]+/, ''); // Remove emoji if no mapping found
  };
  
  // Function to handle category navigation
  const handleCategoryClick = (category: string) => {
    const mappedCategory = getCategoryMapping(category);
    const encodedCategory = encodeURIComponent(mappedCategory);
    window.location.href = `/buyer/marketplace/market-lists?category=${encodedCategory}`;
  };

  // Fetch latest active products
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch('/api/products?status=ACTIVE', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.success) {
          setProducts(json.data as Product[]);
        }
      } catch (e) {
        console.error('Failed to load products', e);
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Fetch news feed (agriculture)
  // useEffect(() => {
  //   let cancelled = false;
  //   (async () => {
  //     try {
  //       setLoadingNews(true);
  //       const res = await fetch('/api/newsFeed?category=all', { cache: 'no-store' });
  //       const json = await res.json();
  //       if (!cancelled && json?.data) {
  //         setNews(json.data.slice(0, 6) as NewsArticle[]);
  //       }
  //     } catch (e) {
  //       console.error('Failed to load news', e);
  //     } finally {
  //       if (!cancelled) setLoadingNews(false);
  //     }
  //   })();
  //   return () => { cancelled = true; };
  // }, []);

  const featuredProducts = useMemo(() => (products || []).slice(0, 8), [products]);
  const topCategories = useMemo(() => mockCategories.slice(0, 6), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero / Banner */}
      <section
        className="relative max-h-[73vh] px-8 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(6,78,59,0.95) 0%, rgba(6,78,59,0.6) 40%, rgba(6,78,59,0.2) 70%, rgba(6,78,59,0) 100%), url('/buyer-homepage.jpg')",
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div className="text-white">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Sourcing fresh produce, simplified</h1>
              <p className="mt-8 max-w-xl text-white/90 tracking-wide">
                Discover verified agribusinesses, compare offers, and place orders directly. Browse by category, search specific crops, and track orders — all in one place.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <SearchField />
                <Link href="/buyer/marketplace/market-lists">
                  <InteractiveHoverButton className="text-black">Marketplace</InteractiveHoverButton>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                {['🥬Vegetables', '🌾Grains', '🍎Fruits', '☕Specialty Coffee', '🥜Nuts & Seeds', '🌾Barley', '🌽Cereals'].map((category) => (
                  <div
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "group rounded-full border border-black/5 bg-neutral-100 text-sm text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800",
                    )}
                  >
                    <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                      <span>{category}</span>
                      <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                    </AnimatedShinyText>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Categories Overview */}
        <section className="py-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Browse by Category</h2>
            <Link href="/buyer/marketplace" className="text-emerald-700 hover:underline">View all</Link>
          </div>
          <div className="mt-4 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {topCategories.map((cat) => (
              <Link key={cat.id} href={`/buyer/marketplace?category=${encodeURIComponent(cat.id)}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <div className="p-2 text-center">
                    <div className="text-2xl">{cat.icon}</div>
                    <div className="mt-2 text-sm font-medium">{cat.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{cat.subcategories.length} subcategories</div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        {/* Top Purchased Categories */}
        <TopCategory />
        {/* Product Highlights */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">🌾 Product Highlights</h2>
              <div className="w-16 h-1 bg-emerald-500 rounded-full"></div>
            </div>
            <Link href="/buyer/marketplace" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200">
              Explore marketplace →
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <Skeleton height="12rem" className="w-full" />
                  <div className="p-4">
                    <Skeleton width="80%" className="mb-2" />
                    <Skeleton width="60%" className="mb-2" />
                    <Skeleton width="40%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredProducts.map((p) => (
                <div key={p.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="relative h-48 w-full bg-gray-50">
                    <Image
                      src={p.productImages?.[0] || '/placeholder.png'}
                      alt={p.productTitle}
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                        {p.cropCategory}
                      </span>
                    </div>
                    {p.allowBidding && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Bidding
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{p.productTitle}</h3>
                    <p className="text-sm text-gray-600 mb-3">{p.agribusiness?.businessName}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-lg font-bold text-emerald-600">
                        From {p.currency} {Number(p.pricing).toFixed(2)}/{p.unitOfMeasurement}
                      </div>
                    </div>
                    <Link href={`/buyer/marketplace?productId=${p.id}`} className="w-full">
                      <button className="w-full cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200">
                        View Order
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
              {featuredProducts.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">🌱</div>
                  <p className="text-lg">No products available yet.</p>
                </div>
              )}
            </div>
          )}
        </section>
        {/* Promo Banner */}
        <div className='px-2 py-20'>
          <PromoBanner />
        </div>

        {/* News Feed Highlights */}
        {/* <section className="py-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Agriculture News</h2>
            <Link href="/buyer/news-feed" className="text-emerald-700 hover:underline">See all</Link>
          </div>

          {loadingNews ? (
            <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx}>
                  <Skeleton height="10rem" className="w-full" />
                  <div className="p-3">
                    <Skeleton width="80%" className="mb-2" />
                    <Skeleton width="60%" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-3">
              {(news || []).slice(0, 3).map((a) => (
                <Link key={a.url} href={a.url} target="_blank">
                  <Card className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow">
                    <div className="relative h-40 w-full bg-gray-100">
                      <Image src={a.image || '/placeholder.png'} alt={a.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="p-3">
                      <div className="line-clamp-2 font-medium">{a.title}</div>
                      <div className="mt-1 text-xs text-gray-500">{a.source || 'News Source'}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section> */}
      </div>
    </div>
  );
}
