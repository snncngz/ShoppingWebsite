import type { Metadata } from "next";

import { AdminWelcomeForm } from "@/components/admin/AdminWelcomeForm";

export const metadata: Metadata = {
  title: "Hoş geldin mesajı",
};

export default function AdminWelcomePage() {
  return <AdminWelcomeForm />;
}
