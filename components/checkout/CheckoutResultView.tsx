"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/category/EmptyState";
import { CartSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { formatOrderNumber } from "@/lib/orders";
import {
  fetchOrder,
  fetchPayments,
  getShopErrorMessage,
} from "@/lib/shopApi";
import { formatPrice } from "@/lib/utils";
import type { OrderDto, PaymentDto } from "@/types/api";

const PAYMENT_LABELS: Record<PaymentDto["status"], string> = {
  PENDING: "Ödeme bekleniyor",
  PROCESSING: "Ödeme işleniyor",
  SUCCEEDED: "Ödeme alındı",
  FAILED: "Ödeme başarısız",
  CANCELLED: "Ödeme iptal",
  REFUNDED: "İade",
};

export function CheckoutResultView() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [payment, setPayment] = useState<PaymentDto | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isLoggedIn || !orderId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const [orderData, payments] = await Promise.all([
          fetchOrder(orderId),
          fetchPayments(orderId),
        ]);
        if (cancelled) {
          return;
        }
        setOrder(orderData);
        setPayment(payments[0] ?? null);
        setError("");
      } catch (caught) {
        if (!cancelled) {
          setError(getShopErrorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, orderId]);

  if (authLoading || loading) {
    return <CartSkeleton />;
  }

  if (!isLoggedIn) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Giriş gerekli"
            message="Ödeme durumunu görmek için giriş yapın."
            actionHref="/login"
            actionLabel="Giriş"
          />
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Ödeme durumu"
            message={error || "Sipariş bulunamadı."}
            actionHref="/hesabim"
            actionLabel="Hesabım"
          />
        </div>
      </section>
    );
  }

  const paid = order.status === "PAID" || payment?.status === "SUCCEEDED";

  return (
    <section className="bg-ivory px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-12 tracking-label text-taupe">Checkout</p>
        <h1 className="mt-3 font-heading text-32 text-black">
          {paid ? "Ödeme alındı" : "Ödeme bekleniyor"}
        </h1>
        <p className="mt-4 text-14 text-taupe">
          {paid
            ? "Siparişiniz doğrulanmış ödeme ile kaydedildi."
            : "Bu sayfa yalnızca durumu gösterir. Sipariş, ödeme sağlayıcısı onaylamadan ödenmiş sayılmaz."}
        </p>
        <p className="mt-6 font-heading text-24 text-black">
          {formatOrderNumber(order.id)}
        </p>
        <p className="mt-3 text-14 text-charcoal">
          {formatPrice(order.total)} · {payment ? PAYMENT_LABELS[payment.status] : order.status}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/siparislerim"
            className="inline-flex h-12 items-center justify-center bg-charcoal px-8 text-12 tracking-nav text-ivory transition-colors hover:bg-black"
          >
            Siparişlerim
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center border border-charcoal px-8 text-12 tracking-nav text-charcoal transition-colors hover:bg-charcoal hover:text-ivory"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </section>
  );
}
