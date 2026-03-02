"use client";

import { useState, useEffect, useCallback } from "react";
import {
  History,
  Search,
  Filter,
  RefreshCcw,
  UserPlus,
  FileCheck,
  Flag,
  Trash2,
  Settings,
  PhoneCall,
  Cpu,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Calendar,
  Zap,
  Github,
  Linkedin,
  FileText
} from "lucide-react";
import Link from "next/link";

// ─── Types & Constants ────────────────────────────────────────────────────────
interface ActivityLog {
  id: string;
  event_type: string;
  title: string;
  description: string;
  applicant_id?: string;
  applicant_name?: string;
  metadata: any;
  created_at: string;
}

const EVENT_CONFIG: Record<string, { icon: any, color: string, bg: string }> = {
  applicant_created: { icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-100/80" },
  analysis_complete: { icon: FileCheck, color: "text-sky-600", bg: "bg-sky-100/80" },
  candidate_flagged: { icon: Flag, color: "text-rose-600", bg: "bg-rose-100/80" },
  applicant_deleted: { icon: Trash2, color: "text-slate-600", bg: "bg-slate-100/80" },
  settings_saved: { icon: Settings, color: "text-violet-600", bg: "bg-violet-100/80" },
  reference_called: { icon: PhoneCall, color: "text-amber-600", bg: "bg-amber-100/80" },
  cv_processed: { icon: FileText, color: "text-sky-600", bg: "bg-sky-100/80" },
  linkedin_fetched: { icon: Linkedin, color: "text-blue-600", bg: "bg-blue-100/80" },
  github_fetched: { icon: Github, color: "text-slate-700", bg: "bg-slate-200/80" },
  default: { icon: History, color: "text-slate-600", bg: "bg-slate-100/80" }
};

const glass = "bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg";

// ─── Component ────────────────────────────────────────────────────────────────
export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch("/api/activity?limit=50");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    // Poll every 30 seconds
    const interval = setInterval(() => fetchLogs(true), 30000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filterType === "all" || log.event_type === filterType;
    const matchesSearch = !searchQuery ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const eventTypes = ["all", ...Array.from(new Set(logs.map(l => l.event_type)))];

  return (
    <div className="min-h-screen select-none">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="px-8 pt-10 pb-6">
        <p className="text-sm text-slate-500 font-medium mb-1">Audit Trail</p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">System Activity</h1>
            <p className="text-slate-500 mt-1 text-sm">Real-time log of candidate processing, AI analysis, and system changes.</p>
          </div>
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/50 backdrop-blur-sm border border-white/70 rounded-xl text-slate-700 hover:bg-white/80 transition-all shadow-sm ${refreshing ? 'opacity-50' : ''}`}
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh Feed"}
          </button>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div className="px-8 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search activity, candidates or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/30 border border-white/50 rounded-xl">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none cursor-pointer"
            >
              {eventTypes.map(t => (
                <option key={t} value={t}>{t === "all" ? "All Events" : t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Activity Feed ────────────────────────────────────────────────────── */}
      <div className="px-8 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-violet-500 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Crunching history records...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className={`p-12 text-center ${glass}`}>
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <History className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No activity found</h3>
            <p className="text-slate-500 text-sm mt-1">Try adjusted filters or perform some actions in the dashboard.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log, idx) => {
              const config = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.default;
              const Icon = config.icon;
              const isAnalysis = log.event_type === 'analysis_complete' || log.event_type === 'candidate_flagged';

              return (
                <div
                  key={log.id}
                  className={`group relative ${glass} p-5 hover:bg-white/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-4`}
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start gap-5">
                    {/* Icon Column */}
                    <div className={`mt-1 h-12 w-12 rounded-2xl ${config.bg} flex items-center justify-center flex-shrink-0 border border-white ring-4 ring-white/20`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                          {log.title}
                          {log.event_type === 'candidate_flagged' && <span className="bg-rose-100 text-rose-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-rose-200">Alert</span>}
                          {log.event_type === 'analysis_complete' && log.metadata?.score > 80 && <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-200">Top Match</span>}
                        </h3>
                        <time className="text-xs text-slate-400 font-medium flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                        </time>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        {log.description}
                      </p>

                      <div className="flex items-center gap-4">
                        {log.applicant_id && (
                          <Link
                            href={`/board?id=${log.applicant_id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50/50 px-2.5 py-1 rounded-lg border border-violet-100 transition-colors"
                          >
                            <Zap className="h-3 w-3" /> View Candidate Profile <ArrowUpRight className="h-2.5 w-2.5" />
                          </Link>
                        )}

                        {/* Event Tags */}
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 bg-white/50 border border-white text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-tight">
                            {log.event_type.replace(/_/g, ' ')}
                          </span>
                          {log.metadata?.score !== undefined && (
                            <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full uppercase ${log.metadata.score > 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                              Score: {log.metadata.score}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Hint */}
                    <div className="hidden lg:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed -z-10 top-1/4 -right-24 w-96 h-96 bg-violet-200/20 blur-[100px] rounded-full" />
      <div className="fixed -z-10 bottom-1/4 -left-24 w-96 h-96 bg-pink-200/20 blur-[100px] rounded-full" />
    </div>
  );
}