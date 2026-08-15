"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCatalog } from "@/context/CatalogContext";
import {
  commitAdminStore,
  removeProductOverride,
  upsertProductOverride,
} from "@/lib/adminStore";
import { listAdminProducts } from "@/lib/catalog";
import { CATEGORY_NAMES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export function AdminProductTable() {
  const router = useRouter();
  const { store, refresh } = useCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const rows = useMemo(() => listAdminProducts(store), [store]);

  const visible = rows.filter((row) => {
    const matchesQuery =
      !query.trim() ||
      row.name.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR"));
    const matchesCategory = category === "all" || row.category === category;
    return matchesQuery && matchesCategory;
  });

  const toggleHidden = (id: string, hidden: boolean) => {
    commitAdminStore((current) => upsertProductOverride(current, id, { hidden }));
    refresh();
  };

  const removeNew = (id: string) => {
    if (!window.confirm("Bu ürün admin katalogundan silinsin mi?")) {
      return;
    }

    commitAdminStore((current) => ({
      ...removeProductOverride(current, id),
      newProducts: current.newProducts.filter((product) => product.id !== id),
    }));
    refresh();
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-12 tracking-label text-taupe">Catalog</p>
          <h1 className="mt-3 font-heading text-32 text-black">Ürünler</h1>
        </div>
        <Link
          href="/admin/urunler/yeni"
          className="inline-flex h-12 items-center justify-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black"
        >
          Yeni ürün
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-12 tracking-label text-charcoal">
          Ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          />
        </label>
        <label className="sm:w-56 text-12 tracking-label text-charcoal">
          Kategori
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          >
            <option value="all">Tümü</option>
            {CATEGORY_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 overflow-x-auto border border-border">
        <table className="min-w-[720px] w-full text-left text-14">
          <thead className="border-b border-border bg-off-white text-12 tracking-label text-taupe">
            <tr>
              <th className="px-4 py-3 font-normal">Ürün</th>
              <th className="px-4 py-3 font-normal">Kategori</th>
              <th className="px-4 py-3 font-normal">Fiyat</th>
              <th className="px-4 py-3 font-normal">Stok</th>
              <th className="px-4 py-3 font-normal">Durum</th>
              <th className="px-4 py-3 font-normal">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-4">
                  <p className="text-charcoal">{row.name}</p>
                  <p className="mt-1 text-12 text-taupe">
                    {row.origin === "original" ? "Orijinal" : "Admin"}
                  </p>
                </td>
                <td className="px-4 py-4 text-taupe">{row.category}</td>
                <td className="px-4 py-4">{formatPrice(row.price)}</td>
                <td className="px-4 py-4">{row.stock}</td>
                <td className="px-4 py-4">
                  {row.hidden ? "Gizli" : row.stock === 0 ? "Tükendi" : "Yayında"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/urunler/${row.id}`)}
                      className="h-11 px-3 text-12 tracking-nav text-charcoal hover:text-black"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleHidden(row.id, !row.hidden)}
                      className="h-11 px-3 text-12 tracking-nav text-charcoal hover:text-black"
                    >
                      {row.hidden ? "Yayınla" : "Gizle"}
                    </button>
                    {row.origin === "new" ? (
                      <button
                        type="button"
                        onClick={() => removeNew(row.id)}
                        className="h-11 px-3 text-12 tracking-nav text-accent"
                      >
                        Sil
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
