import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("recommendations");

    // Aggregate recommendations by stock (company_name or ticker) and fetch top 10
    const aggregatedStocks = await collection
      .aggregate([
        { $unwind: "$recommendations" }, // Decompose recommendations array
        {
          $group: {
            _id: {
              company_name: "$recommendations.company_name",
              ticker: "$recommendations.ticker",
              videoId: "$videoId", // Group by unique video ID
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: {
              company_name: "$_id.company_name",
              ticker: "$_id.ticker",
            },
            uniqueVideos: { $sum: 1 }, // Count unique videos per stock
          },
        },
        {
          $project: {
            _id: 0,
            company_name: "$_id.company_name",
            ticker: "$_id.ticker",
            count: "$uniqueVideos",
          },
        },
        { $sort: { count: -1 } }, // Sort by count (highest recommendations first)
        { $limit: 10 }, // Fetch only the top 10 stocks
      ])
      .toArray();

    return NextResponse.json({ stocks: aggregatedStocks });
  } catch (error) {
    console.error("Error fetching stock recommendations:", error);
    return NextResponse.json({ error: "Failed to fetch stock recommendations" }, { status: 500 });
  }
}
