"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { getAdminErrorMessage } from "@/lib/adminApi";
import {
  getAdminInventory,
  listAdminInventory,
  listAdminInventoryMovements,
  updateAdminInventory,
} from "@/lib/adminInventory";
import { formatOrderDate } from "@/lib/orders";
import type {
  AdminInventoryItemDto,
  InventoryMovementDto,
  InventoryMovementTypeDto,
  PaginationDto,
  StockStatusDto,
} from "@/types/api";

const PAGE_SIZE = 20;

const STOCK_STATUS_LABELS: Record<StockStatusDto, string> = {
  IN_STOCK: "Stokta",
  LOW_STOCK: "Düşük stok",
  OUT_OF_STOCK: "Tükendi",
};

const MOVEMENT_LABELS: Record<InventoryMovementTypeDto, string> = {
  SALE: "Satış",
  RESTOCK: "Giriş",
  RETURN: "İade",
  CANCELLATION: "İptal",
  ADJUSTMENT: "Düzeltme",
};

function formatDelta(quantity: number): string {
  return quantity > 0 ? `+${quantity}` : String(quantity);
}

export function AdminInventoryList() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatusDto | "all">("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminInventoryItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminInventoryItemDto | null>(null);
  const [movements, setMovements] = useState<InventoryMovementDto[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [stockInput, setStockInput] = useState("");
  const [thresholdInput, setThresholdInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminInventory({
        page,
        limit: PAGE_SIZE,
        search,
        stockStatus,
      });
      setRows(data.items);
      setPagination(data.pagination);
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
      setRows([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, search, stockStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setMovements([]);
    setDetailLoading(true);
    setNotice("");
    try {
      const [item, history] = await Promise.all([
        getAdminInventory(id),
        listAdminInventoryMovements(id, { page: 1, limit: 20 }),
      ]);
      setDetail(item);
      setMovements(history.items);
      setStockInput(String(item.stock));
      setThresholdInput(String(item.lowStockThreshold));
      setReasonInput("");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setDetailLoading(false);
    }
  };

  const save = async () => {
    if (!detail) {
      return;
    }

    const stock = Number(stockInput);
    const threshold = Number(thresholdInput);
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stok sıfır veya daha büyük bir tam sayı olmalıdır.");
      return;
    }
    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Eşik sıfır veya daha büyük bir tam sayı olmalıdır.");
      return;
    }

    setPending(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateAdminInventory(detail.id, {
        stock,
        lowStockThreshold: threshold,
        reason: reasonInput.trim() || undefined,
      });
      setDetail(updated);
      setStockInput(String(updated.stock));
      setThresholdInput(String(updated.lowStockThreshold));
      setRows((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      const history = await listAdminInventoryMovements(updated.id, {
        page: 1,
        limit: 20,
      });
      setMovements(history.items);
      setNotice("Stok güncellendi.");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <p className="text-12 tracking-label text-taupe">Inventory</p>
      <h1 className="mt-3 font-heading text-32 text-black">Stok</h1>
      <p className="mt-3 max-w-2xl text-14 text-taupe">
        Stok PostgreSQL üzerinden yönetilir. Sipariş satış düşer, iptal iade
        eder; geçmiş silinmez.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-12 tracking-label text-charcoal">
          Ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ürün adı veya slug"
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          />
        </label>
        <label className="sm:w-56 text-12 tracking-label text-charcoal">
          Durum
          <select
            value={stockStatus}
            onChange={(event) => {
              setStockStatus(event.target.value as StockStatusDto | "all");
              setPage(1);
            }}
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          >
            <option value="all">Tümü</option>
            <option value="IN_STOCK">Stokta</option>
            <option value="LOW_STOCK">Düşük stok</option>
            <option value="OUT_OF_STOCK">Tükendi</option>
          </select>
        </label>
      </div>

      {notice ? <p className="mt-6 text-14 text-charcoal">{notice}</p> : null}
      {error && !loading ? <p className="mt-6 text-14 text-accent">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-12 tracking-label text-taupe">Yükleniyor</p>
      ) : error && rows.length === 0 ? (
        <div className="mt-8">
          <ErrorState message={error} onRetry={() => void load()} />
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-14 text-taupe">Kayıtlı ürün yok.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {rows.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void openDetail(item.id)}
                className="flex w-full flex-wrap items-center justify-between gap-4 border border-border bg-off-white px-6 py-5 text-left hover:border-taupe"
              >
                <div>
                  <p className="font-heading text-24 text-black">{item.name}</p>
                  <p className="mt-1 text-12 text-taupe">{item.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-12 tracking-label text-charcoal">
                    {STOCK_STATUS_LABELS[item.stockStatus]}
                  </p>
                  <p className="mt-2 text-14 text-black">{item.stock} adet</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-8 flex items-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="h-11 px-4 text-12 tracking-nav text-charcoal disabled:opacity-40"
          >
            Önceki
          </button>
          <p className="text-12 text-taupe">
            {pagination.page} / {pagination.totalPages}
          </p>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="h-11 px-4 text-12 tracking-nav text-charcoal disabled:opacity-40"
          >
            Sonraki
          </button>
        </div>
      ) : null}

      {selectedId ? (
        <section className="mt-10 border border-border bg-off-white p-6">
          {detailLoading || !detail ? (
            <p className="text-12 tracking-label text-taupe">Yükleniyor</p>
          ) : (
            <>
              <p className="text-12 tracking-label text-taupe">Stok detayı</p>
              <h2 className="mt-2 font-heading text-24 text-black">
                {detail.name}
              </h2>
              <p className="mt-1 text-12 text-taupe">{detail.slug}</p>
              <p className="mt-2 text-14 text-charcoal">
                {STOCK_STATUS_LABELS[detail.stockStatus]} · eşik{" "}
                {detail.lowStockThreshold}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <label className="text-12 tracking-label text-charcoal">
                  Stok
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={stockInput}
                    onChange={(event) => setStockInput(event.target.value)}
                    className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
                  />
                </label>
                <label className="text-12 tracking-label text-charcoal">
                  Düşük stok eşiği
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={thresholdInput}
                    onChange={(event) => setThresholdInput(event.target.value)}
                    className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
                  />
                </label>
                <label className="text-12 tracking-label text-charcoal">
                  Not
                  <input
                    type="text"
                    value={reasonInput}
                    onChange={(event) => setReasonInput(event.target.value)}
                    placeholder="İsteğe bağlı"
                    className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={pending}
                onClick={() => void save()}
                className="mt-6 inline-flex h-12 items-center bg-charcoal px-6 text-12 tracking-nav text-ivory hover:bg-black disabled:opacity-50"
              >
                Kaydet
              </button>

              <h3 className="mt-10 text-12 tracking-label text-black">
                Stok geçmişi
              </h3>
              {movements.length === 0 ? (
                <p className="mt-4 text-14 text-taupe">Hareket yok.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {movements.map((movement) => (
                    <li
                      key={movement.id}
                      className="flex flex-wrap items-center justify-between gap-3 text-14"
                    >
                      <div>
                        <p className="text-charcoal">
                          {MOVEMENT_LABELS[movement.type]}
                        </p>
                        <p className="mt-1 text-12 text-taupe">
                          {formatOrderDate(movement.createdAt)}
                          {movement.reason ? ` · ${movement.reason}` : ""}
                        </p>
                      </div>
                      <p className="text-charcoal">
                        {formatDelta(movement.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
