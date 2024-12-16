import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";
import clientPromise from "../../../lib/mongodb";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // YouTube Data API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Gemini API key

export async function GET(req) {
  const channelId = new URL(req.url).searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
  }

  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME); // Replace with your DB name
    const collection = db.collection("recommendations");

    // Step 1: Fetch recent videos from the channel
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=5&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();

    if (!videosData.items || videosData.items.length === 0) {
      return NextResponse.json({ error: "No recent videos found" }, { status: 404 });
    }

    const videoAnalysisPromises = videosData.items.map(async (video) => {
      const videoId = video.id.videoId;

      // Check if analysis for this video already exists in MongoDB
      const existingData = await collection.findOne({ videoId });
      if (existingData) {
        console.log(`Returning cached data for videoId: ${videoId}`);
        return {
          videoId,
          title: video.snippet.title,
          recommendations: existingData.recommendations,
        };
      }

      // Step 2: Fetch transcript for the video
      let transcriptText;
      let transcriptTextWithTimeStamps;
      try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        transcriptText = transcript.map((t) => t.text).join(" ");
        transcriptTextWithTimeStamps = transcript
          .map((t) => `[${t.offset.toFixed(0)}s] ${t.text}`)
          .join(" ");
      } catch (e) {
        console.error(`Failed to fetch transcript for videoId: ${videoId}`, e);
        return {
          videoId,
          title: video.snippet.title,
          error: "Failed to fetch transcript",
        };
      }

      // Step 3: Analyze the transcript using Gemini
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `
        You are a financial analysis assistant. I will provide you with a transcript of a YouTube video in which a financial YouTuber discusses various stocks. Keep in mind that not all stocks mentioned are recommendations—some may be examples of poor performance.

        Identify all the stocks explicitly recommended by the speaker. For each recommendation, include the following details:

        company_name: The name of the company. Ensure the company name is correct. The transcript might contain wrong spelling.
        ticker: The stock's ticker symbol (Derive this value from the company name).
        timestamp: The timestamp in seconds of the first mention of the company.
        reason: A brief summary of the reason or context for the recommendation.

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

      const userMessage = `Analyze the below transcript 
      ${transcriptTextWithTimeStamps} 
      with timestamp in seconds 
      and return recommendations.`;

      let recommendations = [];
      try {
        const geminiResponse = await chatSession.sendMessage(userMessage);
        const geminiText = await geminiResponse.response.text();
        const parsed = JSON.parse(geminiText);
        recommendations = parsed.recommendations || [];
      } catch (e) {
        console.error(`Failed to process recommendations for videoId: ${videoId}`, e);
        return {
          videoId,
          title: video.snippet.title,
          error: "Failed to process recommendations",
        };
      }

      // Step 4: Save analysis to MongoDB
      const dataToSave = {
        videoId,
        recommendations,
        createdAt: new Date(),
      };
      await collection.insertOne(dataToSave);

      return {
        videoId,
        title: video.snippet.title,
        recommendations,
      };
    });

    // Wait for all analyses to complete
    const analysisResults = await Promise.all(videoAnalysisPromises);

    // Return combined analysis results
    return NextResponse.json({ analysisResults });
  } catch (e) {
    console.error("Error analyzing channel:", e);
    return NextResponse.json({ error: "Failed to analyze channel" }, { status: 500 });
  }
}
