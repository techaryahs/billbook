import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Aryahs",
  description: "Aryahs Business Manager Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
