import { Breadcrumbs } from "@/components/category/Breadcrumbs";
import { ProductAccordion } from "@/components/product/ProductAccordion";
import { faqItems } from "@/data/faq";

export function FaqPage() {
  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs
          items={[
            { label: "Anasayfa", href: "/" },
            { label: "SSS", href: "/sss" },
          ]}
        />
        <p className="mt-8 text-12 tracking-label text-taupe">Support</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          Sıkça Sorulan Sorular
        </h1>
        <p className="mt-4 text-16 text-charcoal">
          Kargo, iade, beden değişimi ve parfüm koşulları. Cevaplar VELORA’nın
          sakin butik ritmine göredir.
        </p>
        <div className="mt-12">
          <ProductAccordion
            items={faqItems.map((item) => ({
              id: item.id,
              title: item.title,
              body: item.body,
            }))}
          />
        </div>
      </div>
    </section>
  );
}
