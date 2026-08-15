"use client";

import { demoOrders } from "@/data/orders";
import { formatOrderDate, formatOrderNumber, ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export function AdminOrderList() {
  return (
    <div>
      <p className="text-12 tracking-label text-taupe">Orders</p>
      <h1 className="mt-3 font-heading text-32 text-black">Siparişler</h1>
      <p className="mt-3 max-w-2xl text-14 text-taupe">
        Demo siparişler `data/orders.ts` kaynağından okunur. Bu fazda sipariş
        durumu değiştirilmez.
      </p>

      <ul className="mt-10 flex flex-col gap-4">
        {demoOrders.map((order) => (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-4 border border-border bg-off-white px-6 py-5"
          >
            <div>
              <p className="font-heading text-24 text-black">
                {formatOrderNumber(order.id)}
              </p>
              <p className="mt-1 text-12 text-taupe">
                {formatOrderDate(order.createdAt)} · {order.items.length} kalem
              </p>
            </div>
            <div className="text-right">
              <p className="text-12 tracking-label text-charcoal">
                {ORDER_STATUS_LABELS[order.status]}
              </p>
              <p className="mt-2 text-14 text-black">{formatPrice(order.total)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
