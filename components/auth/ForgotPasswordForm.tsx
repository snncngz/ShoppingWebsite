"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";

import { forgotPasswordRequest, getAuthErrorMessage } from "@/lib/authApi";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("E-posta gerekli.");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");
    try {
      await forgotPasswordRequest(email);
      setNotice("Varsa bu adrese şifre yenileme bağlantısı gönderildi.");
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
          Şifremi unuttum
        </h1>
        <p className="mt-4 text-14 text-taupe">
          Kayıtlı e-posta adresinizi yazın. Bağlantıya tıklayınca yeni şifre belirleyebilirsiniz.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-10 flex flex-col gap-5">
          <label className="text-12 tracking-label text-charcoal">
            E-posta
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={fieldClass}
            />
          </label>
          {error ? <p className="text-14 text-accent">{error}</p> : null}
          {notice ? <p className="text-14 text-charcoal">{notice}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-60"
          >
            {pending ? "Gönderiliyor" : "Bağlantı gönder"}
          </button>
        </form>

        <p className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center text-16 text-charcoal underline underline-offset-4"
          >
            Girişe dön
          </Link>
        </p>
      </div>
    </section>
  );
}
