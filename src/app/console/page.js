"use client";

import React, { useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  PlusCircleIcon,
  TrashIcon,
  MenuIcon,
  SearchIcon,
} from "@heroicons/react/solid";
import { EyeIcon, UsersIcon, VideoCameraIcon } from "@heroicons/react/solid";
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
  const [theme, setTheme] = useState("light"); // light or dark

  const router = useRouter();

  useEffect(() => {
    const storedAutoFetch = localStorage.getItem("autoFetch") === "true";
    setAutoFetch(storedAutoFetch);

    // Retrieve videos from localStorage when the component mounts
    const storedVideos = localStorage.getItem("recentVideos");
    if (storedVideos) {
      setRecentVideos(JSON.parse(storedVideos));
    }
  }, []);

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
      setRecentVideos((prev) => {
        const updatedVideos = { ...prev, [channelId]: data.videos };
  
        // Store updated videos in localStorage
        localStorage.setItem("recentVideos", JSON.stringify(updatedVideos));
        return updatedVideos;
      });

    } catch (err) {
      setError("Failed to fetch recent videos. Please try again.");
      console.error(err);
    }
  }

  async function handleSearch() {
    try {
      const res = await fetch(`/api/youtubeSearch?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.sortedChannels || []);
      setIsPanelOpen(true);
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
          views: channel.views,
          videoCount: channel.videoCount,
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

  function formatCount(number) {
    if (number >= 1e9) return (number / 1e9).toFixed(1) + "B";
    if (number >= 1e6) return (number / 1e6).toFixed(1) + "M";
    if (number >= 1e3) return (number / 1e3).toFixed(1) + "K";
    return number;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    }),
  };

  const isDark = theme === "dark";
  const containerClasses = isDark ? "bg-[#202124] text-white" : "bg-white text-black";
  const sidePanelClasses = isDark
    ? "bg-[#303134] border-r border-[#5f6368] text-gray-200"
    : "bg-gray-100 border-r border-gray-300 text-gray-900";
  const inputClasses = isDark
    ? "w-full p-2 rounded-md text-gray-200 placeholder-gray-400 bg-[#3c4043] border border-transparent focus:border-blue-500 focus:ring-blue-500"
    : "w-full p-2 rounded-md text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-blue-500 focus:ring-blue-500";

  const buttonBaseClasses = "px-4 py-2 rounded-md transition text-sm font-medium";
  const buttonPrimaryClasses = isDark
    ? `${buttonBaseClasses} bg-blue-600 text-white hover:bg-blue-700`
    : `${buttonBaseClasses} bg-blue-600 text-white hover:bg-blue-700`;

  const cardClasses = isDark
    ? "bg-[#303134] border border-[#5f6368] text-gray-200 hover:bg-[#3c4043]"
    : "bg-white border border-gray-200 text-gray-900 hover:shadow-md";

  const sidebarWidth = isPanelOpen ? "w-66" : "w-20";

  return (
    <div className={`${containerClasses} min-h-screen font-sans`}>
      <div className="relative h-screen flex">
        {/* Hamburger icon for mobile with high z-index */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute top-4 left-4 z-[9999] p-2 rounded-md text-white transition sm:hidden"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        {/* Side panel */}
        <div
          className={`${sidePanelClasses} transition-all duration-300 overflow-hidden ${sidebarWidth} flex flex-col
          sm:static sm:${sidebarWidth} ${isPanelOpen ? 'block' : 'hidden'} sm:block absolute top-0 bottom-0 sm:relative z-50 pt-24 sm:pt-0`}
        >

          {/* Top area with hamburger menu (hidden on mobile since we have one outside) */}
          <div className="p-4 flex-shrink-0 flex items-center space-x-4">
            {/* On larger screens, this button can still toggle collapse */}
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="hidden sm:flex items-center justify-center p-2 rounded-md hover:bg-[#3c4043] transition"
            >
              <MenuIcon className="w-6 h-6 text-gray-300" />
            </button>
            <h2 className="text-lg font-semibold truncate">
              {isPanelOpen ? "Search & Add Channels" : <SearchIcon className="w-5 h-5 text-gray-300" />}
            </h2>
          </div>

          <div className="p-4 flex-grow flex flex-col">
            {isPanelOpen && (
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="Search YouTube"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={inputClasses}
                />
                <button onClick={handleSearch} className={buttonPrimaryClasses}>
                  Search
                </button>
              </div>
            )}
            <ul className="space-y-4 overflow-auto">
              {searchResults.map((result) => (
                <li
                  key={result.id}
                  className={`flex flex-col p-3 rounded-md shadow-sm border hover:shadow-md transition ${
                    isDark
                      ? "bg-[#303134] border-[#5f6368] text-gray-200 hover:bg-[#3c4043]"
                      : "bg-white border-gray-200 text-gray-900"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className={`font-semibold truncate ${isPanelOpen ? "text-sm" : "hidden"}`}>{result.title}</p>
                    <button
                      onClick={() => handleAddChannel(result)}
                      className="text-green-500 hover:text-green-400"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className={`flex items-center justify-between`}>
                  {/* Channel Logo */}
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className={`rounded-full transition-all duration-300 ${
                      isPanelOpen ? "w-12 h-12" : "w-6 h-6"
                    }`}
                  />

                  {/* Conditional Rendering */}
                  {isPanelOpen ? (
                    <div className="flex-1 flex justify-around text-xs text-gray-400 ml-3">
                      {/* Video Count */}
                      <div className="flex items-center">
                        <VideoCameraIcon className="h-4 w-4 mr-1" />
                        <span>{formatCount(result.videoCount)}</span>
                      </div>
                      {/* Subscriber Count */}
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        <span>{formatCount(result.subscribers)}</span>
                      </div>
                      {/* View Count */}
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        <span>{formatCount(result.views)}</span>
                      </div>
                    </div>
                  ) : (
                    // When collapsed, show only the "+" button
                    <button
                      onClick={() => handleAddChannel(result)}
                      className="text-green-500 hover:text-green-400 ml-3"
                    >
                      <PlusCircleIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>

                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Main content area (right side), now with the Navbar at the top */}
        <div className="transition-all duration-300 flex-1 overflow-auto flex flex-col">
          <Navbar theme={theme} onToggleTheme={toggleTheme} />
          <div className="p-6">
            {/* Stock Recommendation Cards */}
            <div className="mb-12">
              <h2 className={`text-2xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                Top 10 Stock Recommendations
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {stockRecommendations.map((stock, idx) => (
                  <motion.div
                    key={stock.ticker}
                    className={`relative p-3 rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer ${
                      isDark
                        ? "bg-[#303134] border-[#5f6368] text-gray-200 hover:bg-[#3c4043]"
                        : "bg-white border-gray-200 text-gray-900"
                    }`}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={idx}
                    onClick={() => router.push(`/stock/${stock.ticker}`)}
                  >
                    <h2 className="text-sm font-semibold">{stock.company_name}</h2>
                    <p className="text-xs text-gray-500">{stock.ticker}</p>
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow">
                      {stock.count}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Channel List */}
            <h2 className={`text-2xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Channels You Have Added
            </h2>
            <ul className="space-y-6">
            {channels.map((channel, index) => (
              <motion.li
                key={channel._id}
                className={`relative shadow-sm rounded-lg p-4 hover:shadow-md transition flex flex-col ${cardClasses}`}
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0, transition: { delay: index * 0.1, duration: 0.5, type: "spring" } },
                }}
                initial="hidden"
                animate="visible"
              >
                {/* Remove Channel Button */}
                <button
                  onClick={() => handleRemoveChannel(channel.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>

                {/* Channel Header */}
                <div className="flex items-center mb-4">
                  {/* Channel Logo */}
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="w-16 h-16 rounded-full flex-shrink-0"
                  />

                  {/* Channel Details */}
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold mb-1">{channel.title}</h3>
                    <p className="text-gray-500 mb-2">{channel.handle}</p>

                    {/* Views, Subscribers, and Video Count */}
                    <div className="flex items-center space-x-4 text-gray-400 text-xs">
                      <div className="flex items-center">
                        <EyeIcon className="h-4 w-4 mr-1 text-blue-500" />
                        <span>{formatCount(channel.views)} views</span>
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1 text-green-500" />
                        <span>{formatCount(channel.subscribers)} subscribers</span>
                      </div>
                      <div className="flex items-center">
                        <VideoCameraIcon className="h-4 w-4 mr-1 text-purple-500" />
                        <span>{formatCount(channel.videoCount)} videos</span>
                      </div>
                    </div>
                  </div>

                  {/* Fetch Recent Videos Button */}
                  <div className="ml-auto">
                    <button
                      onClick={() => fetchRecentVideos(channel.id)}
                      className={`${buttonPrimaryClasses} px-3 py-2 text-sm`}
                    >
                      Fetch Videos
                    </button>
                  </div>
                </div>

                {/* Fetched Videos */}
                {recentVideos[channel.id] && (
                  <div className="mt-4 overflow-x-auto">
                    <h4 className="text-gray-400 text-sm mb-2">Recent Videos:</h4>
                    <div className="flex space-x-4 whitespace-nowrap">
                      {recentVideos[channel.id].map((video) => (
                        <div
                          key={video.videoId}
                          className="w-60 flex-shrink-0 p-2 bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                        >
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-36 object-cover rounded-md"
                          />
                          <p className="mt-2 text-sm text-gray-300 font-bold truncate">{video.title}</p>
                          <p className="text-gray-400 text-xs">
                            Published: {new Date(video.publishedAt).toDateString()}
                          </p>
                          <button
                            onClick={() =>
                              router.push(`/analyze?videoUrl=${encodeURIComponent(video.url)}`)
                            }
                            className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold rounded-md hover:scale-105 transition-transform"
                          >
                            Analyze
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.li>
            ))}
          </ul>

            {error && (
              <div className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-md shadow-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}