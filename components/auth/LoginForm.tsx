"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("E-posta ve şifre gerekli.");
      return;
    }

    login(email);
    router.push("/hesabim");
  };

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <p className="text-12 tracking-label text-taupe">Account</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">Giriş</h1>
        <p className="mt-4 text-14 text-taupe">
          Demo hesap — herhangi bir e-posta ve şifre ile giriş yapabilirsiniz.
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

          <button
            type="submit"
            className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory transition-colors hover:bg-black"
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className="inline-flex h-12 items-center justify-center border border-charcoal text-12 tracking-nav text-charcoal"
          >
            Google ile devam et
          </button>
        </form>

        <p className="mt-8 text-14 text-taupe">
          Hesabınız yok mu?{" "}
          <Link href="/kayit" className="text-charcoal underline-offset-4 hover:underline">
            Kayıt ol
          </Link>
        </p>
      </div>
    </section>
  );
}
