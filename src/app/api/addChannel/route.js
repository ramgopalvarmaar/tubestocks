import clientPromise from "../../../lib/mongodb";

export async function POST(req) {
  const { channelId, channelUrl, userId, title, thumbnail, handle, subscribers, views, videoCount } = await req.json();

  if (!channelId || !userId) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection("channels");

    // Check if the channel already exists
    const existingChannel = await collection.findOne({ id: channelId });

    if (existingChannel) {
      // Clone the existing channel and add the new userId
      const newChannelEntry = {
        ...existingChannel,
        userId, // Add or replace userId
        addedAt: new Date(), // Update the addedAt timestamp for this user
      };
      delete newChannelEntry._id; // Remove the _id to allow for insertion as a new document
      await collection.insertOne(newChannelEntry);

      return new Response(
        JSON.stringify({ message: "Channel cloned with new userId", channel: newChannelEntry }),
        { status: 200 }
      );
    } else {
      // Insert the channel as a new entry
      const newChannel = {
        id: channelId,
        url: channelUrl,
        userId,
        title,
        thumbnail,
        handle,
        subscribers,
        views,
        videoCount,
        addedAt: new Date(),
      };
      await collection.insertOne(newChannel);

      return new Response(JSON.stringify({ message: "Channel added successfully", channel: newChannel }), {
        status: 200,
      });
    }
  } catch (err) {
    console.error("Failed to process channel:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
