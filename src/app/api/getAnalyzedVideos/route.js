import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function GET(req) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("recommendations");

    // Find analyzed videos for the user
    const analyzedVideos = await collection
      .aggregate([
        {
          $match: { "users.email": email }, // Filter by user email
        },
        {
          $project: {
            videoId: 1,
            videoUrl: 1,
            recommendations: 1,
            users: {
              $filter: {
                input: "$users",
                as: "user",
                cond: { $eq: ["$$user.email", email] }, // Include only the specific user's data
              },
            },
          },
        },
        {
          $sort: { "users.analyzedAt": -1 }, // Sort by analyzed timestamp
        },
      ])
      .toArray();

    // Return the analyzed videos
    return NextResponse.json({ videos: analyzedVideos });
  } catch (error) {
    console.error("Error fetching analyzed videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyzed videos" },
      { status: 500 }
    );
  }
}
