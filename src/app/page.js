"use client";

import Head from "next/head";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

export default function LandingPage() {
  const [theme, setTheme] = useState("light");

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

  const isDark = theme === "dark";
  const containerClasses = isDark ? "bg-[#202124] text-white" : "bg-white text-gray-900";
  const cardClasses = isDark
    ? "bg-[#303134] border border-[#5f6368] text-gray-200 hover:bg-[#3c4043]"
    : "bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200";

  return (
    <>
      <Head>
        <title>TubeStocks - AI-Powered Stock Analysis from YouTube</title>
        <meta
          name="description"
          content="Manage YouTube channels, auto-fetch recent videos, and analyze them for actionable stock recommendations using advanced AI."
        />
        <meta
          name="keywords"
          content="AI stock analysis, YouTube stock recommendations, AI-powered insights, financial AI tools, auto-fetch videos, channel management"
        />
        <meta name="author" content="TubeStocks" />
        <meta property="og:title" content="TubeStocks - AI-Powered Stock Analysis from YouTube" />
        <meta
          property="og:description"
          content="Manage YouTube channels, auto-fetch videos, and analyze them for actionable stock recommendations."
        />
        <meta property="og:image" content="/landing-og-image.png" />
        <meta property="og:url" content="https://yourappdomain.com" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className={`${containerClasses} min-h-screen`}>
        {/* Navbar with Theme Toggle */}
        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        {/* Hero Section */}
        <header className="text-center py-16 px-6">
          <h1 className="text-4xl font-extrabold mb-4">
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-r ${
                isDark
                  ? "from-teal-300 via-indigo-300 to-purple-300"
                  : "from-blue-500 via-indigo-500 to-pink-500"
              }`}
            >
              TubeStocks
            </span>{" "}
            - AI-Powered Stock Analysis
          </h1>
          <p className="text-lg max-w-2xl mx-auto">
            Manage YouTube channels, auto-fetch recent videos, and analyze them with AI to extract actionable stock recommendations.
          </p>
        </header>

        {/* Features Section */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Why Choose TubeStocks?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${cardClasses} p-6 rounded-lg shadow-md`}>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? "text-teal-300" : "text-indigo-500"
                  }`}
                >
                  Channel Management
                </h3>
                <p>Search, add, and manage your favorite YouTube channels in one place.</p>
              </div>
              <div className={`${cardClasses} p-6 rounded-lg shadow-md`}>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? "text-teal-300" : "text-indigo-500"
                  }`}
                >
                  Auto-Fetch Videos
                </h3>
                <p>Automatically fetch recent videos from your channels and analyze them with ease.</p>
              </div>
              <div className={`${cardClasses} p-6 rounded-lg shadow-md`}>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? "text-teal-300" : "text-indigo-500"
                  }`}
                >
                  AI Analysis
                </h3>
                <p>Extract actionable stock recommendations with timestamps and context using advanced AI.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          className={`py-12 px-6 ${
            isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
          }`}
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <ol className="list-decimal list-inside space-y-4 text-left">
              <li>Sign in with Google to access your personalized console.</li>
              <li>Search and add YouTube channels to your list.</li>
              <li>Enable auto-fetch to retrieve recent videos automatically.</li>
              <li>
                Analyze videos for stock recommendations with detailed timestamps and embedded video navigation.
              </li>
            </ol>
          </div>
        </section>

        {/* Footer */}
        <footer
          className={`py-6 text-center ${
            isDark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
          }`}
        >
          <p>&copy; 2024 TubeStocks. All Rights Reserved.</p>
          <p>
            <a
              href="/terms"
              className={`${
                isDark ? "text-teal-300" : "text-indigo-500"
              } hover:underline`}
            >
              Terms of Service
            </a>{" "}
            |{" "}
            <a
              href="/privacy"
              className={`${
                isDark ? "text-teal-300" : "text-indigo-500"
              } hover:underline`}
            >
              Privacy Policy
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
