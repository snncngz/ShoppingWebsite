"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { getAuthErrorMessage, resetPasswordRequest } from "@/lib/authApi";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function ResetPasswordForm({ token: tokenFromPath }: { token?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (tokenFromPath ?? searchParams.get("token") ?? "").trim();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError("Bağlantı geçersiz. Şifremi unuttum sayfasından yeni bir e-posta isteyin.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await resetPasswordRequest(token, password);
      router.push("/login");
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <p className="text-12 tracking-label text-taupe">Hesap</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          Şifre yenile
        </h1>
        <p className="mt-4 text-14 text-taupe">
          En az 8 karakter, bir harf ve bir rakam kullanın.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-10 flex flex-col gap-5">
          <label className="text-12 tracking-label text-charcoal">
            Yeni şifre
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-12 tracking-label text-charcoal">
            Şifre tekrar
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={fieldClass}
            />
          </label>
          {error ? <p className="text-14 text-accent">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-60"
          >
            {pending ? "Kaydediliyor" : "Şifreyi kaydet"}
          </button>
        </form>

        <p className="mt-8 text-14 text-taupe">
          <Link href="/login" className="text-charcoal underline-offset-4 hover:underline">
            Girişe dön
          </Link>
        </p>
      </div>
    </section>
  );
}
