"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { DEMO_ADMIN, isAdminLoggedIn, loginAdmin } from "@/lib/adminStore";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string>(DEMO_ADMIN.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminLoggedIn()) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!loginAdmin(email, password)) {
      setError("Demo giriş bilgileri: admin@velora.com / velora");
      return;
    }

    router.replace("/admin");
  };

  return (
    <section className="flex min-h-screen items-center bg-ivory px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <p className="text-12 tracking-label text-taupe">Admin</p>
        <h1 className="mt-3 font-heading text-32 text-black">Yönetim girişi</h1>
        <p className="mt-4 text-14 text-taupe">
          Frontend-only demo. Gerçek kimlik doğrulama yoktur.
        </p>
        <p className="mt-2 text-14 text-charcoal">
          {DEMO_ADMIN.email} · {DEMO_ADMIN.password}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
          <label className="text-12 tracking-label text-charcoal">
            E-posta
            <input
              type="email"
              name="email"
              autoComplete="username"
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
            className="mt-2 inline-flex h-12 items-center justify-center bg-charcoal text-12 tracking-nav text-ivory hover:bg-black"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </section>
  );
}
