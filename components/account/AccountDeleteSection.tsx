"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { getAuthErrorMessage } from "@/lib/authApi";

const fieldClass =
  "mt-2 h-12 w-full border border-border bg-ivory px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function AccountDeleteSection() {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password) {
      setError("Şifrenizi girin.");
      return;
    }

    setPending(true);
    setError("");
    try {
      await deleteAccount(password);
      router.push("/");
      router.refresh();
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mt-6 border border-border bg-off-white p-8">
      <p className="text-12 tracking-label text-taupe">Hesabı kapat</p>
      <h2 className="mt-3 font-heading text-24 text-black">Hesabı sil</h2>
      <p className="mt-3 max-w-xl text-14 text-taupe">
        Hesabınız, sepetiniz, favorileriniz ve sipariş kayıtlarınız kalıcı olarak
        silinir. Bu işlem geri alınamaz.
      </p>

      {open ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 max-w-md">
          <label className="text-12 tracking-label text-charcoal">
            Şifrenizi doğrulayın
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={fieldClass}
            />
          </label>
          {error ? <p className="mt-3 text-14 text-accent">{error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setPassword("");
                setError("");
              }}
              className="inline-flex h-12 items-center justify-center border border-charcoal px-6 text-12 tracking-nav text-charcoal disabled:opacity-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 items-center justify-center bg-accent px-8 text-12 tracking-nav text-ivory hover:bg-accent/90 disabled:opacity-50"
            >
              {pending ? "Siliniyor" : "Hesabı kalıcı sil"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-6 inline-flex h-12 items-center justify-center border border-accent px-8 text-12 tracking-nav text-accent transition-colors hover:bg-accent hover:text-ivory"
        >
          Hesabı sil
        </button>
      )}
    </section>
  );
}
