import Link from "next/link";

import { EmptyState } from "@/components/category/EmptyState";

export default function ProductNotFound() {
  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Ürün bulunamadı"
          message="Aradığınız parça koleksiyonda yer almıyor veya bağlantı güncel değil."
        />
        <p className="mt-8 text-center">
          <Link
            href="/"
            className="text-12 tracking-nav text-charcoal transition-colors hover:text-black"
          >
            Anasayfaya Dön
          </Link>
        </p>
      </div>
    </section>
  );
}
