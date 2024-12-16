"use client";

import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  SearchCircleIcon,
  PlusCircleIcon,
  TrashIcon,
  PlayIcon,
} from "@heroicons/react/solid";
import Navbar from "../../components/Navbar";

export default function ConsolePage() {
  const [channels, setChannels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentVideos, setRecentVideos] = useState({});
  const [stockRecommendations, setStockRecommendations] = useState([]);
  const [autoFetch, setAutoFetch] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedAutoFetch = localStorage.getItem("autoFetch") === "true";
    setAutoFetch(storedAutoFetch);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchChannels(currentUser.email);
        await fetchStockRecommendations();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (autoFetch) {
      channels.forEach((channel) => fetchRecentVideos(channel.id));
    }
  }, [autoFetch, channels]);

  async function fetchChannels(userId) {
    try {
      const res = await fetch(`/api/getChannels?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      const sortedChannels = data.channels.sort((a, b) => b.subscribers - a.subscribers);
      setChannels(sortedChannels);
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  }

  async function fetchStockRecommendations() {
    try {
      const res = await fetch("/api/getStockRecommendations");
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch stock recommendations.");
      setStockRecommendations(data.stocks);
    } catch (err) {
      console.error("Failed to fetch stock recommendations:", err);
      setError("Failed to fetch stock recommendations. Please try again.");
    }
  }

  async function fetchRecentVideos(channelId) {
    try {
      const res = await fetch(`/api/getRecentVideos?channelId=${channelId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch recent videos.");
      setRecentVideos((prev) => ({ ...prev, [channelId]: data.videos }));
    } catch (err) {
      setError("Failed to fetch recent videos. Please try again.");
      console.error(err);
    }
  }

  async function handleSearch() {
    try {
      const res = await fetch(`/api/youtubeSearch?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError("Failed to search YouTube channels. Please try again.");
      console.error(err);
    }
  }

  async function handleAddChannel(channel) {
    try {
      const res = await fetch("/api/addChannel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: channel.id,
          channelUrl: channel.url,
          userId: user.email,
          title: channel.title,
          thumbnail: channel.thumbnail,
          handle: channel.handle,
          subscribers: channel.subscribers,
        }),
      });

      if (!res.ok) throw new Error("Failed to add channel.");
      const data = await res.json();

      setChannels((prev) => [...prev, data.channel]);
    } catch (err) {
      console.error("Failed to add channel:", err);
      setError("Failed to add channel. Please try again.");
    }
  }

  async function handleRemoveChannel(channelId) {
    try {
      const res = await fetch("/api/removeChannel", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, userId: user.email }),
      });

      if (!res.ok) throw new Error("Failed to remove channel.");
      setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
    } catch (err) {
      setError("Failed to remove channel. Please try again.");
      console.error(err);
    }
  }

  function handleAnalyzeNavigation(videoUrl) {
    router.push(`/analyze?videoUrl=${encodeURIComponent(videoUrl)}`);
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1, // Stagger the animation based on the index
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    }),
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 text-white flex">
        {/* Left Panel */}
        <div
          className={`transition-all duration-300 bg-gray-800 text-white w-full sm:w-80 p-6 ${
            isPanelOpen ? "translate-x-0" : "-translate-x-full"
          } sm:translate-x-0 fixed sm:static z-50 sm:z-auto`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Search & Add Channels</h2>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="sm:hidden text-gray-300 hover:text-white"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="Search YouTube"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 rounded-md text-gray-900 placeholder-gray-500"
          />
          <button
            onClick={handleSearch}
            className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Search
          </button>
          <ul className="space-y-4 mt-4">
            {searchResults.map((result) => (
              <li key={result.id} className="flex items-center bg-gray-700 p-3 rounded-md shadow-md">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold">{result.title}</p>
                  <p className="text-gray-400 text-xs">@{result.handle}</p>
                </div>
                <button
                  onClick={() => handleAddChannel(result)}
                  className="text-green-500 hover:text-green-400"
                >
                  <PlusCircleIcon className="w-6 h-6" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-grow p-6">
          <h1 className="text-3xl font-extrabold text-white mb-6">Your Console</h1>

          {/* Stock Recommendation Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Stock Recommendations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {stockRecommendations.map((stock, idx) => (
                <motion.div
                key={stock.ticker}
                className="relative bg-gray-800 p-2 rounded-xl shadow-md hover:shadow-lg hover:bg-gray-700 transition-all cursor-pointer"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={idx}
                onClick={() => router.push(`/stock/${stock.ticker}`)}
              >
                  <h2 className="text-sm font-bold text-blue-400">{stock.company_name}</h2>
                  <p className="text-xs text-gray-300">{stock.ticker}</p>
                  <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                    {stock.count}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>


          {/* Channel List */}
          <h2 className="text-2xl font-bold text-blue-400 mb-4">Your Channels</h2>
          <ul className="space-y-6">
            {channels.map((channel) => (
              <li
                key={channel._id}
                className="relative bg-gray-800 bg-opacity-90 shadow-md rounded-lg p-5 border border-gray-700"
              >
                <button
                  onClick={() => handleRemoveChannel(channel.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                >
                  <TrashIcon className="w-6 h-6" />
                </button>
                <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between">
                  <div className="flex items-center sm:flex-1 sm:mr-4">
                    <img
                      src={channel.thumbnail}
                      alt={channel.title}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-blue-400">{channel.title}</h3>
                      <p className="text-gray-300">@{channel.handle}</p>
                      <p className="text-gray-300">Subscribers: {channel.subscribers}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchRecentVideos(channel.id)}
                    className={`mt-4 px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-md hover:bg-blue-600 transition`}
                  >
                    Fetch Recent Videos
                  </button>
                </div>
                {recentVideos[channel.id] && (
                <div className="mt-4 overflow-x-auto">
                  <div className="flex space-x-4 whitespace-nowrap">
                    {recentVideos[channel.id].map((video) => (
                      <div
                        key={video.videoId}
                        className="w-60 flex-shrink-0 p-2 bg-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-36 object-cover rounded-md"
                        />
                        <p className="mt-2 text-sm text-gray-300 font-bold">{video.title}</p>
                        <p className="text-gray-400 text-sm">
                          Published: {new Date(video.publishedAt).toDateString()}
                        </p>
                        <button
                          onClick={() =>
                            router.push(`/analyze?videoUrl=${encodeURIComponent(video.url)}`)
                          }
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-md hover:scale-105 transition-transform"
                        >
                          Analyze
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
