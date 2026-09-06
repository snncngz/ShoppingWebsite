"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage, isUnverifiedEmailError } from "@/lib/authApi";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function LoginForm() {
  const router = useRouter();
  const { login, resendVerification } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [unverified, setUnverified] = useState(false);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("E-posta ve şifre gerekli.");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");
    setUnverified(false);

    try {
      const user = await login(email, password);
      router.push(user.role === "ADMIN" ? "/admin" : "/hesabim");
      router.refresh();
    } catch (caught) {
      setUnverified(isUnverifiedEmailError(caught));
      setError(getAuthErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError("Doğrulama maili için e-posta gerekli.");
      return;
    }

    setResending(true);
    setError("");
    setNotice("");
    try {
      await resendVerification(email);
      setNotice("Doğrulama bağlantısı yeniden gönderildi. Gelen kutunuzu kontrol edin.");
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <p className="text-12 tracking-label text-taupe">Hesap</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">Giriş</h1>
        <p className="mt-4 text-14 text-taupe">
          Lucien Perrin hesabınıza e-posta ve şifrenizle giriş yapın.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
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
          <label className="text-12 tracking-label text-charcoal">
            Şifre
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>

          {error ? <p className="text-14 text-accent">{error}</p> : null}
          {notice ? <p className="text-14 text-charcoal">{notice}</p> : null}

          {unverified ? (
            <button
              type="button"
              disabled={resending}
              onClick={() => void handleResend()}
              className="inline-flex h-12 items-center justify-center border border-charcoal text-12 tracking-nav text-charcoal hover:bg-warm-beige/40 disabled:opacity-60"
            >
              {resending ? "Gönderiliyor" : "Doğrulama mailini tekrar gönder"}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory transition-colors hover:bg-black disabled:opacity-60"
          >
            {pending ? "Giriş yapılıyor" : "Giriş Yap"}
          </button>
        </form>

        <Link
          href="/sifremi-unuttum"
          className="relative z-10 mt-4 inline-flex min-h-12 w-full items-center justify-center text-16 text-charcoal underline underline-offset-4"
        >
          Şifremi unuttum
        </Link>

        <p className="mt-8 text-center text-14 text-taupe">
          Hesabınız yok mu?{" "}
          <Link href="/register" className="text-charcoal underline-offset-4 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </section>
  );
}
