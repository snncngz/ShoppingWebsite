"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/lib/authApi";

export function VerifyEmailView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useAuth();
  const token = searchParams.get("token")?.trim() ?? "";
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"working" | "error">(
    token ? "working" : "error",
  );

  useEffect(() => {
    if (!token) {
      setError("Doğrulama bağlantısı eksik.");
      setStatus("error");
      return;
    }

    let cancelled = false;
    void verifyEmail(token)
      .then((user) => {
        if (cancelled) {
          return;
        }
        router.replace(user.role === "ADMIN" ? "/admin" : "/hesabim");
        router.refresh();
      })
      .catch((caught) => {
        if (cancelled) {
          return;
        }
        setError(getAuthErrorMessage(caught));
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [router, token, verifyEmail]);

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <p className="text-12 tracking-label text-taupe">Account</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          E-posta doğrulama
        </h1>
        {status === "working" ? (
          <p className="mt-4 text-14 text-taupe">Hesabınız doğrulanıyor…</p>
        ) : (
          <>
            <p className="mt-4 text-14 text-accent">{error}</p>
            <p className="mt-8 text-14 text-taupe">
              <Link href="/login" className="text-charcoal underline-offset-4 hover:underline">
                Giriş sayfasına dön
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
