import React, { useEffect, useState } from "react";
import { Applicant } from "@/lib/interfaces/applicant";
import { Check, Loader2, AlertCircle, Cpu, Shield, Zap, Search, Globe, Database, BrainCircuit } from "lucide-react";

interface ProcessingLoaderProps {
  status: "uploading" | "processing" | "analyzing";
  fileName?: string;
  applicant?: Applicant;
}

export default function ProcessingLoader({ applicant }: ProcessingLoaderProps) {
  const [activeLogic, setActiveLogic] = useState<string>("Initializing Neural engine...");

  const logicPhrases = [
    "Analyzing semantic career trajectories...",
    "Cross-referencing GitHub activity patterns...",
    "Verifying LinkedIn credential entropy...",
    "Calculating LeetCode problem-solving velocity...",
    "Detecting resume-skill alignment anomalies...",
    "Synthesizing multi-source credibility vectors...",
    "Generating deep neural talent fingerprints...",
    "Validating project impact coefficients...",
    "Optimizing talent matching heuristics..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomPhrase = logicPhrases[Math.floor(Math.random() * logicPhrases.length)];
      setActiveLogic(randomPhrase);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getStepStatus = (stepStatus: string) => {
    switch (stepStatus) {
      case "ready": return "completed";
      case "processing": return "active";
      case "error": return "error";
      case "not_provided": return "skipped";
      case "pending": return "pending";
      default: return "pending";
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50/30">
      <div className="relative w-full max-w-2xl bg-white/40 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 p-10 lg:p-16 overflow-hidden">

        {/* Animated Background Gradients */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Central Neural Pulse Orb */}
        <div className="relative flex justify-center mb-16">
          <div className="relative w-48 h-48">
            {/* Outer Ring 1 */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-violet-200/60 animate-[spin_10s_linear_infinite]" />
            {/* Outer Ring 2 */}
            <div className="absolute inset-2 rounded-full border border-pink-200/40 animate-[spin_15s_linear_infinite_reverse]" />

            {/* The Orb */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 backdrop-blur-md border border-white/40 shadow-inner flex items-center justify-center group overflow-hidden">
              {/* Pulse Core */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-br from-violet-500/40 to-pink-500/40 animate-pulse blur-sm" />

              {/* Scanning Laser Line */}
              <div className="absolute w-[200%] h-px bg-white/80 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_3s_ease-in-out_infinite] top-0 left-[-50%]" />

              <BrainCircuit className="w-12 h-12 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] z-10" />
            </div>

            {/* Orbiting Particles */}
            <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_#8b5cf6]" />
            </div>
            <div className="absolute inset-0 animate-[spin_12s_linear_infinite_reverse]">
              <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_10px_#ec4899]" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 text-center space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">HireSensing Profiles</h2>
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-ping" />
              <p className="text-sm font-mono font-medium tracking-wide uppercase">{activeLogic}</p>
            </div>
          </div>

          {/* Individual Stage Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {applicant && (
              <>
                <ProcessingStage
                  icon={<Database className="w-4 h-4" />}
                  label="Core CV Logic"
                  status={getStepStatus(applicant.cv_status)}
                />
                <ProcessingStage
                  icon={<Globe className="w-4 h-4" />}
                  label="LinkedIn Pulse"
                  status={getStepStatus(applicant.li_status)}
                />
                <ProcessingStage
                  icon={<Cpu className="w-4 h-4" />}
                  label="GitHub Velocity"
                  status={getStepStatus(applicant.gh_status)}
                />
                <ProcessingStage
                  icon={<Zap className="w-4 h-4" />}
                  label="LeetCode Engine"
                  status={getStepStatus(applicant.lc_status)}
                />
              </>
            )}
          </div>

          {/* AI Master Analyis Stage - Full Width */}
          <div className="pt-4 mt-4 border-t border-slate-200/40">
            <ProcessingStage
              icon={<Search className="w-4 h-4" />}
              label="Deep Neural Credibility Verification"
              status={getStepStatus(applicant?.ai_status || "pending")}
              isMajor={true}
            />
          </div>

          {/* Footer Warning */}
          {applicant?.status === "failed" && (
            <div className="flex items-center justify-center gap-2 text-red-500 bg-red-50/50 p-4 rounded-xl border border-red-100">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm font-bold">Neural verification encounterd a critical failure. Please retry.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(192px); }
        }
      `}</style>
    </div>
  );
}

interface ProcessingStageProps {
  icon: React.ReactNode;
  label: string;
  status: "pending" | "active" | "completed" | "error" | "skipped";
  isMajor?: boolean;
}

function ProcessingStage({ icon, label, status, isMajor = false }: ProcessingStageProps) {
  const statusConfig = {
    completed: { color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", icon: <Check className="w-4 h-4" /> },
    active: { color: "text-violet-600", bg: "bg-violet-50/80", border: "border-violet-200/60 shadow-sm shadow-violet-100", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    error: { color: "text-red-600", bg: "bg-red-50/50", border: "border-red-100", icon: <AlertCircle className="w-4 h-4" /> },
    skipped: { color: "text-slate-400", bg: "bg-slate-50/30", border: "border-slate-100", icon: <span className="text-[10px] font-bold">NA</span> },
    pending: { color: "text-slate-400", bg: "bg-transparent", border: "border-slate-100/50", icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> }
  };

  const config = statusConfig[status];

  return (
    <div className={`
      flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-500
      ${config.bg} ${config.border} ${isMajor ? 'md:col-span-2 py-4 px-6' : ''}
    `}>
      <div className={`p-2 rounded-xl bg-white/80 shadow-sm ${config.color}`}>
        {status === "active" ? config.icon : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${config.color}`}>{label}</p>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color} opacity-70`}>
            {status}
          </span>
          {status === "active" && (
            <div className="flex gap-0.5">
              <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce" />
              <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1 h-1 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
            </div>
          )}
        </div>
      </div>
      {status === "completed" && (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}
    </div>
  );
}
