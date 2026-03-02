"use client";

import { useState, useEffect } from "react";
import {
  Sliders,
  BookOpen,
  Bell,
  Plus,
  X,
  Check,
  Search,
  ChevronDown,
  FileText,
  Github,
  Linkedin,
  Upload,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  AlertCircle,
  Info,
  Zap,
  Shield,
  Target,
  BarChart3,
  Clock,
  MessageSquare,
  Eye,
  EyeOff,
  Star,
  Copy,
} from "lucide-react";
import { useApplicants } from "@/lib/contexts/ApplicantContext";
import { useSettings, Preset, ScoringWeight, InterviewSettings, NotificationSettings } from "@/lib/contexts/SettingsContext";

// ─── Constants & Helpers ──────────────────────────────────────────────────────
const TABS = [
  { id: "presets", label: "Interview Presets", icon: BookOpen },
  { id: "scoring", label: "Scoring Weights", icon: BarChart3 },
  { id: "interview", label: "Interview Settings", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const categoryColors: Record<string, string> = {
  technical: "bg-violet-100/80 text-violet-700 border-violet-200/60",
  behavioral: "bg-sky-100/80 text-sky-700 border-sky-200/60",
  executive: "bg-amber-100/80 text-amber-700 border-amber-200/60",
  custom: "bg-emerald-100/80 text-emerald-700 border-emerald-200/60",
};

const colorMap: Record<string, string> = {
  violet: "bg-violet-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

const glass = "bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg";
const glassStrong = "bg-white/60 backdrop-blur-2xl border border-white/70 rounded-2xl shadow-xl";

// ─── Component ────────────────────────────────────────────────────────────────
export default function PersonalizePage() {
  const { settings, saveSettings, loading: settingsLoading, saving: serverSaving, lastSaved } = useSettings();
  const { applicants, fetchApplicants } = useApplicants();

  const [activeTab, setActiveTab] = useState("presets");
  const [selectedPreset, setSelectedPreset] = useState<Preset>(settings.presets[0]);
  const [editingPreset, setEditingPreset] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [showCandidateOverlay, setShowCandidateOverlay] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [loadedCandidate, setLoadedCandidate] = useState<Record<string, any> | null>(null);

  // Local form state for settings
  const [localWeights, setLocalWeights] = useState<ScoringWeight[]>(settings.scoringWeights);
  const [localInterview, setLocalInterview] = useState<InterviewSettings>(settings.interviewSettings);
  const [localNotifications, setLocalNotifications] = useState<NotificationSettings>(settings.notifications);

  const [newPreset, setNewPreset] = useState({ title: "", description: "", category: "custom" as Preset["category"], prompt: "" });
  const [showPrompt, setShowPrompt] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Sync from context when settings load
  useEffect(() => {
    if (!settingsLoading) {
      setLocalWeights(settings.scoringWeights);
      setLocalInterview(settings.interviewSettings);
      setLocalNotifications(settings.notifications);

      const currentSelected = settings.presets.find(p => p.id === selectedPreset?.id) || settings.presets[0];
      if (currentSelected) {
        setSelectedPreset(currentSelected);
        setEditContent(currentSelected.prompt);
      }
    }
  }, [settingsLoading, settings]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Preset handlers
  const selectPreset = (p: Preset) => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    setSelectedPreset(p);
    setEditContent(p.prompt);
    setIsDirty(false);
    setEditingPreset(false);
  };

  const handleSavePreset = async () => {
    if (!isDirty || serverSaving) return;
    const updatedPresets = settings.presets.map(p =>
      p.id === selectedPreset.id ? { ...p, prompt: editContent } : p
    );
    const success = await saveSettings({ presets: updatedPresets });
    if (success) {
      setEditingPreset(false);
      setIsDirty(false);
      showToast("Preset saved successfully!");
    } else {
      showToast("Failed to save preset.", "error");
    }
  };

  const handleSetActivePreset = async (id: string) => {
    const success = await saveSettings({ activePresetId: id });
    if (success) showToast("Active preset updated!");
  };

  const handleDeletePreset = async (id: string) => {
    if (settings.presets.find(p => p.id === id)?.isDefault) {
      showToast("Cannot delete a default preset.", "error");
      return;
    }
    const filtered = settings.presets.filter(p => p.id !== id);
    const success = await saveSettings({ presets: filtered });
    if (success) {
      if (selectedPreset.id === id) {
        setSelectedPreset(settings.presets[0]);
        setEditContent(settings.presets[0].prompt);
      }
      showToast("Preset deleted.");
    }
  };

  const handleDuplicatePreset = async (p: Preset) => {
    const copy: Preset = { ...p, id: Date.now().toString(), title: p.title + " (Copy)", isDefault: false };
    const success = await saveSettings({ presets: [...settings.presets, copy] });
    if (success) showToast("Preset duplicated!");
  };

  const handleAddPreset = async () => {
    if (!newPreset.title.trim() || !newPreset.prompt.trim()) return;
    const p: Preset = {
      id: Date.now().toString(),
      title: newPreset.title.trim(),
      description: newPreset.description.trim(),
      category: newPreset.category,
      prompt: newPreset.prompt.trim()
    };
    const success = await saveSettings({ presets: [...settings.presets, p] });
    if (success) {
      setShowAddPreset(false);
      setNewPreset({ title: "", description: "", category: "custom", prompt: "" });
      showToast("New preset created!");
    }
  };

  // Scoring weight handlers
  const handleWeightChange = (key: string, val: number) => {
    const others = localWeights.filter((w) => w.key !== key);
    const totalOthers = others.reduce((s, w) => s + w.value, 0);
    const capped = Math.min(val, 100 - others.length);
    const remaining = 100 - capped;
    const factor = totalOthers > 0 ? remaining / totalOthers : 1;

    const nextWeights = localWeights.map((w) =>
      w.key === key ? { ...w, value: capped } : { ...w, value: Math.max(1, Math.round(w.value * factor)) }
    );
    setLocalWeights(nextWeights);
  };

  const handleSaveWeights = async () => {
    const success = await saveSettings({ scoringWeights: localWeights });
    if (success) showToast("Scoring weights saved!");
  };

  const handleSaveInterviewSettings = async () => {
    const success = await saveSettings({ interviewSettings: localInterview });
    if (success) showToast("Interview settings saved!");
  };

  const handleSaveNotifications = async () => {
    const success = await saveSettings({ notifications: localNotifications });
    if (success) showToast("Notification preferences saved!");
  };

  const filteredCandidates = applicants.filter((a) => {
    const q = candidateSearch.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
  });

  if (settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen select-none relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border backdrop-blur-xl text-sm font-medium transition-all duration-300 ${toast.type === "success" ? "bg-emerald-50/90 border-emerald-200 text-emerald-800" : "bg-red-50/90 border-red-200 text-red-700"}`}>
          {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="px-8 pt-10 pb-6">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-1">
          <span>Configuration</span>
          {lastSaved && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px]">
              <Check className="h-2.5 w-2.5" /> Auto-saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Personalize HireSense</h1>
            <p className="text-slate-500 mt-1 text-sm">Customize AI analysis rules, scoring logic, and interview automation.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowCandidateOverlay(true); fetchApplicants(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/50 backdrop-blur-sm border border-white/70 rounded-xl text-slate-700 hover:bg-white/80 transition-all shadow-sm"
            >
              <Upload className="h-4 w-4" /> Load Candidate
            </button>
            <button
              onClick={() => setShowAddPreset(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02]"
            >
              <Plus className="h-4 w-4" /> New Preset
            </button>
          </div>
        </div>

        {/* Loaded candidate chip */}
        {loadedCandidate && (
          <div className={`mt-4 flex items-center gap-3 px-5 py-3 rounded-xl ${glass} border-emerald-200/60 transition-all animate-in fade-in slide-in-from-top-2`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center flex-shrink-0">
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Previewing with: {loadedCandidate.name}</p>
              <p className="text-xs text-slate-500">Global settings will be applied to this candidate during the next analysis run.</p>
            </div>
            <button onClick={() => setLoadedCandidate(null)} className="p-1 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────────────── */}
      <div className="px-8 mb-6">
        <div className={`inline-flex ${glass} p-1 gap-1`}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === tab.id ? "bg-white/80 text-slate-800 shadow-sm border border-white/80" : "text-slate-500 hover:text-slate-700 hover:bg-white/30"}`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <div className="px-8 pb-12">

        {/* ── PRESETS TAB ── */}
        {activeTab === "presets" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider ml-1 mb-3">Templates ({settings.presets.length})</h2>
              {settings.presets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => selectPreset(p)}
                  className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${selectedPreset?.id === p.id ? "bg-white/70 border-white/80 shadow-lg ring-2 ring-violet-200/60" : "bg-white/25 border-white/40 hover:bg-white/50 hover:border-white/60"} backdrop-blur-xl`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-slate-800">{p.title}</h3>
                        {settings.activePresetId === p.id && <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full uppercase tracking-tighter border border-emerald-200">Active</div>}
                        {p.isDefault && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryColors[p.category]}`}>{p.category}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{p.description || p.prompt.slice(0, 60) + "..."}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleDuplicatePreset(p); }} title="Duplicate" className="p-1.5 rounded-lg hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {!p.isDefault && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePreset(p.id); }} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50/80 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`xl:col-span-2 ${glass} p-6 flex flex-col`}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-800">{selectedPreset?.title}</h2>
                    {settings.activePresetId !== selectedPreset?.id && (
                      <button
                        onClick={() => handleSetActivePreset(selectedPreset.id)}
                        className="text-[10px] font-bold text-violet-600 hover:text-violet-700 underline underline-offset-2"
                      >
                        Set as Active
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedPreset?.description || "Detection rules prompt"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPrompt(!showPrompt)} className="p-2 rounded-xl hover:bg-white/50 text-slate-400 hover:text-slate-700 transition-colors" title={showPrompt ? "Hide" : "Show"}>
                    {showPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {editingPreset ? (
                    <>
                      <button onClick={() => { setEditingPreset(false); setEditContent(selectedPreset.prompt); setIsDirty(false); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200/60 rounded-xl hover:bg-white/50 transition-all">
                        <RotateCcw className="h-3.5 w-3.5" /> Discard
                      </button>
                      <button onClick={handleSavePreset} disabled={!isDirty || serverSaving} className={`flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-xl transition-all ${isDirty ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:shadow-md" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                        <Save className="h-3.5 w-3.5" />{serverSaving ? "Saving…" : "Save"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setEditingPreset(true)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-white/60 border border-white/70 rounded-xl text-slate-700 hover:bg-white/80 transition-all shadow-sm">
                      <Edit3 className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>

              {showPrompt && (
                editingPreset ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => { setEditContent(e.target.value); setIsDirty(true); }}
                    className="flex-1 min-h-[340px] w-full text-sm text-slate-800 bg-white/50 border border-white/60 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300/60 font-mono leading-relaxed placeholder-slate-400"
                    placeholder="Write your detection prompt…"
                    autoFocus
                  />
                ) : (
                  <div className="flex-1 bg-white/30 border border-white/50 rounded-xl p-5 overflow-y-auto">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{selectedPreset?.prompt}</pre>
                  </div>
                )
              )}

              <div className={`mt-4 flex gap-3 p-4 rounded-xl bg-violet-50/50 border border-violet-100/60`}>
                <Info className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-violet-700 leading-relaxed">
                  <strong>Tip:</strong> These rules guide the AI in evaluating candidate credibility. Be specific about what metrics or red flags to prioritize during the analysis phase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── SCORING WEIGHTS TAB ── */}
        {activeTab === "scoring" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${glass} p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Credibility Score Weights</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Adjust contribution per dimension. Total: {localWeights.reduce((s, w) => s + w.value, 0)}%</p>
                </div>
                <div className={`text-lg font-bold px-4 py-2 rounded-xl ${localWeights.reduce((s, w) => s + w.value, 0) === 100 ? "bg-emerald-100/80 text-emerald-700" : "bg-red-100/80 text-red-600"}`}>
                  {localWeights.reduce((s, w) => s + w.value, 0)}%
                </div>
              </div>

              <div className="space-y-6">
                {localWeights.map((w) => (
                  <div key={w.key}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-semibold text-slate-700">{w.label}</span>
                        <p className="text-xs text-slate-500">{w.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={97}
                          value={w.value}
                          onChange={(e) => handleWeightChange(w.key, Number(e.target.value))}
                          className="w-14 text-center text-sm font-bold text-slate-800 bg-white/60 border border-white/70 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-violet-300/60"
                        />
                        <span className="text-xs text-slate-400">%</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-white/40 border border-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${colorMap[w.color] || "bg-slate-400"}`}
                        style={{ width: `${w.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveWeights}
                disabled={serverSaving || localWeights.reduce((s, w) => s + w.value, 0) !== 100}
                className={`mt-8 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${localWeights.reduce((s, w) => s + w.value, 0) === 100 ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:shadow-lg hover:scale-[1.01]" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              >
                {serverSaving ? "Saving…" : "Save Weights"}
              </button>
            </div>

            <div className={`${glass} p-6`}>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Score Distribution Preview</h2>
              <div className="space-y-3">
                {localWeights.map((w) => (
                  <div key={w.key} className="flex items-center gap-3 p-3 bg-white/30 rounded-xl border border-white/50">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${colorMap[w.color] || "bg-slate-400"}`} />
                    <span className="text-sm text-slate-700 flex-1">{w.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-white/40 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colorMap[w.color] || "bg-slate-400"}`} style={{ width: `${w.value}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-600 w-8 text-right">{w.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INTERVIEW SETTINGS TAB ── */}
        {activeTab === "interview" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${glass} p-6 space-y-6`}>
              <h2 className="text-lg font-bold text-slate-800">Session Configuration</h2>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Clock className="h-4 w-4 text-violet-500" /> Max Interview Duration
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min={5} max={120} step={5} value={localInterview.maxDurationMinutes} onChange={(e) => setLocalInterview((s) => ({ ...s, maxDurationMinutes: +e.target.value }))} className="flex-1 accent-violet-500" />
                  <span className="text-sm font-bold text-slate-700 w-20 text-right">{localInterview.maxDurationMinutes} min</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Target className="h-4 w-4 text-rose-500" /> Flag Threshold Score
                </label>
                <div className="flex items-center gap-3">
                  <input type="range" min={10} max={95} step={5} value={localInterview.flagThreshold} onChange={(e) => setLocalInterview((s) => ({ ...s, flagThreshold: +e.target.value }))} className="flex-1 accent-rose-500" />
                  <span className="text-sm font-bold text-slate-700 w-20 text-right">{localInterview.flagThreshold}%</span>
                </div>
              </div>

              {[
                { key: "autoEndOnSilence", label: "Auto-End on Silence", desc: "End session automatically after long pause", icon: Zap, color: "amber" },
                { key: "recordingEnabled", label: "Session Recording", desc: "Enable audio capture for verification", icon: Eye, color: "violet" },
                { key: "transcriptEnabled", label: "Auto Transcript", desc: "Generate real-time text logs", icon: FileText, color: "sky" },
                { key: "strictMode", label: "Strict Mode", desc: "Activate higher sensitivity detection", icon: Shield, color: "rose" },
              ].map(({ key, label, desc, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white/30 border border-white/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 text-${color}-500`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLocalInterview((s) => ({ ...s, [key]: !s[key as keyof InterviewSettings] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${localInterview[key as keyof InterviewSettings] ? "bg-violet-500" : "bg-slate-200"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${localInterview[key as keyof InterviewSettings] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}

              <button onClick={handleSaveInterviewSettings} disabled={serverSaving} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:shadow-lg hover:scale-[1.01] transition-all">
                {serverSaving ? "Saving…" : "Save Settings"}
              </button>
            </div>

            <div className={`${glass} p-6`}>
              <h2 className="text-lg font-bold text-slate-800 mb-4">Summary View</h2>
              <div className="space-y-3">
                {[
                  { label: "Max Duration", value: `${localInterview.maxDurationMinutes} min` },
                  { label: "Flag Sensitivity", value: `At or below ${localInterview.flagThreshold}%` },
                  { label: "Auto-End", value: localInterview.autoEndOnSilence ? "On" : "Off" },
                  { label: "Recording", value: localInterview.recordingEnabled ? "Active" : "Disabled" },
                  { label: "Transcript", value: localInterview.transcriptEnabled ? "Live" : "No" },
                  { label: "Security Level", value: localInterview.strictMode ? "Strict" : "Standard" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/40 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-slate-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === "notifications" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className={`${glass} p-6 space-y-5`}>
              <h2 className="text-lg font-bold text-slate-800">Email Notifications</h2>

              {[
                { key: "emailOnComplete", label: "Analysis Complete", desc: "Email report after analysis finishes" },
                { key: "emailOnFlag", label: "Candidate Flagged", desc: "Urgent alert for low credibility scores" },
                { key: "emailOnFail", label: "Processing Error", desc: "Notify if a data sync or AI task fails" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between p-4 bg-white/30 border border-white/50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                  <button
                    onClick={() => setLocalNotifications((n) => ({ ...n, [key]: !n[key as keyof NotificationSettings] }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${localNotifications[key as keyof NotificationSettings] ? "bg-violet-500" : "bg-slate-200"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${localNotifications[key as keyof NotificationSettings] ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}

              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Digest Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["immediate", "daily", "weekly", "never"] as const).map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setLocalNotifications((n) => ({ ...n, summaryFrequency: freq }))}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${localNotifications.summaryFrequency === freq ? "bg-violet-500 text-white border-violet-500 shadow-md" : "bg-white/40 text-slate-600 border-white/60 hover:bg-white/60"}`}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${glass} p-6 space-y-5`}>
              <h2 className="text-lg font-bold text-slate-800">Webhook Integration</h2>
              <p className="text-sm text-slate-500">Push HireSense events to your external workflows.</p>

              <div className="flex items-center justify-between p-4 bg-white/30 border border-white/50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Webhook Enabled</p>
                  <p className="text-xs text-slate-500">POST JSON payloads to endpoint</p>
                </div>
                <button
                  onClick={() => setLocalNotifications((n) => ({ ...n, webhookEnabled: !n.webhookEnabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${localNotifications.webhookEnabled ? "bg-violet-500" : "bg-slate-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${localNotifications.webhookEnabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              {localNotifications.webhookEnabled && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Endpoint URL</label>
                  <input
                    type="url"
                    value={localNotifications.webhookUrl}
                    onChange={(e) => setLocalNotifications((n) => ({ ...n, webhookUrl: e.target.value }))}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-3 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300/60"
                  />
                </div>
              )}

              <button onClick={handleSaveNotifications} disabled={serverSaving} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:shadow-lg hover:scale-[1.01] transition-all">
                {serverSaving ? "Saving…" : "Save Webhook"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Preset Modal ─────────────────────────────────────────────────── */}
      {showAddPreset && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`${glassStrong} w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">New Interview Preset</h2>
              <button onClick={() => setShowAddPreset(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Preset Title</label>
                <input type="text" value={newPreset.title} onChange={(e) => setNewPreset((p) => ({ ...p, title: e.target.value }))} placeholder="e.g., Staff Engineer Vetting" className="w-full px-4 py-2.5 bg-white/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20" autoFocus />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["technical", "behavioral", "executive", "custom"] as const).map((cat) => (
                    <button key={cat} onClick={() => setNewPreset((p) => ({ ...p, category: cat }))} className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${newPreset.category === cat ? "bg-violet-500 text-white border-violet-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Detection Prompt</label>
                <textarea value={newPreset.prompt} onChange={(e) => setNewPreset((p) => ({ ...p, prompt: e.target.value }))} placeholder="Describe the specific inconsistencies or red flags AI should look for..." rows={5} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none font-mono" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddPreset(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
              <button
                onClick={handleAddPreset}
                disabled={!newPreset.title.trim() || !newPreset.prompt.trim() || serverSaving}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${newPreset.title.trim() && newPreset.prompt.trim() ? "bg-slate-900 text-white hover:bg-slate-800 shadow-lg" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              >
                {serverSaving ? "Creating..." : "Create Preset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Candidate Selector Overlay ───────────────────────────────────────── */}
      {showCandidateOverlay && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className={`${glassStrong} w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200`}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/40">
              <h2 className="text-xl font-bold text-slate-800">Select Test Candidate</h2>
              <button onClick={() => setShowCandidateOverlay(false)} className="p-2 rounded-xl hover:bg-white/60 text-slate-400 hover:text-slate-700 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-white/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search by name, role or email..." value={candidateSearch} onChange={(e) => setCandidateSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-white/60 rounded-xl text-sm text-slate-700 focus:outline-none" autoFocus />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {filteredCandidates.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="font-medium">No candidates found</p>
                  <p className="text-sm mt-1">Add candidates or try a different search.</p>
                </div>
              ) : filteredCandidates.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setLoadedCandidate(a);
                    setShowCandidateOverlay(false);
                    showToast(`Loaded ${a.name}`);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-white/30 hover:bg-white/60 border border-white/50 hover:border-white/70 rounded-xl transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 font-bold">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-300 -rotate-90" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
