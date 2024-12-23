import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "../../../lib/mongodb"; // MongoDB helper

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FLASK_API_URL = "http://127.0.0.1:5005"; // Ngrok-exposed Flask API URL

export async function POST(req) {
  // 1. Parse request body
  const { videoUrl } = await req.json();
  if (!videoUrl) {
    return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
  }

  // 2. Identify the user (example: from headers or session)
  //    Adapt this to your real auth flow. For demonstration, we assume 'x-user-email' is in the headers.
  const userEmail = req.headers.get("x-user-email");
  if (!userEmail) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  // 3. Extract YouTube Video ID
  let videoId;
  try {
    const urlObj = new URL(videoUrl);
    if (urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com") {
      videoId = urlObj.searchParams.get("v");
    } else if (urlObj.hostname === "youtu.be") {
      videoId = urlObj.pathname.slice(1);
    }
  } catch (e) {
    return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
  }
  if (!videoId) {
    return NextResponse.json({ error: "Unable to extract video ID" }, { status: 400 });
  }

  try {
    // 4. Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const recommendationsColl = db.collection("recommendations");
    const usersColl = db.collection("users");

    // 5. Retrieve user document to check subscription & usage
    const userDoc = await usersColl.findOne({ email: userEmail });
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const subscriptionType = userDoc.subscription || "free"; // "free" or "premium"
    
    // 5a. Check usage if user is on free tier
    if (subscriptionType === "free") {
      // We need to see if userDoc.usage is still in the current month
      const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2024-01"
      let usageCount = 0;

      if (!userDoc.usage || userDoc.usage.month !== currentMonth) {
        // If usage is not set or is from an old month, reset to 0
        await usersColl.updateOne(
          { email: userEmail },
          { $set: { usage: { month: currentMonth, count: 0 } } }
        );
      } else {
        // Same month, get the count
        usageCount = userDoc.usage.count;
      }

      if (usageCount >= 10) {
        // Exceeded free-tier limit
        return NextResponse.json({
          error: "Free-tier limit reached. Upgrade to Premium for unlimited analyses."
        }, { status: 403 });
      }
    }

    // 6. Check if we have cached recommendations for this video
    const existingData = await recommendationsColl.findOne({ videoId });
    if (existingData) {
      console.log("Returning cached data from MongoDB");

      // Update usage if free-tier user, since we are providing an analysis (even if cached)
      if (subscriptionType === "free") {
        await incrementAnalysisCount(usersColl, userEmail);
      }

      return NextResponse.json({ recommendations: existingData.recommendations });
    }

    // 7. Fetch transcript from Flask API
    let transcriptText;
    let transcriptTextWithTimeStamps;
    try {
      const transcriptResponse = await fetch(`${FLASK_API_URL}/transcript/${videoId}`);
      if (!transcriptResponse.ok) {
        const { error } = await transcriptResponse.json();
        throw new Error(error || "Failed to fetch transcript");
      }
      const { transcript } = await transcriptResponse.json();
      transcriptText = transcript;
      transcriptTextWithTimeStamps = transcript;
    } catch (e) {
      return NextResponse.json({
        error: `Failed to fetch transcript: ${e.message}`
      }, { status: 500 });
    }

    // 8. Call the Gemini API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
      You are a financial analysis assistant. I will provide you with a transcript of a YouTube video in which a financial YouTuber discusses various stocks. Keep in mind that not all stocks mentioned are recommendations—some may be examples of poor performance.

      Your task:

      Identify only the stocks explicitly recommended by the speaker.
      For each recommendation, provide:
      company_name: The correct, full company name (even if the speaker spells it incorrectly).
      ticker: The valid stock ticker with its exchange symbol in the format EXCHANGE:TICKER, such as NASDAQ:AAPL or NYSE:DIS. (verify it with a reputable source like Yahoo Finance or Google Finance).
      timestamp: The time (in seconds) when the company is first mentioned.
      reason: A brief explanation of the speaker’s justification or context for recommending that stock.

      Return the final results as a valid JSON object with the following structure:

      {
        "recommendations": [
          {
            "company_name": "<company_name>",
            "ticker": "<exchange:ticker_symbol>",
            "timestamp": <timestamp_in_seconds>,
            "reason": "<brief_reason>"
          }
          ...
        ]
      }
      `,
    });

    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    console.log("Transcript with Timestamps: ", transcriptTextWithTimeStamps);

    const userMessage = `
      Analyze the below transcript:
      ${transcriptTextWithTimeStamps}
      with timestamp in seconds 
      and return recommendations.
    `;

    let recommendations = [];
    try {
      const geminiResponse = await chatSession.sendMessage(userMessage);
      const geminiText = await geminiResponse.response.text();
      const parsed = JSON.parse(geminiText);
      console.log(parsed);
      recommendations = parsed.recommendations || [];
    } catch (e) {
      return NextResponse.json({
        error: "Failed to process recommendations"
      }, { status: 500 });
    }

    // 9. If we have recommendations, save them to DB
    if (recommendations.length > 0) {
      const dataToSave = {
        videoId,
        recommendations,
        createdAt: new Date(),
      };
      await recommendationsColl.insertOne(dataToSave);
    }

    // 10. Now that we've successfully done an analysis, if user is free-tier => increment
    if (subscriptionType === "free") {
      await incrementAnalysisCount(usersColl, userEmail);
    }

    // 11. Return recommendations
    return NextResponse.json({ recommendations });
  } catch (e) {
    console.error("Database error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Helper function to increment analysis usage count for a free-tier user.
 * If it's a new month, reset usage.
 */
async function incrementAnalysisCount(usersColl, userEmail) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  // Fetch the latest user doc
  const userDoc = await usersColl.findOne({ email: userEmail });
  if (!userDoc) return;

  if (!userDoc.usage || userDoc.usage.month !== currentMonth) {
    // if no usage or it's a different month, reset to 1
    await usersColl.updateOne(
      { email: userEmail },
      { $set: { usage: { month: currentMonth, count: 1 } } }
    );
  } else {
    // same month, increment
    const newCount = (userDoc.usage.count || 0) + 1;
    await usersColl.updateOne(
      { email: userEmail },
      { $set: { "usage.count": newCount } }
    );
  }
}
