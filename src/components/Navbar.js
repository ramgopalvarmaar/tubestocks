"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useRouter } from "next/navigation";

export default function Navbar() {
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

  async function handleLogout() {
    await signOut(auth);
    router.push("/"); // Redirect to the landing page after logout
  }

  return (
    <nav className="bg-gray-900 text-white py-4 px-6 shadow-md">
      <div className="max-w-9xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <a href="/console" className="text-2xl font-bold text-blue-400">
           TubeStocks
          </a>
        </div>

        {/* User Info and Logout */}
        {user ? (
          <div className="flex items-center space-x-4">
            {/* User Info */}
            <div className="flex items-center space-x-2">
              {user.image && (
                <img
                  src={user.image}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-gray-300 font-medium">{user.name}</span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded-md text-white hover:bg-red-600 transition-all"
            >
              Logout
            </button>
          </div>
        ) : (
          <a
            href="/"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Login
          </a>
        )}
      </div>
    </nav>
  );
}
