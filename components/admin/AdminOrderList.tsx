"use client";

import { useCallback, useEffect, useState } from "react";

import { ErrorState } from "@/components/ui/ErrorState";
import { getAdminErrorMessage } from "@/lib/adminApi";
import {
  getAdminOrder,
  listAdminOrders,
  updateAdminOrderStatus,
} from "@/lib/adminOrders";
import { nextOrderStatuses } from "@/lib/orderTransitions";
import {
  ADMIN_ORDER_STATUS_LABELS,
  ADMIN_ORDER_STATUSES,
  formatOrderDate,
  formatOrderNumber,
} from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type {
  AdminOrderDetailDto,
  AdminOrderListItemDto,
  OrderStatusDto,
  PaginationDto,
} from "@/types/api";

const PAGE_SIZE = 20;

export function AdminOrderList() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatusDto | "all">("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminOrderListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrderDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(false);

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
      const data = await listAdminOrders({
        page,
        limit: PAGE_SIZE,
        status,
        search,
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
  }, [page, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    setNotice("");
    try {
      setDetail(await getAdminOrder(id));
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = async (next: OrderStatusDto) => {
    if (!detail || next === detail.status) {
      return;
    }

    setPendingStatus(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateAdminOrderStatus(detail.id, next);
      setDetail(updated);
      setRows((current) => {
        if (status !== "all" && updated.status !== status) {
          return current.filter((row) => row.id !== updated.id);
        }
        return current.map((row) =>
          row.id === updated.id ? { ...row, status: updated.status } : row,
        );
      });
      setNotice("Sipariş durumu güncellendi.");
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPendingStatus(false);
    }
  };

  return (
    <div>
      <p className="text-12 tracking-label text-taupe">Orders</p>
      <h1 className="mt-3 font-heading text-32 text-black">Siparişler</h1>
      <p className="mt-3 max-w-2xl text-14 text-taupe">
        Siparişler PostgreSQL üzerinden yönetilir. Durum değişikliği stok
        düşmez; iptal kayıt silmez.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-12 tracking-label text-charcoal">
          Ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sipariş no, müşteri, e-posta"
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          />
        </label>
        <label className="sm:w-56 text-12 tracking-label text-charcoal">
          Durum
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as OrderStatusDto | "all");
              setPage(1);
            }}
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          >
            <option value="all">Tümü</option>
            {ADMIN_ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {ADMIN_ORDER_STATUS_LABELS[value]}
              </option>
            ))}
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
        <p className="mt-8 text-14 text-taupe">Kayıtlı sipariş yok.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {rows.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => void openDetail(order.id)}
                className="flex w-full flex-wrap items-center justify-between gap-4 border border-border bg-off-white px-6 py-5 text-left hover:border-taupe"
              >
                <div>
                  <p className="font-heading text-24 text-black">
                    {formatOrderNumber(order.id)}
                  </p>
                  <p className="mt-1 text-12 text-taupe">
                    {formatOrderDate(order.createdAt)} · {order.itemCount} kalem
                  </p>
                  <p className="mt-1 text-12 text-charcoal">
                    {order.user.name} · {order.user.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-12 tracking-label text-charcoal">
                    {ADMIN_ORDER_STATUS_LABELS[order.status]}
                  </p>
                  <p className="mt-2 text-14 text-black">
                    {formatPrice(order.total)}
                  </p>
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
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-12 tracking-label text-taupe">Sipariş detayı</p>
                  <h2 className="mt-2 font-heading text-24 text-black">
                    {formatOrderNumber(detail.id)}
                  </h2>
                </div>
                <label className="text-12 tracking-label text-charcoal">
                  Durum
                  <select
                    value={detail.status}
                    disabled={pendingStatus}
                    onChange={(event) =>
                      void changeStatus(event.target.value as OrderStatusDto)
                    }
                    className="mt-2 h-12 min-w-44 border border-border bg-ivory px-4 text-14"
                  >
                    {nextOrderStatuses(detail.status).map((value) => (
                      <option key={value} value={value}>
                        {ADMIN_ORDER_STATUS_LABELS[value]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <dl className="mt-6 grid gap-3 text-14 sm:grid-cols-2">
                <div>
                  <dt className="text-taupe">Müşteri</dt>
                  <dd className="text-charcoal">{detail.user.name}</dd>
                </div>
                <div>
                  <dt className="text-taupe">E-posta</dt>
                  <dd className="text-charcoal">{detail.user.email}</dd>
                </div>
                <div>
                  <dt className="text-taupe">Tarih</dt>
                  <dd className="text-charcoal">
                    {formatOrderDate(detail.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-taupe">Toplam</dt>
                  <dd className="text-charcoal">{formatPrice(detail.total)}</dd>
                </div>
              </dl>

              <ul className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
                {detail.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-3 text-14"
                  >
                    <div>
                      <p className="text-charcoal">{item.product.name}</p>
                      <p className="mt-1 text-12 text-taupe">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <p className="text-charcoal">{formatPrice(item.lineTotal)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
