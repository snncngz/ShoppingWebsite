"use client";

import { useState, type FormEvent } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/lib/authApi";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password || !passwordAgain) {
      setError("Tüm alanlar zorunludur.");
      return;
    }

    if (!email.includes("@")) {
      setError("Geçerli bir e-posta girin.");
      return;
    }

    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }

    if (password !== passwordAgain) {
      setError("Şifreler eşleşmiyor.");
      return;
    }

    setPending(true);
    setError("");

    try {
      await register({ name, email, password });
      router.push("/hesabim");
      router.refresh();
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-md">
        <p className="text-12 tracking-label text-taupe">Account</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">Kayıt</h1>
        <p className="mt-4 text-14 text-taupe">
          Hesap oluşturun. Şifreniz güvenli şekilde saklanır.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          <label className="text-12 tracking-label text-charcoal">
            Ad Soyad
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-12 tracking-label text-charcoal">
            Şifre Tekrar
            <input
              type="password"
              name="passwordAgain"
              autoComplete="new-password"
              value={passwordAgain}
              onChange={(event) => setPasswordAgain(event.target.value)}
              className={fieldClass}
            />
          </label>

          {error ? <p className="text-14 text-accent">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory transition-colors hover:bg-black disabled:opacity-60"
          >
            {pending ? "Kayıt yapılıyor" : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-8 text-14 text-taupe">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-charcoal underline-offset-4 hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </section>
  );
}
