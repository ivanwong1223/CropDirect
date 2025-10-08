"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Calendar, User, Image as ImageIcon } from "lucide-react";

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  image?: string;
  source?: string;
  published_at?: string;
}

interface NewsFeedResponse {
  status?: string;
  data: NewsArticle[];
}

export default function NewsFeedPage() {
  const [newsData, setNewsData] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("newest");

  const fetchNewsData = async (category: string = "all") => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/newsFeed?category=${category}`);
      if (!response.ok) {
        throw new Error("Failed to fetch news data");
      }
      const data: NewsFeedResponse = await response.json();
      setNewsData(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
    const placeholder = target.nextElementSibling as HTMLElement;
    if (placeholder) {
      placeholder.style.display = "flex";
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    fetchNewsData(category);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value);
  };

  const sortedNewsData = useMemo(() => {
    if (!newsData || newsData.length === 0) return [];
    return [...newsData].sort((a, b) => {
      const dateA = new Date(a.published_at || new Date().toISOString()).getTime();
      const dateB = new Date(b.published_at || new Date().toISOString()).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  }, [newsData, sortOrder]);

  useEffect(() => {
    fetchNewsData(selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buyer News Feed</h1>
          <p className="text-gray-600">Discover market insights, crop trends, and buying opportunities</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Buyer News Feed</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600 mb-4">Error loading news: {error}</p>
            <Button onClick={() => fetchNewsData(selectedCategory)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-6">Buyer News Feed</h1>
        <p className="text-gray-600 mb-4">Curated agriculture updates tailored for buyers</p>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm">
            {newsData.length} articles available
          </Badge>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-3">Filter by category:</p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "all", label: "All News" },
                { id: "crop-specific", label: "Crop-Specific News" },
                { id: "plantation", label: "Plantation" },
                { id: "livestock", label: "Livestock" },
                { id: "farming", label: "Farming" },
              ].map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "hover:bg-green-50 hover:border-green-300"
                  }`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortOrder} onValueChange={handleSortOrderChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Date added (newest - oldest)</SelectItem>
                  <SelectItem value="oldest">Date added (oldest - newest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {sortedNewsData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No news articles available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNewsData.map((article, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48 bg-gray-100">
                {article.image ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    <div
                      className="hidden w-full h-full items-center justify-center bg-gray-100"
                      style={{ display: "none" }}
                    >
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold line-clamp-2 hover:text-blue-600 transition-colors">
                  {article.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{article.source}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(article.published_at || new Date().toISOString())}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <CardDescription className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {article.description || "No description available."}
                </CardDescription>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer"
                  onClick={() => window.open(article.url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Read Full Article
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
