import type { Metadata } from "next";
import { Suspense } from "react";

import { VerifyEmailView } from "@/components/auth/VerifyEmailView";

export const metadata: Metadata = {
  title: "E-posta doğrulama",
  description: "Lucien Perrin hesabınızın e-posta adresini doğrulayın.",
};

export default async function VerifyEmailTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
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
      <VerifyEmailView token={token} />
    </Suspense>
  );
}
