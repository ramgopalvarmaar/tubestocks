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
import { EyeIcon, UsersIcon, VideoCameraIcon, UserIcon, RefreshIcon } from "@heroicons/react/solid";
import Navbar from "../../components/Navbar";
  
export default function ConsolePage() {
  const [channels, setChannels] = useState([]);
  const [topChannels, setTopChannels] = useState([]); // New state for globally popular channels
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentVideos, setRecentVideos] = useState({});
  const [stockRecommendations, setStockRecommendations] = useState([]);
  const [autoFetch, setAutoFetch] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const router = useRouter();
  const [userChannelIds, setUserChannelIds] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const [scrollToIndex, setScrollToIndex] = useState(null);

  const listRef = React.createRef();

  useEffect(() => {
    if (scrollToIndex !== null && listRef.current) {
      listRef.current.children[scrollToIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setScrollToIndex(null); // Reset after scrolling
    }
  }, [scrollToIndex]);

  useEffect(() => {
    const storedAutoFetch = localStorage.getItem("autoFetch") === "true";
    setAutoFetch(storedAutoFetch);

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
        await fetchStockRecommendations(currentUser.email);
        await fetchTopChannels(); // Fetch global top channels
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

      const userChannelIds = sortedChannels.map((channel) => channel.id); 
      setUserChannelIds(userChannelIds);
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  }

  // New function to fetch top 10 globally popular YouTube channels
  async function fetchTopChannels() {
    try {
      const res = await fetch("/api/getTopChannels");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch top channels.");
      setTopChannels(data.channels);
    } catch (err) {
      console.error("Failed to fetch top channels:", err);
      setError("Failed to fetch top channels. Please try again.");
    }
  }

  async function fetchStockRecommendations(userId) {
    try {
      const res = await fetch("/api/getStockRecommendations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userId || "", // Pass user email in the header
        },
      });
  
      const data = await res.json();
  
      if (!res.ok) throw new Error(data.error || "Failed to fetch stock recommendations.");
      setStockRecommendations(data.stocks);
    } catch (err) {
      console.error("Failed to fetch stock recommendations:", err);
      setError("Failed to fetch stock recommendations. Please try again.");
    }
  }

  function Toast({ message, onClose }) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 animate-bounce">
        <span>{message}</span>
        <button onClick={onClose} className="text-white text-sm font-bold">
          ×
        </button>
      </div>
    );
  }

  async function fetchRecentVideos(channelId) {
    try {
      const res = await fetch(`/api/getRecentVideos?channelId=${channelId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch recent videos.");
      setRecentVideos((prev) => {
        const updatedVideos = { ...prev, [channelId]: data.videos };
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
      setChannels((prev) => {
        const updatedChannels = [...prev, data.channel];
        setScrollToIndex(updatedChannels.length - 1); // Index of the newly added channel
        return updatedChannels;
      });
  
      setToastMessage("Channel added successfully!");
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
      setToastMessage("Channel removed successfully!");
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

  const topStocks = stockRecommendations.slice(0, 10);
  const globalTopChannels = topChannels.slice(0, 10);

  return (
    <div className={`${containerClasses} min-h-screen font-sans`}>
      <div className="relative h-screen flex">
        {/* Hamburger icon for mobile */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className={`absolute top-4 left-4 z-[9999] p-2 rounded-md ${isDark ? 'text-white' : 'text-black'} transition sm:hidden`}
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        {/* Side panel */}
        <div
          className={`${sidePanelClasses} transition-all duration-300 overflow-hidden ${sidebarWidth} flex flex-col
          sm:static sm:${sidebarWidth} ${isPanelOpen ? 'block' : 'hidden'} sm:block absolute top-0 bottom-0 sm:relative z-50 pt-24 sm:pt-0`}
        >
          <div className="p-4 flex-shrink-0 flex items-center space-x-4">
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
                    <img
                      src={result.thumbnail}
                      alt={result.title}
                      className={`rounded-full transition-all duration-300 ${
                        isPanelOpen ? "w-12 h-12" : "w-6 h-6"
                      }`}
                    />
                    {isPanelOpen ? (
                      <div className="flex-1 flex justify-around text-xs text-gray-400 ml-3">
                        <div className="flex items-center">
                          <VideoCameraIcon className="h-4 w-4 mr-1" />
                          <span>{formatCount(result.videoCount)}</span>
                        </div>
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-1" />
                          <span>{formatCount(result.subscribers)}</span>
                        </div>
                        <div className="flex items-center">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          <span>{formatCount(result.views)}</span>
                        </div>
                      </div>
                    ) : (
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

        {/* Main content area */}
        <div className="transition-all duration-300 flex-1 overflow-auto flex flex-col">
          <Navbar theme={theme} onToggleTheme={toggleTheme} />

          <div className="p-6">
            {/* Top Section: Split into two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
  {/* Top 10 Stock Recommendations */}
  <div>
    <h2 className={`text-2xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"} text-center`}>
      Top 10 Stock Recommendations
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {topStocks.map((stock, idx) => (
      <motion.div
        key={`${stock.ticker}-${idx}`} // Unique key
        className={`relative p-3 rounded-lg shadow-sm border ${
          stock.ticker === "XX:XX" ? "cursor-default filter blur-[2px]" : "cursor-pointer"
        } hover:shadow-md transition group flex flex-col justify-between ${cardClasses}`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={idx}
        onClick={
          stock.ticker !== "XX:XX"
            ? () => router.push(`/stock/${stock.ticker.split(':').pop()}`)
            : null // Remove onClick if ticker is "XX:XX"
        }
      >
        <h2 className="text-xs font-semibold line-clamp-2">{stock.company_name}</h2>
        <p className="text-xs text-gray-500">{stock.ticker.split(':').pop()}</p>
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow">
          {stock.uniqueVideoCount}
        </div>
        <div
          className={`absolute bottom-full ${
            idx % 5 === 0 ? "left-0" : "left-1/2 -translate-x-1/2"
          } transform mb-2 w-max bg-gray-700 text-white text-xs rounded-md px-3 py-2 shadow-lg hidden group-hover:block z-20`}
        >
          <div className="backdrop-filter-none">
            {stock.company_name === "Upgrade to Premium" ? (
              <p>{stock.uniqueVideoCount} videos recommend this stock</p>
            ) : (
              <p>
                {stock.uniqueVideoCount} videos recommend this {stock.company_name}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    ))}
    </div>
  </div>

  {/* Top 10 YouTube Channels (Global) */}
  <div>
    <h2 className="text-2xl font-semibold mb-4 text-center">Top 10 YouTube Channels</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {topChannels.map((channel, idx) => (
        <motion.div
          key={channel.id}
          className={`relative p-3 rounded-lg shadow-sm border hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${cardClasses}`}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={idx}
          onClick={() => window.open(`https://www.youtube.com/channel/${channel.id}`, "_blank")}
        >
          <div className="flex items-center space-x-2">
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-12 h-12 rounded-full"
            />
            {/* Channel Name - Visible on Mobile */}
            <span className="text-xs font-semibold truncate sm:hidden">{channel.title}</span>

            {/* Tooltip */}
            <div
              className={`absolute bottom-full ${
                idx % 5 === 4 ? "right-0" : "left-1/2 -translate-x-1/2"
              } mb-2 w-max bg-gray-700 text-white text-xs rounded-md px-3 py-1 shadow-lg hidden group-hover:block z-20`}
            >
              {channel.title} - {channel.count} users have added this channel
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow flex items-center space-x-1">
            <span>{channel.count}</span>
            <UserIcon className="w-3 h-3" />
          </div>

          {/* Add Button */}
          {!userChannelIds.includes(channel.id) && (
            <button
              className="absolute bottom-2 right-2 text-green-500 hover:text-green-400"
              onClick={(e) => {
                e.stopPropagation();
                handleAddChannel(channel);
              }}
            >
              <PlusCircleIcon className="w-5 h-5" />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  </div>
</div>


            {/* Channels You Have Added */}
            <h2 className={`text-2xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
              Channels You Have Added
            </h2>
            <ul ref={listRef} className="space-y-6">
            {channels.map((channel, index) => (
            <motion.li
              key={channel._id}
              className={`relative shadow-sm rounded-lg p-4 hover:shadow-md transition flex flex-col ${cardClasses}`}
              variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { 
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: index * 0.1,
                    duration: 0.5,
                    type: "spring"
                  }
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {/* Container for top-right icons */}
              <div className="absolute top-2 right-2 flex flex-col items-end space-y-2">
                {/* Remove Channel Button */}
                <button
                  onClick={() => handleRemoveChannel(channel.id)}
                  className="text-red-500 hover:text-red-400"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>

                {/* Refresh (Fetch Latest Videos) Button (icon for mobile, text for larger screens) */}
                {/* For simplicity, let's show the circular refresh icon only here. If you need the text version on larger screens, you can add logic to display it inline. */}
                <button
                onClick={() => fetchRecentVideos(channel.id)}
                className="p-2 rounded-full bg-white text-black shadow-md hover:bg-gray-100 transition-transform duration-300 transform hover:scale-110 group focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label="Refresh"
              >
                <RefreshIcon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-180" />
              </button>

              </div>

              {/* Channel Header (left side content) */}
              <div className="flex items-center mb-4 pr-10"> 
                {/* pr-10 to ensure text doesn't overlap the buttons on the right */}
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="w-16 h-16 rounded-full flex-shrink-0"
                />
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold mb-1">{channel.title}</h3>
                  <p className="mb-2">{channel.handle}</p>

                  <div className="flex items-center space-x-4 text-xs">
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
              </div>

              {recentVideos[channel.id] && (
              <div className="mt-4 overflow-x-auto">
                <h4 className="text-sm mb-2">Recent Videos:</h4>
                <div className="flex space-x-4 whitespace-nowrap">
                  {recentVideos[channel.id].map((video) => (
                    <div
                      key={video.videoId}
                      className={`relative w-60 flex-shrink-0 p-2 bg-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all ${cardClasses}`}
                    >
                      {/* YouTube Icon */}
                      <button
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                        className="absolute top-3 right-4 text-red-600 hover:text-red-800 transition"
                        title="Watch on YouTube"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          className="w-6 h-6"
                        >
                          <path d="M10.2 15.7v-7.5l6.5 3.8-6.5 3.7zM24 12c0-3.1 0-4.8-.3-6.2-.3-1.4-1-2.5-1.8-3.2C20.3 1.9 19 1.6 15.7 1.5c-1.8-.1-3.6-.1-5.4-.1s-3.6 0-5.4.1C4 1.6 2.7 1.9 2.1 2.6c-.8.7-1.5 1.8-1.8 3.2C0 7.2 0 8.9 0 12s0 4.8.3 6.2c.3 1.4 1 2.5 1.8 3.2.6.7 2 1 5.3 1.1 1.8.1 3.6.1 5.4.1s3.6 0 5.4-.1c3.3-.1 4.7-.4 5.3-1.1.8-.7 1.5-1.8 1.8-3.2.3-1.4.3-3.1.3-6.2z" />
                        </svg>
                      </button>
                      {/* Thumbnail */}
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-36 object-cover rounded-md"
                      />
                      <p className="mt-2 text-sm font-bold truncate">{video.title}</p>
                      <p className="text-xs text-gray-400">
                        Published: {new Date(video.publishedAt).toDateString()}
                      </p>
                      <button
                        onClick={() => router.push(`/analyze?videoUrl=${encodeURIComponent(video.url)}`)}
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
            {toastMessage && (
              <Toast
                message={toastMessage}
                onClose={() => setToastMessage(null)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
