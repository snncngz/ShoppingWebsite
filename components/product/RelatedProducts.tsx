import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@/types";

type RelatedProductsProps = {
  products: Product[];
};

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 lg:mt-32">
      <p className="text-12 tracking-label text-taupe">Related</p>
      <h2 className="mt-3 font-heading text-24 text-black lg:text-32">
        Bu Ürünü Sevenler Bunları Da Sevdi
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
