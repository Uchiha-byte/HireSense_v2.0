"use client";

import { useState, useRef, useCallback } from "react";
import { useApplicants } from "@/lib/contexts/ApplicantContext";
import {
  Upload,
  FileText,
  Linkedin,
  Github,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  X,
  AlertCircle,
  Loader2,
  Code2,
} from "lucide-react";

interface NewApplicantFormProps {
  onSuccess?: (applicantId: string) => void;
}

// ─── Drag-and-drop file zone ──────────────────────────────────────────────────
function DropZone({
  onDrop,
  accept,
  file,
  disabled = false,
}: {
  onDrop: (f: File) => void;
  accept: string;
  file: File | null;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files[0];
    if (f) onDrop(f);
  };

  return (
    <div
      onClick={() => !disabled && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10 px-6 text-center
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${dragging ? "border-violet-400 bg-violet-50/60 scale-[1.01]" :
          file ? "border-emerald-400/60 bg-emerald-50/40" :
            "border-slate-300/60 hover:border-violet-300 hover:bg-violet-50/30 bg-white/20"}`}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onDrop(f); }}
      />
      {file ? (
        <>
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 border border-emerald-200/60 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Ready</p>
          </div>
        </>
      ) : (
        <>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragging ? "bg-violet-100 border border-violet-200" : "bg-white/50 border border-white/70"}`}>
            <Upload className={`h-6 w-6 ${dragging ? "text-violet-500" : "text-slate-400"}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {dragging ? "Drop it here!" : "Drop PDF here"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">or click to browse · PDF up to 10MB</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export function NewApplicantForm({ onSuccess }: NewApplicantFormProps) {
  const { createApplicant, isLoading: applicantLoading } = useApplicants();

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [leetcodeUrl, setLeetcodeUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = applicantLoading;

  const resetForm = useCallback(() => {
    setCvFile(null);
    setLinkedinUrl("");
    setGithubUrl("");
    setLeetcodeUrl("");
    setError(null);
  }, []);

  const handleSubmit = async () => {
    if (!cvFile && !linkedinUrl.trim()) {
      setError("Please provide a CV file or LinkedIn profile URL to continue.");
      return;
    }
    setError(null);
    setIsCreating(true);
    try {
      const applicantId = await createApplicant({
        cvFile: cvFile || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
        leetcodeUrl: leetcodeUrl.trim() || undefined,
      });
      if (applicantId) {
        resetForm();
        onSuccess?.(applicantId);
      } else {
        setError("Failed to create applicant. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = (cvFile || linkedinUrl.trim()) && !isCreating && !isLoading;

  // What data sources user has provided
  const sources = [
    { key: "cv", label: "CV", active: !!cvFile, color: "emerald" },
    { key: "linkedin", label: "LinkedIn", active: !!linkedinUrl.trim(), color: "sky" },
    { key: "github", label: "GitHub", active: !!githubUrl.trim(), color: "violet" },
    { key: "leetcode", label: "LeetCode", active: !!leetcodeUrl.trim(), color: "amber" },
  ];

  return (
    <div className="w-full">
      {/* Intro header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">AI Analysis</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Analyze New Candidate</h2>
        <p className="text-slate-500 text-sm">
          Provide at least one data source. The more you add, the more accurate the credibility analysis.
        </p>
      </div>

      {/* Data source indicators */}
      <div className="flex gap-2 mb-6">
        {sources.map((s) => (
          <div
            key={s.key}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
              ${s.active
                ? s.color === "emerald" ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/60"
                  : s.color === "sky" ? "bg-sky-100/80 text-sky-700 border-sky-200/60"
                    : s.color === "amber" ? "bg-amber-100/80 text-amber-700 border-amber-200/60"
                      : "bg-violet-100/80 text-violet-700 border-violet-200/60"
                : "bg-white/30 text-slate-400 border-white/50"}`}
          >
            {s.active
              ? <CheckCircle2 className="h-3 w-3" />
              : <div className="h-3 w-3 rounded-full border border-current opacity-40" />}
            {s.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CV Drop Zone */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600" />
            <label className="text-sm font-semibold text-slate-700">
              CV / Resume <span className={linkedinUrl.trim() ? "text-slate-400 font-normal text-xs" : "text-rose-400"}>
                {linkedinUrl.trim() ? "(optional)" : "required"}
              </span>
            </label>
          </div>
          <DropZone
            onDrop={setCvFile}
            accept=".pdf"
            file={cvFile}
            disabled={isCreating || isLoading}
          />
          {cvFile && (
            <button
              onClick={() => setCvFile(null)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors w-fit"
            >
              <X className="h-3 w-3" /> Remove file
            </button>
          )}
        </div>

        {/* URLs */}
        <div className="flex flex-col gap-4">
          {/* LinkedIn */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Linkedin className="h-4 w-4 text-sky-600" />
              <label className="text-sm font-semibold text-slate-700">
                LinkedIn Profile <span className={cvFile ? "text-slate-400 font-normal text-xs" : "text-rose-400"}>
                  {cvFile ? "(optional)" : "required"}
                </span>
              </label>
            </div>
            <div className="relative">
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                disabled={isCreating || isLoading}
                className={`w-full pl-4 pr-10 py-3 text-sm rounded-xl border bg-white/40 backdrop-blur-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300/60 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${linkedinUrl.trim().includes("linkedin.com")
                    ? "border-sky-300/60 focus:border-sky-300"
                    : "border-white/60 focus:border-sky-300"}`}
              />
              {linkedinUrl.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {linkedinUrl.includes("linkedin.com")
                    ? <CheckCircle2 className="h-4 w-4 text-sky-500" />
                    : <XCircle className="h-4 w-4 text-amber-400" />}
                </div>
              )}
            </div>
            {linkedinUrl.trim() && !linkedinUrl.includes("linkedin.com") && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Should be a linkedin.com URL
              </p>
            )}
          </div>

          {/* GitHub */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Github className="h-4 w-4 text-violet-600" />
              <label className="text-sm font-semibold text-slate-700">
                GitHub Profile <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                disabled={isCreating || isLoading}
                className={`w-full pl-4 pr-10 py-3 text-sm rounded-xl border bg-white/40 backdrop-blur-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300/60 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${githubUrl.trim().includes("github.com")
                    ? "border-violet-300/60 focus:border-violet-300"
                    : "border-white/60 focus:border-violet-300"}`}
              />
              {githubUrl.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {githubUrl.includes("github.com")
                    ? <CheckCircle2 className="h-4 w-4 text-violet-500" />
                    : <XCircle className="h-4 w-4 text-amber-400" />}
                </div>
              )}
            </div>
            {githubUrl.trim() && !githubUrl.includes("github.com") && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Should be a github.com URL
              </p>
            )}
          </div>

          {/* LeetCode */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Code2 className="h-4 w-4 text-amber-600" />
              <label className="text-sm font-semibold text-slate-700">
                LeetCode Profile <span className="text-slate-400 font-normal text-xs">(optional)</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="url"
                value={leetcodeUrl}
                onChange={(e) => setLeetcodeUrl(e.target.value)}
                placeholder="https://leetcode.com/username"
                disabled={isCreating || isLoading}
                className={`w-full pl-4 pr-10 py-3 text-sm rounded-xl border bg-white/40 backdrop-blur-sm
                  text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300/60 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${leetcodeUrl.trim().includes("leetcode.com")
                    ? "border-amber-300/60 focus:border-amber-300"
                    : "border-white/60 focus:border-amber-300"}`}
              />
              {leetcodeUrl.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {leetcodeUrl.includes("leetcode.com")
                    ? <CheckCircle2 className="h-4 w-4 text-amber-500" />
                    : <XCircle className="h-4 w-4 text-amber-400" />}
                </div>
              )}
            </div>
            {leetcodeUrl.trim() && !leetcodeUrl.includes("leetcode.com") && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Should be a leetcode.com URL
              </p>
            )}
          </div>

          {/* Analysis features preview */}
          <div className="mt-1 p-4 bg-gradient-to-br from-violet-50/70 to-pink-50/70 border border-violet-100/60 rounded-xl">
            <p className="text-xs font-semibold text-violet-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> What we'll analyze
            </p>
            <ul className="space-y-1">
              {[
                { active: !!cvFile, label: "Skills & experience verification" },
                { active: !!linkedinUrl.trim(), label: "LinkedIn profile cross-reference" },
                { active: !!githubUrl.trim(), label: "GitHub activity & code analysis" },
                { active: !!leetcodeUrl.trim(), label: "LeetCode problem-solving stats" },
                { active: !!(cvFile && linkedinUrl.trim()), label: "CV vs LinkedIn consistency check" },
              ].map(({ active, label }) => (
                <li key={label} className={`flex items-center gap-2 text-xs transition-colors ${active ? "text-violet-700" : "text-slate-400"}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "bg-violet-200" : "bg-slate-100"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-violet-600" : "bg-slate-300"}`} />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-5 flex items-start gap-3 px-4 py-3 bg-red-50/80 border border-red-200/60 rounded-xl backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Submit */}
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
            ${isFormValid
              ? "bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing candidate…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Start AI Analysis
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
        {!isFormValid && !isCreating && (
          <p className="text-xs text-slate-400 text-center mt-2">
            Add a CV or LinkedIn URL to continue
          </p>
        )}
      </div>
    </div>
  );
}
