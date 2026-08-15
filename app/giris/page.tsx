import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Giriş",
  description: "VELORA hesabınıza giriş yapın.",
};

export default function LoginPage() {
  return <LoginForm />;
}
