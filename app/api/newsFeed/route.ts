import { NextResponse } from "next/server";
import { NewsArticle, NewsFeedResponse } from "@/lib/mockData";

export async function GET(request: Request) {
  // Array of default agriculture-themed images for null image fallback
  const defaultImages = [
    'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop&crop=center', // Farm field
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop&crop=center', // Crops growing
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop&crop=center', // Wheat field
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop&crop=center', // Vegetables
    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400&h=300&fit=crop&crop=center', // Farming equipment
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop&crop=center', // Fresh produce
    'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=400&h=300&fit=crop&crop=center', // Greenhouse
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=300&fit=crop&crop=center'  // Agricultural landscape
  ];

  /**
   * Function to get a random default image from the array
   * @returns {string} Random agriculture-themed image URL
   */
  const getRandomDefaultImage = (): string => {
    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
  };

  // Extract category from URL search params
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';

  /**
   * Function to map frontend category to API keywords
   * @param {string} category - The selected category from frontend
   * @returns {string} Keywords for API call
   */
  const getCategoryKeywords = (category: string): string => {
    switch (category) {
      case 'crop-specific':
        return 'crop pricing';
      case 'plantation':
        return 'plantation';
      case 'livestock':
        return 'livestock';
      case 'farming':
        return 'farming';
      case 'all':
      default:
        return 'agriculture';
    }
  };

  const keywords = getCategoryKeywords(category);

  try {
    const response = await fetch(
      `http://api.mediastack.com/v1/news?access_key=${process.env.MEDIA_STACK_API_KEY}&keywords=${keywords}&languages=en`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news articles." },
        { status: response.status }
      );
    }

    const data: NewsFeedResponse = await response.json();
    
    // Handle null image fields by providing random default image URLs
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map((article: NewsArticle) => ({
        ...article,
        image: article.image || getRandomDefaultImage()
      }));
    }
    
    return NextResponse.json(data); // Return the news data as JSON
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
