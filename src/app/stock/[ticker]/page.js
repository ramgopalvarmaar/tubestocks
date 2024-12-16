"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function StockPage({ params }) {
  const { ticker } = params; // Stock ticker from dynamic route
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch(`/api/getVideosByStock?stock=${ticker}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch videos.");
        setVideos(data.videos);
      } catch (err) {
        console.error(err);
        setError("Failed to load videos for this stock.");
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [ticker]);

  return (
    <div>
        <Navbar />
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold text-blue-400 mb-6">
          Videos Recommending <span className="text-white">{ticker}</span>
        </h1>

        {loading && <p className="text-gray-300">Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && videos.length === 0 && (
          <p className="text-gray-300">No videos found for this stock.</p>
        )}

        {/* Video Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, idx) => {
            // Get the first recommendation's timeStamp (or default to 0 if no recommendations exist)
            const timeStamp = video.recommendations.length > 0 ? video.recommendations[0].timeStamp : 0;

            // Build the embed URL with the extracted timestamp
            const embedUrl = `https://www.youtube.com/embed/${video.videoId}?start=${timeStamp}&autoplay=0`;

            return (
              <div
                key={idx}
                className="bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <div className="relative w-full h-40">
                  <iframe
                    src={embedUrl}
                    title={`Video recommending ${ticker}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full rounded-md"
                  />
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-blue-400">Recommended in Video</h3>
                  {video.recommendations.map((rec, idx) => (
                    <div key={idx} className="text-gray-300 text-sm mt-2">
                      <p>
                        <strong>Reason:</strong> {rec.reason}
                      </p>
                      <p>
                        <strong>Timestamp:</strong> {rec.timeStamp}s
                      </p>
                    </div>
                  ))}
                  <p className="text-gray-400 text-sm mt-2">
                    Published: {new Date(video.createdAt).toDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}
