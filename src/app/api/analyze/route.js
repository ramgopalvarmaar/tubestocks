import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "../../../lib/mongodb"; // MongoDB helper

// Your Gemini API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req) {
  const { videoUrl } = await req.json();

  if (!videoUrl) {
    return NextResponse.json({ error: "No video URL provided" }, { status: 400 });
  }

  // Step 1: Extract video ID from URL
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
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("recommendations");

    // Step 2: Check if recommendations for this video ID already exist
    const existingData = await collection.findOne({ videoId });
    if (existingData) {
      console.log("Returning cached data from MongoDB");
      return NextResponse.json({ recommendations: existingData.recommendations });
    }

    // Step 3: Fetch the transcript
    let transcriptText;
    let transcriptTextWithTimeStamps;
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      transcriptText = transcript.map((t) => t.text).join(" ");
      transcriptTextWithTimeStamps = transcript
        .map((t) => `[${t.offset.toFixed(0)}s] ${t.text}`)
        .join(" ");
    } catch (e) {
      return NextResponse.json({ error: "Failed to fetch transcript" }, { status: 500 });
    }

    // Step 4: Call the Gemini API
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: `
      You are a financial analysis assistant. I will provide you with a transcript of a YouTube video in which a financial YouTuber discusses various stocks. Keep in mind that not all stocks mentioned are recommendations—some may be examples of poor performance.

      Identify all the stocks explicitly recommended by the speaker. For each recommendation, include the following details:

      company_name: The name of the company. Ensure the company name is correct. The transcript might contain wrong spelling.
      ticker: The stock's ticker symbol (Derive this value from the company name and ensure the symbol is valid and correct).
      timestamp: The timestamp in seconds of the first mention of the company.
      reason: A brief summary of the reason or context for the recommendation. Justify why it is recommended.

      Return the results as a structured JSON object with a key recommendations, where the value is a list of objects, each representing a stock recommendation.
      `,
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    console.log(transcriptTextWithTimeStamps)

    const userMessage = `Analyze the below transcript 
    ${transcriptTextWithTimeStamps} 
    with timestamp in seconds 
    and return recommendations.`;
    let recommendations = [];
    try {
      const geminiResponse = await chatSession.sendMessage(userMessage);
      const geminiText = await geminiResponse.response.text();
      const parsed = JSON.parse(geminiText);
      console.log(parsed)
      recommendations = parsed.recommendations || [];
    } catch (e) {
      return NextResponse.json({ error: "Failed to process recommendations" }, { status: 500 });
    }

    if (recommendations.length > 0) {
    // Step 5: Save the recommendations to MongoDB
    const dataToSave = {
        videoId,
        recommendations,
        createdAt: new Date(),
    };
    await collection.insertOne(dataToSave);
    }
    

    // Step 6: Return recommendations to the client
    return NextResponse.json({ recommendations });
  } catch (e) {
    console.error("Database error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
