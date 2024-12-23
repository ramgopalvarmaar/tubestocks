"use client";
import { useEffect, useState } from "react";

export default function AnalysisHistory() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/analysisHistory", {
        method: "POST",
        headers: { "Content-Type": "application/json" , "x-user-email": "arramgopalvarma@gmail.com",},
        });

        if (!res.ok) {
          const { error } = await res.json();
          throw new Error(error || "Failed to fetch analysis history");
        }

        const { videos } = await res.json();
        setVideos(videos);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Analysis History</h1>
      {videos.length === 0 ? (
        <p>No analysis history found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Video URL</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Recommendations</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Analyzed At</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video) => (
              <tr key={video.videoId}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                    {video.videoUrl}
                  </a>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  <ul>
                    {video.recommendations.map((rec, index) => (
                      <li key={index}>
                        <strong>{rec.company_name}</strong> ({rec.ticker}) - {rec.reason} @ {rec.timestamp}s
                      </li>
                    ))}
                  </ul>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {new Date(video.users.find((u) => u.email === "user@example.com").analyzedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
