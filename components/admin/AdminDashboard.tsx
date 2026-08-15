"use client";

import Link from "next/link";

import { useCatalog } from "@/context/CatalogContext";
import { clearAdminStore } from "@/lib/adminStore";
import { isOriginalProduct } from "@/lib/catalog";
import { demoOrders } from "@/data/orders";
import { formatPrice } from "@/lib/utils";

export function AdminDashboard() {
  const { products, store, refresh } = useCatalog();
  const hiddenCount = Object.values(store.productOverrides).filter(
    (item) => item.hidden,
  ).length;
  const createdCount = store.newProducts.length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 5);
  const outOfStock = products.filter((product) => product.stock === 0);
  const originalVisible = products.filter((product) => isOriginalProduct(product.id)).length;

  const handleReset = () => {
    if (!window.confirm("Tüm admin override'ları silinsin mi? Orijinal 30 ürün geri gelir.")) {
      return;
    }

    clearAdminStore();
    refresh();
  };

  return (
    <div>
      <p className="text-12 tracking-label text-taupe">Overview</p>
      <h1 className="mt-3 font-heading text-32 text-black">Panel</h1>
      <p className="mt-3 max-w-2xl text-14 text-taupe">
        Değişiklikler tarayıcı localStorage üzerinde tutulur. `data/products.ts`
        içindeki 30 demo ürün silinmez.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Yayındaki ürün" value={String(products.length)} />
        <Stat label="Orijinal (görünür)" value={String(originalVisible)} />
        <Stat label="Yeni eklenen" value={String(createdCount)} />
        <Stat label="Gizlenen" value={String(hiddenCount)} />
      </ul>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="border border-border bg-off-white p-6">
          <h2 className="text-12 tracking-label text-black">Stok uyarısı</h2>
          {outOfStock.length === 0 && lowStock.length === 0 ? (
            <p className="mt-4 text-14 text-taupe">Kritik stok yok.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {outOfStock.map((product) => (
                <li key={product.id} className="flex justify-between gap-4 text-14">
                  <Link href={`/admin/urunler/${product.id}`} className="text-charcoal hover:text-black">
                    {product.name}
                  </Link>
                  <span className="text-accent">Tükendi</span>
                </li>
              ))}
              {lowStock.map((product) => (
                <li key={product.id} className="flex justify-between gap-4 text-14">
                  <Link href={`/admin/urunler/${product.id}`} className="text-charcoal hover:text-black">
                    {product.name}
                  </Link>
                  <span className="text-taupe">{product.stock} adet</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border border-border bg-off-white p-6">
          <h2 className="text-12 tracking-label text-black">Demo siparişler</h2>
          <p className="mt-4 text-14 text-charcoal">{demoOrders.length} kayıtlı demo sipariş</p>
          <p className="mt-2 text-14 text-taupe">
            Son sipariş toplamı {formatPrice(demoOrders[0]?.total ?? 0)}
          </p>
          <Link
            href="/admin/siparisler"
            className="mt-6 inline-flex h-11 items-center text-12 tracking-nav text-charcoal hover:text-black"
          >
            Siparişleri gör
          </Link>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/urunler/yeni"
          className="inline-flex h-12 items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
        >
          Yeni ürün
        </Link>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex h-12 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal hover:bg-charcoal hover:text-ivory"
        >
          Katalogu sıfırla
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="border border-border bg-off-white px-6 py-5">
      <p className="text-12 tracking-label text-taupe">{label}</p>
      <p className="mt-3 font-heading text-32 text-black">{value}</p>
    </li>
  );
}
