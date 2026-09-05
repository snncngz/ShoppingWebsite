import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Şifremi unuttum",
  description: "Lucien Perrin hesabınız için şifre yenileme bağlantısı alın.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
