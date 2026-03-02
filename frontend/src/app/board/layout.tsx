import React from "react";
import { ApplicantProvider } from "@/lib/contexts/ApplicantContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { SettingsProvider } from "@/lib/contexts/SettingsContext";

export default function BoardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
      <ApplicantProvider>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </ApplicantProvider>
    </SettingsProvider>
  );
}