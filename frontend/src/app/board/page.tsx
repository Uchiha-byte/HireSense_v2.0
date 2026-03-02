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
import ReferenceManager, { Reference } from "./components/ReferenceManager";

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

  const [referencesByCandidate, setReferencesByCandidate] = useState<{
    [id: string]: Reference[];
  }>({});
  const [callInProgress, setCallInProgress] = useState(false);
  const [transcriptModal, setTranscriptModal] = useState({
    isOpen: false,
    conversationId: "",
    referenceName: "",
  });

  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    applicantId: "",
    applicantName: "",
  });

  const [summarySection, setSummarySection] = useState({
    isOpen: false,
    summary: "",
    loading: false,
    error: "",
  });

  const selectedCandidateId = selectedCandidate ? selectedCandidate.id : null;
  const candidateReferences = selectedCandidateId
    ? referencesByCandidate[selectedCandidateId] || []
    : [];

  // Handler for adding a new reference
  const handleAddReference = (reference: Reference) => {
    if (!selectedCandidateId) return;
    setReferencesByCandidate((prev) => ({
      ...prev,
      [selectedCandidateId]: [reference, ...(prev[selectedCandidateId] || [])],
    }));
  };

  const generateSummaryForReference = async (
    referenceId: string,
    conversationId: string
  ) => {
    if (!selectedCandidateId) return;

    try {
      // Fetch the transcript
      const transcriptResponse = await fetch(
        `/api/get-transcript?conversationId=${conversationId}`
      );
      const transcriptData = await transcriptResponse.json();

      if (
        transcriptData.success &&
        transcriptData.hasTranscript &&
        transcriptData.transcript
      ) {
        // Generate summary using the transcript
        const summaryResponse = await fetch("/api/summarize-transcript", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: transcriptData.transcript }),
        });

        const summaryData = await summaryResponse.json();

        if (summaryData.success && summaryData.summary) {
          // Update the reference with the generated summary
          setReferencesByCandidate((prev) => ({
            ...prev,
            [selectedCandidateId]: prev[selectedCandidateId].map((ref) =>
              ref.id === referenceId
                ? { ...ref, summary: summaryData.summary }
                : ref
            ),
          }));
          console.log(
            "Summary generated for reference:",
            referenceId,
            summaryData.summary
          );
        }
      } else {
        // If transcript is not ready yet, try again in 15 seconds
        setTimeout(
          () => generateSummaryForReference(referenceId, conversationId),
          15000
        );
      }
    } catch (error) {
      console.error(
        "Failed to generate summary for reference:",
        referenceId,
        error
      );
      // Retry once after 30 seconds on error
      setTimeout(
        () => generateSummaryForReference(referenceId, conversationId),
        30000
      );
    }
  };

  const handleCallReference = async (reference: Reference) => {
    if (callInProgress || !selectedCandidateId || !selectedCandidate) return;
    setCallInProgress(true);
    setReferencesByCandidate((prev) => ({
      ...prev,
      [selectedCandidateId]: prev[selectedCandidateId].map((ref) =>
        ref.id === reference.id
          ? { ...ref, callStatus: "calling" as const }
          : ref
      ),
    }));
    try {
      const response = await fetch("/api/reference-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: reference.phoneNumber,
          candidateName: selectedCandidate.name,
          referenceName: reference.name,
          companyName: reference.companyName || "Previous Company",
          roleTitle:
            reference.roleTitle ||
            selectedCandidate.cv_data?.jobTitle ||
            selectedCandidate.li_data?.headline ||
            "",
          workDuration: reference.workDuration || "",
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReferencesByCandidate((prev) => ({
          ...prev,
          [selectedCandidateId]: prev[selectedCandidateId].map((ref) =>
            ref.id === reference.id
              ? {
                ...ref,
                callStatus: "completed" as const,
                conversationId: data.conversationId,
              }
              : ref
          ),
        }));
        alert(
          `Call initiated successfully! Conversation ID: ${data.conversationId}`
        );

        // Schedule automatic summary generation after a delay to allow transcript processing
        setTimeout(async () => {
          await generateSummaryForReference(reference.id, data.conversationId);
        }, 10000); // Wait 10 seconds for transcript to be available
      } else {
        throw new Error(data.error || "Failed to initiate call");
      }
    } catch (error) {
      setReferencesByCandidate((prev) => ({
        ...prev,
        [selectedCandidateId]: prev[selectedCandidateId].map((ref) =>
          ref.id === reference.id
            ? { ...ref, callStatus: "failed" as const }
            : ref
        ),
      }));
      alert(
        `Failed to initiate call: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCallInProgress(false);
    }
  };

  const handleViewTranscript = async (reference: Reference) => {
    if (reference.conversationId) {
      setTranscriptModal({
        isOpen: true,
        conversationId: reference.conversationId,
        referenceName: reference.name,
      });

      // Auto-generate summary if it doesn't exist
      if (!reference.summary && selectedCandidateId) {
        try {
          // First fetch the transcript
          const transcriptResponse = await fetch(
            `/api/get-transcript?conversationId=${reference.conversationId}`
          );
          const transcriptData = await transcriptResponse.json();

          if (
            transcriptData.success &&
            transcriptData.hasTranscript &&
            transcriptData.transcript
          ) {
            // Generate summary using the transcript
            const summaryResponse = await fetch("/api/summarize-transcript", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript: transcriptData.transcript }),
            });

            const summaryData = await summaryResponse.json();

            if (summaryData.success && summaryData.summary) {
              // Update the reference with the generated summary
              setReferencesByCandidate((prev) => ({
                ...prev,
                [selectedCandidateId]: prev[selectedCandidateId].map((ref) =>
                  ref.id === reference.id
                    ? { ...ref, summary: summaryData.summary }
                    : ref
                ),
              }));
            }
          }
        } catch (error) {
          console.error("Failed to generate summary:", error);
        }
      }
    }
  };

  const closeTranscriptModal = () => {
    setTranscriptModal({
      isOpen: false,
      conversationId: "",
      referenceName: "",
    });
  };

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
                  references={candidateReferences}
                  onAddReference={handleAddReference}
                  onCallReference={handleCallReference}
                  onViewTranscript={handleViewTranscript}
                  callInProgress={callInProgress}
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

      {/* Transcript Modal */}
      <TranscriptModal
        isOpen={transcriptModal.isOpen}
        onClose={closeTranscriptModal}
        conversationId={transcriptModal.conversationId}
        referenceName={transcriptModal.referenceName}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/70 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/70 w-full max-w-md p-7">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-13 w-13 rounded-full bg-red-100/80 mb-4 p-3 w-fit">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                Delete Applicant
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete{" "}
                <strong className="text-slate-700">{deleteConfirmModal.applicantName}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={cancelDeleteApplicant}
                  className="px-6 border-slate-200 text-slate-700 hover:bg-white/60 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteApplicant}
                  className="px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    }>
      <BoardPageContent />
    </Suspense>
  );
}
