import { NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(req) {
  const channelId = new URL(req.url).searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "Channel ID is required" }, { status: 400 });
  }

  try {
    // Step 1: Fetch recent videos using the search endpoint
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ error: "No recent videos found" }, { status: 404 });
    }

    // Step 2: Filter videos published within the last 15 days
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    const recentVideos = searchData.items.filter((item) => {
      const publishedAt = new Date(item.snippet.publishedAt);
      return publishedAt >= fifteenDaysAgo;
    });

    // Extract video IDs
    const videoIds = recentVideos.map((item) => item.id.videoId).join(",");

    // Step 3: Fetch video details including duration using the videos endpoint
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();

    if (!videosData.items || videosData.items.length === 0) {
      return NextResponse.json({ error: "No video details found" }, { status: 404 });
    }

    // Step 4: Filter out shorts (duration < 60 seconds)
    const nonShortVideos = videosData.items.filter((video) => {
      const duration = parseDuration(video.contentDetails.duration);
      return duration >= 60; // Filter videos longer than or equal to 60 seconds
    });

    // Map filtered videos to the desired structure and order by published date
    const videos = nonShortVideos
      .map((video) => ({
        videoId: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high.url,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        publishedAt: video.snippet.publishedAt,
      }))
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)); // Order by date descending

    return NextResponse.json({ videos });
  } catch (err) {
    console.error("Error fetching recent videos:", err);
    return NextResponse.json({ error: "Failed to fetch recent videos" }, { status: 500 });
  }
}

// Helper function to parse ISO 8601 duration into seconds
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}
