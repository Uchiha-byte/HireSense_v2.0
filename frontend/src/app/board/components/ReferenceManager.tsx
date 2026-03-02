// ReferenceManager.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReferenceForm from "./ReferenceForm";
import ReferenceCard from "./ReferenceCard";

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
  callStatus?: "idle" | "calling" | "completed" | "failed";
  conversationId?: string;
  summary?: string;
}

export interface ReferenceFormData {
  name: string;
  phoneNumber: string;
  companyName: string;
  roleTitle: string;
  workDuration: string;
  emailId: string;
  meetingDate: string;
}

interface ReferenceManagerProps {
  references: Reference[];
  candidateName?: string;
  onAddReference: (reference: Reference) => void;
  onCallReference: (reference: Reference) => Promise<void>;
  onViewTranscript: (reference: Reference) => void;
  callInProgress: boolean;
}

export default function ReferenceManager({
  references,
  candidateName = "Candidate",
  onAddReference,
  onCallReference,
  onViewTranscript,
  callInProgress,
}: ReferenceManagerProps) {
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
    });
  };

  const handleCancelAddReference = () => {
    setAddingReference(false);
    setNotification(null);
    setNewReferenceForm({
      name: "",
      phoneNumber: "",
      companyName: "",
      roleTitle: "",
      workDuration: "",
      emailId: "",
      meetingDate: "",
    });
  };

  const handleNewReferenceFormChange = (
    field: keyof ReferenceFormData,
    value: string
  ) => {
    setNewReferenceForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleConfirmAddReference = async () => {
    // Validate all required fields
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
      // Send data to API to save reference and send email
      const response = await fetch("/api/reference-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referenceName: newReferenceForm.name,
          phoneNumber: newReferenceForm.phoneNumber,
          companyName: newReferenceForm.companyName,
          roleTitle: newReferenceForm.roleTitle,
          workDuration: newReferenceForm.workDuration,
          emailId: newReferenceForm.emailId,
          meetingDate: newReferenceForm.meetingDate,
          candidateName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save reference");
      }

      // Create reference object
      const reference: Reference = {
        id: data.id || Date.now().toString(),
        name: newReferenceForm.name.trim(),
        phoneNumber: newReferenceForm.phoneNumber.trim(),
        companyName: newReferenceForm.companyName.trim(),
        roleTitle: newReferenceForm.roleTitle.trim(),
        workDuration: newReferenceForm.workDuration.trim(),
        emailId: newReferenceForm.emailId.trim(),
        meetingDate: newReferenceForm.meetingDate,
        dateAdded: new Date().toLocaleDateString(),
        callStatus: "idle",
      };

      onAddReference(reference);
      setAddingReference(false);
      setNewReferenceForm({
        name: "",
        phoneNumber: "",
        companyName: "",
        roleTitle: "",
        workDuration: "",
        emailId: "",
        meetingDate: "",
      });
      setOpenReferenceId(reference.id);
      setNotification({
        type: "success",
        message: "Reference saved and meeting invite sent successfully!",
      });

      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
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
            className={`mb-4 p-4 rounded-md ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`font-medium ${
                notification.type === "success"
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

          {references.map((reference) => (
            <ReferenceCard
              key={reference.id}
              reference={reference}
              isOpen={openReferenceId === reference.id}
              onToggle={() =>
                setOpenReferenceId(
                  openReferenceId === reference.id ? null : reference.id
                )
              }
              onCall={onCallReference}
              onViewTranscript={onViewTranscript}
              callInProgress={callInProgress}
            />
          ))}

          {references.length === 0 && (
            <div className="text-gray-400 text-center py-6">
              No references added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
