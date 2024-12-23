import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("recommendations");

    // Aggregate recommendations by ticker and fetch top 10 stocks with most used company names
    const aggregatedStocks = await collection
      .aggregate([
        { $unwind: "$recommendations" }, // Decompose recommendations array
        {
          $group: {
            _id: {
              company_name: "$recommendations.company_name",
              ticker: "$recommendations.ticker",
              videoId: "$videoId", // Group by unique videoId
            },
            count: { $sum: 1 }, // Count occurrences within each video
          },
        },
        {
          $group: {
            _id: {
              ticker: "$_id.ticker",
              company_name: "$_id.company_name",
            },
            uniqueVideos: { $addToSet: "$_id.videoId" }, // Collect unique video IDs
          },
        },
        {
          $project: {
            _id: 0,
            ticker: "$_id.ticker",
            company_name: "$_id.company_name",
            uniqueVideoCount: { $size: "$uniqueVideos" }, // Count unique video IDs
          },
        },
        {
          $sort: { uniqueVideoCount: -1 }, // Sort by unique video count (highest first)
        },
        { $limit: 10 }, // Fetch only the top 10 stocks
      ])
      .toArray();

    return NextResponse.json({ stocks: aggregatedStocks });
  } catch (error) {
    console.error("Error fetching stock recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock recommendations" },
      { status: 500 }
    );
  }
}
