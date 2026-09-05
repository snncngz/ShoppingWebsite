"use client";

import { useEffect, useState } from "react";

import { EmptyState } from "@/components/category/EmptyState";
import { ADMIN_ORDER_STATUS_LABELS, formatOrderDate, formatOrderNumber } from "@/lib/orders";
import { fetchOrders, getShopErrorMessage } from "@/lib/shopApi";
import { formatPrice } from "@/lib/utils";
import type { OrderDto } from "@/types/api";

export function OrderList() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchOrders()
      .then((data) => {
        setOrders(data);
        setError("");
      })
      .catch((caught) => {
        setOrders([]);
        setError(getShopErrorMessage(caught));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-12 tracking-label text-taupe">Yükleniyor</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState title="Siparişler yüklenemedi" message={error} />
        </div>
      </section>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Henüz siparişiniz yok"
            message="Tamamladığınız siparişler burada listelenir."
            actionHref="/"
            actionLabel="Alışverişe Devam Et"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-ivory px-6 py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-12 tracking-label text-taupe">Siparişler</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          Siparişlerim
        </h1>

        <ul className="mt-12 flex flex-col gap-4">
          {orders.map((order) => (
            <li key={order.id} className="border border-border bg-off-white px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-heading text-24 text-black">
                    {formatOrderNumber(order.id.slice(0, 8).toUpperCase())}
                  </span>
                  <span className="mt-1 block text-12 text-taupe">
                    {formatOrderDate(order.createdAt)}
                  </span>
                </span>
                <span className="text-12 tracking-label text-charcoal">
                  {ADMIN_ORDER_STATUS_LABELS[order.status]}
                </span>
              </div>
              <ul className="mt-4 flex flex-col gap-2 text-14 text-taupe">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.product.name}
                    {item.variant ? ` · ${item.variant}` : ""} × {item.quantity}
                  </li>
                ))}
              </ul>
              {order.giftWrap ? (
                <p className="mt-3 text-12 text-charcoal">Hediye paketi seçildi</p>
              ) : null}
              <p className="mt-3 text-14 text-black">{formatPrice(order.total)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
