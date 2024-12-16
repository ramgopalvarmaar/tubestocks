"use client";
import Head from "next/head";
import React, { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email, photoURL } = result.user;

      // Save user data to MongoDB
      const response = await fetch("/api/saveUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          email,
          image: photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save user data.");
      }

      setUser({ name: displayName, email, image: photoURL });
      router.push("/console");
    } catch (err) {
      console.error(err);
      setError("Failed to sign in with Google. Please try again.");
    }
  }

  return (
    <>
      {/* SEO Meta Tags */}
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

      {/* Landing Page Content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 text-white">
        {/* Hero Section */}
        <header className="text-center py-16 px-6">
          <h1 className="text-4xl font-extrabold text-white mb-4">
            <span className="text-blue-400">TubeStocks</span> - AI-Powered Stock Analysis
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Manage YouTube channels, auto-fetch recent videos, and analyze them with AI to extract actionable stock recommendations.
          </p>
          <div className="mt-6">
            {!user ? (
              <button
                onClick={handleGoogleLogin}
                className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition-all"
              >
                Sign in with Google
              </button>
            ) : (
              <div className="text-center">
                <p className="text-lg text-gray-300">Welcome, {user.name}!</p>
                <img
                  src={user.image}
                  alt={user.name}
                  className="rounded-full w-16 h-16 mx-auto mt-4"
                />
              </div>
            )}
          </div>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </header>

        {/* Features Section */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Why Choose TubeStocks?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Channel Management</h3>
                <p className="text-gray-300">
                  Search, add, and manage your favorite YouTube channels in one place.
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Auto-Fetch Videos</h3>
                <p className="text-gray-300">
                  Automatically fetch recent videos from your channels and analyze them with ease.
                </p>
              </div>
              <div className="bg-gray-800 bg-opacity-90 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">AI Analysis</h3>
                <p className="text-gray-300">
                  Extract actionable stock recommendations with timestamps and context using advanced AI.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 px-6 bg-gradient-to-br from-gray-900 to-indigo-900">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
            <ol className="list-decimal list-inside text-gray-300 space-y-4 text-left">
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
        <footer className="py-6 bg-gray-800 text-gray-300 text-center">
          <p>&copy; 2024 TubeStocks. All Rights Reserved.</p>
          <p>
            <a href="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </a>{" "}
            |{" "}
            <a href="/privacy" className="text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
