import { NextResponse } from "next/server";

export async function GET() {
    const keywords = [
  "agriculture",
  "farming",
  "crops",
  "harvest",
  "agribusiness",
  "livestock",
  "plantation",
  "horticulture",
  "farmers",
  "agri-tech",
  "sustainable farming",
  "food security",
  "irrigation",
  "agriculture market",
];

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=agriculture market OR farm economy OR farming OR crop trading&language=en&sortBy=relevancy&pageSize=15&apiKey=${process.env.NEWS_API_KEY}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch news articles." },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Post-fetch filtering to ensure relevance
    const filteredArticles = data.articles.filter((article: unknown) => {
        const a = article as { title?: string; description?: string; content?: string };
        const text = `${a.title ?? ""} ${a.description ?? ""} ${a.content ?? ""}`.toLowerCase();
        return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    });

    return NextResponse.json({ totalResults: filteredArticles.length, articles: filteredArticles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
