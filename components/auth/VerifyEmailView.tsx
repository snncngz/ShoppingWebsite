"use client";

import { useEffect, useRef } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { confirmEmailVerification } from "@/server/actions/verify-email";

export function VerifyEmailView({ token: tokenFromPath }: { token?: string }) {
  const searchParams = useSearchParams();
  const token = (tokenFromPath ?? searchParams.get("token") ?? "").trim();
  const errorCode = searchParams.get("hata");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!token || errorCode) {
      return;
    }
    formRef.current?.requestSubmit();
  }, [errorCode, token]);

  const error =
    errorCode === "gecersiz"
      ? "Doğrulama bağlantısı geçersiz veya süresi dolmuş."
      : errorCode === "eksik" || !token
        ? "Doğrulama bağlantısı eksik."
        : "";

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <p className="text-12 tracking-label text-taupe">Hesap</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          E-posta doğrulama
        </h1>

        {error ? (
          <>
            <p className="mt-4 text-14 text-accent">{error}</p>
            <p className="mt-8 text-14 text-taupe">
              <Link href="/login" className="text-charcoal underline-offset-4 hover:underline">
                Giriş sayfasına dön
              </Link>
            </p>
          </>
        ) : (
          <form ref={formRef} action={confirmEmailVerification} className="mt-8">
            <input type="hidden" name="token" value={token} />
            <p className="text-14 text-taupe">Hesabınız doğrulanıyor…</p>
            <button
              type="submit"
              className="relative z-10 mt-6 inline-flex min-h-12 w-full items-center justify-center bg-charcoal text-14 tracking-nav text-ivory"
            >
              E-postamı doğrula
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
