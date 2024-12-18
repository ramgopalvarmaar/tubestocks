"use client";

import React, { useState, useEffect } from "react";
import { signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";

export default function Navbar({ theme = "dark", onToggleTheme }) {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName,
          image: currentUser.photoURL,
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email, photoURL } = result.user;

      const response = await fetch("/api/saveUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, email, image: photoURL }),
      });

      if (!response.ok) {
        throw new Error("Failed to save user data.");
      }

      setUser({ name: displayName, email, image: photoURL });
      router.push("/console");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    router.push("/");
  }

  const navBgClass = theme === "dark" ? "bg-[#202124]" : "bg-white";
  const textClass = theme === "dark" ? "text-gray-300" : "text-gray-900";

  return (
    <nav className={`${navBgClass} ${textClass} py-4 px-6 shadow-md sticky top-0 z-50 transition-colors duration-300`}>
      <div className="max-w-9xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/console" className="text-2xl font-normal">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              TubeStocks
            </span>
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
         

          {/* Login/Logout */}
          {user ? (
            <div className="flex items-center space-x-4">
              {user.image && (
                <img src={user.image} alt="User Avatar" className="w-8 h-8 rounded-full" />
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 px-4 py-2 rounded-md text-white hover:bg-red-600 transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="bg-indigo-500 px-4 py-2 rounded-md text-white hover:bg-indigo-600 transition-all"
            >
              Login with Google
            </button>
          )}

           {/* Theme Toggle */}
           <div className="relative">
            <label
              htmlFor="theme-toggle"
              className="flex items-center cursor-pointer"
            >
              <div className="relative">
                <input
                  type="checkbox"
                  id="theme-toggle"
                  className="sr-only"
                  checked={theme === "dark"}
                  onChange={onToggleTheme}
                />
                <div
                  className={`block w-10 h-6 rounded-full ${
                    theme === "dark" ? "bg-gray-600" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`dot absolute top-0.5 left-1 w-5 h-5 rounded-full transition ${
                    theme === "dark" ? "bg-teal-300 translate-x-4" : "bg-gray-800"
                  }`}
                ></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </nav>
  );
}
