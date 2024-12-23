"use client";

import Head from "next/head";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

// A helper component to animate sections on scroll
function AnimatedSection({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [theme, setTheme] = useState("dark");

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
  const containerClasses = isDark
    ? "bg-[#202124] text-white"
    : "bg-white text-gray-900";
  const cardClasses = isDark
    ? "bg-[#303134] border border-[#5f6368] text-gray-200 hover:bg-[#3c4043]"
    : "bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200";

  return (
    <>
      <Head>
        <title>TubeStocks - AI-Powered Stock Analysis from YouTube</title>
        <meta
          name="description"
          content="Manage YouTube channels, refresh recent videos, and analyze them for actionable stock recommendations using advanced AI."
        />
        <meta
          name="keywords"
          content="AI stock analysis, YouTube stock recommendations, AI-powered insights, financial AI tools, refresh videos, channel management"
        />
        <meta name="author" content="TubeStocks" />
        <meta
          property="og:title"
          content="TubeStocks - AI-Powered Stock Analysis from YouTube"
        />
        <meta
          property="og:description"
          content="Manage YouTube channels, refresh videos, and analyze them for actionable stock recommendations."
        />
        <meta property="og:image" content="/landing-og-image.png" />
        <meta property="og:url" content="https://yourappdomain.com" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className={`${containerClasses} min-h-screen`}>
        {/* Navbar with Theme Toggle */}
        <Navbar theme={theme} onToggleTheme={toggleTheme} />

        {/* Hero Section (streamlined) */}
        <AnimatedSection>
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
              Effortlessly add your favorite YouTube channels, refresh recent
              videos with a single click, and analyze them with AI to extract
              actionable stock recommendations—down to the exact video
              timestamp.
            </p>
          </header>
        </AnimatedSection>

        {/* Persuasive Marketing Copy (new section) */}
        <AnimatedSection>
          <section className="py-12 px-6 text-gray-300">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300">
                  Why TubeStocks?
                </span>
              </h2>
              <p className="text-lg mb-6">
                Are you watching endless YouTube videos just to find your next investment idea? Tired of juggling timestamps or rewriting scribbled notes every time a promising stock is mentioned? Don’t let the noisy world of financial YouTube overwhelm you.
              </p>
              <p className="text-lg">
                With{" "}
                <strong className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300">
                  TubeStocks
                </strong>
                , you can streamline your research and discover stocks in seconds—not hours. Our AI-driven platform brings together your favorite finance channels, indexes the newest videos, and pinpoints actionable insights so you can invest with confidence. It’s time to spend less time searching and more time capitalizing on market opportunities.
              </p>
            </div>
          </section>
        </AnimatedSection>



        {/* Features Section */}
        <AnimatedSection>
          <section className="py-12 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${cardClasses} p-6 rounded-lg shadow-md`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? "text-teal-300" : "text-indigo-500"
                    }`}
                  >
                    Search & Add Channels
                  </h3>
                  <p>
                    Use our built-in search to quickly add YouTube channels you
                    want to follow. Keep track of new content conveniently in
                    one place.
                  </p>
                </div>
                <div className={`${cardClasses} p-6 rounded-lg shadow-md`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? "text-teal-300" : "text-indigo-500"
                    }`}
                  >
                    Refresh to Get New Videos
                  </h3>
                  <p>
                    Simply click the <strong>“Refresh”</strong> button to pull
                    the latest published videos from your added channels. Never
                    miss out on fresh analysis opportunities.
                  </p>
                </div>
                <div className={`${cardClasses} p-6 rounded-lg shadow-md`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? "text-teal-300" : "text-indigo-500"
                    }`}
                  >
                    AI-Powered Analysis
                  </h3>
                  <p>
                    Click <strong>“Analyze”</strong> under any video to run our
                    cutting-edge AI on its transcript. Get stock picks,
                    justifications, and direct video timestamps for easy
                    navigation.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Additional Features Section */}
        <AnimatedSection>
          <section
            className={`py-12 px-6`}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">What Else Can You Do?</h2>
              <div className="grid gap-6 md:grid-cols-2 text-left">
                <div
                  className={`${cardClasses} p-6 rounded-lg shadow-md flex flex-col justify-center`}
                >
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? "text-teal-300" : "text-indigo-500"
                    }`}
                  >
                    Top 10 Recommended Stocks
                  </h3>
                  <p>
                    Our AI automatically highlights the top 10 most mentioned
                    (and recommended) stocks across all analyzed videos. See
                    which stocks the community is buzzing about.
                  </p>
                </div>
                <div
                  className={`${cardClasses} p-6 rounded-lg shadow-md flex flex-col justify-center`}
                >
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      isDark ? "text-teal-300" : "text-indigo-500"
                    }`}
                  >
                    Top 10 YouTube Channels
                  </h3>
                  <p>
                    Find out which YouTube channels are popular among
                    TubeStocks's users. Expand your watchlist by following new
                    channels with consistent stock insights.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* How It Works Section */}
        <AnimatedSection>
          <section className="py-12 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>
              <ol className="list-decimal list-inside space-y-4 text-left mx-auto md:max-w-xl">
                <li>
                  <strong>Sign in</strong> with Google for personalized access.
                </li>
                <li>
                  <strong>Search & Add</strong> any YouTube channels to your
                  custom list.
                </li>
                <li>
                  <strong>Refresh</strong> anytime to fetch newly published
                  videos.
                </li>
                <li>
                  <strong>Analyze</strong> each video for potential stock picks,
                  with direct links to the exact timestamps where those stocks
                  were mentioned.
                </li>
                <li>
                  <strong>Discover</strong> the Top 10 recommended stocks and
                  channels among all users.
                </li>
              </ol>
            </div>
          </section>
        </AnimatedSection>

        {/* Pricing Section */}
        <AnimatedSection>
          <section
            className={`py-12 px-6`}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">Pricing</h2>
              <p className="mb-8">
                Analyze <strong>10 videos</strong> for free every month. After
                that, subscribe for only <strong>$5/month</strong> to continue
                unlimited analysis.
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-8 ">
                {/* Free Plan */}
                <div
                  className={`${cardClasses} p-6 rounded-lg shadow-md max-w-sm mx-auto md:mx-0 glowing-border`}
                >
                  <h3
                    className={`text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-indigo-300 to-purple-300 font-bold`}
                  >
                    Free Plan
                  </h3>
                  <ul className="space-y-2 text-left">
                    <li>- Up to 10 video analyses</li>
                    <li>- Access to top 10 channels & stocks</li>
                    <li>- AI-powered transcript analysis</li>
                  </ul>
                  <div className="mt-6">
                    <span className="text-2xl font-bold">$0</span>
                    <span className="text-sm opacity-80">/month</span>
                  </div>
                </div>

                {/* Premium Plan */}
                <div
                  className={`${cardClasses} p-6 rounded-lg shadow-md max-w-sm mx-auto md:mx-0 glowing-border-tubestocks`}
                >
                  <h3
                    className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-bold`}
                  >
                    Premium Plan
                  </h3>
                  <ul className="space-y-2 text-left">
                    <li>- Unlimited video analyses</li>
                    <li>- Priority AI processing</li>
                    <li>- Exclusive future features</li>
                  </ul>
                  <div className="mt-6">
                    <span className="text-2xl font-bold">$5</span>
                    <span className="text-sm opacity-80">/month</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Footer */}
        <AnimatedSection>
          <footer
            className={`py-6 text-center`}
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
        </AnimatedSection>
      </div>
    </>
  );
}
