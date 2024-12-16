import clientPromise from "../../../lib/mongodb";

export async function DELETE(req) {
  const { channelId, userId } = await req.json();

  if (!channelId || !userId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection("channels");

    await collection.deleteOne({ id: channelId, userId });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Failed to remove channel:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
