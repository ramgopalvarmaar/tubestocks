import { NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";

export async function GET() {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("channels");

    // Aggregate channels to find the top 10 most added ones
    const aggregatedChannels = await collection
      .aggregate([
        {
          $group: {
            _id: {
              id: "$id",
              title: "$title",
              thumbnail: "$thumbnail",
              handle: "$handle",
            },
            count: { $sum: 1 }, // Count how many times each channel is added
          },
        },
        {
          $sort: { count: -1 }, // Sort by count in descending order
        },
        {
          $limit: 10, // Limit to top 10 channels
        },
        {
          $project: {
            _id: 0,
            id: "$_id.id",
            title: "$_id.title",
            thumbnail: "$_id.thumbnail",
            handle: "$_id.handle",
            count: 1, // Include the count of users who added the channel
          },
        },
      ])
      .toArray();

    // Return the aggregated top channels with user counts
    return NextResponse.json({ channels: aggregatedChannels });
  } catch (error) {
    console.error("Error fetching top channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch top channels" },
      { status: 500 }
    );
  }
}
