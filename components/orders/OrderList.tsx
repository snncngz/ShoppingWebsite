"use client";

import { useState } from "react";

import { EmptyState } from "@/components/category/EmptyState";
import { OrderDetailModal } from "@/components/orders/OrderDetailModal";
import { demoOrders } from "@/data/orders";
import { formatOrderDate, formatOrderNumber, ORDER_STATUS_LABELS } from "@/lib/orders";
import type { Order } from "@/types";

export function OrderList() {
  const [selected, setSelected] = useState<Order | null>(null);

  if (demoOrders.length === 0) {
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
        <p className="text-12 tracking-label text-taupe">Orders</p>
        <h1 className="mt-3 font-heading text-32 text-black lg:text-48">
          Siparişlerim
        </h1>

        <ul className="mt-12 flex flex-col gap-4">
          {demoOrders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setSelected(order)}
                className="flex w-full items-center justify-between gap-4 border border-border bg-off-white px-6 py-5 text-left transition-colors hover:border-taupe"
              >
                <span>
                  <span className="block font-heading text-24 text-black">
                    {formatOrderNumber(order.id)}
                  </span>
                  <span className="mt-1 block text-12 text-taupe">
                    {formatOrderDate(order.createdAt)}
                  </span>
                </span>
                <span className="text-12 tracking-label text-charcoal">
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
