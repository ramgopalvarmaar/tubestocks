"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function StockPage({ params }) {
  const [ticker, setTicker] = useState(""); // State for ticker
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false); // State for collapsible card
  const [theme, setTheme] = useState("light"); // Theme state

  const router = useRouter();

  // Handle params (unwrapping the promise)
  useEffect(() => {
    async function unwrapParams() {
      const resolvedParams = await params; // Await params
      setTicker(resolvedParams.ticker);
    }
    unwrapParams();
  }, [params]);

  // Fetch videos when ticker is set
  useEffect(() => {
    if (!ticker) return;

    async function fetchVideos() {
      setLoading(true);
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

  // Retrieve theme from localStorage and sync with document
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const isDark = theme === "dark";
  const containerClasses = isDark ? "bg-[#202124] text-white" : "bg-white text-gray-900";
  const cardClasses = isDark
    ? "bg-[#303134] text-gray-300 shadow-md hover:shadow-lg"
    : "bg-gray-100 text-gray-800 shadow-md hover:shadow-lg";

  return (
    <div className={`${containerClasses} min-h-screen`}>
      <Navbar theme={theme} onToggleTheme={toggleTheme} />
      {/* Live TradingView Chart Card */}
      <div className={`${cardClasses} p-4 mb-6 rounded-lg shadow-lg mt-3`}>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {ticker} Live Trading Chart
          </h2>
          <button
            onClick={toggleCollapse}
            className={`px-4 py-2 rounded-lg ${
              isDark ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
            } transition`}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>

        {!collapsed && (
          <div className="relative w-full mt-4 h-96">
            <iframe
              src={`https://s.tradingview.com/widgetembed/?symbol=${ticker}&theme=${isDark ? "dark" : "light"}&style=1&locale=en`}
              title="Live TradingView Chart"
              frameBorder="0"
              allow="autoplay; fullscreen"
              className="absolute inset-0 w-full h-full rounded-lg"
            />
          </div>
        )}
      </div>

      <div className="p-6">
        <h1 className="text-3xl font-extrabold mb-6 text-center">
          Videos Recommending{" "}
          <span>{ticker || "..."}</span>
        </h1>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && videos.length === 0 && (
          <p>No videos found for this stock.</p>
        )}

        {/* Video Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, idx) => {
            const timeStamp =
              video.recommendations.length > 0
                ? video.recommendations[0].timeStamp
                : 0;

            const embedUrl = `https://www.youtube.com/embed/${video.videoId}?start=${timeStamp}&autoplay=0`;

            return (
              <div
                key={idx}
                className={`${cardClasses} p-4 rounded-lg transition-all`}
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
                  {video.recommendations.map((rec, idx) => (
                    <div key={idx} className="text-sm mt-2">
                      <p>
                        <strong>Justification:</strong> {rec.reason}
                      </p>
                    </div>
                  ))}
                  <p className="text-sm mt-2">
                    Published: {new Date(video.createdAt).toDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
