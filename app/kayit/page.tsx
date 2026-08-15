import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Kayıt",
  description: "VELORA hesabı oluşturun ve koleksiyona üye girişi yapın.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
