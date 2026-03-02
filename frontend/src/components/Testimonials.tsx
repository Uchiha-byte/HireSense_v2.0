"use client";

import { useEffect, useState, useRef } from "react";
// The unused 'Image' import has been removed.

export default function Testimonials() {
  const [showConfetti, setShowConfetti] = useState(false);
  const awardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // We only want to set it to true, never back to false
        if (entry.isIntersecting) {
          setShowConfetti(true);
        }
      },
      { threshold: 0.5 }
    );

    const currentRef = awardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []); // <-- Dependency array is now empty to run only once.

  return (
    <div
      id="testimonials"
      className="mx-auto max-w-7xl pt-20 lg:pt-[8rem] select-none lg:border-x border-zinc-200 overflow-hidden"
    >
      {/* Section Header with Floating Messages */}
      <div className="mx-auto max-w-3xl text-center px-5 lg:px-0 relative">
        {/* Liquid Glass Background behind "Stop hiring" section */}
        <div className="absolute inset-0 -mx-8 -my-12 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 via-purple-400/20 to-pink-400/30 rounded-3xl"></div>
          <div className="absolute inset-0 bg-white/50 backdrop-blur-3xl rounded-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/30 rounded-3xl"></div>
          <div className="absolute inset-0 border border-white/40 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]"></div>
        </div>

        {/* Floating iMessage-style testimonials - hidden on mobile */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {/* Top left messages */}
          <div className="absolute -top-8 -left-32 island-float-1">
            <div className="bg-gray-200 rounded-[20px] rounded-bl-[4px] px-4 py-2 max-w-[200px] shadow-sm">
              <p className="text-sm text-gray-800">
                &quot;This is amazing!&quot;
              </p>
            </div>
            <div className="flex items-center mt-1 ml-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                J
              </div>
              <span className="text-xs text-gray-500 ml-2">James</span>
            </div>
          </div>

          {/* Top right messages */}
          <div
            className="absolute -top-16 -right-40 island-float-2"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="bg-pink-500 rounded-[20px] rounded-br-[4px] px-4 py-2 max-w-[220px] shadow-sm">
              <p className="text-sm text-white">
                &quot;Game changer for HR!&quot;
              </p>
            </div>
            <div className="flex items-center justify-end mt-1 mr-2">
              <span className="text-xs text-gray-500 mr-2">Sarah</span>
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                S
              </div>
            </div>
          </div>

          {/* ... other floating messages ... */}
        </div>

        <h2 className="text-lg/10 font-base text-zinc-500 uppercase relative z-10">
          Testimonials
        </h2>
        <p className="mt-2 text-4xl font-medium tracking-tight text-pretty text-black sm:text-5xl sm:text-balance relative z-10">
          Stop hiring the wrong people.
        </p>
      </div>

      {/* Content Cards with Borders */}
      <div className="mt-20 mb-16 lg:mb-0 lg:border-y border-zinc-200">
        {/* Award Section */}
        <div ref={awardRef} className="relative lg:border-b border-zinc-200">
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="confetti absolute animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.8}s`,
                    backgroundColor: [
                      "#FFD700",
                      "#FFA500",
                      "#FF69B4",
                      "#00CED1",
                      "#98FB98",
                      "#DDA0DD",
                    ][Math.floor(Math.random() * 6)],
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Testimonial Section */}
        <div className="relative lg:border-b border-zinc-200">
          <div className="px-8 py-16 lg:py-20">
            <div className="text-center max-w-3xl mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}