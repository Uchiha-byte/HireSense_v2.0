"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Judge0Result = {
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  status?: {
    id: number;
    description: string;
  };
};

type Judge0Payload = {
  language_id: number;
  source_code: string;
  stdin?: string;
  metadata?: {
    codingInterviewId: string;
  };
};

const LANGUAGE_PRESETS: { id: number; name: string; template: string }[] = [
  {
    id: 71,
    name: "Python 3",
    template: 'print("Hello, world!")',
  },
  {
    id: 63,
    name: "JavaScript (Node)",
    template: 'console.log("Hello, world!");',
  },
  {
    id: 54,
    name: "C++ (GCC)",
    template:
      "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  cout << \"Hello, world!\" << endl;\n  return 0;\n}\n",
  },
];

export default function CodingInterviewPage() {
  const params = useParams<{ id: string }>();
  const codingInterviewId = params?.id;

  const [languageId, setLanguageId] = useState<number>(71);
  const [sourceCode, setSourceCode] = useState<string>(
    LANGUAGE_PRESETS[0].template
  );
  const [stdin, setStdin] = useState<string>("");
  const [result, setResult] = useState<Judge0Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = (newId: number) => {
    setLanguageId(newId);
    const preset = LANGUAGE_PRESETS.find((l) => l.id === newId);
    if (preset) {
      setSourceCode(preset.template);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: Judge0Payload = {
        language_id: languageId,
        source_code: sourceCode,
        stdin: stdin || "",
      };

      // Attach coding interview identifier for potential logging/tracking
      if (codingInterviewId) {
        payload.metadata = { codingInterviewId };
      }

      const resp = await fetch("/api/judge0", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(
          data.error || "Execution failed. Please check your code and try again."
        );
      }

      const judge0Data: Judge0Result =
        data.judge0Response && typeof data.judge0Response === "object"
          ? data.judge0Response
          : {};

      setResult(judge0Data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const currentLang = LANGUAGE_PRESETS.find((l) => l.id === languageId);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500/80">
                Live Session Active
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Coding <span className="text-violet-400">Interview</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm max-w-xl">
              A high-performance sandboxed environment for live technical assessments.
              Powered by Judge0 for secure code execution.
            </p>
          </div>
          {codingInterviewId && (
            <div className="bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700/50">
              <span className="text-xs text-slate-500 block mb-1">Session ID</span>
              <code className="text-xs text-violet-300 font-mono">{codingInterviewId}</code>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Editor Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Select Language
                  </label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all appearance-none cursor-pointer hover:border-slate-600"
                    value={languageId}
                    onChange={(e) => handleLanguageChange(Number(e.target.value))}
                    disabled={loading}
                  >
                    {LANGUAGE_PRESETS.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-3">
                  <Button
                    onClick={handleRun}
                    disabled={loading}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all transform active:scale-95 flex items-center gap-2 shadow-lg shadow-violet-500/20"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Run Code
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -top-3 left-4 px-2 bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Source Code Editor
                </div>
                <textarea
                  className="w-full h-[500px] bg-slate-950/80 border border-slate-800 rounded-xl font-mono text-sm p-6 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/50 text-emerald-400 placeholder-slate-700 transition-all"
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  disabled={loading}
                  placeholder="// Write your code here..."
                  spellCheck={false}
                />
              </div>
            </div>
          </div>

          {/* Input & Output Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Standard Input
                </label>
                <textarea
                  className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500/30 resize-none transition-all"
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Input for your program..."
                  disabled={loading}
                />
              </div>

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Execution Output
                  </label>
                  {result && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${result.status?.id === 3 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                      {result.status?.description}
                    </span>
                  )}
                </div>

                <div className="flex-1 bg-black/40 rounded-xl border border-slate-800/50 p-4 font-mono text-xs overflow-auto relative min-h-[300px]">
                  {loading && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                        <span className="text-[10px] text-violet-400 font-bold uppercase">Processing...</span>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-red-400 p-2 bg-red-400/5 rounded border border-red-400/20">
                      <div className="font-bold mb-1 uppercase text-[10px]">Interface Error</div>
                      {error}
                    </div>
                  )}

                  {!loading && !error && !result && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                      <svg className="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Waiting for execution...
                    </div>
                  )}

                  {result && (
                    <div className="space-y-4">
                      {result.stdout && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="text-slate-500 font-bold mb-1.5 uppercase text-[9px] flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-slate-500" /> STDOUT
                          </div>
                          <pre className="text-emerald-400 whitespace-pre-wrap">{result.stdout}</pre>
                        </div>
                      )}

                      {result.stderr && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="text-red-400 font-bold mb-1.5 uppercase text-[9px] flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-red-400" /> STDERR
                          </div>
                          <pre className="text-red-300 whitespace-pre-wrap">{result.stderr}</pre>
                        </div>
                      )}

                      {result.compile_output && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="text-amber-400 font-bold mb-1.5 uppercase text-[9px] flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-amber-400" /> COMPILE OUTPUT
                          </div>
                          <pre className="text-amber-200 whitespace-pre-wrap">{result.compile_output}</pre>
                        </div>
                      )}

                      {result.message && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                          <div className="text-slate-500 font-bold mb-1.5 uppercase text-[9px] flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-slate-500" /> SYSTEM MESSAGE
                          </div>
                          <pre className="text-slate-300 bg-slate-800/50 p-2 rounded border border-slate-700/50 whitespace-pre-wrap">{result.message}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 pt-6 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-500 max-w-lg leading-relaxed">
            Judge0 Security Sandbox is active. Code execution is isolated. All session data is ephemeral and will be purged upon closure.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-help group">
              <svg className="w-3 h-3 text-slate-600 group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Execution Help
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-help group">
              <svg className="w-3 h-3 text-slate-600 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Sandbox verified
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

