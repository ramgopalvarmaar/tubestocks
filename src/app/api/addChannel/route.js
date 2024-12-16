import clientPromise from "../../../lib/mongodb";

export async function POST(req) {
  const { channelId, channelUrl, userId, title, thumbnail, handle, subscribers } = await req.json();

  if (!channelId || !userId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection("channels");

    const channel = { id: channelId, url: channelUrl, userId, title, thumbnail, handle, subscribers, addedAt: new Date() };
    await collection.insertOne(channel);

    return new Response(JSON.stringify({ channel }), { status: 200 });
  } catch (err) {
    console.error("Failed to add channel:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
