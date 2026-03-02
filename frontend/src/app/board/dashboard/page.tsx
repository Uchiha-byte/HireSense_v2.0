"use client";

import { useApplicants } from "@/lib/contexts/ApplicantContext";
import { useEffect } from "react";
import { useSharedUserProfile } from "@/lib/contexts/UserProfileContext";
import {
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  Sliders,
  BarChart3,
  Clock,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

const glass = "bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg";

export default function DashboardPage() {
  const { applicants, fetchApplicants } = useApplicants();
  const { displayName } = useSharedUserProfile();

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const stats = {
    total: applicants.length,
    completed: applicants.filter((a) => a.status === "completed").length,
    processing: applicants.filter(
      (a) => a.status === "processing" || a.status === "analyzing" || a.status === "uploading"
    ).length,
    failed: applicants.filter((a) => a.status === "failed").length,
  };

  const completionRate = stats.total
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  const recentApplicants = applicants.slice(0, 6);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    {
      label: "Total Applicants",
      value: stats.total,
      icon: Users,
      color: "violet",
      bg: "from-violet-400 to-purple-400",
      lightBg: "bg-violet-50/80",
      textColor: "text-violet-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "emerald",
      bg: "from-emerald-400 to-teal-400",
      lightBg: "bg-emerald-50/80",
      textColor: "text-emerald-600",
    },
    {
      label: "Processing",
      value: stats.processing,
      icon: Loader2,
      color: "amber",
      bg: "from-amber-400 to-orange-400",
      lightBg: "bg-amber-50/80",
      textColor: "text-amber-600",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: AlertCircle,
      color: "rose",
      bg: "from-rose-400 to-red-400",
      lightBg: "bg-rose-50/80",
      textColor: "text-rose-600",
    },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: "bg-emerald-100/80 text-emerald-700 border-emerald-200/60",
      processing: "bg-amber-100/80 text-amber-700 border-amber-200/60",
      analyzing: "bg-sky-100/80 text-sky-700 border-sky-200/60",
      uploading: "bg-violet-100/80 text-violet-700 border-violet-200/60",
      failed: "bg-red-100/80 text-red-600 border-red-200/60",
    };
    return map[status] ?? "bg-slate-100/80 text-slate-600 border-slate-200/60";
  };

  return (
    <div className="min-h-screen select-none">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-8 pt-10 pb-6">
        <p className="text-sm text-slate-500 font-medium mb-1">Overview</p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {greeting()}{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Here&apos;s what&apos;s happening with your applicant pipeline today.
            </p>
          </div>
          <Link
            href="/board"
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <Plus className="h-4 w-4" /> New Applicant
          </Link>
        </div>
      </div>

      <div className="px-8 pb-12 space-y-6">
        {/* ── Stats Grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, bg, lightBg, textColor }) => (
            <div key={label} className={`${glass} p-5 relative overflow-hidden group hover:scale-[1.01] transition-all duration-200`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-0 group-hover:opacity-5 transition-opacity rounded-2xl`} />
              <div className={`w-10 h-10 rounded-xl ${lightBg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${textColor}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Completion Progress ──────────────────────────────────────────── */}
        {stats.total > 0 && (
          <div className={`${glass} px-6 py-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                <span className="text-sm font-semibold text-slate-700">Pipeline Completion Rate</span>
              </div>
              <span className="text-sm font-bold text-slate-700">{completionRate}%</span>
            </div>
            <div className="h-2.5 bg-white/50 border border-white/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {stats.completed} of {stats.total} applicants fully analyzed
            </p>
          </div>
        )}

        {/* ── Main Grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Applicants */}
          <div className={`${glass} lg:col-span-2 p-6`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-800">Recent Applicants</h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest candidates in your pipeline</p>
              </div>
              {applicants.length > 0 && (
                <Link href={`/board?id=${applicants[0].id}`} className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-semibold transition-colors">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {recentApplicants.length > 0 ? (
              <div className="space-y-2">
                {recentApplicants.map((applicant) => (
                  <Link
                    key={applicant.id}
                    href={`/board?id=${applicant.id}`}
                    className="flex items-center justify-between p-3 bg-white/30 hover:bg-white/60 border border-white/50 hover:border-white/70 rounded-xl transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {applicant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{applicant.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {applicant.cv_data?.jobTitle || applicant.li_data?.headline || "No role specified"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {applicant.cv_data && <span className="text-[10px] font-semibold bg-emerald-100/80 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">CV</span>}
                      {applicant.li_data && <span className="text-[10px] font-semibold bg-sky-100/80 text-sky-700 border border-sky-200/60 px-2 py-0.5 rounded-full">LI</span>}
                      {applicant.gh_data && <span className="text-[10px] font-semibold bg-violet-100/80 text-violet-700 border border-violet-200/60 px-2 py-0.5 rounded-full">GH</span>}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge(applicant.status)}`}>
                        {applicant.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 bg-slate-100/80 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium mb-4">No applicants yet</p>
                <Link href="/board" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all">
                  <Plus className="h-4 w-4" /> Add First Applicant
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={`${glass} p-6`}>
            <h2 className="text-base font-bold text-slate-800 mb-5">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { href: "/board", label: "New Analysis", desc: "Add a candidate and start analyzing", icon: Plus, color: "text-violet-600", bg: "bg-violet-50/80" },
                { href: "/board/personalize", label: "Configure AI", desc: "Set detection rules and presets", icon: Sliders, color: "text-sky-600", bg: "bg-sky-50/80" },
                { href: "/board/applicants", label: "All Applicants", desc: "View your full candidate list", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50/80" },
                { href: "/board/activity", label: "My Activity", desc: "Recent actions and history", icon: Clock, color: "text-amber-600", bg: "bg-amber-50/80" },
              ].map(({ href, label, desc, icon: Icon, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-4 p-3.5 bg-white/30 hover:bg-white/60 border border-white/50 hover:border-white/70 rounded-xl transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</p>
                    <p className="text-xs text-slate-500 truncate">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>

            {/* Mini analytics */}
            {stats.total > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-br from-violet-50/70 to-pink-50/70 border border-violet-100/60 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-semibold text-violet-700">Pipeline Health</span>
                </div>
                <p className="text-2xl font-bold text-violet-800">{completionRate}%</p>
                <p className="text-xs text-violet-600 mt-0.5">of candidates fully analyzed</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}