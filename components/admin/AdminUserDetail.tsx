"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState } from "@/components/ui/ErrorState";
import { getAdminErrorMessage } from "@/lib/adminApi";
import { getAdminUser } from "@/lib/adminUsers";
import { formatOrderDate } from "@/lib/orders";
import type { AdminUserDetailDto } from "@/types/api";

export function AdminUserDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [user, setUser] = useState<AdminUserDetailDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }
    setLoading(true);
    void getAdminUser(id)
      .then((data) => {
        setUser(data);
        setError("");
      })
      .catch((caught) => {
        setUser(null);
        setError(getAdminErrorMessage(caught));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="text-12 tracking-label text-taupe">Yükleniyor</p>;
  }

  if (error || !user) {
    return <ErrorState message={error || "Kullanıcı bulunamadı"} />;
  }

  return (
    <div className="max-w-2xl">
      <p className="text-12 tracking-label text-taupe">Üye</p>
      <h1 className="mt-3 font-heading text-32 text-black">{user.name}</h1>
      <p className="mt-3 text-14 text-taupe">{user.email}</p>

      <dl className="mt-10 grid gap-5 text-14 sm:grid-cols-2">
        <div>
          <dt className="text-12 tracking-label text-taupe">Rol</dt>
          <dd className="mt-1 text-charcoal">{user.role === "ADMIN" ? "Yönetici" : "Üye"}</dd>
        </div>
        <div>
          <dt className="text-12 tracking-label text-taupe">Doğrulama</dt>
          <dd className="mt-1 text-charcoal">{user.emailVerified ? "Doğrulandı" : "Bekliyor"}</dd>
        </div>
        <div>
          <dt className="text-12 tracking-label text-taupe">Telefon</dt>
          <dd className="mt-1 text-charcoal">{user.phone || "Eklenmedi"}</dd>
        </div>
        <div>
          <dt className="text-12 tracking-label text-taupe">Sipariş</dt>
          <dd className="mt-1 text-charcoal">{user.orderCount}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-12 tracking-label text-taupe">{user.addressTitle || "Ev"}</dt>
          <dd className="mt-1 text-charcoal">
            {[user.addressLine, user.addressCity].filter(Boolean).join(", ") || "Adres eklenmedi"}
          </dd>
        </div>
        <div>
          <dt className="text-12 tracking-label text-taupe">Kayıt</dt>
          <dd className="mt-1 text-charcoal">{formatOrderDate(user.createdAt)}</dd>
        </div>
      </dl>

      <Link
        href="/admin/kullanicilar"
        className="mt-10 inline-flex h-12 items-center border border-charcoal px-6 text-12 tracking-nav text-charcoal"
      >
        Listeye dön
      </Link>
    </div>
  );
}
