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
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("users");

    // Check if user already exists
    const existingUser = await collection.findOne({ email: body.email });
    if (!existingUser) {
      // Insert user into the database
      await collection.insertOne({
        email: body.email,
        name: body.name,
        image: body.image,
        createdAt: new Date(),
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Database error:", error);
    return new Response(JSON.stringify({ error: "Database error" }), {
      status: 500,
    });
  }
}
