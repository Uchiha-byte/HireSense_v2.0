"use client";

import { useEffect } from "react";
import { Github } from "lucide-react";

export default function Footer() {
  useEffect(() => {
    const handleBackToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const backToTopButton = document.getElementById("back-to-top");
    if (backToTopButton) {
      backToTopButton.addEventListener("click", handleBackToTop);
      return () =>
        backToTopButton.removeEventListener("click", handleBackToTop);
    }
  }, []);

  return (
    <footer className="bg-black text-white py-8 select-none">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-4">
        {/* Left Side */}
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
          <span>HireSense 2026. All Rights Reserved</span>
          <span className="hidden md:block">•</span>
          <a
            href="mailto:info@HireSense.click"
            className="flex items-center gap-2 hover:text-pink-400 transition-colors"
          >
            <svg
              className="size-4 text-pink-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
            </svg>
            info@HireSense.click
          </a>
          <span className="hidden md:block">•</span>
          <span className="flex items-center gap-2"></span>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/Uchiha-byte"
            className="flex items-center gap-2 text-sm hover:text-pink-400 transition-colors"
          >
            <Github className="size-4" />
            GitHub
          </a>
          <button
            id="back-to-top"
            className="text-sm hover:text-pink-400 transition-colors"
            suppressHydrationWarning
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
