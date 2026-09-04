"use client";

import { FormEvent, useState } from "react";

export function Newsletter() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-12 tracking-label text-taupe">Correspondence</p>
        <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
          Stay in the Know
        </h2>
        <p className="mt-4 text-16 text-charcoal">
          Yeni extrait’ler, sınırlı lansmanlar ve maison’dan haberler.
        </p>

        {submitted ? (
          <p className="mt-8 text-16 text-accent" role="status">
            Teşekkürler, listemize eklendiniz.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <label htmlFor="homepage-newsletter-email" className="sr-only">
              E-posta adresi
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="homepage-newsletter-email"
                type="email"
                name="email"
                required
                placeholder="E-posta adresiniz"
                autoComplete="email"
                className="h-12 w-full rounded-sm border border-border bg-off-white px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe"
              />
              <button
                type="submit"
                className="h-12 shrink-0 bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
              >
                Kaydol
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
