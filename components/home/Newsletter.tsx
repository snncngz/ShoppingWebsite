"use client";

import { NewsletterSubscribeForm } from "@/components/newsletter/SubscribeForm";

export function Newsletter() {
  return (
    <section className="bg-ivory px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-12 tracking-label text-taupe">Bülten</p>
        <h2 className="mt-3 font-heading text-32 text-black lg:text-48">
          Yeniliklerden İlk Siz Haberdar Olun!
        </h2>
        <p className="mt-4 text-16 text-charcoal">
          Özel promosyonlar, kişiye özel indirimler ve son yenilikler ile ilgili
          bilgi alabilmek için e-posta listemize kaydolun.
        </p>
        <div className="mt-8">
          <NewsletterSubscribeForm
            inputId="homepage-newsletter-email"
            inputClassName="h-12 w-full rounded-sm border border-border bg-off-white px-4 text-14 text-charcoal outline-none placeholder:text-taupe focus:border-taupe"
            buttonClassName="h-12 shrink-0 bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black disabled:opacity-60"
            layout="stack"
          />
        </div>
      </div>
    </section>
  );
}
