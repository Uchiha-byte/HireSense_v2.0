"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Preset {
    id: string;
    title: string;
    description: string;
    prompt: string;
    category: "technical" | "behavioral" | "executive" | "custom";
    isDefault?: boolean;
}

export interface ScoringWeight {
    key: string;
    label: string;
    description: string;
    value: number;
    color: string;
}

export interface InterviewSettings {
    maxDurationMinutes: number;
    responseTimeoutSeconds: number;
    autoEndOnSilence: boolean;
    recordingEnabled: boolean;
    transcriptEnabled: boolean;
    strictMode: boolean;
    flagThreshold: number;
}

export interface NotificationSettings {
    emailOnComplete: boolean;
    emailOnFlag: boolean;
    emailOnFail: boolean;
    summaryFrequency: "immediate" | "daily" | "weekly" | "never";
    webhookUrl: string;
    webhookEnabled: boolean;
}

export interface HireSenseSettings {
    presets: Preset[];
    activePresetId: string;
    scoringWeights: ScoringWeight[];
    interviewSettings: InterviewSettings;
    notifications: NotificationSettings;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
export const DEFAULT_PRESETS: Preset[] = [
    {
        id: "1",
        title: "Technical Interview",
        description: "Deep-dive on engineering skills and code quality",
        category: "technical",
        isDefault: true,
        prompt: `Analyze candidate responses for technical accuracy. Flag when:
- They claim experience with technologies not listed on their CV
- Years of experience don't match their career timeline
- Technical explanations seem superficial or borrowed
- Project descriptions differ from LinkedIn/GitHub activity
- Cannot explain fundamentals behind tools they claim to know`,
    },
    {
        id: "2",
        title: "Behavioral Interview",
        description: "Detect inconsistencies in stories and experiences",
        category: "behavioral",
        isDefault: true,
        prompt: `Detect inconsistencies in behavioral responses. Check for:
- Timeline conflicts with CV dates and roles
- Company or role mismatches in STAR examples
- Exaggerated achievements without measurable data
- Missing details about claimed key experiences
- Conflicting descriptions of team sizes or responsibilities`,
    },
    {
        id: "3",
        title: "Executive Interview",
        description: "Verify leadership claims and business impact metrics",
        category: "executive",
        isDefault: true,
        prompt: `Verify leadership claims and company metrics. Flag:
- Revenue or growth numbers that seem inflated vs company size
- Team sizes that conflict with LinkedIn connections/endorsements
- Strategic decisions with unclear ownership or impact
- Missing evidence of claimed major initiatives
- Vague answers about P&L responsibility or board interactions`,
    },
];

export const DEFAULT_WEIGHTS: ScoringWeight[] = [
    { key: "cv_accuracy", label: "CV Accuracy", description: "How closely answers match CV claims", value: 30, color: "violet" },
    { key: "consistency", label: "Consistency", description: "Internal consistency across answers", value: 25, color: "sky" },
    { key: "technical_depth", label: "Technical Depth", description: "Depth of technical knowledge", value: 20, color: "emerald" },
    { key: "communication", label: "Communication", description: "Clarity and structure of responses", value: 15, color: "amber" },
    { key: "confidence", label: "Confidence Score", description: "Confidence and certainty in answers", value: 10, color: "rose" },
];

export const DEFAULT_INTERVIEW_SETTINGS: InterviewSettings = {
    maxDurationMinutes: 30,
    responseTimeoutSeconds: 60,
    autoEndOnSilence: true,
    recordingEnabled: true,
    transcriptEnabled: true,
    strictMode: false,
    flagThreshold: 65,
};

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
    emailOnComplete: true,
    emailOnFlag: true,
    emailOnFail: false,
    summaryFrequency: "daily",
    webhookUrl: "",
    webhookEnabled: false,
};

const DEFAULT_SETTINGS: HireSenseSettings = {
    presets: DEFAULT_PRESETS,
    activePresetId: "1",
    scoringWeights: DEFAULT_WEIGHTS,
    interviewSettings: DEFAULT_INTERVIEW_SETTINGS,
    notifications: DEFAULT_NOTIFICATIONS,
};

// ─── Context ──────────────────────────────────────────────────────────────────
interface SettingsContextValue {
    settings: HireSenseSettings;
    loading: boolean;
    saving: boolean;
    lastSaved: Date | null;
    /** Save a partial patch of top-level settings keys */
    saveSettings: (patch: Partial<HireSenseSettings>) => Promise<boolean>;
    /** Active preset object */
    activePreset: Preset;
    /** Reload settings from server */
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<HireSenseSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const mounted = useRef(true);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/settings");
            if (!res.ok) {
                if (res.status === 401) {
                    // Not authenticated – use defaults silently
                    return;
                }
                throw new Error("Failed to load settings");
            }
            const json = await res.json();
            if (json.settings && Object.keys(json.settings).length > 0) {
                if (mounted.current) {
                    setSettings((prev) => mergeSettings(prev, json.settings));
                }
            }
        } catch (err) {
            console.warn("[SettingsContext] Could not load settings:", err);
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchSettings();
        return () => { mounted.current = false; };
    }, [fetchSettings]);

    const saveSettings = useCallback(async (patch: Partial<HireSenseSettings>): Promise<boolean> => {
        if (saving) return false;
        setSaving(true);
        try {
            const next = { ...settings, ...patch };
            setSettings(next); // optimistic update

            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: patch }),
            });
            if (!res.ok) {
                // Roll back
                setSettings(settings);
                return false;
            }
            const json = await res.json();
            if (json.settings) setSettings((prev) => mergeSettings(prev, json.settings));
            setLastSaved(new Date());
            return true;
        } catch (err) {
            console.error("[SettingsContext] Save failed:", err);
            setSettings(settings); // roll back
            return false;
        } finally {
            if (mounted.current) setSaving(false);
        }
    }, [saving, settings]);

    const activePreset =
        settings.presets.find((p) => p.id === settings.activePresetId) ??
        settings.presets[0] ??
        DEFAULT_PRESETS[0];

    return (
        <SettingsContext.Provider value={{ settings, loading, saving, lastSaved, saveSettings, activePreset, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings(): SettingsContextValue {
    const ctx = useContext(SettingsContext);
    if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
    return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mergeSettings(defaults: HireSenseSettings, saved: Partial<HireSenseSettings>): HireSenseSettings {
    return {
        ...defaults,
        ...saved,
        // Deep merge arrays – kept as-is from server if non-empty
        presets: (saved.presets && saved.presets.length > 0) ? saved.presets : defaults.presets,
        scoringWeights: (saved.scoringWeights && saved.scoringWeights.length > 0) ? saved.scoringWeights : defaults.scoringWeights,
        interviewSettings: { ...defaults.interviewSettings, ...(saved.interviewSettings ?? {}) },
        notifications: { ...defaults.notifications, ...(saved.notifications ?? {}) },
    };
}
