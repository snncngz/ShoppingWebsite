"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ErrorState } from "@/components/ui/ErrorState";
import { getAdminErrorMessage } from "@/lib/adminApi";
import {
  hideAdminApiProduct,
  listAdminApiProducts,
  setAdminApiProductActive,
  type AdminProductListItem,
} from "@/lib/adminProducts";
import { CATEGORY_NAMES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export function AdminProductTable() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [rows, setRows] = useState<AdminProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await listAdminApiProducts());
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryOptions = useMemo(() => {
    const fromRows = rows.map((row) => row.category);
    return [...new Set([...CATEGORY_NAMES, ...fromRows])];
  }, [rows]);

  const visible = rows.filter((row) => {
    const matchesQuery =
      !query.trim() ||
      row.name.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR"));
    const matchesCategory = category === "all" || row.category === category;
    return matchesQuery && matchesCategory;
  });

  const toggleHidden = async (id: string, hidden: boolean) => {
    setPendingId(id);
    setError("");
    setNotice("");
    try {
      const updated = await setAdminApiProductActive(id, !hidden);
      setRows((current) =>
        current.map((row) =>
          row.id === id ? { ...row, hidden: !updated.isActive } : row,
        ),
      );
      setNotice(updated.isActive ? "Ürün yayınlandı." : "Ürün gizlendi.");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPendingId(null);
    }
  };

  const removeRow = async (id: string) => {
    if (!window.confirm("Bu ürün vitrinden gizlensin mi? Kayıt veritabanında kalır.")) {
      return;
    }

    setPendingId(id);
    setError("");
    setNotice("");
    try {
      const updated = await hideAdminApiProduct(id);
      setRows((current) =>
        current.map((row) =>
          row.id === id ? { ...row, hidden: !updated.isActive } : row,
        ),
      );
      setNotice("Ürün gizlendi.");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPendingId(null);
    }
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
            {categoryOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {notice ? <p className="mt-6 text-14 text-charcoal">{notice}</p> : null}
      {error && !loading ? (
        <p className="mt-6 text-14 text-accent">{error}</p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-12 tracking-label text-taupe">Yükleniyor</p>
      ) : error && rows.length === 0 ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => void load()} />
        </div>
      ) : (
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
                    <p className="mt-1 text-12 text-taupe">{row.slug}</p>
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
                        disabled={pendingId === row.id}
                        onClick={() => router.push(`/admin/urunler/${row.id}`)}
                        className="h-11 px-3 text-12 tracking-nav text-charcoal hover:text-black disabled:opacity-50"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === row.id}
                        onClick={() => void toggleHidden(row.id, row.hidden)}
                        className="h-11 px-3 text-12 tracking-nav text-charcoal hover:text-black disabled:opacity-50"
                      >
                        {row.hidden ? "Yayınla" : "Gizle"}
                      </button>
                      <button
                        type="button"
                        disabled={pendingId === row.id}
                        onClick={() => void removeRow(row.id)}
                        className="h-11 px-3 text-12 tracking-nav text-accent disabled:opacity-50"
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
