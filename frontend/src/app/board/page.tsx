"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Trash2,
  MoreVertical,
  Trash,
  Download,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TranscriptModal from "@/components/TranscriptModal";
import ProcessingLoader from "@/components/ProcessingLoader";
import CredibilityScore from "@/components/credibility-score";
import { useApplicants } from "@/lib/contexts/ApplicantContext";
import { NewApplicantForm } from "./components/NewApplicantForm";
import GitHubSection from "./components/GitHubSection";
import CollapsibleCVSection from "./components/CollapsibleCVSection";
import LinkedInProfileSection from "./components/LinkedInProfileSection";
import LeetCodeSection from "./components/LeetCodeSection";
import ReferenceManager from "./components/ReferenceManager";

function BoardPageContent() {
  const {
    selectedApplicant,
    fetchApplicants,
    selectApplicant,
    refreshApplicant,
    deleteApplicant,
  } = useApplicants();

  const searchParams = useSearchParams();
  const router = useRouter();

  // NEW URL LOGIC: /board = new form, /board?id=<id> = view applicant
  const urlId = searchParams.get("id");
  const isNewForm = !urlId; // If no id parameter, show new form

  // Navigation helpers - use replace for cleaner history
  const navigateToApplicant = useCallback(
    (id: string) => {
      router.replace(`/board?id=${id}`);
    },
    [router]
  );

  const navigateToNew = useCallback(() => {
    router.replace("/board"); // Just /board for new form
  }, [router]);

  // Load applicants on component mount
  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  // Sync URL parameter with ApplicantContext selection
  useEffect(() => {
    if (urlId && urlId !== selectedApplicant?.id) {
      selectApplicant(urlId);
    } else if (!urlId && selectedApplicant) {
      selectApplicant(null);
    }
  }, [urlId, selectedApplicant, selectApplicant]);


  // Handle successful applicant creation from NewApplicantForm
  const handleApplicantCreated = useCallback(
    (applicantId: string) => {
      console.log("Applicant created:", applicantId);
      // Navigate to the newly created applicant to show processing status
      navigateToApplicant(applicantId);
    },
    [navigateToApplicant]
  );

  const handleDeleteApplicant = async (
    applicantId: string,
    applicantName: string
  ) => {
    setDeleteConfirmModal({
      isOpen: true,
      applicantId,
      applicantName,
    });
  };

  const confirmDeleteApplicant = async () => {
    const { applicantId } = deleteConfirmModal;

    await deleteApplicant(applicantId);

    // After deletion, always navigate to the new applicant page to refresh the view
    navigateToNew();

    setDeleteConfirmModal({
      isOpen: false,
      applicantId: "",
      applicantName: "",
    });
  };

  const cancelDeleteApplicant = () => {
    setDeleteConfirmModal({
      isOpen: false,
      applicantId: "",
      applicantName: "",
    });
  };

  const selectedCandidate = isNewForm ? null : selectedApplicant;

  // Real-time updates handled by ApplicantContext, but we add a robust polling fallback 
  // here specifically for the "Analyzing" state to ensure results always load.
  useEffect(() => {
    if (!urlId || !selectedCandidate) return;

    // Check if we are in a state that should be polling (any processing/pending)
    const needsPolling =
      selectedCandidate.ai_status !== 'ready' &&
      selectedCandidate.status !== 'failed' &&
      !isNewForm;

    if (!needsPolling) return;

    console.log(`⏱️ Starting robust polling fallback for applicant ${urlId}`);

    const interval = setInterval(() => {
      console.log(`🔄 Polling fallback refresh for ${urlId}...`);
      refreshApplicant(urlId);
    }, 4000); // Check every 4 seconds

    return () => clearInterval(interval);
  }, [urlId, selectedCandidate?.ai_status, selectedCandidate?.status, isNewForm, refreshApplicant]);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    applicantId: "",
    applicantName: "",
  });

  const [transcriptModal, setTranscriptModal] = useState({
    isOpen: false,
    conversationId: "",
    referenceName: "",
  });

  const [summarySection, setSummarySection] = useState({
    isOpen: false,
    summary: "",
    loading: false,
    error: "",
  });

  const selectedCandidateId = selectedCandidate ? selectedCandidate.id : null;

  const handleShowCallSummary = async () => {
    if (!selectedCandidateId) return;

    setSummarySection({
      isOpen: true,
      summary: "",
      loading: true,
      error: "",
    });

    try {
      const response = await fetch("/api/summarize-transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: selectedCandidateId }),
      });

      const data = await response.json();

      if (data.success && data.summary) {
        setSummarySection({
          isOpen: true,
          summary: data.summary,
          loading: false,
          error: "",
        });
      } else {
        setSummarySection({
          isOpen: true,
          summary: "",
          loading: false,
          error: data.error || "No call summary available for this candidate",
        });
      }
    } catch (error) {
      setSummarySection({
        isOpen: true,
        summary: "",
        loading: false,
        error: `Failed to fetch summary: ${error instanceof Error ? error.message : "Unknown error"
          }`,
      });
    }
  };

  const closeSummarySection = () => {
    setSummarySection({
      isOpen: false,
      summary: "",
      loading: false,
      error: "",
    });
  };

  const closeTranscriptModal = () => {
    setTranscriptModal({
      isOpen: false,
      conversationId: "",
      referenceName: "",
    });
  };

  return (
    <>
      <div className="min-h-screen">
        {/* Main Content */}
        <main className="p-6 lg:p-10">
          {isNewForm ? (
            <div className="max-w-5xl mx-auto">
              {/* Page header */}
              <div className="mb-8">
                <p className="text-sm text-slate-500 font-medium mb-1">New Candidate</p>
                <h1 className="text-3xl font-bold text-slate-800">Analyze a Candidate</h1>
                <p className="text-slate-500 mt-1 text-sm">Upload their CV, LinkedIn profile, and GitHub to run a full credibility analysis.</p>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Form card */}
                <div className="xl:col-span-2 bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg p-7">
                  <NewApplicantForm onSuccess={handleApplicantCreated} />
                </div>
                {/* Info sidebar */}
                <div className="space-y-4">
                  <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg p-5">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">What happens next?</h3>
                    <ol className="space-y-3">
                      {[
                        { step: "1", label: "Data ingestion", desc: "CV parsed, LinkedIn & GitHub fetched" },
                        { step: "2", label: "AI Analysis", desc: "Cross-reference all sources for inconsistencies" },
                        { step: "3", label: "Credibility Report", desc: "Detailed score with flagged items" },
                        { step: "4", label: "Reference Calls", desc: "Optionally verify references by phone" },
                      ].map(({ step, label, desc }) => (
                        <li key={step} className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white text-[10px] font-bold">{step}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">{label}</p>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50/80 to-pink-50/70 border border-violet-100/60 rounded-2xl p-5">
                    <p className="text-xs font-semibold text-violet-700 mb-1">💡 Pro tip</p>
                    <p className="text-xs text-violet-600 leading-relaxed">Providing all three data sources (CV + LinkedIn + GitHub) gives the most accurate credibility score and catches more inconsistencies.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedCandidate ? (
            // Show result as soon as AI analysis is ready, even if top-level status is still updating
            (selectedCandidate.ai_status !== "ready" && selectedCandidate.status !== "failed") ? (
              <ProcessingLoader
                status={
                  selectedCandidate.status === "uploading"
                    ? "uploading"
                    : selectedCandidate.ai_status === "processing" || selectedCandidate.status === "analyzing"
                      ? "analyzing"
                      : "processing"
                }
                fileName={selectedCandidate.cv_file_id ? "CV File" : undefined}
                applicant={selectedCandidate}
              />
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Compact Header */}
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => router.push("/board/applicants")}
                          className="p-1.5 hover:bg-white/60 rounded-lg transition-colors mr-2"
                          title="Back to Applicants"
                        >
                          <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </button>
                        <h2 className="text-2xl font-bold text-slate-800">
                          {selectedCandidate.name}
                        </h2>
                        <div className="flex items-center gap-2">
                          {selectedCandidate.cv_data && (
                            <span className="text-xs bg-emerald-100/80 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/60 font-semibold backdrop-blur-sm">
                              CV ✓
                            </span>
                          )}
                          {selectedCandidate.li_data && (
                            <span className="text-xs bg-sky-100/80 text-sky-700 px-3 py-1 rounded-full border border-sky-200/60 font-semibold backdrop-blur-sm">
                              LinkedIn ✓
                            </span>
                          )}
                          {selectedCandidate.gh_data && (
                            <span className="text-xs bg-violet-100/80 text-violet-700 px-3 py-1 rounded-full border border-violet-200/60 font-semibold backdrop-blur-sm">
                              GitHub ✓
                            </span>
                          )}
                          {selectedCandidate.lc_data && (
                            <span className="text-xs bg-amber-100/80 text-amber-700 px-3 py-1 rounded-full border border-amber-200/60 font-semibold backdrop-blur-sm">
                              LeetCode ✓
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 font-medium">
                        {selectedCandidate.cv_data?.jobTitle ||
                          selectedCandidate.li_data?.headline ||
                          "Position not specified"}
                      </p>
                      {selectedCandidate.email && (
                        <p className="text-sm text-slate-500">
                          {selectedCandidate.email}
                        </p>
                      )}
                    </div>

                    {/* Actions Menu */}
                    <div className="relative group">
                      <button className="p-2 hover:bg-white/60 rounded-lg transition-colors">
                        <MoreVertical className="h-5 w-5 text-slate-500" />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white/80 backdrop-blur-xl rounded-xl shadow-xl border border-white/70 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/60 rounded-t-xl flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Export Profile
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-white/60 flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                        <div className="border-t border-slate-100/80"></div>
                        <button
                          onClick={() =>
                            handleDeleteApplicant(
                              selectedCandidate.id,
                              selectedCandidate.name
                            )
                          }
                          className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50/80 rounded-b-xl flex items-center gap-2"
                        >
                          <Trash className="h-4 w-4" />
                          Delete Candidate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credibility Analysis */}
                {selectedCandidate.ai_data && (
                  <div className="mb-6">
                    <CredibilityScore
                      analysisResult={selectedCandidate.ai_data}
                      cvFileId={selectedCandidate.cv_file_id}
                    />
                  </div>
                )}

                {/* CV vs LinkedIn Comparison - Temporarily disabled for type compatibility */}
                {/* TODO: Update DataComparisonSection to handle LinkedInData type properly */}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* CV Section */}
                  {selectedCandidate.cv_data && (
                    <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 overflow-hidden">
                      <CollapsibleCVSection
                        cvData={selectedCandidate.cv_data}
                      />
                    </div>
                  )}

                  {/* LinkedIn Section */}
                  <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 overflow-hidden">
                    {selectedCandidate.li_data ? (
                      <LinkedInProfileSection
                        linkedinData={selectedCandidate.li_data}
                      />
                    ) : (selectedCandidate.li_status as string) ===
                      "processing" ? (
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">💼</span>
                          <h3 className="text-lg font-semibold text-slate-700">
                            LinkedIn
                          </h3>
                          <span className="text-xs bg-sky-100/80 text-sky-700 px-3 py-1 rounded-full border border-sky-200/60 font-semibold animate-pulse">
                            Processing...
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                          LinkedIn data is being processed in the background.
                        </p>
                      </div>
                    ) : selectedCandidate.li_status === "error" ? (
                      <div className="p-6 opacity-70">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl opacity-50">💼</span>
                          <h3 className="text-lg font-semibold text-slate-600">
                            LinkedIn
                          </h3>
                          <span className="text-xs bg-red-100/80 text-red-600 px-3 py-1 rounded-full border border-red-200/60 font-semibold">
                            Failed
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                          LinkedIn processing failed.
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 opacity-60">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl opacity-50">💼</span>
                          <h3 className="text-lg font-semibold text-slate-500">
                            LinkedIn
                          </h3>
                          <span className="text-xs bg-slate-100/80 text-slate-500 px-3 py-1 rounded-full border border-slate-200/60">
                            Not Available
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                          LinkedIn data not provided for this candidate.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GitHub Section - Full Width if available */}
                  {(selectedCandidate.gh_data ||
                    !selectedCandidate.cv_data) && (
                      <div
                        className={`bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 overflow-hidden ${selectedCandidate.gh_data ? "lg:col-span-2" : ""
                          }`}
                      >
                        {selectedCandidate.gh_data ? (
                          <GitHubSection githubData={selectedCandidate.gh_data} />
                        ) : (
                          <div className="p-6 opacity-60">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xl opacity-50">🐙</span>
                              <h3 className="text-lg font-semibold text-slate-500">
                                GitHub
                              </h3>
                              <span className="text-xs bg-slate-100/80 text-slate-500 px-3 py-1 rounded-full border border-slate-200/60">
                                Not Available
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm">
                              GitHub data not provided for this candidate.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* LeetCode Section - Full Width if available */}
                  {(selectedCandidate.lc_data || selectedCandidate.lc_status !== 'not_provided') && (
                    <div
                      className={`bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 overflow-hidden lg:col-span-2`}
                    >
                      {selectedCandidate.lc_status === "ready" && selectedCandidate.lc_data ? (
                        <LeetCodeSection leetcodeData={selectedCandidate.lc_data} />
                      ) : (selectedCandidate.lc_status as string) === "processing" ? (
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">🏆</span>
                            <h3 className="text-lg font-semibold text-slate-700">LeetCode</h3>
                            <span className="text-xs bg-amber-100/80 text-amber-700 px-3 py-1 rounded-full border border-amber-200/60 font-semibold animate-pulse">
                              Processing...
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm">LeetCode data is being processed in the background.</p>
                        </div>
                      ) : selectedCandidate.lc_status === "error" ? (
                        <div className="p-6 opacity-70">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl opacity-50">🏆</span>
                            <h3 className="text-lg font-semibold text-slate-600">LeetCode</h3>
                            <span className="text-xs bg-red-100/80 text-red-600 px-3 py-1 rounded-full border border-red-200/60 font-semibold">
                              Failed
                            </span>
                          </div>
                          <p className="text-slate-500 text-sm">LeetCode processing failed.</p>
                        </div>
                      ) : (
                        <div className="p-6 opacity-60">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl opacity-50">🏆</span>
                            <h3 className="text-lg font-semibold text-slate-500">LeetCode</h3>
                            <span className="text-xs bg-slate-100/80 text-slate-500 px-3 py-1 rounded-full border border-slate-200/60">
                              Not Available
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">LeetCode data not provided for this candidate.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Processing status message */}
                {selectedCandidate.status === "failed" && (
                  <div className="bg-red-50 border border-red-200  p-4">
                    <p className="text-red-700">
                      Processing failed. Please try uploading again.
                    </p>
                  </div>
                )}

                {/* Reference Calls & Start Interview */}
                <ReferenceManager
                  applicantId={selectedCandidateId || undefined}
                  candidateName={selectedCandidate.name}
                />

                {/* Call Summary Section */}
                {summarySection.isOpen && (
                  <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-slate-800">
                        Call Summary
                      </h3>
                      <button
                        onClick={closeSummarySection}
                        className="text-slate-400 hover:text-slate-700 transition-colors">

                        <svg
                          className="h-6 w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {summarySection.loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      </div>
                    ) : summarySection.error ? (
                      <div className="bg-red-50/80 border border-red-200/60 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-red-600 text-sm">
                          {summarySection.error}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/60">
                        <p className="text-slate-700 leading-relaxed">
                          {summarySection.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show Call Summary Button */}
                <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-lg border border-white/60 p-6">
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white py-4 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
                    onClick={handleShowCallSummary}
                  >
                    Show Call Summary
                  </Button>
                </div>
              </div>
            )
          ) : null}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Candidate?</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteConfirmModal.applicantName}</span>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={cancelDeleteApplicant}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600"
                onClick={confirmDeleteApplicant}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transcript Modal */}
      {transcriptModal.isOpen && (
        <TranscriptModal
          isOpen={transcriptModal.isOpen}
          onClose={closeTranscriptModal}
          conversationId={transcriptModal.conversationId}
          referenceName={transcriptModal.referenceName}
        />
      )}
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div>Loading board...</div>}>
      <BoardPageContent />
    </Suspense>
  );
}
