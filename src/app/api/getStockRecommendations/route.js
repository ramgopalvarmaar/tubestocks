import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function GET(req) {
  try {
    // Get user's email from the request headers
    const userEmail = req.headers.get("x-user-email");

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized: Email header is missing" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("recommendations");

    // Check if the user is free-tier
    const usersCollection = db.collection("users"); // Collection containing user subscription details
    const user = await usersCollection.findOne({ email: userEmail });

    const isFreeTier = user?.subscription === "free";

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

    // If the user is free-tier, hide company_name and ticker for the top 5 stocks
    if (isFreeTier) {
      const modifiedStocks = aggregatedStocks.map((stock, index) => {
        if (index < 5) {
          // Hide company_name and ticker for the top 5 stocks
          return {
            ...stock,
            company_name: "Upgrade to Premium",
            ticker: "XX:XX",
          };
        }
        return stock; // Keep other stocks as they are
      });

      return NextResponse.json({ stocks: modifiedStocks });
    }

    // For non-free-tier users, return all top 10 stocks
    return NextResponse.json({ stocks: aggregatedStocks });
  } catch (error) {
    console.error("Error fetching stock recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock recommendations" },
      { status: 500 }
    );
  }
}
