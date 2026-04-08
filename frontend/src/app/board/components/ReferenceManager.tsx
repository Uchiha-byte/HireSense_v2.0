// ReferenceManager.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ReferenceForm from "./ReferenceForm";
import ReferenceCard from "./ReferenceCard";
import { createClient } from "@/lib/supabase/client";

export interface Reference {
  id: string;
  name: string;
  phoneNumber: string;
  companyName: string;
  roleTitle: string;
  workDuration: string;
  emailId: string;
  meetingDate: string;
  dateAdded: string;
  callStatus?: "idle" | "scheduled" | "started" | "ended" | "recording_uploaded" | "transcribed" | "failed" | "calling" | "completed";
  conversationId?: string;
  summary?: string;
  addCodingInterview?: boolean;
  codingInterviewUrl?: string;
  meetingLink?: string;
  durationMinutes?: number;
  transcript?: any;
}

export interface ReferenceFormData {
  name: string;
  phoneNumber: string;
  companyName: string;
  roleTitle: string;
  workDuration: string;
  emailId: string;
  meetingDate: string;
  durationMinutes: number;
  addCodingInterview: boolean;
}

interface ReferenceManagerProps {
  // We keep candidateName for email generation if needed
  candidateName?: string;
  applicantId?: string;
  // Kept for backwards compatibility but we will primarily fetch internally
  references?: Reference[]; 
  onAddReference?: (reference: Reference) => void;
  onCallReference?: (reference: Reference) => Promise<void>;
  onViewTranscript?: (reference: Reference) => void;
  callInProgress?: boolean;
}

export default function ReferenceManager({
  candidateName = "Candidate",
  applicantId
}: ReferenceManagerProps) {
  const [dbReferences, setDbReferences] = useState<Reference[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);

  const supabase = createClient();

  // Polling to keep reference call status updated
  useEffect(() => {
    if (!applicantId) return;

    const fetchReferences = async () => {
      try {
        setIsLoadingRefs(true);
        const { data, error } = await supabase
          .from("reference_calls")
          .select("*")
          .eq("applicant_id", applicantId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching reference calls:", error);
          return;
        }

        if (data) {
          const mappedRefs = data.map((row: any) => ({
            id: row.id,
            name: row.reference_name,
            phoneNumber: row.phone_number,
            companyName: row.company_name || "",
            roleTitle: row.role_title || "",
            workDuration: row.work_duration || "",
            emailId: row.reference_email || "",
            meetingDate: row.scheduled_time || "",
            durationMinutes: row.duration_minutes || 15,
            dateAdded: new Date(row.created_at).toLocaleDateString(),
            callStatus: row.status as Reference["callStatus"],
            conversationId: row.zoom_meeting_id,
            addCodingInterview: !!row.coding_interview_url,
            codingInterviewUrl: row.coding_interview_url || "",
            meetingLink: row.zoom_join_url || "",
            summary: row.summary,
            transcript: row.transcript
          }));
          setDbReferences(mappedRefs);
        }
      } catch (e) {
        console.error("Fetch DB References failed:", e);
      } finally {
        setIsLoadingRefs(false);
      }
    };

    fetchReferences();

    // Poll for updates if any call is not yet finalized
    const interval = setInterval(fetchReferences, 5000);
    return () => clearInterval(interval);
  }, [applicantId, supabase]);

  const [addingReference, setAddingReference] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  
  const [newReferenceForm, setNewReferenceForm] = useState<ReferenceFormData>({
    name: "",
    phoneNumber: "",
    companyName: "",
    roleTitle: "",
    workDuration: "",
    emailId: "",
    meetingDate: "",
    durationMinutes: 15,
    addCodingInterview: false,
  });
  
  const [openReferenceId, setOpenReferenceId] = useState<string | null>(null);

  const handleStartAddReference = () => {
    setAddingReference(true);
    setNotification(null);
    setNewReferenceForm({
      name: "",
      phoneNumber: "",
      companyName: "",
      roleTitle: "",
      workDuration: "",
      emailId: "",
      meetingDate: "",
      durationMinutes: 15,
      addCodingInterview: false,
    });
  };

  const handleCancelAddReference = () => {
    setAddingReference(false);
    setNotification(null);
  };

  const handleNewReferenceFormChange = (
    field: keyof ReferenceFormData,
    value: string | boolean | number
  ) => {
    setNewReferenceForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleConfirmAddReference = async () => {
    if (!applicantId) {
      setNotification({ type: "error", message: "Missing applicant ID" });
      return;
    }

    if (!newReferenceForm.name.trim()) {
      setNotification({ type: "error", message: "Reference Name is required" });
      return;
    }
    if (!newReferenceForm.phoneNumber.trim()) {
      setNotification({ type: "error", message: "Phone Number is required" });
      return;
    }
    if (!newReferenceForm.emailId.trim()) {
      setNotification({ type: "error", message: "Email ID is required" });
      return;
    }
    if (!validateEmail(newReferenceForm.emailId)) {
      setNotification({ type: "error", message: "Invalid email format" });
      return;
    }
    if (!newReferenceForm.meetingDate.trim()) {
      setNotification({ type: "error", message: "Meeting Date is required" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/reference-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicantId: applicantId,
          referenceName: newReferenceForm.name,
          phoneNumber: newReferenceForm.phoneNumber,
          companyName: newReferenceForm.companyName,
          roleTitle: newReferenceForm.roleTitle,
          workDuration: newReferenceForm.workDuration,
          emailId: newReferenceForm.emailId,
          meetingDate: newReferenceForm.meetingDate,
          durationMinutes: newReferenceForm.durationMinutes,
          addCodingInterview: newReferenceForm.addCodingInterview,
          candidateName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save reference");
      }

      setAddingReference(false);
      setNewReferenceForm({
        name: "",
        phoneNumber: "",
        companyName: "",
        roleTitle: "",
        workDuration: "",
        emailId: "",
        meetingDate: "",
        durationMinutes: 15,
        addCodingInterview: false,
      });
      setOpenReferenceId(data.id);
      setNotification({
        type: "success",
        message: "Reference saved and Zoom meeting invite sent successfully!",
      });

      setTimeout(() => setNotification(null), 5000);
      
      // Update local state proactively
      setDbReferences([{
        id: data.id || Date.now().toString(),
        name: newReferenceForm.name.trim(),
        phoneNumber: newReferenceForm.phoneNumber.trim(),
        companyName: newReferenceForm.companyName.trim(),
        roleTitle: newReferenceForm.roleTitle.trim(),
        workDuration: newReferenceForm.workDuration.trim(),
        emailId: newReferenceForm.emailId.trim(),
        meetingDate: newReferenceForm.meetingDate,
        durationMinutes: newReferenceForm.durationMinutes,
        dateAdded: new Date().toLocaleDateString(),
        callStatus: "scheduled",
        addCodingInterview: !!newReferenceForm.addCodingInterview,
        codingInterviewUrl: data.codingInterviewUrl || "",
        meetingLink: data.meetingLink || "",
      }, ...dbReferences]);

    } catch (error) {
      setNotification({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save reference",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // We are removing onViewTranscript and local call since this is now integrated natively into DB updates via watcher
  const handleCallReference = async () => {};
  const handleViewTranscript = async () => {};

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <span className="text-xl">📞</span>
            Reference Calls
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Contact and verify professional references
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartAddReference}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          disabled={addingReference || isLoading}
        >
          + Add Reference
        </Button>
      </div>

      <div className="p-6">
        {notification && (
          <div
            className={`mb-4 p-4 rounded-md ${notification.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
              }`}
          >
            <p
              className={`font-medium ${notification.type === "success"
                ? "text-green-800"
                : "text-red-800"
                }`}
            >
              {notification.type === "success" ? "✅" : "❌"}{" "}
              {notification.message}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {addingReference && (
            <ReferenceForm
              formData={newReferenceForm}
              onFormChange={handleNewReferenceFormChange}
              onCancel={handleCancelAddReference}
              onConfirm={handleConfirmAddReference}
              isLoading={isLoading}
            />
          )}

          {dbReferences.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              isOpen={openReferenceId === reference.id}
              onToggle={() =>
                setOpenReferenceId(
                  openReferenceId === reference.id ? null : reference.id
                )
              }
              onCall={handleCallReference} // Just stubs now since it's driven DB status
              onViewTranscript={handleViewTranscript} 
              callInProgress={false}
            />
          ))}

          {dbReferences.length === 0 && !isLoadingRefs && !addingReference && (
            <div className="text-gray-400 text-center py-6">
              No references added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
