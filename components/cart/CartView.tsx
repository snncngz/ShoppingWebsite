"use client";

import { EmptyState } from "@/components/category/EmptyState";
import { CartSkeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";
import {
  FREE_SHIPPING_THRESHOLD,
  getShippingFee,
} from "@/lib/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, X } from "lucide-react";
import Link from "next/link";

export function CartView() {
  const {
    items,
    incrementItem,
    decrementItem,
    removeItem,
    hydrated,
  } = useCart();
  const { getById, hydrated: catalogHydrated } = useCatalog();

  const lines = items
    .map((item) => {
      const product = getById(item.productId);
      if (!product) {
        return null;
      }

      return { item, product };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));

  const subtotal = lines.reduce(
    (total, line) => total + line.product.price * line.item.quantity,
    0,
  );
  const discount = lines.reduce((total, line) => {
    if (!line.product.oldPrice || line.product.oldPrice <= line.product.price) {
      return total;
    }

    return (
      total + (line.product.oldPrice - line.product.price) * line.item.quantity
    );
  }, 0);
  const shipping = getShippingFee(subtotal);
  const total = subtotal + shipping;

  if (!hydrated || !catalogHydrated) {
    return <CartSkeleton />;
  }

  if (lines.length === 0) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Sepetiniz Boş"
            message="Koleksiyondan bir parça eklediğinizde burada görünecek."
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
        <p className="text-12 tracking-label text-taupe">Bag</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">Sepet</h1>

        <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul className="flex flex-col gap-8">
            {lines.map(({ item, product }) => {
              const isPerfume = Boolean(product.perfumeDetails);
              const image = product.images[0];

              return (
                <li
                  key={item.id}
                  className="flex gap-4 border-b border-border pb-8 sm:gap-6"
                >
                  <Link
                    href={`/urun/${product.slug}`}
                    className="relative h-32 w-24 shrink-0 overflow-hidden bg-off-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-12 tracking-label text-taupe">
                          {product.category}
                        </p>
                        <Link href={`/urun/${product.slug}`}>
                          <h2 className="mt-1 font-heading text-18 text-black sm:text-24">
                            {product.name}
                          </h2>
                        </Link>
                        <p className="mt-2 text-12 text-taupe">
                          {item.color ? item.color : ""}
                          {item.color && item.size ? " · " : ""}
                          {item.size
                            ? `${isPerfume ? "Hacim" : "Beden"} ${item.size}`
                            : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Kaldır"
                        onClick={() => removeItem(item.id)}
                        className="flex h-11 w-11 items-center justify-center text-taupe hover:text-black"
                      >
                        <X size={16} strokeWidth={1.4} />
                      </button>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="inline-flex h-12 items-center border border-border">
                        <button
                          type="button"
                          aria-label="Azalt"
                          onClick={() => decrementItem(item.id)}
                          className="flex h-12 w-12 items-center justify-center text-charcoal"
                        >
                          <Minus size={14} strokeWidth={1.4} />
                        </button>
                        <span className="min-w-8 text-center text-14">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Artır"
                          onClick={() => incrementItem(item.id)}
                          className="flex h-12 w-12 items-center justify-center text-charcoal"
                        >
                          <Plus size={14} strokeWidth={1.4} />
                        </button>
                      </div>
                      <p className="text-14 text-charcoal">
                        {formatPrice(product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit border border-border bg-off-white p-8 lg:sticky lg:top-24">
            <h2 className="text-12 tracking-label text-black">Sipariş Özeti</h2>
            <dl className="mt-6 flex flex-col gap-3 text-14">
              <div className="flex justify-between">
                <dt className="text-taupe">Ara Toplam</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-taupe">İndirim</dt>
                  <dd className="text-accent">-{formatPrice(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-taupe">Kargo</dt>
                <dd>
                  {shipping === 0
                    ? "Ücretsiz Kargo"
                    : formatPrice(shipping)}
                </dd>
              </div>
              {shipping > 0 ? (
                <p className="text-12 text-taupe">
                  {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} daha ekleyin,
                  kargo ücretsiz olsun.
                </p>
              ) : null}
              <div className="mt-2 flex justify-between border-t border-border pt-4 text-16 text-black">
                <dt>Toplam</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              className="mt-8 inline-flex h-12 w-full items-center justify-center bg-charcoal text-12 tracking-nav text-ivory transition-colors hover:bg-black"
            >
              Siparişi Tamamla
            </Link>
            <Link
              href="/"
              className="mt-4 inline-flex h-12 w-full items-center justify-center border border-charcoal text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
            >
              Alışverişe Devam Et
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
