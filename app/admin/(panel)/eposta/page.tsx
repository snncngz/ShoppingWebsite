import type { Metadata } from "next";

import { AdminMailForm } from "@/components/admin/AdminMailForm";

export const metadata: Metadata = {
  title: "E-posta",
};

export default function AdminMailPage() {
  return <AdminMailForm />;
}
