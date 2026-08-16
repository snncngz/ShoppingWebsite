import type { Metadata } from "next";

import { AccountDashboard } from "@/components/account/AccountDashboard";
import { AuthGuard } from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Hesabım",
  description: "Lucien Perrin hesap bilgileriniz, adresiniz ve siparişleriniz.",
};

export default function AccountPage() {
  return (
    <AuthGuard>
      <AccountDashboard />
    </AuthGuard>
  );
}
