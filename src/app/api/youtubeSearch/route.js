export async function GET(req) {
    const query = new URL(req.url).searchParams.get("q");
    if (!query) {
      return new Response(JSON.stringify({ error: "Query is required" }), { status: 400 });
    }
  
    const API_KEY = process.env.YOUTUBE_API_KEY;
  
    // Step 1: Search for channels
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&type=channel&key=${API_KEY}`;
  
    try {
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
  
      const channelIds = searchData.items.map((item) => item.id.channelId).join(",");
  
      // Step 2: Fetch statistics for the channels
      const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds}&key=${API_KEY}`;
      const statsRes = await fetch(statsUrl);
      const statsData = await statsRes.json();
  
      const results = statsData.items.map((item) => ({
        id: item.id,
        title: item.snippet.title,
        handle: item.snippet.customUrl || `@${item.snippet.channelId}`,
        thumbnail: item.snippet.thumbnails.high.url,
        subscribers: item.statistics.subscriberCount,
        url: `https://www.youtube.com/channel/${item.id}`,
      }));
  
      return new Response(JSON.stringify({ results }), { status: 200 });
    } catch (err) {
      console.error("YouTube API error:", err);
      return new Response(JSON.stringify({ error: "YouTube API error" }), { status: 500 });
    }
  }
  