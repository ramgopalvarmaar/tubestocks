import clientPromise from "../../../lib/mongodb";

export async function GET(req) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!userId) return new Response(JSON.stringify({ error: "User ID is required" }), { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection("channels");

    const channels = await collection.find({ userId }).toArray();
    return new Response(JSON.stringify({ channels }), { status: 200 });
  } catch (err) {
    console.error("Failed to fetch channels:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
