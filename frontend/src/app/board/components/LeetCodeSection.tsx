'use client';

import { useState } from 'react';
import { LeetCodeData } from '@/lib/interfaces/leetcode';
import { Target, Trophy, Award, BarChart3, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface LeetCodeSectionProps {
    leetcodeData: LeetCodeData;
}

export default function LeetCodeSection({ leetcodeData }: LeetCodeSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate difficulty percentages
    const total = leetcodeData.totalSolved || 1;
    const easyPct = ((leetcodeData.easySolved || 0) / total) * 100;
    const mediumPct = ((leetcodeData.mediumSolved || 0) / total) * 100;
    const hardPct = ((leetcodeData.hardSolved || 0) / total) * 100;

    return (
        <div className="h-full">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/40 transition-colors border-b border-white/60 rounded-t-xl"
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl text-amber-500">
                        <Target className="h-6 w-6" />
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">LeetCode Profile</h3>
                    <a
                        href={leetcodeData.username ? `https://leetcode.com/u/${leetcodeData.username}` : "https://leetcode.com"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        @{leetcodeData.username || 'unknown'} <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                <div className="flex items-center gap-4">
                    {leetcodeData.contestData && (
                        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-700 text-xs font-bold border border-amber-200/60">
                            <Trophy className="h-3 w-3" /> {leetcodeData.contestData.rating}
                        </div>
                    )}
                    <span className="text-slate-400">
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </span>
                </div>
            </button>

            {isExpanded && (
                <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Solved Stats Card */}
                        <div className="md:col-span-2 bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-white/70 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4 text-violet-500" />
                                    Problem Solving Breakdown
                                </h4>
                                <span className="text-xs font-bold text-slate-500">
                                    Total Solved: <span className="text-slate-800">{leetcodeData.totalSolved}</span>
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Easy */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-emerald-600">Easy</span>
                                        <span className="text-slate-600">{leetcodeData.easySolved}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${easyPct}%` }} />
                                    </div>
                                </div>

                                {/* Medium */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-amber-500">Medium</span>
                                        <span className="text-slate-600">{leetcodeData.mediumSolved}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${mediumPct}%` }} />
                                    </div>
                                </div>

                                {/* Hard */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-rose-500">Hard</span>
                                        <span className="text-slate-600">{leetcodeData.hardSolved}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-rose-500 h-full rounded-full" style={{ width: `${hardPct}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ranking/Reputation Card */}
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5 border border-white/70 shadow-sm flex flex-col justify-center text-center">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Global Ranking</p>
                            <h5 className="text-2xl font-black text-slate-800 mb-4">#{(leetcodeData.ranking || 0).toLocaleString()}</h5>

                            <div className="pt-4 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reputation</p>
                                    <p className="text-sm font-bold text-slate-700">{leetcodeData.reputation}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Acceptance</p>
                                    <p className="text-sm font-bold text-slate-700">{(leetcodeData.acceptanceRate || 0).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contest Data if available */}
                    {leetcodeData.contestData && (
                        <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 rounded-2xl p-5 border border-amber-100/60 shadow-sm">
                            <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-4">
                                <Trophy className="h-4 w-4 text-amber-500" />
                                Contest Performance
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase">Rating</p>
                                    <p className="text-lg font-bold text-amber-900">{leetcodeData.contestData.rating}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase">Global Rank</p>
                                    <p className="text-lg font-bold text-amber-900">{(leetcodeData.contestData?.globalRanking || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase">Top %</p>
                                    <p className="text-lg font-bold text-amber-900">{(leetcodeData.contestData?.topPercentage || 0).toFixed(2)}%</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-amber-600/70 uppercase">Contests</p>
                                    <p className="text-lg font-bold text-amber-900">{leetcodeData.contestData.contestsCount}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Badges */}
                    {leetcodeData.badges && leetcodeData.badges.length > 0 && (
                        <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/50">
                            <h4 className="text-xs font-bold text-slate-500 flex items-center gap-2 mb-3 px-1">
                                <Award className="h-3.5 w-3.5 text-pink-500" />
                                EARNED BADGES
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {leetcodeData.badges.slice(0, 6).map((badge, idx) => (
                                    <div key={idx} className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/60 transition-all cursor-help">
                                        <img src={badge.icon} alt={badge.name} className="h-10 w-10 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold text-slate-600 text-center max-w-[60px] line-clamp-1">{badge.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
