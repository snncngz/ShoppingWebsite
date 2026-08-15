"use client";

import { EmptyState } from "@/components/category/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { useCatalog } from "@/context/CatalogContext";
import { useWishlist } from "@/context/WishlistContext";

export function FavoritesView() {
  const { ids, hydrated } = useWishlist();
  const { getById, hydrated: catalogHydrated } = useCatalog();
  const products = ids
    .map((id) => getById(id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  if (!hydrated || !catalogHydrated) {
    return (
      <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Favorileriniz Henüz Boş"
            message="Beğendiğiniz ürünleri favorilerinize ekleyin."
            actionHref="/"
            actionLabel="Alışverişe Devam Et"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <p className="text-12 tracking-label text-taupe">Wishlist</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          Favoriler
        </h1>
        <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 lg:gap-8">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
