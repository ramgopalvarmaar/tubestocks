import clientPromise from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(req) {
  const userEmail = req.headers.get("x-user-email");
  console.log(userEmail)
  if (!userEmail) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const recommendationsColl = db.collection("recommendations");

    // Find all videos analyzed by the user
    const userVideos = await recommendationsColl
      .find({ "users.email": userEmail })
      .sort({ "users.analyzedAt": -1 }) // Sort by most recent analysis
      .toArray();

    return NextResponse.json({ videos: userVideos });
  } catch (error) {
    console.error("Database error:", error);
     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
