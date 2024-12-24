import clientPromise from "../../../lib/mongodb";

export async function POST(req) {
  const body = await req.json();

  if (!body.email || !body.name) {
    return new Response(JSON.stringify({ error: "Invalid user data" }), {
      status: 400,
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection("users");

    // Check if the user already exists
    let userDoc = await collection.findOne({ email: body.email });

    if (!userDoc) {
      // Get the current month for usage tracking
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2024-01"

      // Insert new user into the database with default free-tier settings
      const insertResult = await collection.insertOne({
        email: body.email,
        name: body.name,
        image: body.image || null,
        subscription: "free", // Default to free-tier
        usage: {
          month: currentMonth, // Track usage by month
          count: 0, // Start with 0 analyses
        },
        createdAt: new Date(), // Timestamp of account creation
      });

      // Fetch the newly inserted user
      userDoc = await collection.findOne({ _id: insertResult.insertedId });
    }

    // Return the user object (existing or newly created)
    return new Response(
      JSON.stringify({
        success: true,
        user: userDoc,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
