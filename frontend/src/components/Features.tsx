"use client";

import Image from "next/image";

export default function Features() {
  return (
    <div
      id="features"
      className="mx-auto max-w-7xl pt-20 lg:pt-[16.25rem] pb-8 lg:pb-0 select-none lg:border-x border-zinc-200 overflow-hidden"
    >
      {/* Section Header */}
      <div className="mx-auto max-w-2xl sm:text-center px-5 lg:px-0">
        <h2 className="text-lg/10 font-base text-zinc-500 uppercase">
          How it works
        </h2>
        <p className="mt-2 text-4xl font-medium tracking-tight text-pretty text-black sm:text-5xl sm:text-balance">
          HireSense helps with everything it checks and hears.
        </p>
      </div>

      {/* First Two Feature Cards (Side by Side) */}
      <div className="grid lg:grid-cols-2 mt-20 mb-16 lg:mb-0 pointer-events-none lg:border-y border-zinc-200 lg:divide-x divide-zinc-200">
        {/* Feature Card 1: "User Info Check" */}
        <div className="relative overflow-hidden">
          {/* Liquid Glass background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/15 to-pink-400/20"></div>
            <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <Image
              src="/cred.png"
              alt="Screen monitoring feature"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          
          <div className="px-8 py-6 relative z-10">
            <h2 className="text-2xl font-medium break-words">
              User Info Check
            </h2>
            <p className="mt-3 text-base leading-5 text-zinc-600 break-words">
              Upload a CV, LinkedIn, and GitHub. HireSense flags timeline gaps,
              fake profiles, and missing signals.
            </p>
          </div>
          <div className="hidden lg:block absolute bg-[#0055FE] w-1 h-[2.125rem] bottom-[4.5rem] -left-[1px] z-20"></div>
        </div>

        {/* Feature Card 2: "Reference Call Automation" */}
        <div className="relative overflow-hidden">
          {/* Liquid Glass background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 via-blue-400/15 to-indigo-400/20"></div>
            <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent"></div>
          </div>
          
          <div className="relative z-10">
            <Image
              src="/ref.png"
              alt="Reference Call Automation"
              width={600}
              height={400}
              className="w-full h-auto"
            />
          </div>
          
          <div className="px-8 py-6 relative z-10">
            <h2 className="text-2xl font-medium break-words">
              Reference Call Automation
            </h2>
            <p className="mt-3 text-base leading-5 text-zinc-600 break-words">
              Add past references — HireSense automates the call, transcribes
              responses, and checks them against the candidate&apos;s story.
            </p>
          </div>
          <div className="hidden lg:block absolute bg-[#0055FE] w-1 h-[2.125rem] bottom-[4.5rem] -left-[1px] z-20"></div>
        </div>
      </div>

      {/* Feature Card 3: "Live Interview Feedback" (Full Width) */}
      <div className="relative pointer-events-none lg:border-b border-zinc-200">
        <div className="grid lg:grid-cols-2">
          {/* Left side - Text and small image */}
          <div className="relative overflow-hidden">
            {/* Liquid Glass background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 via-fuchsia-400/15 to-purple-400/20"></div>
              <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20"></div>
            </div>
            
            <div className="px-8 py-12 lg:py-16 flex flex-col justify-start relative z-10">
              <div>
                <h2 className="text-2xl font-medium break-words">
                  Live Interview Feedback
                </h2>
                <p className="mt-3 text-base leading-5 text-zinc-600 break-words">
                  Get real-time prompts and live transcripts during calls.
                  HireSense highlights inconsistencies and suggests questions on
                  the spot.
                </p>
              </div>
              <div className="mt-6 mb-4 lg:mb-0">
                <Image
                  src="/cand.png"
                  alt="Additional feedback component"
                  width={400}
                  height={300}
                  className="w-full max-w-md h-auto"
                />
              </div>
            </div>
            <div className="hidden lg:block absolute bg-[#0055FE] w-1 h-[2.125rem] top-[4rem] -left-[1px] z-20"></div>
          </div>

          {/* Right side - Image */}
          <div className="relative overflow-hidden">
            {/* Liquid Glass background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-bl from-emerald-400/20 via-teal-400/15 to-cyan-400/20"></div>
              <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-white/30 to-transparent"></div>
            </div>
            
            <Image
              src="/gmeet.png"
              alt="Live Interview Feedback"
              width={600}
              height={400}
              className="w-full h-auto object-cover object-top relative z-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}