"use client";

import React, { Suspense, useState, useEffect, useContext } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { UserContext } from "../../context/UserContext";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");
  const { user } = useContext(UserContext);

  const [inputUrl, setInputUrl] = useState(videoUrl || "");
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Add a loading state for auth
  const [theme, setTheme] = useState("light"); // Theme state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false); // Modal state

  const stripeCheckoutUrl = "https://your-stripe-checkout-url.com"; // Replace with your Stripe checkout URL

   // Simulate auth loading state
   useEffect(() => {
    const timeout = setTimeout(() => {
      setIsAuthLoading(false); // Simulate that auth state has loaded
    }, 1000); // Adjust the timeout to your app's auth loading logic
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isAuthLoading && videoUrl && user) {
      handleAnalyze(videoUrl);
    }
  }, [isAuthLoading, videoUrl, user]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  async function handleAnalyze(urlToAnalyze) {
    if (!user) {
      setError("You must be logged in to analyze videos.");
      return;
    }

    setError("");
    setRecommendations([]);
    setIsFetching(true);
    setShowSubscribeModal(false); // Hide the modal on new requests

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" , "x-user-email": user?.email || "",},
        body: JSON.stringify({ videoUrl: urlToAnalyze }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        if (error === "Free-tier limit reached. Upgrade to Premium for unlimited analyses.") {
          setShowSubscribeModal(true); // Show the subscription modal
        }
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

  const isDark = theme === "dark";
  const containerClasses = isDark ? "bg-[#202124] text-white" : "bg-white text-gray-900";
  const cardClasses = isDark
    ? "bg-[#303134] border border-[#5f6368] text-gray-300 hover:shadow-lg"
    : "bg-gray-100 border border-gray-300 text-gray-800 hover:shadow-lg";

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
  return (
    <div className="flex items-center justify-center h-screen">
      <p>Please log in to access this feature.</p>
    </div>
  );
  }

  return (
    <div className={`${containerClasses} min-h-screen`}>
      {/* Navbar */}
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      <div className="min-h-screen flex flex-col md:flex-row items-start p-6 space-x-0 md:space-x-6">
        {/* Main Content */}
        <div className={`${cardClasses} shadow-2xl rounded-lg p-6 w-full md:w-3/4`}>
          <h1 className="text-3xl font-extrabold mb-4">
            <span className={`${isDark ? "text-teal-300" : "text-indigo-500"}`}>AI-Powered</span>{" "}
            Stock Analysis
          </h1>

          {videoUrl ? (
            <p className="mb-6">
              Automatically fetching analysis for the provided YouTube video.
            </p>
          ) : (
            <p className="mb-6">
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
                className={`flex-grow p-3 border rounded-l-md ${
                  isDark ? "bg-[#3c4043] text-gray-200" : "bg-gray-100 text-gray-900"
                } placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  isDark ? "focus:ring-teal-300" : "focus:ring-indigo-300"
                }`}
              />
              <button
                onClick={() => handleAnalyze(inputUrl)}
                disabled={isFetching || !inputUrl}
                className={`p-3 rounded-r-md transition-all ${
                  isFetching
                    ? "opacity-50 cursor-not-allowed"
                    : `${
                        isDark
                          ? "bg-teal-500 hover:bg-teal-600"
                          : "bg-indigo-500 hover:bg-indigo-600"
                      } text-white`
                }`}
              >
                {isFetching ? "Analyzing..." : "Analyze"}
              </button>
            </div>
          )}

          {isFetching && (
            <div className="flex flex-col items-center justify-center mt-6">
              <div className="futuristic-loader mb-4"></div>
              <p className="animate-pulse">Analyzing video...</p>
            </div>
          )}

          {error && <p className="text-red-400 mb-4">{error}</p>}

          {recommendations.length > 0 && (
            <div className="space-y-6">
              {recommendations.map((rec, idx) => {
                const videoId = new URL(videoUrl || inputUrl).searchParams.get("v");
                const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${rec.timestamp}&autoplay=0`;

                return (
                  <div key={idx} className={`${cardClasses} shadow-md rounded-lg p-5`}>
                    <h3 className="text-xl font-semibold mb-2">Recommendation {idx + 1}</h3>
                    <p className="mb-2">
                      <strong>Stock Name:</strong> {rec.company_name} ({rec.ticker})
                    </p>
                    <p className="mb-4">
                      <strong>Justification:</strong> {rec.reason}
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
        </div>

        {/* Disclaimer Card */}
        <div className="hidden md:block md:w-1/4">
          <div
            className={`${cardClasses} fixed rounded-lg p-5 border-l-4 border-yellow-500 shadow-lg`}
          >
            <h2 className="text-yellow-400 text-lg font-bold mb-2">Disclaimer</h2>
            <p className="text-sm">
              The stock analysis provided here is AI-generated and for informational purposes only.
              Please review the analysis carefully and always do your own research before making any
              investment decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardClasses} rounded-lg p-6 w-full max-w-md text-center`}>
            <h2 className="text-xl font-bold mb-4">Upgrade to Premium</h2>
            <p className="mb-6">
              You've reached your free-tier limit. Upgrade to Premium for unlimited video analyses.
            </p>
            <button
              onClick={() => window.location.href = stripeCheckoutUrl}
              className={`p-3 rounded-md ${
                isDark ? "bg-teal-500 hover:bg-teal-600" : "bg-indigo-500 hover:bg-indigo-600"
              } text-white`}
            >
              Subscribe Now
            </button>
            <button
              onClick={() => setShowSubscribeModal(false)}
              className="mt-4 ml-4 text-sm underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
