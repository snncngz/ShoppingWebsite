import { EmptyState } from "@/components/category/EmptyState";

export default function ProductNotFound() {
  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="Ürün bulunamadı"
          message="Aradığınız parça koleksiyonda yer almıyor veya bağlantı güncel değil."
          actionHref="/"
          actionLabel="Anasayfaya Dön"
        />
      </div>
    </section>
  );
}
