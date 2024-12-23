"use client";

import React, { useState, useEffect, useContext } from "react";
import { signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter, usePathname } from "next/navigation";
import { UserContext } from "../context/UserContext";
import { FaSun, FaMoon } from "react-icons/fa";

export default function Navbar({ theme = "dark", onToggleTheme }) {
  const { user, setUser } = useContext(UserContext);
  const [showMenu, setShowMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isConsolePage = pathname === "/console";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    // Add prompt parameter to force account selection
    provider.setCustomParameters({
      prompt: "select_account", // Forces account selection every time
    });
    try {
      const result = await signInWithPopup(auth, provider);
      const { displayName, email, photoURL } = result.user;

      await fetch("/api/saveUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName, email, image: photoURL }),
      });

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
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-bold ${
                isConsolePage ? "ml-8 sm:ml-0" : ""
              }`}
            >
              TubeStocks
            </span>
            <span className="text-xs rounded py-1 ml-2">Beta</span>
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="relative">
              {isMobile ? (
                <>
                  <img
                    src={user.image}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full cursor-pointer"
                    onClick={() => setShowMenu((prev) => !prev)}
                  />
                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2">
                      <button
                        onClick={onToggleTheme}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {theme === "dark" ? (
                          <FaSun className="mr-2 text-yellow-500" />
                        ) : (
                          <FaMoon className="mr-2 text-gray-800" />
                        )}
                        Toggle Theme
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <img
                    src={user.image}
                    alt="User Avatar"
                    className="w-8 h-8 rounded-full cursor-pointer"
                  />
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-all rounded-3xl"
                  >
                    Logout
                  </button>
                  <button
                    onClick={onToggleTheme}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-xl transition-colors"
                  >
                    {theme === "dark" ? (
                      <FaSun className="text-yellow-500" />
                    ) : (
                      <FaMoon className="text-gray-800" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="bg-gray-700 px-4 py-2 rounded-md text-white hover:bg-gray-900 flex items-center space-x-2 transition-all rounded-3xl"
            >
              <img
                src="https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA"
                alt="Google Logo"
                className="w-5 h-5"
              />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
