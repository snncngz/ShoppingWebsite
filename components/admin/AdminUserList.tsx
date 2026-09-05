"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";

import { ErrorState } from "@/components/ui/ErrorState";
import { getAdminErrorMessage } from "@/lib/adminApi";
import { deleteAdminUser, listAdminUsers } from "@/lib/adminUsers";
import { formatOrderDate } from "@/lib/orders";
import type { AdminUserListItemDto, PaginationDto } from "@/types/api";

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<AdminUserListItemDto["role"], string> = {
  USER: "Üye",
  ADMIN: "Yönetici",
};

export function AdminUserList() {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN" | "all">("all");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminUserListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserListItemDto | null>(null);

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
      const data = await listAdminUsers({
        page,
        limit: PAGE_SIZE,
        search,
        role,
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
  }, [page, role, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    const id = deleteTarget.id;
    setPendingId(id);
    setError("");
    setNotice("");
    try {
      await deleteAdminUser(id);
      setNotice(`${deleteTarget.name} silindi.`);
      setDeleteTarget(null);
      await load();
    } catch (caught) {
      setError(getAdminErrorMessage(caught));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <div>
        <p className="text-12 tracking-label text-taupe">Üyeler</p>
        <h1 className="mt-3 font-heading text-32 text-black">Kullanıcılar</h1>
        <p className="mt-3 max-w-xl text-14 text-taupe">
          Kayıtlı üyeleri görüntüleyin. Silinen hesabın siparişleri de kalkar.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1 text-12 tracking-label text-charcoal">
          Ara
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ad veya e-posta"
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          />
        </label>
        <label className="sm:w-56 text-12 tracking-label text-charcoal">
          Rol
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value as "USER" | "ADMIN" | "all");
              setPage(1);
            }}
            className="mt-2 h-12 w-full border border-border bg-ivory px-4 text-14"
          >
            <option value="all">Tümü</option>
            <option value="USER">Üye</option>
            <option value="ADMIN">Yönetici</option>
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
      ) : (
        <div className="mt-8 overflow-x-auto border border-border">
          <table className="min-w-[720px] w-full text-left text-14">
            <thead className="border-b border-border bg-off-white text-12 tracking-label text-taupe">
              <tr>
                <th className="px-4 py-3 font-normal">Ad</th>
                <th className="px-4 py-3 font-normal">E-posta</th>
                <th className="px-4 py-3 font-normal">Rol</th>
                <th className="px-4 py-3 font-normal">Doğrulama</th>
                <th className="px-4 py-3 font-normal">Sipariş</th>
                <th className="px-4 py-3 font-normal">Kayıt</th>
                <th className="px-4 py-3 font-normal">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="px-4 py-4 text-charcoal">
                    <Link href={`/admin/kullanicilar/${row.id}`} className="hover:text-black">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-taupe">{row.email}</td>
                  <td className="px-4 py-4">{ROLE_LABELS[row.role]}</td>
                  <td className="px-4 py-4">
                    {row.emailVerified ? "Doğrulandı" : "Bekliyor"}
                  </td>
                  <td className="px-4 py-4">{row.orderCount}</td>
                  <td className="px-4 py-4 text-taupe">
                    {formatOrderDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      disabled={!row.canDelete || pendingId === row.id}
                      onClick={() => setDeleteTarget(row)}
                      className="h-11 px-3 text-12 tracking-nav text-accent disabled:opacity-40"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="mt-6 flex items-center gap-3 text-14">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="h-11 px-4 text-12 tracking-nav text-charcoal disabled:opacity-40"
          >
            Önceki
          </button>
          <span className="text-taupe">
            {page} / {pagination.totalPages}
          </span>
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

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-user-title"
        >
          <div className="w-full max-w-md border border-border bg-ivory p-6 shadow-lg">
            <h2 id="delete-user-title" className="font-heading text-24 text-black">
              Kullanıcıyı sil
            </h2>
            <p className="mt-4 text-14 text-charcoal">
              <span className="font-medium">{deleteTarget.name}</span> (
              {deleteTarget.email}) hesabını silmek istediğinizden emin misiniz?
              Siparişleri de silinir. Bu işlem geri alınamaz.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={pendingId === deleteTarget.id}
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-11 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal disabled:opacity-50"
              >
                Hayır
              </button>
              <button
                type="button"
                disabled={pendingId === deleteTarget.id}
                onClick={() => void confirmDelete()}
                className="inline-flex h-11 items-center bg-accent px-6 text-12 tracking-nav text-ivory hover:bg-accent/90 disabled:opacity-50"
              >
                {pendingId === deleteTarget.id ? "Siliniyor…" : "Evet, sil"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
