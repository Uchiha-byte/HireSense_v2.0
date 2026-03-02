// ReferenceCallForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReferenceCallFormProps {
  candidateName?: string;
  onCallInitiated?: (referenceId: string, referenceName: string) => void;
}

interface FormDataState {
  phoneNumber: string;
  candidateName: string;
  referenceName: string;
  companyName: string;
  roleTitle: string;
  workDuration: string;
  emailId: string;
  meetingDate: string;
}

export default function ReferenceCallForm({
  candidateName = "Candidate",
  onCallInitiated,
}: ReferenceCallFormProps) {
  const [formData, setFormData] = useState<FormDataState>({
    phoneNumber: "",
    candidateName: candidateName,
    referenceName: "",
    companyName: "",
    roleTitle: "",
    workDuration: "",
    emailId: "",
    meetingDate: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: keyof FormDataState, value: string) => {
    console.log(`Updated ${field}:`, value);
    setFormData((prevState) => {
      const updatedData = {
        ...prevState,
        [field]: value,
      };
      console.log("Updated formData:", updatedData);
      return updatedData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    console.log("=== FORM SUBMISSION START ===");
    console.log("Current formData state:", formData);

    // Client-side validation
    const referenceName = formData.referenceName?.trim() || "";
    const phoneNumber = formData.phoneNumber?.trim() || "";
    const candidateName = formData.candidateName?.trim() || "";
    const emailId = formData.emailId?.trim() || "";
    const meetingDate = formData.meetingDate?.trim() || "";

    console.log("Trimmed values:", {
      referenceName,
      phoneNumber,
      candidateName,
      emailId,
      meetingDate,
    });

    if (!referenceName) {
      console.error("❌ Validation failed: referenceName is empty");
      setResult({
        success: false,
        error: "Reference Name is required",
      });
      return;
    }

    if (!phoneNumber) {
      console.error("❌ Validation failed: phoneNumber is empty");
      setResult({
        success: false,
        error: "Phone Number is required",
      });
      return;
    }

    if (!candidateName) {
      console.error("❌ Validation failed: candidateName is empty");
      setResult({
        success: false,
        error: "Candidate Name is required",
      });
      return;
    }

    if (emailId && !validateEmail(emailId)) {
      console.error("❌ Validation failed: invalid email format");
      setResult({
        success: false,
        error: "Invalid email format",
      });
      return;
    }

    if (emailId && !meetingDate) {
      console.error("❌ Validation failed: email provided but no meeting date");
      setResult({
        success: false,
        error: "Meeting Date is required when Email is provided",
      });
      return;
    }

    if (meetingDate && !emailId) {
      console.error("❌ Validation failed: meeting date provided but no email");
      setResult({
        success: false,
        error: "Email ID is required when Meeting Date is provided",
      });
      return;
    }

    console.log("✅ All validations passed");
    setIsLoading(true);

    try {
      const payload = {
        phoneNumber,
        candidateName,
        referenceName,
        companyName: formData.companyName?.trim() || "",
        roleTitle: formData.roleTitle?.trim() || "",
        workDuration: formData.workDuration?.trim() || "",
        emailId,
        meetingDate,
      };

      console.log("📤 Sending payload:", payload);

      const response = await fetch("/api/reference-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("📥 Response status:", response.status);

      const contentType = response.headers.get("content-type");

      if (!contentType || !contentType.includes("application/json")) {
        console.error("❌ Invalid content type:", contentType);
        throw new Error("Server returned invalid response - not JSON");
      }

      const data = await response.json();

      console.log("📥 Response data:", data);

      if (response.ok && data.success) {
        console.log("✅ Success! Reference saved");
        setResult({
          success: true,
          message: data.message || "Reference saved successfully",
        });

        // Call the callback if provided
        if (onCallInitiated) {
          onCallInitiated(data.id, referenceName);
        }

        // Reset form
        setFormData({
          phoneNumber: "",
          candidateName: candidateName,
          referenceName: "",
          companyName: "",
          roleTitle: "",
          workDuration: "",
          emailId: "",
          meetingDate: "",
        });

        // Clear success message after 5 seconds
        setTimeout(() => setResult(null), 5000);
      } else {
        console.error("❌ API returned error:", data.error);
        setResult({
          success: false,
          error: data.error || "Failed to save reference",
        });
      }
    } catch (error) {
      console.error("❌ Request error:", error);
      setResult({
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      });
    } finally {
      setIsLoading(false);
      console.log("=== FORM SUBMISSION END ===");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Add Reference
      </h2>

      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-blue-800 text-sm">
          🤖 <strong>Natural AI Conversation</strong>
          <br />
          AI conducts a friendly, professional reference check with context
          about the candidate.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference Name *
          </label>
          <Input
            type="text"
            value={formData.referenceName}
            onChange={(e) => handleInputChange("referenceName", e.target.value)}
            placeholder="Mike Johnson"
            className="w-full"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Current: {formData.referenceName || "(empty)"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <Input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
            placeholder="+1234567890"
            className="w-full"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Current: {formData.phoneNumber || "(empty)"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Name *
          </label>
          <Input
            type="text"
            value={formData.candidateName}
            onChange={(e) => handleInputChange("candidateName", e.target.value)}
            placeholder="John Doe"
            className="w-full"
            disabled={isLoading}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Current: {formData.candidateName || "(empty)"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name
          </label>
          <Input
            type="text"
            value={formData.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            placeholder="Google"
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Helps AI ask contextual questions
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Title
          </label>
          <Input
            type="text"
            value={formData.roleTitle}
            onChange={(e) => handleInputChange("roleTitle", e.target.value)}
            placeholder="Software Engineer"
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional context for the conversation
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Work Duration
          </label>
          <Input
            type="text"
            value={formData.workDuration}
            onChange={(e) => handleInputChange("workDuration", e.target.value)}
            placeholder="2 years"
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional timeline information
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email ID
          </label>
          <Input
            type="email"
            value={formData.emailId}
            onChange={(e) => handleInputChange("emailId", e.target.value)}
            placeholder="reference@example.com"
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - Leave blank to skip email invite
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Date
          </label>
          <Input
            type="datetime-local"
            value={formData.meetingDate}
            onChange={(e) => handleInputChange("meetingDate", e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Optional - Required if email is provided
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Confirm"}
        </Button>
      </form>

      {result && (
        <div
          className={`mt-4 p-4 rounded-md ${
            result.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <div className="text-green-800">
              <p className="font-medium">✅ {result.message}</p>
            </div>
          ) : (
            <div className="text-red-800">
              <p className="font-medium">❌ {result.error}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p className="font-medium mb-2">
          🎯 AI will ask natural questions like:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            &quot;In what context did you work with [Candidate] at
            [Company]?&quot;
          </li>
          <li>
            &quot;Can you share any projects you remember [Candidate] working
            on?&quot;
          </li>
          <li>
            &quot;How would you describe [Candidate]&apos;s work style?&quot;
          </li>
          <li>&quot;What were [Candidate]&apos;s main strengths?&quot;</li>
          <li>&quot;Would you work with [Candidate] again?&quot;</li>
        </ul>
        <p className="mt-2 text-blue-600 font-medium">
          💬 Simple, friendly conversation - just like talking to a colleague!
        </p>
      </div>
    </div>
  );
}
