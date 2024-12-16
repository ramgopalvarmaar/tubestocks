import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function GET(req) {
  const stock = new URL(req.url).searchParams.get("stock");

  if (!stock) {
    return NextResponse.json({ error: "Stock name or ticker is required" }, { status: 400 });
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection("recommendations");

    // Find all videos that recommend the given stock
    const videos = await collection
      .find({
        "recommendations.ticker": { $regex: stock, $options: "i" }, // Case-insensitive match
      })
      .toArray();

    const videoMap = new Map(); // To store unique videos by videoId

    videos.forEach((video) => {
    const filteredRecommendations = video.recommendations.filter((rec) =>
        rec.ticker.toLowerCase().includes(stock.toLowerCase())
    );
    
    if (filteredRecommendations.length > 0) {
        if (!videoMap.has(video.videoId)) {
        videoMap.set(video.videoId, {
            videoId: video.videoId,
            recommendations: filteredRecommendations.map((rec) => ({
            company_name: rec.company_name,
            reason: rec.reason,
            timeStamp: rec.timestamp, // Include timestamp
            })),
            createdAt: video.createdAt,
        });
        } else {
        // Add additional recommendations to the existing video entry
        const existing = videoMap.get(video.videoId);
        existing.recommendations.push(
            ...filteredRecommendations.map((rec) => ({
            company_name: rec.company_name,
            reason: rec.reason,
            timeStamp: rec.timestamp, // Include timestamp
            }))
        );
        }
    }
    });
    
    // Convert Map back to array
    const videoList = Array.from(videoMap.values());
      
      
    return NextResponse.json({ videos: videoList });
  } catch (error) {
    console.error("Failed to fetch videos by stock:", error);
    return NextResponse.json({ error: "Failed to fetch videos for the stock" }, { status: 500 });
  }
}
