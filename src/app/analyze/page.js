"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function Page() {
  const searchParams = useSearchParams(); // Get query parameters
  const videoUrl = searchParams.get("videoUrl"); // Extract videoUrl from query

  const [inputUrl, setInputUrl] = useState(videoUrl || ""); // Initialize with videoUrl if available
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (videoUrl) {
      handleAnalyze(videoUrl); // Auto-analyze if videoUrl is present in the query
    }
  }, [videoUrl]);

  async function handleAnalyze(urlToAnalyze) {
    setError("");
    setRecommendations([]);
    setIsFetching(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ videoUrl: urlToAnalyze }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Failed to analyze video");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 text-white flex flex-col items-center p-6">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-800 shadow-2xl rounded-lg p-6 w-full max-w-3xl">
          <h1 className="text-3xl font-extrabold mb-4 text-white">
            <span className="text-blue-400">AI-Powered</span> Stock Analysis
          </h1>

          {videoUrl ? (
            <p className="text-gray-200 mb-6">
              Automatically fetching analysis for the provided YouTube video.
            </p>
          ) : (
            <p className="text-gray-200 mb-6">
              Enter a YouTube video URL below to fetch the transcript, analyze it with our AI model,
              and extract stock recommendations.
            </p>
          )}

          {!videoUrl && (
            <div className="flex items-center mb-6">
              <input
                type="text"
                placeholder="Enter YouTube video URL..."
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-grow p-3 border rounded-l-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={() => handleAnalyze(inputUrl)}
                disabled={isFetching || !inputUrl}
                className={`p-3 bg-blue-500 text-white rounded-r-md transition-all ${
                  isFetching
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-600 hover:scale-105"
                }`}
              >
                {isFetching ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          )}

          {isFetching && <p className="text-gray-300">Analyzing video...</p>}

          {error && <p className="text-red-400 mb-4">{error}</p>}

          {/* Display recommendations if available */}
          {recommendations.length > 0 && (
            <div className="space-y-6">
              {recommendations.map((rec, idx) => {
                const videoId = new URL(videoUrl || inputUrl).searchParams.get("v");
                const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${rec.timestamp}&autoplay=0`;

                return (
                  <div
                    key={idx}
                    className="bg-gray-800 bg-opacity-90 shadow-md rounded-lg p-5 border border-gray-700"
                  >
                    <h3 className="text-xl font-semibold text-blue-400 mb-2">
                      Recommendation {idx + 1}
                    </h3>
                    <p className="text-gray-300 mb-2">
                      <strong>Stock Name:</strong> {rec.company_name} ({rec.ticker})
                    </p>
                    <p className="text-gray-300 mb-4">
                      <strong>Justification:</strong> {rec.reason}
                    </p>
                    <p className="text-gray-300 mb-4 text-center font-medium">
                      <strong>Jump directly to the moment the stock is mentioned</strong>
                    </p>
                    <div className="relative w-full h-80 sm:h-60 mt-4">
                      <iframe
                        src={embedUrl}
                        title={`YouTube video for recommendation ${idx + 1}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full rounded-lg"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* If not fetching, no error, and no recommendations, show message */}
          {!isFetching && !error && recommendations.length === 0 && (
            <p className="text-gray-300 mt-4">No recommendations found</p>
          )}
        </div>
      </div>
    </div>
  );
}
