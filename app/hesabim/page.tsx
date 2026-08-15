import type { Metadata } from "next";

import { AccountDashboard } from "@/components/account/AccountDashboard";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Hesabım",
};

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountDashboard />
    </AuthGuard>
  );
}
