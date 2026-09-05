"use client";

import { useState, type FormEvent } from "react";

const fieldClass =
  "h-11 w-full rounded-sm border border-border bg-ivory px-3 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe";

export function NewsletterSubscribeForm({
  inputId,
  inputClassName = fieldClass,
  buttonClassName = "h-11 shrink-0 rounded-sm bg-charcoal px-5 text-12 tracking-nav text-ivory transition-colors hover:bg-black disabled:opacity-60",
  layout = "row",
}: {
  inputId: string;
  inputClassName?: string;
  buttonClassName?: string;
  layout?: "row" | "stack";
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("E-posta adresi gerekli.");
      return;
    }

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { success?: boolean };
      if (!response.ok || payload.success === false) {
        setError("Kayıt tamamlanamadı. E-postayı kontrol edin.");
        return;
      }
      setDone(true);
    } catch {
      setError("Kayıt tamamlanamadı.");
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <p className="text-14 text-charcoal" role="status">
        Teşekkürler, listemize eklendiniz.
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <div className={layout === "stack" ? "flex flex-col gap-3 sm:flex-row" : "flex gap-2"}>
        <label htmlFor={inputId} className="sr-only">
          E-posta adresi
        </label>
        <input
          id={inputId}
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-posta adresiniz"
          autoComplete="email"
          className={inputClassName}
        />
        <button type="submit" disabled={pending} className={buttonClassName}>
          {pending ? "Kaydediliyor" : "Kaydol"}
        </button>
      </div>
      {error ? <p className="mt-3 text-14 text-accent">{error}</p> : null}
    </form>
  );
}
