import type { Metadata } from "next";

import { EmptyState } from "@/components/category/EmptyState";

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  description: "Aradığınız sayfa taşınmış veya artık mevcut değil.",
};

export default function RootNotFound() {
  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Sayfa bulunamadı"
          message="Aradığınız sayfa taşınmış veya artık mevcut değil."
          actionHref="/"
          actionLabel="Anasayfaya Dön"
        />
      </div>
    </section>
  );
}
