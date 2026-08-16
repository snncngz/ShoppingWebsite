import type { Metadata } from "next";

import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Panel",
};

export default function AdminHomePage() {
  return <AdminDashboard />;
}
