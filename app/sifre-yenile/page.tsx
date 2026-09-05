import type { Metadata } from "next";
import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Şifre yenile",
  description: "Lucien Perrin hesabınızın şifresini yenileyin.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-md">
            <p className="text-12 tracking-label text-taupe">Yükleniyor</p>
          </div>
        </section>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
