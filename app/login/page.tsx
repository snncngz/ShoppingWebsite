import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Lucien Perrin hesabınıza giriş yapın.",
};

export default function LoginPage() {
  return <LoginForm />;
}
